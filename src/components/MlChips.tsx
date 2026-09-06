import { Chip } from "./Chip";
import { MinusIcon, PlusIcon } from "./icons";

export const ML_PRESETS = [60, 90, 120, 150, 180];

export function MlChips({
  value,
  hint,
  onChange,
}: {
  value: number | undefined;
  /** last-used amount for this source; highlighted when nothing is set */
  hint?: number;
  onChange: (ml: number | undefined) => void;
}) {
  const step = (d: number) => onChange(Math.max(0, (value ?? hint ?? 90) + d) || undefined);
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-5 gap-2">
        {ML_PRESETS.map((ml) => (
          <Chip key={ml} active={value === ml} onClick={() => onChange(value === ml ? undefined : ml)}>
            <span className={value === undefined && hint === ml ? "underline decoration-dotted underline-offset-4" : ""}>{ml}</span>
          </Chip>
        ))}
      </div>
      <div className="flex w-full items-center justify-between rounded-2xl border border-border bg-secondary/60">
        <button type="button" aria-label="10 ml less" onClick={() => step(-10)} className="flex h-11 w-10 items-center justify-center active:scale-95">
          <MinusIcon className="size-4" />
        </button>
        <span className="flex-1 text-center font-display text-base font-bold tabular-nums text-foreground">
          {value !== undefined ? `${value}` : "–"}
          <span className="ml-0.5 text-[10px] text-muted-foreground">ml</span>
        </span>
        <button type="button" aria-label="10 ml more" onClick={() => step(10)} className="flex h-11 w-10 items-center justify-center active:scale-95">
          <PlusIcon className="size-4" />
        </button>
      </div>
    </div>
  );
}
