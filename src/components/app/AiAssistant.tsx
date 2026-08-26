import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, Send, Sparkles, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { resumeService } from "@/services/resumeService";
import { useAuthUser } from "@/lib/auth";

type Msg = { role: "user" | "ai"; text: string };

const starters = [
  "How can I raise my ATS score above 90%?",
  "Can you rewrite one of my project bullet points?",
  "What skills should I prioritize learning next?",
  "How do I highlight leadership without prior work experience?",
];

export function AiAssistant() {
  const { user } = useAuthUser();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "ai",
      text: `Hi ${user?.user_metadata?.["full_name"]?.split(" ")[0] || "there"}! I'm ResuMate AI, your dedicated career and resume mentor. Ask me how to improve your bullet points, raise your ATS score, prepare for interviews, or tailor your applications!`,
    },
  ]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || loading) return;

    const userMsg: Msg = { role: "user", text: q };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const resumeText =
        sessionStorage.getItem("resumate_active_resume_text") ||
        sessionStorage.getItem("resumate_resume_text") ||
        undefined;
      const targetRole =
        sessionStorage.getItem("resumate_job_title") ||
        sessionStorage.getItem("resumate_target_role") ||
        "Software Engineer";
      const scoreRaw = sessionStorage.getItem("resumate_ats_score");
      const atsScore = scoreRaw ? Number(scoreRaw) : undefined;

      const reply = await resumeService.sendAiChatMessage({
        message: q,
        history: nextMessages,
        context: {
          resumeText,
          targetRole,
          atsScore,
        },
      });

      setMessages((prev) => [...prev, { role: "ai", text: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "Focus on adding high-demand technical keywords from your target job description, using strong action verbs (e.g., 'Architected', 'Deployed'), and quantifying your achievements (e.g., 'improved performance by 25%').",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function renderMessageText(text: string) {
    return text.split("\n").map((line, idx) => {
      // Basic bold formatting support for **bold**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={idx} className={idx > 0 ? "mt-1.5" : ""}>
          {parts.map((part, pIdx) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return (
                <strong key={pIdx} className="font-semibold text-foreground">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          })}
        </p>
      );
    });
  }

  return (
    <>
      {!open ? (
        <Button
          variant="hero"
          className="fixed bottom-5 right-5 z-50 h-12 rounded-full px-5 shadow-lift"
          onClick={() => setOpen(true)}
        >
          <Sparkles className="size-4 mr-1.5" /> Ask ResuMate AI
        </Button>
      ) : null}

      {open ? (
        <div
          role="dialog"
          aria-label="ResuMate AI assistant"
          className="fixed bottom-4 right-4 z-50 flex h-[34rem] w-[min(26rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border bg-card shadow-lift"
        >
          <div className="flex items-center justify-between gap-2 border-b px-4 py-3 bg-muted/40">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Bot className="size-4" />
              </span>
              <div className="leading-tight">
                <p className="text-sm font-semibold">ResuMate AI Assistant</p>
                <p className="text-[11px] text-muted-foreground">Career & Resume Mentor</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close assistant"
              onClick={() => setOpen(false)}
            >
              <X className="size-4" />
            </Button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3">
            <div className="space-y-3">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={
                    m.role === "ai"
                      ? "max-w-[88%] rounded-2xl rounded-tl-sm bg-muted/80 px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed border"
                      : "ml-auto max-w-[88%] rounded-2xl rounded-tr-sm bg-primary px-3.5 py-2.5 text-xs sm:text-sm text-primary-foreground leading-relaxed"
                  }
                >
                  {renderMessageText(m.text)}
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 max-w-[85%] rounded-2xl rounded-tl-sm bg-muted px-3.5 py-2.5 text-xs sm:text-sm text-muted-foreground border">
                  <Loader2 className="size-3.5 animate-spin text-primary" />
                  <span>ResuMate AI is typing…</span>
                </div>
              )}
              {messages.length < 3 && !loading ? (
                <div className="space-y-2 pt-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Recommended Questions
                  </p>
                  {starters.map((s) => (
                    <button
                      key={s}
                      onClick={() => void send(s)}
                      disabled={loading}
                      className="block w-full rounded-lg border bg-background/50 hover:bg-accent px-3 py-2 text-left text-xs text-foreground transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <form
            className="flex items-center gap-2 border-t p-3 bg-background"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <label className="sr-only" htmlFor="ai-input">
              Message ResuMate AI
            </label>
            <Input
              id="ai-input"
              value={input}
              disabled={loading}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your resume, bullet points, ATS..."
              className="text-xs sm:text-sm"
            />
            <Button
              type="submit"
              size="icon"
              disabled={loading || !input.trim()}
              aria-label="Send message"
            >
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      ) : null}
    </>
  );
}
