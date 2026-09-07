import { useMemo, useState } from "react";
import { useNow } from "@/components/useNow";
import { CopyLogSheet } from "@/components/CopyLogSheet";
import { CopyIcon } from "@/components/icons";
import { EventEditor } from "@/components/EventEditor";
import { StatTile } from "@/components/StatTile";
import { Timeline } from "@/components/Timeline";
import { TrendBars } from "@/components/TrendBars";
import { daySeries, eventsInRange, groupNights, rangeStats } from "@/domain/stats";
import { durationLabel, isSameDay, startOfDay } from "@/domain/time";
import { useStore } from "@/store/store";

const MIN = 60_000;
const DAY = 24 * 60 * MIN;

function dayLabel(day: number, now: number) {
  if (isSameDay(day, now)) return "Today";
  if (isSameDay(day, now - DAY)) return "Yesterday";
  return new Date(day).toLocaleDateString([], { weekday: "long" });
}

export function History() {
  const { events } = useStore();
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

  return (
    <main className="safe-top mx-auto min-h-dvh w-full max-w-md px-4 pb-24">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">History</h1>
          <p className="text-sm text-muted-foreground">Day by day</p>
        </div>
        <button
          type="button"
          onClick={() => setCopying(true)}
          className="flex h-11 items-center gap-2 rounded-full border border-border bg-card pl-3 pr-4 text-sm font-bold text-foreground active:scale-95"
        >
          <CopyIcon className="size-5" /> Copy log
        </button>
      </header>

      <div className="card-soft mb-6 flex items-center justify-between p-2">
        <button type="button" aria-label="Previous day" onClick={() => setDay((d) => d - DAY)} className="flex size-12 items-center justify-center rounded-2xl text-foreground active:bg-secondary">
          ‹
        </button>
        <div className="text-center">
          <p className="font-display text-lg font-bold leading-tight text-foreground">{dayLabel(day, now)}</p>
          <p className="text-xs text-muted-foreground">{new Date(day).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}</p>
        </div>
        <button type="button" aria-label="Next day" disabled={isToday} onClick={() => setDay((d) => d + DAY)} className="flex size-12 items-center justify-center rounded-2xl text-foreground active:bg-secondary disabled:opacity-30">
          ›
        </button>
      </div>

      <section className="mb-6 grid grid-cols-2 gap-3" aria-label="Day totals">
        <StatTile
          label="Feeds"
          value={`${stats.feeds}`}
          sub={[stats.ml ? `${stats.ml}ml` : null, stats.breastMins ? `${stats.breastMins}m breast` : null].filter(Boolean).join(" · ") || "none"}
        />
        <StatTile
          label="Sleep"
          value={durationLabel(0, (stats.nightMins + stats.napMins) * MIN)}
          sub={`night ${durationLabel(0, stats.nightMins * MIN)} · naps ${durationLabel(0, stats.napMins * MIN)}`}
        />
        <StatTile label="Diapers" value={`${stats.diapers}`} sub={stats.diapers ? `${stats.wet} wet · ${stats.dirty} dirty` : "none"} />
        <StatTile label="Naps" value={`${items.filter((i) => i.type === "event" && i.event.kind === "nap").length}`} sub={durationLabel(0, stats.napMins * MIN)} />
      </section>

      <section className="card-soft mb-6 p-4" aria-label="Seven day trend">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-bold text-foreground">Last 7 days</p>
          <div className="flex gap-1 rounded-xl bg-secondary/60 p-1">
            {(["sleep", "feeds"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTrend(t)}
                aria-pressed={trend === t}
                className={`h-8 rounded-lg px-3 text-xs font-bold capitalize ${trend === t ? "bg-card text-foreground shadow" : "text-muted-foreground"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        {trend === "sleep" ? (
          <TrendBars
            series={series}
            selected={day}
            value={(s) => (s.stats.nightMins + s.stats.napMins) / 60}
            format={(v) => (v ? `${v.toFixed(1)}h` : "–")}
            tone="bg-sleep"
            onSelect={setDay}
          />
        ) : (
          <TrendBars series={series} selected={day} value={(s) => s.stats.feeds} format={(v) => (v ? `${v}` : "–")} tone="bg-feed" onSelect={setDay} />
        )}
        <p className="mt-2 text-center text-xs text-muted-foreground">{trend === "sleep" ? "hours of sleep and naps per day" : "feeds per day"}</p>
      </section>

      <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{dayLabel(day, now)}</h2>
      <Timeline items={items} now={now} onSelect={(e) => setEditingId(e.id)} />

      {editingId ? <EventEditor eventId={editingId} now={now} onClose={() => setEditingId(null)} /> : null}
      {copying ? <CopyLogSheet now={now} onClose={() => setCopying(false)} /> : null}
    </main>
  );
}
