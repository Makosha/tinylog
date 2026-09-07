import { useMemo, useRef, useState } from "react";
import type { Measurement } from "@/domain/growth";
import { deriveState, isStale } from "@/domain/state";
import { eventsInWindow, groupNights, windowStats } from "@/domain/stats";
import { suggestNext } from "@/domain/suggest";
import { durationLabel } from "@/domain/time";
import { formatVolume } from "@/domain/units";
import { fill, useT } from "@/i18n/index";
import { ageLabel, labelOf } from "@/i18n/labels";
import { navigate } from "@/store/route";
import { actions, useStore, useUnits } from "@/store/store";
import { useInstall } from "@/store/install";
import { showToast, undoToast } from "@/store/toast";
import { ActionButtons, type Action } from "@/components/ActionButtons";
import { CapturePanel, type Capture } from "@/components/CapturePanel";
import { EventEditor } from "@/components/EventEditor";
import { DownloadIcon, GearIcon } from "@/components/icons";
import { InstallSheet } from "@/components/InstallSheet";
import { MeasureSheet } from "@/components/MeasureSheet";
import { OtherSheet, type OtherChoice } from "@/components/OtherSheet";
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
  const units = useUnits();
  const { t, locale } = useT();
  const now = useNow();
  const [capture, setCapture] = useState<Capture | null>(null);
  const [stayedAsleep, setStayedAsleep] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [settings, setSettings] = useState(false);
  const [other, setOther] = useState(false);
  const [measuringId, setMeasuringId] = useState<string | null>(null);
  const lastTap = useRef(0);
  const warned = useRef(false);
  const install = useInstall();
  const [installing, setInstalling] = useState(false);

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
    if (e) undoToast(fill(t.capture.saved, { k: c.action === "wake" ? t.kind.wake : labelOf(t, e) }), () => undoCapture(c), t.capture.undo);
  };

  const captured = capture ? events.find((e) => e.id === capture.eventId) : undefined;
  const measuring = measuringId ? measurements.find((m) => m.id === measuringId) : undefined;
  const age = prefs.babyDob ? ageLabel(t, prefs.babyDob, now) : "";
  const restTotal = stats.nightMins + stats.napMins;

  return (
    <main className="safe-top mx-auto min-h-dvh w-full max-w-md px-4 pb-24">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">{prefs.babyName || t.app.name}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(now).toLocaleDateString(locale, { weekday: "long", month: "short", day: "numeric" })}
            {age ? ` · ${age}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          {install.kind !== "installed" ? (
            <button type="button" onClick={() => setInstalling(true)} aria-label={t.home.installAria} className="flex size-11 items-center justify-center rounded-full border border-primary/50 bg-primary/10 text-primary active:scale-95">
              <DownloadIcon className="size-5" />
            </button>
          ) : null}
          <button type="button" onClick={() => setSettings(true)} aria-label={t.home.settingsAria} className="flex size-11 items-center justify-center rounded-full border border-border bg-card text-muted-foreground active:scale-95">
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
              showToast({ message: t.capture.undone });
            }}
            onDone={closeCapture}
          />
        ) : (
          <ActionButtons state={state} suggestion={suggestion} onAction={act} />
        )}
      </div>

      <section className="mb-6 grid grid-cols-2 gap-3" aria-label={t.home.last24h}>
        <StatTile
          label={t.home.feeds24h}
          value={`${stats.feeds}`}
          sub={[stats.ml ? formatVolume(stats.ml, units) : null, stats.breastMins ? fill(t.home.breastMins, { n: stats.breastMins }) : null].filter(Boolean).join(" · ") || t.home.noneYet}
        />
        <StatTile
          label={t.home.sleep24h}
          value={durationLabel(0, restTotal * MIN)}
          sub={`${fill(t.home.night, { t: durationLabel(0, stats.nightMins * MIN) })} · ${fill(t.home.naps, { t: durationLabel(0, stats.napMins * MIN) })}`}
        />
        <StatTile
          label={t.home.lastFeed}
          value={stats.lastFeed ? durationLabel(stats.lastFeed.at, now) : "—"}
          sub={stats.lastFeed ? `${t.kind[stats.lastFeed.source].toLowerCase()}${stats.lastFeed.side ? ` · ${t.detail[stats.lastFeed.side]}` : ""}` : t.home.noFeeds}
        />
        <StatTile label={t.home.diapers24h} value={`${stats.diapers}`} sub={stats.diapers ? fill(t.home.wetDirty, { w: stats.wet, d: stats.dirty }) : t.home.noneYet} />
      </section>

      <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t.home.last24h}</h2>
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
      {installing ? <InstallSheet onClose={() => setInstalling(false)} /> : null}
      {other ? <OtherSheet onPick={pickOther} onClose={() => setOther(false)} /> : null}
      {measuring ? (
        <MeasureSheet
          measurement={measuring}
          now={now}
          onPatch={(p) => actions.updateMeasurement(measuring.id, p)}
          onDelete={() => {
            const removed = actions.deleteMeasurement(measuring.id);
            setMeasuringId(null);
            if (removed) undoToast(t.growth.measurementDeleted, () => actions.restoreMeasurement(removed as Measurement), t.capture.undo);
          }}
          onClose={() => {
            setMeasuringId(null);
            showToast({ message: t.growth.measurementSaved, action: { label: t.tabs.growth, onClick: () => navigate("growth") } });
          }}
        />
      ) : null}
    </main>
  );
}
