import type { LogEvent } from "@/domain/events";
import type { BabyState } from "@/domain/state";
import type { WindowStats } from "@/domain/stats";
import { durationLabel } from "@/domain/time";
import { useUnits } from "@/store/store";
import { fill, useT } from "@/i18n/index";
import { agoLabel, detailOf, fmtTime, labelOf } from "@/i18n/labels";
import { ICON } from "./icons";
import { upcomingReminders } from "@/domain/reminders";
import { useStore } from "@/store/store";

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
  stale: boolean;
  lastEvent?: LogEvent;
  onWakeNow: () => void;
  onSetWakeTime: () => void;
  onSnooze: () => void;
  onEditLast: (e: LogEvent) => void;
}) {
  const { Icon, cls } = LOOK[state.name];
  const units = useUnits();
  const { t, locale } = useT();
  const { events, prefs } = useStore();
  const next = upcomingReminders(events, state, now, prefs.babyDob).find((r) => r.kind !== "stale" && r.at > now + 60_000);
  const nextLine = next ? fill(next.kind === "feed" ? t.reminders.nextFeed : t.reminders.nextRest, { t: durationLabel(now, next.at) }) : null;
  const lf = stats.lastFeed;
  const feedLine = lf
    ? `${t.kind[lf.source].toLowerCase()} ${agoLabel(t, now - lf.at)}${detailOf(t, lf, units) ? ` · ${detailOf(t, lf, units)}` : ""}`
    : t.time.noFeedsYet;
  const sub = state.name === "awake" ? feedLine : lf ? `${fill(t.time.since, { t: fmtTime(locale, state.since) })} · ${feedLine}` : fill(t.time.since, { t: fmtTime(locale, state.since) });

  return (
    <section className={`rounded-3xl border p-4 ${cls}`} aria-live="polite">
      <div className="flex items-center gap-4">
        <span className="icon-tile size-14 shrink-0">
          <Icon className="size-8" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-2xl font-bold leading-tight text-foreground">{t.state[state.name]}</p>
          <p className="truncate text-sm text-muted-foreground">{sub}</p>
        </div>
        <p className="font-display text-3xl font-bold tabular-nums text-foreground">{durationLabel(state.since, now)}</p>
      </div>

      {nextLine && !stale ? <p className="mt-2 text-xs font-semibold text-muted-foreground">{nextLine}</p> : null}
      {stale ? (
        <div className="mt-3 rounded-2xl border border-border bg-card p-3">
          <p className="text-sm font-bold text-foreground">{state.name === "asleep" ? t.home.stillAsleepQ : t.home.stillNappingQ}</p>
          <p className="mb-2 text-xs text-muted-foreground">{fill(t.home.staleBody, { t: durationLabel(state.since, now) })}</p>
          <div className="grid grid-cols-3 gap-2">
            <button type="button" onClick={onSetWakeTime} className="surface-warm h-11 rounded-xl text-sm font-bold active:scale-95">
              {t.home.setWakeTime}
            </button>
            <button type="button" onClick={onWakeNow} className="h-11 rounded-xl border border-border bg-secondary/60 text-sm font-bold text-foreground active:scale-95">
              {t.home.wokeNow}
            </button>
            <button type="button" onClick={onSnooze} className="h-11 rounded-xl border border-border bg-secondary/60 text-sm font-bold text-foreground active:scale-95">
              {t.home.stillSleeping}
            </button>
          </div>
        </div>
      ) : lastEvent ? (
        <button type="button" onClick={() => onEditLast(lastEvent)} className="mt-3 flex h-10 w-full items-center justify-between rounded-xl border border-border bg-card px-3 text-sm active:scale-[0.99]">
          <span className="truncate text-muted-foreground">
            {t.home.lastEdit} <span className="font-semibold text-foreground">{labelOf(t, lastEvent)}</span> {fmtTime(locale, lastEvent.at)}
            {detailOf(t, lastEvent, units) ? ` · ${detailOf(t, lastEvent, units)}` : ""}
          </span>
          <span className="font-bold text-primary">{t.home.edit}</span>
        </button>
      ) : null}
    </section>
  );
}
