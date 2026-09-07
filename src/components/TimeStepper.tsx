import { stepSnapped } from "@/domain/time";
import { useT } from "@/i18n/index";
import { agoLabel, fmtTime } from "@/i18n/labels";
import { HoldButton } from "./Stepper";

const MIN = 60_000;

/**
 * Time adjuster: −1h / −5 / [time] / +5 / +1h. Hold to repeat.
 */
export function TimeStepper({ value, onChange, max = Date.now(), min }: { value: number; onChange: (ms: number) => void; max?: number; min?: number }) {
  const { t, locale } = useT();
  const set = (ms: number) => onChange(Math.max(min ?? -Infinity, Math.min(max, ms)));
  const step = (mins: number) => set(stepSnapped(value, mins));
  const isNow = Math.abs(max - value) < MIN;
  const atMin = min !== undefined && value <= min;
  const btn = "rounded-2xl border border-border bg-secondary/60";
  return (
    <div className="flex items-center gap-1.5">
      <HoldButton label={t.steps.minus1h} onFire={() => step(-60)} disabled={atMin} className={btn}>
        {t.steps.minus1h}
      </HoldButton>
      <HoldButton label={t.steps.minus5} onFire={() => step(-5)} disabled={atMin} className={btn}>
        {t.steps.minus5}
      </HoldButton>
      <div className="flex h-12 min-w-24 flex-1 flex-col items-center justify-center rounded-2xl border border-border bg-secondary/60 tabular-nums">
        <span className="font-display text-lg font-bold leading-none text-foreground">{fmtTime(locale, value)}</span>
        <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{isNow ? t.time.now : agoLabel(t, max - value)}</span>
      </div>
      <HoldButton label={t.steps.plus5} onFire={() => step(5)} disabled={isNow} className={btn}>
        {t.steps.plus5}
      </HoldButton>
      <HoldButton label={t.steps.plus1h} onFire={() => step(60)} disabled={max - value < 60 * MIN} className={btn}>
        {t.steps.plus1h}
      </HoldButton>
    </div>
  );
}
