import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export function Logo({
  showTagline = true,
  subtitle = "AI Career Companion",
  to = "/",
}: {
  showTagline?: boolean;
  subtitle?: string;
  to?: string;
}) {
  return (
    <Link to={to} className="flex items-center gap-2.5 group" aria-label="ResuMate home">
      <span className="flex size-8.5 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs transition-transform group-hover:scale-105">
        <Sparkles className="size-4" />
      </span>
      <span className="leading-tight">
        <span className="block font-display text-lg font-bold tracking-tight text-foreground">
          ResuMate
        </span>
        {showTagline ? (
          <span className="block text-[11px] font-medium text-muted-foreground">{subtitle}</span>
        ) : null}
      </span>
    </Link>
  );
}
