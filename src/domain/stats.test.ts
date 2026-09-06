import { describe, it, expect } from "vitest";
import { dayStats, eventsForDay } from "./stats";
import type { LogEvent } from "./events";

const day = new Date(2026, 8, 7, 12, 0).getTime();
const at = (d: number, h: number, mi = 0) => new Date(2026, 8, d, h, mi).getTime();

const events: LogEvent[] = [
  { id: "f2", kind: "feed", at: at(7, 11), source: "bottle", ml: 120 },
  { id: "n1", kind: "nap", at: at(7, 9), endAt: at(7, 10, 30) },
  { id: "f1", kind: "feed", at: at(7, 7), source: "breast" },
  { id: "s1", kind: "sleep", at: at(6, 20), endAt: at(7, 6) },
  { id: "f0", kind: "feed", at: at(6, 19), source: "bottle", ml: 90 },
];

describe("eventsForDay", () => {
  it("includes overnight sleep that ended today", () => {
    expect(eventsForDay(events, day).map((e) => e.id)).toEqual(["f2", "n1", "f1", "s1"]);
  });
});

describe("dayStats", () => {
  it("counts feeds and ml for the day only", () => {
    const s = dayStats(events, day, day);
    expect(s.feeds).toBe(2);
    expect(s.ml).toBe(120);
    expect(s.lastFeed?.id).toBe("f2");
  });
  it("clips overnight sleep to the day and adds naps", () => {
    const s = dayStats(events, day, day);
    expect(s.restMins).toBe(6 * 60 + 90);
  });
  it("counts an open rest up to now", () => {
    const s = dayStats([{ id: "x", kind: "nap", at: at(7, 11) }], day, at(7, 11, 40));
    expect(s.restMins).toBe(40);
  });
});
