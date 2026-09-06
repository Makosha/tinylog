export type FeedSource = "breast" | "bottle";

export interface FeedEvent {
  id: string;
  kind: "feed";
  /** epoch ms */
  at: number;
  source: FeedSource;
  ml?: number;
}

export type RestKind = "sleep" | "nap";

export interface RestEvent {
  id: string;
  kind: RestKind;
  /** start, epoch ms */
  at: number;
  /** undefined while the baby is still asleep */
  endAt?: number;
}

export type LogEvent = FeedEvent | RestEvent;
export type EventKind = LogEvent["kind"];

export const newId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const isRest = (e: LogEvent): e is RestEvent => e.kind === "sleep" || e.kind === "nap";
export const isFeed = (e: LogEvent): e is FeedEvent => e.kind === "feed";

export const META = {
  feed: { label: "Feed", emoji: "🍼" },
  breast: { label: "Breast", emoji: "🤱" },
  bottle: { label: "Bottle", emoji: "🍼" },
  sleep: { label: "Sleep", emoji: "😴" },
  nap: { label: "Nap", emoji: "🛌" },
  wake: { label: "Wake up", emoji: "⏰" },
} as const;

/** Newest first. */
export const sortEvents = (events: LogEvent[]) => [...events].sort((a, b) => b.at - a.at);

/** Shape of the Lovable mock's storage (key `tinylog.events.v1`). */
interface V1Event {
  id: string;
  type: "feed" | "sleep" | "wake" | "nap";
  at: string;
  endAt?: string;
  feedKind?: FeedSource;
  ml?: number;
}

export function migrateV1(raw: unknown): LogEvent[] {
  if (!Array.isArray(raw)) return [];
  const out: LogEvent[] = [];
  for (const v of raw as V1Event[]) {
    if (!v || typeof v.at !== "string") continue;
    const at = Date.parse(v.at);
    if (Number.isNaN(at)) continue;
    if (v.type === "feed") {
      out.push({ id: v.id, kind: "feed", at, source: v.feedKind ?? "bottle", ...(v.ml ? { ml: v.ml } : {}) });
    } else if (v.type === "sleep" || v.type === "nap") {
      const endAt = v.endAt ? Date.parse(v.endAt) : undefined;
      out.push({ id: v.id, kind: v.type, at, ...(endAt && !Number.isNaN(endAt) ? { endAt } : {}) });
    }
  }
  return sortEvents(out);
}
