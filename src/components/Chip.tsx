import type { ReactNode } from "react";

export function Chip({
  active,
  onClick,
  children,
  tone = "neutral",
}: {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
  tone?: "neutral" | "primary";
}) {
  const base = "h-10 min-w-11 shrink-0 whitespace-nowrap rounded-full border px-3 text-sm font-semibold transition-transform active:scale-95";
  const look = active
    ? tone === "primary"
      ? "surface-warm border-transparent"
      : "border-primary bg-primary/15 text-primary"
    : "border-border bg-secondary/60 text-muted-foreground";
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={`${base} ${look}`}>
      {children}
    </button>
  );
}
