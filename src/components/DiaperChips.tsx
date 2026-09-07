import { useT } from "@/i18n/index";
import { Chip } from "./Chip";

export function DiaperChips({ wet, dirty, onChange }: { wet: boolean; dirty: boolean; onChange: (v: { wet: boolean; dirty: boolean }) => void }) {
  const { t } = useT();
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  return (
    <div className="grid grid-cols-3 gap-2">
      <Chip active={wet && !dirty} onClick={() => onChange({ wet: true, dirty: false })}>
        {cap(t.detail.wet)}
      </Chip>
      <Chip active={dirty && !wet} onClick={() => onChange({ wet: false, dirty: true })}>
        {cap(t.detail.dirty)}
      </Chip>
      <Chip active={wet && dirty} onClick={() => onChange({ wet: true, dirty: true })}>
        {cap(t.detail.both)}
      </Chip>
    </div>
  );
}
