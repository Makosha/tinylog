import { useEffect, useMemo, useRef, useState } from "react";
import { LABEL, eventLabel, type LogEvent } from "@/domain/events";
import { deriveState, isStale, restEndedByFeed } from "@/domain/state";
import { eventsInWindow, groupNights, windowStats } from "@/domain/stats";
import { ageLabel, durationLabel } from "@/domain/time";
import { actions, useStore } from "@/store/store";
import { applyTheme, onSystemThemeChange, resolveTheme } from "@/store/theme";
import { ActionButtons, type Action } from "@/components/ActionButtons";
import { CapturePanel, type Capture } from "@/components/CapturePanel";
import { EditSheet } from "@/components/EditSheet";
import { GearIcon, ICON } from "@/components/icons";
import { SettingsSheet } from "@/components/SettingsSheet";
import { StatTile } from "@/components/StatTile";
import { StateCard } from "@/components/StateCard";
import { Timeline } from "@/components/Timeline";
import { Toast, type ToastData } from "@/components/Toast";

const MIN = 60_000;
const EDIT_LAST_FOR = 30 * MIN;
const SNOOZE = 60 * MIN;
const DEBOUNCE = 500;

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

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function Home() {
  const { events, prefs, storageOk } = useStore();
  const now = useNow();
  const [capture, setCapture] = useState<Capture | null>(null);
  const [stayedAsleep, setStayedAsleep] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [settings, setSettings] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const lastTap = useRef(0);

  useEffect(() => {
    applyTheme(prefs.theme);
    return onSystemThemeChange(() => applyTheme(prefs.theme));
  }, [prefs.theme]);

  useEffect(() => {
    if (!storageOk) setToast({ message: "Can't save on this device" });
  }, [storageOk]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), toast.action ? 8000 : 1800);
    return () => window.clearTimeout(id);
  }, [toast]);

  const state = useMemo(() => deriveState(events, now), [events, now]);
  const stats = useMemo(() => windowStats(events, now), [events, now]);
  const items = useMemo(() => groupNights(eventsInWindow(events, now)), [events, now]);
  const stale = isStale(events, now) && (prefs.staleSnoozedUntil ?? 0) < now;
  const lastEvent = !capture && events[0] && now - events[0].at < EDIT_LAST_FOR ? events[0] : undefined;

  const undoToast = (label: string, undo: () => void) => setToast({ message: label, action: { label: "Undo", onClick: () => { undo(); setToast(null); } } });

  const act = (a: Action) => {
    const tappedAt = Date.now();
    if (tappedAt - lastTap.current < DEBOUNCE) return;
    lastTap.current = tappedAt;
    buzz();
    if (a.type === "feed") {
      const r = actions.feed(a.source, tappedAt);
      setCapture({ eventId: r.event.id, action: "feed", tappedAt, ...(r.closedRestId ? { closedRestId: r.closedRestId } : {}) });
      setStayedAsleep(false);
    } else if (a.type === "rest") {
      const e = actions.startRest(a.kind, tappedAt);
      setCapture({ eventId: e.id, action: "rest", tappedAt });
    } else if (a.type === "diaper") {
      const e = actions.diaper(tappedAt);
      setCapture({ eventId: e.id, action: "diaper", tappedAt });
    } else {
      const e = actions.wake(tappedAt);
      if (e) setCapture({ eventId: e.id, action: "wake", tappedAt });
    }
  };

  const undoCapture = (c: Capture) => {
    if (c.action === "wake") actions.reopenRest(c.eventId);
    else {
      const removed = actions.delete(c.eventId);
      if (c.closedRestId && !stayedAsleep) actions.reopenRest(c.closedRestId);
      return removed;
    }
    return undefined;
  };

  const closeCapture = () => {
    if (!capture) return;
    const c = capture;
    const e = events.find((x) => x.id === c.eventId);
    setCapture(null);
    if (e) undoToast(`${c.action === "wake" ? "Wake up" : eventLabel(e)} saved`, () => undoCapture(c));
  };

  const captured = capture ? events.find((e) => e.id === capture.eventId) : undefined;
  const editing = editingId ? events.find((e) => e.id === editingId) : undefined;
  const light = resolveTheme(prefs.theme) === "light";
  const age = prefs.babyDob ? ageLabel(prefs.babyDob, now) : "";
  const restTotal = stats.nightMins + stats.napMins;

  return (
    <main className="safe-top mx-auto min-h-dvh w-full max-w-md px-4 pb-16">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">{prefs.babyName || "TinyLog"}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(now).toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}
            {age ? ` · ${age}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => actions.setPrefs({ theme: light ? "dark" : "light" })}
            aria-label={light ? "Switch to night mode" : "Switch to day mode"}
            className="flex size-11 items-center justify-center rounded-full border border-border bg-card text-muted-foreground active:scale-95"
          >
            {light ? <ICON.sleep className="size-5" /> : <ICON.awake className="size-5" />}
          </button>
          <button
            type="button"
            onClick={() => setSettings(true)}
            aria-label="Settings"
            className="flex size-11 items-center justify-center rounded-full border border-border bg-card text-muted-foreground active:scale-95"
          >
            <GearIcon className="size-5" />
          </button>
        </div>
      </header>

      <div className="mb-6">
        <StateCard
          state={state}
          stats={stats}
          now={now}
          stale={stale}
          lastEvent={lastEvent}
          onWakeNow={() => act({ type: "wake" })}
          onSetWakeTime={() => {
            const e = actions.wake(Date.now());
            if (e) {
              setCapture({ eventId: e.id, action: "wake", tappedAt: Date.now() });
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
          onSnooze={() => actions.setPrefs({ staleSnoozedUntil: now + SNOOZE })}
          onEditLast={(e) => setEditingId(e.id)}
        />
      </div>

      <div className="mb-6">
        {capture && captured ? (
          <CapturePanel
            capture={capture}
            event={captured}
            stayedAsleep={stayedAsleep}
            onStayedAsleep={(v) => {
              setStayedAsleep(v);
              if (!capture.closedRestId) return;
              if (v) actions.reopenRest(capture.closedRestId);
              else actions.update(capture.closedRestId, { endAt: captured.at });
            }}
            onPatch={(p) => {
              actions.update(capture.eventId, p);
              if (p.at !== undefined && capture.closedRestId && !stayedAsleep) actions.update(capture.closedRestId, { endAt: p.at });
            }}
            onUndo={() => {
              undoCapture(capture);
              setCapture(null);
              setToast({ message: "Undone" });
            }}
            onDone={closeCapture}
          />
        ) : (
          <ActionButtons state={state} onAction={act} />
        )}
      </div>

      <section className="mb-6 grid grid-cols-2 gap-3" aria-label="Last 24 hours">
        <StatTile
          label="Feeds · 24h"
          value={`${stats.feeds}`}
          sub={[stats.ml ? `${stats.ml}ml` : null, stats.breastMins ? `${stats.breastMins}m breast` : null].filter(Boolean).join(" · ") || "none yet"}
        />
        <StatTile
          label="Sleep · 24h"
          value={durationLabel(0, restTotal * MIN)}
          sub={`night ${durationLabel(0, stats.nightMins * MIN)} · naps ${durationLabel(0, stats.napMins * MIN)}`}
        />
        <StatTile
          label="Last feed"
          value={stats.lastFeed ? durationLabel(stats.lastFeed.at, now) : "—"}
          sub={stats.lastFeed ? `ago · ${LABEL[stats.lastFeed.source].toLowerCase()}${stats.lastFeed.side ? ` ${stats.lastFeed.side}` : ""}` : "no feeds"}
        />
        <StatTile label="Diapers · 24h" value={`${stats.diapers}`} sub={stats.diapers ? `${stats.wet} wet · ${stats.dirty} dirty` : "none yet"} />
      </section>

      <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Last 24 hours</h2>
      <Timeline
        items={items}
        now={now}
        onSelect={(e: LogEvent) => {
          if (capture) closeCapture();
          setEditingId(e.id);
        }}
      />

      {editing ? (
        <EditSheet
          event={editing}
          now={now}
          canStayAsleep={editing.kind === "feed" && !!restEndedByFeed(events, editing.id)}
          onPatch={(p) => actions.update(editing.id, p)}
          onWakeNow={() => actions.wake()}
          onStayAsleep={() => {
            actions.mergeAroundFeed(editing.id);
            setEditingId(null);
            setToast({ message: "Sleep joined back together" });
          }}
          onDelete={() => {
            const removed = actions.delete(editing.id);
            setEditingId(null);
            if (removed) undoToast(`${eventLabel(removed)} deleted`, () => actions.restore(removed));
          }}
          onClose={() => setEditingId(null)}
        />
      ) : null}

      {settings ? (
        <SettingsSheet
          prefs={prefs}
          onPrefs={(p) => actions.setPrefs(p)}
          onExport={() => download(`tinylog-${new Date(now).toISOString().slice(0, 10)}.json`, actions.exportJson())}
          onImport={(file) => {
            if (!window.confirm("Replace everything on this phone with the imported log?")) return;
            file.text().then((text) => {
              const n = actions.importJson(text);
              setToast({ message: n === null ? "That file isn't a TinyLog export" : `Imported ${n} entries` });
            });
          }}
          onClose={() => setSettings(false)}
        />
      ) : null}

      <Toast toast={toast} />
    </main>
  );
}
