import { useState } from "react";
import { MEASURE_META, type Measure, type Measurement } from "@/domain/growth";
import { dayLabel } from "@/domain/time";
import { Field } from "./Field";
import { CheckIcon, TrashIcon } from "./icons";
import { Sheet } from "./Sheet";
import { Stepper } from "./Stepper";

const DAY = 86_400_000;
const MEASURES: Measure[] = ["weight", "length", "head"];

/**
 * One sheet for a new or existing measurement. Values default to the previous
 * entry so a small change is a couple of taps; any of them can be cleared.
 */
export function MeasureSheet({
  initial,
  previous,
  now,
  onSave,
  onDelete,
  onClose,
}: {
  initial?: Measurement;
  /** most recent measurement before this one, for defaults */
  previous?: Measurement;
  now: number;
  onSave: (m: Omit<Measurement, "id">) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [at, setAt] = useState(initial?.at ?? now);
  const [vals, setVals] = useState<Partial<Record<Measure, number | undefined>>>({
    weight: initial?.weightKg ?? previous?.weightKg,
    length: initial?.lengthCm ?? previous?.lengthCm,
    head: initial?.headCm ?? previous?.headCm,
  });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dayShift = (n: number) => setAt((a) => Math.min(now, a + n * DAY));

  const save = () => {
    onSave({
      at,
      ...(vals.weight ? { weightKg: round(vals.weight, 2) } : {}),
      ...(vals.length ? { lengthCm: round(vals.length, 1) } : {}),
      ...(vals.head ? { headCm: round(vals.head, 1) } : {}),
    });
    onClose();
  };

  return (
    <Sheet label={initial ? "Edit measurement" : "New measurement"} onClose={onClose}>
      <div className="mb-4 flex items-center justify-between">
        <p className="font-display text-xl font-bold text-foreground">{initial ? "Measurement" : "New measurement"}</p>
        {onDelete ? (
          <button
            type="button"
            onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
            onBlur={() => setConfirmDelete(false)}
            className={`flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-bold ${confirmDelete ? "bg-destructive text-destructive-foreground" : "text-destructive"}`}
          >
            <TrashIcon className="size-4" /> {confirmDelete ? "Tap again to delete" : "Delete"}
          </button>
        ) : null}
      </div>
      <Field label="Date">
        <div className="flex items-center gap-1.5">
          <button type="button" aria-label="A week earlier" onClick={() => dayShift(-7)} className="h-12 w-12 rounded-2xl border border-border bg-secondary/60 text-sm font-bold text-foreground">
            −7d
          </button>
          <button type="button" aria-label="A day earlier" onClick={() => dayShift(-1)} className="h-12 w-12 rounded-2xl border border-border bg-secondary/60 text-sm font-bold text-foreground">
            −1d
          </button>
          <div className="flex h-12 flex-1 flex-col items-center justify-center rounded-2xl border border-border bg-secondary/60">
            <span className="font-display text-base font-bold leading-none text-foreground">{new Date(at).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{dayLabel(at, now)}</span>
          </div>
          <button type="button" aria-label="A day later" disabled={at + DAY > now} onClick={() => dayShift(1)} className="h-12 w-12 rounded-2xl border border-border bg-secondary/60 text-sm font-bold text-foreground disabled:opacity-45">
            +1d
          </button>
          <button type="button" aria-label="A week later" disabled={at + 7 * DAY > now} onClick={() => dayShift(7)} className="h-12 w-12 rounded-2xl border border-border bg-secondary/60 text-sm font-bold text-foreground disabled:opacity-45">
            +7d
          </button>
        </div>
      </Field>
      {MEASURES.map((k) => {
        const meta = MEASURE_META[k];
        const v = vals[k];
        return (
          <Field key={k} label={`${meta.label} · ${meta.unit}`}>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Stepper
                  value={v !== undefined ? v.toFixed(meta.decimals) : "–"}
                  unit={meta.unit}
                  minusLabel={`${meta.label} less`}
                  plusLabel={`${meta.label} more`}
                  onStep={(d) => setVals((s) => ({ ...s, [k]: round(Math.max(0, (v ?? defaultFor(k)) + d * meta.step), meta.decimals) || undefined }))}
                />
              </div>
              <button
                type="button"
                aria-label={`Clear ${meta.label}`}
                onClick={() => setVals((s) => ({ ...s, [k]: undefined }))}
                disabled={v === undefined}
                className="h-12 w-12 rounded-2xl border border-border bg-secondary/60 text-sm font-bold text-muted-foreground disabled:opacity-45"
              >
                ×
              </button>
            </div>
          </Field>
        );
      })}
      <button type="button" onClick={save} className="surface-warm flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-bold active:scale-[0.98]">
        <CheckIcon className="size-5" /> Save
      </button>
    </Sheet>
  );
}

const defaultFor = (k: Measure) => ({ weight: 3.5, length: 50, head: 35 })[k];
const round = (v: number, d: number) => Number(v.toFixed(d));
