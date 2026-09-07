import { useEffect, useRef, useState } from "react";
import { isRest, type LogEvent } from "@/domain/events";
import type { EventPatch } from "@/domain/state";
import { useT } from "@/i18n/index";
import { labelOf } from "@/i18n/labels";
import { CheckIcon, CloseIcon, ICON, UndoIcon } from "./icons";
import { Field } from "./Field";
import { MinutesChips } from "./MinutesChips";
import { MlChips } from "./MlChips";
import { OtherFields } from "./OtherFields";
import { SideChips } from "./SideChips";
import { Switch } from "./Switch";
import { TimeStepper } from "./TimeStepper";
import { eventTone } from "./kind";

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
/** ignore touches for this long after the panel appears (double-tap protection) */
const GUARD = 350;

/**
 * Replaces the action buttons right after a tap and shows the fields that
 * matter for that event. Feeds, sleep and wake-ups close by themselves after
 * 10 s of no touching; "other" events stay open until Done.
 */
export function CapturePanel({
  capture,
  event,
  autoClose,
  stayedAsleep,
  onStayedAsleep,
  onPatch,
  onUndo,
  onDone,
}: {
  capture: Capture;
  event: LogEvent | undefined;
  autoClose: boolean;
  stayedAsleep?: boolean;
  onStayedAsleep?: (v: boolean) => void;
  onPatch: (p: EventPatch) => void;
  onUndo: () => void;
  onDone: () => void;
}) {
  const { t } = useT();
  const [guarded, setGuarded] = useState(true);
  const [round, setRound] = useState(0);
  const [hidden, setHidden] = useState(() => document.visibilityState !== "visible");
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    setGuarded(true);
    setRound(0);
    const id = window.setTimeout(() => setGuarded(false), GUARD);
    return () => window.clearTimeout(id);
  }, [capture]);

  useEffect(() => {
    const onVis = () => {
      const h = document.visibilityState !== "visible";
      setHidden(h);
      if (!h) setRound((r) => r + 1);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    if (!autoClose || hidden) return;
    const id = window.setTimeout(() => doneRef.current(), COUNTDOWN);
    return () => window.clearTimeout(id);
  }, [autoClose, hidden, round, capture]);

  const restart = () => setRound((r) => r + 1);

  if (!event) return null;

  const isWake = capture.action === "wake";
  const kind = isWake ? "wake" : event.kind === "feed" ? event.source : event.kind;
  const Icon = ICON[kind];
  const tone = isWake ? "text-wake" : eventTone(event);
  const title = isWake ? t.kind.wokeUp : labelOf(t, event);
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
        restart();
      }}
      onPointerUpCapture={restart}
      className={`card-soft animate-pop-in relative border-primary/40 p-4 shadow-lg ${guarded ? "pointer-events-none" : ""}`}
    >
      <div className="mb-4 flex items-center gap-3">
        <span className={`icon-tile size-11 ${tone}`}>
          <Icon className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 font-display text-xl font-bold leading-tight text-foreground">
            <span className="truncate">{title}</span>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-nap/20 px-2 py-0.5 font-sans text-xs font-bold text-nap">
              <CheckIcon className="size-3.5" /> {t.capture.savedBadge}
            </span>
          </p>
        </div>
        <button type="button" onClick={onUndo} className="flex h-10 items-center gap-1.5 rounded-xl px-2.5 text-sm font-semibold text-muted-foreground active:bg-secondary">
          <UndoIcon className="size-4" /> {t.capture.undo}
        </button>
        {autoClose ? (
          <button type="button" aria-label={t.capture.close} onClick={onDone} className="flex size-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground active:bg-secondary">
            <CloseIcon className="size-5" />
          </button>
        ) : null}
      </div>

      <Field label={isWake ? t.when.wake : t.when[kind as keyof typeof t.when]}>
        <TimeStepper value={timeValue} max={Date.now()} min={isWake && isRest(event) ? event.at : undefined} onChange={(ms) => onPatch(isWake ? { endAt: ms } : { at: ms })} />
      </Field>
      {event.kind === "feed" && event.source === "breast" ? (
        <>
          <Field label={t.capture.side}>
            <SideChips value={event.side} onChange={(side) => onPatch({ side })} />
          </Field>
          <Field label={t.capture.duration}>
            <MinutesChips value={event.minutes} onChange={(minutes) => onPatch({ minutes })} />
          </Field>
        </>
      ) : null}
      {event.kind === "feed" && event.source === "bottle" ? (
        <Field label={t.capture.amount}>
          <MlChips value={event.ml} onChange={(ml) => onPatch({ ml })} />
        </Field>
      ) : null}
      {event.kind !== "feed" && !isRest(event) ? <OtherFields event={event} onPatch={onPatch} /> : null}

      {capture.closedRestId && onStayedAsleep ? (
        <div className={`mb-4 flex h-14 items-center justify-between rounded-2xl border px-3 transition-colors ${stayedAsleep ? "border-primary/40 bg-primary/10" : "border-border bg-secondary/40"}`}>
          <div>
            <p className="text-sm font-bold text-foreground">{t.capture.stayedAsleep}</p>
            <p className="text-xs text-muted-foreground">{stayedAsleep ? t.capture.stayedAsleepOn : t.capture.stayedAsleepOff}</p>
          </div>
          <Switch checked={!!stayedAsleep} label={t.capture.stayedAsleep} onChange={onStayedAsleep} />
        </div>
      ) : null}

      {autoClose ? (
        <p className="mt-1 text-center text-xs text-muted-foreground">{t.capture.savedAuto}</p>
      ) : (
        <button type="button" onClick={onDone} className="surface-warm flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-bold active:scale-[0.98]">
          <CheckIcon className="size-5" /> {t.capture.done}
        </button>
      )}

    </section>
  );
}
