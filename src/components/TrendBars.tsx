import { useState } from "react";
import type { DaySeries } from "@/domain/stats";
import { isSameDay } from "@/domain/time";
import { useT } from "@/i18n/index";

/**
 * Seven single-hue bars, one per day. The selected day is labelled; other
 * values show on tap/hover. Bars keep a 2px surface gap and a 4px rounded top.
 */
export function TrendBars({
  series,
  selected,
  value,
  format,
  tone,
  onSelect,
}: {
  series: DaySeries[];
  selected: number;
  value: (s: DaySeries) => number;
  format: (v: number) => string;
  /** Tailwind bg class for the bars */
  tone: string;
  onSelect: (day: number) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const { t, locale } = useT();
  const max = Math.max(1, ...series.map(value));
  return (
    <div className="flex h-32 items-end gap-0.5" role="img" aria-label={t.history.sevenDayTrend}>
      {series.map((d) => {
        const v = value(d);
        const isSel = isSameDay(d.day, selected);
        const show = isSel || hover === d.day;
        return (
          <button
            key={d.day}
            type="button"
            onClick={() => onSelect(d.day)}
            onPointerEnter={() => setHover(d.day)}
            onPointerLeave={() => setHover(null)}
            aria-label={`${new Date(d.day).toLocaleDateString(locale, { weekday: "long" })}: ${format(v)}`}
            className="flex h-full flex-1 flex-col items-center justify-end gap-1 rounded-lg active:bg-secondary/40"
          >
            <span className={`text-[10px] font-semibold tabular-nums text-foreground ${show ? "" : "invisible"}`}>{format(v)}</span>
            <span
              className={`w-full rounded-t ${tone} ${isSel ? "" : "opacity-45"}`}
              style={{ height: `${Math.max(3, (v / max) * 100)}%` }}
            />
            <span className={`text-[11px] ${isSel ? "font-bold text-primary" : "text-muted-foreground"}`}>
              {new Date(d.day).toLocaleDateString(locale, { weekday: "narrow" })}
            </span>
          </button>
        );
      })}
    </div>
  );
}
