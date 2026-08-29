import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AnalysisResult } from "@/server/gemini";
import { resumeService } from "@/services/resumeService";

export interface ActiveCareerContextState {
  // Active Resume
  activeResumeId: string | null;
  activeResumeName: string;
  activeResumeText: string;
  // Target Job
  targetRole: string;
  company: string;
  jobDescription: string;
  // Latest Analysis
  latestAnalysis: AnalysisResult | null;
  latestAnalysisId: string | null;
  // Actions
  setActiveResume: (id: string | null, name: string, text: string) => void;
  setTargetJob: (role: string, company: string, description: string) => void;
  setLatestAnalysis: (analysis: AnalysisResult | null, id?: string | null) => void;
  clearActiveContext: () => void;
  refreshFromStorageOrDb: () => Promise<void>;
}

type AppState = {
  beginnerMode: boolean;
  setBeginnerMode: (v: boolean) => void;
  theme: "light" | "dark";
  setTheme: (t: "light" | "dark") => void;
  career: ActiveCareerContextState;
};

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [beginnerMode, setBeginnerMode] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Career Context state
  const [activeResumeId, setActiveResumeId] = useState<string | null>(null);
  const [activeResumeName, setActiveResumeName] = useState<string>("My Resume");
  const [activeResumeText, setActiveResumeText] = useState<string>("");
  const [targetRole, setTargetRole] = useState<string>("Software Engineer");
  const [company, setCompany] = useState<string>("");
  const [jobDescription, setJobDescription] = useState<string>("");
  const [latestAnalysis, setLatestAnalysisState] = useState<AnalysisResult | null>(null);
  const [latestAnalysisId, setLatestAnalysisId] = useState<string | null>(null);

  // Load preferences and career context on mount
  useEffect(() => {
    try {
      const storedBeginner = localStorage.getItem("resumate:beginner");
      if (storedBeginner !== null) setBeginnerMode(storedBeginner === "true");
      const storedTheme = localStorage.getItem("resumate:theme");
      if (storedTheme === "dark" || storedTheme === "light") setTheme(storedTheme);

      // Restore career state from session storage
      const resId = sessionStorage.getItem("resumate_active_resume_id");
      const resName = sessionStorage.getItem("resumate_active_resume_name");
      const resText = sessionStorage.getItem("resumate_active_resume_text");
      const role = sessionStorage.getItem("resumate_job_title");
      const comp = sessionStorage.getItem("resumate_company");
      const jd = sessionStorage.getItem("resumate_job_description");
      const anaData = sessionStorage.getItem("resumate_latest_analysis_data");
      const anaId = sessionStorage.getItem("resumate_latest_analysis_id");

      if (resId) setActiveResumeId(resId);
      if (resName) setActiveResumeName(resName);
      if (resText) setActiveResumeText(resText);
      if (role) setTargetRole(role);
      if (comp) setCompany(comp);
      if (jd) setJobDescription(jd);
      if (anaId) setLatestAnalysisId(anaId);
      if (anaData) {
        try {
          setLatestAnalysisState(JSON.parse(anaData));
        } catch {
          // ignore
        }
      }
    } catch {
      // Storage unavailable in some strict sandbox environments
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("resumate:beginner", String(beginnerMode));
    } catch {
      // ignore
    }
  }, [beginnerMode]);

  useEffect(() => {
    try {
      localStorage.setItem("resumate:theme", theme);
    } catch {
      // ignore
    }
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const setActiveResume = useCallback((id: string | null, name: string, text: string) => {
    setActiveResumeId(id);
    setActiveResumeName(name);
    setActiveResumeText(text);
    try {
      if (id) sessionStorage.setItem("resumate_active_resume_id", id);
      else sessionStorage.removeItem("resumate_active_resume_id");
      sessionStorage.setItem("resumate_active_resume_name", name);
      sessionStorage.setItem("resumate_active_resume_text", text);
    } catch {
      // ignore
    }
  }, []);

  const setTargetJob = useCallback((role: string, comp: string, description: string) => {
    setTargetRole(role);
    setCompany(comp);
    setJobDescription(description);
    try {
      sessionStorage.setItem("resumate_job_title", role);
      sessionStorage.setItem("resumate_company", comp);
      sessionStorage.setItem("resumate_job_description", description);
    } catch {
      // ignore
    }
  }, []);

  const setLatestAnalysis = useCallback((analysis: AnalysisResult | null, id?: string | null) => {
    setLatestAnalysisState(analysis);
    if (id !== undefined) {
      setLatestAnalysisId(id);
      try {
        if (id) sessionStorage.setItem("resumate_latest_analysis_id", id);
        else sessionStorage.removeItem("resumate_latest_analysis_id");
      } catch {
        // ignore
      }
    }
    try {
      if (analysis) {
        sessionStorage.setItem("resumate_latest_analysis_data", JSON.stringify(analysis));
      } else {
        sessionStorage.removeItem("resumate_latest_analysis_data");
      }
    } catch {
      // ignore
    }
  }, []);

  const clearActiveContext = useCallback(() => {
    setActiveResumeId(null);
    setActiveResumeName("My Resume");
    setActiveResumeText("");
    setTargetRole("Software Engineer");
    setCompany("");
    setJobDescription("");
    setLatestAnalysisState(null);
    setLatestAnalysisId(null);
    try {
      sessionStorage.removeItem("resumate_active_resume_id");
      sessionStorage.removeItem("resumate_active_resume_name");
      sessionStorage.removeItem("resumate_active_resume_text");
      sessionStorage.removeItem("resumate_job_title");
      sessionStorage.removeItem("resumate_company");
      sessionStorage.removeItem("resumate_job_description");
      sessionStorage.removeItem("resumate_latest_analysis_data");
      sessionStorage.removeItem("resumate_latest_analysis_id");
    } catch {
      // ignore
    }
  }, []);

  const refreshFromStorageOrDb = useCallback(async () => {
    try {
      const latest = await resumeService.getLatestAnalysis();
      if (latest) {
        if (latest.resume_name) setActiveResumeName(latest.resume_name);
        setLatestAnalysisId(latest.id);
        const report = (latest.breakdown ||
          (latest as unknown as { report?: unknown }).report) as AnalysisResult | null;
        if (report && typeof report === "object") {
          setLatestAnalysisState(report);
          try {
            sessionStorage.setItem("resumate_latest_analysis_data", JSON.stringify(report));
            sessionStorage.setItem("resumate_latest_analysis_id", latest.id);
          } catch {
            // ignore
          }
        }
      }
    } catch (e) {
      console.warn("Could not refresh career context from DB:", e);
    }
  }, []);

  const career: ActiveCareerContextState = useMemo(
    () => ({
      activeResumeId,
      activeResumeName,
      activeResumeText,
      targetRole,
      company,
      jobDescription,
      latestAnalysis,
      latestAnalysisId,
      setActiveResume,
      setTargetJob,
      setLatestAnalysis,
      clearActiveContext,
      refreshFromStorageOrDb,
    }),
    [
      activeResumeId,
      activeResumeName,
      activeResumeText,
      targetRole,
      company,
      jobDescription,
      latestAnalysis,
      latestAnalysisId,
      setActiveResume,
      setTargetJob,
      setLatestAnalysis,
      clearActiveContext,
      refreshFromStorageOrDb,
    ],
  );

  const value = useMemo(
    () => ({ beginnerMode, setBeginnerMode, theme, setTheme, career }),
    [beginnerMode, theme, career],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

export function useCareerContext() {
  const { career } = useApp();
  return career;
}

/** Returns the simple explanation when Beginner Mode is on, otherwise the technical one. */
export function useExplain() {
  const { beginnerMode } = useApp();
  return (simple: string, technical: string) => (beginnerMode ? simple : technical);
}
