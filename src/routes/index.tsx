import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  GitCompareArrows,
  History,
  Mail,
  MessagesSquare,
  ScanLine,
  Sparkles,
  Target,
  Wand2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicLayout } from "@/components/site/PublicLayout";
import { ScoreRing } from "@/components/common/ScoreRing";
import { features, steps } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ResuMate — Build a Resume That Gets Noticed" },
      {
        name: "description",
        content:
          "AI resume analysis for students and fresh graduates: ATS score, job match, skill gaps, cover letters and interview prep.",
      },
      { property: "og:title", content: "ResuMate — Build a Resume That Gets Noticed" },
      {
        property: "og:description",
        content: "Analyze your resume, match it to any job description and fix what's missing.",
      },
    ],
  }),
  component: Home,
});

const icons: Record<string, typeof ScanLine> = {
  ScanLine,
  Target,
  GitCompareArrows,
  Sparkles,
  Wand2,
  FileText,
  Mail,
  MessagesSquare,
  History,
};

function HeroMockup() {
  return (
    <div className="rounded-3xl border bg-card p-5 shadow-lift">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Analysis report</p>
          <p className="font-display text-sm font-bold">Software Engineer Resume</p>
        </div>
        <Badge className="bg-success text-success-foreground">Completed</Badge>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border bg-background p-3 text-center">
          <ScoreRing value={87} size={104} suffix="%" label="ATS Score" />
        </div>
        <div className="rounded-2xl border bg-background p-3 text-center">
          <ScoreRing value={82} size={104} suffix="%" tone="violet" label="Job Match" />
        </div>
      </div>
      <div className="mt-3 rounded-2xl border bg-background p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Missing skills
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {["Docker", "AWS", "REST API"].map((s) => (
            <span
              key={s}
              className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive"
            >
              {s}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-3 rounded-2xl gradient-soft p-4">
        <p className="flex items-center gap-2 text-xs font-semibold">
          <Sparkles className="size-3.5 text-primary" /> AI suggestion
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add the technologies, your role and one measurable result to each project.
        </p>
      </div>
    </div>
  );
}

function Home() {
  return (
    <PublicLayout>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 -top-40 h-80 gradient-soft blur-3xl" />
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1">
              <Sparkles className="size-3.5 text-primary" /> Made for students & fresh graduates
            </Badge>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.1] sm:text-5xl lg:text-6xl">
              Build a Resume That <span className="text-gradient">Gets Noticed.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
              ResuMate uses AI to analyze your resume, match it with job descriptions, identify
              skill gaps, and help you create a stronger job application.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button variant="hero" size="xl" asChild>
                <Link to="/analyze">
                  Analyze My Resume <ArrowRight />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link to="/builder">Build a Resume</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              No credit card needed · PDF & DOCX supported · Results in under a minute
            </p>
          </div>
          <HeroMockup />
        </div>
      </section>

      <section className="border-y bg-card">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 lg:py-20">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              Everything You Need to Build a Better Resume
            </h2>
            <p className="mt-3 text-muted-foreground">
              Nine tools that take you from a rough draft to an application you feel confident
              sending.
            </p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => {
              const Icon = icons[f.icon] ?? ScanLine;
              return (
                <Card key={f.title} className="shadow-card transition-shadow hover:shadow-lift">
                  <CardContent className="p-6">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                      <Icon className="size-5" />
                    </span>
                    <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16 lg:py-20">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">How It Works</h2>
          <p className="mt-3 text-muted-foreground">
            Four simple steps. No resume experience required.
          </p>
        </div>
        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <li key={s.n} className="rounded-2xl border bg-card p-6 shadow-card">
              <span className="flex size-9 items-center justify-center rounded-full gradient-hero font-display text-sm font-bold text-primary-foreground">
                {s.n}
              </span>
              <h3 className="mt-4 font-display text-base font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t bg-card">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 lg:grid-cols-2 lg:py-20">
          <div>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">What is ATS?</h2>
            <p className="mt-4 text-muted-foreground">
              An Applicant Tracking System (ATS) is software used by companies to screen and
              organise job applications before recruiters review them. If the software cannot read
              your resume properly, a human may never see it.
            </p>
            <Button variant="hero" size="lg" className="mt-7" asChild>
              <Link to="/analyze">Check My ATS Score</Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
              <p className="flex items-center gap-2 font-display font-semibold text-destructive">
                <CircleAlert className="size-4" /> Before
              </p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>Missing keywords</li>
                <li>Poor formatting</li>
                <li>Unclear sections</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-success/30 bg-success/5 p-5">
              <p className="flex items-center gap-2 font-display font-semibold text-success">
                <CheckCircle2 className="size-4" /> After
              </p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>Relevant keywords</li>
                <li>ATS-friendly formatting</li>
                <li>Clear sections</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="rounded-3xl gradient-hero px-6 py-12 text-center text-primary-foreground shadow-lift sm:px-12">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Your next application can be your best one.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm opacity-90 sm:text-base">
            Upload your resume, paste the job description, and get a clear list of what to fix.
          </p>
          <Button size="xl" variant="secondary" className="mt-8" asChild>
            <Link to="/register">Get Started Free</Link>
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}
