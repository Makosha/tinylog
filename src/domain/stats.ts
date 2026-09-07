import { isDiaper, isFeed, isRest, type FeedEvent, type LogEvent, type RestEvent } from "./events";

export const WINDOW = 24 * 60 * 60_000;

/** Events that started in [from, to), or a rest that overlaps it. Newest first. */
export function eventsInRange(events: LogEvent[], from: number, to: number, now: number) {
  return events.filter((e) => (e.at >= from && e.at < to) || (isRest(e) && e.at < to && (e.endAt ?? now) > from));
}

/** Events of the last 24 h. Newest first. */
export const eventsInWindow = (events: LogEvent[], now: number, windowMs = WINDOW) => eventsInRange(events, now - windowMs, now + 1, now);

export interface WindowStats {
  feeds: number;
  ml: number;
  breastMins: number;
  nightMins: number;
  napMins: number;
  diapers: number;
  wet: number;
  dirty: number;
  /** most recent feed overall, not just in the window */
  lastFeed?: FeedEvent;
}

/** Stats for [from, to). Rest minutes are clipped to the range; an open rest counts up to `now`. */
export function rangeStats(events: LogEvent[], from: number, to: number, now: number): WindowStats {
  let nightMins = 0;
  let napMins = 0;
  for (const e of events) {
    if (!isRest(e)) continue;
    const s = Math.max(e.at, from);
    const t = Math.min(e.endAt ?? now, to, now);
    if (t > s) {
      if (e.kind === "sleep") nightMins += (t - s) / 60_000;
      else napMins += (t - s) / 60_000;
    }
  }
  const feeds = events.filter((e): e is FeedEvent => isFeed(e) && e.at >= from && e.at < to);
  const diapers = events.filter((e) => isDiaper(e) && e.at >= from && e.at < to);
  const lastFeed = events.find(isFeed);
  return {
    feeds: feeds.length,
    ml: feeds.reduce((s, e) => s + (e.ml ?? 0), 0),
    breastMins: feeds.reduce((s, e) => s + (e.minutes ?? 0), 0),
    nightMins: Math.round(nightMins),
    napMins: Math.round(napMins),
    diapers: diapers.length,
    wet: diapers.filter((e) => isDiaper(e) && e.wet).length,
    dirty: diapers.filter((e) => isDiaper(e) && e.dirty).length,
    ...(lastFeed ? { lastFeed } : {}),
  };
}

/** Stats for the last 24 h. */
export const windowStats = (events: LogEvent[], now: number, windowMs = WINDOW) => rangeStats(events, now - windowMs, now + 1, now);

export interface DaySeries {
  /** start of the calendar day */
  day: number;
  stats: WindowStats;
}

/** One entry per calendar day, oldest first, ending on the day containing `endMs`. */
export function daySeries(events: LogEvent[], endMs: number, days: number, now: number): DaySeries[] {
  const out: DaySeries[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(endMs);
    d.setDate(d.getDate() - i);
    const day = d.setHours(0, 0, 0, 0);
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    out.push({ day, stats: rangeStats(events, day, next.getTime(), now) });
  }
  return out;
}

export type TimelineItem =
  | { type: "event"; event: LogEvent }
  | {
      type: "night";
      /** the sleep segments, newest first */
      parts: RestEvent[];
      /** feeds and diapers that happened between the segments, newest first */
      inside: LogEvent[];
      at: number;
      endAt?: number;
      wakings: number;
      open: boolean;
    };

/**
 * Consecutive night sleeps separated only by feeds and diapers collapse into
 * one "night" item. Input and output are newest first.
 */
export function groupNights(events: LogEvent[]): TimelineItem[] {
  const asc = [...events].sort((a, b) => a.at - b.at);
  const out: TimelineItem[] = [];
  let i = 0;
  while (i < asc.length) {
    const e = asc[i]!;
    if (e.kind !== "sleep") {
      out.push({ type: "event", event: e });
      i++;
      continue;
    }
    const parts: RestEvent[] = [e];
    const inside: LogEvent[] = [];
    let j = i + 1;
    let pending: LogEvent[] = [];
    while (j < asc.length) {
      const n = asc[j]!;
      if (n.kind === "sleep") {
        parts.push(n);
        inside.push(...pending);
        pending = [];
        j++;
      } else if (n.kind === "feed" || n.kind === "diaper") {
        pending.push(n);
        j++;
      } else break;
    }
    if (parts.length === 1) {
      out.push({ type: "event", event: e });
      i++;
      continue;
    }
    const last = parts[parts.length - 1]!;
    out.push({
      type: "night",
      parts: [...parts].reverse(),
      inside: [...inside].reverse(),
      at: e.at,
      ...(last.endAt !== undefined ? { endAt: last.endAt } : {}),
      wakings: parts.length - 1,
      open: last.endAt === undefined,
    });
    i += parts.length + inside.length;
  }
  return out.sort((a, b) => (b.type === "event" ? b.event.at : b.at) - (a.type === "event" ? a.event.at : a.at));
}
