import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { BulletImprover } from "@/components/app/BulletImprover";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, CheckCircle2, Sparkles, Wand2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/improve")({
  head: () => ({
    meta: [
      { title: "Resume Improvement — ResuMate" },
      {
        name: "description",
        content:
          "Transform your resume bullet points into high-impact, ATS-optimized accomplishment statements with step-by-step guidance.",
      },
      { property: "og:title", content: "Resume Improvement — ResuMate" },
      {
        property: "og:description",
        content:
          "Step-by-step AI resume improvement flow with impact ratings, category filters, and explanations.",
      },
    ],
  }),
  component: ImprovePage,
});

function ImprovePage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <PageHeader
          title="Resume Improvement Workshop"
          subtitle="Refine accomplishment statements, elevate metrics, and ensure ATS compatibility with step-by-step AI suggestions."
        />

        {/* Step-by-Step AI Improvement Card */}
        <BulletImprover />

        {/* Action card linking to full resume builder */}
        <Card className="shadow-card border-primary/20 bg-muted/20">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-display text-base font-semibold flex items-center gap-2">
                <FileText className="size-4.5 text-primary" />
                Ready to assemble your full resume?
              </h3>
              <p className="text-xs text-muted-foreground">
                Take your optimized statements and assemble a complete, recruiter-approved ATS
                resume using our guided section builder.
              </p>
            </div>
            <Button asChild variant="hero" size="sm" className="shrink-0 gap-1.5">
              <Link to="/builder">
                Open Resume Builder
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
