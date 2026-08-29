import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AlertCircle, Check, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/app/AppShell";
import { useAuthUser } from "@/lib/auth";
import { resumeService } from "@/services/resumeService";
import { useCareerContext } from "@/context/app-context";

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
  const career = useCareerContext();
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
      const resumeId =
        career.activeResumeId || sessionStorage.getItem("resumate_active_resume_id") || undefined;
      let resumeText =
        career.activeResumeText || sessionStorage.getItem("resumate_active_resume_text") || "";
      const jobTitle =
        career.targetRole || sessionStorage.getItem("resumate_job_title") || "Software Engineer";
      const company =
        career.company || sessionStorage.getItem("resumate_company") || "Northwind Labs";
      const jobDescription =
        career.jobDescription ||
        sessionStorage.getItem("resumate_job_description") ||
        "Software engineering position requiring React, TypeScript, Node.js, REST APIs, and database fundamentals.";

      if (!resumeText && resumeId) {
        const resumeRow = await resumeService.getResumeById(resumeId);
        if (resumeRow?.extracted_text) {
          resumeText = resumeRow.extracted_text;
          career.setActiveResume(
            resumeId,
            resumeRow.name ||
              (resumeRow as unknown as { file_name?: string }).file_name ||
              "Resume",
            resumeText,
          );
        }
      }

      if (!resumeText) {
        // If no uploaded resume in session, check if user has existing resume in DB
        const userResumes = await resumeService.listResumes();
        if (userResumes.length > 0 && userResumes[0]?.extracted_text) {
          resumeText = userResumes[0].extracted_text;
          career.setActiveResume(
            userResumes[0].id,
            userResumes[0].name ||
              (userResumes[0] as unknown as { file_name?: string }).file_name ||
              "Resume",
            resumeText,
          );
        } else {
          clearInterval(stepInterval);
          setError("No resume content found. Please upload or select a resume first.");
          return;
        }
      }

      const { analysisId, result } = await resumeService.analyzeResume({
        resumeId,
        resumeText,
        jobDescription,
        jobTitle,
        company,
        userId: userId || "anonymous",
      });

      if (result) {
        career.setLatestAnalysis(result, analysisId);
      }

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
