import { formatTime, stepSnapped } from "@/domain/time";

const MIN = 60_000;

/**
 * Time adjuster without native inputs: big time, ±5m and ±1h around it,
 * and a "now" reset. `max` (default: now) caps the value.
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
  return (
    <div className="flex items-center gap-1.5">
      <StepBtn label="−1h" onClick={() => step(-60)}>
        −1h
      </StepBtn>
      <StepBtn label="−5m" onClick={() => step(-5)}>
        −5
      </StepBtn>
      <button
        type="button"
        onClick={() => set(max)}
        title="Reset to now"
        className={`flex h-12 min-w-24 flex-1 flex-col items-center justify-center rounded-2xl border tabular-nums transition-colors ${
          isNow ? "border-border bg-secondary/60" : "border-primary/50 bg-primary/10"
        }`}
      >
        <span className="font-display text-lg font-bold leading-none text-foreground">{formatTime(value)}</span>
        <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {isNow ? "now" : ago(max - value)}
        </span>
      </button>
      <StepBtn label="+5m" onClick={() => step(5)} disabled={isNow}>
        +5
      </StepBtn>
      <StepBtn label="+1h" onClick={() => step(60)} disabled={max - value < 60 * MIN}>
        +1h
      </StepBtn>
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

function StepBtn({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex h-12 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-secondary/60 text-sm font-bold tabular-nums text-foreground active:scale-95 disabled:opacity-30"
    >
      {children}
    </button>
  );
}
