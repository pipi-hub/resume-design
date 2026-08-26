import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bell, Lock, Moon, Palette, ShieldAlert, Sparkles, Sun, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { InfoHint } from "@/components/common/InfoHint";
import { useApp } from "@/context/app-context";
import { useAuthUser } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — ResuMate" },
      {
        name: "description",
        content:
          "Manage your ResuMate account, password, Beginner Mode, appearance and email notification preferences.",
      },
      { property: "og:title", content: "Settings — ResuMate" },
      {
        property: "og:description",
        content: "Control your account, appearance, Beginner Mode and notifications.",
      },
    ],
  }),
  component: Settings,
});

function Row({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <div className="shrink-0 pt-0.5">{children}</div>
    </div>
  );
}

function Settings() {
  const { user, userId } = useAuthUser();
  const { beginnerMode, setBeginnerMode, theme, setTheme } = useApp();
  const [email, setEmail] = useState("");
  const [passwords, setPasswords] = useState({ current: "", next: "" });
  const [savingEmail, setSavingEmail] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [notify, setNotify] = useState({
    analysis: true,
    weekly: true,
    tips: false,
    product: false,
  });

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  async function handleSaveEmail() {
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setSavingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email });
      if (error) throw error;
      if (userId) {
        await supabase.from("profiles").update({ email }).eq("id", userId);
      }
      toast.success("Confirmation email sent to update your address ✓");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update email.");
    } finally {
      setSavingEmail(false);
    }
  }

  async function changePassword() {
    if (passwords.next.length < 6) {
      toast.error("Please enter a new password with at least 6 characters.");
      return;
    }
    setUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwords.next });
      if (error) throw error;
      setPasswords({ current: "", next: "" });
      toast.success("Password updated successfully ✓");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setUpdatingPassword(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <PageHeader
          title="Settings"
          subtitle="Control your account, how ResuMate talks to you, and what lands in your inbox."
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-card">
            <CardContent className="space-y-4 p-5">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                <Lock className="size-4 text-primary" /> Account
              </h2>
              <div className="space-y-2">
                <Label htmlFor="s-email">Email address</Label>
                <Input
                  id="s-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={handleSaveEmail} disabled={savingEmail}>
                {savingEmail ? "Saving..." : "Save email"}
              </Button>
              <Separator />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="s-current">Current password</Label>
                  <Input
                    id="s-current"
                    type="password"
                    placeholder="••••••••"
                    value={passwords.current}
                    onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="s-next">New password</Label>
                  <Input
                    id="s-next"
                    type="password"
                    placeholder="At least 6 characters"
                    value={passwords.next}
                    onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))}
                  />
                </div>
              </div>
              <Button variant="hero" onClick={changePassword} disabled={updatingPassword}>
                {updatingPassword ? "Updating..." : "Update password"}
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="space-y-3 p-5">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                <Palette className="size-4 text-primary" /> Experience & Theme
              </h2>
              <Row
                title="Beginner Mode"
                desc="Plain English explanations of ATS terms, acronyms and recruiting advice."
              >
                <Switch
                  checked={beginnerMode}
                  onCheckedChange={(c) => {
                    setBeginnerMode(c);
                    toast.success(c ? "Beginner Mode enabled" : "Technical Mode enabled");
                  }}
                />
              </Row>
              <Separator />
              <Row title="Theme" desc="Choose light or dark appearance.">
                <div className="flex rounded-lg border p-0.5">
                  <Button
                    size="sm"
                    variant={theme === "light" ? "secondary" : "ghost"}
                    className="size-8 p-0"
                    onClick={() => setTheme("light")}
                    aria-label="Light theme"
                  >
                    <Sun className="size-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={theme === "dark" ? "secondary" : "ghost"}
                    className="size-8 p-0"
                    onClick={() => setTheme("dark")}
                    aria-label="Dark theme"
                  >
                    <Moon className="size-4" />
                  </Button>
                </div>
              </Row>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-card">
          <CardContent className="p-5">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              <Bell className="size-4 text-primary" /> Notifications
            </h2>
            <div className="mt-2 divide-y">
              <Row
                title="Analysis completed"
                desc="Send an email when a large resume analysis finishes."
              >
                <Switch
                  checked={notify.analysis}
                  onCheckedChange={(v) => setNotify((n) => ({ ...n, analysis: v }))}
                />
              </Row>
              <Row
                title="Weekly career digest"
                desc="A summary of skills to learn and job application progress."
              >
                <Switch
                  checked={notify.weekly}
                  onCheckedChange={(v) => setNotify((n) => ({ ...n, weekly: v }))}
                />
              </Row>
              <Row title="Resume tips" desc="Occasional early-career advice and ATS trends.">
                <Switch
                  checked={notify.tips}
                  onCheckedChange={(v) => setNotify((n) => ({ ...n, tips: v }))}
                />
              </Row>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
