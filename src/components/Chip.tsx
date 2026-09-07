import type { ReactNode } from "react";

export function Chip({ active, onClick, children, className = "" }: { active?: boolean; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`h-12 min-w-12 shrink-0 whitespace-nowrap rounded-2xl border px-3 text-sm font-bold transition-transform active:scale-95 ${
        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary/60 text-foreground"
      } ${className}`}
    >
      {children}
    </button>
  );
}
