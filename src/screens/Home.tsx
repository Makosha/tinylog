import { useMemo, useRef, useState } from "react";
import { LABEL, eventLabel } from "@/domain/events";
import { deriveState, isStale } from "@/domain/state";
import { eventsInWindow, groupNights, windowStats } from "@/domain/stats";
import { suggestNext } from "@/domain/suggest";
import { ageLabel, durationLabel } from "@/domain/time";
import { actions, useStore } from "@/store/store";
import { resolveTheme } from "@/store/theme";
import { showToast, undoToast } from "@/store/toast";
import { navigate } from "@/store/route";
import type { Measurement } from "@/domain/growth";
import { ActionButtons, type Action } from "@/components/ActionButtons";
import { CapturePanel, type Capture } from "@/components/CapturePanel";
import { EventEditor } from "@/components/EventEditor";
import { MeasureSheet } from "@/components/MeasureSheet";
import { OtherSheet, type OtherChoice } from "@/components/OtherSheet";
import { GearIcon, ICON } from "@/components/icons";
import { SettingsSheet } from "@/components/SettingsSheet";
import { StatTile } from "@/components/StatTile";
import { StateCard } from "@/components/StateCard";
import { Timeline } from "@/components/Timeline";
import { useNow } from "@/components/useNow";

const MIN = 60_000;
const EDIT_LAST_FOR = 30 * MIN;
const SNOOZE = 60 * MIN;
const DEBOUNCE = 500;

const buzz = () => navigator.vibrate?.(20);

export function Home() {
  const { events, measurements, prefs, storageOk } = useStore();
  const now = useNow();
  const [capture, setCapture] = useState<Capture | null>(null);
  const [stayedAsleep, setStayedAsleep] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [settings, setSettings] = useState(false);
  const [other, setOther] = useState(false);
  const [measuringId, setMeasuringId] = useState<string | null>(null);
  const lastTap = useRef(0);
  const warned = useRef(false);

  if (!storageOk && !warned.current) {
    warned.current = true;
    setTimeout(() => showToast({ message: "Can't save on this device" }), 0);
  }

  const state = useMemo(() => deriveState(events, now), [events, now]);
  const stats = useMemo(() => windowStats(events, now), [events, now]);
  const items = useMemo(() => groupNights(eventsInWindow(events, now)), [events, now]);
  const suggestion = useMemo(() => suggestNext(events, state, now, prefs.babyDob), [events, state, now, prefs.babyDob]);
  const stale = isStale(events, now) && (prefs.staleSnoozedUntil ?? 0) < now;
  const lastEvent = !capture && events[0] && now - events[0].at < EDIT_LAST_FOR ? events[0] : undefined;

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
    } else if (a.type === "other") {
      setOther(true);
    } else {
      const e = actions.wake(tappedAt);
      if (e) setCapture({ eventId: e.id, action: "wake", tappedAt });
    }
  };

  const pickOther = (c: OtherChoice) => {
    setOther(false);
    const tappedAt = Date.now();
    buzz();
    if (c.type === "measure") {
      const last = measurements[0];
      const created = actions.addMeasurement({
        at: tappedAt,
        ...(last?.weightKg ? { weightKg: last.weightKg } : {}),
        ...(last?.lengthCm ? { lengthCm: last.lengthCm } : {}),
        ...(last?.headCm ? { headCm: last.headCm } : {}),
      });
      setMeasuringId(created.id);
      return;
    }
    const e = actions.addOther(c.kind, tappedAt);
    setCapture({ eventId: e.id, action: "other", tappedAt });
  };

  const undoCapture = (c: Capture) => {
    if (c.action === "wake") actions.reopenRest(c.eventId);
    else {
      actions.delete(c.eventId);
      if (c.closedRestId && !stayedAsleep) actions.reopenRest(c.closedRestId);
    }
  };

  const closeCapture = () => {
    if (!capture) return;
    const c = capture;
    const e = events.find((x) => x.id === c.eventId);
    setCapture(null);
    if (e) undoToast(`${c.action === "wake" ? "Wake up" : eventLabel(e)} saved`, () => undoCapture(c));
  };

  const captured = capture ? events.find((e) => e.id === capture.eventId) : undefined;
  const measuring = measuringId ? measurements.find((m) => m.id === measuringId) : undefined;
  const light = resolveTheme(prefs.theme) === "light";
  const age = prefs.babyDob ? ageLabel(prefs.babyDob, now) : "";
  const restTotal = stats.nightMins + stats.napMins;

  return (
    <main className="safe-top mx-auto min-h-dvh w-full max-w-md px-4 pb-24">
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
            autoClose={capture.action !== "other"}
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
              showToast({ message: "Undone" });
            }}
            onDone={closeCapture}
          />
        ) : (
          <ActionButtons state={state} suggestion={suggestion} onAction={act} />
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
        onSelect={(e) => {
          if (capture) closeCapture();
          setEditingId(e.id);
        }}
      />

      {editingId ? <EventEditor eventId={editingId} now={now} onClose={() => setEditingId(null)} /> : null}
      {settings ? <SettingsSheet onClose={() => setSettings(false)} /> : null}
      {other ? <OtherSheet onPick={pickOther} onClose={() => setOther(false)} /> : null}
      {measuring ? (
        <MeasureSheet
          measurement={measuring}
          now={now}
          onPatch={(p) => actions.updateMeasurement(measuring.id, p)}
          onDelete={() => {
            const removed = actions.deleteMeasurement(measuring.id);
            setMeasuringId(null);
            if (removed) undoToast("Measurement deleted", () => actions.restoreMeasurement(removed as Measurement));
          }}
          onClose={() => {
            setMeasuringId(null);
            showToast({ message: "Measurement saved", action: { label: "Growth", onClick: () => navigate("growth") } });
          }}
        />
      ) : null}
    </main>
  );
}
