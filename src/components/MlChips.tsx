import { volumeScale } from "@/domain/units";
import { useUnits } from "@/store/store";
import { useT } from "@/i18n/index";
import { Chip } from "./Chip";
import { Stepper } from "./Stepper";

/** Bottle amount. Stored in ml, shown in the preferred unit. */
export function MlChips({ value, onChange }: { value: number | undefined; onChange: (ml: number | undefined) => void }) {
  const v = volumeScale(useUnits());
  const { t } = useT();
  const same = (a: number, b: number) => Math.abs(a - b) < 0.5;
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-5 gap-2">
        {v.presets.map((ml) => (
          <Chip key={ml} active={value !== undefined && same(value, ml)} onClick={() => onChange(value !== undefined && same(value, ml) ? undefined : Math.round(ml))}>
            {v.to(ml).toFixed(v.decimals)}
          </Chip>
        ))}
      </div>
      <Stepper
        value={value !== undefined ? v.to(value).toFixed(v.decimals) : "–"}
        unit={v.unit}
        minusLabel={t.steps.less}
        plusLabel={t.steps.more}
        onStep={(d) => {
          if (value === undefined) {
            if (d > 0) onChange(Math.round(v.start));
            return;
          }
          onChange(Math.max(0, Math.round(value + d * v.step)) || undefined);
        }}
      />
    </div>
  );
}
