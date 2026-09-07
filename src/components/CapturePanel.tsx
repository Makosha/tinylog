import { useEffect, useRef, useState } from "react";
import { LABEL, isRest, type LogEvent } from "@/domain/events";
import { OtherFields } from "./OtherFields";
import { eventTone } from "./kind";
import type { EventPatch } from "@/domain/state";
import { CheckIcon, ICON, UndoIcon } from "./icons";
import { Field } from "./Field";
import { MinutesChips } from "./MinutesChips";
import { MlChips } from "./MlChips";
import { SideChips } from "./SideChips";
import { Switch } from "./Switch";
import { TimeStepper } from "./TimeStepper";

export interface Capture {
  eventId: string;
  /** what the tap did; decides which fields are shown */
  action: "feed" | "rest" | "wake" | "other";
  /** moment of the tap */
  tappedAt: number;
  /** feed only: the rest this feed interrupted (baby woke up to feed) */
  closedRestId?: string;
}

export const COUNTDOWN = 10_000;
const TICK = 100;
/** ignore touches for this long after the panel appears (double-tap protection) */
const GUARD = 350;

/**
 * Replaces the action buttons right after a tap. Shows the fields that
 * matter for that event with a 10 s countdown; any touch pauses it, so does
 * the screen going dark.
 */
export function CapturePanel({
  capture,
  event,
  stayedAsleep,
  onStayedAsleep,
  onPatch,
  onUndo,
  onDone,
}: {
  capture: Capture;
  event: LogEvent | undefined;
  stayedAsleep?: boolean;
  onStayedAsleep?: (v: boolean) => void;
  onPatch: (p: EventPatch) => void;
  onUndo: () => void;
  onDone: () => void;
}) {
  const [left, setLeft] = useState(COUNTDOWN);
  const [paused, setPaused] = useState(false);
  const [guarded, setGuarded] = useState(true);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    setLeft(COUNTDOWN);
    setPaused(false);
    setGuarded(true);
    const id = window.setTimeout(() => setGuarded(false), GUARD);
    return () => window.clearTimeout(id);
  }, [capture]);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      setLeft((l) => Math.max(0, l - TICK));
    }, TICK);
    return () => window.clearInterval(id);
  }, [paused, capture]);

  useEffect(() => {
    if (left === 0 && !paused) doneRef.current();
  }, [left, paused]);

  if (!event) return null;

  const isWake = capture.action === "wake";
  const kind = isWake ? "wake" : event.kind === "feed" ? event.source : event.kind;
  const Icon = ICON[kind];
  const tone = isWake ? "text-wake" : eventTone(event);
  const title = isWake ? "Woke up" : LABEL[kind];
  const timeValue = isWake && isRest(event) ? (event.endAt ?? capture.tappedAt) : event.at;

  return (
    <section
      aria-label={`${title} logged, adjust details`}
      onPointerDownCapture={(e) => {
        if (guarded) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        setPaused(true);
      }}
      className={`card-soft animate-pop-in relative overflow-hidden border-primary/40 p-4 shadow-lg ${guarded ? "pointer-events-none" : ""}`}
    >
      <div className="mb-4 flex items-center gap-3">
        <span className={`icon-tile size-11 ${tone}`}>
          <Icon className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-xl font-bold leading-tight text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{paused ? "saved · tap Done when finished" : "saved · closing soon"}</p>
        </div>
        <button
          type="button"
          onClick={onUndo}
          className="flex h-10 items-center gap-1.5 rounded-xl px-2.5 text-sm font-semibold text-muted-foreground active:bg-secondary"
        >
          <UndoIcon className="size-4" /> Undo
        </button>
      </div>

      <Field label={isWake ? "Ended" : "Started"}>
        <TimeStepper
          value={timeValue}
          max={Date.now()}
          min={isWake && isRest(event) ? event.at : undefined}
          onChange={(ms) => onPatch(isWake ? { endAt: ms } : { at: ms })}
        />
      </Field>
      {event.kind === "feed" && event.source === "breast" ? (
        <>
          <Field label="Side">
            <SideChips value={event.side} onChange={(side) => onPatch({ side })} />
          </Field>
          <Field label="Duration">
            <MinutesChips value={event.minutes} onChange={(minutes) => onPatch({ minutes })} />
          </Field>
        </>
      ) : null}
      {event.kind === "feed" && event.source === "bottle" ? (
        <Field label="Amount">
          <MlChips value={event.ml} onChange={(ml) => onPatch({ ml })} />
        </Field>
      ) : null}
      {event.kind !== "feed" && !isRest(event) ? <OtherFields event={event} onPatch={onPatch} /> : null}

      {capture.closedRestId && onStayedAsleep ? (
        <div
          className={`mb-4 flex h-14 items-center justify-between rounded-2xl border px-3 transition-colors ${
            stayedAsleep ? "border-primary/40 bg-primary/10" : "border-border bg-secondary/40"
          }`}
        >
          <div>
            <p className="text-sm font-bold text-foreground">Stayed asleep</p>
            <p className="text-xs text-muted-foreground">{stayedAsleep ? "dream feed, sleep continues" : "off: the baby woke up for this feed"}</p>
          </div>
          <Switch checked={!!stayedAsleep} label="Stayed asleep" onChange={onStayedAsleep} />
        </div>
      ) : null}

      <button
        type="button"
        onClick={onDone}
        className="surface-warm flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-bold active:scale-[0.98]"
      >
        <CheckIcon className="size-5" /> Done
      </button>

      {!paused ? (
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-1 origin-left bg-primary"
          style={{ transform: `scaleX(${left / COUNTDOWN})` }}
        />
      ) : null}
    </section>
  );
}
