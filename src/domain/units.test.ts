import { describe, it, expect } from "vitest";
import { METRIC, US, formatLength, formatTemp, formatVolume, formatWeight, unitsForLocale, volumeScale, tempScale } from "./units";

describe("units", () => {
  it("picks US units only for US-style locales", () => {
    expect(unitsForLocale("en-US")).toEqual(US);
    expect(unitsForLocale("en-GB")).toEqual(METRIC);
    expect(unitsForLocale("ru-KZ")).toEqual(METRIC);
  });
  it("formats in both systems", () => {
    expect(formatTemp(38, METRIC)).toBe("38.0°C");
    expect(formatTemp(38, US)).toBe("100.4°F");
    expect(formatVolume(120, METRIC)).toBe("120ml");
    expect(formatVolume(120, US)).toBe("4.1 oz");
    expect(formatWeight(3.8, METRIC)).toBe("3.80 kg");
    expect(formatWeight(3.8, US)).toBe("8 lb 6 oz");
    expect(formatLength(53, METRIC)).toBe("53.0 cm");
    expect(formatLength(53, US)).toBe("20.87 in");
  });
  it("oz presets and steps round-trip through ml", () => {
    const v = volumeScale(US);
    expect(v.to(v.presets[2]!)).toBeCloseTo(4, 6);
    expect(v.to(v.step)).toBeCloseTo(0.5, 6);
    expect(tempScale(US).to(tempScale(US).from(100.4))).toBeCloseTo(100.4, 6);
  });
});
