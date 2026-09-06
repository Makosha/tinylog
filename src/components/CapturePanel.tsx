import { useEffect, useRef, useState } from "react";
import { LABEL, isRest, type LogEvent } from "@/domain/events";
import type { EventPatch } from "@/domain/state";
import { CheckIcon, ICON, UndoIcon } from "./icons";
import { MlChips } from "./MlChips";
import { SideChips } from "./SideChips";
import { Switch } from "./Switch";
import { TimeStepper } from "./TimeStepper";

export interface Capture {
  eventId: string;
  /** what the tap did; decides which fields are shown */
  action: "feed" | "rest" | "wake";
  /** moment of the tap */
  tappedAt: number;
  /** feed only: the rest this feed interrupted (baby woke up to feed) */
  closedRestId?: string;
}

const COUNTDOWN = 10_000;
const TICK = 50;

/**
 * Replaces the action buttons right after a tap. Shows the fields that
 * matter for that event with a 10 s countdown; any touch pauses it.
 */
export function CapturePanel({
  capture,
  event,
  lastMl,
  stayedAsleep,
  onStayedAsleep,
  onPatch,
  onUndo,
  onDone,
}: {
  capture: Capture;
  event: LogEvent | undefined;
  lastMl?: number;
  /** feed that interrupted a rest: whether the baby actually stayed asleep (dream feed) */
  stayedAsleep?: boolean;
  onStayedAsleep?: (v: boolean) => void;
  onPatch: (p: EventPatch) => void;
  onUndo: () => void;
  onDone: () => void;
}) {
  const [left, setLeft] = useState(COUNTDOWN);
  const [paused, setPaused] = useState(false);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    setLeft(COUNTDOWN);
    setPaused(false);
  }, [capture]);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => setLeft((l) => Math.max(0, l - TICK)), TICK);
    return () => window.clearInterval(id);
  }, [paused, capture]);

  useEffect(() => {
    if (left === 0 && !paused) doneRef.current();
  }, [left, paused]);

  if (!event) return null;

  const isWake = capture.action === "wake";
  const kind = isWake ? "wake" : event.kind === "feed" ? event.source : event.kind;
  const Icon = ICON[kind];
  const tone = { wake: "text-wake", breast: "text-feed", bottle: "text-feed", sleep: "text-sleep", nap: "text-nap" }[kind];
  const title = isWake ? "Woke up" : LABEL[kind];
  const timeValue = isWake && isRest(event) ? (event.endAt ?? capture.tappedAt) : event.at;

  return (
    <section
      aria-label={`${title} logged, adjust details`}
      onPointerDownCapture={() => setPaused(true)}
      className="card-soft animate-pop-in border-primary/40 p-4 shadow-lg"
    >
      <div className="mb-3 flex items-center gap-3">
        <span className={`icon-tile size-11 ${tone}`}>
          <Icon className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-xl font-bold leading-tight text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{paused ? "saved · tap done when finished" : "saved · closing in a moment"}</p>
        </div>
        <span
          className="rounded-[18px] p-[3px] transition-[background]"
          style={{ background: paused ? "transparent" : `conic-gradient(var(--primary) ${(left / COUNTDOWN) * 100}%, transparent 0)` }}
        >
          <button
            type="button"
            onClick={onDone}
            className="surface-warm flex h-11 items-center gap-1.5 rounded-2xl px-4 text-sm font-bold active:scale-95"
          >
            <CheckIcon className="size-4" /> Done
          </button>
        </span>
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
        <Field label="Side">
          <SideChips value={event.side} onChange={(side) => onPatch({ side })} />
        </Field>
      ) : null}
      {event.kind === "feed" ? (
        <Field label="Amount">
          <MlChips value={event.ml} hint={lastMl} onChange={(ml) => onPatch({ ml })} />
        </Field>
      ) : null}

      {capture.closedRestId && onStayedAsleep ? (
        <div className="mb-3 flex h-12 items-center justify-between rounded-2xl border border-border bg-secondary/40 px-3">
          <span className="text-sm font-semibold text-foreground">
            {stayedAsleep ? "Stayed asleep · dream feed" : "Woke up for this feed"}
          </span>
          <Switch checked={!!stayedAsleep} label="Stayed asleep" onChange={onStayedAsleep} />
        </div>
      ) : null}

      <button
        type="button"
        onClick={onUndo}
        className="mt-1 flex h-10 items-center gap-1.5 rounded-xl px-2 text-sm font-semibold text-muted-foreground active:bg-secondary"
      >
        <UndoIcon className="size-4" /> Undo
      </button>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}
