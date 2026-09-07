import { eventDetail, eventLabel, isRest, type LogEvent } from "./events";
import { MEASURE_META, type Measurement } from "./growth";
import { daySeries, eventsInRange } from "./stats";
import { ageLabel, durationLabel } from "./time";
import { METRIC, formatLength, formatVolume, formatWeight, type Units } from "./units";

const MIN = 60_000;
const DAY = 24 * 60 * MIN;

export interface BabyInfo {
  name?: string;
  dobMs?: number;
  dueMs?: number;
  sex?: "boy" | "girl";
}

const hm = (ms: number) => new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
const dateLabel = (ms: number) => new Date(ms).toLocaleDateString([], { weekday: "short", year: "numeric", month: "short", day: "numeric" });

/**
 * Plain-text log of the last `days` days, written to be pasted into a chat
 * assistant: a header about the baby, then each day's totals and events in
 * chronological order.
 */
export function formatLog(events: LogEvent[], measurements: Measurement[], baby: BabyInfo, days: number, now: number, units: Units = METRIC): string {
  const lines: string[] = [];
  const who = baby.name ? `${baby.name}` : "Baby";
  const bits = [
    baby.dobMs ? `born ${new Date(baby.dobMs).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" })} (${ageLabel(baby.dobMs, now)})` : null,
    baby.dobMs && baby.dueMs && baby.dueMs - baby.dobMs > 7 * DAY ? `due ${new Date(baby.dueMs).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" })}, corrected ${ageLabel(baby.dueMs, now)}` : null,
    baby.sex ?? null,
  ].filter(Boolean);
  lines.push(`${who}'s log${bits.length ? ` · ${bits.join(" · ")}` : ""}`);
  lines.push(`Last ${days} day${days === 1 ? "" : "s"}, exported ${dateLabel(now)} ${hm(now)}. Times are local, 24h.`);

  const latest = measurements[0];
  if (latest) {
    const parts = (["weight", "length", "head"] as const)
      .filter((k) => typeof latest[MEASURE_META[k].key] === "number")
      .map((k) => `${MEASURE_META[k].label.toLowerCase()} ${k === "weight" ? formatWeight(latest.weightKg!, units) : formatLength(latest[MEASURE_META[k].key] as number, units)}`);
    if (parts.length) lines.push(`Latest measurement (${dateLabel(latest.at)}): ${parts.join(", ")}.`);
  }

  for (const { day, stats } of daySeries(events, now, days, now)) {
    const next = day + DAY;
    lines.push("");
    lines.push(`## ${dateLabel(day)}`);
    const totals = [
      `${stats.feeds} feed${stats.feeds === 1 ? "" : "s"}${stats.ml ? ` (${formatVolume(stats.ml, units)} bottle)` : ""}${stats.breastMins ? ` (${stats.breastMins} min breast)` : ""}`,
      `sleep ${durationLabel(0, (stats.nightMins + stats.napMins) * MIN)} (night ${durationLabel(0, stats.nightMins * MIN)}, naps ${durationLabel(0, stats.napMins * MIN)})`,
      `${stats.diapers} diaper${stats.diapers === 1 ? "" : "s"}${stats.diapers ? ` (${stats.wet} wet, ${stats.dirty} dirty)` : ""}`,
    ];
    lines.push(`Totals: ${totals.join("; ")}.`);
    const list = [...eventsInRange(events, day, next, now)].sort((a, b) => a.at - b.at);
    if (!list.length) {
      lines.push("No entries.");
      continue;
    }
    for (const e of list) {
      if (isRest(e)) {
        const end = e.endAt === undefined ? "still going" : hm(e.endAt) + (e.endAt >= next ? " next day" : "");
        const start = hm(e.at) + (e.at < day ? " previous day" : "");
        lines.push(`- ${start} ${eventLabel(e)} until ${end} (${durationLabel(e.at, e.endAt ?? now)})`);
      } else {
        const d = eventDetail(e, units);
        lines.push(`- ${hm(e.at)} ${eventLabel(e)}${d ? ` · ${d}` : ""}`);
      }
    }
  }
  return lines.join("\n");
}
