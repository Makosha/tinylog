import { FEVER_C, MEDICINES, MILESTONES, isRest, type LogEvent } from "@/domain/events";
import { formatTemp, formatVolume, type Units } from "@/domain/units";
import { fill } from "./index";
import type { Dict } from "./en";

const DAY = 86_400_000;
const HOUR = 3_600_000;
const MIN = 60_000;

/** "Bottle", "Sleep", "Diaper" in the current language. */
export const labelOf = (t: Dict, e: LogEvent) => t.kind[e.kind === "feed" ? e.source : e.kind];

/** Short detail: "left · 15m", "120ml", "wet · dirty". */
export function detailOf(t: Dict, e: LogEvent, units: Units): string {
  if (e.kind === "feed") {
    return e.source === "breast"
      ? [e.side ? t.detail[e.side] : null, e.minutes ? `${e.minutes}m` : null].filter(Boolean).join(" · ")
      : e.ml
        ? formatVolume(e.ml, units)
        : "";
  }
  switch (e.kind) {
    case "diaper":
      return [e.wet ? t.detail.wet : null, e.dirty ? t.detail.dirty : null].filter(Boolean).join(" · ");
    case "temperature":
      return `${formatTemp(e.celsius, units)}${e.celsius >= FEVER_C ? ` · ${t.detail.fever}` : ""}`;
    case "medicine":
      return [medicineName(t, e.name), e.dose].filter(Boolean).join(" · ");
    case "tummy":
      return e.minutes ? `${e.minutes}m` : "";
    case "milestone":
      return milestoneName(t, e.title);
    case "note":
      return e.text;
    default:
      return "";
  }
}

export const medicineName = (t: Dict, name: string) => ((MEDICINES as readonly string[]).includes(name) ? t.medicines[name as keyof Dict["medicines"]] : name);
export const milestoneName = (t: Dict, title: string) => ((MILESTONES as readonly string[]).includes(title) ? t.milestones[title as keyof Dict["milestones"]] : title);

export const isOpenRest = (e: LogEvent) => isRest(e) && e.endAt === undefined;

/** "day 6", "5 weeks", "3 weeks early". Day 1 is the birth day. */
export function ageLabel(t: Dict, dobMs: number, nowMs: number) {
  const days = Math.floor((startOfDay(nowMs) - startOfDay(dobMs)) / DAY) + 1;
  if (days < 1) {
    const until = 1 - days;
    return until >= 14 ? fill(t.time.weeksEarly, { n: Math.round(until / 7) }) : fill(t.time.daysEarly, { n: until });
  }
  if (days <= 28) return fill(t.time.day, { n: days });
  const weeks = Math.floor((days - 1) / 7);
  if (weeks < 16) return fill(t.time.weeks, { n: weeks });
  return fill(t.time.months, { n: Math.floor((days - 1) / 30.44) });
}

const startOfDay = (ms: number) => new Date(ms).setHours(0, 0, 0, 0);
const sameDay = (a: number, b: number) => startOfDay(a) === startOfDay(b);

/** "today", "yesterday", or a short date. */
export function dayLabel(t: Dict, locale: string, ms: number, nowMs: number) {
  if (sameDay(ms, nowMs)) return t.time.today;
  if (sameDay(ms, nowMs - DAY)) return t.time.yesterday;
  return new Date(ms).toLocaleDateString(locale, { weekday: "short", month: "short", day: "numeric" });
}

/** "12m ago", "2h 5m ago" from a duration. */
export function agoLabel(t: Dict, ms: number) {
  const m = Math.round(ms / MIN);
  const h = Math.floor(m / 60);
  const r = m % 60;
  return fill(t.time.ago, { t: h ? (r ? `${h}h ${r}m` : `${h}h`) : `${m}m` });
}

export const fmtTime = (locale: string, ms: number) => new Date(ms).toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" });
export const fmtDate = (locale: string, ms: number, opts: Intl.DateTimeFormatOptions) => new Date(ms).toLocaleDateString(locale, opts);

export { HOUR, MIN, DAY };
