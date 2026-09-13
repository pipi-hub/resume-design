import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  CheckCircle2,
  FileCheck,
  FileText,
  FileUp,
  Info,
  Loader2,
  Shield,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { useAuthUser } from "@/lib/auth";
import { resumeService, type ResumeRow } from "@/services/resumeService";
import { useCareerContext } from "@/context/app-context";

export const Route = createFileRoute("/_authenticated/analyze")({
  head: () => ({
    meta: [
      { title: "Analyze Your Resume — ResuMate" },
      {
        name: "description",
        content: "Upload a PDF or DOCX resume and get an ATS score with clear improvement steps.",
      },
      { property: "og:title", content: "Analyze Your Resume — ResuMate" },
      {
        property: "og:description",
        content: "Drag and drop your resume to start the analysis.",
      },
    ],
  }),
  component: Analyze,
});

const ok = ["pdf", "docx", "txt", "md"];

function Analyze() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { userId } = useAuthUser();
  const career = useCareerContext();
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
      const resName = row.name || (row as unknown as { file_name?: string }).file_name || f.name;
      setResume({ ...row, size: `${(f.size / 1024 / 1024).toFixed(2)} MB` });
      career.setActiveResume(row.id, resName, row.extracted_text || "");
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
      career.setActiveResume(null, "My Resume", "");
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
          title="Let's make your resume stronger."
          subtitle="Upload your resume and we'll analyze it against your target role."
        />

        {/* Step Indicator */}
        <div className="grid grid-cols-3 gap-2 border-b border-border pb-4 text-xs">
          <div className="flex items-center gap-2 text-primary font-bold">
            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px]">
              1
            </span>
            <span>Upload Resume</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground font-medium">
            <span className="flex size-5 items-center justify-center rounded-full bg-muted text-muted-foreground text-[10px]">
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
          <CardContent className="p-6 sm:p-8">
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
              className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-all ${
                dragging
                  ? "border-primary bg-primary/10 scale-[0.99]"
                  : "border-border/80 bg-muted/20 hover:border-primary/50 hover:bg-muted/40"
              }`}
            >
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4 shadow-xs">
                <UploadCloud className="size-7" />
              </div>
              <p className="font-display text-lg font-semibold text-foreground">
                Drag and drop your resume file here
              </p>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                or click to choose a document from your computer
              </p>
              <Button
                variant="outline"
                className="mt-5 shadow-xs hover:border-primary hover:text-primary"
                type="button"
              >
                <FileUp className="size-4 mr-1.5" /> Browse Files
              </Button>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2 border-t border-border/60 pt-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Supported:</span>
                  <Badge variant="outline" className="text-[11px] font-medium">
                    PDF
                  </Badge>
                  <Badge variant="outline" className="text-[11px] font-medium">
                    DOCX
                  </Badge>
                  <Badge variant="outline" className="text-[11px] font-medium">
                    TXT
                  </Badge>
                </div>
                <span className="text-muted-foreground/40">•</span>
                <span className="text-muted-foreground">Max 5 MB</span>
                <span className="text-muted-foreground/40">•</span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <Shield className="size-3 text-emerald-600 dark:text-emerald-400" /> Private &
                  Encrypted
                </span>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.docx,.txt,.md"
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
                className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive font-medium"
              >
                {error}
              </p>
            ) : null}

            {uploading ? (
              <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                  Uploading & extracting resume text…
                </p>
                <Progress value={65} className="mt-3 h-2" />
              </div>
            ) : null}

            {resume && !uploading ? (
              <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <FileCheck className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-bold text-foreground">
                          {resume.name ||
                            (resume as unknown as { file_name?: string }).file_name ||
                            "Resume.pdf"}
                        </p>
                        <Badge
                          variant="outline"
                          className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 font-semibold"
                        >
                          <CheckCircle2 className="size-3 mr-1 inline" />
                          Ready
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {resume.size} • Extracted & verified
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={() => inputRef.current?.click()}
                      className="text-xs h-8"
                    >
                      Change File
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remove file"
                      disabled={deleting}
                      onClick={() => void removeResume()}
                      className="hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                    >
                      {deleting ? (
                        <Loader2 className="animate-spin size-4" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}

            <Button
              variant="hero"
              size="lg"
              className="mt-6 w-full shadow-lift"
              disabled={!resume || uploading}
              asChild={Boolean(resume && !uploading)}
            >
              {resume && !uploading ? (
                <Link to="/job-description">
                  Analyze Resume
                  <ArrowRight className="size-4 ml-1.5" />
                </Link>
              ) : (
                <span>Upload a Resume to Continue</span>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* ATS Parsing Tips */}
        <Card className="shadow-xs border-border/60 bg-card/60">
          <CardContent className="p-4 sm:p-5 flex items-start gap-3">
            <Info className="size-5 text-primary shrink-0 mt-0.5" />
            <div className="text-xs space-y-1 text-muted-foreground">
              <p className="font-semibold text-foreground">ATS Compatibility Tip</p>
              <p>
                Standard ATS systems parse clean, single-column documents best. Avoid placing
                important skills inside graphic bars, images, or multi-column tables.
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Don't have a resume file yet?{" "}
          <Link to="/builder" className="font-medium text-primary hover:underline">
            Build an ATS-optimized resume from scratch
          </Link>
        </p>
      </div>
    </AppShell>
  );
}
