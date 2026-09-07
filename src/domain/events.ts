import { METRIC, formatTemp, formatVolume, type Units } from "./units";

export type FeedSource = "breast" | "bottle";
export type BreastSide = "left" | "right" | "both";

export interface FeedEvent {
  id: string;
  kind: "feed";
  /** epoch ms */
  at: number;
  source: FeedSource;
  /** bottle: amount */
  ml?: number;
  /** breast: side */
  side?: BreastSide;
  /** breast: duration */
  minutes?: number;
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

export interface DiaperEvent {
  id: string;
  kind: "diaper";
  at: number;
  wet: boolean;
  dirty: boolean;
}

export interface TemperatureEvent {
  id: string;
  kind: "temperature";
  at: number;
  celsius: number;
}

export const MEDICINES = ["Vitamin D", "Paracetamol", "Ibuprofen", "Colic drops", "Other"] as const;

export interface MedicineEvent {
  id: string;
  kind: "medicine";
  at: number;
  name: string;
  dose?: string;
}

export interface TummyEvent {
  id: string;
  kind: "tummy";
  at: number;
  minutes?: number;
}

export interface BathEvent {
  id: string;
  kind: "bath";
  at: number;
}

export const MILESTONES = ["First smile", "Laughed", "Held head up", "Rolled over", "Grasped a toy", "Slept through the night"] as const;

export interface MilestoneEvent {
  id: string;
  kind: "milestone";
  at: number;
  title: string;
}

export interface NoteEvent {
  id: string;
  kind: "note";
  at: number;
  text: string;
}

export type OtherEvent = DiaperEvent | TemperatureEvent | MedicineEvent | TummyEvent | BathEvent | MilestoneEvent | NoteEvent;
export type OtherKind = OtherEvent["kind"];
/** Kinds offered under "Other", in display order. */
export const OTHER_KINDS: OtherKind[] = ["diaper", "temperature", "medicine", "tummy", "bath", "milestone", "note"];

export type LogEvent = FeedEvent | RestEvent | OtherEvent;
export type EventKind = LogEvent["kind"];

/** Above this the temperature is shown as a fever. */
export const FEVER_C = 38;

export const newId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const isRest = (e: LogEvent): e is RestEvent => e.kind === "sleep" || e.kind === "nap";
export const isFeed = (e: LogEvent): e is FeedEvent => e.kind === "feed";
export const isDiaper = (e: LogEvent): e is DiaperEvent => e.kind === "diaper";

export const LABEL = {
  breast: "Breast",
  bottle: "Bottle",
  sleep: "Sleep",
  nap: "Nap",
  diaper: "Diaper",
  temperature: "Temperature",
  medicine: "Medicine",
  tummy: "Tummy time",
  bath: "Bath",
  milestone: "Milestone",
  note: "Note",
  other: "Other",
  wake: "Wake up",
  awake: "Awake",
  asleep: "Asleep",
  napping: "Napping",
} as const;

/** Label for an event row: "Bottle", "Breast", "Sleep", "Nap", "Diaper". */
export const eventLabel = (e: LogEvent) => LABEL[e.kind === "feed" ? e.source : e.kind];

/** Short detail text: "left · 15m", "120ml", "wet · dirty". */
export function eventDetail(e: LogEvent, units: Units = METRIC): string {
  if (e.kind === "feed") {
    return e.source === "breast"
      ? [e.side, e.minutes ? `${e.minutes}m` : null].filter(Boolean).join(" · ")
      : e.ml
        ? formatVolume(e.ml, units)
        : "";
  }
  switch (e.kind) {
    case "diaper":
      return [e.wet ? "wet" : null, e.dirty ? "dirty" : null].filter(Boolean).join(" · ");
    case "temperature":
      return `${formatTemp(e.celsius, units)}${e.celsius >= FEVER_C ? " · fever" : ""}`;
    case "medicine":
      return [e.name, e.dose].filter(Boolean).join(" · ");
    case "tummy":
      return e.minutes ? `${e.minutes}m` : "";
    case "milestone":
      return e.title;
    case "note":
      return e.text;
    default:
      return "";
  }
}

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

/** Validate an imported/parsed array. Returns null when the shape is wrong. */
export function parseEvents(raw: unknown): LogEvent[] | null {
  if (!Array.isArray(raw)) return null;
  const ok = raw.every(
    (e) =>
      e &&
      typeof e.id === "string" &&
      typeof e.at === "number" &&
      ["feed", "sleep", "nap", ...OTHER_KINDS].includes(e.kind),
  );
  return ok ? sortEvents(raw as LogEvent[]) : null;
}
