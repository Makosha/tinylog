import { isFeed, isRest, type LogEvent, type RestEvent } from "./events";
import type { BabyState } from "./state";
import { feedIntervalMs } from "./suggest";

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export type DayPart = "night" | "morning" | "afternoon" | "evening";

/** Night 21–5, morning 5–12, afternoon 12–17, evening 17–21. */
export function dayPart(ms: number): DayPart {
  const h = new Date(ms).getHours();
  if (h >= 21 || h < 5) return "night";
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

const startOfDay = (ms: number) => new Date(ms).setHours(0, 0, 0, 0);

/** Naps that started today, including the open one. */
export const napsToday = (events: LogEvent[], now: number) => events.filter((e) => e.kind === "nap" && e.at >= startOfDay(now) && e.at <= now).length;

/**
 * Wakings so far in the current night: sleep segments before the open one
 * that belong to the same night (separated only by non-nap events).
 */
export function wakingsTonight(events: LogEvent[], open: RestEvent): number {
  const asc = [...events].sort((a, b) => a.at - b.at);
  let i = asc.findIndex((e) => e.id === open.id);
  let count = 0;
  for (i = i - 1; i >= 0; i--) {
    const e = asc[i]!;
    if (e.kind === "sleep") count++;
    else if (e.kind === "nap") break;
    else if (e.at < open.at - 6 * HOUR) break;
  }
  return count;
}

/** Longest closed sleep segment in the last 7 days, minutes. */
export function longestSleepLastWeek(events: LogEvent[], now: number) {
  let best = 0;
  for (const e of events) {
    if (e.kind === "sleep" && e.endAt !== undefined && e.at >= now - 7 * DAY) best = Math.max(best, e.endAt - e.at);
  }
  return Math.round(best / MIN);
}

/** Average closed nap in the last 7 days, minutes; null with fewer than 3 naps. */
export function averageNapLastWeek(events: LogEvent[], now: number) {
  const naps = events.filter((e): e is RestEvent => e.kind === "nap" && e.endAt !== undefined && e.at >= now - 7 * DAY);
  if (naps.length < 3) return null;
  return Math.round(naps.reduce((s, n) => s + (n.endAt! - n.at), 0) / naps.length / MIN);
}

/**
 * Usual bedtime: median start of night sleeps that began in the evening
 * (17:00–23:59) over the last 7 days, as minutes since midnight; null with
 * fewer than 3. Re-settles after midnight are not bedtimes.
 */
export function usualBedtime(events: LogEvent[], now: number): number | null {
  const mins: number[] = [];
  for (const e of events) {
    if (e.kind !== "sleep" || e.at < now - 7 * DAY) continue;
    const d = new Date(e.at);
    const m = d.getHours() * 60 + d.getMinutes();
    if (m >= 17 * 60) mins.push(m);
  }
  if (mins.length < 3) return null;
  mins.sort((a, b) => a - b);
  return mins[Math.floor(mins.length / 2)]!;
}

/** When the next feed is likely, from the last feed and the usual interval. */
export function nextFeedEstimate(events: LogEvent[]) {
  const last = events.find(isFeed);
  return last ? last.at + feedIntervalMs(events) : null;
}

/** The rest whose end defines "awake since", for the Adjust link. */
export function restBeforeAwake(events: LogEvent[], state: BabyState): RestEvent | undefined {
  if (state.name !== "awake") return undefined;
  return events.find((e): e is RestEvent => isRest(e) && e.endAt === state.since);
}
