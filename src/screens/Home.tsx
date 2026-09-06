import { useEffect, useMemo, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { META, type LogEvent } from "@/domain/events";
import { deriveState } from "@/domain/state";
import { dayStats, eventsForDay } from "@/domain/stats";
import { durationLabel } from "@/domain/time";
import { actions, useStore } from "@/store/store";
import { ActionButtons, type Action } from "@/components/ActionButtons";
import { EditSheet } from "@/components/EditSheet";
import { JustLogged, type Recent } from "@/components/JustLogged";
import { StatTile } from "@/components/StatTile";
import { StateCard } from "@/components/StateCard";
import { Timeline } from "@/components/Timeline";
import { Toast } from "@/components/Toast";

function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    const onVis = () => document.visibilityState === "visible" && setNow(Date.now());
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [intervalMs]);
  return now;
}

const buzz = () => navigator.vibrate?.(20);

export function Home() {
  const { events, prefs, storageOk } = useStore();
  const now = useNow();
  const [recent, setRecent] = useState<Recent | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("daylight", prefs.daylight);
  }, [prefs.daylight]);

  useEffect(() => {
    if (!storageOk) setToast("Can't save on this device");
  }, [storageOk]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 1800);
    return () => window.clearTimeout(id);
  }, [toast]);

  const state = useMemo(() => deriveState(events, now), [events, now]);
  const today = useMemo(() => eventsForDay(events, now), [events, now]);
  const stats = useMemo(() => dayStats(events, now, now), [events, now]);

  const act = (a: Action) => {
    const tappedAt = Date.now();
    buzz();
    if (a.type === "feed") {
      const e = actions.feed(a.source, tappedAt);
      setRecent({ eventId: e.id, action: "feed", tappedAt });
      setToast(`${META[a.source].emoji} ${META[a.source].label} logged`);
    } else if (a.type === "rest") {
      const e = actions.startRest(a.kind, tappedAt);
      setRecent({ eventId: e.id, action: "rest", tappedAt });
      setToast(`${META[a.kind].emoji} ${META[a.kind].label} started`);
    } else {
      const e = actions.wake(tappedAt);
      if (!e) return;
      setRecent({ eventId: e.id, action: "wake", tappedAt });
      setToast(`${META.wake.emoji} Awake`);
    }
  };

  const recentEvent = recent ? events.find((e) => e.id === recent.eventId) : undefined;
  const editing = editingId ? events.find((e) => e.id === editingId) : undefined;

  return (
    <main className="safe-top mx-auto min-h-dvh w-full max-w-md px-4 pb-16">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">TinyLog</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(now).toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}
          </p>
        </div>
        <button
          type="button"
          onClick={() => actions.setPrefs({ daylight: !prefs.daylight })}
          aria-label={prefs.daylight ? "Switch to night mode" : "Switch to day mode"}
          className="flex size-11 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground active:scale-95"
        >
          {prefs.daylight ? <Moon className="size-5" /> : <Sun className="size-5" />}
        </button>
      </header>

      <div className="mb-4">
        <StateCard state={state} stats={stats} now={now} />
      </div>

      <div className="mb-4">
        <ActionButtons state={state} onAction={act} />
      </div>

      {recent ? (
        <JustLogged
          recent={recent}
          event={recentEvent}
          lastMl={recentEvent?.kind === "feed" ? prefs.lastMl[recentEvent.source] : undefined}
          onTime={(ms) => actions.update(recent.eventId, recent.action === "wake" ? { endAt: ms } : { at: ms })}
          onMl={(ml) => actions.update(recent.eventId, { ml })}
          onUndo={() => {
            if (recent.action === "wake") actions.reopenRest(recent.eventId);
            else actions.delete(recent.eventId);
            setRecent(null);
          }}
          onDismiss={() => setRecent(null)}
        />
      ) : null}

      <section className="mb-6 grid grid-cols-3 gap-2" aria-label="Today">
        <StatTile label="Feeds" value={`${stats.feeds}`} sub={stats.ml ? `${stats.ml}ml` : "today"} />
        <StatTile
          label="Rest"
          value={`${Math.floor(stats.restMins / 60)}h`}
          sub={`${stats.restMins % 60}m today`}
        />
        <StatTile
          label="Last feed"
          value={stats.lastFeed ? durationLabel(stats.lastFeed.at, now) : "—"}
          sub={stats.lastFeed ? `ago${stats.lastFeed.ml ? ` · ${stats.lastFeed.ml}ml` : ""}` : "no feeds"}
        />
      </section>

      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Today</h2>
      <Timeline
        events={today}
        now={now}
        onSelect={(e: LogEvent) => {
          setRecent(null);
          setEditingId(e.id);
        }}
      />

      {editing ? (
        <EditSheet
          event={editing}
          now={now}
          lastMl={prefs.lastMl}
          onPatch={(p) => actions.update(editing.id, p)}
          onWakeNow={() => actions.wake()}
          onDelete={() => {
            actions.delete(editing.id);
            setEditingId(null);
          }}
          onClose={() => setEditingId(null)}
        />
      ) : null}

      <Toast message={toast} />
    </main>
  );
}
