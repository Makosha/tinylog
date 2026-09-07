import type { LogEvent } from "@/domain/events";
import { averageNapLastWeek, dayPart, longestSleepLastWeek, napsToday, nextFeedEstimate, usualBedtime, wakingsTonight } from "@/domain/insights";
import { upcomingReminders } from "@/domain/reminders";
import { openRest, type BabyState } from "@/domain/state";
import type { WindowStats } from "@/domain/stats";
import { durationLabel } from "@/domain/time";
import { fill, pct, useT } from "@/i18n/index";
import { agoLabel, fmtTime } from "@/i18n/labels";
import { useStore } from "@/store/store";
import { ClockIcon, ICON, SparkleIcon } from "./icons";

const LOOK = {
  awake: { Icon: ICON.awake, color: "var(--wake)" },
  asleep: { Icon: ICON.sleep, color: "var(--sleep)" },
  napping: { Icon: ICON.nap, color: "var(--nap)" },
} as const;

/**
 * The state hero: what state the baby is in, a subtitle that knows the time
 * of day, time in this state with an Adjust link, a last-fed or next-feed
 * pill, and one hint drawn from the baby's own week.
 */
export function StateCard({
  state,
  stats,
  now,
  stale,
  onWakeNow,
  onSetWakeTime,
  onSnooze,
  onAdjust,
}: {
  state: BabyState;
  stats: WindowStats;
  now: number;
  stale: boolean;
  onWakeNow: () => void;
  onSetWakeTime: () => void;
  onSnooze: () => void;
  /** open the editor for the event that defines "since" */
  onAdjust?: (e: LogEvent) => void;
}) {
  const { Icon, color } = LOOK[state.name];
  const { t, lang, locale } = useT();
  const { events, prefs } = useStore();
  const time = (ms: number) => fmtTime(locale, ms);

  // subtitle
  let subtitle: string;
  if (state.name === "napping") {
    const n = napsToday(events, now);
    subtitle = fill(t.hero.napSubtitle, { n: lang === "en" ? pct("en", n) : fill(t.hero.ordinal, { n }) });
  } else if (state.name === "asleep") {
    const open = openRest(events);
    const w = open ? wakingsTonight(events, open) : 0;
    subtitle = w === 0 ? t.hero.noWakings : fill(t.hero.nightSubtitle, { n: w === 1 ? t.hero.wakingOne : fill(t.hero.wakingMany, { n: w }) });
  } else {
    const part = dayPart(now);
    const since = time(state.since);
    if (part === "evening") {
      const bed = usualBedtime(events, now);
      subtitle = bed !== null ? fill(t.hero.evening, { t: time(new Date(now).setHours(Math.floor(bed / 60), bed % 60, 0, 0)) }) : fill(t.hero.eveningNoData, { t: since });
    } else subtitle = fill(t.hero[part], { t: since });
  }

  // pill: next feed while asleep, last fed otherwise
  const lf = stats.lastFeed;
  const next = state.name === "asleep" ? nextFeedEstimate(events) : null;
  const pill = next && next > now ? { label: t.hero.nextFeed, value: fill(t.hero.likely, { t: time(next) }) } : lf ? { label: t.hero.lastFed, value: agoLabel(t, now - lf.at) } : null;

  // hint
  let hint: string | null = null;
  if (state.name === "napping") {
    const avg = averageNapLastWeek(events, now);
    if (avg) hint = fill(t.hero.avgNap, { t: durationLabel(0, avg * 60_000) });
  } else if (state.name === "asleep") {
    const longest = longestSleepLastWeek(events, now);
    if (longest) hint = fill(t.hero.longestStretch, { t: durationLabel(0, longest * 60_000) });
  } else {
    const r = upcomingReminders(events, state, now, prefs.babyDob).find((x) => x.kind !== "stale" && x.at > now + 60_000);
    if (r) hint = fill(r.kind === "feed" ? t.reminders.nextFeed : t.reminders.nextRest, { t: durationLabel(now, r.at) });
  }

  const sinceEvent = state.name === "awake" ? events.find((e) => (e.kind === "sleep" || e.kind === "nap") && e.endAt === state.since) : openRest(events);

  return (
    <section
      aria-live="polite"
      className="relative overflow-hidden rounded-3xl border p-5 shadow-[0_10px_28px_-12px_rgba(0,0,0,0.25)]"
      style={{ borderColor: `color-mix(in oklch, ${color} 30%, transparent)`, background: `linear-gradient(180deg, color-mix(in oklch, ${color} 14%, var(--card)) 0%, var(--card) 70%)`, color }}
    >
      <span aria-hidden className="pointer-events-none absolute -right-8 -top-8 size-44 rounded-full blur-3xl" style={{ background: `color-mix(in oklch, ${color} 18%, transparent)` }} />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-display text-[32px] font-bold leading-[1.05] tracking-tight text-foreground">{t.state[state.name]}</p>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <span
          className="flex size-14 shrink-0 items-center justify-center rounded-[18px] border"
          style={{ background: "color-mix(in oklch, var(--foreground) 4%, transparent)", borderColor: "color-mix(in oklch, var(--foreground) 10%, transparent)", boxShadow: `0 0 0 4px color-mix(in oklch, ${color} 22%, transparent), inset 0 2px 6px rgba(0,0,0,0.18)` }}
        >
          <Icon className="size-8" />
        </span>
      </div>

      <div className="relative mt-4 flex items-end justify-between gap-3 border-t pt-3.5" style={{ borderColor: "color-mix(in oklch, var(--foreground) 10%, transparent)" }}>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t.hero.timeInState}</p>
          <p className="mt-0.5 font-display text-[30px] font-bold leading-[1.1] tracking-tight text-foreground tabular-nums">{durationLabel(state.since, now)}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <ClockIcon className="size-3.5" />
            <span>{fill(t.hero.since, { t: time(state.since) })}</span>
            {sinceEvent && onAdjust ? (
              <button type="button" onClick={() => onAdjust(sinceEvent)} className="ml-1 text-[11px] font-semibold text-primary underline underline-offset-2">
                {t.hero.adjust}
              </button>
            ) : null}
          </p>
        </div>
        {pill ? (
          <div className="shrink-0 rounded-xl border px-3 py-2 text-right text-xs" style={{ background: "color-mix(in oklch, var(--feed) 12%, transparent)", borderColor: "color-mix(in oklch, var(--feed) 25%, transparent)" }}>
            <p className="flex items-center justify-end gap-1 font-semibold text-feed">
              <ICON.bottle className="size-3" /> {pill.label}
            </p>
            <p className="mt-0.5 font-bold text-foreground">{pill.value}</p>
          </div>
        ) : null}
      </div>

      {hint ? (
        <p className="relative mt-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <SparkleIcon className="size-3.5" /> {hint}
        </p>
      ) : null}

      {stale ? (
        <div className="relative mt-3 rounded-2xl border border-border bg-card p-3">
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
      ) : null}
    </section>
  );
}
