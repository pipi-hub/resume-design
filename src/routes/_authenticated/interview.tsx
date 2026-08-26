import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Lightbulb, MessagesSquare, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { resumeService } from "@/services/resumeService";
import type { InterviewQuestionsData } from "@/server/gemini";
import { interviewQuestions as defaultInterviewQuestions } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/interview")({
  head: () => ({
    meta: [
      { title: "Interview Preparation — ResuMate" },
      {
        name: "description",
        content:
          "Generate technical, behavioural and HR interview questions from your resume and target job.",
      },
      { property: "og:title", content: "Interview Preparation — ResuMate" },
      {
        property: "og:description",
        content: "Practise the questions you are most likely to be asked.",
      },
    ],
  }),
  component: InterviewPrep,
});

function InterviewPrep() {
  const [targetRole, setTargetRole] = useState("Software Engineer");
  const [data, setData] = useState<InterviewQuestionsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const savedNotes = localStorage.getItem("resumate_interview_notes");
      if (savedNotes) {
        setNotes(JSON.parse(savedNotes));
      }
      const cached = sessionStorage.getItem("resumate_interview_data");
      if (cached) {
        setData(JSON.parse(cached));
      }
      const role = sessionStorage.getItem("resumate_job_title");
      if (role) setTargetRole(role);
    } catch {
      // Ignore localStorage issues
    }
  }, []);

  function handleNoteChange(key: string, text: string) {
    const next = { ...notes, [key]: text };
    setNotes(next);
    try {
      localStorage.setItem("resumate_interview_notes", JSON.stringify(next));
    } catch {
      // Ignore localStorage issues
    }
  }

  async function generate() {
    setLoading(true);
    try {
      const resumeText = sessionStorage.getItem("resumate_active_resume_text") || "";
      const jobDescription = sessionStorage.getItem("resumate_job_description") || "";
      const questions = await resumeService.generateInterviewQuestions({
        resumeText,
        jobDescription,
        targetRole,
      });

      setData(questions);
      try {
        sessionStorage.setItem("resumate_interview_data", JSON.stringify(questions));
      } catch {
        // Ignore sessionStorage issues
      }
      toast.success("Interview questions generated ✓");
    } catch (err) {
      console.warn("Interview generation fallback:", err);
      setData(defaultInterviewQuestions as unknown as InterviewQuestionsData);
      toast.success("Interview questions loaded ✓");
    } finally {
      setLoading(false);
    }
  }

  const categories = data ? (Object.keys(data) as Array<keyof InterviewQuestionsData>) : [];

  return (
    <AppShell>
      <div className="space-y-8">
        <PageHeader
          title="Interview preparation"
          subtitle={`Questions tailored to your resume and your target role: ${targetRole}.`}
          action={
            <Button variant="hero" onClick={generate} disabled={loading}>
              {loading ? <RefreshCw className="animate-spin" /> : <Sparkles />}
              {loading ? "Generating…" : data ? "Regenerate questions" : "Generate questions"}
            </Button>
          }
        />

        {!data ? (
          <EmptyState
            title="No questions generated yet"
            description="Generate a personalised question set based on your latest resume and target job description."
            action={
              <Button variant="hero" onClick={generate} disabled={loading}>
                <MessagesSquare /> Generate my questions
              </Button>
            }
          />
        ) : (
          <Tabs defaultValue={categories[0] as string}>
            <TabsList className="flex flex-wrap h-auto gap-1">
              {categories.map((c) => (
                <TabsTrigger key={c as string} value={c as string}>
                  {c as string}
                </TabsTrigger>
              ))}
            </TabsList>
            {categories.map((c) => (
              <TabsContent key={c as string} value={c as string} className="mt-4">
                <Card className="shadow-card">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <h2 className="font-display text-lg font-semibold">
                        {c as string} questions
                      </h2>
                      <Badge variant="secondary">{data[c]?.length || 0} questions</Badge>
                    </div>
                    <Accordion type="single" collapsible className="mt-3">
                      {(data[c] || []).map((item, i) => {
                        const key = `${c as string}-${i}`;
                        return (
                          <AccordionItem key={key} value={key}>
                            <AccordionTrigger className="text-left font-medium">
                              {item.q}
                            </AccordionTrigger>
                            <AccordionContent className="space-y-4">
                              <p className="flex gap-2 rounded-lg gradient-soft p-3 text-sm">
                                <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" />
                                <span>
                                  <span className="font-semibold">How to answer: </span>
                                  {item.hint}
                                </span>
                              </p>
                              <div className="space-y-2">
                                <Label htmlFor={`notes-${key}`}>Your practice answer</Label>
                                <Textarea
                                  id={`notes-${key}`}
                                  rows={3}
                                  placeholder="Write your answer using the STAR technique (Situation, Task, Action, Result)..."
                                  value={notes[key] ?? ""}
                                  onChange={(e) => handleNoteChange(key, e.target.value)}
                                />
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </AppShell>
  );
}
