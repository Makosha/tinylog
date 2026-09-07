import { WHO_LMS, WHO_WEEKS, type LMS, type Measure, type Sex } from "./who.data";

export type { Measure, Sex };

export interface Measurement {
  id: string;
  /** epoch ms, the day it was taken */
  at: number;
  weightKg?: number;
  lengthCm?: number;
  headCm?: number;
}

export const MEASURE_META: Record<Measure, { label: string; unit: string; key: keyof Measurement; step: number; decimals: number }> = {
  weight: { label: "Weight", unit: "kg", key: "weightKg", step: 0.05, decimals: 2 },
  length: { label: "Length", unit: "cm", key: "lengthCm", step: 0.5, decimals: 1 },
  head: { label: "Head", unit: "cm", key: "headCm", step: 0.5, decimals: 1 },
};

const DAY = 24 * 60 * 60_000;

export const ageDays = (dobMs: number, atMs: number) => Math.max(0, (atMs - dobMs) / DAY);

/** LMS at an age, linearly interpolated between the weekly WHO rows. */
export function lmsAt(measure: Measure, sex: Sex, days: number): LMS | null {
  const rows = WHO_LMS[measure][sex];
  const w = days / 7;
  if (w < 0 || w > WHO_WEEKS) return null;
  const i = Math.floor(w);
  const a = rows[i]!;
  const b = rows[Math.min(i + 1, WHO_WEEKS)]!;
  const t = w - i;
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

export function zscore(x: number, [L, M, S]: LMS) {
  return L === 0 ? Math.log(x / M) / S : (Math.pow(x / M, L) - 1) / (L * S);
}

export function valueAtZ(z: number, [L, M, S]: LMS) {
  return L === 0 ? M * Math.exp(S * z) : M * Math.pow(1 + L * S * z, 1 / L);
}

/** Standard normal CDF (Abramowitz & Stegun 7.1.26), good to ~1e-7. */
export function normalCdf(z: number) {
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const poly = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  const erf = 1 - poly * Math.exp(-x * x);
  return 0.5 * (1 + (z < 0 ? -erf : erf));
}

export const zToPercentile = (z: number) => Math.round(normalCdf(z) * 100);
export const percentileToZ: Record<number, number> = { 3: -1.8808, 15: -1.0364, 50: 0, 85: 1.0364, 97: 1.8808 };
export const CHART_PERCENTILES = [3, 15, 50, 85, 97] as const;

export interface Assessment {
  z: number;
  percentile: number;
}

export function assess(measure: Measure, sex: Sex, dobMs: number, m: Measurement): Assessment | null {
  const x = m[MEASURE_META[measure].key];
  if (typeof x !== "number") return null;
  const lms = lmsAt(measure, sex, ageDays(dobMs, m.at));
  if (!lms) return null;
  const z = zscore(x, lms);
  return { z, percentile: zToPercentile(z) };
}

/** Points of a percentile curve from day 0 to `maxDays`, one per week. */
export function percentileCurve(measure: Measure, sex: Sex, percentile: number, maxDays: number) {
  const z = percentileToZ[percentile] ?? 0;
  const weeks = Math.min(WHO_WEEKS, Math.ceil(maxDays / 7));
  const out: { days: number; value: number }[] = [];
  for (let w = 0; w <= weeks; w++) {
    const lms = WHO_LMS[measure][sex][w]!;
    out.push({ days: w * 7, value: valueAtZ(z, lms) });
  }
  return out;
}

export const sortMeasurements = (list: Measurement[]) => [...list].sort((a, b) => b.at - a.at);

export function parseMeasurements(raw: unknown): Measurement[] | null {
  if (!Array.isArray(raw)) return null;
  const ok = raw.every((m) => m && typeof m.id === "string" && typeof m.at === "number");
  return ok ? sortMeasurements(raw as Measurement[]) : null;
}
