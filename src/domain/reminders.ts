import { isFeed, type LogEvent } from "./events";
import { STALE_AFTER, openRest, type BabyState } from "./state";
import { feedIntervalMs, wakeWindowMs } from "./suggest";

const DAY = 86_400_000;

export type ReminderKind = "feed" | "rest" | "stale";

export interface Reminder {
  kind: ReminderKind;
  /** when it becomes due, epoch ms */
  at: number;
  /** stable key so the same reminder never fires twice */
  key: string;
  /** rest kind for "rest" reminders: nap by day, sleep at night */
  restKind?: "nap" | "sleep";
}

const isNight = (ms: number) => {
  const h = new Date(ms).getHours();
  return h >= 19 || h < 6;
};

/**
 * What to remind about next, from the current state. At most one per kind.
 * Feed: usual interval since the last feed. Rest: age-based wake window since
 * the baby woke. Stale: an open rest running past its plausible length.
 */
export function upcomingReminders(events: LogEvent[], state: BabyState, now: number, dobMs?: number): Reminder[] {
  const out: Reminder[] = [];
  const lastFeed = events.find(isFeed);
  if (lastFeed) {
    const at = lastFeed.at + feedIntervalMs(events);
    out.push({ kind: "feed", at, key: `feed:${lastFeed.id}` });
  }
  if (state.name === "awake") {
    const ageDays = dobMs !== undefined ? (now - dobMs) / DAY : undefined;
    const at = state.since + wakeWindowMs(ageDays);
    out.push({ kind: "rest", at, key: `rest:${state.since}`, restKind: isNight(at) ? "sleep" : "nap" });
  } else {
    const open = openRest(events);
    if (open) out.push({ kind: "stale", at: open.at + STALE_AFTER[open.kind], key: `stale:${open.id}` });
  }
  return out.sort((a, b) => a.at - b.at);
}
