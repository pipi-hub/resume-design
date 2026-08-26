export const user = {
  name: "Arpita Das",
  firstName: "Arpita",
  email: "arpita.das@example.com",
  careerLevel: "Final-year student",
  targetRole: "Software Engineer (Entry Level)",
  location: "Dhaka, Bangladesh",
  linkedin: "linkedin.com/in/arpitadas",
  github: "github.com/arpitadas",
  skills: ["React", "JavaScript", "Node.js", "MongoDB", "Git", "Python", "SQL"],
};

export const stats = [
  {
    label: "Best ATS Score",
    value: "87%",
    hint: "How readable your resume is for hiring software.",
    trend: "+15 since first upload",
  },
  {
    label: "Best Match Score",
    value: "82%",
    hint: "How well your resume fits your target job.",
    trend: "+10 this month",
  },
  {
    label: "Resumes Analyzed",
    value: "6",
    hint: "Total resume versions you have checked.",
    trend: "2 this week",
  },
  {
    label: "Skills Identified",
    value: "24",
    hint: "Skills we found across your resumes.",
    trend: "3 new skills",
  },
];

export const features = [
  {
    title: "ATS Compatibility",
    desc: "Check whether your resume is readable and suitable for Applicant Tracking Systems.",
    icon: "ScanLine",
  },
  {
    title: "Resume–Job Match",
    desc: "Compare your resume against a specific job description.",
    icon: "Target",
  },
  {
    title: "Skill Gap Analysis",
    desc: "Identify important skills that are missing from your resume.",
    icon: "GitCompareArrows",
  },
  {
    title: "AI Resume Suggestions",
    desc: "Receive personalized suggestions to improve your resume.",
    icon: "Sparkles",
  },
  {
    title: "Bullet Point Improvement",
    desc: "Transform weak resume bullet points into stronger professional statements.",
    icon: "Wand2",
  },
  {
    title: "Resume Builder",
    desc: "Create a professional resume using guided templates.",
    icon: "FileText",
  },
  { title: "Cover Letter Generator", desc: "Generate job-specific cover letters.", icon: "Mail" },
  {
    title: "Interview Preparation",
    desc: "Generate interview questions based on your resume and target job.",
    icon: "MessagesSquare",
  },
  {
    title: "Resume History",
    desc: "Track previous resume versions and analysis results.",
    icon: "History",
  },
] as const;

export const steps = [
  {
    n: 1,
    title: "Upload Your Resume",
    desc: "Upload a PDF or DOCX file — no formatting knowledge needed.",
  },
  { n: 2, title: "Add a Job Description", desc: "Paste the job description you want to target." },
  {
    n: 3,
    title: "Let AI Analyze",
    desc: "ResuMate reads your resume and compares it with the job.",
  },
  {
    n: 4,
    title: "Improve & Apply",
    desc: "Follow the recommendations and send a stronger application.",
  },
];

export const recentAnalyses = [
  {
    id: "a1",
    name: "Software Engineer Resume",
    role: "Software Engineer",
    ats: 87,
    match: 82,
    date: "August 14, 2026",
    version: "v3",
  },
  {
    id: "a2",
    name: "Frontend Intern Resume",
    role: "Frontend Intern",
    ats: 81,
    match: 76,
    date: "August 9, 2026",
    version: "v2",
  },
  {
    id: "a3",
    name: "General CV",
    role: "Not specified",
    ats: 72,
    match: 61,
    date: "July 28, 2026",
    version: "v1",
  },
];

export const atsBreakdown = [
  { label: "Formatting", score: 92, note: "Your layout is clean and easy for software to read." },
  {
    label: "Keywords",
    score: 81,
    note: "You have most important keywords, but a few technical skills from the job are missing.",
  },
  {
    label: "Section Structure",
    score: 90,
    note: "Your sections are clearly titled and in a sensible order.",
  },
  { label: "Readability", score: 88, note: "Sentences are short and easy to scan." },
];

export const keywordsHave = [
  "React",
  "JavaScript",
  "Node.js",
  "MongoDB",
  "Git",
  "HTML/CSS",
  "Teamwork",
];
export const keywordsMissing = ["Docker", "AWS", "REST API", "CI/CD"];

export const skillGaps: Array<{
  skill: string;
  importance: "High" | "Medium" | "Low";
  rec: string;
  weeks: string;
}> = [
  {
    skill: "Docker",
    importance: "High",
    rec: "Learn containerization basics and add a Docker-based project.",
    weeks: "1–2 weeks",
  },
  {
    skill: "AWS",
    importance: "Medium",
    rec: "Learn AWS fundamentals and deploy a small web application.",
    weeks: "2–3 weeks",
  },
  {
    skill: "REST API",
    importance: "High",
    rec: "Build a small Express REST API and document the endpoints.",
    weeks: "1 week",
  },
  {
    skill: "CI/CD",
    importance: "Low",
    rec: "Add a simple GitHub Actions workflow to one of your projects.",
    weeks: "3 days",
  },
];

export const sectionStatus: Array<{
  section: string;
  status: "Good" | "Needs Improvement" | "Missing";
}> = [
  { section: "Resume Summary", status: "Good" },
  { section: "Education", status: "Good" },
  { section: "Skills", status: "Good" },
  { section: "Projects", status: "Needs Improvement" },
  { section: "Experience", status: "Good" },
  { section: "Certifications", status: "Missing" },
  { section: "Languages", status: "Missing" },
];

export const suggestions = [
  {
    title: "Improve Your Project Description",
    problem: "Your project description is too general.",
    why: "Recruiters need to understand what you actually built.",
    fix: "Mention the technologies used, your role, and measurable outcomes.",
  },
  {
    title: "Add a Certifications Section",
    problem: "Your resume has no certifications section.",
    why: "Certifications show initiative when you have little work experience.",
    fix: "Add any online course certificates, e.g. AWS Cloud Practitioner or a React course.",
  },
  {
    title: "Use Numbers in Your Bullet Points",
    problem: "Most bullet points describe tasks without results.",
    why: "Numbers make your impact believable and easy to compare.",
    fix: "Add results such as 'reduced load time by 30%' or 'used by 200 students'.",
  },
];

export const history = [
  {
    name: "Software Engineer Resume",
    role: "Software Engineer",
    ats: 87,
    match: 82,
    date: "Aug 14, 2026",
    version: "v3",
  },
  {
    name: "Software Engineer Resume",
    role: "Software Engineer",
    ats: 79,
    match: 74,
    date: "Aug 2, 2026",
    version: "v2",
  },
  {
    name: "Frontend Intern Resume",
    role: "Frontend Intern",
    ats: 81,
    match: 76,
    date: "Jul 22, 2026",
    version: "v2",
  },
  {
    name: "General CV",
    role: "Not specified",
    ats: 72,
    match: 61,
    date: "Jul 10, 2026",
    version: "v1",
  },
];

export const progressChart = [
  { month: "Apr", ats: 61, match: 48 },
  { month: "May", ats: 68, match: 55 },
  { month: "Jun", ats: 72, match: 61 },
  { month: "Jul", ats: 79, match: 74 },
  { month: "Aug", ats: 87, match: 82 },
];

export const interviewQuestions = {
  Technical: [
    {
      q: "Explain the difference between props and state in React.",
      hint: "Props come from the parent and are read-only; state is owned and updated by the component.",
    },
    {
      q: "How would you optimise a slow-loading web page?",
      hint: "Talk about image sizes, code splitting, caching and fewer network requests.",
    },
    {
      q: "What is a REST API and how have you used one?",
      hint: "Mention HTTP methods, endpoints, JSON and a project where you consumed or built one.",
    },
  ],
  Behavioral: [
    {
      q: "Tell me about a time a team project did not go as planned.",
      hint: "Use the STAR structure: Situation, Task, Action, Result.",
    },
    {
      q: "How do you handle feedback on your code?",
      hint: "Show that you listen, ask questions and improve quickly.",
    },
  ],
  HR: [
    {
      q: "Why do you want to work at our company?",
      hint: "Connect one specific product or value of theirs to your own goals.",
    },
    {
      q: "Where do you see yourself in three years?",
      hint: "Show growth ambition that stays realistic for an entry-level role.",
    },
  ],
} as const;

export const templates = [
  { name: "Classic", desc: "Simple corporate resume.", tag: "Most popular" },
  { name: "Modern", desc: "Modern layout with subtle visual elements.", tag: "Recruiter friendly" },
  { name: "Minimal", desc: "Clean ATS-friendly design.", tag: "Best ATS score" },
  {
    name: "Student",
    desc: "Designed for students and fresh graduates.",
    tag: "Recommended for you",
  },
];

export const coverLetterSample = `Dear Hiring Manager,

I am writing to apply for the Software Engineer position at Northwind Labs. As a final-year Computer Science student with hands-on experience building React and Node.js applications, I was excited to see a role that values practical project work as much as fundamentals.

During my internship I built a student results dashboard used by more than 200 classmates, cutting the time to publish results from two days to a few minutes. I work comfortably with JavaScript, MongoDB and Git, and I am currently learning Docker and AWS so I can support deployment work from day one.

I would welcome the chance to bring this curiosity and ownership to your team.

Thank you for your time and consideration.

Sincerely,
Arpita Das`;
