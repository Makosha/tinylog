import { useState } from "react";
import { LABEL, eventLabel, isRest, type LogEvent, type RestKind } from "@/domain/events";
import type { EventPatch } from "@/domain/state";
import { dayLabel, durationLabel } from "@/domain/time";
import { Chip } from "./Chip";
import { DiaperChips } from "./DiaperChips";
import { Field } from "./Field";
import { CheckIcon, ICON, TrashIcon } from "./icons";
import { MinutesChips } from "./MinutesChips";
import { MlChips } from "./MlChips";
import { Sheet } from "./Sheet";
import { SideChips } from "./SideChips";
import { TimeStepper } from "./TimeStepper";

export function EditSheet({
  event,
  now,
  canStayAsleep,
  onPatch,
  onWakeNow,
  onStayAsleep,
  onDelete,
  onClose,
}: {
  event: LogEvent;
  now: number;
  /** feed that ended a rest: offer to merge the sleep back together */
  canStayAsleep: boolean;
  onPatch: (patch: EventPatch) => void;
  onWakeNow: () => void;
  onStayAsleep: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const Icon = ICON[event.kind === "feed" ? event.source : event.kind];
  const tone = event.kind === "feed" ? (event.source === "breast" ? "text-breast" : "text-feed") : { sleep: "text-sleep", nap: "text-nap", diaper: "text-wake" }[event.kind];

  return (
    <Sheet label={`Edit ${eventLabel(event)}`} onClose={onClose}>
      <div className="mb-4 flex items-center gap-3">
        <span className={`icon-tile size-11 ${tone}`}>
          <Icon className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-xl font-bold leading-tight text-foreground">{eventLabel(event)}</p>
          <p className="text-xs text-muted-foreground">{dayLabel(event.at, now)}</p>
        </div>
        <button
          type="button"
          onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
          onBlur={() => setConfirmDelete(false)}
          className={`flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-bold transition-colors ${
            confirmDelete ? "bg-destructive text-destructive-foreground" : "text-destructive active:bg-destructive/10"
          }`}
        >
          <TrashIcon className="size-4" /> {confirmDelete ? "Tap again to delete" : "Delete"}
        </button>
      </div>

      {isRest(event) ? (
        <>
          <Field label="Kind">
            <div className="grid grid-cols-2 gap-2">
              {(["nap", "sleep"] as RestKind[]).map((k) => {
                const I = ICON[k];
                return (
                  <Chip key={k} active={event.kind === k} onClick={() => onPatch({ kind: k })}>
                    <span className="flex items-center justify-center gap-1.5">
                      <I className="size-4" /> {LABEL[k]}
                    </span>
                  </Chip>
                );
              })}
            </div>
          </Field>
          <Field label="Started">
            <TimeStepper value={event.at} max={event.endAt ?? now} onChange={(at) => onPatch({ at })} />
          </Field>
          <Field label={event.endAt !== undefined ? `Ended · ${durationLabel(event.at, event.endAt)}` : "Ended"}>
            {event.endAt !== undefined ? (
              <TimeStepper value={event.endAt} min={event.at} max={now} onChange={(endAt) => onPatch({ endAt })} />
            ) : (
              <div className="flex items-center gap-3">
                <button type="button" onClick={onWakeNow} className="flex h-12 items-center gap-2 rounded-2xl border border-border bg-secondary/60 px-4 text-sm font-bold text-foreground active:scale-95">
                  <ICON.wake className="size-5" /> {LABEL.wake} now
                </button>
                <span className="text-sm text-muted-foreground">still going · {durationLabel(event.at, now)}</span>
              </div>
            )}
          </Field>
        </>
      ) : event.kind === "feed" ? (
        <>
          <Field label="Time">
            <TimeStepper value={event.at} max={now} onChange={(at) => onPatch({ at })} />
          </Field>
          <Field label="Source">
            <div className="grid grid-cols-2 gap-2">
              {(["breast", "bottle"] as const).map((s) => {
                const I = ICON[s];
                return (
                  <Chip key={s} active={event.source === s} onClick={() => onPatch({ source: s })}>
                    <span className="flex items-center justify-center gap-1.5">
                      <I className="size-4" /> {LABEL[s]}
                    </span>
                  </Chip>
                );
              })}
            </div>
          </Field>
          {event.source === "breast" ? (
            <>
              <Field label="Side">
                <SideChips value={event.side} onChange={(side) => onPatch({ side })} />
              </Field>
              <Field label="Duration">
                <MinutesChips value={event.minutes} onChange={(minutes) => onPatch({ minutes })} />
              </Field>
            </>
          ) : (
            <Field label="Amount">
              <MlChips value={event.ml} onChange={(ml) => onPatch({ ml })} />
            </Field>
          )}
          {canStayAsleep ? (
            <button
              type="button"
              onClick={onStayAsleep}
              className="mb-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-sleep/40 bg-sleep/10 text-sm font-bold text-foreground active:scale-[0.98]"
            >
              <ICON.sleep className="size-5 text-sleep" /> Stayed asleep: join the sleep back together
            </button>
          ) : null}
        </>
      ) : (
        <>
          <Field label="Time">
            <TimeStepper value={event.at} max={now} onChange={(at) => onPatch({ at })} />
          </Field>
          <Field label="What">
            <DiaperChips wet={event.wet} dirty={event.dirty} onChange={(v) => onPatch(v)} />
          </Field>
        </>
      )}

      <button
        type="button"
        onClick={onClose}
        className="surface-warm flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-bold active:scale-[0.98]"
      >
        <CheckIcon className="size-5" /> Done
      </button>
    </Sheet>
  );
}
