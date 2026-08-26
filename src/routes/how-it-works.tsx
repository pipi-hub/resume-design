import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PublicLayout } from "@/components/site/PublicLayout";
import { steps } from "@/lib/mock-data";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How ResuMate Works — 4 Simple Steps" },
      {
        name: "description",
        content:
          "Upload your resume, add a job description, let AI analyze it, then improve and apply.",
      },
      { property: "og:title", content: "How ResuMate Works — 4 Simple Steps" },
      {
        property: "og:description",
        content: "From upload to a stronger application in four steps.",
      },
    ],
  }),
  component: HowItWorks,
});

function HowItWorks() {
  return (
    <PublicLayout>
      <section className="mx-auto w-full max-w-3xl px-4 py-16">
        <h1 className="font-display text-4xl font-extrabold">How It Works</h1>
        <p className="mt-3 text-muted-foreground">
          You never have to guess what to do next — ResuMate walks you through each step.
        </p>
        <ol className="mt-10 space-y-4">
          {steps.map((s) => (
            <li key={s.n} className="flex gap-4 rounded-2xl border bg-card p-6 shadow-card">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full gradient-hero font-display font-bold text-primary-foreground">
                {s.n}
              </span>
              <div>
                <h2 className="font-display text-lg font-semibold">{s.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
        <Button variant="hero" size="xl" className="mt-10" asChild>
          <Link to="/analyze">Start step 1</Link>
        </Button>
      </section>
    </PublicLayout>
  );
}
