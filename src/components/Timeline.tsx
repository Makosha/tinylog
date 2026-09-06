import { META, isRest, type LogEvent } from "@/domain/events";
import { durationLabel, formatTime } from "@/domain/time";

const RING: Record<string, string> = {
  feed: "bg-feed/15",
  sleep: "bg-sleep/15",
  nap: "bg-nap/15",
};

export function Timeline({ events, now, onSelect }: { events: LogEvent[]; now: number; onSelect: (e: LogEvent) => void }) {
  if (!events.length) {
    return <p className="card-soft p-6 text-center text-sm text-muted-foreground">Nothing logged yet today. Tap a button above.</p>;
  }
  return (
    <ul className="space-y-2">
      {events.map((e) => {
        const meta = e.kind === "feed" ? META[e.source] : META[e.kind];
        const open = isRest(e) && e.endAt === undefined;
        return (
          <li key={e.id}>
            <button
              type="button"
              onClick={() => onSelect(e)}
              className={`card-soft flex w-full items-center gap-3 p-3 text-left active:scale-[0.99] ${open ? "border-primary/40" : ""}`}
            >
              <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl text-xl ${RING[e.kind]}`}>{meta.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-foreground">
                  {meta.label}
                  {e.kind === "feed" && e.ml ? <span className="ml-2 text-sm font-normal text-muted-foreground">{e.ml}ml</span> : null}
                  {open ? <span className="ml-2 text-sm font-normal text-primary">still {e.kind === "sleep" ? "asleep" : "napping"}</span> : null}
                </p>
                <p className="text-sm tabular-nums text-muted-foreground">
                  {formatTime(e.at)}
                  {isRest(e) ? ` – ${e.endAt !== undefined ? formatTime(e.endAt) : "…"} · ${durationLabel(e.at, e.endAt ?? now)}` : ""}
                </p>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
