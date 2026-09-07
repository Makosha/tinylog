import { useSyncExternalStore } from "react";
import { migrateV1, newId, parseEvents, type FeedSource, type LogEvent, type OtherKind, type RestKind } from "@/domain/events";
import * as S from "@/domain/state";
import { parseMeasurements, sortMeasurements, type Measurement, type Sex } from "@/domain/growth";
import { unitsForLocale, type Units } from "@/domain/units";

const KEY = "tinylog.events.v2";
const V1_KEY = "tinylog.events.v1";
const PREFS_KEY = "tinylog.prefs.v1";
const GROWTH_KEY = "tinylog.growth.v1";

export type Theme = "system" | "light" | "dark";

export interface Prefs {
  theme: Theme;
  lastMl: Partial<Record<FeedSource, number>>;
  lastMinutes?: number;
  babyName?: string;
  /** epoch ms of the birth day */
  babyDob?: number;
  babySex?: Sex;
  /** expected birth date, epoch ms; set when the baby came early */
  babyDue?: number;
  /** "still asleep?" prompt snoozed until this time */
  staleSnoozedUntil?: number;
  units?: Units;
}

interface Snapshot {
  events: LogEvent[];
  measurements: Measurement[];
  prefs: Prefs;
  storageOk: boolean;
}

let snap: Snapshot = { events: [], measurements: [], prefs: { theme: "system", lastMl: {} }, storageOk: true };
let hydrated = false;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(snap.events));
    localStorage.setItem(PREFS_KEY, JSON.stringify(snap.prefs));
    localStorage.setItem(GROWTH_KEY, JSON.stringify(snap.measurements));
    if (!snap.storageOk) snap = { ...snap, storageOk: true };
  } catch {
    snap = { ...snap, storageOk: false };
  }
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  let events: LogEvent[] = [];
  let measurements: Measurement[] = [];
  let prefs = snap.prefs;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      try {
        events = parseEvents(JSON.parse(raw)) ?? [];
        if (!events.length && raw !== "[]") localStorage.setItem(`${KEY}.corrupt`, raw);
      } catch {
        localStorage.setItem(`${KEY}.corrupt`, raw);
      }
    } else {
      const v1 = localStorage.getItem(V1_KEY);
      if (v1) events = migrateV1(JSON.parse(v1));
    }
    const p = localStorage.getItem(PREFS_KEY);
    if (p) prefs = { ...prefs, ...(JSON.parse(p) as Partial<Prefs>) };
    if (!prefs.units) prefs = { ...prefs, units: unitsForLocale(navigator.language ?? "") };
    const g = localStorage.getItem(GROWTH_KEY);
    if (g) measurements = parseMeasurements(JSON.parse(g)) ?? [];
  } catch {
    /* storage unavailable: stay in memory */
  }
  snap = { ...snap, events, measurements, prefs };
  persist();
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  hydrate();
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => snap;
const SERVER: Snapshot = snap;

export function useStore() {
  return useSyncExternalStore(subscribe, getSnapshot, () => SERVER);
}

function setEvents(events: LogEvent[]) {
  snap = { ...snap, events };
  persist();
  emit();
}

function setMeasurements(measurements: Measurement[]) {
  snap = { ...snap, measurements: sortMeasurements(measurements) };
  persist();
  emit();
}

function setPrefs(patch: Partial<Prefs>) {
  snap = { ...snap, prefs: { ...snap.prefs, ...patch } };
  persist();
  emit();
}

export const actions = {
  feed(source: FeedSource, at = Date.now()) {
    const lastBottle = snap.events.find((e) => e.kind === "feed" && e.source === "bottle" && e.ml);
    const ml = snap.prefs.lastMl.bottle ?? (lastBottle?.kind === "feed" ? lastBottle.ml : undefined);
    const r = S.feed(snap.events, source, at, { ml });
    setEvents(r.events);
    return r;
  },
  addOther(kind: OtherKind, at = Date.now()) {
    const r = S.addOther(snap.events, kind, at);
    setEvents(r.events);
    return r.event;
  },
  startRest(kind: RestKind, at = Date.now()) {
    const r = S.startRest(snap.events, kind, at);
    setEvents(r.events);
    return r.event;
  },
  wake(at = Date.now()) {
    const r = S.wake(snap.events, at);
    if (r.event) setEvents(r.events);
    return r.event;
  },
  reopenRest(id: string) {
    setEvents(S.reopenRest(snap.events, id));
  },
  /** "Stayed asleep" for a feed edited after the fact. */
  mergeAroundFeed(feedId: string) {
    setEvents(S.mergeAroundFeed(snap.events, feedId));
  },
  update(id: string, patch: S.EventPatch) {
    setEvents(S.updateEvent(snap.events, id, patch));
    const e = snap.events.find((x) => x.id === id);
    if (e?.kind === "feed") {
      if (patch.ml !== undefined && e.source === "bottle") setPrefs({ lastMl: { ...snap.prefs.lastMl, bottle: patch.ml } });
      if (patch.minutes !== undefined) setPrefs({ lastMinutes: patch.minutes });
    }
  },
  /** Returns the removed event so it can be restored. */
  delete(id: string) {
    const removed = snap.events.find((e) => e.id === id);
    setEvents(S.deleteEvent(snap.events, id));
    return removed;
  },
  restore(event: LogEvent) {
    setEvents(S.restoreEvent(snap.events, event));
  },
  setPrefs,
  addMeasurement(m: Omit<Measurement, "id">) {
    const created: Measurement = { ...m, id: newId() };
    setMeasurements([created, ...snap.measurements]);
    return created;
  },
  updateMeasurement(id: string, patch: Partial<Omit<Measurement, "id">>) {
    setMeasurements(
      snap.measurements.map((m) => {
        if (m.id !== id) return m;
        const next: Measurement = { ...m, ...patch };
        for (const k of ["weightKg", "lengthCm", "headCm"] as const) if (next[k] === undefined || next[k]! <= 0) delete next[k];
        return next;
      }),
    );
  },
  deleteMeasurement(id: string) {
    const removed = snap.measurements.find((m) => m.id === id);
    setMeasurements(snap.measurements.filter((m) => m.id !== id));
    return removed;
  },
  restoreMeasurement(m: Measurement) {
    if (!snap.measurements.some((x) => x.id === m.id)) setMeasurements([m, ...snap.measurements]);
  },
  exportJson() {
    return JSON.stringify(
      { app: "tinylog", version: 3, exportedAt: new Date().toISOString(), prefs: snap.prefs, events: snap.events, measurements: snap.measurements },
      null,
      2,
    );
  },
};

/** Unit preferences, metric until hydrated. */
export function useUnits(): Units {
  return useStore().prefs.units ?? { temp: "c", weight: "kg", length: "cm", volume: "ml" };
}
