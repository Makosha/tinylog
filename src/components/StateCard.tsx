import type { BabyState } from "@/domain/state";
import type { DayStats } from "@/domain/stats";
import { durationLabel, formatTime } from "@/domain/time";

const LOOK: Record<BabyState["name"], { emoji: string; label: string; cls: string }> = {
  awake: { emoji: "☀️", label: "Awake", cls: "bg-wake/12 border-wake/30" },
  asleep: { emoji: "😴", label: "Asleep", cls: "bg-sleep/15 border-sleep/30" },
  napping: { emoji: "🛌", label: "Napping", cls: "bg-nap/15 border-nap/30" },
};

export function StateCard({ state, stats, now }: { state: BabyState; stats: DayStats; now: number }) {
  const look = LOOK[state.name];
  const elapsed = durationLabel(state.since, now);
  const lastFeed = stats.lastFeed;
  const sub =
    state.name === "awake"
      ? lastFeed
        ? `last feed ${durationLabel(lastFeed.at, now)} ago${lastFeed.ml ? ` · ${lastFeed.ml}ml` : ""}`
        : "no feeds yet"
      : `since ${formatTime(state.since)}`;

  return (
    <section className={`rounded-3xl border p-4 ${look.cls}`} aria-live="polite">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-display text-2xl font-bold text-foreground">
          <span className="mr-2">{look.emoji}</span>
          {look.label}
        </p>
        <p className="font-display text-2xl font-bold tabular-nums text-foreground">{elapsed}</p>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
    </section>
  );
}
