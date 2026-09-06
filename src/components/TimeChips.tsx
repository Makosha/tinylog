import { Clock } from "lucide-react";
import { Chip } from "./Chip";
import { resolveTimeOfDay, toTimeInput } from "@/domain/time";

const MIN = 60_000;
const OFFSETS = [0, 5, 15, 30];

/**
 * "now / −5m / −15m / −30m / 🕒" relative to `base` (the moment the button was tapped).
 */
export function TimeChips({ base, value, onChange }: { base: number; value: number; onChange: (ms: number) => void }) {
  const offsetMin = Math.round((base - value) / MIN);
  const preset = OFFSETS.includes(offsetMin);
  return (
    <div className="-mx-1 flex min-w-0 flex-1 items-center gap-2 overflow-x-auto px-1 py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {OFFSETS.map((o) => (
        <Chip key={o} active={preset && offsetMin === o} onClick={() => onChange(base - o * MIN)}>
          {o === 0 ? "now" : `−${o}m`}
        </Chip>
      ))}
      <label
        className={`relative flex h-10 shrink-0 items-center gap-1 rounded-full border px-3 text-sm font-semibold ${
          preset ? "border-border bg-secondary/60 text-muted-foreground" : "border-primary bg-primary/15 text-primary"
        }`}
      >
        <Clock className="size-4" />
        {preset ? "pick" : toTimeInput(value)}
        <input
          type="time"
          aria-label="Pick a time"
          value={toTimeInput(value)}
          onChange={(e) => e.target.value && onChange(resolveTimeOfDay(value, e.target.value))}
          className="absolute inset-0 opacity-0"
        />
      </label>
    </div>
  );
}
