import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  CheckCircle2,
  FileCheck2,
  FileSearch,
  FileText,
  GitCompareArrows,
  History,
  Loader2,
  Mail,
  MessagesSquare,
  ScanLine,
  Sparkles,
  TrendingUp,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AppShell } from "@/components/app/AppShell";
import { useAuthUser } from "@/lib/auth";
import { resumeService } from "@/services/resumeService";
import { applicationService } from "@/services/applicationService";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — ResuMate" },
      {
        name: "description",
        content:
          "Build a resume that gets noticed. Track ATS score, job match, skill gaps, and interview readiness.",
      },
      { property: "og:title", content: "Dashboard — ResuMate" },
      {
        property: "og:description",
        content: "Track your ATS score and job match progress.",
      },
    ],
  }),
  component: Dashboard,
});

const quickActions = [
  {
    to: "/analyze",
    title: "Analyze Resume",
    desc: "Upload and evaluate against target job descriptions.",
    icon: ScanLine,
    badge: "ATS Check",
  },
  {
    to: "/improve-bullet",
    title: "Improve Bullet",
    desc: "Rewrite bullet points into high-impact metrics.",
    icon: Wand2,
    badge: "AI Action",
  },
  {
    to: "/cover-letter",
    title: "Generate Cover Letter",
    desc: "Evidence-grounded letters tailored to the job.",
    icon: Mail,
    badge: "Job Tailored",
  },
  {
    to: "/interview",
    title: "Prepare for Interview",
    desc: "Practice tailored technical and behavioral questions.",
    icon: MessagesSquare,
    badge: "Mock Prep",
  },
] as const;

function MiniRing({
  value,
  max = 100,
  tone = "primary",
}: {
  value: number | null;
  max?: number;
  tone?: "primary" | "violet" | "success" | "warning";
}) {
  const toneColors: Record<string, string> = {
    primary: "var(--primary)",
    violet: "var(--violet)",
    success: "var(--success)",
    warning: "var(--warning)",
  };

  if (value === null) {
    return (
      <div className="size-11 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-xs text-muted-foreground font-semibold">
        —
      </div>
    );
  }

  const stroke = 4;
  const size = 44;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div className="relative size-11 shrink-0">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={toneColors[tone] || "var(--primary)"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * pct) / 100}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[11px] font-bold text-foreground">
          {value}
          {max === 100 ? "%" : ""}
        </span>
      </div>
    </div>
  );
}

function Dashboard() {
  const { user, userId } = useAuthUser();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-data", userId],
    queryFn: () => resumeService.getDashboard(userId || undefined),
  });

  const { data: appSummary } = useQuery({
    queryKey: ["dashboard-application-summary", userId],
    queryFn: () => applicationService.getApplicationSummary(userId || "guest"),
  });

  const metrics = data?.metrics || {
    atsScore: null,
    jobMatch: null,
    qualityScore: null,
    resumesCount: 0,
    skillsCount: 0,
  };

  const careerProgress = data?.careerProgress || {
    resumeImprovement: {
      score: metrics.atsScore,
      label: "Baseline evaluation",
      progress: metrics.atsScore ?? 0,
    },
    skillsAcquired: {
      count: metrics.skillsCount,
      label: `${metrics.skillsCount} skills identified`,
      progress: Math.min(100, metrics.skillsCount * 8),
    },
    applicationProgress: {
      count: appSummary?.total ?? 0,
      label:
        (appSummary?.total ?? 0) > 0
          ? `${appSummary?.applied ?? 0} applied, ${appSummary?.interview ?? 0} interview, ${appSummary?.offer ?? 0} offer`
          : "Applications in progress",
      progress: Math.min(100, (appSummary?.total ?? 0) * 20),
    },
    interviewReadiness: {
      score: null,
      label: "Pending resume upload",
      progress: 0,
    },
  };

  const recent = data?.recentAnalyses || [];

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Welcome / Overview Header */}
        <section
          aria-label="Welcome Overview"
          className="rounded-xl border border-border/80 bg-card p-6 sm:p-7 shadow-card"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-2xl space-y-2.5">
              <div className="inline-flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                <Sparkles className="size-3.5 text-primary" />
                <span>Career Preparation & ATS Readiness</span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Build a Resume That Gets Noticed.
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Analyze your resume against target roles, identify skill gaps, and prepare
                confidently for technical and behavioral interviews.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Button size="lg" asChild className="shadow-xs">
                <Link to="/analyze">
                  <ScanLine className="size-4 mr-1.5" />
                  Analyze Resume
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/builder">
                  <FileText className="size-4 mr-1.5" />
                  Build Resume
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Key Metrics in Clean Cards */}
        <section aria-labelledby="key-metrics">
          <div className="flex items-center justify-between mb-3">
            <h2
              id="key-metrics"
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
            >
              Key Resume & Career Metrics
            </h2>
            <span className="text-[11px] text-muted-foreground/70">Real-time analytics</span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
            {/* 1. ATS SCORE */}
            <Card className="transition-all hover:border-primary/40 hover:shadow-lift">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground">ATS Score</p>
                    <p className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground">
                      {metrics.atsScore !== null ? `${metrics.atsScore}%` : "—"}
                    </p>
                  </div>
                  <MiniRing
                    value={metrics.atsScore}
                    tone={metrics.atsScore && metrics.atsScore >= 75 ? "success" : "primary"}
                  />
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground truncate">
                  {metrics.atsScore !== null
                    ? metrics.atsScore >= 80
                      ? "Recruiter ready"
                      : "Needs optimization"
                    : "No analysis yet"}
                </p>
              </CardContent>
            </Card>

            {/* 2. JOB MATCH */}
            <Card className="transition-all hover:border-primary/40 hover:shadow-lift">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground">Job Match</p>
                    <p className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground">
                      {metrics.jobMatch !== null ? `${metrics.jobMatch}%` : "—"}
                    </p>
                  </div>
                  <MiniRing
                    value={metrics.jobMatch}
                    tone={metrics.jobMatch && metrics.jobMatch >= 75 ? "violet" : "primary"}
                  />
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground truncate">
                  {metrics.jobMatch !== null ? "Target role aligned" : "Set job description"}
                </p>
              </CardContent>
            </Card>

            {/* 3. RESUME QUALITY */}
            <Card className="transition-all hover:border-primary/40 hover:shadow-lift">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground">Resume Quality</p>
                    <p className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground">
                      {metrics.qualityScore !== null ? `${metrics.qualityScore}%` : "—"}
                    </p>
                  </div>
                  <MiniRing value={metrics.qualityScore} tone="success" />
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground truncate">
                  {metrics.qualityScore !== null ? "Structure & impact" : "Upload resume"}
                </p>
              </CardContent>
            </Card>

            {/* 4. RESUMES */}
            <Card className="transition-all hover:border-primary/40 hover:shadow-lift">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground">Resumes</p>
                    <p className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground">
                      {metrics.resumesCount}
                    </p>
                  </div>
                  <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    <FileText className="size-5" />
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground truncate">
                  {metrics.resumesCount === 1
                    ? "1 resume tracked"
                    : `${metrics.resumesCount} in library`}
                </p>
              </CardContent>
            </Card>

            {/* 5. SKILLS */}
            <Card className="col-span-2 sm:col-span-1 transition-all hover:border-primary/40 hover:shadow-lift">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground">Skills</p>
                    <p className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground">
                      {metrics.skillsCount}
                    </p>
                  </div>
                  <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    <GitCompareArrows className="size-5" />
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground truncate">
                  {metrics.skillsCount > 0
                    ? `${metrics.skillsCount} identified`
                    : "Discover in analysis"}
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* YOUR CAREER PROGRESS SECTION */}
        <section aria-labelledby="career-progress">
          <div className="flex items-center justify-between mb-3">
            <h2
              id="career-progress"
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2"
            >
              <TrendingUp className="size-3.5 text-primary" />
              Your Career Progress
            </h2>
            <Link to="/skill-gap" className="text-xs text-primary hover:underline font-medium">
              View skill roadmap →
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Resume Improvement */}
            <Card className="shadow-card border-border/70">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Resume Improvement</span>
                  <span className="text-xs font-bold text-primary">
                    {careerProgress.resumeImprovement.score !== null
                      ? `${careerProgress.resumeImprovement.score}%`
                      : "—"}
                  </span>
                </div>
                <Progress value={careerProgress.resumeImprovement.progress} className="mt-3 h-2" />
                <p className="mt-2.5 text-xs text-muted-foreground">
                  {careerProgress.resumeImprovement.label}
                </p>
              </CardContent>
            </Card>

            {/* Skills Acquired */}
            <Card className="shadow-card border-border/70">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Skills Acquired</span>
                  <span className="text-xs font-bold text-primary">
                    {careerProgress.skillsAcquired.count} skills
                  </span>
                </div>
                <Progress value={careerProgress.skillsAcquired.progress} className="mt-3 h-2" />
                <p className="mt-2.5 text-xs text-muted-foreground">
                  {careerProgress.skillsAcquired.label}
                </p>
              </CardContent>
            </Card>

            {/* Application Progress */}
            <Card className="shadow-card border-border/70">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    Application Readiness
                  </span>
                  <span className="text-xs font-bold text-primary">
                    {careerProgress.applicationProgress.count} analyses
                  </span>
                </div>
                <Progress
                  value={careerProgress.applicationProgress.progress}
                  className="mt-3 h-2"
                />
                <p className="mt-2.5 text-xs text-muted-foreground">
                  {careerProgress.applicationProgress.label}
                </p>
              </CardContent>
            </Card>

            {/* Interview Readiness */}
            <Card className="shadow-card border-border/70">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Interview Readiness</span>
                  <span className="text-xs font-bold text-primary">
                    {careerProgress.interviewReadiness.score !== null
                      ? `${careerProgress.interviewReadiness.score}%`
                      : "—"}
                  </span>
                </div>
                <Progress value={careerProgress.interviewReadiness.progress} className="mt-3 h-2" />
                <p className="mt-2.5 text-xs text-muted-foreground">
                  {careerProgress.interviewReadiness.label}
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* JOB APPLICATIONS SUMMARY */}
        <section aria-labelledby="applications-summary">
          <div className="flex items-center justify-between mb-3">
            <h2
              id="applications-summary"
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2"
            >
              <Briefcase className="size-3.5 text-primary" />
              Job Applications Summary
            </h2>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <Link to="/applications">
                View Applications <ArrowRight className="size-3 ml-1" />
              </Link>
            </Button>
          </div>

          <Card className="border-border/80 bg-card shadow-card">
            <CardContent className="p-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3 rounded-lg bg-muted/40 border border-border/50">
                  <p className="text-[11px] font-medium text-muted-foreground">
                    Total Applications
                  </p>
                  <p className="text-xl font-bold font-display text-foreground mt-0.5">
                    {appSummary?.total ?? 0}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/20 border border-border/50">
                  <p className="text-[11px] font-medium text-muted-foreground">Saved</p>
                  <p className="text-xl font-bold font-display text-foreground mt-0.5">
                    {appSummary?.saved ?? 0}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40">
                  <p className="text-[11px] font-medium text-blue-700 dark:text-blue-300">
                    Applied
                  </p>
                  <p className="text-xl font-bold font-display text-blue-900 dark:text-blue-100 mt-0.5">
                    {appSummary?.applied ?? 0}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
                  <p className="text-[11px] font-medium text-amber-700 dark:text-amber-300">
                    Interview
                  </p>
                  <p className="text-xl font-bold font-display text-amber-900 dark:text-amber-100 mt-0.5">
                    {appSummary?.interview ?? 0}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
                  <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                    Offers
                  </p>
                  <p className="text-xl font-bold font-display text-emerald-900 dark:text-emerald-100 mt-0.5">
                    {appSummary?.offer ?? 0}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40">
                  <p className="text-[11px] font-medium text-rose-700 dark:text-rose-300">
                    Rejected
                  </p>
                  <p className="text-xl font-bold font-display text-rose-900 dark:text-rose-100 mt-0.5">
                    {appSummary?.rejected ?? 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* QUICK ACTIONS */}
        <section aria-labelledby="quick-actions">
          <div className="flex items-center justify-between mb-3">
            <h2
              id="quick-actions"
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
            >
              Quick Actions
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Link key={action.to} to={action.to} className="group">
                <Card className="h-full transition-all group-hover:border-primary/40 group-hover:shadow-lift">
                  <CardContent className="p-5 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                          <action.icon className="size-4.5" />
                        </span>
                        <Badge variant="secondary" className="text-[10px] font-medium">
                          {action.badge}
                        </Badge>
                      </div>
                      <p className="font-display text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {action.title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                        {action.desc}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary pt-2 border-t border-border/60">
                      <span>Launch tool</span>
                      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* RECENT ACTIVITY */}
        <section aria-labelledby="recent-activity">
          <div className="flex items-center justify-between mb-3">
            <h2
              id="recent-activity"
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2"
            >
              <History className="size-3.5 text-primary" />
              Recent Activity
            </h2>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <Link to="/history">
                View all history <ArrowRight className="size-3 ml-1" />
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground border border-border/80 rounded-xl bg-card">
              <Loader2 className="size-5 animate-spin text-primary" />
              <span>Loading recent activity from database…</span>
            </div>
          ) : recent.length === 0 ? (
            <Card className="border-dashed border-border/90 bg-card">
              <CardContent className="p-10 text-center flex flex-col items-center justify-center">
                <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <FileSearch className="size-6" />
                </div>
                <h3 className="font-display text-base font-semibold text-foreground">
                  No Resume Analyses Yet
                </h3>
                <p className="max-w-md mt-1 text-xs text-muted-foreground leading-relaxed">
                  Upload your first resume to see ATS scores, matched keywords, and prioritized
                  suggestions right here.
                </p>
                <Button size="sm" asChild className="mt-4">
                  <Link to="/analyze">
                    <ScanLine className="size-3.5 mr-1.5" />
                    Analyze Your First Resume
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="divide-y divide-border/60">
                {recent.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                        <FileCheck2 className="size-4.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-display text-sm font-semibold text-foreground truncate">
                            {item.name}
                          </p>
                          <Badge variant="secondary" className="text-[10px] font-medium">
                            {item.version}
                          </Badge>
                          {item.ats && item.ats >= 80 ? (
                            <Badge variant="success" className="text-[10px] font-medium">
                              <CheckCircle2 className="size-3 mr-1 inline" />
                              ATS Ready
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px] font-medium">
                              Analyzed
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Target Role: {item.role} • {item.date}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60">
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            ATS Score
                          </p>
                          <p className="font-display text-base font-bold text-foreground">
                            {item.ats !== null ? `${item.ats}%` : "—"}
                          </p>
                        </div>
                        {item.match !== null && (
                          <div className="text-right pl-3 border-l border-border/80">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              Job Match
                            </p>
                            <p className="font-display text-base font-bold text-primary">
                              {item.match}%
                            </p>
                          </div>
                        )}
                      </div>

                      <Button variant="soft" size="sm" asChild className="text-xs font-medium">
                        <Link to="/analysis" search={{ id: item.id }}>
                          View Report
                          <ArrowUpRight className="size-3.5 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </section>
      </div>
    </AppShell>
  );
}
