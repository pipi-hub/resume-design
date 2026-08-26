import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ArrowRight, FileText, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { resumeService } from "@/services/resumeService";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/job-description")({
  head: () => ({
    meta: [
      { title: "Add a Job Description — ResuMate" },
      {
        name: "description",
        content:
          "Paste the job you're targeting so ResuMate can score how well your resume matches.",
      },
      { property: "og:title", content: "Add a Job Description — ResuMate" },
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [jobTitle, setJobTitle] = useState("Software Engineer");
  const [company, setCompany] = useState("Northwind Labs");
  const [jd, setJd] = useState("");
  const [error, setError] = useState("");
  const [extracting, setExtracting] = useState(false);

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
          subtitle="Step 2 of 3 — paste the job description. This is how we calculate your match score and missing skills."
        />
        <Card className="shadow-card">
          <CardContent className="space-y-5 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job title</Label>
                <Input
                  id="jobTitle"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Frontend Intern"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Northwind Labs"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="jd">Job description</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  disabled={extracting}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {extracting ? <Loader2 className="animate-spin" /> : <Upload />}
                  {extracting ? "Extracting..." : "Upload job description"}
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
                rows={12}
                value={jd}
                onChange={(e) => {
                  setJd(e.target.value);
                  if (e.target.value.trim()) setError("");
                }}
                placeholder="Paste the full job posting here — responsibilities, requirements and preferred skills."
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  Tip: include the requirements section — that's where most keywords live.
                </span>
                <span>{jd.length} characters</span>
              </div>
              {error ? (
                <p
                  role="alert"
                  className="rounded-lg bg-warning/15 px-3 py-2 text-sm text-foreground"
                >
                  {error}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="hero"
                size="lg"
                className="sm:flex-1"
                disabled={!ready}
                onClick={handleAnalyze}
              >
                Analyze Resume <ArrowRight />
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/analysis">See latest report</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
