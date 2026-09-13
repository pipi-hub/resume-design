import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useRef, useState, useEffect } from "react";
import {
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  FileText,
  Loader2,
  Sparkles,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { resumeService } from "@/services/resumeService";
import { useCareerContext } from "@/context/app-context";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/job-description")({
  head: () => ({
    meta: [
      { title: "Target Job Description — ResuMate" },
      {
        name: "description",
        content:
          "Paste the job you're targeting so ResuMate can score how well your resume matches.",
      },
      { property: "og:title", content: "Target Job Description — ResuMate" },
      {
        property: "og:description",
        content: "Job-specific matching gives far more useful feedback.",
      },
    ],
  }),
  component: JobDescription,
});

function JobDescription() {
  const navigate = useNavigate();
  const career = useCareerContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [jobTitle, setJobTitle] = useState(career.targetRole || "Software Engineer");
  const [company, setCompany] = useState(career.company || "Target Company");
  const [jd, setJd] = useState(career.jobDescription || "");
  const [error, setError] = useState("");
  const [extracting, setExtracting] = useState(false);

  useEffect(() => {
    if (career.targetRole) setJobTitle(career.targetRole);
    if (career.company) setCompany(career.company);
    if (career.jobDescription) setJd(career.jobDescription);
  }, [career.targetRole, career.company, career.jobDescription]);

  const ready = jd.trim().length >= 30;

  async function handleFileUpload(file: File) {
    setExtracting(true);
    try {
      const text = await resumeService.extractText(file);
      setJd(text);
      setError("");
      toast.success("Job description extracted from file ✓");
    } catch {
      toast.error("Could not extract text from the file.");
    } finally {
      setExtracting(false);
    }
  }

  function handleAnalyze() {
    if (!ready) {
      setError("Please paste or upload the job description (at least 30 characters).");
      return;
    }

    career.setTargetJob(jobTitle, company, jd);

    try {
      sessionStorage.setItem("resumate_job_title", jobTitle);
      sessionStorage.setItem("resumate_company", company);
      sessionStorage.setItem("resumate_job_description", jd);
    } catch {
      // Ignore sessionStorage issues
    }

    navigate({ to: "/analyzing" });
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader
          title="What Job Are You Applying For?"
          subtitle="Step 2 of 3 — Provide the target job details. ResuMate compares your resume directly with these requirements to calculate your real match score."
        />

        {/* Step Indicator */}
        <div className="grid grid-cols-3 gap-2 border-b border-border pb-4 text-xs">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
            <span className="flex size-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 text-[10px] font-bold">
              ✓
            </span>
            <span>Resume Uploaded</span>
          </div>
          <div className="flex items-center gap-2 text-primary font-bold">
            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px]">
              2
            </span>
            <span>Target Job</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground font-medium">
            <span className="flex size-5 items-center justify-center rounded-full bg-muted text-muted-foreground text-[10px]">
              3
            </span>
            <span>ATS Report</span>
          </div>
        </div>

        <Card className="shadow-card border-border/80">
          <CardContent className="space-y-6 p-6 sm:p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="jobTitle"
                  className="flex items-center gap-1.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground"
                >
                  <Briefcase className="size-3.5 text-primary" />
                  Target Job Title
                </Label>
                <Input
                  id="jobTitle"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Software Engineer / Frontend Intern"
                  className="h-10 bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="company"
                  className="flex items-center gap-1.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground"
                >
                  <Building2 className="size-3.5 text-primary" />
                  Target Company
                </Label>
                <Input
                  id="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Google, Stripe, or Stealth Startup"
                  className="h-10 bg-background"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="jd"
                  className="flex items-center gap-1.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground"
                >
                  <FileText className="size-3.5 text-primary" />
                  Job Description & Requirements
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  disabled={extracting}
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-primary font-medium hover:bg-primary/10"
                >
                  {extracting ? (
                    <Loader2 className="animate-spin size-3.5 mr-1" />
                  ) : (
                    <Upload className="size-3.5 mr-1" />
                  )}
                  {extracting ? "Extracting..." : "Upload JD Document"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.pdf,.docx,.md"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleFileUpload(f);
                  }}
                />
              </div>

              <Textarea
                id="jd"
                rows={11}
                value={jd}
                onChange={(e) => {
                  setJd(e.target.value);
                  if (e.target.value.trim()) setError("");
                }}
                placeholder="Paste the complete job posting here — including required qualifications, technical stack, responsibilities, and preferred background..."
                className="bg-background text-sm leading-relaxed resize-y font-normal"
              />

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <span>
                  Tip: Include the requirements & responsibilities sections — that is where ATS
                  keywords are evaluated.
                </span>
                <div className="flex items-center gap-2">
                  <span>{jd.length} chars</span>
                  {ready ? (
                    <Badge
                      variant="outline"
                      className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 font-semibold py-0"
                    >
                      <CheckCircle2 className="size-2.5 mr-1 inline" />
                      Ready
                    </Badge>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">(min 30 chars)</span>
                  )}
                </div>
              </div>

              {error ? (
                <p
                  role="alert"
                  className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive font-medium"
                >
                  {error}
                </p>
              ) : null}
            </div>

            {/* Helpful Tips Panel */}
            <div className="grid gap-3 rounded-xl border border-border/60 bg-muted/20 p-4 text-xs sm:grid-cols-3">
              <div className="space-y-1">
                <p className="font-semibold text-foreground">1. Full Job Posting</p>
                <p className="text-muted-foreground">
                  Paste the entire posting including role summary, requirements, and preferred
                  qualifications.
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-foreground">2. Required Skills</p>
                <p className="text-muted-foreground">
                  Keep languages, frameworks, and tools listed by the employer to match against your
                  tech stack.
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-foreground">3. Core Responsibilities</p>
                <p className="text-muted-foreground">
                  Include day-to-day tasks to calculate experience relevancy and keyword density.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row pt-2">
              <Button
                variant="hero"
                size="lg"
                className="sm:flex-1 shadow-lift"
                disabled={!ready}
                onClick={handleAnalyze}
              >
                <Sparkles className="size-4 mr-2" />
                Analyze Match
                <ArrowRight className="size-4 ml-1.5" />
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/analysis">View Previous Report</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
