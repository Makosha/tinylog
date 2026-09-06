import { useEffect, useMemo, useState } from "react";
import { LABEL, type LogEvent } from "@/domain/events";
import { deriveState } from "@/domain/state";
import { dayStats, eventsForDay } from "@/domain/stats";
import { durationLabel } from "@/domain/time";
import { actions, useStore } from "@/store/store";
import { applyTheme, onSystemThemeChange, resolveTheme } from "@/store/theme";
import { ActionButtons, type Action } from "@/components/ActionButtons";
import { CapturePanel, type Capture } from "@/components/CapturePanel";
import { EditSheet } from "@/components/EditSheet";
import { ICON } from "@/components/icons";
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
  const [capture, setCapture] = useState<Capture | null>(null);
  const [stayedAsleep, setStayedAsleep] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    applyTheme(prefs.theme);
    return onSystemThemeChange(() => applyTheme(prefs.theme));
  }, [prefs.theme]);

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
      const r = actions.feed(a.source, tappedAt);
      setCapture({ eventId: r.event.id, action: "feed", tappedAt, ...(r.closedRestId ? { closedRestId: r.closedRestId } : {}) });
      setStayedAsleep(false);
    } else if (a.type === "rest") {
      const e = actions.startRest(a.kind, tappedAt);
      setCapture({ eventId: e.id, action: "rest", tappedAt });
    } else {
      const e = actions.wake(tappedAt);
      if (e) setCapture({ eventId: e.id, action: "wake", tappedAt });
    }
  };

  const captured = capture ? events.find((e) => e.id === capture.eventId) : undefined;
  const editing = editingId ? events.find((e) => e.id === editingId) : undefined;
  const light = resolveTheme(prefs.theme) === "light";

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
          onClick={() => actions.setPrefs({ theme: light ? "dark" : "light" })}
          aria-label={light ? "Switch to night mode" : "Switch to day mode"}
          className="flex size-11 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground active:scale-95"
        >
          {light ? <ICON.sleep className="size-5" /> : <ICON.awake className="size-5" />}
        </button>
      </header>

      <div className="mb-4">
        <StateCard state={state} stats={stats} now={now} />
      </div>

      <div className="mb-4">
        {capture && captured ? (
          <CapturePanel
            capture={capture}
            event={captured}
            lastMl={captured.kind === "feed" ? prefs.lastMl[captured.source] : undefined}
            stayedAsleep={stayedAsleep}
            onStayedAsleep={(v) => {
              setStayedAsleep(v);
              if (!capture.closedRestId) return;
              if (v) actions.reopenRest(capture.closedRestId);
              else actions.update(capture.closedRestId, { endAt: captured.at });
            }}
            onPatch={(p) => {
              actions.update(capture.eventId, p);
              // the interrupted rest ends when the feed happened
              if (p.at !== undefined && capture.closedRestId && !stayedAsleep) actions.update(capture.closedRestId, { endAt: p.at });
            }}
            onUndo={() => {
              if (capture.action === "wake") actions.reopenRest(capture.eventId);
              else {
                actions.delete(capture.eventId);
                if (capture.closedRestId) actions.reopenRest(capture.closedRestId);
              }
              setCapture(null);
              setToast("Undone");
            }}
            onDone={() => setCapture(null)}
          />
        ) : (
          <ActionButtons state={state} onAction={act} />
        )}
      </div>

      <section className="mb-6 grid grid-cols-3 gap-2" aria-label="Today">
        <StatTile label="Feeds" value={`${stats.feeds}`} sub={stats.ml ? `${stats.ml}ml` : "today"} />
        <StatTile label="Rest" value={`${Math.floor(stats.restMins / 60)}h`} sub={`${stats.restMins % 60}m today`} />
        <StatTile
          label="Last feed"
          value={stats.lastFeed ? durationLabel(stats.lastFeed.at, now) : "—"}
          sub={stats.lastFeed ? `ago${stats.lastFeed.ml ? ` · ${stats.lastFeed.ml}ml` : ""}` : "no feeds"}
        />
      </section>

      <h2 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Today</h2>
      <Timeline
        events={today}
        now={now}
        onSelect={(e: LogEvent) => {
          setCapture(null);
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
            setToast(`${LABEL[editing.kind === "feed" ? editing.source : editing.kind]} deleted`);
          }}
          onClose={() => setEditingId(null)}
        />
      ) : null}

      <Toast message={toast} />
    </main>
  );
}
