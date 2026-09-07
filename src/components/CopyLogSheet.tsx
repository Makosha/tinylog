import { useMemo, useState } from "react";
import { formatLog } from "@/domain/textlog";
import { useStore, useUnits } from "@/store/store";
import { showToast } from "@/store/toast";
import { fill, useT } from "@/i18n/index";
import { Chip } from "./Chip";
import { Field } from "./Field";
import { CopyIcon } from "./icons";
import { Sheet } from "./Sheet";

const RANGES = [1, 3, 7, 14];

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

/** Pick a range, preview the plain-text log, copy it for a chat assistant. */
export function CopyLogSheet({ now, onClose }: { now: number; onClose: () => void }) {
  const { events, measurements, prefs } = useStore();
  const units = useUnits();
  const { t, locale } = useT();
  const [days, setDays] = useState(7);
  const rangeLabel = (d: number) => (d === 1 ? t.copy.oneDay : fill(t.copy.nDays, { n: d }));
  const text = useMemo(
    () => formatLog(events, measurements, { name: prefs.babyName, dobMs: prefs.babyDob, dueMs: prefs.babyDue, sex: prefs.babySex }, days, now, units, t, locale),
    [events, measurements, prefs, days, now, units, t, locale],
  );

  return (
    <Sheet label={t.copy.title} onClose={onClose}>
      <p className="mb-1 font-display text-xl font-bold text-foreground">{t.copy.title}</p>
      <p className="mb-4 text-sm text-muted-foreground">{t.copy.sub}</p>
      <Field label={t.copy.last}>
        <div className="grid grid-cols-4 gap-2">
          {RANGES.map((d) => (
            <Chip key={d} active={days === d} onClick={() => setDays(d)}>
              {rangeLabel(d)}
            </Chip>
          ))}
        </div>
      </Field>
      <Field label={t.copy.preview}>
        <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-2xl border border-border bg-secondary/40 p-3 font-sans text-xs leading-relaxed text-muted-foreground">{text}</pre>
      </Field>
      <button
        type="button"
        onClick={async () => {
          const ok = await copyText(text);
          showToast({ message: ok ? fill(t.copy.copied, { r: rangeLabel(days) }) : t.copy.failed });
          if (ok) onClose();
        }}
        className="surface-warm flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-bold active:scale-[0.98]"
      >
        <CopyIcon className="size-5" /> {t.copy.button}
      </button>
    </Sheet>
  );
}
