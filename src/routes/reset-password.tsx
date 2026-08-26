import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/common/Logo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a New ResuMate Password" },
      { name: "description", content: "Choose a new password for your ResuMate account." },
      { property: "og:title", content: "Set a New ResuMate Password" },
      { property: "og:description", content: "Finish resetting your ResuMate password." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Logo />
        <Card className="mt-8 shadow-card">
          <CardContent className="p-6">
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                if (password.length < 8) {
                  setError("Use at least 8 characters.");
                  return;
                }
                if (password !== confirm) {
                  setError("Your passwords don't match yet.");
                  return;
                }
                setError("");
                setBusy(true);
                const { error: updateError } = await supabase.auth.updateUser({ password });
                setBusy(false);
                if (updateError) {
                  setError(updateError.message);
                  return;
                }
                toast.success("Password updated ✓");
                navigate({ to: "/dashboard" });
              }}
            >
              <h1 className="font-display text-xl font-bold">Set a new password</h1>
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm new password</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
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
                {busy ? "Updating…" : "Update password"}
              </Button>
              <Button variant="ghost" className="w-full" asChild>
                <Link to="/login">Back to login</Link>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
