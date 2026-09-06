import { useEffect } from "react";
import { LABEL, eventLabel, isRest, type FeedSource, type LogEvent } from "@/domain/events";
import type { EventPatch } from "@/domain/state";
import { dayLabel, durationLabel } from "@/domain/time";
import { Chip } from "./Chip";
import { CloseIcon, ICON, TrashIcon } from "./icons";
import { MlChips } from "./MlChips";
import { SideChips } from "./SideChips";
import { TimeStepper } from "./TimeStepper";

export function EditSheet({
  event,
  now,
  lastMl,
  onPatch,
  onWakeNow,
  onDelete,
  onClose,
}: {
  event: LogEvent;
  now: number;
  lastMl: Partial<Record<FeedSource, number>>;
  onPatch: (patch: EventPatch) => void;
  onWakeNow: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const Icon = ICON[event.kind === "feed" ? event.source : event.kind];
  const tone = { feed: "text-feed", sleep: "text-sleep", nap: "text-nap" }[event.kind];

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-background/70 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-label={`Edit ${eventLabel(event)}`}
        onClick={(e) => e.stopPropagation()}
        className="animate-slide-up safe-bottom w-full max-w-md rounded-t-3xl border border-border bg-card p-4 shadow-2xl"
      >
        <div className="mb-4 flex items-center gap-3">
          <span className={`icon-tile size-11 ${tone}`}>
            <Icon className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-xl font-bold leading-tight text-foreground">{eventLabel(event)}</p>
            <p className="text-xs text-muted-foreground">{dayLabel(event.at, now)}</p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="flex size-11 items-center justify-center rounded-2xl border border-border bg-secondary/60 text-foreground active:scale-95">
            <CloseIcon className="size-5" />
          </button>
        </div>

        {isRest(event) ? (
          <>
            <Field label="Started">
              <TimeStepper value={event.at} max={event.endAt ?? now} onChange={(at) => onPatch({ at })} />
            </Field>
            <Field label={event.endAt !== undefined ? `Ended · ${durationLabel(event.at, event.endAt)}` : "Ended"}>
              {event.endAt !== undefined ? (
                <TimeStepper value={event.endAt} min={event.at} max={now} onChange={(endAt) => onPatch({ endAt })} />
              ) : (
                <div className="flex items-center gap-3">
                  <button type="button" onClick={onWakeNow} className="surface-warm flex h-12 items-center gap-2 rounded-2xl px-4 text-sm font-bold active:scale-95">
                    <ICON.wake className="size-5" /> {LABEL.wake} now
                  </button>
                  <span className="text-sm text-muted-foreground">still going · {durationLabel(event.at, now)}</span>
                </div>
              )}
            </Field>
          </>
        ) : (
          <>
            <Field label="Time">
              <TimeStepper value={event.at} max={now} onChange={(at) => onPatch({ at })} />
            </Field>
            <Field label="Source">
              <div className="flex gap-2">
                {(["breast", "bottle"] as const).map((s) => {
                  const I = ICON[s];
                  return (
                    <Chip key={s} active={event.source === s} onClick={() => onPatch({ source: s })}>
                      <span className="flex items-center gap-1.5">
                        <I className="size-4" /> {LABEL[s]}
                      </span>
                    </Chip>
                  );
                })}
              </div>
            </Field>
            {event.source === "breast" ? (
              <Field label="Side">
                <SideChips value={event.side} onChange={(side) => onPatch({ side })} />
              </Field>
            ) : null}
            <Field label="Amount">
              <MlChips value={event.ml} hint={lastMl[event.source]} onChange={(ml) => onPatch({ ml })} />
            </Field>
          </>
        )}

        <button
          type="button"
          onClick={onDelete}
          className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-destructive/40 text-sm font-bold text-destructive active:bg-destructive/10"
        >
          <TrashIcon className="size-4" /> Delete
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}
