import { useSyncExternalStore } from "react";
import { migrateV1, sortEvents, type FeedSource, type LogEvent, type RestKind } from "@/domain/events";
import * as S from "@/domain/state";

const KEY = "tinylog.events.v2";
const V1_KEY = "tinylog.events.v1";
const PREFS_KEY = "tinylog.prefs.v1";

export type Theme = "system" | "light" | "dark";

interface Prefs {
  theme: Theme;
  lastMl: Partial<Record<FeedSource, number>>;
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
        events = sortEvents(JSON.parse(raw) as LogEvent[]);
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

export const actions = {
  feed(source: FeedSource, at = Date.now()) {
    const r = S.feed(snap.events, source, at);
    setEvents(r.events);
    return r;
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
  update(id: string, patch: S.EventPatch) {
    setEvents(S.updateEvent(snap.events, id, patch));
    if (patch.ml !== undefined && patch.source === undefined) {
      const e = snap.events.find((x) => x.id === id);
      if (e && e.kind === "feed") actions.setPrefs({ lastMl: { ...snap.prefs.lastMl, [e.source]: patch.ml } });
    }
  },
  delete(id: string) {
    setEvents(S.deleteEvent(snap.events, id));
  },
  setPrefs(patch: Partial<Prefs>) {
    snap = { ...snap, prefs: { ...snap.prefs, ...patch } };
    persist();
    emit();
  },
};
