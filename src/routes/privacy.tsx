import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/PublicLayout";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — ResuMate" },
      { name: "description", content: "How ResuMate stores, uses and deletes your resume data." },
      { property: "og:title", content: "Privacy Policy — ResuMate" },
      {
        property: "og:description",
        content: "Your resume belongs to you. Here's how we handle it.",
      },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <PublicLayout>
      <section className="mx-auto w-full max-w-3xl px-4 py-16">
        <h1 className="font-display text-4xl font-extrabold">Privacy Policy</h1>
        <div className="mt-6 space-y-5 text-sm leading-relaxed text-muted-foreground">
          <p>Your resume belongs to you. We use it only to produce the analysis you requested.</p>
          <p>
            You can delete any resume version from the Resume History page at any time; deletion
            removes the file and its analysis.
          </p>
          <p>
            We never sell your data or share it with recruiters. Resume text is not used to train
            public AI models.
          </p>
          <p>You can export or permanently delete your whole account from Settings → Privacy.</p>
        </div>
      </section>
    </PublicLayout>
  );
}
