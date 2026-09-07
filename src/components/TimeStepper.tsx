import { formatTime, stepSnapped } from "@/domain/time";
import { HoldButton } from "./Stepper";

const MIN = 60_000;

/**
 * Time adjuster: −1h / −5 / [time] / +5 / +1h. Hold to repeat. A small
 * "now" chip appears once the value differs from `max`.
 */
export function TimeStepper({
  value,
  onChange,
  max = Date.now(),
  min,
}: {
  value: number;
  onChange: (ms: number) => void;
  max?: number;
  min?: number;
}) {
  const set = (ms: number) => onChange(Math.max(min ?? -Infinity, Math.min(max, ms)));
  const step = (mins: number) => set(stepSnapped(value, mins));
  const isNow = Math.abs(max - value) < MIN;
  const atMin = min !== undefined && value <= min;
  const btn = "rounded-2xl border border-border bg-secondary/60";
  return (
    <div className="flex items-center gap-1.5">
      <HoldButton label="−1h" onFire={() => step(-60)} disabled={atMin} className={btn}>
        −1h
      </HoldButton>
      <HoldButton label="−5m" onFire={() => step(-5)} disabled={atMin} className={btn}>
        −5
      </HoldButton>
      <div className="flex h-12 min-w-24 flex-1 flex-col items-center justify-center rounded-2xl border border-border bg-secondary/60 tabular-nums">
        <span className="font-display text-lg font-bold leading-none text-foreground">{formatTime(value)}</span>
        <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{isNow ? "now" : ago(max - value)}</span>
      </div>
      <HoldButton label="+5m" onFire={() => step(5)} disabled={isNow} className={btn}>
        +5
      </HoldButton>
      <HoldButton label="+1h" onFire={() => step(60)} disabled={max - value < 60 * MIN} className={btn}>
        +1h
      </HoldButton>
    </div>
  );
}

function ago(ms: number) {
  const m = Math.round(ms / MIN);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h}h ${r}m ago` : `${h}h ago`;
}
