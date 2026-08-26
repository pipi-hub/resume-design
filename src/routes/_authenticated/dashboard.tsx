import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, FileText, Loader2, MessagesSquare, ScanLine, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { useAuthUser } from "@/lib/auth";
import { resumeService } from "@/services/resumeService";
import { steps, user as defaultUser } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — ResuMate" },
      {
        name: "description",
        content: "Your resume scores, recent analyses and next steps in one place.",
      },
      { property: "og:title", content: "Dashboard — ResuMate" },
      { property: "og:description", content: "Track your ATS score and job match progress." },
    ],
  }),
  component: Dashboard,
});

const quickActions = [
  {
    to: "/analyze",
    title: "Analyze Resume",
    desc: "Upload a resume and receive AI feedback.",
    icon: ScanLine,
  },
  {
    to: "/job-description",
    title: "Match With Job",
    desc: "Compare your resume with a job description.",
    icon: Target,
  },
  { to: "/builder", title: "Build Resume", desc: "Create a resume from scratch.", icon: FileText },
  {
    to: "/interview",
    title: "Prepare for Interview",
    desc: "Generate interview questions.",
    icon: MessagesSquare,
  },
] as const;

function Dashboard() {
  const { user, userId } = useAuthUser();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-data", userId],
    queryFn: () => resumeService.getDashboard(userId || undefined),
  });

  const firstName =
    data?.profile?.full_name?.split(" ")[0] ||
    user?.user_metadata?.["full_name"]?.split(" ")[0] ||
    defaultUser.firstName;
  const stats = data?.stats || [
    { label: "ATS score", value: "87%", change: "+12 pts", up: true },
    { label: "Job match", value: "82%", change: "+8 pts", up: true },
    { label: "Resumes tracked", value: "3", change: "2 this week", up: true },
    { label: "Skill coverage", value: "78%", change: "+5 skills", up: true },
  ];
  const recent = data?.recentAnalyses || [];

  return (
    <AppShell>
      <div className="space-y-8">
        <PageHeader
          title={`Welcome back, ${firstName} 👋`}
          subtitle="Let's make your next application stronger."
          action={
            <Button variant="hero" asChild>
              <Link to="/analyze">
                Upload & Analyze Resume <ArrowRight />
              </Link>
            </Button>
          }
        />

        <div className="rounded-2xl border gradient-soft p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-display font-semibold">Your application journey</p>
              <p className="text-sm text-muted-foreground">
                Upload → Job Description → Analyze → Improve → Apply
              </p>
            </div>
            <Badge variant="secondary">Step 3 of 5 active</Badge>
          </div>
          <Progress value={60} className="mt-4 h-2" />
          <ol className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-4">
            {steps.map((s) => (
              <li key={s.n}>
                <span className="font-semibold text-foreground">
                  {s.n}. {s.title}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <section aria-labelledby="stats">
          <h2 id="stats" className="font-display text-lg font-semibold">
            Quick statistics
          </h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <StatCard key={s.label} {...s} />
            ))}
          </div>
        </section>

        <section aria-labelledby="actions">
          <h2 id="actions" className="font-display text-lg font-semibold">
            Quick actions
          </h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((a) => (
              <Link key={a.to} to={a.to} className="group">
                <Card className="h-full shadow-card transition-shadow group-hover:shadow-lift">
                  <CardContent className="p-5">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                      <a.icon className="size-5" />
                    </span>
                    <p className="mt-3 font-display font-semibold">{a.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{a.desc}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <section aria-labelledby="recent">
          <div className="flex items-center justify-between">
            <h2 id="recent" className="font-display text-lg font-semibold">
              Recent resume analysis
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/history">View all history</Link>
            </Button>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-primary" /> Loading recent activity…
            </div>
          ) : recent.length === 0 ? (
            <Card className="mt-3 shadow-card">
              <CardContent className="p-8 text-center">
                <p className="font-display font-semibold">No recent analyses yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Upload and analyze your first resume to see real-time scores and ATS breakdowns
                  here.
                </p>
                <Button variant="hero" className="mt-4" asChild>
                  <Link to="/analyze">
                    <ScanLine /> Analyze Resume Now
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="mt-3 grid gap-4 lg:grid-cols-3">
              {recent.map((r) => (
                <Card key={r.id} className="shadow-card">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-display font-semibold">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.role}</p>
                      </div>
                      <Badge variant="secondary">{r.version}</Badge>
                    </div>
                    <div className="mt-4 space-y-3">
                      <div>
                        <div className="flex justify-between text-xs font-medium">
                          <span>ATS score</span>
                          <span>{r.ats}%</span>
                        </div>
                        <Progress value={r.ats} className="mt-1 h-1.5" />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs font-medium">
                          <span>Job match</span>
                          <span>{r.match}%</span>
                        </div>
                        <Progress value={r.match} className="mt-1 h-1.5" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{r.date}</span>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to="/analysis" search={{ id: r.id }}>
                          View Report <ArrowRight />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
