import { useState } from "react";
import { MEASURE_META, type Measure, type Measurement } from "@/domain/growth";
import { dayLabel } from "@/domain/time";
import { Field } from "./Field";
import { CloseIcon, TrashIcon } from "./icons";
import { Sheet } from "./Sheet";
import { CalendarSheet } from "./DatePicker";
import { Stepper } from "./Stepper";
import { formatWeight, lengthScale, weightScale, type Units } from "@/domain/units";
import { useUnits } from "@/store/store";

const DAY = 86_400_000;
const MEASURES: Measure[] = ["weight", "length", "head"];

/** Edits a measurement in place: every tap is saved at once. */
export function MeasureSheet({
  measurement,
  now,
  onPatch,
  onDelete,
  onClose,
}: {
  measurement: Measurement;
  now: number;
  onPatch: (patch: Partial<Omit<Measurement, "id">>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [calendar, setCalendar] = useState(false);
  const units = useUnits();
  const at = measurement.at;
  const dayShift = (n: number) => onPatch({ at: Math.min(now, at + n * DAY) });
  const btn = "h-12 w-12 rounded-2xl border border-border bg-secondary/60 text-sm font-bold text-foreground disabled:opacity-45";

  return (
    <Sheet label="Edit measurement" onClose={onClose}>
      <div className="mb-4 flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-display text-xl font-bold leading-tight text-foreground">Measurement</p>
          <p className="text-xs text-muted-foreground">saved as you go</p>
        </div>
        <button
          type="button"
          onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
          onBlur={() => setConfirmDelete(false)}
          className={`flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-bold ${confirmDelete ? "bg-destructive text-destructive-foreground" : "text-destructive"}`}
        >
          <TrashIcon className="size-4" /> {confirmDelete ? "Tap again" : "Delete"}
        </button>
        <button type="button" aria-label="Close" onClick={onClose} className="flex size-11 items-center justify-center rounded-2xl border border-border bg-secondary/60 text-foreground active:scale-95">
          <CloseIcon className="size-5" />
        </button>
      </div>
      <Field label="Date">
        <div className="flex items-center gap-1.5">
          <button type="button" aria-label="A week earlier" onClick={() => dayShift(-7)} className={btn}>
            −7d
          </button>
          <button type="button" aria-label="A day earlier" onClick={() => dayShift(-1)} className={btn}>
            −1d
          </button>
          <button type="button" onClick={() => setCalendar(true)} className="flex h-12 flex-1 flex-col items-center justify-center rounded-2xl border border-border bg-secondary/60 active:scale-[0.98]">
            <span className="font-display text-base font-bold leading-none text-foreground">{new Date(at).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{dayLabel(at, now)}</span>
          </button>
          <button type="button" aria-label="A day later" disabled={at + DAY > now} onClick={() => dayShift(1)} className={btn}>
            +1d
          </button>
          <button type="button" aria-label="A week later" disabled={at + 7 * DAY > now} onClick={() => dayShift(7)} className={btn}>
            +7d
          </button>
        </div>
      </Field>
      {MEASURES.map((k) => {
        const meta = MEASURE_META[k];
        const sc = scaleFor(k, units);
        const v = measurement[meta.key] as number | undefined;
        return (
          <Field key={k} label={`${meta.label} · ${sc.unit}`}>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Stepper
                  value={v === undefined ? "–" : k === "weight" && units.weight === "lb" ? formatWeight(v, units) : sc.to(v).toFixed(sc.decimals)}
                  unit={k === "weight" && units.weight === "lb" ? "" : sc.unit}
                  minusLabel={`${meta.label} less`}
                  plusLabel={`${meta.label} more`}
                  onStep={(d) => {
                    if (v === undefined) {
                      if (d > 0) onPatch({ [meta.key]: defaultFor(k) });
                      return;
                    }
                    onPatch({ [meta.key]: round(Math.max(0, v + d * sc.step), 4) || undefined });
                  }}
                />
              </div>
              <button
                type="button"
                aria-label={`Clear ${meta.label}`}
                onClick={() => onPatch({ [meta.key]: undefined })}
                disabled={v === undefined}
                className="h-12 w-12 rounded-2xl border border-border bg-secondary/60 text-sm font-bold text-muted-foreground disabled:opacity-45"
              >
                ×
              </button>
            </div>
          </Field>
        );
      })}
      {calendar ? (
        <CalendarSheet
          label="Measured on"
          value={at}
          max={now}
          onPick={(ms) => {
            onPatch({ at: Math.min(now, ms) });
            setCalendar(false);
          }}
          onClose={() => setCalendar(false)}
        />
      ) : null}
    </Sheet>
  );
}

const defaultFor = (k: Measure) => ({ weight: 3.5, length: 50, head: 35 })[k];
const scaleFor = (k: Measure, u: Units) => (k === "weight" ? weightScale(u) : lengthScale(u));
const round = (v: number, d: number) => Number(v.toFixed(d));
