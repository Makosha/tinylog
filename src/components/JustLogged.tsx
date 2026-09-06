import { useEffect, useRef } from "react";
import { Undo2, X } from "lucide-react";
import { META, isRest, type LogEvent } from "@/domain/events";
import { formatTime } from "@/domain/time";
import { MlChips } from "./MlChips";
import { TimeChips } from "./TimeChips";

export interface Recent {
  eventId: string;
  /** what the tap did; decides which chips are shown */
  action: "feed" | "rest" | "wake";
  /** moment of the tap: chips are relative to it */
  tappedAt: number;
}

const TTL = 10_000;

export function JustLogged({
  recent,
  event,
  lastMl,
  onTime,
  onMl,
  onUndo,
  onDismiss,
}: {
  recent: Recent;
  event: LogEvent | undefined;
  lastMl?: number;
  onTime: (ms: number) => void;
  onMl: (ml: number | undefined) => void;
  onUndo: () => void;
  onDismiss: () => void;
}) {
  const timer = useRef<number>(0);
  const arm = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(onDismiss, TTL);
  };
  useEffect(() => {
    arm();
    return () => window.clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recent]);

  if (!event) return null;

  const isWake = recent.action === "wake";
  const meta = event.kind === "feed" ? META[event.source] : META[event.kind];
  const title = isWake ? `${META.wake.emoji} Woke up` : `${meta.emoji} ${meta.label}`;
  const timeValue = isWake && isRest(event) ? (event.endAt ?? recent.tappedAt) : event.at;

  return (
    <section
      className="card-soft animate-pop-in mb-4 border-primary/40 p-3 shadow-lg"
      onPointerDown={arm}
      aria-label="Just logged, adjust details"
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="font-semibold text-foreground">
          {title} <span className="text-muted-foreground">· {formatTime(timeValue)}</span>
        </p>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onUndo}
            className="flex h-9 items-center gap-1 rounded-full px-3 text-sm font-semibold text-destructive active:bg-secondary"
          >
            <Undo2 className="size-4" /> Undo
          </button>
          <button type="button" aria-label="Dismiss" onClick={onDismiss} className="flex size-9 items-center justify-center rounded-full text-muted-foreground active:bg-secondary">
            <X className="size-4" />
          </button>
        </div>
      </div>
      <Row label={isWake ? "ended" : "started"}>
        <TimeChips base={recent.tappedAt} value={timeValue} onChange={onTime} />
      </Row>
      {event.kind === "feed" ? (
        <Row label="amount">
          <MlChips value={event.ml} hint={lastMl} onChange={onMl} />
        </Row>
      ) : null}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-2 flex items-center gap-3">
      <span className="w-14 shrink-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}
