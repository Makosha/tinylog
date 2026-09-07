import {
  isFeed,
  isRest,
  newId,
  sortEvents,
  type BreastSide,
  type FeedSource,
  type LogEvent,
  type OtherEvent,
  type OtherKind,
  type RestEvent,
  type RestKind,
} from "./events";

const HOUR = 3_600_000;

export type BabyState =
  | { name: "awake"; since: number }
  | { name: "asleep"; since: number; eventId: string }
  | { name: "napping"; since: number; eventId: string };

export const openRest = (events: LogEvent[]): RestEvent | undefined =>
  events.find((e): e is RestEvent => isRest(e) && e.endAt === undefined);

export function deriveState(events: LogEvent[], now: number): BabyState {
  const open = openRest(events);
  if (open) {
    return { name: open.kind === "sleep" ? "asleep" : "napping", since: open.at, eventId: open.id };
  }
  let since: number | undefined;
  for (const e of events) {
    if (isRest(e) && e.endAt !== undefined && (since === undefined || e.endAt > since)) since = e.endAt;
  }
  if (since === undefined) {
    // no rest ever logged: awake since the first event of the last 24 h, if any
    const todays = events.filter((e) => e.at >= now - 24 * HOUR && e.at <= now);
    const first = todays[todays.length - 1];
    since = first ? first.at : now;
  }
  return { name: "awake", since };
}

/** Open rests longer than this are probably a forgotten "Wake up". */
export const STALE_AFTER: Record<RestKind, number> = { nap: 3 * HOUR, sleep: 12 * HOUR };

export function isStale(events: LogEvent[], now: number) {
  const open = openRest(events);
  return !!open && now - open.at > STALE_AFTER[open.kind];
}

interface Result<E extends LogEvent | null> {
  events: LogEvent[];
  event: E;
}

export interface FeedResult extends Result<LogEvent> {
  /** the rest that this feed closed (the baby woke up to feed), if any */
  closedRestId?: string;
}

/**
 * A feed while asleep or napping wakes the baby: the open rest is closed at
 * the feed time. A feed backfilled to before the rest started leaves it open.
 */
export function feed(events: LogEvent[], source: FeedSource, at: number, defaults: Partial<{ ml: number }> = {}): FeedResult {
  const event: LogEvent = { id: newId(), kind: "feed", at, source, ...(source === "bottle" && defaults.ml ? { ml: defaults.ml } : {}) };
  const open = openRest(events);
  if (open && at >= open.at) {
    const next = events.map((e) => (e.id === open.id ? { ...e, endAt: at } : e));
    return { events: sortEvents([event, ...next]), event, closedRestId: open.id };
  }
  return { events: sortEvents([event, ...events]), event };
}

function blankOther(kind: OtherKind, at: number): OtherEvent {
  const id = newId();
  switch (kind) {
    case "diaper":
      return { id, kind, at, wet: true, dirty: false };
    case "temperature":
      return { id, kind, at, celsius: 36.8 };
    case "medicine":
      return { id, kind, at, name: "Vitamin D" };
    case "tummy":
      return { id, kind, at };
    case "bath":
      return { id, kind, at };
    case "milestone":
      return { id, kind, at, title: "First smile" };
    case "note":
      return { id, kind, at, text: "" };
  }
}

/** "Other" events (diaper, temperature, medicine, ...) never change the state. */
export function addOther(events: LogEvent[], kind: OtherKind, at: number): Result<OtherEvent> {
  const event = blankOther(kind, at);
  return { events: sortEvents([event, ...events]), event };
}

/** Kept for callers that only log diapers. */
export const diaper = (events: LogEvent[], at: number) => addOther(events, "diaper", at);

export function startRest(events: LogEvent[], kind: RestKind, at: number): Result<RestEvent> {
  const open = openRest(events);
  let next = events;
  if (open) {
    next = at < open.at ? events.filter((e) => e.id !== open.id) : events.map((e) => (e.id === open.id ? { ...e, endAt: at } : e));
  }
  const event: RestEvent = { id: newId(), kind, at };
  return { events: sortEvents([event, ...next]), event };
}

export function wake(events: LogEvent[], at: number): Result<RestEvent | null> {
  const open = openRest(events);
  if (!open) return { events, event: null };
  const event: RestEvent = { ...open, endAt: Math.max(at, open.at) };
  return { events: events.map((e) => (e.id === open.id ? event : e)), event };
}

/** Reopen a rest (undo of wake). */
export function reopenRest(events: LogEvent[], id: string): LogEvent[] {
  if (openRest(events)) return events;
  return events.map((e) => (e.id === id && isRest(e) ? { ...e, endAt: undefined } : e));
}

/** The rest that ends exactly where this feed starts (the one it interrupted). */
export function restEndedByFeed(events: LogEvent[], feedId: string): RestEvent | undefined {
  const f = events.find((e) => e.id === feedId);
  if (!f || !isFeed(f)) return undefined;
  return events.find((e): e is RestEvent => isRest(e) && e.endAt === f.at);
}

/** The first rest that starts after this feed, if nothing but feeds/diapers lie between. */
export function restAfterFeed(events: LogEvent[], feedId: string): RestEvent | undefined {
  const f = events.find((e) => e.id === feedId);
  if (!f) return undefined;
  const after = [...events].filter((e) => e.at > f.at).sort((a, b) => a.at - b.at);
  return after.find(isRest);
}

/**
 * "Stayed asleep" for a feed that already closed a rest: join the rest it
 * ended with the rest that followed (or just reopen it if none followed).
 */
export function mergeAroundFeed(events: LogEvent[], feedId: string): LogEvent[] {
  const before = restEndedByFeed(events, feedId);
  if (!before) return events;
  const after = restAfterFeed(events, feedId);
  if (!after) return reopenRest(events, before.id);
  const merged: RestEvent = { ...before, endAt: after.endAt };
  if (after.endAt === undefined) delete merged.endAt;
  return sortEvents(events.filter((e) => e.id !== after.id).map((e) => (e.id === before.id ? merged : e)));
}

export type EventPatch = Partial<{
  at: number;
  endAt: number | undefined;
  kind: RestKind;
  source: FeedSource;
  ml: number | undefined;
  side: BreastSide | undefined;
  minutes: number | undefined;
  wet: boolean;
  dirty: boolean;
  celsius: number;
  name: string;
  dose: string | undefined;
  title: string;
  text: string;
}>;

export function updateEvent(events: LogEvent[], id: string, patch: EventPatch): LogEvent[] {
  return sortEvents(
    events.map((e) => {
      if (e.id !== id) return e;
      const { kind, ...rest } = patch;
      const next = { ...e, ...rest } as LogEvent;
      if (isRest(next)) {
        if (kind) next.kind = kind;
        if (next.endAt !== undefined && next.endAt < next.at) next.endAt = next.at;
      }
      if (next.kind === "tummy" && (next.minutes === undefined || next.minutes <= 0)) delete next.minutes;
      if (next.kind === "medicine" && !next.dose) delete next.dose;
      if (next.kind === "feed") {
        if (next.ml === undefined || next.ml <= 0) delete next.ml;
        if (next.minutes === undefined || next.minutes <= 0) delete next.minutes;
        if (next.source !== "breast") {
          delete next.side;
          delete next.minutes;
        } else {
          delete next.ml;
        }
      }
      return next;
    }),
  );
}

export function deleteEvent(events: LogEvent[], id: string): LogEvent[] {
  return events.filter((e) => e.id !== id);
}

export function restoreEvent(events: LogEvent[], event: LogEvent): LogEvent[] {
  if (events.some((e) => e.id === event.id)) return events;
  // never restore a second open rest
  if (isRest(event) && event.endAt === undefined && openRest(events)) return events;
  return sortEvents([event, ...events]);
}
