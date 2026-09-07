import { Chip } from "./Chip";
import { Stepper } from "./Stepper";

export const MIN_PRESETS = [5, 10, 15, 20, 30];

export function MinutesChips({ value, onChange }: { value: number | undefined; onChange: (m: number | undefined) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-5 gap-2">
        {MIN_PRESETS.map((m) => (
          <Chip key={m} active={value === m} onClick={() => onChange(value === m ? undefined : m)}>
            {m}
          </Chip>
        ))}
      </div>
      <Stepper
        value={value !== undefined ? `${value}` : "–"}
        unit="min"
        minusLabel="5 minutes less"
        plusLabel="5 minutes more"
        onStep={(d) => onChange(Math.max(0, (value ?? 10) + d * 5) || undefined)}
      />
    </div>
  );
}
