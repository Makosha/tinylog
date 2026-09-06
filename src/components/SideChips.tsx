import type { BreastSide } from "@/domain/events";
import { Chip } from "./Chip";

const SIDES: { key: BreastSide; label: string }[] = [
  { key: "left", label: "Left" },
  { key: "right", label: "Right" },
  { key: "both", label: "Both" },
];

export function SideChips({ value, onChange }: { value: BreastSide | undefined; onChange: (s: BreastSide | undefined) => void }) {
  return (
    <div className="flex gap-2">
      {SIDES.map((s) => (
        <Chip key={s.key} active={value === s.key} onClick={() => onChange(value === s.key ? undefined : s.key)}>
          {s.label}
        </Chip>
      ))}
    </div>
  );
}
