import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export function Logo({ showTagline = true, to = "/" }: { showTagline?: boolean; to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2.5" aria-label="ResuMate home">
      <span className="flex size-9 items-center justify-center rounded-xl gradient-hero text-primary-foreground shadow-lift">
        <Sparkles className="size-4.5" />
      </span>
      <span className="leading-tight">
        <span className="block font-display text-lg font-bold">ResuMate</span>
        {showTagline ? (
          <span className="block text-[11px] text-muted-foreground">
            Build smarter. Apply better.
          </span>
        ) : null}
      </span>
    </Link>
  );
}
