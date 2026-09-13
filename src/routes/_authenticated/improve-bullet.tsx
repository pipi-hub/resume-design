import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { BulletImprover } from "@/components/app/BulletImprover";
import { PageHeader } from "@/components/common/PageHeader";

export const Route = createFileRoute("/_authenticated/improve-bullet")({
  head: () => ({
    meta: [
      { title: "Improve Resume Bullet — ResuMate" },
      {
        name: "description",
        content:
          "Transform your resume bullet points into high-impact, ATS-optimized accomplishment statements.",
      },
      { property: "og:title", content: "Improve Resume Bullet — ResuMate" },
      {
        property: "og:description",
        content: "Before and after AI resume bullet point enhancement without hallucinated facts.",
      },
    ],
  }),
  component: ImproveBulletPage,
});

function ImproveBulletPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <PageHeader
          title="Elevate Your Impact"
          subtitle="Transform passive duty statements into high-impact, evidence-based accomplishment bullets."
        />
        <BulletImprover />
      </div>
    </AppShell>
  );
}
