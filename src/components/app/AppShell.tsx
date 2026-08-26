import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import {
  Bell,
  Briefcase,
  FileText,
  GaugeCircle,
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
  Sun,
  Target,
  User,
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
import { useApp } from "@/context/app-context";
import { useAuthUser } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const groups = [
  {
    title: "Main",
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
      { to: "/job-description", label: "Job Match", icon: Target },
      { to: "/skill-gap", label: "Skill Gap", icon: GitCompareArrows },
      { to: "/interview", label: "Interview Prep", icon: MessagesSquare },
      { to: "/cover-letter", label: "Cover Letter", icon: Mail },
    ],
  },
  {
    title: "Account",
    items: [
      { to: "/profile", label: "Profile", icon: User },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
] as const;

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
  return (
    <nav aria-label="Application" className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
      {groups.map((g) => (
        <div key={g.title}>
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {g.title}
          </p>
          <div className="space-y-1">
            {g.items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                activeProps={{
                  className: "bg-sidebar-accent text-sidebar-accent-foreground font-semibold",
                }}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <item.icon className="size-4.5 shrink-0" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

function SidebarFooter() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
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
    <div className="space-y-2 border-t p-3">
      <Button variant="soft" className="w-full justify-start gap-3">
        <Briefcase className="size-4" /> Ask ResuMate AI
      </Button>
      <Button
        variant="ghost"
        className="w-full justify-start gap-3 text-muted-foreground"
        onClick={handleLogout}
        disabled={loggingOut}
      >
        <LogOut className="size-4" /> Logout
      </Button>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { beginnerMode, setBeginnerMode, theme, setTheme } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const path = router.state.location.pathname;
  const isDashboard = path === "/dashboard";
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
    : displayName.slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-sidebar lg:flex">
        <div className="px-4 py-4">
          <Logo to="/dashboard" />
        </div>
        <NavList />
        <SidebarFooter />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex w-72 flex-col p-0">
              <SheetTitle className="sr-only">ResuMate navigation</SheetTitle>
              <div className="px-4 py-4">
                <Logo to="/dashboard" />
              </div>
              <NavList onNavigate={() => setMobileOpen(false)} />
              <SidebarFooter />
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2 lg:hidden">
            <Logo to="/dashboard" showTagline={false} />
          </div>

          {isDashboard ? (
            <p className="hidden items-center gap-2 text-sm text-muted-foreground lg:flex">
              <GaugeCircle className="size-4 text-primary" />
              Next step: upload a resume, then add a job description.
            </p>
          ) : null}

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full border px-3 py-1.5 sm:flex">
              <Switch id="beginner" checked={beginnerMode} onCheckedChange={setBeginnerMode} />
              <Label htmlFor="beginner" className="text-xs font-medium">
                Beginner Mode
              </Label>
              <InfoHint text="When on, ResuMate explains everything in simple language instead of technical terms." />
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun /> : <Moon />}
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
                  <Bell />
                  <span className="absolute right-2 top-2 size-2 rounded-full bg-destructive" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <p className="text-sm font-semibold">Notifications</p>
                  <Badge variant="secondary">3 new</Badge>
                </div>
                <ul className="divide-y">
                  {notifications.map((n) => (
                    <li key={n.title} className="px-4 py-3">
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-xs text-muted-foreground">{n.desc}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">{n.time}</p>
                    </li>
                  ))}
                </ul>
              </PopoverContent>
            </Popover>
            <Link to="/profile" aria-label="Open profile">
              <Avatar className="size-9">
                <AvatarFallback className="bg-accent text-accent-foreground text-xs font-semibold">
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
