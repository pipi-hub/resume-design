import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PublicLayout } from "@/components/site/PublicLayout";
import { features } from "@/lib/mock-data";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — ResuMate Resume Tools" },
      {
        name: "description",
        content:
          "ATS checks, job matching, skill gaps, AI suggestions, resume builder, cover letters and interview prep.",
      },
      { property: "og:title", content: "Features — ResuMate Resume Tools" },
      { property: "og:description", content: "Every ResuMate tool explained in plain language." },
    ],
  }),
  component: FeaturesPage,
});

function FeaturesPage() {
  return (
    <PublicLayout>
      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <h1 className="font-display text-4xl font-extrabold">Features</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Every tool in ResuMate exists to answer one question: what should I change before I apply?
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="shadow-card">
              <CardContent className="p-6">
                <CheckCircle2 className="size-5 text-primary" />
                <h2 className="mt-3 font-display text-lg font-semibold">{f.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <Button variant="hero" size="xl" className="mt-10" asChild>
          <Link to="/analyze">Try it with my resume</Link>
        </Button>
      </section>
    </PublicLayout>
  );
}
