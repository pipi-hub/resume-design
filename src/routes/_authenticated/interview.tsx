import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  Briefcase,
  Check,
  Code2,
  Copy,
  FileText,
  HelpCircle,
  Lightbulb,
  MessagesSquare,
  RefreshCw,
  Sparkles,
  Upload,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { resumeService, type ResumeRow } from "@/services/resumeService";
import type { InterviewQuestionsData } from "@/server/gemini";

export const Route = createFileRoute("/_authenticated/interview")({
  head: () => ({
    meta: [
      { title: "Interview Preparation — ResuMate" },
      {
        name: "description",
        content:
          "Generate technical, behavioral, and project interview questions tailored directly to your resume.",
      },
      { property: "og:title", content: "Interview Preparation — ResuMate" },
      {
        property: "og:description",
        content: "Practice AI-engineered interview questions grounded in your actual experience.",
      },
    ],
  }),
  component: InterviewPrep,
});

function InterviewPrep() {
  const { userId } = useAuthUser();
  const [targetRole, setTargetRole] = useState("Software Engineer");
  const [jobDescription, setJobDescription] = useState("");
  const [data, setData] = useState<InterviewQuestionsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [evaluatingKeys, setEvaluatingKeys] = useState<Record<string, boolean>>({});
  const [evaluations, setEvaluations] = useState<
    Record<
      string,
      {
        score: number;
        rating: "Excellent" | "Strong" | "Adequate" | "Needs Improvement";
        strengths: string[];
        improvements: string[];
        starEvaluation: {
          situation: string;
          task: string;
          action: string;
          result: string;
        };
        followUpQuestion: string;
        coachingAdvice: string;
      }
    >
  >({});

  // Resume library state
  const [userResumes, setUserResumes] = useState<ResumeRow[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("active");
  const [activeResumeText, setActiveResumeText] = useState<string>("");
  const [activeResumeName, setActiveResumeName] = useState<string>("");
  const [loadingResumes, setLoadingResumes] = useState(false);

  // Load saved notes and cached interview data on mount
  useEffect(() => {
    try {
      const savedNotes = localStorage.getItem("resumate_interview_notes");
      if (savedNotes) {
        setNotes(JSON.parse(savedNotes));
      }
      const cached = sessionStorage.getItem("resumate_interview_data");
      if (cached) {
        setData(JSON.parse(cached));
      }
      const role = sessionStorage.getItem("resumate_job_title");
      if (role) setTargetRole(role);

      const jd = sessionStorage.getItem("resumate_job_description");
      if (jd) setJobDescription(jd);

      const sessionText = sessionStorage.getItem("resumate_active_resume_text");
      const sessionName = sessionStorage.getItem("resumate_active_resume_name");
      if (sessionText) {
        setActiveResumeText(sessionText);
        setActiveResumeName(sessionName || "Active Uploaded Resume");
      }
    } catch {
      // Ignore localStorage/sessionStorage issues
    }
  }, []);

  // Fetch user's saved resumes from Supabase
  useEffect(() => {
    async function loadUserResumes() {
      if (!userId) return;
      setLoadingResumes(true);
      try {
        const resumes = await resumeService.listResumes();
        setUserResumes(resumes);

        // If no active session resume text, use latest resume
        if (!activeResumeText && resumes.length > 0) {
          const first = resumes[0];
          setSelectedResumeId(first.id);
          setActiveResumeName(first.name || "Resume");
          if (first.extracted_text) {
            setActiveResumeText(first.extracted_text);
          }
        }
      } catch (err) {
        console.warn("Could not load resumes for interview prep:", err);
      } finally {
        setLoadingResumes(false);
      }
    }
    void loadUserResumes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  function handleResumeChange(val: string) {
    setSelectedResumeId(val);
    if (val === "active") {
      const text = sessionStorage.getItem("resumate_active_resume_text") || "";
      const name = sessionStorage.getItem("resumate_active_resume_name") || "Active Resume";
      setActiveResumeText(text);
      setActiveResumeName(name);
    } else {
      const found = userResumes.find((r) => r.id === val);
      if (found) {
        setActiveResumeText(found.extracted_text || "");
        setActiveResumeName(found.name || "Resume");
        try {
          sessionStorage.setItem("resumate_active_resume_id", found.id);
          if (found.extracted_text) {
            sessionStorage.setItem("resumate_active_resume_text", found.extracted_text);
          }
          if (found.name) {
            sessionStorage.setItem("resumate_active_resume_name", found.name);
          }
        } catch {
          // ignore
        }
      }
    }
  }

  function handleNoteChange(key: string, text: string) {
    const next = { ...notes, [key]: text };
    setNotes(next);
    try {
      localStorage.setItem("resumate_interview_notes", JSON.stringify(next));
    } catch {
      // Ignore localStorage issues
    }
  }

  async function generate() {
    let effectiveResumeText = activeResumeText.trim();

    // Fallback: check session storage
    if (!effectiveResumeText) {
      effectiveResumeText = sessionStorage.getItem("resumate_active_resume_text") || "";
    }

    // Fallback: check latest analysis if user has one
    if (!effectiveResumeText && userId) {
      try {
        const latest = await resumeService.getLatestAnalysis(userId);
        if (latest?.raw_text) {
          effectiveResumeText = latest.raw_text;
          setActiveResumeText(latest.raw_text);
          setActiveResumeName(latest.resume_name || "Analyzed Resume");
        }
      } catch {
        // ignore
      }
    }

    if (!effectiveResumeText || effectiveResumeText.length < 20) {
      setErrorMsg(
        "Please select or upload a resume before generating interview questions so questions can be tailored to your real background.",
      );
      toast.error("Resume content is required to generate tailored interview questions.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const questions = await resumeService.generateInterviewQuestions({
        resumeText: effectiveResumeText,
        jobDescription: jobDescription.trim() || undefined,
        targetRole: targetRole.trim() || "Software Engineer",
      });

      setData(questions);
      try {
        sessionStorage.setItem("resumate_interview_data", JSON.stringify(questions));
        if (targetRole) sessionStorage.setItem("resumate_job_title", targetRole);
        if (jobDescription) sessionStorage.setItem("resumate_job_description", jobDescription);
      } catch {
        // Ignore sessionStorage issues
      }
      toast.success("Interview questions generated successfully ✓");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to generate interview questions.";
      console.error("Interview generation error:", err);
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  function copyQuestion(key: string, text: string) {
    void navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Question copied to clipboard");
    setTimeout(() => setCopiedKey(null), 2000);
  }

  function copyAllQuestions() {
    if (!data) return;
    const lines: string[] = [];
    lines.push(`# Interview Preparation — ${targetRole}\n`);

    const order: Array<keyof InterviewQuestionsData> = [
      "Technical",
      "Resume & Projects",
      "Behavioral",
      "HR & Situational",
    ];

    for (const cat of order) {
      const questions = data[cat] || (cat === "Resume & Projects" ? data["Role-Specific"] : []);
      if (questions && questions.length > 0) {
        lines.push(`\n## ${cat} Questions\n`);
        questions.forEach((q, idx) => {
          lines.push(`**Q${idx + 1}: ${q.q}**`);
          lines.push(`*Tip:* ${q.hint}`);
          if (notes[`${cat}-${idx}`]) {
            lines.push(`*Your Practice Answer:* ${notes[`${cat}-${idx}`]}`);
          }
          lines.push("");
        });
      }
    }

    void navigator.clipboard.writeText(lines.join("\n"));
    setCopiedAll(true);
    toast.success("All interview questions copied to clipboard");
    setTimeout(() => setCopiedAll(false), 2000);
  }

  async function handleEvaluateAnswer(noteKey: string, question: string, category: string) {
    const answer = notes[noteKey]?.trim();
    if (!answer || answer.length < 5) {
      toast.error("Please type your practice answer first before requesting AI feedback.");
      return;
    }

    setEvaluatingKeys((prev) => ({ ...prev, [noteKey]: true }));
    try {
      const evaluation = await resumeService.evaluateInterviewAnswer({
        question,
        answer,
        category,
        targetRole,
        resumeText: activeResumeText,
      });

      setEvaluations((prev) => ({ ...prev, [noteKey]: evaluation }));
      toast.success("Answer evaluated with STAR breakdown & follow-up generated!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to evaluate answer.";
      toast.error(message);
    } finally {
      setEvaluatingKeys((prev) => ({ ...prev, [noteKey]: false }));
    }
  }

  // Determine categories to show
  const availableCategories: Array<{
    key: keyof InterviewQuestionsData;
    label: string;
    icon: typeof Code2;
  }> = [
    { key: "Technical", label: "Technical", icon: Code2 },
    { key: "Resume & Projects", label: "Resume & Projects", icon: Briefcase },
    { key: "Behavioral", label: "Behavioral", icon: MessagesSquare },
    { key: "HR & Situational", label: "HR & Situational", icon: UserCheck },
  ];

  const hasResume = Boolean(activeResumeText && activeResumeText.length > 20);

  return (
    <AppShell>
      <div className="space-y-8 max-w-6xl mx-auto pb-12">
        <PageHeader
          title="Interview preparation"
          subtitle={`AI-tailored technical, project, behavioral, and HR questions strictly grounded in your experience for: ${targetRole}.`}
          action={
            <div className="flex items-center gap-2">
              {data && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyAllQuestions}
                  className="hidden sm:inline-flex"
                >
                  {copiedAll ? <Check className="size-4" /> : <Copy className="size-4" />}
                  {copiedAll ? "Copied" : "Copy all questions"}
                </Button>
              )}
              <Button variant="hero" onClick={generate} disabled={loading}>
                {loading ? (
                  <RefreshCw className="animate-spin size-4" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                {loading
                  ? "Generating questions…"
                  : data
                    ? "Regenerate questions"
                    : "Generate questions"}
              </Button>
            </div>
          }
        />

        {/* Configuration Bar / Resume Selector */}
        <Card className="border border-border/80 shadow-sm bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="size-4 text-primary" />
              Interview Context & Target Role
            </CardTitle>
            <CardDescription>
              Select your resume and define your target position so questions are strictly tailored
              to your actual tools and projects.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Resume Selector */}
              <div className="space-y-2">
                <Label htmlFor="resume-selector" className="text-sm font-medium">
                  Source Resume
                </Label>
                <div className="flex gap-2">
                  <Select value={selectedResumeId} onValueChange={handleResumeChange}>
                    <SelectTrigger id="resume-selector" className="w-full">
                      <SelectValue placeholder="Select resume..." />
                    </SelectTrigger>
                    <SelectContent>
                      {activeResumeName && (
                        <SelectItem value="active">{activeResumeName} (Active)</SelectItem>
                      )}
                      {userResumes.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name || "Untitled Resume"} {r.file_size ? `(${r.file_size})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" asChild title="Upload new resume">
                    <Link to="/analyze">
                      <Upload className="size-4" />
                    </Link>
                  </Button>
                </div>
                {hasResume ? (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-emerald-500 inline-block" />
                    Resume active:{" "}
                    <strong className="font-medium text-foreground">
                      {activeResumeName || "Uploaded Resume"}
                    </strong>{" "}
                    ({activeResumeText.split(/\s+/).length} words)
                  </p>
                ) : (
                  <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <AlertCircle className="size-3.5 shrink-0" />
                    No resume detected yet. Please upload or analyze a resume first.
                  </p>
                )}
              </div>

              {/* Target Role Input */}
              <div className="space-y-2">
                <Label htmlFor="target-role" className="text-sm font-medium">
                  Target Role / Job Title
                </Label>
                <Input
                  id="target-role"
                  placeholder="e.g. Junior Software Engineer, Full Stack Developer"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  The primary job title you are preparing to interview for.
                </p>
              </div>
            </div>

            {/* Optional Target Job Description */}
            <div className="space-y-1.5 pt-1">
              <Label htmlFor="target-jd" className="text-xs font-medium text-muted-foreground">
                Target Job Description / Requirements (Optional)
              </Label>
              <Textarea
                id="target-jd"
                rows={2}
                placeholder="Paste key requirements or job description snippet to align questions with specific employer expectations..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="text-xs resize-y"
              />
            </div>
          </CardContent>
        </Card>

        {/* Error Alert with Retry */}
        {errorMsg && (
          <Alert variant="destructive" className="border-destructive/40">
            <AlertCircle className="size-4" />
            <AlertTitle>Generation Error</AlertTitle>
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
              <span>{errorMsg}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={generate}
                disabled={loading}
                className="shrink-0 self-start sm:self-auto border-destructive/40 hover:bg-destructive/10"
              >
                <RefreshCw className={`size-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
                Retry Generation
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <Card className="border border-primary/20 bg-primary/5 p-8 text-center space-y-4">
            <RefreshCw className="size-8 text-primary animate-spin mx-auto" />
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">Generating Targeted Questions</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Analyzing your projects, technologies, and experience to engineer authentic
                interview questions...
              </p>
            </div>
          </Card>
        )}

        {/* Empty State: No Questions Generated Yet */}
        {!data && !loading && (
          <EmptyState
            title={
              hasResume
                ? "Ready to generate your interview questions"
                : "Upload your resume to begin"
            }
            description={
              hasResume
                ? `Click below to generate 12 personalized questions across Technical, Resume & Projects, Behavioral, and HR categories tailored to your background.`
                : "ResuMate grounds interview questions strictly in your real projects and tools. Upload your resume to begin practicing."
            }
            action={
              hasResume ? (
                <Button variant="hero" onClick={generate} disabled={loading} size="lg">
                  <MessagesSquare className="size-4" /> Generate my questions
                </Button>
              ) : (
                <Button variant="hero" asChild size="lg">
                  <Link to="/analyze">
                    <Upload className="size-4" /> Upload resume to analyze
                  </Link>
                </Button>
              )
            }
          />
        )}

        {/* Questions Display */}
        {data && !loading && (
          <div className="space-y-6">
            <Tabs defaultValue="Technical">
              <TabsList className="grid grid-cols-2 md:grid-cols-4 h-auto p-1 gap-1 bg-muted/70">
                {availableCategories.map(({ key, label, icon: Icon }) => {
                  const questionsList =
                    data[key] || (key === "Resume & Projects" ? data["Role-Specific"] : []) || [];
                  return (
                    <TabsTrigger
                      key={key}
                      value={key}
                      className="py-2.5 px-3 flex items-center justify-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="truncate">{label}</span>
                      <Badge variant="secondary" className="ml-1 text-[11px] px-1.5 py-0 h-4">
                        {questionsList.length}
                      </Badge>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {availableCategories.map(({ key, label }) => {
                const questionsList =
                  data[key] || (key === "Resume & Projects" ? data["Role-Specific"] : []) || [];

                return (
                  <TabsContent key={key} value={key} className="mt-4">
                    <Card className="shadow-sm border-border/80">
                      <CardHeader className="pb-3 border-b border-border/40">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <CardTitle className="text-lg font-semibold">
                              {label} Questions
                            </CardTitle>
                            <CardDescription className="text-xs">
                              {key === "Technical" &&
                                "Grounded in the languages, databases, and libraries listed on your resume."}
                              {key === "Resume & Projects" &&
                                "Targeted deep-dives into your specific listed projects, architecture, and internship experience."}
                              {key === "Behavioral" &&
                                "STAR-format questions evaluating problem-solving, collaboration, and debugging methodologies."}
                              {key === "HR & Situational" &&
                                "Questions evaluating career trajectory, continuous learning, and alignment with target role."}
                            </CardDescription>
                          </div>
                          <Badge variant="outline" className="self-start sm:self-auto font-normal">
                            {questionsList.length} questions
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="p-4 sm:p-6">
                        {questionsList.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground text-sm">
                            No questions found in this category. Click &quot;Regenerate
                            questions&quot; to refresh.
                          </div>
                        ) : (
                          <Accordion
                            type="multiple"
                            defaultValue={[`${key}-0`]}
                            className="space-y-3"
                          >
                            {questionsList.map((item, i) => {
                              const noteKey = `${key}-${i}`;
                              const isCopied = copiedKey === noteKey;

                              return (
                                <AccordionItem
                                  key={noteKey}
                                  value={noteKey}
                                  className="border rounded-lg px-4 bg-card/60 transition-colors data-[state=open]:bg-card data-[state=open]:border-primary/30"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <AccordionTrigger className="text-left font-semibold text-sm sm:text-base hover:no-underline py-4 flex-1">
                                      <span className="flex items-start gap-2.5">
                                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold mt-0.5">
                                          {i + 1}
                                        </span>
                                        <span className="text-foreground leading-snug">
                                          {item.q}
                                        </span>
                                      </span>
                                    </AccordionTrigger>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        copyQuestion(noteKey, item.q);
                                      }}
                                      title="Copy question"
                                    >
                                      {isCopied ? (
                                        <Check className="size-3.5 text-emerald-500" />
                                      ) : (
                                        <Copy className="size-3.5" />
                                      )}
                                    </Button>
                                  </div>

                                  <AccordionContent className="space-y-4 pt-1 pb-4">
                                    {/* How to answer coaching tip */}
                                    <div className="rounded-md bg-muted/60 p-3 text-xs sm:text-sm border border-border/50 space-y-1">
                                      <div className="flex items-center gap-1.5 font-semibold text-primary">
                                        <Lightbulb className="size-3.5 shrink-0" />
                                        <span>How to answer / Key talking points:</span>
                                      </div>
                                      <p className="text-muted-foreground leading-relaxed pl-5">
                                        {item.hint}
                                      </p>
                                    </div>

                                    {/* Practice answer textarea */}
                                    <div className="space-y-1.5">
                                      <div className="flex items-center justify-between">
                                        <Label
                                          htmlFor={`notes-${noteKey}`}
                                          className="text-xs font-medium text-foreground flex items-center gap-1.5"
                                        >
                                          <HelpCircle className="size-3.5 text-muted-foreground" />
                                          Your Practice Answer (Auto-saved)
                                        </Label>
                                        <div className="flex items-center gap-2">
                                          {notes[noteKey] && (
                                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                              Saved ✓
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <Textarea
                                        id={`notes-${noteKey}`}
                                        rows={3}
                                        placeholder="Outline your response using STAR (Situation, Task, Action, Result) or key architectural trade-offs..."
                                        value={notes[noteKey] ?? ""}
                                        onChange={(e) => handleNoteChange(noteKey, e.target.value)}
                                        className="text-sm font-sans resize-y"
                                      />
                                      <div className="flex items-center justify-between pt-1">
                                        <p className="text-[11px] text-muted-foreground">
                                          Write your actual experience without invented metrics.
                                        </p>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="outline"
                                          disabled={
                                            evaluatingKeys[noteKey] ||
                                            !notes[noteKey] ||
                                            notes[noteKey].trim().length < 5
                                          }
                                          onClick={() => handleEvaluateAnswer(noteKey, item.q, cat)}
                                          className="gap-1.5 text-xs h-8 border-primary/30 hover:bg-primary/5 hover:text-primary"
                                        >
                                          {evaluatingKeys[noteKey] ? (
                                            <>
                                              <RefreshCw className="size-3 animate-spin text-primary" />
                                              Evaluating Answer...
                                            </>
                                          ) : (
                                            <>
                                              <Sparkles className="size-3 text-primary" />
                                              Get AI Evaluation & Follow-up
                                            </>
                                          )}
                                        </Button>
                                      </div>
                                    </div>

                                    {/* AI Answer Evaluation Result */}
                                    {evaluations[noteKey] && (
                                      <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3.5 text-xs sm:text-sm">
                                        <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                                          <div className="flex items-center gap-2">
                                            <Sparkles className="size-4 text-primary" />
                                            <span className="font-display font-semibold text-foreground">
                                              AI Feedback & Evaluation
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Badge
                                              variant={
                                                evaluations[noteKey].rating === "Excellent" ||
                                                evaluations[noteKey].rating === "Strong"
                                                  ? "default"
                                                  : "secondary"
                                              }
                                              className="text-xs"
                                            >
                                              {evaluations[noteKey].rating} (
                                              {evaluations[noteKey].score}/100)
                                            </Badge>
                                          </div>
                                        </div>

                                        {/* STAR Breakdown */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                                          <div className="bg-background/80 p-2 rounded border text-[11px] space-y-0.5">
                                            <span className="font-bold text-foreground block uppercase text-[10px] tracking-wider text-muted-foreground">
                                              Situation
                                            </span>
                                            <p className="text-muted-foreground">
                                              {evaluations[noteKey].starEvaluation.situation}
                                            </p>
                                          </div>
                                          <div className="bg-background/80 p-2 rounded border text-[11px] space-y-0.5">
                                            <span className="font-bold text-foreground block uppercase text-[10px] tracking-wider text-muted-foreground">
                                              Task
                                            </span>
                                            <p className="text-muted-foreground">
                                              {evaluations[noteKey].starEvaluation.task}
                                            </p>
                                          </div>
                                          <div className="bg-background/80 p-2 rounded border text-[11px] space-y-0.5">
                                            <span className="font-bold text-foreground block uppercase text-[10px] tracking-wider text-muted-foreground">
                                              Action
                                            </span>
                                            <p className="text-muted-foreground">
                                              {evaluations[noteKey].starEvaluation.action}
                                            </p>
                                          </div>
                                          <div className="bg-background/80 p-2 rounded border text-[11px] space-y-0.5">
                                            <span className="font-bold text-foreground block uppercase text-[10px] tracking-wider text-muted-foreground">
                                              Result
                                            </span>
                                            <p className="text-muted-foreground">
                                              {evaluations[noteKey].starEvaluation.result}
                                            </p>
                                          </div>
                                        </div>

                                        <div className="grid sm:grid-cols-2 gap-3 pt-1">
                                          <div>
                                            <span className="font-semibold text-emerald-600 dark:text-emerald-400 block mb-1">
                                              ✓ Strengths Observed:
                                            </span>
                                            <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-1 text-xs">
                                              {evaluations[noteKey].strengths.map((s, idx) => (
                                                <li key={idx}>{s}</li>
                                              ))}
                                            </ul>
                                          </div>
                                          <div>
                                            <span className="font-semibold text-amber-600 dark:text-amber-400 block mb-1">
                                              ▲ Actionable Improvements:
                                            </span>
                                            <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-1 text-xs">
                                              {evaluations[noteKey].improvements.map((imp, idx) => (
                                                <li key={idx}>{imp}</li>
                                              ))}
                                            </ul>
                                          </div>
                                        </div>

                                        {/* Dynamic Follow-Up Question */}
                                        {evaluations[noteKey].followUpQuestion && (
                                          <div className="rounded-md bg-background border p-3 space-y-1.5 mt-2">
                                            <div className="flex items-center gap-1.5 text-primary font-semibold text-xs">
                                              <MessagesSquare className="size-3.5" />
                                              <span>Interviewer Follow-Up Question:</span>
                                            </div>
                                            <p className="font-medium text-foreground text-xs sm:text-sm pl-5">
                                              "{evaluations[noteKey].followUpQuestion}"
                                            </p>
                                            <div className="pl-5 pt-1">
                                              <Textarea
                                                rows={2}
                                                placeholder="Answer the follow-up question here to deepen your response..."
                                                value={notes[`${noteKey}-followup`] ?? ""}
                                                onChange={(e) =>
                                                  handleNoteChange(
                                                    `${noteKey}-followup`,
                                                    e.target.value,
                                                  )
                                                }
                                                className="text-xs bg-muted/30"
                                              />
                                            </div>
                                          </div>
                                        )}

                                        <p className="text-[11px] text-muted-foreground italic pt-1">
                                          💡 Coach Note: {evaluations[noteKey].coachingAdvice}
                                        </p>
                                      </div>
                                    )}
                                  </AccordionContent>
                                </AccordionItem>
                              );
                            })}
                          </Accordion>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                );
              })}
            </Tabs>
          </div>
        )}
      </div>
    </AppShell>
  );
}
