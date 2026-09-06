import { describe, it, expect } from "vitest";
import { durationLabel, resolveTimeOfDay, isSameDay } from "./time";

describe("durationLabel", () => {
  it("formats minutes and hours", () => {
    expect(durationLabel(0, 5 * 60_000)).toBe("5m");
    expect(durationLabel(0, 130 * 60_000)).toBe("2h 10m");
    expect(durationLabel(0, 0)).toBe("0m");
  });
  it("never goes negative", () => {
    expect(durationLabel(60_000, 0)).toBe("0m");
  });
});

describe("resolveTimeOfDay", () => {
  const now = new Date(2026, 8, 7, 14, 0).getTime(); // local 14:00
  it("keeps the event's date when the time is in the past", () => {
    const base = new Date(2026, 8, 7, 9, 0).getTime();
    const out = resolveTimeOfDay(base, "10:30", now);
    expect(new Date(out).getHours()).toBe(10);
    expect(new Date(out).getMinutes()).toBe(30);
    expect(isSameDay(out, base)).toBe(true);
  });
  it("moves to the previous day when the result would be in the future", () => {
    const base = new Date(2026, 8, 7, 9, 0).getTime();
    const out = resolveTimeOfDay(base, "16:00", now);
    expect(new Date(out).getDate()).toBe(6);
    expect(new Date(out).getHours()).toBe(16);
  });
  it("keeps a past date even if the time is later than now", () => {
    const base = new Date(2026, 8, 5, 9, 0).getTime();
    const out = resolveTimeOfDay(base, "23:00", now);
    expect(new Date(out).getDate()).toBe(5);
  });
});
