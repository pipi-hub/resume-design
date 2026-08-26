import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2, FileUp, Loader2, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { useAuthUser } from "@/lib/auth";
import { resumeService, type ResumeRow } from "@/services/resumeService";

export const Route = createFileRoute("/_authenticated/analyze")({
  head: () => ({
    meta: [
      { title: "Analyze Your Resume — ResuMate" },
      {
        name: "description",
        content: "Upload a PDF or DOCX resume and get an ATS score with clear improvement steps.",
      },
      { property: "og:title", content: "Analyze Your Resume — ResuMate" },
      { property: "og:description", content: "Drag and drop your resume to start the analysis." },
    ],
  }),
  component: Analyze,
});

const ok = ["pdf", "docx"];

function Analyze() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { userId } = useAuthUser();
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [resume, setResume] = useState<(ResumeRow & { size: string }) | null>(null);

  async function accept(f: File) {
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ok.includes(ext)) {
      setError("Please upload a PDF or DOCX file.");
      setResume(null);
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("That file is larger than 5 MB. Please upload a smaller file.");
      return;
    }
    if (!userId) {
      setError("You need to be signed in to upload a resume.");
      return;
    }
    setError("");
    setUploading(true);
    try {
      const row = await resumeService.uploadResume(f, userId);
      setResume({ ...row, size: `${(f.size / 1024 / 1024).toFixed(2)} MB` });
      toast.success("Resume uploaded successfully ✓");
    } catch (e) {
      setResume(null);
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  async function removeResume() {
    if (!resume) return;
    setDeleting(true);
    try {
      await resumeService.deleteResume(resume.id, resume.file_path);
      setResume(null);
      toast.success("Resume deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete the resume.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader
          title="Analyze Your Resume"
          subtitle="Step 1 of 3 — upload the resume you want to check. Nothing is shared with recruiters."
        />

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div
              role="button"
              tabIndex={0}
              aria-label="Upload resume file"
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const f = e.dataTransfer.files?.[0];
                if (f) void accept(f);
              }}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors ${
                dragging ? "border-primary bg-accent" : "border-border hover:bg-muted/60"
              }`}
            >
              <span className="flex size-14 items-center justify-center rounded-2xl gradient-hero text-primary-foreground">
                <UploadCloud className="size-6" />
              </span>
              <p className="mt-4 font-display text-lg font-semibold">
                Drag and drop your PDF or DOCX file here
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                or choose a file from your device
              </p>
              <Button variant="outline" className="mt-5" type="button">
                <FileUp /> Browse Files
              </Button>
              <p className="mt-4 text-xs text-muted-foreground">
                Supported formats: PDF, DOCX · Maximum file size: 5 MB
              </p>
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.docx"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void accept(f);
                }}
              />
            </div>

            {error ? (
              <p
                role="alert"
                className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </p>
            ) : null}

            {uploading ? (
              <div className="mt-5 rounded-xl border bg-card p-4">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                  Uploading resume…
                </p>
                <Progress value={65} className="mt-3 h-1.5" />
              </div>
            ) : null}

            {resume && !uploading ? (
              <div className="mt-5 rounded-xl border bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 truncate text-sm font-semibold">
                      <CheckCircle2 className="size-4 shrink-0 text-success" />
                      {resume.file_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{resume.size}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remove file"
                    disabled={deleting}
                    onClick={() => void removeResume()}
                  >
                    {deleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
                  </Button>
                </div>
                <Progress value={100} className="mt-3 h-1.5" />
                <p className="mt-2 text-xs text-muted-foreground">Resume uploaded successfully ✓</p>
              </div>
            ) : null}

            <Button
              variant="hero"
              size="lg"
              className="mt-6 w-full"
              disabled={!resume || uploading}
              asChild={Boolean(resume && !uploading)}
            >
              {resume && !uploading ? (
                <Link to="/job-description">
                  Continue to Job Description <ArrowRight />
                </Link>
              ) : (
                <span>Continue to Job Description</span>
              )}
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Don't have a resume yet?{" "}
          <Link to="/builder" className="font-medium text-primary hover:underline">
            Build one in ResuMate
          </Link>
        </p>
      </div>
    </AppShell>
  );
}
