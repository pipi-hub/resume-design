import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/PublicLayout";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — ResuMate" },
      {
        name: "description",
        content: "The terms that apply when you use ResuMate's resume analysis tools.",
      },
      { property: "og:title", content: "Terms of Service — ResuMate" },
      { property: "og:description", content: "Fair-use terms for ResuMate accounts." },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <PublicLayout>
      <section className="mx-auto w-full max-w-3xl px-4 py-16">
        <h1 className="font-display text-4xl font-extrabold">Terms of Service</h1>
        <div className="mt-6 space-y-5 text-sm leading-relaxed text-muted-foreground">
          <p>
            ResuMate provides guidance, not a guarantee of employment. Always review AI suggestions
            before using them.
          </p>
          <p>
            Upload only documents you have the right to share. Do not upload other people's resumes
            without permission.
          </p>
          <p>Accounts are for individual use. Automated scraping of the service is not allowed.</p>
          <p>We may update these terms; significant changes will be announced in the app.</p>
        </div>
      </section>
    </PublicLayout>
  );
}
