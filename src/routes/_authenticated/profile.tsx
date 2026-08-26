import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Github, Linkedin, Loader2, Plus, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { useAuthUser } from "@/lib/auth";
import { resumeService } from "@/services/resumeService";
import { stats as defaultStats, user as defaultUser } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your Profile — ResuMate" },
      {
        name: "description",
        content:
          "Manage your career details, target role and skills so ResuMate can personalise its feedback.",
      },
      { property: "og:title", content: "Your Profile — ResuMate" },
      {
        property: "og:description",
        content: "Keep your career details up to date for better resume feedback.",
      },
    ],
  }),
  component: Profile,
});

type ProfileStat = { label: string; value: string; hint?: string; trend?: string };

function Profile() {
  const { user, userId } = useAuthUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<ProfileStat[]>(defaultStats);
  const [form, setForm] = useState({
    name: user?.user_metadata?.["full_name"] || defaultUser.name,
    email: user?.email || defaultUser.email,
    careerLevel: defaultUser.careerLevel,
    targetRole: defaultUser.targetRole,
    location: defaultUser.location,
    linkedin: defaultUser.linkedin,
    github: defaultUser.github,
  });
  const [skills, setSkills] = useState<string[]>([...defaultUser.skills]);
  const [newSkill, setNewSkill] = useState("");

  useEffect(() => {
    async function loadProfile() {
      if (!userId) {
        setLoading(false);
        return;
      }
      try {
        const [prof, dash] = await Promise.all([
          resumeService.getProfile(userId).catch(() => null),
          resumeService.getDashboard(userId).catch(() => null),
        ]);

        if (dash?.stats) {
          setStats(
            dash.stats.map((s) => ({
              label: s.label,
              value: s.value,
              trend: s.change,
            })),
          );
        }

        if (prof) {
          setForm({
            name: prof.full_name || user?.user_metadata?.["full_name"] || defaultUser.name,
            email: prof.email || user?.email || defaultUser.email,
            careerLevel: prof.career_level || defaultUser.careerLevel,
            targetRole: prof.target_role || defaultUser.targetRole,
            location: prof.location || defaultUser.location,
            linkedin: prof.linkedin || defaultUser.linkedin,
            github: prof.github || defaultUser.github,
          });
          if (Array.isArray(prof.skills) && prof.skills.length > 0) {
            setSkills(prof.skills);
          }
        }
      } catch (err) {
        console.warn("Could not load profile from database:", err);
      } finally {
        setLoading(false);
      }
    }

    void loadProfile();
  }, [userId, user]);

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function addSkill() {
    const s = newSkill.trim();
    if (!s) return;
    if (skills.some((x) => x.toLowerCase() === s.toLowerCase())) {
      toast.error("That skill is already on your list.");
      return;
    }
    setSkills((list) => [...list, s]);
    setNewSkill("");
  }

  function removeSkill(skillToRemove: string) {
    setSkills((list) => list.filter((s) => s !== skillToRemove));
  }

  async function handleSave() {
    if (!userId) {
      toast.success("Profile updated locally ✓");
      return;
    }
    setSaving(true);
    try {
      await resumeService.updateProfile(userId, {
        full_name: form.name,
        email: form.email,
        career_level: form.careerLevel,
        target_role: form.targetRole,
        location: form.location,
        linkedin: form.linkedin,
        github: form.github,
        skills,
      });
      toast.success("Profile saved to database ✓");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin text-primary" /> Loading profile…
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <PageHeader
          title="Your profile"
          subtitle="The more we know about your goals, the more specific your resume feedback becomes."
          action={
            <Button variant="hero" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : <Save />}
              {saving ? "Saving…" : "Save changes"}
            </Button>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="shadow-card">
            <CardContent className="p-6 text-center">
              <Avatar className="mx-auto size-20">
                <AvatarFallback className="gradient-hero text-lg font-semibold text-primary-foreground">
                  {form.name
                    .split(" ")
                    .map((n: string) => n[0] || "")
                    .slice(0, 2)
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <p className="mt-4 font-display text-lg font-semibold">{form.name}</p>
              <p className="text-sm text-muted-foreground">{form.careerLevel}</p>
              <Badge variant="secondary" className="mt-3">
                {form.targetRole}
              </Badge>
              <Separator className="my-5" />
              <div className="space-y-2 text-left text-sm">
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Linkedin className="size-4" /> {form.linkedin || "linkedin.com/in/..."}
                </p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Github className="size-4" /> {form.github || "github.com/..."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card lg:col-span-2">
            <CardContent className="p-6">
              <h2 className="font-display text-lg font-semibold">Personal details</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="career">Career level</Label>
                  <Input
                    id="career"
                    value={form.careerLevel}
                    onChange={(e) => set("careerLevel", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetRole">Target role</Label>
                  <Input
                    id="targetRole"
                    value={form.targetRole}
                    onChange={(e) => set("targetRole", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={form.location}
                    onChange={(e) => set("location", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    value={form.linkedin}
                    onChange={(e) => set("linkedin", e.target.value)}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="github">GitHub</Label>
                  <Input
                    id="github"
                    value={form.github}
                    onChange={(e) => set("github", e.target.value)}
                  />
                </div>
              </div>

              <Separator className="my-6" />

              <h2 className="font-display text-lg font-semibold">Your skills</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {skills.map((s) => (
                  <Badge key={s} variant="secondary" className="gap-1.5 pr-1.5">
                    {s}
                    <button
                      type="button"
                      aria-label={`Remove ${s}`}
                      onClick={() => removeSkill(s)}
                      className="rounded-full hover:bg-muted"
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                  placeholder="Add a new skill (e.g. Docker, GraphQL, PyTorch)"
                />
                <Button variant="outline" type="button" onClick={addSkill}>
                  <Plus /> Add
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
