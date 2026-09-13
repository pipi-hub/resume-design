import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Calendar,
  Check,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  Download,
  FileSearch,
  FileText,
  HelpCircle,
  Loader2,
  MinusCircle,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { ScoreRing } from "@/components/common/ScoreRing";
import { BulletImprover } from "@/components/app/BulletImprover";
import { useExplain, useCareerContext } from "@/context/app-context";
import { resumeService } from "@/services/resumeService";
import type { AnalysisResult, RequirementMatch } from "@/server/gemini";

export const Route = createFileRoute("/_authenticated/analysis")({
  validateSearch: (search: Record<string, unknown>): { id?: string | undefined } => ({
    id: typeof search["id"] === "string" ? (search["id"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Your Resume Analysis — ResuMate" },
      {
        name: "description",
        content: "ATS score, job match, keyword gaps and evidence-based AI recommendations.",
      },
      { property: "og:title", content: "Your Resume Analysis — ResuMate" },
      { property: "og:description", content: "Evidence-based, factual resume analysis." },
    ],
  }),
  component: Analysis,
});

const statusStyle: Record<string, { icon: typeof CheckCircle2; cls: string }> = {
  Good: { icon: CheckCircle2, cls: "text-[#10B981]" },
  "Needs Improvement": { icon: CircleAlert, cls: "text-[#F59E0B]" },
  Missing: { icon: XCircle, cls: "text-[#EF4444]" },
};

const matchStateConfig: Record<
  RequirementMatch["status"],
  { label: string; badgeCls: string; icon: typeof CheckCircle2; iconCls: string }
> = {
  Demonstrated: {
    label: "Demonstrated",
    badgeCls:
      "bg-[#ECFDF5] text-[#059669] border-[#A7F3D0] font-medium dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
    icon: CheckCircle2,
    iconCls: "text-[#10B981]",
  },
  "Partially Demonstrated": {
    label: "Partially Demonstrated",
    badgeCls:
      "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A] font-medium dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
    icon: AlertTriangle,
    iconCls: "text-[#F59E0B]",
  },
  "Not Demonstrated": {
    label: "Not Demonstrated",
    badgeCls:
      "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA] font-medium dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800",
    icon: XCircle,
    iconCls: "text-[#EF4444]",
  },
};

function Analysis() {
  const search = useSearch({ from: "/_authenticated/analysis" });
  const explain = useExplain();
  const career = useCareerContext();
  const [loading, setLoading] = useState(true);
  const [analysisTitle, setAnalysisTitle] = useState(career.targetRole || "Software Engineer");
  const [analysisCompany, setAnalysisCompany] = useState(career.company || "");
  const [data, setData] = useState<AnalysisResult | null>(
    !search.id && career.latestAnalysis ? career.latestAnalysis : null,
  );
  const [showScoreExplanation, setShowScoreExplanation] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    async function loadData() {
      setLoading(true);
      try {
        if (search.id) {
          const row = await resumeService.getAnalysisById(search.id);
          if (!isCurrent) return;
          if (row) {
            if (row.resume_name) setAnalysisTitle(row.resume_name);
            const reportData = resumeService.parseAnalysisBreakdown(row);
            if (reportData) {
              setData(reportData);
              career.setLatestAnalysis(reportData, search.id);
              setLoading(false);
              return;
            }
          }
        }

        // Try getting from latest DB analysis or session storage
        const latest = await resumeService.getLatestAnalysis();
        if (!isCurrent) return;
        if (latest) {
          if (latest.resume_name) setAnalysisTitle(latest.resume_name);
          const reportData = resumeService.parseAnalysisBreakdown(latest);
          if (reportData) {
            setData(reportData);
            career.setLatestAnalysis(reportData, latest.id);
            setLoading(false);
            return;
          }
        }

        const cached = sessionStorage.getItem("resumate_latest_analysis_data");
        if (cached && isCurrent) {
          const parsed = JSON.parse(cached) as AnalysisResult;
          setData(parsed);
          career.setLatestAnalysis(parsed);
        }
      } catch (err) {
        console.warn("Could not load stored analysis:", err);
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    }

    void loadData();
    return () => {
      isCurrent = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.id]);

  function handleDownloadReport() {
    if (!data) return;

    const reportText = `
RESUMATE - EVIDENCE-BASED RESUME ANALYSIS REPORT
=================================================
Target Position: ${analysisTitle} ${analysisCompany ? `at ${analysisCompany}` : ""}
Generated: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}

SCORES:
- ATS Compatibility: ${data.atsScore}%
- Job Requirement Match: ${data.jobMatch}%
- Resume Quality: ${data.qualityScore}%

ATS BREAKDOWN:
${data.atsBreakdown.map((b) => `• ${b.label}: ${b.score}% — ${b.note}`).join("\n")}

JOB REQUIREMENTS MATCH STATUS:
${(data.requirementMatches || [])
  .map((r) => `• [${r.status.toUpperCase()}] ${r.requirement}: ${r.evidence} (${r.note})`)
  .join("\n")}

DEMONSTRATED KEYWORDS & SKILLS:
${data.keywordsHave.join(", ")}

MISSING TARGET SKILLS:
${data.keywordsMissing.join(", ")}

SECTION AUDIT:
${data.sectionStatus.map((s) => `• ${s.section}: ${s.status}`).join("\n")}

EVIDENCE-BASED AI RECOMMENDATIONS:
${data.suggestions
  .map(
    (s, i) =>
      `${i + 1}. ${s.title}\n   Problem: ${s.problem}\n   Evidence: ${s.evidence || "Observed in resume"}\n   Why it matters: ${s.why}\n   Safe Actionable Fix: ${s.fix}\n`,
  )
  .join("\n")}
=================================================
ResuMate AI — Fact-Checked Career Assistant
`;

    const blob = new Blob([reportText.trim()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resumate-analysis-${analysisTitle.toLowerCase().replace(/\s+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Analysis report downloaded ✓");
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin text-primary" /> Loading your evidence-based
          analysis report…
        </div>
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell>
        <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4 text-center">
          <FileSearch className="size-12 text-muted-foreground" />
          <h2 className="font-display text-xl font-semibold">No Analysis Found</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Upload your resume or paste a job description to generate a detailed, evidence-based ATS
            analysis.
          </p>
          <Button variant="hero" asChild>
            <Link to="/analyze">Analyze a Resume</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  // Determine readiness status
  const jobMatchScore = data.jobMatch || 0;
  const atsScore = data.atsScore || 0;

  let readinessVerdict = "Developing Candidate — Targeted Project Work Needed";
  let readinessBadge = "secondary";
  if (jobMatchScore >= 85 && atsScore >= 80) {
    readinessVerdict = "Competitive Candidate — High Application Readiness";
    readinessBadge = "default";
  } else if (jobMatchScore >= 70 && atsScore >= 70) {
    readinessVerdict = "Promising Candidate — Targeted Resume Refinements Recommended";
    readinessBadge = "secondary";
  }

  const demonstratedReqs = (data.requirementMatches || []).filter(
    (r) => r.status === "Demonstrated",
  );
  const missingReqs = (data.requirementMatches || []).filter(
    (r) => r.status === "Not Demonstrated",
  );

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Top Resume & Analysis Metadata Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-card/70 px-5 py-3.5 shadow-sm">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-primary" />
              <span className="text-muted-foreground">Resume:</span>
              <span className="font-semibold text-foreground">
                {career.activeResumeName || analysisTitle || "Active Resume"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="size-4 text-primary" />
              <span className="text-muted-foreground">Target Role:</span>
              <span className="font-semibold text-foreground">{analysisTitle}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="size-3.5" />
            <span>
              Analyzed:{" "}
              {new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        <PageHeader
          title="Your Resume Analysis"
          subtitle={`Factual, evidence-based assessment for ${analysisTitle}${analysisCompany ? ` at ${analysisCompany}` : ""}.`}
          action={
            <>
              <Button variant="outline" onClick={handleDownloadReport}>
                <Download /> Download report
              </Button>
              <Button variant="hero" asChild>
                <Link to="/skill-gap">See skill gaps</Link>
              </Button>
            </>
          }
        />

        {/* Job Readiness Summary Banner */}
        <div className="rounded-2xl border bg-card p-6 shadow-card">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant={readinessBadge === "default" ? "default" : "secondary"}>
                  {jobMatchScore >= 75 ? "Application Ready" : "Refinement Advised"}
                </Badge>
                <span className="text-xs text-muted-foreground">Target Role: {analysisTitle}</span>
              </div>
              <h2 className="mt-2 font-display text-xl font-bold">{readinessVerdict}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Based on verified skills found in your resume compared directly with the job
                requirements.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/applications" search={{ track: "true" }}>
                  <Briefcase className="size-3.5 mr-1.5" />
                  Track Application
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/interview">Practice Interview</Link>
              </Button>
              <Button variant="hero" size="sm" asChild>
                <Link to="/cover-letter">Generate Cover Letter</Link>
              </Button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 border-t pt-5 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Strong Demonstrated Areas ({demonstratedReqs.length})
              </p>
              <p className="mt-1 text-xs text-foreground/90">
                {demonstratedReqs
                  .slice(0, 3)
                  .map((r) => r.requirement)
                  .join(", ") ||
                  data.keywordsHave.slice(0, 4).join(", ") ||
                  "Core technical skills present"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Top Skill Gaps ({missingReqs.length})
              </p>
              <p className="mt-1 text-xs text-foreground/90">
                {missingReqs
                  .slice(0, 3)
                  .map((r) => r.requirement)
                  .join(", ") ||
                  data.keywordsMissing.slice(0, 4).join(", ") ||
                  "No major critical gaps"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Resume Action Points
              </p>
              <p className="mt-1 text-xs text-foreground/90">
                {data.suggestions.length} clear evidence-based improvements available below
              </p>
            </div>
          </div>
        </div>

        {/* Top 3 Score Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              v: data.atsScore,
              label: "ATS Compatibility",
              tag: data.atsScore >= 80 ? "Good" : data.atsScore >= 60 ? "Moderate" : "Needs Work",
              tone: "primary" as const,
              hint: explain(
                "How easily hiring software can read your resume.",
                "Parser compatibility, standard headers, and layout structure.",
              ),
            },
            {
              v: data.jobMatch,
              label: "Job Match",
              tag:
                data.jobMatch >= 80
                  ? "Strong Match"
                  : data.jobMatch >= 60
                    ? "Fair Match"
                    : "Low Match",
              tone: "violet" as const,
              hint: explain(
                "How closely your experience satisfies required skills.",
                "Weighted percentage of demonstrated and partially demonstrated job requirements.",
              ),
            },
            {
              v: data.qualityScore,
              label: "Resume Quality",
              tag: data.qualityScore >= 80 ? "Good" : "Average",
              tone: "success" as const,
              hint: explain(
                "How clear and professional your writing looks.",
                "Action verb strength, section structure, and clarity.",
              ),
            },
          ].map((s) => (
            <Card key={s.label} className="shadow-card">
              <CardContent className="flex flex-col items-center p-6">
                <ScoreRing value={s.v} tone={s.tone} suffix="%" />
                <p className="mt-2 font-display font-semibold">{s.label}</p>
                <Badge variant="secondary" className="mt-1">
                  {s.tag}
                </Badge>
                <p className="mt-3 text-center text-xs text-muted-foreground">{s.hint}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Resume Health Visual Checks Section */}
        <Card className="shadow-card border-border/80">
          <CardContent className="p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4">
              <div className="flex items-center gap-2.5">
                <Activity className="size-5 text-primary" />
                <div>
                  <h2 className="font-display text-lg font-semibold">Resume Health</h2>
                  <p className="text-xs text-muted-foreground">
                    Comprehensive visual health check of structural, content, and ATS signals.
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="w-fit">
                {data.atsScore >= 75 && data.qualityScore >= 75
                  ? "Healthy Profile"
                  : "Attention Recommended"}
              </Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Keyword Coverage */}
              <div className="rounded-xl border bg-card/60 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">Keyword Coverage</span>
                  <span className="font-bold text-primary">
                    {data.keywordsHave.length}/
                    {data.keywordsHave.length + data.keywordsMissing.length} Skills
                  </span>
                </div>
                <Progress
                  value={
                    (data.keywordsHave.length /
                      Math.max(1, data.keywordsHave.length + data.keywordsMissing.length)) *
                    100
                  }
                  className="h-2"
                />
                <p className="text-[11px] text-muted-foreground">
                  {data.keywordsMissing.length === 0
                    ? "Full keyword saturation for target role"
                    : `${data.keywordsMissing.length} target keywords missing from resume`}
                </p>
              </div>

              {/* Formatting & Readability */}
              <div className="rounded-xl border bg-card/60 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">Formatting & Readability</span>
                  <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-3.5" /> High Standard
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-snug">
                  {data.sectionStatus.filter((s) => s.status === "Good").length} of{" "}
                  {data.sectionStatus.length} standard sections verified clean and single-column ATS
                  compliant.
                </p>
              </div>

              {/* Experience Impact & Metrics */}
              <div className="rounded-xl border bg-card/60 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">Experience Impact & Metrics</span>
                  <span
                    className={`flex items-center gap-1 font-semibold ${
                      data.qualityScore >= 75
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {data.qualityScore >= 75 ? (
                      <CheckCircle2 className="size-3.5" />
                    ) : (
                      <AlertTriangle className="size-3.5" />
                    )}
                    {data.qualityScore >= 75 ? "Impact Evident" : "Needs Metrics"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-snug">
                  {data.qualityScore >= 75
                    ? "Strong action verbs and quantified achievements detected."
                    : "Add verifiable numbers, percentages, and scale to your bullet points."}
                </p>
              </div>
            </div>

            {/* Strengths & Areas to Improve Grid */}
            <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t">
              {/* Strengths */}
              <div className="space-y-2.5">
                <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-4" /> Key Strengths
                </h3>
                <ul className="space-y-2 text-xs text-foreground/90">
                  <li className="flex items-start gap-2">
                    <Check className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      ATS Parser compatibility confirmed with standard headers and clean hierarchy.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      {demonstratedReqs.length} core requirements directly evidenced from your
                      experience.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      {data.keywordsHave.slice(0, 3).join(", ")} demonstrated with verified context.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Areas to Improve */}
              <div className="space-y-2.5">
                <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  <CircleAlert className="size-4" /> Areas to Improve
                </h3>
                <ul className="space-y-2 text-xs text-foreground/90">
                  {missingReqs.length > 0 ? (
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        Missing {missingReqs.length} target qualifications (
                        {missingReqs
                          .slice(0, 2)
                          .map((r) => r.requirement)
                          .join(", ")}
                        ).
                      </span>
                    </li>
                  ) : null}
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      {data.suggestions[0]?.problem ||
                        "Quantify outcomes with concrete project metrics."}
                    </span>
                  </li>
                  {data.keywordsMissing.length > 0 && (
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        Integrate {data.keywordsMissing.slice(0, 3).join(", ")} where genuinely
                        experienced.
                      </span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Score Explanation Accordion */}
        <Card className="shadow-card border-dashed">
          <CardContent className="p-5">
            <button
              onClick={() => setShowScoreExplanation((prev) => !prev)}
              className="flex w-full items-center justify-between text-left text-sm font-semibold text-foreground"
            >
              <span className="flex items-center gap-2">
                <HelpCircle className="size-4 text-primary" />
                Why did I get these scores? (Transparent Score Breakdown)
              </span>
              <span className="text-xs text-primary underline">
                {showScoreExplanation ? "Hide Details" : "Show Breakdown"}
              </span>
            </button>
            {showScoreExplanation && (
              <div className="mt-4 grid gap-4 border-t pt-4 text-xs text-muted-foreground sm:grid-cols-3">
                <div className="space-y-1 rounded-lg bg-muted/40 p-3">
                  <p className="font-semibold text-foreground">
                    ATS Compatibility ({data.atsScore}%)
                  </p>
                  <p>
                    Evaluates parseability of text, standard headings (Skills, Projects, Education),
                    contact data, and keyword match density.
                  </p>
                </div>
                <div className="space-y-1 rounded-lg bg-muted/40 p-3">
                  <p className="font-semibold text-foreground">
                    Job Requirement Match ({data.jobMatch}%)
                  </p>
                  <p>
                    Compares your demonstrated skills and responsibilities against each explicit
                    requirement in the job posting.
                  </p>
                </div>
                <div className="space-y-1 rounded-lg bg-muted/40 p-3">
                  <p className="font-semibold text-foreground">
                    Resume Quality ({data.qualityScore}%)
                  </p>
                  <p>
                    Audits strong action verbs, quantifiable metrics, absence of first-person
                    pronouns, and structured formatting.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Requirement & Semantic Skill Match States */}
        {data.requirementMatches && data.requirementMatches.length > 0 && (
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                    <ShieldCheck className="size-5 text-primary" /> Requirement & Skill Match Status
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Evaluates semantic understanding — recognizes skills demonstrated in context
                    without demanding exact phrasing.
                  </p>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs sm:mt-0">
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-success">
                    <CheckCircle2 className="size-3.5" /> Demonstrated
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="size-3.5" /> Partial
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2.5 py-1 text-destructive">
                    <XCircle className="size-3.5" /> Not Demonstrated
                  </span>
                </div>
              </div>

              <div className="mt-5 divide-y rounded-xl border">
                {data.requirementMatches.map((req) => {
                  const cfg = matchStateConfig[req.status] || matchStateConfig["Demonstrated"];
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={req.requirement}
                      className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div className="space-y-1 sm:max-w-2xl">
                        <div className="flex items-center gap-2">
                          <Icon className={`size-4.5 shrink-0 ${cfg.iconCls}`} />
                          <span className="font-semibold text-sm">{req.requirement}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground/80">Evidence: </span>
                          {req.evidence}
                        </p>
                        {req.note && (
                          <p className="text-xs text-muted-foreground/90 italic">{req.note}</p>
                        )}
                      </div>
                      <Badge variant="outline" className={`w-fit shrink-0 ${cfg.badgeCls}`}>
                        {cfg.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Keyword Wording Optimization (Semantic Distinction) */}
        {data.keywordWordingGaps && data.keywordWordingGaps.length > 0 && (
          <Card className="shadow-card border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <h2 className="flex items-center gap-2 font-display text-base font-semibold text-primary">
                <Sparkles className="size-4.5" /> Keyword Wording Optimization
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                You demonstrated these core competencies, but using standard industry terms helps
                simple keyword-matching ATS parsers find you faster.
              </p>
              <div className="mt-4 space-y-3">
                {data.keywordWordingGaps.map((gap) => (
                  <div
                    key={gap.concept}
                    className="rounded-lg bg-background p-3 text-xs border shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="font-semibold text-foreground">
                        Concept: {gap.concept} (Demonstrated)
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {gap.recommendedKeywords.map((kw) => (
                          <Badge key={kw} variant="secondary" className="text-[11px]">
                            + {kw}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <p className="mt-1 text-muted-foreground">
                      Resume text: &ldquo;{gap.resumeEvidence}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ATS Compatibility Breakdown */}
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">ATS Compatibility Breakdown</h2>
              <span className="font-display text-2xl font-bold">{data.atsScore}%</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {explain(
                "This shows how well hiring software can read and match your resume.",
                "Composite of parsing, keyword coverage, section detection and readability metrics.",
              )}
            </p>
            <div className="mt-5 space-y-5">
              {data.atsBreakdown.map((b) => {
                const l = b.label.toLowerCase();
                const indicatorCls = l.includes("keyword")
                  ? "bg-[#8B7CF6]"
                  : l.includes("format") || l.includes("structure")
                    ? "bg-[#10B981]"
                    : l.includes("content") || l.includes("impact")
                      ? "bg-[#475569]"
                      : "bg-[#6366F1]";

                return (
                  <div key={b.label}>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-[#1E293B] dark:text-foreground">
                        {b.label}
                      </span>
                      <span className="font-semibold text-[#1E293B] dark:text-foreground">
                        {b.score}%
                      </span>
                    </div>
                    <Progress
                      value={b.score}
                      className="mt-1.5 h-2"
                      indicatorClassName={indicatorCls}
                    />
                    <p className="mt-1.5 text-xs text-[#64748B] dark:text-muted-foreground">
                      {b.note}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Keywords Matched vs Missing */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-[#1E293B] dark:text-foreground">
                  <CheckCircle2 className="size-4.5 text-[#10B981]" /> Matched Keywords
                </h2>
                <Badge variant="success" className="font-medium">
                  {data.keywordsHave.length} Found
                </Badge>
              </div>
              <p className="mt-1 text-xs text-[#64748B] dark:text-muted-foreground">
                Keywords and technical proficiencies successfully parsed and matched against the
                role.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {data.keywordsHave.map((k) => (
                  <span
                    key={k}
                    className="rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] px-2.5 py-1 text-xs font-medium text-[#059669] dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-[#1E293B] dark:text-foreground">
                  <MinusCircle className="size-4.5 text-[#EF4444]" /> Missing Keywords
                </h2>
                <Badge variant="destructive" className="font-medium">
                  {data.keywordsMissing.length} Missing
                </Badge>
              </div>
              <p className="mt-1 text-xs text-[#64748B] dark:text-muted-foreground">
                High-frequency requirements present in the job posting but not identified in your
                text.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {data.keywordsMissing.length > 0 ? (
                  data.keywordsMissing.map((k) => (
                    <span
                      key={k}
                      className="rounded-lg bg-[#FEF2F2] border border-[#FECACA] px-2.5 py-1 text-xs font-medium text-[#DC2626] dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800"
                    >
                      {k}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-[#64748B]">
                    All core target skills are demonstrated in your resume.
                  </span>
                )}
              </div>
              <p className="mt-4 text-xs text-[#64748B] dark:text-muted-foreground">
                Add missing skills naturally if you have real experience with them. Never fabricate
                skills to raise scores.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Skill Gap Preview Card */}
        <Card className="shadow-card border-amber-500/30 bg-card">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400" />
                  <h2 className="font-display text-lg font-semibold text-foreground">
                    Skill Gap Overview
                  </h2>
                  <Badge
                    variant="secondary"
                    className="border-amber-500/30 text-amber-700 dark:text-amber-400"
                  >
                    {data.keywordsMissing.length} Target Gaps
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground max-w-2xl">
                  Competencies required for this position that need development. Access personalized
                  roadmaps, project suggestions, and learning paths.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="shrink-0 gap-1.5 border-primary/30 hover:bg-primary/5 hover:text-primary"
              >
                <Link to="/skill-gap">
                  View Full Skill Gap Analysis
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
            {data.keywordsMissing.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {data.keywordsMissing.slice(0, 8).map((skill) => (
                  <Badge
                    key={skill}
                    variant="secondary"
                    className="px-3 py-1 text-xs font-medium border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                No major skill gaps identified for this role profile!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Section Audit */}
        <Card className="shadow-card">
          <CardContent className="p-6">
            <h2 className="font-display text-lg font-semibold">Resume Section Analysis</h2>
            <ul className="mt-4 divide-y">
              {data.sectionStatus.map((s) => {
                const st = statusStyle[s.status] ?? { icon: CheckCircle2, cls: "" };
                return (
                  <li key={s.section} className="flex items-center justify-between py-3">
                    <span className="text-sm font-medium">{s.section}</span>
                    <span className={`flex items-center gap-2 text-sm font-semibold ${st.cls}`}>
                      <st.icon className="size-4" /> {s.status}
                    </span>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        {/* Evidence-Based AI Recommendations */}
        <section aria-labelledby="rec">
          <div className="flex items-center justify-between">
            <div>
              <h2 id="rec" className="font-display text-lg font-semibold">
                Recommendations
              </h2>
              <p className="text-xs text-muted-foreground">
                Actionable recommendations prioritized by impact. Placeholders like{" "}
                <code className="rounded bg-muted px-1">[actual number]</code> indicate where to
                insert your own verified metrics.
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-4">
            {data.suggestions.map((s, idx) => {
              const priority =
                idx === 0
                  ? {
                      label: "High Priority",
                      cls: "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA] dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800",
                    }
                  : idx < 3
                    ? {
                        label: "Medium Priority",
                        cls: "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A] dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
                      }
                    : {
                        label: "Low Priority",
                        cls: "bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] dark:bg-muted dark:text-muted-foreground dark:border-border",
                      };

              return (
                <Card key={s.title}>
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h3 className="flex items-center gap-2 font-display font-semibold text-[#1E293B] dark:text-foreground">
                        <Sparkles className="size-4 text-[#6366F1]" /> {s.title}
                      </h3>
                      <Badge
                        variant="outline"
                        className={`w-fit text-[11px] font-medium ${priority.cls}`}
                      >
                        {priority.label}
                      </Badge>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-lg bg-[#F8FAFC] border border-[#EEF2F7] p-3 dark:bg-muted/30 dark:border-border">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-muted-foreground">
                          Problem
                        </p>
                        <p className="mt-1 text-xs text-[#1E293B] leading-relaxed dark:text-foreground">
                          {s.problem}
                        </p>
                      </div>
                      <div className="rounded-lg bg-[#F8FAFC] border border-[#EEF2F7] p-3 dark:bg-muted/30 dark:border-border">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-muted-foreground">
                          Evidence from Resume
                        </p>
                        <p className="mt-1 text-xs italic text-[#1E293B]/90 leading-relaxed dark:text-foreground/90">
                          {s.evidence || "Resume observation"}
                        </p>
                      </div>
                      <div className="rounded-lg bg-[#F8FAFC] border border-[#EEF2F7] p-3 dark:bg-muted/30 dark:border-border">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-muted-foreground">
                          Why it matters
                        </p>
                        <p className="mt-1 text-xs text-[#1E293B] leading-relaxed dark:text-foreground">
                          {s.why}
                        </p>
                      </div>
                      <div className="rounded-lg bg-[#F5F3FF] border border-[#EDE9FE] p-3 dark:bg-primary/5 dark:border-primary/20">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6366F1]">
                          Safe Suggestion
                        </p>
                        <p className="mt-1 text-xs font-medium text-[#1E293B] leading-relaxed dark:text-foreground">
                          {s.fix}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <Button
                        variant="soft"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard?.writeText(`${s.title}\nFix: ${s.fix}`);
                          toast.success("Suggestion copied to clipboard ✓", {
                            description: "Paste and customize with your own true figures.",
                          });
                        }}
                      >
                        Copy Suggestion Template
                      </Button>
                      <span className="text-[11px] text-[#94A3B8]">
                        * Substitute brackets with your verified metrics only.
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Final Application Checklist */}
        <Card className="shadow-card border-primary/20 bg-card">
          <CardContent className="p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
                  <ClipboardCheck className="size-5 text-primary" /> Before Applying — Readiness
                  Checklist
                </h2>
                <p className="text-xs text-muted-foreground">
                  Verified against your resume analysis for {analysisTitle}. Ensure every item is
                  satisfied before submitting your application.
                </p>
              </div>
              <Badge variant="outline" className="w-fit border-primary/30 text-primary">
                Application Quality Gate
              </Badge>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                {
                  id: "tailored",
                  label: "Resume tailored to target job requirements",
                  detail: `Job Match is currently ${data.jobMatch}% (${data.jobMatch >= 65 ? "Solid match" : "Further tailoring recommended"})`,
                  auto: data.jobMatch >= 65,
                },
                {
                  id: "requirements",
                  label: "Key job requirements demonstrated with evidence",
                  detail: `${demonstratedReqs.length} requirements explicitly evidenced in resume`,
                  auto: demonstratedReqs.length > 0,
                },
                {
                  id: "grounded",
                  label: "No unsupported claims or unverified metrics",
                  detail: "All figures and tech stacks reflect your real experience",
                  auto: true,
                },
                {
                  id: "contact",
                  label: "Complete contact information & professional links",
                  detail:
                    data.sectionStatus.find((s) => s.section === "Contact Info")?.status === "Good"
                      ? "Contact info format looks clean & complete"
                      : "Check email, phone, location & LinkedIn URL",
                  auto:
                    data.sectionStatus.find((s) => s.section === "Contact Info")?.status === "Good",
                },
                {
                  id: "projects",
                  label: "Projects clearly described with context & results",
                  detail:
                    data.sectionStatus.find((s) => s.section === "Projects")?.status === "Good"
                      ? "Projects section has strong action-driven points"
                      : "Add measurable impact to project descriptions",
                  auto: data.sectionStatus.find((s) => s.section === "Projects")?.status === "Good",
                },
                {
                  id: "skillGaps",
                  label: "Skill gaps understood & study plan acknowledged",
                  detail:
                    missingReqs.length === 0
                      ? "No missing core requirements identified"
                      : `${missingReqs.length} gaps to address or bridge in your interview`,
                  auto: missingReqs.length === 0,
                },
                {
                  id: "coverLetter",
                  label: "Tailored cover letter generated & reviewed",
                  detail: "Highlighting candidate strengths for " + (analysisCompany || "the role"),
                  auto: false,
                  action: { to: "/cover-letter", text: "Create Letter" },
                },
                {
                  id: "interview",
                  label: "Technical & behavioral interview questions practiced",
                  detail: "Ready to discuss projects and resume claims confidently",
                  auto: false,
                  action: { to: "/interview", text: "Practice Now" },
                },
              ].map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 rounded-lg border bg-muted/20 p-3.5 transition-colors hover:bg-muted/40"
                >
                  <div
                    className={`mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded border ${
                      item.auto
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/40 bg-background"
                    }`}
                  >
                    {item.auto && <Check className="size-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-foreground">{item.label}</p>
                      {item.action && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-[11px] text-primary"
                          asChild
                        >
                          <Link to={item.action.to}>{item.action.text}</Link>
                        </Button>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bullet Improver */}
        <BulletImprover />
      </div>
    </AppShell>
  );
}
