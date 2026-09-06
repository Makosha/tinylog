import { useState } from "react";
import { Chip } from "./Chip";

export const ML_PRESETS = [30, 60, 90, 120, 150, 180, 210, 240];

export function MlChips({
  value,
  hint,
  onChange,
}: {
  value: number | undefined;
  /** last-used amount, shown as a dashed hint when nothing is set */
  hint?: number;
  onChange: (ml: number | undefined) => void;
}) {
  const [other, setOther] = useState(value !== undefined && !ML_PRESETS.includes(value));
  return (
    <div className="-mx-1 flex min-w-0 flex-1 items-center gap-2 overflow-x-auto px-1 py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {ML_PRESETS.map((ml) => (
        <Chip key={ml} active={value === ml} onClick={() => onChange(value === ml ? undefined : ml)}>
          <span className={value === undefined && hint === ml ? "underline decoration-dotted underline-offset-4" : ""}>{ml}</span>
        </Chip>
      ))}
      {other ? (
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={999}
          autoFocus
          placeholder="ml"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? undefined : Math.max(0, parseInt(e.target.value, 10) || 0))}
          className="h-10 w-20 shrink-0 rounded-full border border-primary bg-secondary/60 px-3 text-center text-sm font-semibold text-foreground outline-none"
        />
      ) : (
        <Chip onClick={() => setOther(true)}>other</Chip>
      )}
    </div>
  );
}
