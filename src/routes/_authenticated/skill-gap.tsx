import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Compass,
  FileSearch,
  Sparkles,
  Target,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { InfoHint } from "@/components/common/InfoHint";
import { resumeService } from "@/services/resumeService";
import type { AnalysisResult } from "@/server/gemini";

export const Route = createFileRoute("/_authenticated/skill-gap")({
  head: () => ({
    meta: [
      { title: "Skill Gap Analysis — ResuMate" },
      {
        name: "description",
        content:
          "See which skills your target job needs that your resume is missing, and how long each takes to learn.",
      },
      { property: "og:title", content: "Skill Gap Analysis — ResuMate" },
      {
        property: "og:description",
        content: "A practical learning plan built from your resume and target role.",
      },
    ],
  }),
  component: SkillGap,
});

function getPriorityBadge(importance: string) {
  const imp = (importance || "Medium").toLowerCase();
  if (imp === "high") {
    return (
      <Badge className="bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] font-medium text-[11px] dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800">
        High Priority
      </Badge>
    );
  }
  if (imp === "low") {
    return (
      <Badge
        variant="outline"
        className="bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0] font-medium text-[11px] dark:bg-muted dark:text-muted-foreground dark:border-border"
      >
        Low Priority
      </Badge>
    );
  }
  return (
    <Badge className="bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] font-medium text-[11px] dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">
      Medium Priority
    </Badge>
  );
}

function SkillGap() {
  const [loading, setLoading] = useState(true);
  const [targetRole, setTargetRole] = useState("Target Role");
  const [keywordsHave, setKeywordsHave] = useState<string[]>([]);
  const [keywordsMissing, setKeywordsMissing] = useState<string[]>([]);
  const [skillGaps, setSkillGaps] = useState<AnalysisResult["skillGaps"]>([]);
  const [hasAnalysis, setHasAnalysis] = useState(false);

  useEffect(() => {
    async function loadGaps() {
      try {
        const latest = await resumeService.getLatestAnalysis();
        if (latest) {
          if (latest.resume_name) setTargetRole(latest.resume_name);
          const rep = resumeService.parseAnalysisBreakdown(latest);
          if (rep) {
            setKeywordsHave(rep.keywordsHave || []);
            setKeywordsMissing(rep.keywordsMissing || []);
            setSkillGaps(rep.skillGaps || []);
            setHasAnalysis(true);
            setLoading(false);
            return;
          }
        }

        const cached = sessionStorage.getItem("resumate_latest_analysis_data");
        if (cached) {
          const parsed = JSON.parse(cached) as AnalysisResult;
          setKeywordsHave(parsed.keywordsHave || []);
          setKeywordsMissing(parsed.keywordsMissing || []);
          setSkillGaps(parsed.skillGaps || []);
          setHasAnalysis(true);
        }
      } catch (err) {
        console.warn("Could not load skill gap data:", err);
      } finally {
        setLoading(false);
      }
    }

    void loadGaps();
  }, []);

  const total = keywordsHave.length + keywordsMissing.length;
  const coverage = total > 0 ? Math.round((keywordsHave.length / total) * 100) : 0;

  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-muted-foreground">
          <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Loading skill gap analysis…
        </div>
      </AppShell>
    );
  }

  if (!hasAnalysis || (keywordsHave.length === 0 && keywordsMissing.length === 0)) {
    return (
      <AppShell>
        <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4 text-center">
          <div className="size-16 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground">
            <FileSearch className="size-8" />
          </div>
          <h2 className="font-display text-xl font-bold">No Skill Gap Data Found</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Upload and analyze your resume against a target job to compare your skills and receive a
            personalized learning roadmap.
          </p>
          <Button variant="hero" asChild>
            <Link to="/analyze">Analyze a Resume</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <PageHeader
          title="Skill Gap Roadmap"
          subtitle={`Actionable skill breakdown comparing your resume to ${targetRole}.`}
          action={
            <Button variant="outline" asChild>
              <Link to="/job-description">
                <Target className="size-4 mr-1.5" /> Change Target Job
              </Link>
            </Button>
          }
        />

        <div className="grid gap-5 lg:grid-cols-3">
          {/* Skill Coverage Card */}
          <Card className="shadow-card lg:col-span-1 border-border/80">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Skill Coverage
                </p>
                <InfoHint text="The percentage of target role skills verified in your resume text." />
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-display text-5xl font-bold tracking-tight text-foreground">
                  {coverage}%
                </span>
                <span className="text-xs text-muted-foreground font-medium">match</span>
              </div>
              <Progress value={coverage} className="mt-4 h-2.5" />
              <div className="mt-5 space-y-2 text-xs text-muted-foreground border-t border-border/50 pt-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 className="size-3.5" /> Skills Verified
                  </span>
                  <span className="font-bold text-foreground">{keywordsHave.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
                    <XCircle className="size-3.5" /> Missing Gaps
                  </span>
                  <span className="font-bold text-foreground">{keywordsMissing.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Skills Breakdown Card */}
          <Card className="lg:col-span-2">
            <CardContent className="p-6 space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="size-4 text-[#10B981]" />
                  <h3 className="font-display text-sm font-semibold text-[#1E293B] dark:text-foreground uppercase tracking-wider">
                    Skills You Already Have ({keywordsHave.length})
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {keywordsHave.length > 0 ? (
                    keywordsHave.map((k) => (
                      <Badge
                        key={k}
                        variant="outline"
                        className="bg-[#ECFDF5] text-[#059669] border-[#A7F3D0] px-2.5 py-1 text-xs font-medium gap-1.5 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                      >
                        <CheckCircle2 className="size-3 text-[#10B981]" />
                        {k}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-xs text-[#64748B] dark:text-muted-foreground">
                      No matching skills identified.
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t border-[#EEF2F7] pt-5 dark:border-border">
                <div className="flex items-center gap-2 mb-3">
                  <XCircle className="size-4 text-[#F59E0B]" />
                  <h3 className="font-display text-sm font-semibold text-[#1E293B] dark:text-foreground uppercase tracking-wider">
                    Skills You're Missing ({keywordsMissing.length})
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {keywordsMissing.length > 0 ? (
                    keywordsMissing.map((k) => (
                      <Badge
                        key={k}
                        variant="outline"
                        className="bg-[#FFFBEB] text-[#D97706] border-[#FDE68A] px-2.5 py-1 text-xs font-medium gap-1.5 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800"
                      >
                        <span className="size-1.5 rounded-full bg-[#F59E0B]" />
                        {k}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-xs text-[#059669] font-medium">
                      All core target skills are present in your resume!
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Personalized Roadmap & Timeline */}
        {skillGaps && skillGaps.length > 0 && (
          <section aria-labelledby="roadmap" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="size-5 text-primary" />
                <h2 id="roadmap" className="font-display text-lg font-bold text-foreground">
                  Recommended Learning Timeline & Roadmap
                </h2>
              </div>
              <Badge variant="outline" className="text-xs text-muted-foreground">
                {skillGaps.length} Target Milestones
              </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {skillGaps.map((g, idx) => (
                <Card
                  key={g.skill || idx}
                  className="shadow-card border-border/80 hover:border-primary/40 transition-colors"
                >
                  <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-display text-base font-bold text-foreground">
                          {g.skill}
                        </h3>
                        {getPriorityBadge(g.importance)}
                      </div>
                      <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                        <BookOpen className="size-3.5 text-primary shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-foreground">
                            Recommended Learning:{" "}
                          </span>
                          {g.rec}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-border/50 pt-3 text-xs">
                      <span className="flex items-center gap-1.5 text-primary font-semibold">
                        <Clock className="size-3.5" />
                        Estimated Time: {g.weeks}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="h-7 text-xs text-primary font-medium hover:bg-primary/10"
                      >
                        <Link to="/builder">Add Project to Resume</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Next Steps CTA */}
        <div className="rounded-2xl border border-[#EDE9FE] bg-[#F5F3FF] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 dark:border-primary/20 dark:bg-primary/5">
          <div className="space-y-1">
            <p className="font-display font-semibold text-[#1E293B] flex items-center gap-2 dark:text-foreground">
              <Sparkles className="size-4 text-[#6366F1]" />
              Ready to update your resume with new skills?
            </p>
            <p className="text-xs text-[#64748B] max-w-xl dark:text-muted-foreground">
              As you build hands-on experience, integrate these keywords into your project bullet
              points using our Bullet Improver, then re-analyze for an updated ATS score.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="default" asChild>
              <Link to="/improve-bullet">Improve Bullet Points</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/interview">Practice Interview</Link>
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
