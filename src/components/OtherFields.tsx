import { useState } from "react";
import { FEVER_C, MEDICINES, MILESTONES, type OtherEvent } from "@/domain/events";
import type { EventPatch } from "@/domain/state";
import { Chip } from "./Chip";
import { DiaperChips } from "./DiaperChips";
import { Field } from "./Field";
import { Stepper } from "./Stepper";

const TUMMY = [1, 2, 5, 10, 15];
const input = "h-12 w-full rounded-2xl border border-border bg-secondary/60 px-3 text-base text-foreground outline-none focus:border-primary";

/** Kind-specific fields for "other" events. Used by the capture panel and the edit sheet. */
export function OtherFields({ event, onPatch }: { event: OtherEvent; onPatch: (p: EventPatch) => void }) {
  switch (event.kind) {
    case "diaper":
      return (
        <Field label="What">
          <DiaperChips wet={event.wet} dirty={event.dirty} onChange={(v) => onPatch(v)} />
        </Field>
      );
    case "temperature":
      return (
        <Field label={event.celsius >= FEVER_C ? "Temperature · fever" : "Temperature"}>
          <Stepper
            value={event.celsius.toFixed(1)}
            unit="°C"
            minusLabel="0.1 degree less"
            plusLabel="0.1 degree more"
            onStep={(d) => onPatch({ celsius: Math.round((event.celsius + d * 0.1) * 10) / 10 })}
          />
        </Field>
      );
    case "medicine":
      return <MedicineFields name={event.name} dose={event.dose} onPatch={onPatch} />;
    case "tummy":
      return (
        <Field label="Duration">
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
      return <MilestoneFields title={event.title} onPatch={onPatch} />;
    case "note":
      return (
        <Field label="Note">
          <textarea
            value={event.text}
            onChange={(e) => onPatch({ text: e.target.value })}
            rows={3}
            placeholder="anything worth remembering"
            className={`${input} h-auto py-2.5`}
          />
        </Field>
      );
  }
}

function MedicineFields({ name, dose, onPatch }: { name: string; dose: string | undefined; onPatch: (p: EventPatch) => void }) {
  const known = (MEDICINES as readonly string[]).includes(name);
  const [custom, setCustom] = useState(!known);
  return (
    <>
      <Field label="Medicine">
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
              {m}
            </Chip>
          ))}
        </div>
        {custom ? (
          <input type="text" value={known ? "" : name} placeholder="name" autoFocus onChange={(e) => onPatch({ name: e.target.value })} className={`${input} mt-2`} />
        ) : null}
      </Field>
      <Field label="Dose · optional">
        <input type="text" value={dose ?? ""} placeholder="e.g. 2.5 ml, 1 drop" onChange={(e) => onPatch({ dose: e.target.value })} className={input} />
      </Field>
    </>
  );
}

function MilestoneFields({ title, onPatch }: { title: string; onPatch: (p: EventPatch) => void }) {
  const known = (MILESTONES as readonly string[]).includes(title);
  const [custom, setCustom] = useState(!known);
  return (
    <Field label="Milestone">
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
            {m}
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
          Something else
        </Chip>
      </div>
      {custom ? <input type="text" value={known ? "" : title} placeholder="what happened" autoFocus onChange={(e) => onPatch({ title: e.target.value })} className={`${input} mt-2`} /> : null}
    </Field>
  );
}
