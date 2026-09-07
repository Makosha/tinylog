import { Chip } from "./Chip";
import { Stepper } from "./Stepper";

export const ML_PRESETS = [60, 90, 120, 150, 180];

export function MlChips({ value, onChange }: { value: number | undefined; onChange: (ml: number | undefined) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-5 gap-2">
        {ML_PRESETS.map((ml) => (
          <Chip key={ml} active={value === ml} onClick={() => onChange(value === ml ? undefined : ml)}>
            {ml}
          </Chip>
        ))}
      </div>
      <Stepper
        value={value !== undefined ? `${value}` : "–"}
        unit="ml"
        minusLabel="10 ml less"
        plusLabel="10 ml more"
        onStep={(d) => onChange(Math.max(0, (value ?? 90) + d * 10) || undefined)}
      />
    </div>
  );
}
