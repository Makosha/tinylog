import { describe, it, expect } from "vitest";
import { windowStats, eventsInWindow, eventsInRange, rangeStats, daySeries, groupNights } from "./stats";
import type { LogEvent } from "./events";

const at = (d: number, h: number, mi = 0) => new Date(2026, 8, d, h, mi).getTime();
const day = at(7, 12);

const events: LogEvent[] = [
  { id: "f2", kind: "feed", at: at(7, 11), source: "bottle", ml: 120 },
  { id: "d1", kind: "diaper", at: at(7, 10, 40), wet: true, dirty: true },
  { id: "n1", kind: "nap", at: at(7, 9), endAt: at(7, 10, 30) },
  { id: "f1", kind: "feed", at: at(7, 7, 30), source: "breast", side: "left", minutes: 15 },
  { id: "s1", kind: "sleep", at: at(6, 20), endAt: at(7, 6) },
  { id: "f0", kind: "feed", at: at(7, 2), source: "bottle", ml: 90 },
  { id: "fx", kind: "feed", at: at(6, 19), source: "bottle", ml: 90 },
];

describe("eventsInWindow (last 24 h)", () => {
  it("at noon includes last night and the 2 AM feed, not yesterday's 11 AM feed", () => {
    const now = at(7, 12);
    const all: LogEvent[] = [...events, { id: "old", kind: "feed", at: at(6, 11), source: "bottle" }];
    expect(eventsInWindow(all, now).map((e) => e.id)).toEqual(["f2", "d1", "n1", "f1", "s1", "f0", "fx"]);
  });
  it("at 8 AM still shows the night that ended at 6", () => {
    expect(eventsInWindow(events, at(7, 8)).map((e) => e.id)).toContain("s1");
  });
  it("includes an event logged a few seconds after `now` was sampled", () => {
    const now = at(7, 12);
    const fresh: LogEvent[] = [{ id: "f", kind: "feed", at: now + 20_000, source: "bottle" }];
    expect(eventsInWindow(fresh, now)).toHaveLength(1);
    expect(windowStats(fresh, now).feeds).toBe(1);
  });
  it("includes a rest that started before the window but is still open", () => {
    expect(eventsInWindow([{ id: "s", kind: "sleep", at: at(5, 20) }], at(7, 8)).map((e) => e.id)).toEqual(["s"]);
  });
});

describe("windowStats", () => {
  it("counts feeds, ml, breast minutes and diapers in the window", () => {
    const s = windowStats(events, day);
    expect(s.feeds).toBe(4);
    expect(s.ml).toBe(300);
    expect(s.breastMins).toBe(15);
    expect(s.diapers).toBe(1);
    expect(s.wet).toBe(1);
    expect(s.dirty).toBe(1);
    expect(s.lastFeed?.id).toBe("f2");
  });
  it("splits night sleep from naps and clips to the window", () => {
    const s = windowStats(events, day);
    expect(s.napMins).toBe(90);
    expect(s.nightMins).toBe(10 * 60); // 20:00–06:00 fully inside noon-to-noon
    const later = windowStats(events, at(7, 23));
    expect(later.nightMins).toBe(7 * 60); // clipped at 23:00 yesterday
  });
  it("counts an open rest up to now", () => {
    const s = windowStats([{ id: "x", kind: "nap", at: at(7, 11) }], at(7, 11, 40));
    expect(s.napMins).toBe(40);
  });
});

describe("groupNights", () => {
  it("collapses sleeps separated only by feeds into one night with wakings", () => {
    const night: LogEvent[] = [
      { id: "s3", kind: "sleep", at: at(7, 4, 10) },
      { id: "f2", kind: "feed", at: at(7, 4), source: "breast" },
      { id: "s2", kind: "sleep", at: at(7, 1, 30), endAt: at(7, 4) },
      { id: "d1", kind: "diaper", at: at(7, 1, 20), wet: true, dirty: false },
      { id: "t1", kind: "temperature", at: at(7, 1, 10), celsius: 37.2 },
      { id: "f1", kind: "feed", at: at(7, 1), source: "breast" },
      { id: "s1", kind: "sleep", at: at(6, 20), endAt: at(7, 1) },
      { id: "n0", kind: "nap", at: at(6, 15), endAt: at(6, 16) },
    ];
    const items = groupNights(night);
    expect(items).toHaveLength(2);
    const n = items[0]!;
    expect(n.type).toBe("night");
    if (n.type !== "night") return;
    expect(n.parts.map((p) => p.id)).toEqual(["s3", "s2", "s1"]);
    expect(n.inside.map((p) => p.id)).toEqual(["f2", "d1", "t1", "f1"]);
    expect(n.wakings).toBe(2);
    expect(n.open).toBe(true);
    expect(n.at).toBe(at(6, 20));
    expect(items[1]).toMatchObject({ type: "event", event: { id: "n0" } });
  });
  it("leaves a lone sleep as a plain event", () => {
    const items = groupNights([{ id: "s1", kind: "sleep", at: at(6, 20), endAt: at(7, 6) }]);
    expect(items[0]?.type).toBe("event");
  });
  it("does not swallow a nap or trailing feeds", () => {
    const items = groupNights([
      { id: "f3", kind: "feed", at: at(7, 7), source: "bottle" },
      { id: "s2", kind: "sleep", at: at(7, 1), endAt: at(7, 6) },
      { id: "f1", kind: "feed", at: at(7, 0, 50), source: "bottle" },
      { id: "s1", kind: "sleep", at: at(6, 20), endAt: at(7, 0, 50) },
    ]);
    expect(items.map((i) => i.type)).toEqual(["event", "night"]);
  });
});

describe("calendar days", () => {
  const dayStart = new Date(2026, 8, 7, 0, 0).getTime();
  const next = new Date(2026, 8, 8, 0, 0).getTime();
  it("eventsInRange keeps the overnight sleep and drops the 2 AM feed of the next day", () => {
    const ids = eventsInRange(events, dayStart, next, next).map((e) => e.id);
    expect(ids).toContain("s1");
    expect(ids).toContain("f0");
    expect(ids).not.toContain("fx");
  });
  it("rangeStats clips the overnight sleep to the day", () => {
    const s = rangeStats(events, dayStart, next, next);
    expect(s.nightMins).toBe(6 * 60);
    expect(s.feeds).toBe(3);
  });
  it("daySeries returns one entry per day, oldest first", () => {
    const series = daySeries(events, at(7, 12), 3, next);
    expect(series.map((d) => new Date(d.day).getDate())).toEqual([5, 6, 7]);
    expect(series[1]!.stats.nightMins).toBe(4 * 60); // 20:00–24:00 on the 6th
    expect(series[2]!.stats.napMins).toBe(90);
  });
});
