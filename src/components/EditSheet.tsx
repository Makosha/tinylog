import { useEffect } from "react";
import { Trash2, X } from "lucide-react";
import { META, isRest, type FeedSource, type LogEvent } from "@/domain/events";
import type { EventPatch } from "@/domain/state";
import { dayLabel, durationLabel, resolveTimeOfDay, toTimeInput } from "@/domain/time";
import { Chip } from "./Chip";
import { MlChips } from "./MlChips";

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

  const meta = event.kind === "feed" ? META[event.source] : META[event.kind];

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div
        role="dialog"
        aria-label={`Edit ${meta.label}`}
        onClick={(e) => e.stopPropagation()}
        className="animate-slide-up safe-bottom w-full max-w-md rounded-t-3xl border border-border bg-card p-4"
      >
        <div className="mb-4 flex items-center justify-between">
          <p className="font-display text-xl font-bold text-foreground">
            {meta.emoji} {meta.label}
            <span className="ml-2 text-sm font-normal text-muted-foreground">{dayLabel(event.at, now)}</span>
          </p>
          <button type="button" aria-label="Close" onClick={onClose} className="flex size-10 items-center justify-center rounded-full text-muted-foreground active:bg-secondary">
            <X className="size-5" />
          </button>
        </div>

        {isRest(event) ? (
          <>
            <Field label="Started">
              <TimeInput value={event.at} onChange={(at) => onPatch({ at })} />
            </Field>
            <Field label="Ended">
              {event.endAt !== undefined ? (
                <div className="flex items-center gap-3">
                  <TimeInput value={event.endAt} onChange={(endAt) => onPatch({ endAt })} />
                  <span className="text-sm text-muted-foreground">{durationLabel(event.at, event.endAt)}</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button type="button" onClick={onWakeNow} className="surface-warm h-11 rounded-full px-4 text-sm font-semibold active:scale-95">
                    {META.wake.emoji} Wake up now
                  </button>
                  <span className="text-sm text-muted-foreground">still going · {durationLabel(event.at, now)}</span>
                </div>
              )}
            </Field>
          </>
        ) : (
          <>
            <Field label="Time">
              <TimeInput value={event.at} onChange={(at) => onPatch({ at })} />
            </Field>
            <Field label="Source">
              <div className="flex gap-2">
                {(["breast", "bottle"] as const).map((s) => (
                  <Chip key={s} active={event.source === s} onClick={() => onPatch({ source: s })}>
                    {META[s].emoji} {META[s].label}
                  </Chip>
                ))}
              </div>
            </Field>
            <Field label="Amount">
              <MlChips value={event.ml} hint={lastMl[event.source]} onChange={(ml) => onPatch({ ml })} />
            </Field>
          </>
        )}

        <button
          type="button"
          onClick={onDelete}
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-destructive/40 text-sm font-semibold text-destructive active:bg-destructive/10"
        >
          <Trash2 className="size-4" /> Delete
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function TimeInput({ value, onChange }: { value: number; onChange: (ms: number) => void }) {
  return (
    <input
      type="time"
      value={toTimeInput(value)}
      onChange={(e) => e.target.value && onChange(resolveTimeOfDay(value, e.target.value))}
      className="h-11 rounded-xl border border-border bg-secondary/60 px-3 font-display text-lg font-bold tabular-nums text-foreground outline-none focus:border-primary"
    />
  );
}
