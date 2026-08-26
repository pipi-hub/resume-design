import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/common/Logo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset Your ResuMate Password" },
      {
        name: "description",
        content: "Enter your email and we'll send you a link to reset your ResuMate password.",
      },
      { property: "og:title", content: "Reset Your ResuMate Password" },
      { property: "og:description", content: "Password reset in two steps." },
    ],
  }),
  component: Forgot,
});

function Forgot() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Logo />
        <Card className="mt-8 shadow-card">
          <CardContent className="p-6">
            {sent ? (
              <div className="text-center">
                <MailCheck className="mx-auto size-9 text-success" />
                <h1 className="mt-4 font-display text-xl font-bold">Check your inbox</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  We sent a password reset link. It expires in 30 minutes.
                </p>
                <Button variant="outline" className="mt-6 w-full" asChild>
                  <Link to="/login">Back to login</Link>
                </Button>
              </div>
            ) : (
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
                  setError("");
                  setBusy(true);
                  const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/reset-password`,
                  });
                  setBusy(false);
                  if (resetError) {
                    setError(resetError.message);
                    return;
                  }
                  setSent(true);
                }}
              >
                <h1 className="font-display text-xl font-bold">Forgot your password?</h1>
                <p className="text-sm text-muted-foreground">
                  Enter the email you signed up with and we'll send a reset link.
                </p>
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
                {error ? (
                  <p
                    role="alert"
                    className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive"
                  >
                    {error}
                  </p>
                ) : null}
                <Button type="submit" variant="hero" className="w-full" disabled={busy}>
                  {busy ? "Sending…" : "Send reset link"}
                </Button>

                <Button variant="ghost" className="w-full" asChild>
                  <Link to="/login">Back to login</Link>
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
