import { useMemo, useState } from "react";
import {
  CHART_PERCENTILES,
  MEASURE_META,
  ageDays,
  assess,
  percentileCurve,
  type Measure,
  type Measurement,
  type Sex,
} from "@/domain/growth";

const W = 360;
const H = 240;
const PAD = { top: 12, right: 34, bottom: 28, left: 34 };
const MONTH = 30.4375;

/**
 * WHO percentile curves (3, 15, 50, 85, 97) as muted reference lines with a
 * shaded 3–97 band, the baby's measurements on top in the accent colour.
 * Tap a point for its value and percentile.
 */
export function GrowthChart({
  measure,
  sex,
  dobMs,
  measurements,
  now,
}: {
  measure: Measure;
  sex: Sex;
  dobMs: number;
  measurements: Measurement[];
  now: number;
}) {
  const meta = MEASURE_META[measure];
  const [active, setActive] = useState<string | null>(null);

  const points = useMemo(
    () =>
      measurements
        .filter((m) => typeof m[meta.key] === "number" && m.at >= dobMs)
        .map((m) => ({ id: m.id, days: ageDays(dobMs, m.at), value: m[meta.key] as number, at: m.at, a: assess(measure, sex, dobMs, m) }))
        .sort((a, b) => a.days - b.days),
    [measurements, dobMs, measure, sex, meta.key],
  );

  const maxDays = Math.max(8 * 7, ageDays(dobMs, now) + 28, ...points.map((p) => p.days + 14));
  const curves = useMemo(
    () => CHART_PERCENTILES.map((p) => ({ p, pts: percentileCurve(measure, sex, p, maxDays) })),
    [measure, sex, maxDays],
  );
  const lo = curves[0]!.pts;
  const hi = curves[curves.length - 1]!.pts;
  const yMin = Math.min(lo[0]!.value, ...points.map((p) => p.value)) * 0.95;
  const yMax = Math.max(hi[hi.length - 1]!.value, ...points.map((p) => p.value)) * 1.04;
  const xDays = lo[lo.length - 1]!.days;

  const x = (d: number) => PAD.left + (d / xDays) * (W - PAD.left - PAD.right);
  const y = (v: number) => PAD.top + (1 - (v - yMin) / (yMax - yMin)) * (H - PAD.top - PAD.bottom);
  const path = (pts: { days: number; value: number }[]) => pts.map((p, i) => `${i ? "L" : "M"}${x(p.days).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");

  // x ticks: weeks under 3 months, months after
  const ticks: { d: number; label: string }[] = [];
  if (xDays <= 13 * 7) for (let w = 0; w * 7 <= xDays; w += 2) ticks.push({ d: w * 7, label: w ? `${w}w` : "birth" });
  else for (let m = 0; m * MONTH <= xDays; m += xDays > 12 * MONTH ? 3 : 1) ticks.push({ d: m * MONTH, label: m ? `${m}m` : "birth" });
  const yTicks = niceTicks(yMin, yMax, 5);
  const band = `${path(hi)} ${[...lo].reverse().map((p) => `L${x(p.days).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ")} Z`;
  const activePt = points.find((p) => p.id === active);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label={`${meta.label} against WHO percentiles`}>
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="stroke-border" strokeWidth="1" />
            <text x={PAD.left - 6} y={y(t) + 3} textAnchor="end" className="fill-muted-foreground" fontSize="9">
              {t}
            </text>
          </g>
        ))}
        {ticks.map((t) => (
          <text key={t.d} x={x(t.d)} y={H - PAD.bottom + 14} textAnchor="middle" className="fill-muted-foreground" fontSize="9">
            {t.label}
          </text>
        ))}
        <path d={band} className="fill-foreground/6" />
        {curves.map(({ p, pts }) => (
          <g key={p}>
            <path d={path(pts)} fill="none" className={p === 50 ? "stroke-muted-foreground" : "stroke-border"} strokeWidth={p === 50 ? 1.5 : 1} strokeDasharray={p === 50 ? undefined : "3 3"} />
            <text x={W - PAD.right + 4} y={y(pts[pts.length - 1]!.value) + 3} className="fill-muted-foreground" fontSize="9">
              {p}
            </text>
          </g>
        ))}
        {points.length > 1 ? <path d={path(points)} fill="none" className="stroke-primary" strokeWidth="2" strokeLinejoin="round" /> : null}
        {points.map((p) => (
          <g key={p.id} onClick={() => setActive(active === p.id ? null : p.id)} className="cursor-pointer">
            <circle cx={x(p.days)} cy={y(p.value)} r="14" fill="transparent" />
            <circle cx={x(p.days)} cy={y(p.value)} r={active === p.id ? 6 : 4.5} className="fill-primary stroke-card" strokeWidth="2" />
          </g>
        ))}
        <text x={W - PAD.right + 4} y={PAD.top + 2} className="fill-muted-foreground" fontSize="8">
          %
        </text>
      </svg>
      {activePt ? (
        <div className="absolute left-1/2 top-2 -translate-x-1/2 rounded-xl bg-card px-3 py-1.5 text-xs shadow-lg ring-1 ring-border">
          <span className="font-bold text-foreground">
            {activePt.value.toFixed(meta.decimals)} {meta.unit}
          </span>
          <span className="text-muted-foreground">
            {" "}
            · {new Date(activePt.at).toLocaleDateString([], { month: "short", day: "numeric" })}
            {activePt.a ? ` · ${ordinal(activePt.a.percentile)} percentile` : ""}
          </span>
        </div>
      ) : null}
    </div>
  );
}

export function ordinal(n: number) {
  if (n < 1) return "<1st";
  if (n > 99) return ">99th";
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

function niceTicks(min: number, max: number, count: number) {
  const raw = (max - min) / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const out: number[] = [];
  for (let t = Math.ceil(min / step) * step; t <= max; t += step) out.push(Number(t.toFixed(3)));
  return out;
}
