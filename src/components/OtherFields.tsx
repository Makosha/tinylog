import { useState } from "react";
import { FEVER_C, MEDICINES, MILESTONES, type OtherEvent } from "@/domain/events";
import type { EventPatch } from "@/domain/state";
import { tempScale } from "@/domain/units";
import { useUnits } from "@/store/store";
import { useT } from "@/i18n/index";
import { medicineName, milestoneName } from "@/i18n/labels";
import type { Dict } from "@/i18n/en";
import { Chip } from "./Chip";
import { DiaperChips } from "./DiaperChips";
import { Field } from "./Field";
import { Stepper } from "./Stepper";

const TUMMY = [1, 2, 5, 10, 15];
const input = "h-12 w-full rounded-2xl border border-border bg-secondary/60 px-3 text-base text-foreground outline-none focus:border-primary";

/** Kind-specific fields for "other" events. Used by the capture panel and the edit sheet. */
export function OtherFields({ event, onPatch }: { event: OtherEvent; onPatch: (p: EventPatch) => void }) {
  const ts = tempScale(useUnits());
  const { t } = useT();
  switch (event.kind) {
    case "diaper":
      return (
        <Field label={t.capture.what}>
          <DiaperChips wet={event.wet} dirty={event.dirty} onChange={(v) => onPatch(v)} />
        </Field>
      );
    case "temperature":
      return (
        <Field label={event.celsius >= FEVER_C ? `${t.kind.temperature} · ${t.detail.fever}` : t.kind.temperature}>
          <Stepper
            value={ts.to(event.celsius).toFixed(ts.decimals)}
            unit={ts.unit}
            minusLabel={t.steps.less}
            plusLabel={t.steps.more}
            onStep={(d) => onPatch({ celsius: Math.round(ts.from(Math.round((ts.to(event.celsius) + d * 0.1) * 10) / 10) * 100) / 100 })}
          />
        </Field>
      );
    case "medicine":
      return <MedicineFields t={t} name={event.name} dose={event.dose} onPatch={onPatch} />;
    case "tummy":
      return (
        <Field label={t.capture.duration}>
          <div className="grid grid-cols-5 gap-2">
            {TUMMY.map((m) => (
              <Chip key={m} active={event.minutes === m} onClick={() => onPatch({ minutes: event.minutes === m ? undefined : m })}>
                {m}m
              </Chip>
            ))}
          </div>
        </Field>
      );
    case "bath":
      return null;
    case "milestone":
      return <MilestoneFields t={t} title={event.title} onPatch={onPatch} />;
    case "note":
      return (
        <Field label={t.capture.note}>
          <textarea value={event.text} onChange={(e) => onPatch({ text: e.target.value })} rows={3} placeholder={t.capture.notePlaceholder} className={`${input} h-auto py-2.5`} />
        </Field>
      );
  }
}

function MedicineFields({ t, name, dose, onPatch }: { t: Dict; name: string; dose: string | undefined; onPatch: (p: EventPatch) => void }) {
  const known = (MEDICINES as readonly string[]).includes(name);
  const [custom, setCustom] = useState(!known);
  return (
    <>
      <Field label={t.kind.medicine}>
        <div className="grid grid-cols-3 gap-2">
          {MEDICINES.map((m) => (
            <Chip
              key={m}
              active={m === "Other" ? custom : !custom && name === m}
              onClick={() => {
                if (m === "Other") {
                  setCustom(true);
                  onPatch({ name: known ? "" : name });
                } else {
                  setCustom(false);
                  onPatch({ name: m });
                }
              }}
            >
              {medicineName(t, m)}
            </Chip>
          ))}
        </div>
        {custom ? <input type="text" value={known ? "" : name} placeholder={t.capture.medicineName} autoFocus onChange={(e) => onPatch({ name: e.target.value })} className={`${input} mt-2`} /> : null}
      </Field>
      <Field label={t.capture.dose}>
        <input type="text" value={dose ?? ""} placeholder={t.capture.dosePlaceholder} onChange={(e) => onPatch({ dose: e.target.value })} className={input} />
      </Field>
    </>
  );
}

function MilestoneFields({ t, title, onPatch }: { t: Dict; title: string; onPatch: (p: EventPatch) => void }) {
  const known = (MILESTONES as readonly string[]).includes(title);
  const [custom, setCustom] = useState(!known);
  return (
    <Field label={t.kind.milestone}>
      <div className="grid grid-cols-2 gap-2">
        {MILESTONES.map((m) => (
          <Chip
            key={m}
            active={!custom && title === m}
            onClick={() => {
              setCustom(false);
              onPatch({ title: m });
            }}
          >
            {milestoneName(t, m)}
          </Chip>
        ))}
        <Chip
          active={custom}
          className="col-span-2"
          onClick={() => {
            setCustom(true);
            onPatch({ title: known ? "" : title });
          }}
        >
          {t.capture.somethingElse}
        </Chip>
      </div>
      {custom ? <input type="text" value={known ? "" : title} placeholder={t.capture.whatHappened} autoFocus onChange={(e) => onPatch({ title: e.target.value })} className={`${input} mt-2`} /> : null}
    </Field>
  );
}
