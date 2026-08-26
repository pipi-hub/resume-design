import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Download, Eye, FileText, Loader2, Save, Sparkles } from "lucide-react";
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
import { templates, user } from "@/lib/mock-data";
import { useAuthUser } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { resumeService } from "@/services/resumeService";
import { jsPDF } from "jspdf";

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

  function handleDownloadPDF() {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 18;
      const contentWidth = pageWidth - margin * 2;
      let y = 20;

      // Header: Name
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(30, 41, 59); // Slate 800
      doc.text(form.name || "Your Name", margin, y);
      y += 6;

      // Header: Role
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(79, 70, 229); // Indigo 600
      doc.text(form.role || "Software Engineer", margin, y);
      y += 6;

      // Header: Contact Info
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139); // Slate 500
      const contactLine = [form.email, form.phone, form.location].filter(Boolean).join("  |  ");
      doc.text(contactLine, margin, y);
      y += 4;
      if (form.links) {
        doc.text(form.links, margin, y);
        y += 4;
      }

      // Divider
      y += 2;
      doc.setDrawColor(203, 213, 225); // Slate 300
      doc.setLineWidth(0.4);
      doc.line(margin, y, margin + contentWidth, y);
      y += 6;

      const addSection = (title: string, content: string) => {
        if (!content.trim()) return;
        if (y > 260) {
          doc.addPage();
          y = 20;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42); // Slate 900
        doc.text(title.toUpperCase(), margin, y);
        y += 2;

        doc.setDrawColor(226, 232, 240);
        doc.line(margin, y, margin + contentWidth, y);
        y += 4;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(51, 65, 85);

        const lines = doc.splitTextToSize(content, contentWidth);
        doc.text(lines, margin, y);
        y += lines.length * 4.5 + 4;
      };

      addSection("Professional Summary", form.summary);
      addSection("Education", form.education);
      addSection("Experience", form.experience);
      addSection("Projects", form.projects);
      addSection("Technical Skills", form.skills);

      const fileName = `${(form.name || "Resume").toLowerCase().replace(/\s+/g, "-")}-resume.pdf`;
      doc.save(fileName);
      toast.success("Resume PDF downloaded ✓");
    } catch (err) {
      console.warn("PDF generation failed, falling back to print:", err);
      window.print();
    }
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
              <Button variant="hero" onClick={handleDownloadPDF}>
                <Download /> Download PDF
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
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <Eye className="size-4 text-primary" /> Live preview
                </p>
                <Badge variant="secondary">{template}</Badge>
              </div>
              <Separator className="my-4" />
              <article className="space-y-3 text-xs leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
                <header>
                  <h2 className="font-display text-base font-bold">{form.name || "Your name"}</h2>
                  <p className="text-primary font-medium">{form.role}</p>
                  <p className="text-muted-foreground">
                    {[form.email, form.phone, form.location].filter(Boolean).join(" • ")}
                  </p>
                  <p className="text-muted-foreground">{form.links}</p>
                </header>
                {[
                  { label: "Summary", value: form.summary },
                  { label: "Education", value: form.education },
                  { label: "Experience", value: form.experience },
                  { label: "Projects", value: form.projects },
                  { label: "Skills", value: form.skills },
                ].map((s) =>
                  s.value.trim() ? (
                    <section key={s.label}>
                      <h3 className="border-b pb-1 text-[11px] font-semibold uppercase tracking-wider">
                        {s.label}
                      </h3>
                      <p className="mt-1 whitespace-pre-line text-muted-foreground">{s.value}</p>
                    </section>
                  ) : null,
                )}
              </article>
              <Button variant="soft" className="mt-5 w-full" onClick={handleCheckATS}>
                <Sparkles /> Check this resume's ATS score
              </Button>
              <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <FileText className="size-3.5" /> Exports as a single-page, ATS-safe PDF.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
