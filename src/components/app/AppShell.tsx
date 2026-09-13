import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import {
  Bell,
  Bot,
  Briefcase,
  FileText,
  GitCompareArrows,
  History,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  MessagesSquare,
  Moon,
  ScanLine,
  Settings,
  Sparkles,
  Sun,
  Target,
  User,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/common/Logo";
import { InfoHint } from "@/components/common/InfoHint";
import { AiAssistant } from "./AiAssistant";
import { useApp, useCareerContext } from "@/context/app-context";
import { useAuthUser } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type NavItem = {
  to?: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isAction?: boolean;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const groups: NavGroup[] = [
  {
    title: "Workspace",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/analyze", label: "Analyze Resume", icon: ScanLine },
      { to: "/builder", label: "Resume Builder", icon: FileText },
      { to: "/history", label: "Resume History", icon: History },
    ],
  },
  {
    title: "Career Tools",
    items: [
      { to: "/job-description", label: "Job Description", icon: Target },
      { to: "/skill-gap", label: "Skill Gap", icon: GitCompareArrows },
      { to: "/cover-letter", label: "Cover Letter", icon: Mail },
      { to: "/interview", label: "Interview Prep", icon: MessagesSquare },
      { to: "/improve-bullet", label: "Bullet Improver", icon: Wand2 },
      { to: "/applications", label: "Job Tracker", icon: Briefcase },
    ],
  },
  {
    title: "AI",
    items: [{ label: "AI Career Assistant", icon: Bot, isAction: true }],
  },
  {
    title: "Account",
    items: [
      { to: "/profile", label: "Profile", icon: User },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

const routeMeta: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Dashboard", subtitle: "Career preparedness overview & ATS trajectory" },
  "/applications": {
    title: "Job Application Tracker",
    subtitle: "Track job submissions, interview stages, and resume alignment",
  },
  "/analyze": {
    title: "Analyze Resume",
    subtitle: "Upload your resume for deep ATS & keyword parsing",
  },
  "/analyzing": {
    title: "Analyzing Resume",
    subtitle: "Evaluating parsing, keywords, and job match",
  },
  "/analysis": {
    title: "Resume Analysis",
    subtitle: "Detailed ATS compatibility, keyword coverage & recommendations",
  },
  "/job-description": {
    title: "Job Description",
    subtitle: "Compare your resume against specific role requirements",
  },
  "/skill-gap": {
    title: "Skill Gap Analysis",
    subtitle: "Personalized learning roadmap to close missing skill requirements",
  },
  "/cover-letter": {
    title: "Cover Letter Generator",
    subtitle: "Evidence-grounded cover letters tailored to your target job",
  },
  "/interview": {
    title: "Interview Preparation",
    subtitle: "Practice AI questions tailored to your experience",
  },
  "/improve-bullet": {
    title: "Bullet Point Improver",
    subtitle: "Rewrite bullet points into high-impact, ATS-optimized statements",
  },
  "/builder": {
    title: "Resume Builder",
    subtitle: "Create and export an ATS-optimized professional resume",
  },
  "/history": {
    title: "Resume History",
    subtitle: "Track versions and score progression over time",
  },
  "/profile": {
    title: "Profile",
    subtitle: "Manage your personal information, skills, and target roles",
  },
  "/settings": {
    title: "Settings",
    subtitle: "Account preferences, appearance, AI settings, and privacy",
  },
};

const notifications = [
  { title: "Analysis completed", desc: "Software Engineer Resume scored 87% ATS.", time: "2m ago" },
  {
    title: "Resume score improved",
    desc: "+15 ATS points since your first version.",
    time: "1h ago",
  },
  {
    title: "New recommendations",
    desc: "3 new suggestions for your Projects section.",
    time: "Yesterday",
  },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  function handleOpenAiAssistant() {
    window.dispatchEvent(new CustomEvent("open-ai-assistant"));
    onNavigate?.();
  }

  return (
    <nav aria-label="Application" className="flex-1 space-y-5 overflow-y-auto px-3 py-3">
      {groups.map((g) => (
        <div key={g.title}>
          <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
            {g.title}
          </p>
          <div className="space-y-0.5">
            {g.items.map((item) => {
              if (item.isAction) {
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={handleOpenAiAssistant}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-all hover:bg-muted/70 hover:text-foreground text-left group"
                  >
                    <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <item.icon className="size-3.5 shrink-0" />
                    </span>
                    <span className="flex-1 truncate">{item.label}</span>
                    <Badge variant="ai" className="text-[10px] py-0 px-1.5 font-semibold">
                      AI
                    </Badge>
                  </button>
                );
              }

              return (
                <Link
                  key={item.to!}
                  to={item.to!}
                  onClick={onNavigate}
                  activeProps={{
                    className:
                      "bg-primary/10 text-primary font-semibold dark:bg-primary/15 dark:text-primary",
                  }}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                >
                  <item.icon className="size-4 shrink-0 transition-colors" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function SidebarFooter() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const career = useCareerContext();
  const { user: authUser, email } = useAuthUser();
  const [loggingOut, setLoggingOut] = useState(false);

  const metaName = (authUser?.user_metadata?.["full_name"] as string | undefined)?.trim();
  const displayName = metaName || email?.split("@")[0] || "Account";
  const initials = metaName
    ? metaName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : (email?.[0] || "A").toUpperCase();

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      career.clearActiveContext();
      await queryClient.cancelQueries();
      queryClient.clear();
      const { error } = await supabase.auth.signOut();
      if (error) toast.error(error.message);
    } catch {
      // Session is cleared locally even if the network call fails.
    } finally {
      setLoggingOut(false);
      navigate({ to: "/login", replace: true });
    }
  }

  return (
    <div className="border-t border-border/70 p-3 space-y-2">
      <div className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-card p-2.5 shadow-2xs">
        <Avatar className="size-8 ring-1 ring-primary/20 shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-foreground leading-tight">
            {displayName}
          </p>
          <p className="truncate text-[10px] text-muted-foreground leading-tight">
            {email || "User"}
          </p>
        </div>
        <Link
          to="/settings"
          className="text-muted-foreground hover:text-foreground p-1 transition-colors"
          title="Settings"
          aria-label="Settings"
        >
          <Settings className="size-3.5" />
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="text-muted-foreground hover:text-destructive p-1 transition-colors"
          title="Log out"
          aria-label="Log out"
          disabled={loggingOut}
        >
          <LogOut className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { beginnerMode, setBeginnerMode, theme, setTheme } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const path = router.state.location.pathname;
  const currentMeta = routeMeta[path] || {
    title: "ResuMate",
    subtitle: "AI Career Companion",
  };
  const { user: authUser, email } = useAuthUser();
  const metaName = (authUser?.user_metadata?.["full_name"] as string | undefined)?.trim();
  const displayName = metaName || email || "Account";
  const initials = metaName
    ? metaName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : (email?.[0] || "A").toUpperCase();

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border/80 bg-card lg:flex shadow-2xs">
        <div className="px-5 py-4 border-b border-border/70">
          <Logo to="/dashboard" />
        </div>
        <NavList />
        <SidebarFooter />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border/80 bg-background/85 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex w-72 flex-col p-0 bg-card">
                <SheetTitle className="sr-only">ResuMate navigation</SheetTitle>
                <div className="px-5 py-4 border-b border-border/70">
                  <Logo to="/dashboard" />
                </div>
                <NavList onNavigate={() => setMobileOpen(false)} />
                <SidebarFooter />
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2 lg:hidden">
              <Logo to="/dashboard" showTagline={false} />
            </div>

            <div className="hidden sm:block">
              <h1 className="font-display text-sm font-bold tracking-tight text-foreground">
                {currentMeta.title}
              </h1>
              <p className="text-[11px] text-muted-foreground line-clamp-1">
                {currentMeta.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-lg border border-border/80 bg-card px-3 py-1.5 sm:flex shadow-2xs">
              <Switch id="beginner" checked={beginnerMode} onCheckedChange={setBeginnerMode} />
              <Label
                htmlFor="beginner"
                className="text-xs font-medium cursor-pointer text-foreground"
              >
                Beginner Mode
              </Label>
              <InfoHint text="When on, ResuMate explains everything in simple language instead of technical terms." />
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="size-9 rounded-lg text-muted-foreground hover:text-foreground"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Notifications"
                  className="relative size-9 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <Bell className="size-4" />
                  <span className="absolute right-2 top-2 size-2 rounded-full bg-primary" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0 shadow-lg">
                <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/30">
                  <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Notifications
                  </p>
                  <Badge variant="secondary" className="text-[10px]">
                    3 new
                  </Badge>
                </div>
                <ul className="divide-y max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <li key={n.title} className="px-4 py-3 hover:bg-muted/20 transition-colors">
                      <p className="text-xs font-semibold text-foreground">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{n.desc}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground/70">{n.time}</p>
                    </li>
                  ))}
                </ul>
              </PopoverContent>
            </Popover>

            <Link
              to="/profile"
              aria-label="Open profile"
              className="rounded-full ring-offset-background transition-opacity hover:opacity-80 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Avatar className="size-8.5 ring-1 ring-border shadow-xs">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 sm:px-6 lg:py-8">
          {children}
        </main>
      </div>

      <AiAssistant />
      <p className="sr-only">Signed in as {displayName}</p>
    </div>
  );
}
