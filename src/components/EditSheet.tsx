import { useState } from "react";
import { isRest, type LogEvent, type RestKind } from "@/domain/events";
import type { EventPatch } from "@/domain/state";
import { durationLabel } from "@/domain/time";
import { fill, useT } from "@/i18n/index";
import { dayLabel, labelOf } from "@/i18n/labels";
import { Chip } from "./Chip";
import { Field } from "./Field";
import { CloseIcon, ICON, TrashIcon } from "./icons";
import { MinutesChips } from "./MinutesChips";
import { MlChips } from "./MlChips";
import { OtherFields } from "./OtherFields";
import { Sheet } from "./Sheet";
import { SideChips } from "./SideChips";
import { TimeStepper } from "./TimeStepper";
import { eventTone, iconKey } from "./kind";

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
  canStayAsleep: boolean;
  onPatch: (patch: EventPatch) => void;
  onWakeNow: () => void;
  onStayAsleep: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const { t, locale } = useT();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const Icon = ICON[iconKey(event)];
  const tone = eventTone(event);

  return (
    <Sheet label={labelOf(t, event)} onClose={onClose}>
      <div className="mb-4 flex items-center gap-2">
        <span className={`icon-tile size-11 shrink-0 ${tone}`}>
          <Icon className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-xl font-bold leading-tight text-foreground">{labelOf(t, event)}</p>
          <p className="text-xs text-muted-foreground">
            {dayLabel(t, locale, event.at, now)} · {t.edit.savedAsYouGo}
          </p>
        </div>
        <button
          type="button"
          onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
          onBlur={() => setConfirmDelete(false)}
          className={`flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-bold transition-colors ${confirmDelete ? "bg-destructive text-destructive-foreground" : "text-destructive active:bg-destructive/10"}`}
        >
          <TrashIcon className="size-4" /> {confirmDelete ? t.edit.tapAgain : t.edit.delete}
        </button>
        <button type="button" aria-label={t.capture.close} onClick={onClose} className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-secondary/60 text-foreground active:scale-95">
          <CloseIcon className="size-5" />
        </button>
      </div>

      {isRest(event) ? (
        <>
          <Field label={t.edit.kind}>
            <div className="grid grid-cols-2 gap-2">
              {(["nap", "sleep"] as RestKind[]).map((k) => {
                const I = ICON[k];
                return (
                  <Chip key={k} active={event.kind === k} onClick={() => onPatch({ kind: k })}>
                    <span className="flex items-center justify-center gap-1.5">
                      <I className="size-4" /> {t.kind[k]}
                    </span>
                  </Chip>
                );
              })}
            </div>
          </Field>
          <Field label={t.when[event.kind]}>
            <TimeStepper value={event.at} max={event.endAt ?? now} onChange={(at) => onPatch({ at })} />
          </Field>
          <Field label={event.endAt !== undefined ? `${t.when.sleepEnd} · ${durationLabel(event.at, event.endAt)}` : t.when.sleepEnd}>
            {event.endAt !== undefined ? (
              <TimeStepper value={event.endAt} min={event.at} max={now} onChange={(endAt) => onPatch({ endAt })} />
            ) : (
              <div className="flex items-center gap-3">
                <button type="button" onClick={onWakeNow} className="flex h-12 items-center gap-2 rounded-2xl border border-border bg-secondary/60 px-4 text-sm font-bold text-foreground active:scale-95">
                  <ICON.wake className="size-5" /> {t.edit.wakeUpNow}
                </button>
                <span className="text-sm text-muted-foreground">{fill(t.edit.stillGoing, { t: durationLabel(event.at, now) })}</span>
              </div>
            )}
          </Field>
        </>
      ) : event.kind === "feed" ? (
        <>
          <Field label={t.when[event.source]}>
            <TimeStepper value={event.at} max={now} onChange={(at) => onPatch({ at })} />
          </Field>
          <Field label={t.edit.source}>
            <div className="grid grid-cols-2 gap-2">
              {(["breast", "bottle"] as const).map((s) => {
                const I = ICON[s];
                return (
                  <Chip key={s} active={event.source === s} onClick={() => onPatch({ source: s })}>
                    <span className="flex items-center justify-center gap-1.5">
                      <I className="size-4" /> {t.kind[s]}
                    </span>
                  </Chip>
                );
              })}
            </div>
          </Field>
          {event.source === "breast" ? (
            <>
              <Field label={t.capture.side}>
                <SideChips value={event.side} onChange={(side) => onPatch({ side })} />
              </Field>
              <Field label={t.capture.duration}>
                <MinutesChips value={event.minutes} onChange={(minutes) => onPatch({ minutes })} />
              </Field>
            </>
          ) : (
            <Field label={t.capture.amount}>
              <MlChips value={event.ml} onChange={(ml) => onPatch({ ml })} />
            </Field>
          )}
          {canStayAsleep ? (
            <button type="button" onClick={onStayAsleep} className="mb-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-sleep/40 bg-sleep/10 px-3 text-sm font-bold text-foreground active:scale-[0.98]">
              <ICON.sleep className="size-5 shrink-0 text-sleep" /> <span className="truncate">{t.edit.joinSleep}</span>
            </button>
          ) : null}
        </>
      ) : (
        <>
          <Field label={t.when[event.kind]}>
            <TimeStepper value={event.at} max={now} onChange={(at) => onPatch({ at })} />
          </Field>
          <OtherFields event={event} onPatch={onPatch} />
        </>
      )}
    </Sheet>
  );
}
