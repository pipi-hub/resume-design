import { cn } from "@/lib/utils";

type Props = {
  value: number;
  max?: number;
  size?: number;
  label?: string;
  suffix?: string;
  tone?: "primary" | "violet" | "success" | "warning";
  className?: string;
};

const toneVar: Record<string, string> = {
  primary: "var(--primary)",
  violet: "var(--violet)",
  success: "var(--success)",
  warning: "var(--warning)",
};

export function ScoreRing({
  value,
  max = 100,
  size = 132,
  label,
  suffix = "",
  tone = "primary",
  className,
}: Props) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="-rotate-90"
          role="img"
          aria-label={`${value} of ${max}`}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--muted)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={toneVar[tone]}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c - (c * pct) / 100}
            style={{ transition: "stroke-dashoffset 700ms ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl font-bold">
            {value}
            {suffix}
          </span>
          {max !== 100 || suffix === "" ? (
            <span className="text-xs text-muted-foreground">of {max}</span>
          ) : null}
        </div>
      </div>
      {label ? <span className="text-sm font-medium text-muted-foreground">{label}</span> : null}
    </div>
  );
}
