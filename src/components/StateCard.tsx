import { LABEL } from "@/domain/events";
import type { BabyState } from "@/domain/state";
import type { DayStats } from "@/domain/stats";
import { durationLabel, formatTime } from "@/domain/time";
import { ICON } from "./icons";

const LOOK = {
  awake: { Icon: ICON.awake, cls: "text-wake border-wake/30 bg-wake/10" },
  asleep: { Icon: ICON.sleep, cls: "text-sleep border-sleep/30 bg-sleep/10" },
  napping: { Icon: ICON.nap, cls: "text-nap border-nap/30 bg-nap/10" },
} as const;

export function StateCard({ state, stats, now }: { state: BabyState; stats: DayStats; now: number }) {
  const { Icon, cls } = LOOK[state.name];
  const lastFeed = stats.lastFeed;
  const sub =
    state.name === "awake"
      ? lastFeed
        ? `last feed ${durationLabel(lastFeed.at, now)} ago${lastFeed.ml ? ` · ${lastFeed.ml}ml` : ""}`
        : "no feeds yet"
      : `since ${formatTime(state.since)}`;

  return (
    <section className={`flex items-center gap-4 rounded-3xl border p-4 ${cls}`} aria-live="polite">
      <span className="icon-tile size-14 shrink-0">
        <Icon className="size-8" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-2xl font-bold leading-tight text-foreground">{LABEL[state.name]}</p>
        <p className="truncate text-sm text-muted-foreground">{sub}</p>
      </div>
      <p className="font-display text-3xl font-bold tabular-nums text-foreground">{durationLabel(state.since, now)}</p>
    </section>
  );
}
