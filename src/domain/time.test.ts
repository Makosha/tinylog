import { describe, it, expect } from "vitest";
import { durationLabel, resolveTimeOfDay, isSameDay, stepSnapped, ageLabel } from "./time";

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

describe("stepSnapped", () => {
  const at = (h: number, m: number) => new Date(2026, 8, 7, h, m).getTime();
  const hm = (ms: number) => [new Date(ms).getHours(), new Date(ms).getMinutes()];
  it("−5 from an unaligned time snaps down to the previous mark", () => {
    expect(hm(stepSnapped(at(1, 44), -5))).toEqual([1, 40]);
  });
  it("+5 from an unaligned time snaps up to the next mark", () => {
    expect(hm(stepSnapped(at(1, 44), 5))).toEqual([1, 45]);
  });
  it("moves a full step when already aligned", () => {
    expect(hm(stepSnapped(at(1, 40), -5))).toEqual([1, 35]);
    expect(hm(stepSnapped(at(1, 40), 5))).toEqual([1, 45]);
  });
  it("−1h and +1h land on the grid too", () => {
    expect(hm(stepSnapped(at(1, 44), -60))).toEqual([0, 45]);
    expect(hm(stepSnapped(at(1, 44), 60))).toEqual([2, 40]);
  });
  it("keeps seconds at zero", () => {
    expect(new Date(stepSnapped(at(1, 44) + 37_000, -5)).getSeconds()).toBe(0);
  });
});

describe("ageLabel", () => {
  const born = new Date(2026, 8, 2).getTime();
  it("counts days then weeks", () => {
    expect(ageLabel(born, new Date(2026, 8, 2, 15).getTime())).toBe("day 1");
    expect(ageLabel(born, new Date(2026, 8, 7).getTime())).toBe("day 6");
    expect(ageLabel(born, new Date(2026, 9, 10).getTime())).toBe("5 weeks");
  });
});
