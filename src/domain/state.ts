import { isRest, newId, sortEvents, type BreastSide, type FeedSource, type LogEvent, type RestEvent, type RestKind } from "./events";

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
  return { name: "awake", since: since ?? now };
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
export function feed(events: LogEvent[], source: FeedSource, at: number): FeedResult {
  const event: LogEvent = { id: newId(), kind: "feed", at, source };
  const open = openRest(events);
  if (open && at >= open.at) {
    const next = events.map((e) => (e.id === open.id ? { ...e, endAt: at } : e));
    return { events: sortEvents([event, ...next]), event, closedRestId: open.id };
  }
  return { events: sortEvents([event, ...events]), event };
}

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

export type EventPatch = Partial<{ at: number; endAt: number | undefined; source: FeedSource; ml: number | undefined; side: BreastSide | undefined }>;

export function updateEvent(events: LogEvent[], id: string, patch: EventPatch): LogEvent[] {
  return sortEvents(
    events.map((e) => {
      if (e.id !== id) return e;
      const next = { ...e, ...patch } as LogEvent;
      if (isRest(next) && next.endAt !== undefined && next.endAt < next.at) next.endAt = next.at;
      if (next.kind === "feed") {
        if (next.ml === undefined || next.ml <= 0) delete next.ml;
        if (next.source !== "breast" || next.side === undefined) delete next.side;
      }
      return next;
    }),
  );
}

export function deleteEvent(events: LogEvent[], id: string): LogEvent[] {
  return events.filter((e) => e.id !== id);
}
