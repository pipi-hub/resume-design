import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Loader2, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { resumeService } from "@/services/resumeService";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "Resume History — ResuMate" },
      {
        name: "description",
        content: "Every resume version you analysed, with ATS and job match scores over time.",
      },
      { property: "og:title", content: "Resume History — ResuMate" },
      {
        property: "og:description",
        content: "See how your resume scores improved version by version.",
      },
    ],
  }),
  component: HistoryPage,
});

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function HistoryPage() {
  const {
    data: items = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["history-analyses-and-resumes"],
    queryFn: async () => {
      const [resumes, analyses] = await Promise.all([
        resumeService.listResumes().catch(() => []),
        resumeService.listAnalyses().catch(() => []),
      ]);

      if (analyses.length > 0) {
        return analyses.map((a) => ({
          id: a.id,
          title: a.job_title
            ? `${a.job_title}${a.company ? ` (${a.company})` : ""}`
            : a.resume_title || "Resume Analysis",
          fileName: a.resume_title || "Resume.pdf",
          format: "PDF",
          atsScore: a.ats_score ? `${a.ats_score}%` : "—",
          matchScore: a.match_score ? `${a.match_score}%` : "—",
          date: a.created_at,
          linkId: a.id,
        }));
      }

      return resumes.map((r) => ({
        id: r.id,
        title: r.title || "Resume",
        fileName: r.file_name || "Resume.pdf",
        format: r.file_name?.split(".").pop()?.toUpperCase() ?? "PDF",
        atsScore: "—",
        matchScore: "—",
        date: r.created_at,
        linkId: undefined,
      }));
    },
  });

  return (
    <AppShell>
      <div className="space-y-8">
        <PageHeader
          title="Resume history"
          subtitle="Compare your resume versions and watch your scores improve over time."
          action={
            <Button variant="hero" asChild>
              <Link to="/analyze">
                <ScanLine /> Analyze a new version
              </Link>
            </Button>
          }
        />

        <Card className="shadow-card">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 px-6 py-14 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Loading your history…
              </div>
            ) : isError ? (
              <p
                role="alert"
                className="m-6 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error instanceof Error
                  ? error.message
                  : "Could not load your history. Please try again."}
              </p>
            ) : items.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="No resumes yet"
                  description="Upload your first resume to start tracking versions and analysis reports here."
                  action={
                    <Button variant="hero" asChild>
                      <Link to="/analyze">
                        <ScanLine /> Upload a resume
                      </Link>
                    </Button>
                  }
                />
              </div>
            ) : (
              <>
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Target / Title</TableHead>
                        <TableHead>File</TableHead>
                        <TableHead>Format</TableHead>
                        <TableHead>ATS</TableHead>
                        <TableHead>Match</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Report</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.title}</TableCell>
                          <TableCell className="max-w-48 truncate text-muted-foreground">
                            {r.fileName}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{r.format}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{r.atsScore}</TableCell>
                          <TableCell className="font-medium">{r.matchScore}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(r.date)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" asChild>
                              <Link to="/analysis" search={{ id: r.linkId || "" } as never}>
                                View <ArrowUpRight />
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="divide-y md:hidden">
                  {items.map((r) => (
                    <div key={r.id} className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{r.title}</p>
                          <p className="text-xs text-muted-foreground">{r.fileName}</p>
                        </div>
                        <Badge variant="secondary">{r.format}</Badge>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          ATS: {r.atsScore} · Match: {r.matchScore}
                        </span>
                        <span>{formatDate(r.date)}</span>
                      </div>
                      <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
                        <Link to="/analysis" search={{ id: r.linkId || "" } as never}>
                          View Report <ArrowUpRight />
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
