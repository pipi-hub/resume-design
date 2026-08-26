import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/common/Logo";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { ensureProfile } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log In — ResuMate" },
      {
        name: "description",
        content: "Log in to ResuMate to analyze your resume and track your progress.",
      },
      { property: "og:title", content: "Log In — ResuMate" },
      { property: "og:description", content: "Welcome back to your resume dashboard." },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleGoogle() {
    setError("");
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result && "error" in result && result.error) {
      setError(result.error.message || "Google sign-in isn't available yet.");
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <Logo />
          <h1 className="mt-8 font-display text-3xl font-bold">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Log in to continue improving your resume.
          </p>
          <Card className="mt-6 shadow-card">
            <CardContent className="p-6">
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const data = new FormData(e.currentTarget);
                  const email = String(data.get("email") ?? "").trim();
                  const password = String(data.get("password") ?? "");
                  if (!email || !password) {
                    setError("Please enter both your email and password.");
                    return;
                  }
                  setError("");
                  setBusy(true);
                  const { data: result, error: signInError } =
                    await supabase.auth.signInWithPassword({
                      email,
                      password,
                    });
                  setBusy(false);
                  if (signInError) {
                    setError(
                      signInError.message === "Invalid login credentials"
                        ? "That email and password don't match an account."
                        : signInError.message,
                    );
                    return;
                  }
                  if (result.user) await ensureProfile(result.user);
                  toast.success("Logged in ✓");
                  navigate({ to: "/dashboard" });
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                  />
                </div>
                {error ? (
                  <p
                    role="alert"
                    className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive"
                  >
                    {error}
                  </p>
                ) : null}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox id="remember" />
                    <Label htmlFor="remember" className="text-xs font-normal">
                      Remember me
                    </Label>
                  </div>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Button type="submit" variant="hero" className="w-full" disabled={busy}>
                  {busy ? "Logging in…" : "Login"}
                </Button>
                <Button type="button" variant="outline" className="w-full" onClick={handleGoogle}>
                  Continue with Google
                </Button>
              </form>
              <p className="mt-5 text-center text-xs text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/register" className="font-medium text-primary hover:underline">
                  Create one
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="hidden items-center justify-center gradient-hero p-12 text-primary-foreground lg:flex">
        <div className="max-w-sm">
          <h2 className="font-display text-3xl font-bold">
            Students improve their ATS score by 15 points on average.
          </h2>
          <p className="mt-4 text-sm opacity-90">
            ResuMate shows exactly which keywords, sections and skills are missing — then helps you
            rewrite them.
          </p>
        </div>
      </div>
    </div>
  );
}
