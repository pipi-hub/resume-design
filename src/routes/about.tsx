import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About ResuMate — Career Help for Students" },
      {
        name: "description",
        content:
          "Why ResuMate exists: helping students and fresh graduates write resumes that pass ATS screening.",
      },
      { property: "og:title", content: "About ResuMate — Career Help for Students" },
      {
        property: "og:description",
        content: "Our mission is to make good career advice available to every student.",
      },
    ],
  }),
  component: About,
});

const values = [
  {
    title: "Plain language first",
    desc: "No jargon. Every score comes with a sentence explaining what to do about it.",
  },
  {
    title: "Built for beginners",
    desc: "Designed around the first resume, not the tenth job change.",
  },
  {
    title: "Actionable, not abstract",
    desc: "Each insight ends in a concrete next step you can finish today.",
  },
];

function About() {
  return (
    <PublicLayout>
      <section className="mx-auto w-full max-w-3xl px-4 py-16">
        <h1 className="font-display text-4xl font-extrabold">About ResuMate</h1>
        <p className="mt-4 text-muted-foreground">
          Most students write their first resume with no feedback at all. Meanwhile, companies use
          software to filter applications before a person ever reads them. ResuMate closes that gap:
          it reads your resume the way hiring software does, compares it with the job you want, and
          tells you — simply — what to change.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {values.map((v) => (
            <Card key={v.title} className="shadow-card">
              <CardContent className="p-6">
                <h2 className="font-display text-base font-semibold">{v.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{v.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
