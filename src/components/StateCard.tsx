import { LABEL, eventDetail, type LogEvent } from "@/domain/events";
import type { BabyState } from "@/domain/state";
import type { WindowStats } from "@/domain/stats";
import { durationLabel, formatTime } from "@/domain/time";
import { ICON } from "./icons";

const LOOK = {
  awake: { Icon: ICON.awake, cls: "text-wake border-wake/30 bg-wake/10" },
  asleep: { Icon: ICON.sleep, cls: "text-sleep border-sleep/30 bg-sleep/10" },
  napping: { Icon: ICON.nap, cls: "text-nap border-nap/30 bg-nap/10" },
} as const;

export function StateCard({
  state,
  stats,
  now,
  stale,
  lastEvent,
  onWakeNow,
  onSetWakeTime,
  onSnooze,
  onEditLast,
}: {
  state: BabyState;
  stats: WindowStats;
  now: number;
  /** the open rest has gone on implausibly long */
  stale: boolean;
  /** most recent event (any kind) within the last 30 min, for one-tap correction */
  lastEvent?: LogEvent;
  onWakeNow: () => void;
  onSetWakeTime: () => void;
  onSnooze: () => void;
  onEditLast: (e: LogEvent) => void;
}) {
  const { Icon, cls } = LOOK[state.name];
  const lf = stats.lastFeed;
  const feedLine = lf
    ? `${LABEL[lf.source].toLowerCase()} ${durationLabel(lf.at, now)} ago${eventDetail(lf) ? ` · ${eventDetail(lf)}` : ""}`
    : "no feeds yet";
  const sub = state.name === "awake" ? feedLine : lf ? `since ${formatTime(state.since)} · ${feedLine}` : `since ${formatTime(state.since)}`;

  return (
    <section className={`rounded-3xl border p-4 ${cls}`} aria-live="polite">
      <div className="flex items-center gap-4">
        <span className="icon-tile size-14 shrink-0">
          <Icon className="size-8" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-2xl font-bold leading-tight text-foreground">{LABEL[state.name]}</p>
          <p className="truncate text-sm text-muted-foreground">{sub}</p>
        </div>
        <p className="font-display text-3xl font-bold tabular-nums text-foreground">{durationLabel(state.since, now)}</p>
      </div>

      {stale ? (
        <div className="mt-3 rounded-2xl border border-border bg-card p-3">
          <p className="text-sm font-bold text-foreground">Still {state.name === "asleep" ? "asleep" : "napping"}?</p>
          <p className="mb-2 text-xs text-muted-foreground">This has been going for {durationLabel(state.since, now)}. Did you forget to tap Wake up?</p>
          <div className="grid grid-cols-3 gap-2">
            <button type="button" onClick={onSetWakeTime} className="surface-warm h-11 rounded-xl text-sm font-bold active:scale-95">
              Set wake time
            </button>
            <button type="button" onClick={onWakeNow} className="h-11 rounded-xl border border-border bg-secondary/60 text-sm font-bold text-foreground active:scale-95">
              Woke now
            </button>
            <button type="button" onClick={onSnooze} className="h-11 rounded-xl border border-border bg-secondary/60 text-sm font-bold text-foreground active:scale-95">
              Still sleeping
            </button>
          </div>
        </div>
      ) : lastEvent ? (
        <button
          type="button"
          onClick={() => onEditLast(lastEvent)}
          className="mt-3 flex h-10 w-full items-center justify-between rounded-xl border border-border bg-card px-3 text-sm active:scale-[0.99]"
        >
          <span className="truncate text-muted-foreground">
            Last: <span className="font-semibold text-foreground">{LABEL[lastEvent.kind === "feed" ? lastEvent.source : lastEvent.kind]}</span> {formatTime(lastEvent.at)}
            {eventDetail(lastEvent) ? ` · ${eventDetail(lastEvent)}` : ""}
          </span>
          <span className="font-bold text-primary">Edit</span>
        </button>
      ) : null}
    </section>
  );
}
