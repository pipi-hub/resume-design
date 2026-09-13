import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, RotateCcw, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resumeService } from "@/services/resumeService";
import { useAuthUser } from "@/lib/auth";
import { useCareerContext } from "@/context/app-context";

type Msg = { role: "user" | "ai"; text: string };

const starters = [
  "How can I raise my ATS score above 90%?",
  "Can you rewrite one of my project bullet points?",
  "What skills should I prioritize learning next?",
  "How do I highlight leadership without prior work experience?",
];

export function AiAssistant() {
  const { user } = useAuthUser();
  const career = useCareerContext();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const getInitialGreeting = (): Msg => ({
    role: "ai",
    text: `Hi ${user?.user_metadata?.["full_name"]?.split(" ")[0] || "there"}! I'm ResuMate AI, your dedicated career and resume mentor. Ask me how to improve your bullet points, raise your ATS score, prepare for interviews, or tailor your applications!`,
  });

  const [messages, setMessages] = useState<Msg[]>([getInitialGreeting()]);

  // Load chat history on mount or when user changes
  useEffect(() => {
    let active = true;
    async function loadHistory() {
      try {
        const history = await resumeService.listChatHistory(user?.id);
        if (active && history && history.length > 0) {
          setMessages(history.map((h) => ({ role: h.role, text: h.text })));
        }
      } catch {
        // Keep initial greeting if history fails
      }
    }
    void loadHistory();
    return () => {
      active = false;
    };
  }, [user?.id]);

  useEffect(() => {
    function handleOpen() {
      setOpen(true);
    }
    window.addEventListener("open-ai-assistant", handleOpen);
    return () => window.removeEventListener("open-ai-assistant", handleOpen);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function handleClearChat() {
    if (loading) return;
    await resumeService.clearChatHistory(user?.id);
    setMessages([getInitialGreeting()]);
  }

  async function send(text: string) {
    const q = text.trim();
    if (!q || loading) return;

    const userMsg: Msg = { role: "user", text: q };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    // Persist user message
    void resumeService.saveChatMessage({
      userId: user?.id,
      role: "user",
      text: q,
    });

    try {
      const resumeText =
        career.activeResumeText ||
        sessionStorage.getItem("resumate_active_resume_text") ||
        sessionStorage.getItem("resumate_resume_text") ||
        undefined;
      const targetRole =
        career.targetRole ||
        sessionStorage.getItem("resumate_job_title") ||
        sessionStorage.getItem("resumate_target_role") ||
        "Software Engineer";
      const atsScore =
        career.latestAnalysis?.atsCompatibilityScore ??
        (sessionStorage.getItem("resumate_ats_score")
          ? Number(sessionStorage.getItem("resumate_ats_score"))
          : undefined);
      const jobMatch = career.latestAnalysis?.jobMatchScore;

      const reply = await resumeService.sendAiChatMessage({
        message: q,
        history: nextMessages,
        context: {
          resumeText,
          targetRole,
          atsScore,
          jobMatch,
          jobDescription: career.jobDescription,
          company: career.company,
          requirementMatches: career.latestAnalysis?.requirementMatches,
          skillGaps: career.latestAnalysis?.skillGaps,
          analysis: career.latestAnalysis || undefined,
        },
      });

      const aiMsg: Msg = { role: "ai", text: reply };
      setMessages((prev) => [...prev, aiMsg]);

      // Persist AI reply
      void resumeService.saveChatMessage({
        userId: user?.id,
        role: "ai",
        text: reply,
      });
    } catch {
      const errorMsg =
        "Sorry, I couldn't generate a response right now. Please try again in a moment.";
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: errorMsg,
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
          id="resumate-ai-trigger"
          className="fixed bottom-5 right-5 z-50 h-10.5 rounded-lg bg-[#6366F1] hover:bg-[#4F46E5] text-white px-4 shadow-xs transition-all"
          onClick={() => setOpen(true)}
        >
          <Sparkles className="size-4 mr-1.5 text-white" /> Ask ResuMate AI
        </Button>
      ) : null}

      {open ? (
        <div
          id="resumate-ai-dialog"
          role="dialog"
          aria-label="ResuMate AI assistant"
          className="fixed bottom-4 right-4 z-50 flex h-[34rem] w-[min(26rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-card dark:bg-card dark:border-border"
        >
          <div className="flex items-center justify-between gap-2 border-b border-[#EEF2F7] px-4 py-3 bg-[#F8FAFC] dark:bg-muted/40 dark:border-border">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-[#F5F3FF] text-[#6366F1] border border-[#DDD6FE]/60 dark:bg-accent/40 dark:text-accent-foreground">
                <Bot className="size-4" />
              </span>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-[#1E293B] dark:text-foreground">
                  ResuMate AI Assistant
                </p>
                <p className="text-[11px] text-[#64748B] dark:text-muted-foreground">
                  Career & Resume Mentor
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Start new conversation"
                title="New conversation"
                onClick={() => void handleClearChat()}
                className="size-8 text-[#64748B] hover:text-[#1E293B] dark:hover:text-foreground"
              >
                <RotateCcw className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close assistant"
                onClick={() => setOpen(false)}
                className="size-8 text-[#64748B] hover:text-[#1E293B] dark:hover:text-foreground"
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-3 bg-[#F8FAFC]/50 dark:bg-card"
          >
            <div className="space-y-3">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={
                    m.role === "ai"
                      ? "max-w-[88%] rounded-xl rounded-tl-xs bg-[#F5F3FF] border border-[#EDE9FE] text-[#1E293B] px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed dark:bg-accent/20 dark:border-accent/30 dark:text-foreground"
                      : "ml-auto max-w-[88%] rounded-xl rounded-tr-xs bg-white border border-[#E2E8F0] text-[#1E293B] shadow-2xs px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed dark:bg-muted/80 dark:border-border dark:text-foreground"
                  }
                >
                  {renderMessageText(m.text)}
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 max-w-[85%] rounded-xl rounded-tl-xs bg-[#F5F3FF] border border-[#EDE9FE] px-3.5 py-2.5 text-xs sm:text-sm text-[#64748B] dark:bg-accent/20 dark:border-accent/30">
                  <Loader2 className="size-3.5 animate-spin text-[#6366F1]" />
                  <span>ResuMate AI is thinking…</span>
                </div>
              )}
              {messages.length < 3 && !loading ? (
                <div className="space-y-2 pt-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                    Recommended Questions
                  </p>
                  {starters.map((s) => (
                    <button
                      key={s}
                      onClick={() => void send(s)}
                      disabled={loading}
                      className="block w-full rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] hover:border-[#C7D2FE] px-3 py-2 text-left text-xs text-[#1E293B] transition-colors shadow-2xs dark:bg-card dark:border-border dark:text-foreground dark:hover:bg-muted"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <form
            className="flex items-center gap-2 border-t border-[#E2E8F0] p-3 bg-white dark:bg-card dark:border-border"
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
              className="text-xs sm:text-sm bg-[#F8FAFC] border-[#E2E8F0] focus-visible:ring-[#6366F1] dark:bg-background"
            />
            <Button
              id="ai-send-btn"
              type="submit"
              size="icon"
              disabled={loading || !input.trim()}
              aria-label="Send message"
              className="bg-[#6366F1] hover:bg-[#4F46E5] text-white shrink-0"
            >
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      ) : null}
    </>
  );
}
