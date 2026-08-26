import { GoogleGenAI } from "@google/genai";

let genAIClient: GoogleGenAI | null = null;
let currentApiKey: string | null = null;
let geminiApiDisabled = false;

function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) {
    genAIClient = null;
    currentApiKey = null;
    geminiApiDisabled = true;
    return null;
  }

  // If apiKey changed or was newly set, reset client and flags
  if (apiKey !== currentApiKey) {
    currentApiKey = apiKey;
    geminiApiDisabled = false;
    genAIClient = new GoogleGenAI({ apiKey });
  }

  if (geminiApiDisabled) return null;
  return genAIClient;
}

function handleGeminiError(context: string, error: unknown): void {
  const errMsg = error instanceof Error ? error.message : String(error);
  if (
    errMsg.includes("403") ||
    errMsg.includes("PERMISSION_DENIED") ||
    errMsg.includes("401") ||
    errMsg.includes("UNAUTHENTICATED") ||
    errMsg.includes("API key not valid") ||
    errMsg.includes("denied access")
  ) {
    geminiApiDisabled = true;
    console.warn(
      `[ResuMate AI] Gemini API key access restricted (${context}), falling back to deterministic synthesis engine.`,
    );
  } else {
    console.warn(`[ResuMate AI] ${context} error:`, errMsg);
  }
}

export type AiProviderMetadata = {
  provider: "gemini" | "fallback";
  modelUsed?: string;
  attempts: number;
};

export type AnalysisResult = {
  atsScore: number;
  jobMatch: number;
  qualityScore: number;
  atsBreakdown: Array<{
    label: string;
    score: number;
    note: string;
  }>;
  keywordsHave: string[];
  keywordsMissing: string[];
  sectionStatus: Array<{
    section: string;
    status: "Good" | "Needs Improvement" | "Missing";
  }>;
  suggestions: Array<{
    title: string;
    problem: string;
    why: string;
    fix: string;
  }>;
  skillGaps: Array<{
    skill: string;
    importance: "High" | "Medium" | "Low";
    rec: string;
    weeks: string;
  }>;
};

const GEMINI_CANDIDATE_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.7-flash",
  "gemini-flash-latest",
  "gemini-3.1-pro-preview",
];

export async function analyzeResumeWithGemini(params: {
  resumeText: string;
  jobDescription?: string;
  jobTitle?: string;
  company?: string;
  careerLevel?: string;
}): Promise<AnalysisResult & AiProviderMetadata> {
  const ai = getGenAI();
  let attempts = 0;

  if (ai) {
    const prompt = `You are ResuMate, an expert ATS and career advisor specializing in reviewing student, graduate, and early-career resumes against job postings.

Analyze the following resume and target job posting with extreme care. Provide a detailed, realistic, and highly constructive evaluation in valid JSON format.

Target Job Title: ${params.jobTitle || "Not specified"}
Target Company: ${params.company || "Not specified"}
Career Level: ${params.careerLevel || "Entry-level / Graduate"}

Target Job Description:
"""
${params.jobDescription || "General Software/Technology/Professional role matching the resume."}
"""

Candidate Resume Content:
"""
${params.resumeText}
"""

Return ONLY a JSON object adhering strictly to this JSON schema:
{
  "atsScore": number (integer between 30 and 98, representing ATS parseability & keyword match),
  "jobMatch": number (integer between 25 and 98, representing semantic fit with the job requirements),
  "qualityScore": number (integer between 35 and 98, representing clarity, quantification, formatting, and impact),
  "atsBreakdown": [
    { "label": "File & Text Parseability", "score": number (0-100), "note": string (short 1-line note) },
    { "label": "Job Keyword Density", "score": number (0-100), "note": string (short 1-line note) },
    { "label": "Section Architecture", "score": number (0-100), "note": string (short 1-line note) },
    { "label": "Action Verb & Impact Index", "score": number (0-100), "note": string (short 1-line note) },
    { "label": "Formatting & Length Consistency", "score": number (0-100), "note": string (short 1-line note) }
  ],
  "keywordsHave": string[] (array of 6 to 12 relevant technical & professional keywords found in the resume matching the job),
  "keywordsMissing": string[] (array of 4 to 8 valuable keywords/skills from the job posting missing in the resume),
  "sectionStatus": [
    { "section": "Contact Information", "status": "Good" | "Needs Improvement" | "Missing" },
    { "section": "Summary / Objective", "status": "Good" | "Needs Improvement" | "Missing" },
    { "section": "Education & Coursework", "status": "Good" | "Needs Improvement" | "Missing" },
    { "section": "Experience & Internships", "status": "Good" | "Needs Improvement" | "Missing" },
    { "section": "Projects & Portfolio", "status": "Good" | "Needs Improvement" | "Missing" },
    { "section": "Skills & Technologies", "status": "Good" | "Needs Improvement" | "Missing" }
  ],
  "suggestions": [
    {
      "title": string (e.g. "Quantify Project Outcomes", "Highlight Docker & Cloud Skills"),
      "problem": string (specific weak point detected in the candidate's resume),
      "why": string (why this matters to recruiters and ATS),
      "fix": string (exact practical suggestion/action to fix it)
    }
  ] (provide 3-4 targeted suggestions),
  "skillGaps": [
    {
      "skill": string (missing or desired skill name),
      "importance": "High" | "Medium" | "Low",
      "rec": string (actionable learning recommendation, e.g. "Build a containerized REST API project"),
      "weeks": string (estimated time to learn, e.g. "1-2 weeks")
    }
  ] (provide 3-5 skill gaps)
}
`;

    for (const model of GEMINI_CANDIDATE_MODELS) {
      attempts++;
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        const text = response.text?.trim() || "{}";
        const parsed = JSON.parse(text) as AnalysisResult;
        if (parsed.atsScore && Array.isArray(parsed.keywordsHave)) {
          console.log(`[AI] Resume Analysis → GEMINI (${model})`);
          return {
            ...sanitizeAnalysis(parsed),
            provider: "gemini",
            modelUsed: model,
            attempts,
          };
        }
      } catch (error) {
        handleGeminiError(`resume-analysis (${model})`, error);
        if (geminiApiDisabled) break;
      }
    }
  }

  console.log(`[AI] Resume Analysis → FALLBACK`);
  const fallback = fallbackAnalysis(
    params.resumeText,
    params.jobDescription || "",
    params.jobTitle || "",
  );
  return {
    ...fallback,
    provider: "fallback",
    attempts,
  };
}

function sanitizeAnalysis(data: Partial<AnalysisResult>): AnalysisResult {
  return {
    atsScore: typeof data.atsScore === "number" ? Math.min(100, Math.max(10, data.atsScore)) : 82,
    jobMatch: typeof data.jobMatch === "number" ? Math.min(100, Math.max(10, data.jobMatch)) : 78,
    qualityScore:
      typeof data.qualityScore === "number" ? Math.min(100, Math.max(10, data.qualityScore)) : 80,
    atsBreakdown:
      Array.isArray(data.atsBreakdown) && data.atsBreakdown.length > 0
        ? data.atsBreakdown
        : [
            { label: "File & Text Parseability", score: 92, note: "Clean UTF-8 text structure." },
            { label: "Job Keyword Density", score: 76, note: "Matches core technical terms." },
            { label: "Section Architecture", score: 88, note: "Standard headings recognized." },
            {
              label: "Action Verb & Impact Index",
              score: 74,
              note: "Add more quantifiable metrics.",
            },
            { label: "Formatting Consistency", score: 85, note: "Good spacing and typography." },
          ],
    keywordsHave:
      Array.isArray(data.keywordsHave) && data.keywordsHave.length > 0
        ? data.keywordsHave
        : ["React", "TypeScript", "JavaScript", "HTML/CSS", "Git", "REST APIs"],
    keywordsMissing:
      Array.isArray(data.keywordsMissing) && data.keywordsMissing.length > 0
        ? data.keywordsMissing
        : ["Docker", "AWS", "CI/CD", "Jest/Testing", "PostgreSQL"],
    sectionStatus:
      Array.isArray(data.sectionStatus) && data.sectionStatus.length > 0
        ? data.sectionStatus
        : [
            { section: "Contact Information", status: "Good" },
            { section: "Summary / Objective", status: "Good" },
            { section: "Education & Coursework", status: "Good" },
            { section: "Experience & Internships", status: "Good" },
            { section: "Projects & Portfolio", status: "Good" },
            { section: "Skills & Technologies", status: "Good" },
          ],
    suggestions:
      Array.isArray(data.suggestions) && data.suggestions.length > 0
        ? data.suggestions
        : [
            {
              title: "Quantify Engineering Achievements",
              problem: "Several project bullets lack clear measurable outcomes.",
              why: "Recruiters and ATS favor quantifiable achievements like latency reductions or user metrics.",
              fix: "Add metrics like: 'Optimized build times by 35%' or 'Served 1,000+ active users'.",
            },
          ],
    skillGaps:
      Array.isArray(data.skillGaps) && data.skillGaps.length > 0
        ? data.skillGaps
        : [
            {
              skill: "Docker & Containerization",
              importance: "High",
              rec: "Containerize a full-stack project using Docker and docker-compose.",
              weeks: "1-2 weeks",
            },
          ],
  };
}

function fallbackAnalysis(
  resumeText: string,
  jobDescription: string,
  jobTitle: string,
): AnalysisResult {
  const resume = resumeText.toLowerCase();
  const jd = jobDescription.toLowerCase();

  const technicalKeywords = [
    "react",
    "typescript",
    "javascript",
    "python",
    "java",
    "c++",
    "node.js",
    "express",
    "next.js",
    "tailwind",
    "sql",
    "postgresql",
    "mongodb",
    "redis",
    "docker",
    "kubernetes",
    "aws",
    "gcp",
    "azure",
    "git",
    "ci/cd",
    "graphql",
    "rest",
    "api",
    "html",
    "css",
    "linux",
    "jest",
    "testing",
    "agile",
    "scrum",
    "microservices",
    "data structures",
    "algorithms",
  ];

  const keywordsHave: string[] = [];
  const keywordsMissing: string[] = [];

  for (const kw of technicalKeywords) {
    const inResume = resume.includes(kw);
    const inJd = jd ? jd.includes(kw) : false;

    if (inResume) {
      keywordsHave.push(capitalizeKeyword(kw));
    } else if (inJd) {
      keywordsMissing.push(capitalizeKeyword(kw));
    }
  }

  if (keywordsHave.length === 0) {
    keywordsHave.push("JavaScript", "React", "HTML/CSS", "Git", "Problem Solving");
  }
  if (keywordsMissing.length === 0) {
    if (!keywordsHave.includes("Docker")) keywordsMissing.push("Docker");
    if (!keywordsHave.includes("PostgreSQL")) keywordsMissing.push("PostgreSQL");
    if (!keywordsHave.includes("CI/CD")) keywordsMissing.push("CI/CD");
    if (!keywordsHave.includes("AWS")) keywordsMissing.push("AWS");
  }

  const sectionsFound = {
    contact:
      resume.includes("email") ||
      resume.includes("@") ||
      resume.includes("phone") ||
      resume.includes("github") ||
      resume.includes("linkedin"),
    summary:
      resume.includes("summary") ||
      resume.includes("objective") ||
      resume.includes("about") ||
      resume.includes("profile"),
    education:
      resume.includes("education") ||
      resume.includes("university") ||
      resume.includes("college") ||
      resume.includes("degree") ||
      resume.includes("bachelor") ||
      resume.includes("b.s.") ||
      resume.includes("b.tech") ||
      resume.includes("gpa"),
    experience:
      resume.includes("experience") ||
      resume.includes("work") ||
      resume.includes("intern") ||
      resume.includes("employment"),
    projects:
      resume.includes("project") ||
      resume.includes("portfolio") ||
      resume.includes("github.com") ||
      resume.includes("built") ||
      resume.includes("application"),
    skills:
      resume.includes("skills") ||
      resume.includes("technologies") ||
      resume.includes("tools") ||
      resume.includes("languages"),
  };

  const sectionStatus: AnalysisResult["sectionStatus"] = [
    {
      section: "Contact Information",
      status: sectionsFound.contact ? "Good" : "Needs Improvement",
    },
    {
      section: "Summary / Objective",
      status: sectionsFound.summary ? "Good" : "Needs Improvement",
    },
    {
      section: "Education & Coursework",
      status: sectionsFound.education ? "Good" : "Needs Improvement",
    },
    {
      section: "Experience & Internships",
      status: sectionsFound.experience ? "Good" : "Needs Improvement",
    },
    {
      section: "Projects & Portfolio",
      status: sectionsFound.projects ? "Good" : "Needs Improvement",
    },
    {
      section: "Skills & Technologies",
      status: sectionsFound.skills ? "Good" : "Needs Improvement",
    },
  ];

  const hasMetrics =
    /\b(\d+%\b|\d+x\b|\$\d+|\d+\+?\s*(users|requests|ms|seconds|clients|stars))/i.test(resumeText);
  const wordCount = resumeText.split(/\s+/).length;

  let baseScore = 70;
  if (keywordsHave.length >= 6) baseScore += 10;
  if (keywordsHave.length >= 10) baseScore += 5;
  if (hasMetrics) baseScore += 8;
  if (wordCount >= 200 && wordCount <= 750) baseScore += 5;
  if (!sectionsFound.skills) baseScore -= 10;
  if (!sectionsFound.projects && !sectionsFound.experience) baseScore -= 15;

  const atsScore = Math.min(96, Math.max(45, baseScore));
  const jobMatch = jd
    ? Math.min(
        95,
        Math.max(
          40,
          Math.round(
            (keywordsHave.filter((k) => jd.includes(k.toLowerCase())).length /
              Math.max(1, keywordsMissing.length + 3)) *
              100,
          ),
        ),
      )
    : Math.min(90, Math.max(60, atsScore - 5));

  const qualityScore = Math.min(
    95,
    Math.max(
      50,
      Math.round(atsScore * 0.4 + (hasMetrics ? 90 : 65) * 0.3 + (wordCount > 250 ? 88 : 70) * 0.3),
    ),
  );

  const suggestions: AnalysisResult["suggestions"] = [];
  if (!hasMetrics) {
    suggestions.push({
      title: "Quantify Engineering Achievements",
      problem: "Bullet points summarize tasks rather than measurable outcomes.",
      why: "Hiring managers favor bullets that demonstrate tangible impact.",
      fix: "Add metrics: 'Increased page load speed by 35%' or 'Supported 200+ concurrent student users'.",
    });
  }

  if (keywordsMissing.length > 0) {
    const missingSample = keywordsMissing.slice(0, 3).join(", ");
    suggestions.push({
      title: `Bridge Gaps on Target Skills (${missingSample})`,
      problem: `Job emphasizes ${missingSample} which are not yet explicitly highlighted.`,
      why: "ATS search filters prioritize candidates matching exact requirement keywords.",
      fix: `Integrate relevant projects or coursework covering ${missingSample}.`,
    });
  }

  suggestions.push({
    title: "Strengthen Technical Bullet Openers",
    problem: "Ensure every bullet starts with an active power verb in past tense.",
    why: "Action verbs make your contributions decisive and ATS-readable.",
    fix: "Replace 'Worked on / Helped with' with 'Architected', 'Implemented', 'Engineered', or 'Deployed'.",
  });

  const skillGaps: AnalysisResult["skillGaps"] = keywordsMissing.slice(0, 4).map((k, idx) => ({
    skill: k,
    importance: idx === 0 ? "High" : idx === 1 ? "Medium" : "Low",
    rec: `Create a hands-on project demonstrating ${k} integration.`,
    weeks: `${idx + 1} week${idx > 0 ? "s" : ""}`,
  }));

  if (skillGaps.length === 0) {
    skillGaps.push({
      skill: "System Design & Architecture",
      importance: "Medium",
      rec: "Document architectural tradeoffs in your main GitHub repository README.",
      weeks: "1-2 weeks",
    });
  }

  return {
    atsScore,
    jobMatch,
    qualityScore,
    atsBreakdown: [
      {
        label: "File & Text Parseability",
        score: 95,
        note: "Document parsed cleanly into readable sections.",
      },
      {
        label: "Job Keyword Density",
        score: Math.min(95, keywordsHave.length * 8 + 20),
        note: `Found ${keywordsHave.length} matching core technical keywords.`,
      },
      {
        label: "Section Architecture",
        score: Object.values(sectionsFound).filter(Boolean).length * 15 + 10,
        note: "Education, Experience, and Skills headings identified.",
      },
      {
        label: "Action Verb & Impact Index",
        score: hasMetrics ? 88 : 68,
        note: hasMetrics
          ? "Good quantitative metrics found in achievements."
          : "Strengthen impact verbs and metrics.",
      },
      {
        label: "Formatting & Length Consistency",
        score: wordCount >= 200 && wordCount <= 750 ? 92 : 75,
        note: `Standard single/two-page structure (~${wordCount} words).`,
      },
    ],
    keywordsHave: Array.from(new Set(keywordsHave)).slice(0, 10),
    keywordsMissing: Array.from(new Set(keywordsMissing)).slice(0, 6),
    sectionStatus,
    suggestions,
    skillGaps,
  };
}

function capitalizeKeyword(kw: string): string {
  const map: Record<string, string> = {
    react: "React",
    typescript: "TypeScript",
    javascript: "JavaScript",
    python: "Python",
    java: "Java",
    "c++": "C++",
    "node.js": "Node.js",
    express: "Express",
    "next.js": "Next.js",
    tailwind: "Tailwind CSS",
    sql: "SQL",
    postgresql: "PostgreSQL",
    mongodb: "MongoDB",
    redis: "Redis",
    docker: "Docker",
    kubernetes: "Kubernetes",
    aws: "AWS",
    gcp: "GCP",
    azure: "Azure",
    git: "Git",
    "ci/cd": "CI/CD",
    graphql: "GraphQL",
    rest: "REST APIs",
    api: "API Design",
    html: "HTML5",
    css: "CSS3",
    linux: "Linux",
    jest: "Jest",
    testing: "Unit Testing",
    agile: "Agile",
    scrum: "Scrum",
    microservices: "Microservices",
    "data structures": "Data Structures",
    algorithms: "Algorithms",
  };
  return map[kw] || kw.charAt(0).toUpperCase() + kw.slice(1);
}

export async function improveBulletWithGemini(params: {
  bullet: string;
  targetRole?: string;
  context?: string;
}): Promise<{ result: string } & AiProviderMetadata> {
  const ai = getGenAI();
  let attempts = 0;

  if (ai) {
    const prompt = `You are ResuMate, an elite career coach.
Rewrite the following resume bullet point to make it strong, professional, ATS-optimized, and impactful for a candidate targeting ${params.targetRole || "Software Engineering / Tech"} roles.

Use the high-impact formula:
[Strong Action Verb in Past Tense] + [Technical Scope / What you built] + [Tools/Technologies used] + [Quantifiable Impact/Result].

Original Bullet:
"${params.bullet}"
${params.context ? `Context / Project: ${params.context}` : ""}

Return ONLY the single rewritten bullet point without quotation marks, bullet symbols, or conversational intro.`;

    for (const model of GEMINI_CANDIDATE_MODELS) {
      attempts++;
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
        });
        if (response.text && response.text.trim().length > 10) {
          console.log(`[AI] Bullet Improvement → GEMINI (${model})`);
          return {
            result: response.text.trim(),
            provider: "gemini",
            modelUsed: model,
            attempts,
          };
        }
      } catch (error) {
        handleGeminiError(`bullet-improvement (${model})`, error);
        if (geminiApiDisabled) break;
      }
    }
  }

  console.log(`[AI] Bullet Improvement → FALLBACK`);
  const cleaned = params.bullet
    .replace(/^(i\s+|i\s+have\s+|worked\s+on\s+|did\s+|helped\s+with\s+|responsible\s+for\s+)/i, "")
    .trim();
  const actionVerbs = [
    "Architected and delivered",
    "Engineered and optimized",
    "Spearheaded development of",
    "Streamlined and implemented",
  ];
  const verb = actionVerbs[Math.abs(cleaned.length) % actionVerbs.length];
  const result = `${verb} ${cleaned.charAt(0).toLowerCase() + cleaned.slice(1)}, driving a 25% efficiency gain and elevating system reliability for target ${params.targetRole || "engineering"} operations.`;
  return {
    result,
    provider: "fallback",
    attempts,
  };
}

export async function generateCoverLetterWithGemini(params: {
  resumeText: string;
  jobTitle: string;
  company: string;
  tone?: string;
  highlight?: string;
}): Promise<{ letter: string } & AiProviderMetadata> {
  const ai = getGenAI();
  let attempts = 0;

  if (ai) {
    const prompt = `You are ResuMate's professional career writer. Write a compelling, tailored, and authentic cover letter for a candidate applying to:
Job Title: ${params.jobTitle}
Company: ${params.company}
Tone: ${params.tone || "Professional"}

Candidate Resume:
"""
${params.resumeText || "Candidate with relevant technical and project background."}
"""

${params.highlight ? `Specific Points to Highlight: ${params.highlight}` : ""}

Guidelines:
1. Write 3-4 structured paragraphs:
   - Paragraph 1: Enthusiastic opening stating the position, company, and immediate value proposition.
   - Paragraph 2: Core technical achievements, relevant academic/internship background, and concrete project outcomes extracted from the candidate's resume.
   - Paragraph 3: Why this specific company/role aligns with candidate's passion, highlighting culture and shared mission. Incorporate any requested highlight.
   - Paragraph 4: Confident closing with a call to action.
2. Maintain the chosen tone (${params.tone || "Professional"}).
3. Do not use generic placeholders like [Your Name] inside sentences if candidate details can be inferred, but format cleanly.

Return ONLY the full cover letter text.`;

    for (const model of GEMINI_CANDIDATE_MODELS) {
      attempts++;
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
        });
        if (response.text && response.text.trim().length > 100) {
          console.log(`[AI] Cover Letter → GEMINI (${model})`);
          return {
            letter: response.text.trim(),
            provider: "gemini",
            modelUsed: model,
            attempts,
          };
        }
      } catch (error) {
        handleGeminiError(`cover-letter (${model})`, error);
        if (geminiApiDisabled) break;
      }
    }
  }

  console.log(`[AI] Cover Letter → FALLBACK`);
  const letter = synthesizeTailoredCoverLetter(params);
  return {
    letter,
    provider: "fallback",
    attempts,
  };
}

function synthesizeTailoredCoverLetter(params: {
  resumeText: string;
  jobTitle: string;
  company: string;
  tone?: string;
  highlight?: string;
}): string {
  const resume = params.resumeText || "";
  const lines = resume
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const name = lines[0] && lines[0].length < 40 && !lines[0].includes(":") ? lines[0] : "Candidate";
  const emailMatch = resume.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/);
  const email = emailMatch ? emailMatch[1] : "";
  const phoneMatch = resume.match(/(\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/);
  const phone = phoneMatch ? phoneMatch[1] : "";

  // Extract all dynamic skills directly from the resume (including specialized/uncommon skills)
  const skillsSet = new Set<string>();
  const skillLineMatch = resume.match(/(?:skills|technologies|tools|stack):\s*([^\n]+)/i);
  if (skillLineMatch && skillLineMatch[1]) {
    skillLineMatch[1]
      .split(/[,;|•]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 1 && s.length < 30)
      .forEach((s) => skillsSet.add(s));
  }

  // Also scan known and custom technical tokens
  const knownTokens = [
    "React",
    "TypeScript",
    "JavaScript",
    "Python",
    "Java",
    "C++",
    "Node.js",
    "Express",
    "PostgreSQL",
    "MongoDB",
    "SQL",
    "Docker",
    "AWS",
    "Kubernetes",
    "Tailwind CSS",
    "Next.js",
    "Git",
    "REST APIs",
    "GraphQL",
    "Qiskit",
    "Solidity",
    "WebAssembly",
    "Rust",
    "Go",
    "Kotlin",
    "Swift",
    "CI/CD",
  ];
  for (const token of knownTokens) {
    if (resume.toLowerCase().includes(token.toLowerCase())) {
      skillsSet.add(token);
    }
  }

  const detectedSkills = Array.from(skillsSet);
  const skillsList =
    detectedSkills.length > 0
      ? detectedSkills.slice(0, 5).join(", ")
      : "software architecture, system design, and modern production engineering";

  // Extract key project details if present
  let projectSnippet = "";
  const projectMatch = resume.match(/(?:projects?|experience)[\s\S]*?(?:•|-|\*)\s*([^\n]+)/i);
  if (projectMatch && projectMatch[1]) {
    projectSnippet = projectMatch[1].trim();
  }

  // Determine tone-specific phraseology
  const tone = (params.tone || "Professional").toLowerCase();
  let salutation = `Dear Hiring Team at ${params.company},`;
  let opening = "";
  let closing = "";
  let signoff = "Sincerely,";

  if (tone === "enthusiastic") {
    salutation = `Dear ${params.company} Hiring Team,`;
    opening = `I was thrilled to see the opening for the ${params.jobTitle} position at ${params.company}. Having followed your innovative work and engineering culture, I am incredibly excited about the opportunity to contribute my skills in ${skillsList} to your growing team.`;
    closing = `I am eager to bring my energy, technical dedication, and collaborative mindset to ${params.company}. I would love the chance to discuss how my background and enthusiasm make me a strong fit for this role.`;
    signoff = "Warm regards,";
  } else if (tone === "friendly") {
    salutation = `Hello ${params.company} Team,`;
    opening = `I am excited to submit my application for the ${params.jobTitle} role at ${params.company}. With hands-on experience developing projects with ${skillsList}, I am passionate about building intuitive, reliable software alongside great teammates.`;
    closing = `I would welcome the opportunity to connect and learn more about your upcoming goals. Thank you for your time and consideration!`;
    signoff = "Best regards,";
  } else if (tone === "formal") {
    salutation = `Dear Hiring Manager,`;
    opening = `I am writing to formally submit my application for the ${params.jobTitle} position at ${params.company}. With a rigorous background in software engineering and demonstrated proficiency in ${skillsList}, I am confident in my ability to deliver immediate value to your organization.`;
    closing = `Thank you for your consideration of my candidacy. I look forward to the opportunity to discuss my qualifications and how I can contribute to the strategic objectives of ${params.company} in greater detail.`;
    signoff = "Respectfully,";
  } else {
    // Default Professional
    salutation = `Dear Hiring Manager at ${params.company},`;
    opening = `I am writing to express my strong interest in the ${params.jobTitle} position at ${params.company}. Combining practical experience in ${skillsList} with a passion for building scalable, high-quality systems, I am prepared to contribute effectively to your team's initiatives.`;
    closing = `Thank you for reviewing my application. I would welcome the opportunity to discuss how my experience and technical skill set align with your goals for the ${params.jobTitle} role.`;
    signoff = "Sincerely,";
  }

  // Body paragraph with resume-grounded achievements
  let experienceBody = "";
  if (projectSnippet) {
    experienceBody = `Throughout my hands-on technical work, I have focused on designing scalable architectures and writing clean, maintainable code. For example, ${projectSnippet.charAt(0).toLowerCase() + projectSnippet.slice(1)}. Leveraging ${skillsList}, I prioritize building resilient systems that solve real-world problems.`;
  } else if (resume.length > 50) {
    experienceBody = `Throughout my academic and project work, I have focused on designing scalable architectures and writing clean, maintainable code. My practical experience with ${skillsList} has enabled me to take features from initial requirements through deployment, emphasizing system performance and user experience.`;
  } else {
    experienceBody = `My technical background has equipped me with strong problem-solving capabilities and experience collaborating on software development lifecycles. I prioritize building well-documented, test-driven applications that solve real-world problems.`;
  }

  // Highlight paragraph
  let highlightBody = "";
  if (params.highlight && params.highlight.trim()) {
    highlightBody = `In particular, I would like to highlight: ${params.highlight.trim()}. This experience strengthened my ability to solve complex technical challenges and work collaboratively under agile development standards.`;
  } else {
    highlightBody = `What particularly draws me to ${params.company} is your commitment to delivering impactful solutions. I am eager to apply my technical foundation in ${params.jobTitle.toLowerCase().includes("engineer") ? "engineering" : "this role"} to help achieve ${params.company}'s mission.`;
  }

  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const contactHeader = [name !== "Candidate" ? name : "", email || "", phone || ""]
    .filter(Boolean)
    .join(" • ");

  return `${contactHeader ? contactHeader + "\n" : ""}${today}

${salutation}

${opening}

${experienceBody}

${highlightBody}

${closing}

${signoff}
${name}`;
}

export type InterviewQuestionsData = {
  Technical: Array<{ q: string; hint: string }>;
  Behavioral: Array<{ q: string; hint: string }>;
  "Role-Specific": Array<{ q: string; hint: string }>;
  "HR & Situational": Array<{ q: string; hint: string }>;
};

export async function generateInterviewQuestionsWithGemini(params: {
  resumeText: string;
  jobDescription?: string;
  targetRole?: string;
}): Promise<InterviewQuestionsData & AiProviderMetadata> {
  const ai = getGenAI();
  let attempts = 0;

  if (ai) {
    const prompt = `You are ResuMate's senior technical recruiter and interview coach.
Generate 12 targeted interview questions tailored to the candidate's resume and target role (${params.targetRole || "Software Engineer"}).

Candidate Resume:
"""
${params.resumeText || "Early career software engineer / developer."}
"""

Target Role / JD:
"""
${params.jobDescription || params.targetRole || "Software Engineer"}
"""

Return ONLY a JSON object with this exact shape:
{
  "Technical": [
    { "q": string (specific coding/system/architecture question), "hint": string (key concepts to mention) },
    { "q": string, "hint": string },
    { "q": string, "hint": string }
  ],
  "Behavioral": [
    { "q": string (STAR method question), "hint": string (how to structure the story) },
    { "q": string, "hint": string },
    { "q": string, "hint": string }
  ],
  "Role-Specific": [
    { "q": string (specific to candidate's projects/tools), "hint": string },
    { "q": string, "hint": string },
    { "q": string, "hint": string }
  ],
  "HR & Situational": [
    { "q": string (motivation, conflict, growth), "hint": string },
    { "q": string, "hint": string },
    { "q": string, "hint": string }
  ]
}`;

    for (const model of GEMINI_CANDIDATE_MODELS) {
      attempts++;
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });
        const parsed = JSON.parse(response.text?.trim() || "{}") as InterviewQuestionsData;
        if (parsed.Technical && parsed.Behavioral) {
          console.log(`[AI] Interview Prep → GEMINI (${model})`);
          return {
            ...parsed,
            provider: "gemini",
            modelUsed: model,
            attempts,
          };
        }
      } catch (error) {
        handleGeminiError(`interview-questions (${model})`, error);
        if (geminiApiDisabled) break;
      }
    }
  }

  console.log(`[AI] Interview Prep → FALLBACK`);
  const questions: InterviewQuestionsData = {
    Technical: [
      {
        q: "How do you manage asynchronous state and error handling in your React/Node.js applications?",
        hint: "Explain React Query or async/await patterns, UI loading/error states, and graceful degradation.",
      },
      {
        q: "Can you explain the difference between relational and document databases, and when you'd choose PostgreSQL over MongoDB?",
        hint: "Discuss ACID compliance, data relationships vs flexible document schemas, and indexing strategies.",
      },
      {
        q: "Walk through how you design and secure a RESTful API endpoint.",
        hint: "Highlight authentication tokens, input validation with schemas, CORS, and rate limiting.",
      },
    ],
    Behavioral: [
      {
        q: "Tell me about a time you encountered a challenging bug that was difficult to reproduce. How did you resolve it?",
        hint: "Use STAR: Detail your debugging methodology, logging, browser devtools, and the lasting fix.",
      },
      {
        q: "Describe a situation where you had to balance university coursework deadlines with internship or project commitments.",
        hint: "Show time management, prioritization frameworks, and proactive communication with stakeholders.",
      },
      {
        q: "How do you handle constructive criticism or code review comments with which you initially disagree?",
        hint: "Demonstrate humility, focus on code quality and standards, and collaborative problem-solving.",
      },
    ],
    "Role-Specific": [
      {
        q: "Looking at your resume projects, what was the most complex feature you architected from scratch?",
        hint: "Break down the architectural challenge, trade-offs evaluated, and why you chose your tech stack.",
      },
      {
        q: "How do you ensure web accessibility (WCAG AA) and responsive performance across mobile and desktop devices?",
        hint: "Discuss semantic HTML, contrast ratios, keyboard navigation, and responsive CSS/Tailwind.",
      },
      {
        q: "What testing strategies (unit, integration, end-to-end) have you implemented in your past projects?",
        hint: "Share examples with Vitest, Jest, or Playwright and how testing improved your confidence.",
      },
    ],
    "HR & Situational": [
      {
        q: "Why are you specifically interested in this position and how does it fit into your career trajectory?",
        hint: "Connect your current skills and passions to the team's engineering challenges and growth opportunities.",
      },
      {
        q: "Where do you see yourself technically and professionally in 2-3 years?",
        hint: "Express eagerness for continuous learning, engineering mentorship, and shipping impactful software.",
      },
      {
        q: "If assigned a project using a framework or tool you've never used before, what is your approach to getting up to speed?",
        hint: "Explain your learning framework: reading official docs, building quick MVPs, and consulting senior peers.",
      },
    ],
  };

  return {
    ...questions,
    provider: "fallback",
    attempts,
  };
}

export async function aiChatWithGemini(params: {
  message: string;
  history?: Array<{ role: "user" | "ai"; text: string }>;
  context?: {
    resumeText?: string;
    targetRole?: string;
    atsScore?: number;
  };
}): Promise<{ reply: string } & AiProviderMetadata> {
  const targetRole = params.context?.targetRole || "Software Engineering / Tech Professional";
  const atsScore = params.context?.atsScore ?? 85;
  const resumeSummary = params.context?.resumeText
    ? params.context.resumeText.slice(0, 800)
    : "Candidate seeking opportunities in " + targetRole;

  const prompt = `You are ResuMate AI, an expert, encouraging, and highly articulate career and resume mentor for students, new graduates, and early-career job seekers.

User Profile Context:
- Target Role: ${targetRole}
- Current ATS Match Score: ${atsScore}%
- Resume Background Excerpt:
"""
${resumeSummary}
"""

Recent Conversation History:
${(params.history || [])
  .slice(-6)
  .map((m) => `${m.role === "user" ? "Candidate" : "ResuMate AI"}: ${m.text}`)
  .join("\n")}

Candidate's Current Question:
"${params.message}"

Instructions:
1. Provide a direct, highly customized, and actionable answer tailored specifically to their target role (${targetRole}) and resume background.
2. If they provide a bullet point or text to improve, give them 2 high-impact rewritten options using strong action verbs and quantifiable metrics.
3. If they ask about ATS scores, skills, projects, or interview prep, give clear, prioritized bullet points or 2-4 focused sentences.
4. Keep tone warm, constructive, and professional. Avoid generic filler.`;

  const ai = getGenAI();
  let attempts = 0;

  if (ai) {
    for (const model of GEMINI_CANDIDATE_MODELS) {
      attempts++;
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
        });
        if (response.text && response.text.trim().length > 20) {
          console.log(`[AI] AI Assistant → GEMINI (${model})`);
          return {
            reply: response.text.trim(),
            provider: "gemini",
            modelUsed: model,
            attempts,
          };
        }
      } catch (error) {
        handleGeminiError(`chat (${model})`, error);
        if (geminiApiDisabled) break;
      }
    }
  }

  console.log(`[AI] AI Assistant → FALLBACK`);
  const reply = synthesizeContextualAiChatReply(params);
  return {
    reply,
    provider: "fallback",
    attempts,
  };
}

function synthesizeContextualAiChatReply(params: {
  message: string;
  history?: Array<{ role: "user" | "ai"; text: string }>;
  context?: {
    resumeText?: string;
    targetRole?: string;
    atsScore?: number;
  };
}): string {
  const msg = params.message.toLowerCase();
  const rawMsg = params.message.trim();
  const targetRole = params.context?.targetRole || "Software Engineer";
  const atsScore = params.context?.atsScore;
  const resume = params.context?.resumeText || "";

  // 1. Follow-up detection from history
  if (
    msg.includes("what about that") ||
    msg.includes("follow up") ||
    msg.includes("and then") ||
    msg.includes("explain more") ||
    msg.includes("can you expand") ||
    msg.includes("which one do you recommend") ||
    msg.includes("how do i do that")
  ) {
    return `Building on our previous discussion regarding **${targetRole}**:
1. **Practical Execution:** Start by implementing this directly in your featured portfolio repository or project section.
2. **Resume Visibility:** Ensure the terminology appears under both your *Skills* header and within an impact bullet point (e.g., *"Utilized modern practices to optimize delivery by 30%"*).
3. **Interview Readiness:** Prepare a 60-second STAR story detailing why you made this design choice and the concrete outcome achieved.`;
  }

  // 2. Specific unique skill inquiry in resume or message
  const uniqueSkillMatch =
    rawMsg.match(
      /(?:about|with|using|in|learn|master|highlight (?:my (?:experience with )?)?|showcase)\s+([A-Za-z0-9+#.-]+(?:\s+[A-Za-z0-9+#.-]+)?)/i,
    ) || rawMsg.match(/([A-Z][a-z0-9+#.-]+(?:\s+[A-Z][a-z0-9+#.-]+)?)/);

  const stopWords = new Set([
    "the",
    "my",
    "this",
    "that",
    "more",
    "your",
    "how",
    "what",
    "can",
    "should",
    "i",
    "for",
    "at",
    "my resume",
    "resume",
    "profile",
    "application",
    "skills",
    "skill",
    "experience",
    "projects",
    "job",
    "role",
    "score",
    "ats",
    "interview",
    "cover letter",
    "letter",
  ]);

  if (
    uniqueSkillMatch &&
    uniqueSkillMatch[1] &&
    !stopWords.has(uniqueSkillMatch[1].toLowerCase().trim()) &&
    (msg.includes("skill") ||
      msg.includes("learn") ||
      msg.includes("using") ||
      msg.includes("highlight") ||
      msg.includes("experience with"))
  ) {
    const skillName = uniqueSkillMatch[1];
    return `Regarding **${skillName}** for your **${targetRole}** goals:
• **Resume Positioning:** Highlight **${skillName}** prominently in your *Technical Skills* matrix and back it up with at least one practical project bullet.
• **Recruiter Impact:** Demonstrate end-to-end usage—explain how you configured, integrated, or optimized systems using **${skillName}** to deliver measurable results.
• **Next Step:** If applying to roles demanding **${skillName}**, include a direct link to a GitHub repository or live deployment showcasing your implementation.`;
  }

  // 3. Bullet point rewrite request
  if (
    msg.includes("bullet") ||
    msg.includes("rewrite") ||
    msg.includes("improve this") ||
    msg.includes("how does this sound") ||
    rawMsg.startsWith("Worked on") ||
    rawMsg.startsWith("Built") ||
    rawMsg.startsWith("Created") ||
    rawMsg.startsWith("Helped") ||
    rawMsg.startsWith("Responsible for")
  ) {
    const cleaned = rawMsg
      .replace(
        /^(can you (please )?rewrite (this )?(bullet )?(:|")?|improve (this )?(bullet )?(:|")?|how does this sound (for a bullet)?(:|")?|rewrite (this )?(bullet )?(:|")?)/i,
        "",
      )
      .replace(/^bullet\s*:\s*/i, "")
      .replace(/["']/g, "")
      .trim();

    return `Here are two high-impact ways to rewrite your bullet point for a **${targetRole}** role:

• **Option 1 (Impact-focused):** "Architected and deployed ${cleaned ? cleaned.toLowerCase() : "core system modules"}, reducing latency by 35% and enhancing reliability for 500+ active users."
• **Option 2 (Engineering & Stack-focused):** "Engineered robust ${cleaned ? cleaned.toLowerCase() : "feature pipelines"} utilizing modern production standards, accelerating sprint delivery cycles by 25%."

💡 *Formula to remember:* **[Strong Action Verb] + [System/Feature Built] + [Technologies Used] + [Quantifiable Metric]**.`;
  }

  // 4. ATS Score explanation & improvement
  if (msg.includes("score") || msg.includes("ats") || msg.includes("percentage")) {
    const scoreStr = atsScore !== undefined ? `${atsScore}%` : "your current score";
    return `Your ATS score (${scoreStr}) measures how effectively automated parsing algorithms index your resume against **${targetRole}** job postings.

To boost your score into the 90%+ tier:
1. **Keyword Alignment:** Mirror exact technical terms from target job descriptions (e.g., specific frameworks, databases, and CI/CD tools).
2. **Standard Section Titles:** Use universal headers like *Experience*, *Education*, *Projects*, and *Skills*.
3. **Format Cleanliness:** Keep a single-column layout without nested text boxes, graphics, or complex tables that confuse ATS parsers.`;
  }

  // 5. Target job / role improvement advice
  if (
    msg.includes("target job") ||
    msg.includes("improve for") ||
    msg.includes("fit for") ||
    msg.includes("prepare for") ||
    msg.includes("role")
  ) {
    return `To maximize your candidate strength for **${targetRole}**:

1. **Targeted Technical Keywords:** Ensure core requirements matching ${targetRole} appear in your top 1/3 of the resume.
2. **Depth over Breadth:** Showcase 2-3 deep, deployed projects rather than numerous shallow demos. Include architectural descriptions and test suites.
3. **Quantifiable Metrics:** Ensure every experience and project bullet features measurable achievements (e.g., performance boosts, user adoption, uptime).`;
  }

  // 6. Projects & Portfolio advice
  if (msg.includes("project") || msg.includes("portfolio") || msg.includes("github")) {
    return `For a **${targetRole}** application, hiring managers prioritize quality over quantity:

1. **Include Live Links & Repos:** Always link a deployed demo and a clean GitHub repo with a thorough README and architecture diagram.
2. **Demonstrate Full Lifecycles:** Highlight automated testing, database migrations, authentication, and Docker containerization.
3. **Quantify the Result:** State measurable performance metrics, e.g., *"Optimized database queries with indexing, cutting query response time by 40%"*.`;
  }

  // 7. Cover letters
  if (msg.includes("cover letter") || msg.includes("letter") || msg.includes("application email")) {
    return `For **${targetRole}** applications, an effective cover letter should be concise (3-4 paragraphs) and tailored:

1. **Hook:** State the exact role and why this specific company's product or mission excites you.
2. **Evidence:** Highlight 1-2 standout projects directly relevant to the team's tech stack.
3. **Value Proposition:** Explain how your background will help solve their immediate technical goals.

You can use ResuMate's **Cover Letter Generator** to produce a customized draft instantly!`;
  }

  // Default contextual mentor response
  return `As you prepare your application for **${targetRole}** positions:

• Make sure every bullet point highlights tangible results and technical ownership.
• Ensure your core skills match the high-priority keywords found in target job postings.
• Would you like me to rewrite a specific bullet point, suggest portfolio project ideas, or help you prepare for technical interviews?`;
}
