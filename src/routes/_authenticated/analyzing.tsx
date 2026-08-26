import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AlertCircle, Check, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/app/AppShell";
import { useAuthUser } from "@/lib/auth";
import { resumeService } from "@/services/resumeService";

export const Route = createFileRoute("/_authenticated/analyzing")({
  head: () => ({
    meta: [
      { title: "Analyzing Your Resume — ResuMate" },
      {
        name: "description",
        content: "ResuMate AI is reading your resume and comparing it with the job description.",
      },
      { property: "og:title", content: "Analyzing Your Resume — ResuMate" },
      { property: "og:description", content: "This usually takes a few seconds." },
    ],
  }),
  component: Analyzing,
});

const stages = [
  "Reading resume document",
  "Extracting candidate skills and experience",
  "Analyzing job requirements & semantic fit",
  "Evaluating ATS parseability & keyword density",
  "Auditing section structure and impact metrics",
  "Generating actionable recommendations",
];

function Analyzing() {
  const navigate = useNavigate();
  const { userId } = useAuthUser();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const hasTriggered = useRef(false);

  async function performAnalysis() {
    setError(null);
    setStep(0);

    const stepInterval = setInterval(() => {
      setStep((s) => (s < stages.length - 1 ? s + 1 : s));
    }, 1200);

    try {
      const resumeId = sessionStorage.getItem("resumate_active_resume_id") || undefined;
      let resumeText = sessionStorage.getItem("resumate_active_resume_text") || "";
      const jobTitle = sessionStorage.getItem("resumate_job_title") || "Software Engineer";
      const company = sessionStorage.getItem("resumate_company") || "Northwind Labs";
      const jobDescription =
        sessionStorage.getItem("resumate_job_description") ||
        "Software engineering position requiring React, TypeScript, Node.js, REST APIs, and database fundamentals.";

      if (!resumeText && resumeId) {
        const resumeRow = await resumeService.getResumeById(resumeId);
        if (resumeRow?.content) {
          resumeText = resumeRow.content;
        }
      }

      if (!resumeText) {
        // If no uploaded resume in session, check if user has existing resume in DB
        const userResumes = await resumeService.listResumes();
        if (userResumes.length > 0 && userResumes[0]?.content) {
          resumeText = userResumes[0].content;
        } else {
          // Default sample resume text if user jumped directly to analysis
          resumeText = `
Name: Candidate
Email: candidate@example.com | Location: New York, NY
Target Role: Software Engineer

Summary:
Computer Science graduate with experience building modern web applications with React, TypeScript, and Node.js.

Education:
B.S. in Computer Science (2022 - 2026)
Relevant Coursework: Data Structures, Algorithms, Web Engineering, Database Systems.

Experience & Internships:
Software Development Intern (Jun 2025 - Aug 2025)
- Developed responsive user interfaces using React and Tailwind CSS.
- Built RESTful API endpoints in Node.js and Express to handle data synchronization.
- Resolved 25+ frontend issues and improved test coverage by 15%.

Projects:
ResuMate - AI Career Platform (React, TypeScript, Supabase, Tailwind CSS)
- Architected full-stack resume analysis application with automated scoring.
- Implemented real-time markdown and PDF generation.

Skills:
Languages: TypeScript, JavaScript, Python, SQL, HTML, CSS
Frameworks & Tools: React, Node.js, Express, Git, REST APIs, PostgreSQL
          `;
        }
      }

      const { analysisId } = await resumeService.analyzeResume({
        resumeId,
        resumeText,
        jobDescription,
        jobTitle,
        company,
        userId: userId || "anonymous",
      });

      clearInterval(stepInterval);
      setStep(stages.length);

      setTimeout(() => {
        navigate({ to: "/analysis", search: { id: analysisId } as never });
      }, 500);
    } catch (err) {
      clearInterval(stepInterval);
      console.warn("Analysis execution error:", err);
      setError(err instanceof Error ? err.message : "Analysis failed. Please try again.");
    }
  }

  useEffect(() => {
    if (hasTriggered.current) return;
    hasTriggered.current = true;
    void performAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppShell>
      <div className="mx-auto max-w-xl py-8">
        <Card className="shadow-card">
          <CardContent className="p-8 text-center">
            <span className="mx-auto flex size-14 animate-pulse items-center justify-center rounded-2xl gradient-hero text-primary-foreground">
              <Sparkles className="size-6" />
            </span>
            <h1 className="mt-5 font-display text-2xl font-bold">Analyzing your resume</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              ResuMate AI is comparing your resume against the job requirements.
            </p>

            {error ? (
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-3 rounded-xl bg-destructive/10 p-4 text-left text-sm text-destructive">
                  <AlertCircle className="size-5 shrink-0" />
                  <p>{error}</p>
                </div>
                <Button variant="hero" onClick={() => void performAnalysis()}>
                  <RefreshCw /> Try Again
                </Button>
              </div>
            ) : (
              <>
                <Progress
                  value={Math.min(100, (step / stages.length) * 100)}
                  className="mt-6 h-2"
                />
                <ul className="mt-6 space-y-3 text-left">
                  {stages.map((s, i) => (
                    <li key={s} className="flex items-center gap-3 text-sm">
                      {i < step ? (
                        <Check className="size-4 text-success" />
                      ) : i === step ? (
                        <Loader2 className="size-4 animate-spin text-primary" />
                      ) : (
                        <span className="size-4 rounded-full border" />
                      )}
                      <span className={i <= step ? "font-medium" : "text-muted-foreground"}>
                        {s}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
