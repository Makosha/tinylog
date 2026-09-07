import { isFeed, type FeedSource, type LogEvent, type RestKind } from "./events";
import type { BabyState } from "./state";

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export type Suggestion =
  | { type: "feed"; source: FeedSource; reason: string; score: number }
  | { type: "rest"; kind: RestKind; reason: string; score: number };

/** How long a baby of this age usually stays awake between sleeps. */
export function wakeWindowMs(ageDays: number | undefined) {
  if (ageDays === undefined) return 75 * MIN;
  if (ageDays < 28) return 60 * MIN;
  if (ageDays < 56) return 75 * MIN;
  if (ageDays < 84) return 90 * MIN;
  if (ageDays < 120) return 105 * MIN;
  if (ageDays < 180) return 120 * MIN;
  if (ageDays < 270) return 150 * MIN;
  return 180 * MIN;
}

/** Median gap between the last few feeds, clamped to a sane range. Default 2.5 h. */
export function feedIntervalMs(events: LogEvent[]) {
  const feeds = events.filter(isFeed).slice(0, 7);
  const gaps: number[] = [];
  for (let i = 0; i + 1 < feeds.length; i++) gaps.push(feeds[i]!.at - feeds[i + 1]!.at);
  if (gaps.length < 2) return 150 * MIN;
  gaps.sort((a, b) => a - b);
  const median = gaps[Math.floor(gaps.length / 2)]!;
  return Math.min(4 * HOUR, Math.max(90 * MIN, median));
}

const isNight = (ms: number) => {
  const h = new Date(ms).getHours();
  return h >= 19 || h < 6;
};

/**
 * What the parent will most likely tap next while the baby is awake:
 * a feed when the usual interval is nearly up, a nap or sleep when the
 * wake window is nearly used. Nothing while asleep (Wake up is the obvious one).
 */
export function suggestNext(events: LogEvent[], state: BabyState, now: number, dobMs?: number): Suggestion | null {
  if (state.name !== "awake") return null;
  const lastFeed = events.find(isFeed);
  const feedScore = lastFeed ? (now - lastFeed.at) / feedIntervalMs(events) : 0;
  const ageDays = dobMs !== undefined ? (now - dobMs) / DAY : undefined;
  const awakeFor = now - state.since;
  const restScore = awakeFor / wakeWindowMs(ageDays);
  const threshold = 0.85;
  if (feedScore < threshold && restScore < threshold) return null;
  if (feedScore >= restScore) {
    return { type: "feed", source: lastFeed?.source ?? "breast", reason: `last feed ${ago(now - lastFeed!.at)} ago`, score: feedScore };
  }
  return { type: "rest", kind: isNight(now) ? "sleep" : "nap", reason: `awake for ${ago(awakeFor)}`, score: restScore };
}

function ago(ms: number) {
  const m = Math.round(ms / MIN);
  const h = Math.floor(m / 60);
  const r = m % 60;
  return h ? `${h}h ${r}m` : `${m}m`;
}
