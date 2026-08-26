import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Check,
  Copy,
  Download,
  FileText,
  History,
  Mail,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { useAuthUser } from "@/lib/auth";
import { CoverLetterRow, resumeService } from "@/services/resumeService";

export const Route = createFileRoute("/_authenticated/cover-letter")({
  head: () => ({
    meta: [
      { title: "Cover Letter Generator — ResuMate" },
      {
        name: "description",
        content: "Generate a job-specific cover letter from your resume in seconds.",
      },
      { property: "og:title", content: "Cover Letter Generator — ResuMate" },
      {
        property: "og:description",
        content: "A tailored cover letter you can edit, copy and send.",
      },
    ],
  }),
  component: CoverLetter,
});

function CoverLetter() {
  const { userId } = useAuthUser();
  const [role, setRole] = useState("Software Engineer");
  const [company, setCompany] = useState("Northwind Labs");
  const [tone, setTone] = useState("Professional");
  const [highlight, setHighlight] = useState("");
  const [letter, setLetter] = useState("");
  const [currentLetterId, setCurrentLetterId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [savedLetters, setSavedLetters] = useState<CoverLetterRow[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  // Load saved cover letters from Supabase on mount
  useEffect(() => {
    async function loadSaved() {
      if (!userId) return;
      setLoadingSaved(true);
      try {
        const letters = await resumeService.listCoverLetters();
        setSavedLetters(letters);
        if (letters.length > 0) {
          setLetter((curr) => curr || letters[0].content);
          setCurrentLetterId(letters[0].id);
          if (letters[0].job_title) setRole(letters[0].job_title);
          if (letters[0].company) setCompany(letters[0].company);
          if (letters[0].tone) setTone(letters[0].tone);
        }
      } catch (e) {
        console.warn("Could not load saved letters:", e);
      } finally {
        setLoadingSaved(false);
      }
    }
    void loadSaved();
  }, [userId]);

  // Load active resume title or role if in sessionStorage
  useEffect(() => {
    const savedRole = sessionStorage.getItem("resumate_job_title");
    const savedCompany = sessionStorage.getItem("resumate_company");
    if (savedRole) setRole(savedRole);
    if (savedCompany) setCompany(savedCompany);
  }, []);

  async function generate() {
    if (!role.trim() || !company.trim()) {
      toast.error("Please add both the job title and the company name.");
      return;
    }

    setLoading(true);
    try {
      const resumeText = sessionStorage.getItem("resumate_active_resume_text") || "";
      const result = await resumeService.generateCoverLetter({
        resumeText,
        jobTitle: role,
        company,
        tone,
        highlight,
        userId: userId || undefined,
      });

      setLetter(result.letter);
      setCurrentLetterId(result.id || null);
      toast.success("Tailored cover letter generated and saved ✓");

      // Refresh saved letters list
      if (userId) {
        const updated = await resumeService.listCoverLetters().catch(() => []);
        setSavedLetters(updated);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "We couldn't generate your letter. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveEdit() {
    if (!currentLetterId || !letter.trim()) {
      toast.info("Generate or select a saved letter first.");
      return;
    }

    setSavingEdit(true);
    try {
      await resumeService.updateCoverLetter(currentLetterId, letter);
      toast.success("Cover letter updates saved ✓");
      if (userId) {
        const updated = await resumeService.listCoverLetters().catch(() => []);
        setSavedLetters(updated);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update cover letter");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await resumeService.deleteCoverLetter(id);
      setSavedLetters((prev) => prev.filter((l) => l.id !== id));
      if (currentLetterId === id) {
        setLetter("");
        setCurrentLetterId(null);
      }
      toast.success("Cover letter removed ✓");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete cover letter");
    }
  }

  function download() {
    const blob = new Blob([letter], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cover-letter-${company.toLowerCase().replace(/\s+/g, "-") || "application"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Download started ✓");
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <PageHeader
          title="Cover letter generator"
          subtitle="Generate tailored, authentic cover letters grounded in your real resume and customized to target roles."
        />

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Controls Sidebar */}
          <div className="space-y-6 lg:col-span-4">
            <Card className="shadow-card">
              <CardContent className="space-y-4 p-6">
                <h2 className="font-display text-lg font-semibold">Job Details</h2>
                <div className="space-y-2">
                  <Label htmlFor="role">Job Title</Label>
                  <Input
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Frontend Engineer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company Name</Label>
                  <Input
                    id="company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Stripe, Acme Corp"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tone">Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger id="tone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Professional">Professional (Metric-focused)</SelectItem>
                      <SelectItem value="Enthusiastic">Enthusiastic (High Energy)</SelectItem>
                      <SelectItem value="Friendly">Friendly (Warm & Collaborative)</SelectItem>
                      <SelectItem value="Formal">Formal (Conservative & Structured)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="highlight">Points to Highlight (Optional)</Label>
                  <Textarea
                    id="highlight"
                    rows={3}
                    value={highlight}
                    onChange={(e) => setHighlight(e.target.value)}
                    placeholder="e.g. Led redesign with Next.js, published ML paper at CUET..."
                  />
                </div>
                <Button variant="hero" className="w-full" onClick={generate} disabled={loading}>
                  {loading ? <RefreshCw className="animate-spin" /> : <Sparkles />}
                  {loading ? "Writing Tailored Letter…" : "Generate Cover Letter"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Letters are saved to your account and can be edited, copied, or downloaded.
                </p>
              </CardContent>
            </Card>

            {/* Saved Letters List */}
            {savedLetters.length > 0 ? (
              <Card className="shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <History className="size-4 text-primary" />
                    Saved Cover Letters ({savedLetters.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 p-4 pt-0 max-h-60 overflow-y-auto">
                  {savedLetters.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setLetter(item.content);
                        setCurrentLetterId(item.id);
                        if (item.job_title) setRole(item.job_title);
                        if (item.company) setCompany(item.company);
                        if (item.tone) setTone(item.tone);
                      }}
                      className={`group flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                        currentLetterId === item.id
                          ? "border-primary bg-primary/5 font-medium"
                          : "hover:bg-muted"
                      }`}
                    >
                      <div className="truncate pr-2">
                        <p className="font-semibold truncate">
                          {item.job_title || "Role"} • {item.company || "Company"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(item.created_at).toLocaleDateString()} •{" "}
                          {item.tone || "Professional"}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10"
                        onClick={(e) => void handleDelete(item.id, e)}
                        aria-label="Delete letter"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}
          </div>

          {/* Letter Editor Output */}
          <div className="lg:col-span-8">
            {letter ? (
              <Card className="shadow-card">
                <CardContent className="p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-4">
                    <div>
                      <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                        <FileText className="size-5 text-primary" />
                        {role} at {company}
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Tone: <span className="font-medium text-foreground">{tone}</span> •{" "}
                        {letter.split(/\s+/).filter(Boolean).length} words
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {currentLetterId ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={savingEdit}
                          onClick={() => void handleSaveEdit()}
                        >
                          <Save className="size-3.5 mr-1" />
                          {savingEdit ? "Saving…" : "Save Edits"}
                        </Button>
                      ) : null}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard?.writeText(letter);
                          toast.success("Cover letter copied to clipboard ✓");
                        }}
                      >
                        <Copy className="size-3.5 mr-1" /> Copy
                      </Button>
                      <Button variant="outline" size="sm" onClick={download}>
                        <Download className="size-3.5 mr-1" /> Download (.txt)
                      </Button>
                    </div>
                  </div>

                  <Textarea
                    className="font-mono text-sm leading-relaxed min-h-[420px] resize-y p-4 bg-muted/20 focus:bg-background transition-colors"
                    value={letter}
                    onChange={(e) => setLetter(e.target.value)}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-card">
                <CardContent className="p-12">
                  <EmptyState
                    icon={Mail}
                    title="No cover letter generated yet"
                    description="Enter your target role and company on the left, select your preferred tone, and click Generate to produce a personalized letter tailored to your background."
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
