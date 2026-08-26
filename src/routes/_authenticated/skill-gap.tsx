import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, GitCompareArrows, Loader2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { InfoHint } from "@/components/common/InfoHint";
import { resumeService } from "@/services/resumeService";
import type { AnalysisResult } from "@/server/gemini";
import {
  keywordsHave as defaultKeywordsHave,
  keywordsMissing as defaultKeywordsMissing,
  skillGaps as defaultSkillGaps,
} from "@/lib/mock-data";

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

const importanceVariant: Record<string, "destructive" | "secondary" | "outline"> = {
  High: "destructive",
  Medium: "secondary",
  Low: "outline",
};

function SkillGap() {
  const [loading, setLoading] = useState(true);
  const [targetRole, setTargetRole] = useState("Software Engineer");
  const [keywordsHave, setKeywordsHave] = useState<string[]>(defaultKeywordsHave);
  const [keywordsMissing, setKeywordsMissing] = useState<string[]>(defaultKeywordsMissing);
  const [skillGaps, setSkillGaps] = useState<AnalysisResult["skillGaps"]>(defaultSkillGaps);

  useEffect(() => {
    async function loadGaps() {
      try {
        const latest = await resumeService.getLatestAnalysis();
        if (latest) {
          if (latest.job_title) setTargetRole(latest.job_title);
          if (latest.report && typeof latest.report === "object") {
            const rep = latest.report as unknown as AnalysisResult;
            if (rep.keywordsHave?.length) setKeywordsHave(rep.keywordsHave);
            if (rep.keywordsMissing?.length) setKeywordsMissing(rep.keywordsMissing);
            if (rep.skillGaps?.length) setSkillGaps(rep.skillGaps);
            setLoading(false);
            return;
          }
        }

        const cached = sessionStorage.getItem("resumate_latest_analysis_data");
        if (cached) {
          const parsed = JSON.parse(cached) as AnalysisResult;
          if (parsed.keywordsHave?.length) setKeywordsHave(parsed.keywordsHave);
          if (parsed.keywordsMissing?.length) setKeywordsMissing(parsed.keywordsMissing);
          if (parsed.skillGaps?.length) setSkillGaps(parsed.skillGaps);
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
  const coverage = total > 0 ? Math.round((keywordsHave.length / total) * 100) : 75;

  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin text-primary" /> Loading skill gap analysis…
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <PageHeader
          title="Skill gap analysis"
          subtitle={`Comparing your resume with your target role: ${targetRole}.`}
          action={
            <Button variant="soft" asChild>
              <Link to="/job-description">
                <Target /> Change target job
              </Link>
            </Button>
          }
        />

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="shadow-card lg:col-span-1">
            <CardContent className="p-6">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium text-muted-foreground">Skill coverage</p>
                <InfoHint text="The share of the job's key skills that already appear on your resume." />
              </div>
              <p className="mt-2 font-display text-4xl font-bold">{coverage}%</p>
              <Progress value={coverage} className="mt-3 h-2" />
              <p className="mt-3 text-sm text-muted-foreground">
                You already match {keywordsHave.length} of {total} important skills. Closing the{" "}
                {keywordsMissing.length} gaps below is the fastest way to raise your match score.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card lg:col-span-2">
            <CardContent className="p-6">
              <h2 className="font-display text-lg font-semibold">Skills you already have</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {keywordsHave.map((k) => (
                  <Badge key={k} variant="secondary" className="gap-1">
                    <CheckCircle2 className="size-3.5 text-success" /> {k}
                  </Badge>
                ))}
              </div>
              <h2 className="mt-6 font-display text-lg font-semibold">Skills the job asks for</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {keywordsMissing.map((k) => (
                  <Badge key={k} variant="outline" className="border-dashed">
                    {k}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <section aria-labelledby="plan">
          <div className="flex items-center gap-2">
            <GitCompareArrows className="size-5 text-primary" />
            <h2 id="plan" className="font-display text-lg font-semibold">
              Your personalized learning plan
            </h2>
          </div>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {skillGaps.map((g) => (
              <Card key={g.skill} className="shadow-card">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-display font-semibold">{g.skill}</p>
                    <Badge variant={importanceVariant[g.importance] ?? "secondary"}>
                      {g.importance} priority
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{g.rec}</p>
                  <p className="mt-3 text-xs font-medium text-primary">Estimated time: {g.weeks}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <div className="rounded-2xl border gradient-soft p-6">
          <p className="font-display font-semibold">Ready to show your progress?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Once you learn a skill, add a project that proves it and re-analyze your resume.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="hero" asChild>
              <Link to="/analyze">Re-analyze resume</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/interview">Practise interview answers</Link>
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
