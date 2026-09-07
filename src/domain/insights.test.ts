import { describe, it, expect } from "vitest";
import { averageNapLastWeek, dayPart, longestSleepLastWeek, napsToday, nextFeedEstimate, restBeforeAwake, usualBedtime, wakingsTonight } from "./insights";
import type { LogEvent, RestEvent } from "./events";

const MIN = 60_000, H = 60 * MIN, D = 24 * H;
const at = (d: number, h: number, mi = 0) => new Date(2026, 8, d, h, mi).getTime();

describe("insights", () => {
  it("names the part of the day", () => {
    expect(dayPart(at(7, 7))).toBe("morning");
    expect(dayPart(at(7, 14))).toBe("afternoon");
    expect(dayPart(at(7, 19))).toBe("evening");
    expect(dayPart(at(7, 23))).toBe("night");
    expect(dayPart(at(7, 3))).toBe("night");
  });
  it("counts today's naps including the open one", () => {
    const ev: LogEvent[] = [
      { id: "n3", kind: "nap", at: at(7, 15) },
      { id: "n2", kind: "nap", at: at(7, 11), endAt: at(7, 12) },
      { id: "n1", kind: "nap", at: at(6, 14), endAt: at(6, 15) },
    ];
    expect(napsToday(ev, at(7, 15, 5))).toBe(2);
  });
  it("counts wakings in the current night, stopping at a nap", () => {
    const open: RestEvent = { id: "s3", kind: "sleep", at: at(8, 4, 10) };
    const ev: LogEvent[] = [
      open,
      { id: "f2", kind: "feed", at: at(8, 4), source: "breast" },
      { id: "s2", kind: "sleep", at: at(8, 1, 30), endAt: at(8, 4) },
      { id: "f1", kind: "feed", at: at(8, 1), source: "breast" },
      { id: "s1", kind: "sleep", at: at(7, 20), endAt: at(8, 1) },
      { id: "n0", kind: "nap", at: at(7, 14), endAt: at(7, 15) },
      { id: "s0", kind: "sleep", at: at(6, 20), endAt: at(7, 6) },
    ];
    expect(wakingsTonight(ev, open)).toBe(2);
  });
  it("longest sleep and average nap over the last week", () => {
    const now = at(8, 12);
    const ev: LogEvent[] = [
      { id: "s1", kind: "sleep", at: at(7, 20), endAt: at(8, 0, 10) },
      { id: "s0", kind: "sleep", at: at(6, 21), endAt: at(7, 3) },
      { id: "n1", kind: "nap", at: at(7, 9), endAt: at(7, 9, 40) },
      { id: "n2", kind: "nap", at: at(7, 13), endAt: at(7, 14) },
      { id: "n3", kind: "nap", at: at(6, 13), endAt: at(6, 13, 50) },
      { id: "old", kind: "sleep", at: at(1, 20) - 10 * D, endAt: at(2, 8) - 10 * D },
    ];
    expect(longestSleepLastWeek(ev, now)).toBe(6 * 60);
    expect(averageNapLastWeek(ev, now)).toBe(50);
    expect(averageNapLastWeek(ev.slice(0, 3), now)).toBeNull();
  });
  it("usual bedtime is the median night-sleep start", () => {
    const now = at(8, 12);
    const ev: LogEvent[] = [
      { id: "a", kind: "sleep", at: at(7, 20, 15), endAt: at(8, 6) },
      { id: "b", kind: "sleep", at: at(6, 19, 50), endAt: at(7, 6) },
      { id: "c", kind: "sleep", at: at(5, 20, 40), endAt: at(6, 6) },
      { id: "d", kind: "sleep", at: at(6, 1, 30), endAt: at(6, 4) }, // a 1:30 AM re-settle is not a bedtime
    ];
    expect(usualBedtime(ev, now)).toBe(20 * 60 + 15);
    expect(usualBedtime(ev.slice(0, 2), now)).toBeNull();
  });
  it("next feed estimate and the rest behind 'awake since'", () => {
    const ev: LogEvent[] = [
      { id: "f", kind: "feed", at: at(7, 10), source: "bottle" },
      { id: "n", kind: "nap", at: at(7, 8), endAt: at(7, 9) },
    ];
    expect(nextFeedEstimate(ev)).toBe(at(7, 12, 30));
    expect(restBeforeAwake(ev, { name: "awake", since: at(7, 9) })?.id).toBe("n");
    expect(restBeforeAwake(ev, { name: "asleep", since: 0, eventId: "x" })).toBeUndefined();
  });
});
