import { isFeed, isRest, type LogEvent } from "./events";
import { isSameDay, startOfDay } from "./time";

const DAY = 24 * 60 * 60_000;

/** Events that start on the day, or that end on the day (overnight sleep), newest first. */
export function eventsForDay(events: LogEvent[], dayMs: number) {
  return events.filter(
    (e) => isSameDay(e.at, dayMs) || (isRest(e) && e.endAt !== undefined && isSameDay(e.endAt, dayMs)),
  );
}

export interface DayStats {
  feeds: number;
  ml: number;
  restMins: number;
  lastFeed?: LogEvent & { kind: "feed" };
}

/** Rest minutes are clipped to the day; an open rest counts up to `now`. */
export function dayStats(events: LogEvent[], dayMs: number, now: number): DayStats {
  const dayStart = startOfDay(dayMs);
  const dayEnd = dayStart + DAY;
  let restMins = 0;
  for (const e of events) {
    if (!isRest(e)) continue;
    const end = e.endAt ?? now;
    const s = Math.max(e.at, dayStart);
    const t = Math.min(end, dayEnd);
    if (t > s) restMins += (t - s) / 60_000;
  }
  const feeds = events.filter((e) => isFeed(e) && isSameDay(e.at, dayMs));
  const lastFeed = events.find(isFeed);
  return {
    feeds: feeds.length,
    ml: feeds.reduce((s, e) => s + (isFeed(e) ? (e.ml ?? 0) : 0), 0),
    restMins: Math.round(restMins),
    ...(lastFeed ? { lastFeed } : {}),
  };
}
