import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Gauge,
  Lightbulb,
  RefreshCw,
  Sparkles,
  Wand2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { resumeService, type ImproveBulletResponse } from "@/services/resumeService";
import { useCareerContext } from "@/context/app-context";

type FilterCategory = "Impact" | "Brevity" | "Keywords" | "Tone";

const SAMPLE_BULLETS = [
  "Fixed minor JavaScript bugs and tested application features.",
  "Worked with team to build React user interface components.",
  "Helped improve database queries and made the site load faster.",
  "Responsible for writing documentation and assisting customers with onboarding.",
];

export function BulletImprover() {
  const career = useCareerContext();
  const [input, setInput] = useState(SAMPLE_BULLETS[0]);
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>("Impact");
  const [data, setData] = useState<ImproveBulletResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [applied, setApplied] = useState(false);

  async function improve(categoryToUse = selectedCategory) {
    if (!input.trim()) {
      setError("Please enter a bullet point first.");
      return;
    }
    setLoading(true);
    setError("");
    setApplied(false);
    try {
      const targetRole =
        career.targetRole || sessionStorage.getItem("resumate_job_title") || "Software Engineer";
      const res = await resumeService.improveBullet(
        input,
        targetRole,
        `Optimization focus: ${categoryToUse}. Elevate impact without inventing false claims.`,
      );
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const improvedText = data?.improvedBullet || data?.result || "";

  // Derive why the change was made based on the selected category and data
  const changeExplanation =
    data?.statusNote ||
    (selectedCategory === "Impact"
      ? "Replaced passive phrasing with an action verb, eliminated filler, and framed tasks around measurable outcomes."
      : selectedCategory === "Brevity"
        ? "Eliminated redundant prepositional phrases and tightened sentence structure for optimal ATS scan speed."
        : selectedCategory === "Keywords"
          ? "Front-loaded industry-standard technical terminology and clear framework proficiencies."
          : "Elevated professional tone to convey confident ownership, leadership, and proactive problem-solving.");

  function handleAccept() {
    if (!improvedText) return;
    setInput(improvedText);
    setApplied(true);
    toast.success("Applied! Enhanced bullet point accepted into your draft.", {
      description: "You can continue tweaking or copy this statement to your resume.",
    });
  }

  return (
    <Card className="shadow-card border-border/70 overflow-hidden">
      <div className="border-b bg-muted/30 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <Wand2 className="size-5 text-primary" />
            Resume Improvement Workshop
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Compare original text with AI enhancements, assess impact ratings, and refine phrasing
            step-by-step.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-primary/30 bg-primary/5 text-primary text-xs font-semibold px-2.5 py-1 flex items-center gap-1.5"
          >
            <Sparkles className="size-3" /> Factual & ATS-Safe
          </Badge>
        </div>
      </div>

      <CardContent className="p-6 space-y-6">
        {/* Category Filters Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-muted-foreground uppercase tracking-wider">
              Improvement Goal / Filter:
            </span>
            <span className="text-muted-foreground">Tailor your AI enhancement focus</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["Impact", "Brevity", "Keywords", "Tone"] as FilterCategory[]).map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat);
                    if (improvedText) {
                      void improve(cat);
                    }
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    active
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-muted/50 text-foreground/80 border-border/70 hover:bg-muted"
                  }`}
                >
                  {cat === "Impact" && "⚡ Impact & Metrics"}
                  {cat === "Brevity" && "✂️ Brevity & Punch"}
                  {cat === "Keywords" && "🎯 ATS Keywords"}
                  {cat === "Tone" && "👔 Professional Tone"}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Samples */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium">Try example:</span>
          {SAMPLE_BULLETS.slice(0, 3).map((sample, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setInput(sample);
                setData(null);
                setApplied(false);
              }}
              className="text-primary hover:underline truncate max-w-[200px]"
              title={sample}
            >
              &quot;{sample}&quot;
            </button>
          ))}
        </div>

        {/* Comparison Layout */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* LEFT: Original Statement */}
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="bullet"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Original Text
              </Label>
              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                Before
              </Badge>
            </div>
            <Textarea
              id="bullet"
              rows={5}
              value={input}
              placeholder="e.g. Fixed minor bugs and updated React components for the student portal."
              className="resize-none font-sans text-sm leading-relaxed"
              onChange={(e) => {
                setInput(e.target.value);
                if (error) setError("");
                setApplied(false);
              }}
            />
            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="hero"
                className="flex-1"
                onClick={() => improve()}
                disabled={loading || !input.trim()}
              >
                {loading ? (
                  <RefreshCw className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                {loading ? "Optimizing…" : "Generate AI Improvement"}
              </Button>
              {improvedText ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setInput("");
                    setData(null);
                    setError("");
                    setApplied(false);
                  }}
                >
                  Clear
                </Button>
              ) : null}
            </div>

            {error ? (
              <p
                role="alert"
                className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive font-medium"
              >
                {error}
              </p>
            ) : null}
          </div>

          {/* RIGHT: AI-Suggested Improvement */}
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Sparkles className="size-3.5" /> AI-Suggested Improvement
              </Label>
              {improvedText ? (
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant="secondary"
                    className="text-[11px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1"
                  >
                    <Gauge className="size-3" /> High Impact
                  </Badge>
                </div>
              ) : (
                <span className="text-[11px] text-muted-foreground">After</span>
              )}
            </div>

            <div
              className={`flex-1 min-h-[140px] rounded-xl border p-4 flex flex-col justify-between transition-all ${
                improvedText
                  ? "border-primary/30 bg-primary/5 shadow-sm"
                  : "border-dashed border-border/80 bg-muted/20 items-center justify-center text-center"
              }`}
            >
              {improvedText ? (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-foreground leading-relaxed">
                    • {improvedText}
                  </p>

                  {/* Why this change was made */}
                  <div className="rounded-lg bg-background/80 border border-border/60 p-3 space-y-1 text-xs">
                    <span className="font-semibold text-primary flex items-center gap-1.5">
                      <Lightbulb className="size-3.5" /> Why this change works:
                    </span>
                    <p className="text-muted-foreground leading-relaxed pl-5">
                      {changeExplanation}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <Wand2 className="size-8 mx-auto mb-2 opacity-30 text-primary" />
                  <p className="text-xs font-medium">Your enhanced statement will appear here.</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Select a focus filter and click &ldquo;Generate AI Improvement&rdquo;.
                  </p>
                </div>
              )}

              {improvedText ? (
                <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-primary/10">
                  <Button
                    size="sm"
                    variant={applied ? "secondary" : "hero"}
                    onClick={handleAccept}
                    className="gap-1.5"
                  >
                    {applied ? (
                      <Check className="size-3.5 text-emerald-500" />
                    ) : (
                      <CheckCircle2 className="size-3.5" />
                    )}
                    {applied ? "Applied to Draft ✓" : "Accept & Apply"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-background gap-1.5"
                    onClick={() => {
                      navigator.clipboard?.writeText(improvedText);
                      toast.success("Improved statement copied to clipboard ✓");
                    }}
                  >
                    <Copy className="size-3.5" /> Copy
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs ml-auto"
                    onClick={() => improve()}
                    disabled={loading}
                  >
                    <RefreshCw className="size-3.5" /> Regenerate
                  </Button>
                </div>
              ) : null}
            </div>

            {data?.optionalEnhancement ? (
              <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                <Zap className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-amber-950 dark:text-amber-100">
                    Suggested Metrics Placeholder:
                  </span>{" "}
                  {data.optionalEnhancement}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
