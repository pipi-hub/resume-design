import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Loader2,
  Printer,
  Save,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { InfoHint } from "@/components/common/InfoHint";
import { BulletImprover } from "@/components/app/BulletImprover";
import { ResumePreview } from "@/components/app/ResumePreview";
import { exportResumeToPDF } from "@/lib/pdf-export";
import { templates, user } from "@/lib/mock-data";
import { useAuthUser } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { resumeService } from "@/services/resumeService";

export const Route = createFileRoute("/_authenticated/builder")({
  head: () => ({
    meta: [
      { title: "Resume Builder — ResuMate" },
      {
        name: "description",
        content:
          "Build an ATS-friendly resume section by section with guided prompts, live preview and student-ready templates.",
      },
      { property: "og:title", content: "Resume Builder — ResuMate" },
      {
        property: "og:description",
        content: "Guided sections, recruiter-friendly templates and a live preview of your resume.",
      },
    ],
  }),
  component: ResumeBuilder,
});

type Form = {
  name: string;
  role: string;
  email: string;
  phone: string;
  location: string;
  links: string;
  summary: string;
  education: string;
  experience: string;
  projects: string;
  skills: string;
};

const initial: Form = {
  name: user.name,
  role: user.targetRole,
  email: user.email,
  phone: "+1 (555) 019-2834",
  location: user.location,
  links: `${user.linkedin} • ${user.github}`,
  summary:
    "Final-year Computer Science student with hands-on experience building React and Node.js applications. Looking for an entry-level software engineering role where I can ship user-facing features.",
  education:
    "B.S. in Computer Science — State University (2022–2026)\nRelevant coursework: Data Structures, Databases, Web Engineering, Distributed Systems",
  experience:
    "Web Development Intern — Northwind Labs (Jun 2025 – Aug 2025)\n• Built 6 reusable React components used across 3 product pages\n• Fixed 20+ UI bugs, reducing support tickets by 18%\n• Implemented RESTful endpoints in Node.js for async report export",
  projects:
    "ResuMate — AI Career & Resume Assistant (React, TypeScript, Supabase, Tailwind CSS)\n• Built full-stack resume analysis application with automated scoring\n• Implemented document extraction, real-time AI bullet rewriting, and responsive UI",
  skills: user.skills.join(", "),
};

const sectionKeys: Array<{ key: keyof Form; label: string }> = [
  { key: "name", label: "Full name" },
  { key: "role", label: "Target role" },
  { key: "email", label: "Email" },
  { key: "summary", label: "Summary" },
  { key: "education", label: "Education" },
  { key: "experience", label: "Experience" },
  { key: "projects", label: "Projects" },
  { key: "skills", label: "Skills" },
];

function ResumeBuilder() {
  const navigate = useNavigate();
  const { user: authUser, userId } = useAuthUser();
  const [form, setForm] = useState<Form>(initial);
  const [template, setTemplate] = useState(templates[2]?.name ?? "Minimal");
  const [saving, setSaving] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const resumeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadDraft() {
      // First check Supabase if user is logged in
      if (userId) {
        try {
          const cloudDraft = await resumeService.loadBuilderDraft(userId);
          if (cloudDraft?.form && isMounted) {
            setForm((prev) => ({ ...prev, ...cloudDraft.form }));
            if (cloudDraft.template) setTemplate(cloudDraft.template);
            return;
          }
        } catch (e) {
          console.warn("Could not load cloud draft:", e);
        }
      }

      // Fallback to local storage or auth profile
      try {
        const saved = localStorage.getItem("resumate_builder_draft");
        if (saved && isMounted) {
          setForm(JSON.parse(saved));
        } else if (authUser && isMounted) {
          setForm((prev) => ({
            ...prev,
            name: authUser.user_metadata?.["full_name"] || prev.name,
            email: authUser.email || prev.email,
          }));
        }
      } catch {
        // Ignore localStorage issues
      }
    }

    void loadDraft();
    return () => {
      isMounted = false;
    };
  }, [authUser, userId]);

  function set(key: keyof Form, value: string) {
    setForm((f) => {
      const updated = { ...f, [key]: value };
      try {
        localStorage.setItem("resumate_builder_draft", JSON.stringify(updated));
      } catch {
        // Ignore localStorage issues
      }
      return updated;
    });
  }

  const completion = useMemo(() => {
    const filled = sectionKeys.filter((s) => form[s.key].trim().length > 0).length;
    return Math.round((filled / sectionKeys.length) * 100);
  }, [form]);

  async function handleSaveDraft() {
    setSaving(true);
    try {
      localStorage.setItem("resumate_builder_draft", JSON.stringify(form));

      if (userId) {
        await resumeService.saveBuilderDraft(
          userId,
          form as unknown as Record<string, unknown>,
          template,
        );
        toast.success("Resume saved to cloud ✓");
      } else {
        toast.success("Draft saved locally (sign in to sync across devices).");
      }
    } catch (err) {
      console.warn("Save failed:", err);
      toast.error("Could not sync to cloud, draft preserved locally.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDownloadPDF() {
    if (exportingPdf) return;
    setExportingPdf(true);
    const toastId = toast.loading("Generating your high-fidelity PDF resume...");
    try {
      if (!resumeRef.current) {
        throw new Error("Resume container not initialized yet.");
      }

      const res = await exportResumeToPDF({
        element: resumeRef.current,
        formData: form,
        templateName: template,
      });

      toast.dismiss(toastId);
      if (res.fallbackUsed) {
        toast.success("Resume PDF downloaded successfully (vector format) ✓");
      } else {
        toast.success("Resume PDF downloaded successfully ✓", {
          description: `Formatted with the ${template} template layout.`,
        });
      }
    } catch (err) {
      toast.dismiss(toastId);
      console.warn("Direct PDF export encountered an error, triggering print fallback:", err);
      toast.error("Could not complete direct canvas capture, opening print dialog...");
      window.print();
    } finally {
      setExportingPdf(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  function handleCheckATS() {
    const fullContentText = `${form.name} | ${form.role}\n${form.email} • ${form.phone} • ${form.location}\n${form.links}\n\nSUMMARY:\n${form.summary}\n\nEDUCATION:\n${form.education}\n\nEXPERIENCE:\n${form.experience}\n\nPROJECTS:\n${form.projects}\n\nSKILLS:\n${form.skills}`;

    sessionStorage.setItem("resumate_active_resume_text", fullContentText);
    sessionStorage.setItem("resumate_active_resume_name", `${form.name} (Builder)`);
    sessionStorage.setItem("resumate_job_title", form.role);

    toast.success("Resume loaded for analysis!");
    navigate({ to: "/job-description" });
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <PageHeader
          title="Resume builder"
          subtitle="Fill in each section with guided prompts. Your live preview updates as you type."
          action={
            <>
              <Button variant="outline" onClick={handleSaveDraft} disabled={saving}>
                {saving ? <Loader2 className="animate-spin" /> : <Save />}
                {saving ? "Saving..." : "Save draft"}
              </Button>
              <Button
                variant="outline"
                onClick={handlePrint}
                title="Print or save via browser print dialog"
              >
                <Printer /> Print
              </Button>
              <Button
                variant="hero"
                onClick={handleDownloadPDF}
                disabled={exportingPdf}
                title="Download directly as a formatted PDF"
              >
                {exportingPdf ? <Loader2 className="animate-spin" /> : <Download />}
                {exportingPdf ? "Exporting PDF..." : "Download PDF"}
              </Button>
            </>
          }
        />

        <Card className="shadow-card">
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-primary" />
              <div>
                <p className="text-sm font-semibold">Resume completeness: {completion}%</p>
                <p className="text-xs text-muted-foreground">
                  Recruiters spend about 7 seconds on a first scan — complete every section.
                </p>
              </div>
              <InfoHint text="Completeness counts how many core sections you have filled in. A complete resume scores higher with ATS software." />
            </div>
            <Progress value={completion} className="sm:w-64" />
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="sections">Sections</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-4">
              <Card className="shadow-card">
                <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="b-name">Full name</Label>
                    <Input
                      id="b-name"
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="b-role">Target role</Label>
                    <Input
                      id="b-role"
                      value={form.role}
                      onChange={(e) => set("role", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="b-email">Email</Label>
                    <Input
                      id="b-email"
                      type="email"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="b-phone">Phone</Label>
                    <Input
                      id="b-phone"
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="b-location">Location</Label>
                    <Input
                      id="b-location"
                      value={form.location}
                      onChange={(e) => set("location", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="b-links">Links (LinkedIn / GitHub / Portfolio)</Label>
                    <Input
                      id="b-links"
                      value={form.links}
                      onChange={(e) => set("links", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="b-summary" className="flex items-center gap-1.5">
                      Professional summary
                      <InfoHint text="Two or three lines about who you are, what you can build, and the job you want." />
                    </Label>
                    <Textarea
                      id="b-summary"
                      rows={4}
                      value={form.summary}
                      onChange={(e) => set("summary", e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sections" className="mt-4 space-y-4">
              {(
                [
                  {
                    key: "education",
                    label: "Education",
                    hint: "Degree, institution, years, and relevant coursework.",
                  },
                  {
                    key: "experience",
                    label: "Experience",
                    hint: "Start each bullet with an action verb and add a measurable metric.",
                  },
                  {
                    key: "projects",
                    label: "Projects",
                    hint: "Great proof of engineering competence for students and early-career seekers.",
                  },
                  {
                    key: "skills",
                    label: "Skills",
                    hint: "Comma-separated. Mirror the technical keywords in target postings.",
                  },
                ] as const
              ).map((s) => (
                <Card key={s.key} className="shadow-card">
                  <CardContent className="space-y-2 p-5">
                    <Label htmlFor={`b-${s.key}`} className="flex items-center gap-1.5">
                      {s.label}
                      <InfoHint text={s.hint} />
                    </Label>
                    <Textarea
                      id={`b-${s.key}`}
                      rows={s.key === "skills" ? 3 : 5}
                      value={form[s.key]}
                      onChange={(e) => set(s.key, e.target.value)}
                    />
                  </CardContent>
                </Card>
              ))}
              <BulletImprover />
            </TabsContent>

            <TabsContent value="templates" className="mt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {templates.map((t) => {
                  const selected = t.name === template;
                  return (
                    <button
                      key={t.name}
                      type="button"
                      onClick={() => setTemplate(t.name)}
                      aria-pressed={selected}
                      className={`rounded-xl border p-5 text-left transition-all hover:shadow-lift ${
                        selected ? "border-primary bg-primary/5 shadow-lift" : "bg-card"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-display font-semibold">{t.name}</p>
                        <Badge variant={selected ? "default" : "secondary"}>{t.tag}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
                      <div className="mt-4 space-y-1.5 rounded-lg bg-muted p-3">
                        <div className="h-2 w-1/2 rounded bg-foreground/25" />
                        <div className="h-1.5 w-3/4 rounded bg-foreground/15" />
                        <div className="h-1.5 w-2/3 rounded bg-foreground/15" />
                        <div className="h-1.5 w-5/6 rounded bg-foreground/10" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>

          <Card className="h-fit shadow-card lg:sticky lg:top-24">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <Eye className="size-4 text-primary" /> Live preview
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{template}</Badge>
                </div>
              </div>
              <Separator className="my-3.5" />

              {/* Scrollable Live Document Preview */}
              <div className="max-h-[64vh] overflow-y-auto rounded-lg border border-slate-200/80 bg-slate-50/80 p-2 sm:p-3">
                <ResumePreview ref={resumeRef} form={form} template={template} />
              </div>

              <div className="mt-4 space-y-2">
                <Button
                  variant="hero"
                  className="w-full"
                  onClick={handleDownloadPDF}
                  disabled={exportingPdf}
                >
                  {exportingPdf ? <Loader2 className="animate-spin" /> : <Download />}
                  {exportingPdf ? "Generating PDF..." : "Download PDF"}
                </Button>
                <Button variant="soft" className="w-full" onClick={handleCheckATS}>
                  <Sparkles /> Check this resume's ATS score
                </Button>
              </div>

              <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                <FileText className="size-3.5" /> Direct PDF download with {template} styling.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
