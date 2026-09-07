import { describe, it, expect } from "vitest";
import { feedIntervalMs, suggestNext, wakeWindowMs } from "./suggest";
import type { LogEvent } from "./events";

const MIN = 60_000;
const noon = new Date(2026, 8, 7, 12, 0).getTime();
const night = new Date(2026, 8, 7, 22, 0).getTime();
const m = (base: number, n: number) => base + n * MIN;

describe("suggestNext", () => {
  it("suggests nothing while asleep", () => {
    expect(suggestNext([{ id: "s", kind: "sleep", at: m(noon, -300) }], { name: "asleep", since: m(noon, -300), eventId: "s" }, noon)).toBeNull();
  });
  it("suggests nothing when nothing is due", () => {
    const events: LogEvent[] = [{ id: "f", kind: "feed", at: m(noon, -20), source: "bottle" }];
    expect(suggestNext(events, { name: "awake", since: m(noon, -10) }, noon)).toBeNull();
  });
  it("suggests the last feed type when the usual interval is nearly up", () => {
    const events: LogEvent[] = [
      { id: "f3", kind: "feed", at: m(noon, -140), source: "bottle" },
      { id: "f2", kind: "feed", at: m(noon, -290), source: "breast" },
      { id: "f1", kind: "feed", at: m(noon, -440), source: "breast" },
    ];
    const s = suggestNext(events, { name: "awake", since: m(noon, -30) }, noon);
    expect(s).toMatchObject({ type: "feed", source: "bottle" });
    expect(s?.reason).toBe("last feed 2h 20m ago");
  });
  it("suggests a nap by day and a sleep at night when the wake window is used up", () => {
    const dayS = suggestNext([], { name: "awake", since: m(noon, -70) }, noon);
    expect(dayS).toMatchObject({ type: "rest", kind: "nap" });
    const nightS = suggestNext([], { name: "awake", since: m(night, -70) }, night);
    expect(nightS).toMatchObject({ type: "rest", kind: "sleep" });
  });
  it("uses the age-based wake window", () => {
    expect(wakeWindowMs(10)).toBe(60 * MIN);
    expect(wakeWindowMs(200)).toBe(150 * MIN);
    expect(wakeWindowMs(undefined)).toBe(75 * MIN);
    // a 6-month-old awake for 70 min is not due yet
    const dob = noon - 200 * 24 * 60 * MIN;
    expect(suggestNext([], { name: "awake", since: m(noon, -70) }, noon, dob)).toBeNull();
  });
  it("feed interval is the clamped median of recent gaps", () => {
    const evenly: LogEvent[] = [0, 120, 240, 360].map((n, i) => ({ id: `f${i}`, kind: "feed", at: m(noon, -n), source: "bottle" }));
    expect(feedIntervalMs(evenly)).toBe(120 * MIN);
    expect(feedIntervalMs([])).toBe(150 * MIN);
    const tight: LogEvent[] = [0, 30, 60, 90].map((n, i) => ({ id: `f${i}`, kind: "feed", at: m(noon, -n), source: "bottle" }));
    expect(feedIntervalMs(tight)).toBe(90 * MIN);
  });
});
