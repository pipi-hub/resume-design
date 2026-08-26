import { useState } from "react";
import { toast } from "sonner";
import { Copy, RefreshCw, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { resumeService } from "@/services/resumeService";

export function BulletImprover() {
  const [input, setInput] = useState("Worked on a website using React.");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function improve() {
    setLoading(true);
    setError("");
    try {
      setResult(await resumeService.improveBullet(input));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="shadow-card">
      <CardContent className="p-6">
        <h2 className="font-display text-lg font-semibold">Improve Your Resume Bullet Point</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste a weak line from your resume and we'll rewrite it in professional language.
        </p>
        <div className="mt-4 space-y-2">
          <Label htmlFor="bullet">Your bullet point</Label>
          <Textarea id="bullet" rows={3} value={input} onChange={(e) => setInput(e.target.value)} />
        </div>
        <Button variant="hero" className="mt-3" onClick={improve} disabled={loading}>
          {loading ? <RefreshCw className="animate-spin" /> : <Wand2 />}
          {loading ? "Improving…" : "Improve with AI"}
        </Button>
        {error ? (
          <p
            role="alert"
            className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </p>
        ) : null}
        {result ? (
          <div className="mt-4 rounded-xl border gradient-soft p-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
              <Sparkles className="size-3.5 text-primary" /> Improved version
            </p>
            <p className="mt-2 text-sm">{result}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard?.writeText(result);
                  toast.success("Copied to clipboard ✓");
                }}
              >
                <Copy /> Copy
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setInput(result);
                  toast.success("Bullet point replaced ✓");
                }}
              >
                Replace
              </Button>
              <Button size="sm" variant="ghost" onClick={improve}>
                <RefreshCw /> Try Again
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
