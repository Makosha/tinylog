import type { BreastSide } from "@/domain/events";
import { useT } from "@/i18n/index";
import { Chip } from "./Chip";

const SIDES: BreastSide[] = ["left", "right", "both"];

export function SideChips({ value, onChange }: { value: BreastSide | undefined; onChange: (s: BreastSide | undefined) => void }) {
  const { t } = useT();
  return (
    <div className="grid grid-cols-3 gap-2">
      {SIDES.map((s) => (
        <Chip key={s} active={value === s} onClick={() => onChange(value === s ? undefined : s)}>
          {t.detail[s].charAt(0).toUpperCase() + t.detail[s].slice(1)}
        </Chip>
      ))}
    </div>
  );
}
