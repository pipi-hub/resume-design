import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Copy, Lightbulb, RefreshCw, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { resumeService, type ImproveBulletResponse } from "@/services/resumeService";

export function BulletImprover() {
  const [input, setInput] = useState(
    "Fixed minor JavaScript bugs and tested application features.",
  );
  const [data, setData] = useState<ImproveBulletResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function improve() {
    if (!input.trim()) {
      setError("Please enter a bullet point first.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await resumeService.improveBullet(input);
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const improvedText = data?.improvedBullet || data?.result || "";

  return (
    <Card className="shadow-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-semibold">Improve Your Resume Bullet Point</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Paste a bullet point from your resume to rewrite it into a stronger, professional
              action-oriented statement without invented facts.
            </p>
          </div>
          <Badge
            variant="outline"
            className="hidden sm:flex items-center gap-1 border-primary/30 text-primary"
          >
            <Sparkles className="size-3" /> Factual & ATS-Safe
          </Badge>
        </div>

        <div className="mt-4 space-y-2">
          <Label htmlFor="bullet">Your bullet point</Label>
          <Textarea
            id="bullet"
            rows={3}
            value={input}
            placeholder="e.g. Built a student result management system using Java and MySQL."
            onChange={(e) => {
              setInput(e.target.value);
              if (error) setError("");
            }}
          />
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Button variant="hero" onClick={improve} disabled={loading || !input.trim()}>
            {loading ? <RefreshCw className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
            {loading ? "Improving with AI…" : "Improve with AI"}
          </Button>
          {improvedText ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setInput("");
                setData(null);
                setError("");
              }}
            >
              Clear
            </Button>
          ) : null}
        </div>

        {error ? (
          <p
            role="alert"
            className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </p>
        ) : null}

        {improvedText ? (
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
                  <Sparkles className="size-3.5" /> Improved Bullet Point
                </p>
                {data?.isAlreadyStrong ? (
                  <Badge
                    variant="secondary"
                    className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                  >
                    <CheckCircle2 className="size-3 mr-1 inline" /> Originally Strong
                  </Badge>
                ) : null}
              </div>

              {data?.statusNote ? (
                <p className="mt-1 text-xs text-muted-foreground italic">{data.statusNote}</p>
              ) : null}

              <p className="mt-2 text-sm font-medium text-foreground leading-relaxed">
                • {improvedText}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard?.writeText(improvedText);
                    toast.success("Copied to clipboard ✓");
                  }}
                >
                  <Copy className="size-3.5" /> Copy Bullet
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setInput(improvedText);
                    toast.success("Bullet point replaced in editor ✓");
                  }}
                >
                  Replace in Input
                </Button>
                <Button size="sm" variant="ghost" onClick={improve} disabled={loading}>
                  <RefreshCw className="size-3.5" /> Try Again
                </Button>
              </div>
            </div>

            {data?.optionalEnhancement ? (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 text-xs text-amber-900 dark:text-amber-200">
                <div className="flex items-start gap-2">
                  <Lightbulb className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-amber-950 dark:text-amber-100">
                      Optional Metric / Impact Enhancement:
                    </span>{" "}
                    {data.optionalEnhancement}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
