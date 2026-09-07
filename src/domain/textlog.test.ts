import { describe, it, expect } from "vitest";
import { formatLog } from "./textlog";
import type { LogEvent } from "./events";

const at = (d: number, h: number, mi = 0) => new Date(2026, 8, d, h, mi).getTime();
const now = at(7, 12);

const events: LogEvent[] = [
  { id: "f2", kind: "feed", at: at(7, 11), source: "bottle", ml: 120 },
  { id: "d1", kind: "diaper", at: at(7, 10, 40), wet: true, dirty: true },
  { id: "n1", kind: "nap", at: at(7, 9), endAt: at(7, 10, 30) },
  { id: "f1", kind: "feed", at: at(7, 7, 30), source: "breast", side: "left", minutes: 15 },
  { id: "s1", kind: "sleep", at: at(6, 20), endAt: at(7, 6) },
];

describe("formatLog", () => {
  const text = formatLog(events, [{ id: "m", at: at(6, 9), weightKg: 4.1, lengthCm: 53 }], { name: "Aruzhan", dobMs: at(1, 12), sex: "girl" }, 2, now);
  it("starts with a header about the baby and the range", () => {
    expect(text.split("\n")[0]).toContain("Aruzhan's log");
    expect(text.split("\n")[0]).toContain("day 7");
    expect(text.split("\n")[0]).toContain("girl");
    expect(text).toContain("Last 2 days");
    expect(text).toContain("weight 4.10 kg, length 53.0 cm");
  });
  it("has one section per day with totals and chronological entries", () => {
    const sections = text.split("\n## ");
    expect(sections).toHaveLength(3);
    const today = sections[2]!;
    expect(today).toContain("2 feeds (120 ml bottle) (15 min breast)");
    expect(today).toContain("1 diaper (1 wet, 1 dirty)");
    expect(today.indexOf("Breast")).toBeLessThan(today.indexOf("Bottle"));
    expect(today).toContain("09:00 Nap until 10:30 (1h 30m)");
    expect(today).toContain("20:00 previous day Sleep until 06:00 (10h 0m)");
    expect(today).toContain("11:00 Bottle · 120ml");
  });
  it("marks a day with nothing logged", () => {
    const empty = formatLog([], [], {}, 1, now);
    expect(empty).toContain("Baby's log");
    expect(empty).toContain("No entries.");
  });
});
