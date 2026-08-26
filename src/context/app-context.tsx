import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type AppState = {
  beginnerMode: boolean;
  setBeginnerMode: (v: boolean) => void;
  theme: "light" | "dark";
  setTheme: (t: "light" | "dark") => void;
};

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [beginnerMode, setBeginnerMode] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const storedBeginner = localStorage.getItem("resumate:beginner");
    if (storedBeginner !== null) setBeginnerMode(storedBeginner === "true");
    const storedTheme = localStorage.getItem("resumate:theme");
    if (storedTheme === "dark" || storedTheme === "light") setTheme(storedTheme);
  }, []);

  useEffect(() => {
    localStorage.setItem("resumate:beginner", String(beginnerMode));
  }, [beginnerMode]);

  useEffect(() => {
    localStorage.setItem("resumate:theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const value = useMemo(
    () => ({ beginnerMode, setBeginnerMode, theme, setTheme }),
    [beginnerMode, theme],
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

/** Returns the simple explanation when Beginner Mode is on, otherwise the technical one. */
export function useExplain() {
  const { beginnerMode } = useApp();
  return (simple: string, technical: string) => (beginnerMode ? simple : technical);
}
