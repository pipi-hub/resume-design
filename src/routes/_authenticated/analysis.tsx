import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  CircleAlert,
  Download,
  Loader2,
  MinusCircle,
  Sparkles,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { ScoreRing } from "@/components/common/ScoreRing";
import { BulletImprover } from "@/components/app/BulletImprover";
import { useExplain } from "@/context/app-context";
import { resumeService } from "@/services/resumeService";
import type { AnalysisResult } from "@/server/gemini";
import {
  atsBreakdown as defaultAtsBreakdown,
  keywordsHave as defaultKeywordsHave,
  keywordsMissing as defaultKeywordsMissing,
  sectionStatus as defaultSectionStatus,
  suggestions as defaultSuggestions,
} from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/analysis")({
  validateSearch: (search: Record<string, unknown>): { id?: string | undefined } => ({
    id: typeof search["id"] === "string" ? (search["id"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Your Resume Analysis — ResuMate" },
      {
        name: "description",
        content: "ATS score, job match, keyword gaps and AI recommendations for your resume.",
      },
      { property: "og:title", content: "Your Resume Analysis — ResuMate" },
      { property: "og:description", content: "See exactly what to fix before you apply." },
    ],
  }),
  component: Analysis,
});

const statusStyle: Record<string, { icon: typeof CheckCircle2; cls: string }> = {
  Good: { icon: CheckCircle2, cls: "text-success" },
  "Needs Improvement": { icon: CircleAlert, cls: "text-warning" },
  Missing: { icon: XCircle, cls: "text-destructive" },
};

function Analysis() {
  const search = useSearch({ from: "/_authenticated/analysis" });
  const explain = useExplain();
  const [loading, setLoading] = useState(true);
  const [analysisTitle, setAnalysisTitle] = useState("Software Engineer");
  const [analysisCompany, setAnalysisCompany] = useState("");
  const [data, setData] = useState<AnalysisResult>({
    atsScore: 87,
    jobMatch: 82,
    qualityScore: 84,
    atsBreakdown: defaultAtsBreakdown,
    keywordsHave: defaultKeywordsHave,
    keywordsMissing: defaultKeywordsMissing,
    sectionStatus: defaultSectionStatus,
    suggestions: defaultSuggestions,
    skillGaps: [],
  });

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        if (search.id) {
          const row = await resumeService.getAnalysisById(search.id);
          if (row) {
            if (row.job_title) setAnalysisTitle(row.job_title);
            if (row.company) setAnalysisCompany(row.company);
            if (row.report && typeof row.report === "object") {
              setData(row.report as unknown as AnalysisResult);
              setLoading(false);
              return;
            }
          }
        }

        // Try getting from latest DB analysis or session storage
        const latest = await resumeService.getLatestAnalysis();
        if (latest && latest.report && typeof latest.report === "object") {
          if (latest.job_title) setAnalysisTitle(latest.job_title);
          if (latest.company) setAnalysisCompany(latest.company);
          setData(latest.report as unknown as AnalysisResult);
        } else {
          const cached = sessionStorage.getItem("resumate_latest_analysis_data");
          if (cached) {
            setData(JSON.parse(cached));
          }
        }
      } catch (err) {
        console.warn("Could not load stored analysis:", err);
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [search.id]);

  function handleDownloadReport() {
    const reportText = `
RESUMATE - RESUME ANALYSIS REPORT
=================================
Target Position: ${analysisTitle} ${analysisCompany ? `at ${analysisCompany}` : ""}
Generated: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}

SCORES:
- ATS Compatibility: ${data.atsScore}%
- Job Requirement Match: ${data.jobMatch}%
- Resume Quality: ${data.qualityScore}%

ATS BREAKDOWN:
${data.atsBreakdown.map((b) => `• ${b.label}: ${b.score}% — ${b.note}`).join("\n")}

MATCHING KEYWORDS FOUND:
${data.keywordsHave.join(", ")}

MISSING HIGH-DEMAND KEYWORDS:
${data.keywordsMissing.join(", ")}

SECTION AUDIT:
${data.sectionStatus.map((s) => `• ${s.section}: ${s.status}`).join("\n")}

AI RECOMMENDATIONS:
${data.suggestions
  .map(
    (s, i) =>
      `${i + 1}. ${s.title}\n   Problem: ${s.problem}\n   Why it matters: ${s.why}\n   Actionable Fix: ${s.fix}\n`,
  )
  .join("\n")}
=================================
ResuMate AI Career Assistant
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
          <Loader2 className="size-5 animate-spin text-primary" /> Loading your analysis report…
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <PageHeader
          title="Your Resume Analysis"
          subtitle={`Here's how your resume performs for ${analysisTitle}${analysisCompany ? ` at ${analysisCompany}` : ""}.`}
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

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              v: data.atsScore,
              label: "ATS Score",
              tag: data.atsScore >= 80 ? "Good" : data.atsScore >= 60 ? "Moderate" : "Needs Work",
              tone: "primary" as const,
              hint: explain(
                "How easily hiring software can read your resume.",
                "Parser compatibility and keyword density index.",
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
                "How closely your resume fits this specific job.",
                "Semantic similarity between resume and job requirements.",
              ),
            },
            {
              v: data.qualityScore,
              label: "Resume Quality",
              tag: data.qualityScore >= 80 ? "Good" : "Average",
              tone: "success" as const,
              hint: explain(
                "How clear and professional your writing looks.",
                "Writing quality, quantification and structure score.",
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

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">ATS Compatibility</h2>
              <span className="font-display text-2xl font-bold">{data.atsScore}%</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {explain(
                "This shows how well hiring software can read and match your resume.",
                "Composite of parsing, keyword coverage, section detection and readability metrics.",
              )}
            </p>
            <div className="mt-5 space-y-5">
              {data.atsBreakdown.map((b) => (
                <div key={b.label}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{b.label}</span>
                    <span className="font-semibold">{b.score}%</span>
                  </div>
                  <Progress value={b.score} className="mt-1.5 h-2" />
                  <p className="mt-1.5 text-xs text-muted-foreground">{b.note}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="shadow-card">
            <CardContent className="p-6">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                <CheckCircle2 className="size-4.5 text-success" /> Keywords You Have (
                {data.keywordsHave.length})
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {data.keywordsHave.map((k) => (
                  <span
                    key={k}
                    className="rounded-full bg-success/10 px-3 py-1.5 text-sm font-medium text-success"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-6">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                <MinusCircle className="size-4.5 text-destructive" /> Missing Keywords (
                {data.keywordsMissing.length})
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {data.keywordsMissing.map((k) => (
                  <span
                    key={k}
                    className="rounded-full bg-destructive/10 px-3 py-1.5 text-sm font-medium text-destructive"
                  >
                    {k}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Add these words naturally in your projects and coursework — only where they are
                actually true for you.
              </p>
            </CardContent>
          </Card>
        </div>

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

        <section aria-labelledby="rec">
          <h2 id="rec" className="font-display text-lg font-semibold">
            AI Recommendations
          </h2>
          <div className="mt-3 space-y-4">
            {data.suggestions.map((s) => (
              <Card key={s.title} className="shadow-card">
                <CardContent className="p-6">
                  <h3 className="flex items-center gap-2 font-display font-semibold">
                    <Sparkles className="size-4 text-primary" /> {s.title}
                  </h3>
                  <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Problem
                      </dt>
                      <dd className="mt-1 text-sm">{s.problem}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Why it matters
                      </dt>
                      <dd className="mt-1 text-sm">{s.why}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Suggestion
                      </dt>
                      <dd className="mt-1 text-sm">{s.fix}</dd>
                    </div>
                  </dl>
                  <Button
                    variant="soft"
                    size="sm"
                    className="mt-4"
                    onClick={() => {
                      navigator.clipboard?.writeText(`${s.title}\nFix: ${s.fix}`);
                      toast.success("Suggestion copied to clipboard ✓", {
                        description: "Open the Resume Builder to apply the change.",
                      });
                    }}
                  >
                    Copy & Apply Suggestion
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <BulletImprover />
      </div>
    </AppShell>
  );
}
