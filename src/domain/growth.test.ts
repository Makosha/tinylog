import { describe, it, expect } from "vitest";
import { assess, lmsAt, normalCdf, percentileCurve, valueAtZ, zscore, zToPercentile } from "./growth";

const DAY = 86_400_000;

describe("WHO growth", () => {
  it("matches the published SD columns at birth for boys' weight", () => {
    const lms = lmsAt("weight", "boy", 0)!;
    expect(lms[1]).toBeCloseTo(3.3464, 3); // median
    expect(valueAtZ(2, lms)).toBeCloseTo(4.419, 2); // SD2 column
    expect(valueAtZ(-2, lms)).toBeCloseTo(2.459, 2); // SD2neg column
    expect(zscore(4.419, lms)).toBeCloseTo(2, 2);
  });
  it("matches the day-30 boys' weight row when interpolating inside a week", () => {
    // day 30 = week 4 + 2 days; WHO median at day 30 is 4.4525
    const lms = lmsAt("weight", "boy", 30)!;
    expect(lms[1]).toBeCloseTo(4.4525, 1);
  });
  it("normal CDF is symmetric and hits the known points", () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 6);
    expect(normalCdf(1.0364)).toBeCloseTo(0.85, 3);
    expect(normalCdf(-1.8808)).toBeCloseTo(0.03, 3);
    expect(zToPercentile(0)).toBe(50);
  });
  it("assesses a measurement against sex and birth date", () => {
    const dob = Date.UTC(2026, 8, 1);
    const a = assess("weight", "girl", dob, { id: "m", at: dob + 14 * DAY, weightKg: 3.8 });
    expect(a).not.toBeNull();
    expect(a!.percentile).toBeGreaterThan(30);
    expect(a!.percentile).toBeLessThan(80);
    expect(assess("length", "girl", dob, { id: "m", at: dob, weightKg: 3.8 })).toBeNull();
  });
  it("percentile curves are ordered and weekly", () => {
    const p3 = percentileCurve("length", "boy", 3, 60);
    const p97 = percentileCurve("length", "boy", 97, 60);
    expect(p3).toHaveLength(10);
    expect(p3[0]!.days).toBe(0);
    for (let i = 0; i < p3.length; i++) expect(p97[i]!.value).toBeGreaterThan(p3[i]!.value);
  });
});
