import { useSyncExternalStore } from "react";
import { migrateV1, parseEvents, sortEvents, type FeedSource, type LogEvent, type RestKind } from "@/domain/events";
import * as S from "@/domain/state";

const KEY = "tinylog.events.v2";
const V1_KEY = "tinylog.events.v1";
const PREFS_KEY = "tinylog.prefs.v1";

export type Theme = "system" | "light" | "dark";

export interface Prefs {
  theme: Theme;
  lastMl: Partial<Record<FeedSource, number>>;
  lastMinutes?: number;
  babyName?: string;
  /** epoch ms of the birth day */
  babyDob?: number;
  /** "still asleep?" prompt snoozed until this time */
  staleSnoozedUntil?: number;
}

interface Snapshot {
  events: LogEvent[];
  prefs: Prefs;
  storageOk: boolean;
}

let snap: Snapshot = { events: [], prefs: { theme: "system", lastMl: {} }, storageOk: true };
let hydrated = false;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(snap.events));
    localStorage.setItem(PREFS_KEY, JSON.stringify(snap.prefs));
    if (!snap.storageOk) snap = { ...snap, storageOk: true };
  } catch {
    snap = { ...snap, storageOk: false };
  }
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  let events: LogEvent[] = [];
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
  } catch {
    /* storage unavailable: stay in memory */
  }
  snap = { ...snap, events, prefs };
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
  diaper(at = Date.now()) {
    const r = S.diaper(snap.events, at);
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
  exportJson() {
    return JSON.stringify({ app: "tinylog", version: 2, exportedAt: new Date().toISOString(), prefs: snap.prefs, events: snap.events }, null, 2);
  },
  /** Replaces all events. Returns the number imported, or null if the file is not a TinyLog export. */
  importJson(text: string): number | null {
    try {
      const raw = JSON.parse(text) as { events?: unknown; prefs?: Partial<Prefs> };
      const events = parseEvents(Array.isArray(raw) ? raw : raw.events);
      if (!events) return null;
      if (raw.prefs && typeof raw.prefs === "object") {
        const { babyName, babyDob, lastMl, lastMinutes } = raw.prefs;
        setPrefs({ ...(babyName ? { babyName } : {}), ...(babyDob ? { babyDob } : {}), ...(lastMl ? { lastMl } : {}), ...(lastMinutes ? { lastMinutes } : {}) });
      }
      setEvents(sortEvents(events));
      return events.length;
    } catch {
      return null;
    }
  },
};
