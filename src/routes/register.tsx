import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Logo } from "@/components/common/Logo";
import { supabase } from "@/integrations/supabase/client";
import { ensureProfile } from "@/lib/auth";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create Your ResuMate Account" },
      {
        name: "description",
        content:
          "Sign up free to analyze your resume, match it with jobs and prepare for interviews.",
      },
      { property: "og:title", content: "Create Your ResuMate Account" },
      { property: "og:description", content: "Free for students and fresh graduates." },
    ],
  }),
  component: Register,
});

function strengthOf(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

function Register() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [career, setCareer] = useState("");
  const [busy, setBusy] = useState(false);
  const strength = useMemo(() => strengthOf(password), [password]);
  const labels = ["Too weak", "Weak", "Okay", "Strong", "Very strong"];
  const tones = ["bg-muted", "bg-destructive", "bg-warning", "bg-success", "bg-success"];

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Logo />
        <h1 className="mt-8 font-display text-3xl font-bold">Create your account</h1>
        <p className="mt-2 text-sm text-muted-foreground">It takes less than a minute.</p>
        <Card className="mt-6 shadow-card">
          <CardContent className="p-6">
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                const fullName = String(data.get("fullName") ?? "").trim();
                const email = String(data.get("email") ?? "").trim();
                const targetRole = String(data.get("role") ?? "").trim();
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                  setError("Please enter a valid email address.");
                  return;
                }
                if (password !== confirm) {
                  setError("Your passwords don't match yet.");
                  return;
                }
                if (strength < 2) {
                  setError("Please choose a stronger password (8+ characters with a number).");
                  return;
                }
                setError("");
                setBusy(true);
                const { data: result, error: signUpError } = await supabase.auth.signUp({
                  email,
                  password,
                  options: {
                    emailRedirectTo: window.location.origin,
                    data: { full_name: fullName, career_level: career, target_role: targetRole },
                  },
                });
                setBusy(false);
                if (signUpError) {
                  setError(
                    signUpError.message.includes("already registered")
                      ? "That email already has an account — try logging in."
                      : signUpError.message,
                  );
                  return;
                }
                if (result.session && result.user) {
                  await ensureProfile(result.user, { fullName, careerLevel: career, targetRole });
                  toast.success("Account created ✓", {
                    description: "Start by uploading your resume.",
                  });
                  navigate({ to: "/dashboard" });
                  return;
                }
                toast.success("Check your email to confirm your account", {
                  description: "We sent you a confirmation link. Log in once it's confirmed.",
                });
                navigate({ to: "/login" });
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" name="fullName" required placeholder="Arpita Das" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                />
                <div className="flex items-center gap-2">
                  <div className="flex h-1.5 flex-1 gap-1" aria-hidden>
                    {[0, 1, 2, 3].map((i) => (
                      <span
                        key={i}
                        className={`h-full flex-1 rounded-full ${i < strength ? tones[strength] : "bg-muted"}`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] text-muted-foreground">{labels[strength]}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="career">Career level (optional)</Label>
                  <Select value={career} onValueChange={setCareer}>
                    <SelectTrigger id="career">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="fresh">Fresh graduate</SelectItem>
                      <SelectItem value="intern">Internship applicant</SelectItem>
                      <SelectItem value="entry">Entry level</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Target job role (optional)</Label>
                  <Input id="role" name="role" placeholder="Software Engineer" />
                </div>
              </div>
              {error ? (
                <p
                  role="alert"
                  className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive"
                >
                  {error}
                </p>
              ) : null}
              <Button type="submit" variant="hero" className="w-full" disabled={busy}>
                {busy ? "Creating account…" : "Create Account"}
              </Button>
            </form>
            <p className="mt-5 text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Log in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
