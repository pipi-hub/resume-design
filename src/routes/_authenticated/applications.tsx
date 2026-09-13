import { useState, useMemo, useEffect, useCallback } from "react";
import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  Kanban,
  List as ListIcon,
  Calendar,
  ExternalLink,
  FileText,
  Trash2,
  Edit,
  CheckCircle2,
  Clock,
  Award,
  XCircle,
  Bookmark,
  Sparkles,
  ArrowRight,
  MoreVertical,
  ChevronRight,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuthUser } from "@/lib/auth";
import { useCareerContext } from "@/context/app-context";
import {
  applicationService,
  type ApplicationRow,
  type ApplicationStatus,
  type ApplicationInsert,
} from "@/services/applicationService";
import { resumeService, type ResumeRow } from "@/services/resumeService";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/applications")({
  head: () => ({
    meta: [
      { title: "Job Application Tracker — ResuMate" },
      {
        name: "description",
        content:
          "Track your job applications, interviews, offers, and resume alignment across your career search.",
      },
      { property: "og:title", content: "Job Application Tracker — ResuMate" },
      {
        property: "og:description",
        content: "Organize job applications, interview stages, and ATS alignment in one place.",
      },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    track: typeof search.track === "string" ? search.track : undefined,
  }),
  component: ApplicationsPage,
});

const STAGES: Array<{
  status: ApplicationStatus;
  label: string;
  desc: string;
  icon: typeof Bookmark;
  badgeCls: string;
  borderCls: string;
  dotCls: string;
}> = [
  {
    status: "saved",
    label: "Saved",
    desc: "Target roles to apply to",
    icon: Bookmark,
    badgeCls: "bg-muted text-muted-foreground border-border",
    borderCls: "border-muted-foreground/30",
    dotCls: "bg-muted-foreground",
  },
  {
    status: "applied",
    label: "Applied",
    desc: "Applications submitted",
    icon: Clock,
    badgeCls:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
    borderCls: "border-blue-400/40",
    dotCls: "bg-blue-500",
  },
  {
    status: "interview",
    label: "Interview",
    desc: "Conversations & technical rounds",
    icon: Calendar,
    badgeCls:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    borderCls: "border-amber-400/40",
    dotCls: "bg-amber-500",
  },
  {
    status: "offer",
    label: "Offer",
    desc: "Job offers received",
    icon: Award,
    badgeCls:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    borderCls: "border-emerald-400/40",
    dotCls: "bg-emerald-500",
  },
  {
    status: "rejected",
    label: "Rejected",
    desc: "Roles not proceeding",
    icon: XCircle,
    badgeCls:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
    borderCls: "border-rose-400/30",
    dotCls: "bg-rose-500",
  },
];

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function ApplicationsPage() {
  const search = useSearch({ from: "/_authenticated/applications" });
  const { userId } = useAuthUser();
  const career = useCareerContext();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Dialog States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<ApplicationRow | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);

  // Form Data for Add / Edit
  const [formCompany, setFormCompany] = useState("");
  const [formJobTitle, setFormJobTitle] = useState("");
  const [formJobUrl, setFormJobUrl] = useState("");
  const [formJobDescription, setFormJobDescription] = useState("");
  const [formAppDate, setFormAppDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formStatus, setFormStatus] = useState<ApplicationStatus>("applied");
  const [formResumeId, setFormResumeId] = useState<string>("none");
  const [formAtsScore, setFormAtsScore] = useState<string>("");
  const [formMatchScore, setFormMatchScore] = useState<string>("");
  const [formNotes, setFormNotes] = useState("");

  // Query: Applications list
  const {
    data: applications = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["applications", userId],
    queryFn: () => applicationService.listApplications(userId || "guest"),
  });

  // Query: User's saved resumes for the dropdown
  const { data: userResumes = [] } = useQuery<ResumeRow[]>({
    queryKey: ["user-resumes-for-applications", userId],
    queryFn: () => resumeService.listResumes(userId || undefined),
  });

  const resetForm = useCallback(() => {
    setFormCompany("");
    setFormJobTitle("");
    setFormJobUrl("");
    setFormJobDescription("");
    setFormAppDate(new Date().toISOString().slice(0, 10));
    setFormStatus("applied");
    setFormResumeId("none");
    setFormAtsScore("");
    setFormMatchScore("");
    setFormNotes("");
  }, []);

  const openAddModalPrefilled = useCallback(() => {
    resetForm();
    if (career.company) setFormCompany(career.company);
    if (career.targetRole) setFormJobTitle(career.targetRole);
    if (career.jobDescription) setFormJobDescription(career.jobDescription);
    if (career.activeResumeId) setFormResumeId(career.activeResumeId);
    if (career.latestAnalysis) {
      setFormAtsScore(String(career.latestAnalysis.atsScore));
      setFormMatchScore(String(career.latestAnalysis.jobMatch));
    }
    setIsAddOpen(true);
  }, [career, resetForm]);

  // Prefill from query param (?track=true)
  useEffect(() => {
    if (search.track === "true") {
      openAddModalPrefilled();
    }
  }, [search.track, openAddModalPrefilled]);

  function openEditModal(app: ApplicationRow) {
    setFormCompany(app.company_name);
    setFormJobTitle(app.job_title);
    setFormJobUrl(app.job_url || "");
    setFormJobDescription(app.job_description || "");
    setFormAppDate(app.application_date || new Date().toISOString().slice(0, 10));
    setFormStatus(app.status);
    setFormResumeId(app.resume_id || "none");
    setFormAtsScore(
      app.ats_score !== null && app.ats_score !== undefined ? String(app.ats_score) : "",
    );
    setFormMatchScore(
      app.match_score !== null && app.match_score !== undefined ? String(app.match_score) : "",
    );
    setFormNotes(app.notes || "");
    setSelectedApp(app);
    setIsEditOpen(true);
  }

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (payload: ApplicationInsert) => {
      return applicationService.createApplication(payload);
    },
    onSuccess: (newRecord) => {
      queryClient.invalidateQueries({ queryKey: ["applications", userId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-data", userId] });
      toast.success(`Application for "${newRecord.company_name}" saved.`);
      setIsAddOpen(false);
      resetForm();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to create application.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ApplicationRow> }) => {
      return applicationService.updateApplication(id, updates, userId || "guest");
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["applications", userId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-data", userId] });
      toast.success(`Application for "${updated.company_name}" updated.`);
      setIsEditOpen(false);
      if (selectedApp && selectedApp.id === updated.id) {
        setSelectedApp(updated);
      }
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update application.");
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ApplicationStatus }) => {
      return applicationService.updateApplicationStatus(id, status, userId || "guest");
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["applications", userId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-data", userId] });
      const stageName = STAGES.find((s) => s.status === updated.status)?.label || updated.status;
      toast.success(`Moved ${updated.company_name} to "${stageName}".`);
      if (selectedApp && selectedApp.id === updated.id) {
        setSelectedApp(updated);
      }
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to change stage.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return applicationService.deleteApplication(id, userId || "guest");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications", userId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-data", userId] });
      toast.success("Application removed.");
      setDeleteCandidateId(null);
      setIsDetailOpen(false);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to remove application.");
    },
  });

  function handleSaveAdd() {
    if (!formCompany.trim()) {
      toast.error("Company name is required.");
      return;
    }
    if (!formJobTitle.trim()) {
      toast.error("Job title is required.");
      return;
    }

    const selectedResume = userResumes.find((r) => r.id === formResumeId);
    const resumeName = selectedResume
      ? selectedResume.name || selectedResume.file_name || "Resume"
      : null;

    const payload: ApplicationInsert = {
      user_id: userId || "guest",
      company_name: formCompany.trim(),
      job_title: formJobTitle.trim(),
      job_url: formJobUrl.trim() || null,
      job_description: formJobDescription.trim() || null,
      application_date: formAppDate || new Date().toISOString().slice(0, 10),
      status: formStatus,
      resume_id: formResumeId !== "none" ? formResumeId : null,
      resume_name: formResumeId !== "none" ? resumeName : null,
      ats_score: formAtsScore ? parseInt(formAtsScore, 10) : null,
      match_score: formMatchScore ? parseInt(formMatchScore, 10) : null,
      notes: formNotes.trim() || null,
    };

    createMutation.mutate(payload);
  }

  function handleSaveEdit() {
    if (!selectedApp) return;
    if (!formCompany.trim()) {
      toast.error("Company name is required.");
      return;
    }
    if (!formJobTitle.trim()) {
      toast.error("Job title is required.");
      return;
    }

    const selectedResume = userResumes.find((r) => r.id === formResumeId);
    const resumeName = selectedResume
      ? selectedResume.name || selectedResume.file_name || "Resume"
      : null;

    updateMutation.mutate({
      id: selectedApp.id,
      updates: {
        company_name: formCompany.trim(),
        job_title: formJobTitle.trim(),
        job_url: formJobUrl.trim() || null,
        job_description: formJobDescription.trim() || null,
        application_date: formAppDate,
        status: formStatus,
        resume_id: formResumeId !== "none" ? formResumeId : null,
        resume_name: formResumeId !== "none" ? resumeName : null,
        ats_score: formAtsScore ? parseInt(formAtsScore, 10) : null,
        match_score: formMatchScore ? parseInt(formMatchScore, 10) : null,
        notes: formNotes.trim() || null,
      },
    });
  }

  // Filtered applications
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      const matchSearch =
        !searchTerm.trim() ||
        app.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.notes && app.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = statusFilter === "all" || app.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [applications, searchTerm, statusFilter]);

  // Stage counts for badges
  const stageCounts = useMemo(() => {
    const counts: Record<ApplicationStatus, number> = {
      saved: 0,
      applied: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
    };
    for (const app of applications) {
      if (app.status in counts) {
        counts[app.status]++;
      }
    }
    return counts;
  }, [applications]);

  const hasActiveAnalysisToPrefill = Boolean(
    career.targetRole || career.company || career.latestAnalysis,
  );

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Job Application Tracker"
          subtitle="Track your applications, interview milestones, and resume alignment across each role."
          action={
            <div className="flex flex-wrap items-center gap-2.5">
              {hasActiveAnalysisToPrefill && (
                <Button
                  variant="outline"
                  onClick={openAddModalPrefilled}
                  className="border-primary/30 text-primary hover:bg-primary/5 shadow-xs"
                >
                  <Sparkles className="size-4 mr-1.5 text-primary" />
                  Track Active Job
                </Button>
              )}
              <Button
                onClick={() => {
                  resetForm();
                  setIsAddOpen(true);
                }}
                className="shadow-xs"
              >
                <Plus className="size-4 mr-1.5" />
                Add Application
              </Button>
            </div>
          }
        />

        {/* Pipeline Stage Summary Pill Bar */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {STAGES.map((s) => {
            const Icon = s.icon;
            const count = stageCounts[s.status];
            const isSelected = statusFilter === s.status;
            return (
              <button
                key={s.status}
                type="button"
                onClick={() => setStatusFilter(isSelected ? "all" : s.status)}
                className={`flex items-center justify-between rounded-lg border p-3 text-left transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/30"
                    : "border-border/80 bg-card hover:border-border hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`size-2 rounded-full shrink-0 ${s.dotCls}`} />
                  <div className="truncate">
                    <p className="text-xs font-semibold text-foreground truncate">{s.label}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{s.desc}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="ml-2 shrink-0 font-bold text-xs">
                  {count}
                </Badge>
              </button>
            );
          })}
        </div>

        {/* Filter / Search & View Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex flex-1 items-center gap-2 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search company, job title, or notes…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            {statusFilter !== "all" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStatusFilter("all")}
                className="h-9 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear filter
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/30">
              <button
                type="button"
                onClick={() => setViewMode("kanban")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  viewMode === "kanban"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Kanban className="size-3.5" />
                <span>Kanban</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  viewMode === "list"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ListIcon className="size-3.5" />
                <span>List</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-2">
              <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground">Loading your applications…</p>
            </div>
          </div>
        ) : applications.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No applications tracked yet"
            description="Track the jobs you apply to, keep notes, and view which resume version you submitted."
            action={
              <Button
                onClick={() => {
                  resetForm();
                  setIsAddOpen(true);
                }}
              >
                <Plus className="size-4 mr-1.5" />
                Add First Application
              </Button>
            }
          />
        ) : filteredApps.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center bg-card">
            <p className="text-sm text-muted-foreground">
              No applications match your search criteria.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : viewMode === "kanban" ? (
          /* Kanban Board */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start overflow-x-auto pb-4">
            {STAGES.map((stage) => {
              const stageApps = filteredApps.filter((a) => a.status === stage.status);
              const StageIcon = stage.icon;

              return (
                <div
                  key={stage.status}
                  className="rounded-xl border border-border/80 bg-muted/20 p-3 min-w-[240px] flex flex-col gap-2.5"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between px-1 pb-1 border-b border-border/60">
                    <div className="flex items-center gap-1.5">
                      <StageIcon className="size-3.5 text-muted-foreground" />
                      <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                        {stage.label}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-[11px] h-5 px-1.5 font-bold">
                      {stageApps.length}
                    </Badge>
                  </div>

                  {/* Column Cards */}
                  <div className="space-y-2.5 min-h-[120px]">
                    {stageApps.length === 0 ? (
                      <div className="h-20 rounded-lg border border-dashed border-border/60 flex items-center justify-center text-xs text-muted-foreground/60">
                        No {stage.label.toLowerCase()} jobs
                      </div>
                    ) : (
                      stageApps.map((app) => (
                        <Card
                          key={app.id}
                          onClick={() => {
                            setSelectedApp(app);
                            setIsDetailOpen(true);
                          }}
                          className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-card group bg-card"
                        >
                          <CardContent className="p-3.5 space-y-2">
                            <div className="flex items-start justify-between gap-1.5">
                              <div className="min-w-0">
                                <h4 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                                  {app.company_name}
                                </h4>
                                <p className="text-xs text-muted-foreground truncate">
                                  {app.job_title}
                                </p>
                              </div>

                              {/* Card Action Menu */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    className="p-1 -mr-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <MoreVertical className="size-3.5" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44">
                                  <DropdownMenuLabel className="text-xs">
                                    Move to stage
                                  </DropdownMenuLabel>
                                  {STAGES.filter((s) => s.status !== app.status).map(
                                    (targetStage) => (
                                      <DropdownMenuItem
                                        key={targetStage.status}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          statusMutation.mutate({
                                            id: app.id,
                                            status: targetStage.status,
                                          });
                                        }}
                                      >
                                        <ArrowRight className="size-3.5 mr-2 text-muted-foreground" />
                                        {targetStage.label}
                                      </DropdownMenuItem>
                                    ),
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openEditModal(app);
                                    }}
                                  >
                                    <Edit className="size-3.5 mr-2 text-muted-foreground" />
                                    Edit Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteCandidateId(app.id);
                                    }}
                                  >
                                    <Trash2 className="size-3.5 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            {/* Scores & Resume Tags */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                              {app.ats_score !== null && app.ats_score !== undefined && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0 font-medium border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                                >
                                  ATS {app.ats_score}%
                                </Badge>
                              )}
                              {app.match_score !== null && app.match_score !== undefined && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0 font-medium border-primary/30 text-primary bg-primary/5"
                                >
                                  Match {app.match_score}%
                                </Badge>
                              )}
                              {app.resume_name && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground truncate max-w-[140px]">
                                  <FileText className="size-3 shrink-0" />
                                  <span className="truncate">{app.resume_name}</span>
                                </span>
                              )}
                            </div>

                            {/* Date Footer */}
                            <div className="flex items-center justify-between text-[11px] text-muted-foreground/80 pt-1 border-t border-border/40">
                              <span>Applied: {formatDate(app.application_date)}</span>
                              {app.job_url && (
                                <a
                                  href={app.job_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-muted-foreground hover:text-primary transition-colors"
                                  title="Open job posting"
                                >
                                  <ExternalLink className="size-3" />
                                </a>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List / Table View */
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="font-semibold text-xs">Company</TableHead>
                    <TableHead className="font-semibold text-xs">Position</TableHead>
                    <TableHead className="font-semibold text-xs">Stage</TableHead>
                    <TableHead className="font-semibold text-xs">Applied Date</TableHead>
                    <TableHead className="font-semibold text-xs">ATS</TableHead>
                    <TableHead className="font-semibold text-xs">Match</TableHead>
                    <TableHead className="font-semibold text-xs">Resume</TableHead>
                    <TableHead className="text-right font-semibold text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApps.map((app) => {
                    const stageConfig = STAGES.find((s) => s.status === app.status);
                    return (
                      <TableRow
                        key={app.id}
                        className="cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => {
                          setSelectedApp(app);
                          setIsDetailOpen(true);
                        }}
                      >
                        <TableCell className="font-semibold text-sm text-foreground">
                          <div className="flex items-center gap-2">
                            <span>{app.company_name}</span>
                            {app.job_url && (
                              <a
                                href={app.job_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-muted-foreground hover:text-primary"
                              >
                                <ExternalLink className="size-3" />
                              </a>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {app.job_title}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${stageConfig?.badgeCls}`}>
                            {stageConfig?.label || app.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(app.application_date)}
                        </TableCell>
                        <TableCell className="text-xs font-semibold">
                          {app.ats_score !== null && app.ats_score !== undefined
                            ? `${app.ats_score}%`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-xs font-semibold">
                          {app.match_score !== null && app.match_score !== undefined
                            ? `${app.match_score}%`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                          {app.resume_name || "—"}
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              onClick={() => openEditModal(app)}
                            >
                              <Edit className="size-3.5 text-muted-foreground" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteCandidateId(app.id)}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card List (avoids cramping) */}
            <div className="divide-y divide-border md:hidden">
              {filteredApps.map((app) => {
                const stageConfig = STAGES.find((s) => s.status === app.status);
                return (
                  <div
                    key={app.id}
                    onClick={() => {
                      setSelectedApp(app);
                      setIsDetailOpen(true);
                    }}
                    className="p-4 space-y-2 cursor-pointer hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-sm text-foreground">
                          {app.company_name}
                        </h4>
                        <p className="text-xs text-muted-foreground">{app.job_title}</p>
                      </div>
                      <Badge variant="outline" className={`text-xs ${stageConfig?.badgeCls}`}>
                        {stageConfig?.label || app.status}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-1">
                      <span>Applied: {formatDate(app.application_date)}</span>
                      {app.ats_score !== null && <span>• ATS {app.ats_score}%</span>}
                      {app.match_score !== null && <span>• Match {app.match_score}%</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* DIALOG: Add Application */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Job Application</DialogTitle>
              <DialogDescription>
                Track a job you're targeting or have applied for.
              </DialogDescription>
            </DialogHeader>

            {hasActiveAnalysisToPrefill && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex items-center justify-between gap-3">
                <div className="text-xs space-y-0.5">
                  <p className="font-semibold text-primary">Active Analysis Found</p>
                  <p className="text-muted-foreground">
                    {career.company || "Target Role"} — {career.targetRole || "Role"}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={openAddModalPrefilled}
                  className="text-xs shrink-0"
                >
                  <Sparkles className="size-3 mr-1 text-primary" />
                  Fill Active Info
                </Button>
              </div>
            )}

            <div className="space-y-4 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="add-company">Company Name *</Label>
                  <Input
                    id="add-company"
                    placeholder="e.g. Google, Acme Inc."
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="add-title">Job Title *</Label>
                  <Input
                    id="add-title"
                    placeholder="e.g. Junior Frontend Engineer"
                    value={formJobTitle}
                    onChange={(e) => setFormJobTitle(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="add-stage">Stage</Label>
                  <Select
                    value={formStatus}
                    onValueChange={(val) => setFormStatus(val as ApplicationStatus)}
                  >
                    <SelectTrigger id="add-stage">
                      <SelectValue placeholder="Select Stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGES.map((s) => (
                        <SelectItem key={s.status} value={s.status}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="add-date">Application Date</Label>
                  <Input
                    id="add-date"
                    type="date"
                    value={formAppDate}
                    onChange={(e) => setFormAppDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add-url">Job Posting URL (Optional)</Label>
                <Input
                  id="add-url"
                  placeholder="https://company.com/careers/..."
                  value={formJobUrl}
                  onChange={(e) => setFormJobUrl(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add-resume">Resume Version Used</Label>
                <Select value={formResumeId} onValueChange={setFormResumeId}>
                  <SelectTrigger id="add-resume">
                    <SelectValue placeholder="Select a resume" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None / Other</SelectItem>
                    {userResumes.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name || r.file_name || "Resume"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="add-ats">ATS Score % (Optional)</Label>
                  <Input
                    id="add-ats"
                    type="number"
                    min={0}
                    max={100}
                    placeholder="e.g. 85"
                    value={formAtsScore}
                    onChange={(e) => setFormAtsScore(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="add-match">Job Match % (Optional)</Label>
                  <Input
                    id="add-match"
                    type="number"
                    min={0}
                    max={100}
                    placeholder="e.g. 80"
                    value={formMatchScore}
                    onChange={(e) => setFormMatchScore(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add-notes">Notes (Optional)</Label>
                <Textarea
                  id="add-notes"
                  rows={2}
                  placeholder="Recruiter contact, referral details, interview date, salary range…"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add-jd">Job Description (Optional)</Label>
                <Textarea
                  id="add-jd"
                  rows={3}
                  placeholder="Paste snippet or full job description for reference…"
                  value={formJobDescription}
                  onChange={(e) => setFormJobDescription(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveAdd} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Saving…" : "Save Application"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DIALOG: Edit Application */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Application</DialogTitle>
              <DialogDescription>Update stage, scores, or application details.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-company">Company Name *</Label>
                  <Input
                    id="edit-company"
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-title">Job Title *</Label>
                  <Input
                    id="edit-title"
                    value={formJobTitle}
                    onChange={(e) => setFormJobTitle(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-stage">Stage</Label>
                  <Select
                    value={formStatus}
                    onValueChange={(val) => setFormStatus(val as ApplicationStatus)}
                  >
                    <SelectTrigger id="edit-stage">
                      <SelectValue placeholder="Select Stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGES.map((s) => (
                        <SelectItem key={s.status} value={s.status}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-date">Application Date</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={formAppDate}
                    onChange={(e) => setFormAppDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-url">Job Posting URL</Label>
                <Input
                  id="edit-url"
                  placeholder="https://..."
                  value={formJobUrl}
                  onChange={(e) => setFormJobUrl(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-resume">Resume Version Used</Label>
                <Select value={formResumeId} onValueChange={setFormResumeId}>
                  <SelectTrigger id="edit-resume">
                    <SelectValue placeholder="Select a resume" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None / Other</SelectItem>
                    {userResumes.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name || r.file_name || "Resume"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-ats">ATS Score %</Label>
                  <Input
                    id="edit-ats"
                    type="number"
                    min={0}
                    max={100}
                    value={formAtsScore}
                    onChange={(e) => setFormAtsScore(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-match">Job Match %</Label>
                  <Input
                    id="edit-match"
                    type="number"
                    min={0}
                    max={100}
                    value={formMatchScore}
                    onChange={(e) => setFormMatchScore(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-jd">Job Description</Label>
                <Textarea
                  id="edit-jd"
                  rows={3}
                  value={formJobDescription}
                  onChange={(e) => setFormJobDescription(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving…" : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DIALOG: Application Details View */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            {selectedApp && (
              <div className="space-y-5">
                {/* Modal Header */}
                <div className="flex items-start justify-between gap-3 border-b pb-4">
                  <div>
                    <h3 className="font-display text-xl font-bold text-foreground">
                      {selectedApp.company_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{selectedApp.job_title}</p>
                  </div>
                  {selectedApp.job_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={selectedApp.job_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="size-3.5 mr-1.5" />
                        Posting
                      </a>
                    </Button>
                  )}
                </div>

                {/* Stage Selector Pill Bar */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Current Stage</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {STAGES.map((s) => {
                      const isCurrent = selectedApp.status === s.status;
                      return (
                        <button
                          key={s.status}
                          type="button"
                          onClick={() =>
                            statusMutation.mutate({ id: selectedApp.id, status: s.status })
                          }
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border transition-all ${
                            isCurrent
                              ? `${s.badgeCls} ring-1 ring-primary/40`
                              : "border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          <div className={`size-1.5 rounded-full ${s.dotCls}`} />
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border p-3 bg-muted/20">
                    <p className="text-[11px] text-muted-foreground">Applied Date</p>
                    <p className="mt-0.5 text-xs font-semibold text-foreground">
                      {formatDate(selectedApp.application_date)}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3 bg-muted/20">
                    <p className="text-[11px] text-muted-foreground">ATS Score</p>
                    <p className="mt-0.5 text-xs font-semibold text-foreground">
                      {selectedApp.ats_score !== null && selectedApp.ats_score !== undefined
                        ? `${selectedApp.ats_score}%`
                        : "—"}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3 bg-muted/20">
                    <p className="text-[11px] text-muted-foreground">Job Match</p>
                    <p className="mt-0.5 text-xs font-semibold text-foreground">
                      {selectedApp.match_score !== null && selectedApp.match_score !== undefined
                        ? `${selectedApp.match_score}%`
                        : "—"}
                    </p>
                  </div>
                </div>

                {/* Resume info */}
                {selectedApp.resume_name && (
                  <div className="rounded-lg border p-3 bg-card flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FileText className="size-4 text-primary" />
                      <span>Resume version:</span>
                      <strong className="text-foreground">{selectedApp.resume_name}</strong>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedApp.notes && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Notes
                    </p>
                    <div className="rounded-lg border p-3 bg-muted/20 text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                      {selectedApp.notes}
                    </div>
                  </div>
                )}

                {/* Job Description */}
                {selectedApp.job_description && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Job Description Snippet
                    </p>
                    <div className="rounded-lg border p-3 bg-muted/20 text-xs text-muted-foreground leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap">
                      {selectedApp.job_description}
                    </div>
                  </div>
                )}

                {/* Modal Footer with Actions */}
                <div className="flex items-center justify-between pt-3 border-t text-xs text-muted-foreground">
                  <span>Updated: {formatDate(selectedApp.updated_at)}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsDetailOpen(false);
                        openEditModal(selectedApp);
                      }}
                    >
                      <Edit className="size-3.5 mr-1.5" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteCandidateId(selectedApp.id)}
                    >
                      <Trash2 className="size-3.5 mr-1.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ALERT DIALOG: Delete Confirmation */}
        <AlertDialog
          open={Boolean(deleteCandidateId)}
          onOpenChange={(open) => !open && setDeleteCandidateId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Application?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove this job application from your tracker. This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  if (deleteCandidateId) deleteMutation.mutate(deleteCandidateId);
                }}
              >
                {deleteMutation.isPending ? "Deleting…" : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppShell>
  );
}
