import { isRest, type LogEvent } from "./events";
import { MEASURE_META, type Measurement } from "./growth";
import { daySeries, eventsInRange } from "./stats";
import { durationLabel } from "./time";
import { METRIC, formatLength, formatWeight, formatVolume, type Units } from "./units";
import { en, type Dict } from "@/i18n/en";
import { fill } from "@/i18n/index";
import { ageLabel, detailOf, labelOf } from "@/i18n/labels";

const MIN = 60_000;
const DAY = 24 * 60 * MIN;

export interface BabyInfo {
  name?: string;
  dobMs?: number;
  dueMs?: number;
  sex?: "boy" | "girl";
}

/**
 * Plain-text log of the last `days` days, written to be pasted into a chat
 * assistant: a header about the baby, then each day's totals and events in
 * chronological order.
 */
export function formatLog(
  events: LogEvent[],
  measurements: Measurement[],
  baby: BabyInfo,
  days: number,
  now: number,
  units: Units = METRIC,
  t: Dict = en,
  locale = "en",
): string {
  const hm = (ms: number) => new Date(ms).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", hour12: false });
  const dateLabel = (ms: number) => new Date(ms).toLocaleDateString(locale, { weekday: "short", year: "numeric", month: "short", day: "numeric" });
  const shortDate = (ms: number) => new Date(ms).toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
  const lines: string[] = [];
  const bits = [
    baby.dobMs ? fill(t.log.born, { d: shortDate(baby.dobMs), age: ageLabel(t, baby.dobMs, now) }) : null,
    baby.dobMs && baby.dueMs && baby.dueMs - baby.dobMs > 7 * DAY ? fill(t.log.due, { d: shortDate(baby.dueMs), age: ageLabel(t, baby.dueMs, now) }) : null,
    baby.sex ? t.log[baby.sex] : null,
  ].filter(Boolean);
  lines.push(`${fill(t.log.title, { name: baby.name || t.log.baby })}${bits.length ? ` · ${bits.join(" · ")}` : ""}`);
  const range = days === 1 ? t.copy.oneDay : fill(t.copy.nDays, { n: days });
  lines.push(fill(t.log.range, { r: range, d: dateLabel(now), t: hm(now) }));

  const latest = measurements[0];
  if (latest) {
    const parts = (["weight", "length", "head"] as const)
      .filter((k) => typeof latest[MEASURE_META[k].key] === "number")
      .map((k) => `${t.growth[k].toLowerCase()} ${k === "weight" ? formatWeight(latest.weightKg!, units) : formatLength(latest[MEASURE_META[k].key] as number, units)}`);
    if (parts.length) lines.push(fill(t.log.latest, { d: dateLabel(latest.at), m: parts.join(", ") }));
  }

  for (const { day, stats } of daySeries(events, now, days, now)) {
    const next = day + DAY;
    lines.push("");
    lines.push(`## ${dateLabel(day)}`);
    const feeds = [
      stats.feeds === 1 ? t.log.feedTotal : fill(t.log.feedsTotal, { n: stats.feeds }),
      stats.ml ? fill(t.log.bottleTotal, { v: formatVolume(stats.ml, units) }) : null,
      stats.breastMins ? fill(t.log.breastTotal, { n: stats.breastMins }) : null,
    ]
      .filter(Boolean)
      .join(" ");
    const sleep = fill(t.log.sleepTotal, {
      t: durationLabel(0, (stats.nightMins + stats.napMins) * MIN),
      n: durationLabel(0, stats.nightMins * MIN),
      p: durationLabel(0, stats.napMins * MIN),
    });
    const diapers = [
      stats.diapers === 1 ? t.log.diaperTotal : fill(t.log.diapersTotal, { n: stats.diapers }),
      stats.diapers ? fill(t.log.wetDirty, { w: stats.wet, d: stats.dirty }) : null,
    ]
      .filter(Boolean)
      .join(" ");
    lines.push(fill(t.log.totals, { feeds, sleep, diapers }));
    const list = [...eventsInRange(events, day, next, now)].sort((a, b) => a.at - b.at);
    if (!list.length) {
      lines.push(t.log.noEntries);
      continue;
    }
    for (const e of list) {
      if (isRest(e)) {
        const end = e.endAt === undefined ? t.time.stillGoing : hm(e.endAt) + (e.endAt >= next ? ` ${t.log.nextDay}` : "");
        const start = hm(e.at) + (e.at < day ? ` ${t.log.previousDay}` : "");
        lines.push(`- ${start} ${labelOf(t, e)} ${t.log.until} ${end} (${durationLabel(e.at, e.endAt ?? now)})`);
      } else {
        const d = detailOf(t, e, units);
        lines.push(`- ${hm(e.at)} ${labelOf(t, e)}${d ? ` · ${d}` : ""}`);
      }
    }
  }
  return lines.join("\n");
}
