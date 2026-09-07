export interface Units {
  temp: "c" | "f";
  weight: "kg" | "lb";
  length: "cm" | "in";
  volume: "ml" | "oz";
}

export const METRIC: Units = { temp: "c", weight: "kg", length: "cm", volume: "ml" };
export const US: Units = { temp: "f", weight: "lb", length: "in", volume: "oz" };

/** US and Liberia/Myanmar are the only places that default to these units. */
export const unitsForLocale = (locale: string): Units => (/-(US|LR|MM)$/i.test(locale) ? US : METRIC);

const OZ_ML = 29.5735;
const LB_KG = 0.45359237;
const IN_CM = 2.54;

export const cToF = (c: number) => c * 1.8 + 32;
export const fToC = (f: number) => (f - 32) / 1.8;
export const mlToOz = (ml: number) => ml / OZ_ML;
export const ozToMl = (oz: number) => oz * OZ_ML;
export const kgToLb = (kg: number) => kg / LB_KG;
export const lbToKg = (lb: number) => lb * LB_KG;
export const cmToIn = (cm: number) => cm / IN_CM;
export const inToCm = (i: number) => i * IN_CM;

export function formatTemp(c: number, u: Units) {
  return u.temp === "f" ? `${cToF(c).toFixed(1)}°F` : `${c.toFixed(1)}°C`;
}

export function formatVolume(ml: number, u: Units) {
  return u.volume === "oz" ? `${trim(mlToOz(ml).toFixed(1))} oz` : `${Math.round(ml)}ml`;
}

/** "8 lb 6 oz" or "3.80 kg". */
export function formatWeight(kg: number, u: Units) {
  if (u.weight === "kg") return `${kg.toFixed(2)} kg`;
  const totalOz = Math.round(kgToLb(kg) * 16);
  return `${Math.floor(totalOz / 16)} lb ${totalOz % 16} oz`;
}

export function formatLength(cm: number, u: Units) {
  return u.length === "in" ? `${trim(cmToIn(cm).toFixed(2))} in` : `${cm.toFixed(1)} cm`;
}

/** Display value, unit label and step (in stored units) for a measure. */
export const weightScale = (u: Units) =>
  u.weight === "kg" ? { unit: "kg", to: (kg: number) => kg, from: (v: number) => v, step: 0.05, decimals: 2 } : { unit: "lb", to: kgToLb, from: lbToKg, step: lbToKg(1 / 16), decimals: 2 };
export const lengthScale = (u: Units) =>
  u.length === "cm" ? { unit: "cm", to: (cm: number) => cm, from: (v: number) => v, step: 0.5, decimals: 1 } : { unit: "in", to: cmToIn, from: inToCm, step: inToCm(0.25), decimals: 2 };
export const tempScale = (u: Units) =>
  u.temp === "c" ? { unit: "°C", to: (c: number) => c, from: (v: number) => v, step: 0.1, decimals: 1 } : { unit: "°F", to: cToF, from: fToC, step: fToC(32.2), decimals: 1 };
export const volumeScale = (u: Units) =>
  u.volume === "ml"
    ? { unit: "ml", to: (ml: number) => ml, from: (v: number) => v, step: 10, decimals: 0, presets: [60, 90, 120, 150, 180], start: 90 }
    : { unit: "oz", to: mlToOz, from: ozToMl, step: ozToMl(0.5), decimals: 1, presets: [2, 3, 4, 5, 6].map(ozToMl), start: ozToMl(3) };

const trim = (s: string) => s.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
