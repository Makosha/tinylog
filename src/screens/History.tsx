import { useMemo, useState } from "react";
import { CopyLogSheet } from "@/components/CopyLogSheet";
import { EventEditor } from "@/components/EventEditor";
import { CopyIcon } from "@/components/icons";
import { StatTile } from "@/components/StatTile";
import { Timeline } from "@/components/Timeline";
import { TrendBars } from "@/components/TrendBars";
import { useNow } from "@/components/useNow";
import { daySeries, eventsInRange, groupNights, rangeStats } from "@/domain/stats";
import { durationLabel, isSameDay, startOfDay } from "@/domain/time";
import { formatVolume } from "@/domain/units";
import { fill, useT } from "@/i18n/index";
import { useStore, useUnits } from "@/store/store";

const MIN = 60_000;
const DAY = 24 * 60 * MIN;

export function History() {
  const { events } = useStore();
  const units = useUnits();
  const { t, locale } = useT();
  const now = useNow();
  const [day, setDay] = useState(() => startOfDay(Date.now()));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [trend, setTrend] = useState<"sleep" | "feeds">("sleep");
  const [copying, setCopying] = useState(false);

  const next = day + DAY;
  const isToday = isSameDay(day, now);
  const stats = useMemo(() => rangeStats(events, day, next, now), [events, day, next, now]);
  const items = useMemo(() => groupNights(eventsInRange(events, day, next, now)), [events, day, next, now]);
  const series = useMemo(() => daySeries(events, day, 7, now), [events, day, now]);
  const dayLabel = isSameDay(day, now) ? t.history.today : isSameDay(day, now - DAY) ? t.history.yesterday : new Date(day).toLocaleDateString(locale, { weekday: "long" });

  return (
    <main className="safe-top mx-auto min-h-dvh w-full max-w-md px-4 pb-24">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">{t.history.title}</h1>
          <p className="text-sm text-muted-foreground">{t.history.sub}</p>
        </div>
        <button type="button" onClick={() => setCopying(true)} className="flex h-11 items-center gap-2 rounded-full border border-border bg-card pl-3 pr-4 text-sm font-bold text-foreground active:scale-95">
          <CopyIcon className="size-5" /> {t.history.copyLog}
        </button>
      </header>

      <div className="card-soft mb-6 flex items-center justify-between p-2">
        <button type="button" aria-label={t.history.prevDay} onClick={() => setDay((d) => d - DAY)} className="flex size-12 items-center justify-center rounded-2xl text-foreground active:bg-secondary">
          ‹
        </button>
        <div className="text-center">
          <p className="font-display text-lg font-bold leading-tight text-foreground">{dayLabel}</p>
          <p className="text-xs text-muted-foreground">{new Date(day).toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" })}</p>
        </div>
        <button type="button" aria-label={t.history.nextDay} disabled={isToday} onClick={() => setDay((d) => d + DAY)} className="flex size-12 items-center justify-center rounded-2xl text-foreground active:bg-secondary disabled:opacity-30">
          ›
        </button>
      </div>

      <section className="mb-6 grid grid-cols-2 gap-3">
        <StatTile
          label={t.history.feeds}
          value={`${stats.feeds}`}
          sub={[stats.ml ? formatVolume(stats.ml, units) : null, stats.breastMins ? fill(t.home.breastMins, { n: stats.breastMins }) : null].filter(Boolean).join(" · ") || t.history.none}
        />
        <StatTile
          label={t.history.sleep}
          value={durationLabel(0, (stats.nightMins + stats.napMins) * MIN)}
          sub={`${fill(t.home.night, { t: durationLabel(0, stats.nightMins * MIN) })} · ${fill(t.home.naps, { t: durationLabel(0, stats.napMins * MIN) })}`}
        />
        <StatTile label={t.history.diapers} value={`${stats.diapers}`} sub={stats.diapers ? fill(t.home.wetDirty, { w: stats.wet, d: stats.dirty }) : t.history.none} />
        <StatTile label={t.history.naps} value={`${items.filter((i) => i.type === "event" && i.event.kind === "nap").length}`} sub={durationLabel(0, stats.napMins * MIN)} />
      </section>

      <section className="card-soft mb-6 p-4" aria-label={t.history.sevenDayTrend}>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-bold text-foreground">{t.history.last7}</p>
          <div className="flex gap-1 rounded-xl bg-secondary/60 p-1">
            {(["sleep", "feeds"] as const).map((k) => (
              <button key={k} type="button" onClick={() => setTrend(k)} aria-pressed={trend === k} className={`h-8 rounded-lg px-3 text-xs font-bold capitalize ${trend === k ? "bg-card text-foreground shadow" : "text-muted-foreground"}`}>
                {k === "sleep" ? t.history.trendSleep : t.history.trendFeeds}
              </button>
            ))}
          </div>
        </div>
        {trend === "sleep" ? (
          <TrendBars series={series} selected={day} value={(s) => (s.stats.nightMins + s.stats.napMins) / 60} format={(v) => (v ? `${v.toFixed(1)}h` : "–")} tone="bg-sleep" onSelect={setDay} />
        ) : (
          <TrendBars series={series} selected={day} value={(s) => s.stats.feeds} format={(v) => (v ? `${v}` : "–")} tone="bg-feed" onSelect={setDay} />
        )}
        <p className="mt-2 text-center text-xs text-muted-foreground">{trend === "sleep" ? t.history.trendSleepCaption : t.history.trendFeedsCaption}</p>
      </section>

      <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{dayLabel}</h2>
      <Timeline items={items} now={now} onSelect={(e) => setEditingId(e.id)} />

      {editingId ? <EventEditor eventId={editingId} now={now} onClose={() => setEditingId(null)} /> : null}
      {copying ? <CopyLogSheet now={now} onClose={() => setCopying(false)} /> : null}
    </main>
  );
}
