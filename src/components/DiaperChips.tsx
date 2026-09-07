import { Chip } from "./Chip";

export function DiaperChips({ wet, dirty, onChange }: { wet: boolean; dirty: boolean; onChange: (v: { wet: boolean; dirty: boolean }) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <Chip active={wet && !dirty} onClick={() => onChange({ wet: true, dirty: false })}>
        Wet
      </Chip>
      <Chip active={dirty && !wet} onClick={() => onChange({ wet: false, dirty: true })}>
        Dirty
      </Chip>
      <Chip active={wet && dirty} onClick={() => onChange({ wet: true, dirty: true })}>
        Both
      </Chip>
    </div>
  );
}
