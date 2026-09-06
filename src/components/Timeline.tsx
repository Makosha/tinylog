import { eventLabel, isRest, type LogEvent } from "@/domain/events";
import { durationLabel, formatTime } from "@/domain/time";
import { ICON } from "./icons";

const TONE = { feed: "text-feed", sleep: "text-sleep", nap: "text-nap" } as const;

export function Timeline({ events, now, onSelect }: { events: LogEvent[]; now: number; onSelect: (e: LogEvent) => void }) {
  if (!events.length) {
    return <p className="card-soft p-6 text-center text-sm text-muted-foreground">Nothing logged yet today. Tap a button above.</p>;
  }
  return (
    <ul className="space-y-2">
      {events.map((e) => {
        const Icon = ICON[e.kind === "feed" ? e.source : e.kind];
        const open = isRest(e) && e.endAt === undefined;
        const detail =
          e.kind === "feed"
            ? [e.side, e.ml ? `${e.ml}ml` : null].filter(Boolean).join(" · ")
            : open
              ? `still ${e.kind === "sleep" ? "asleep" : "napping"}`
              : "";
        return (
          <li key={e.id}>
            <button
              type="button"
              onClick={() => onSelect(e)}
              className={`card-soft flex w-full items-center gap-3 p-3 text-left active:scale-[0.99] ${open ? "border-primary/40" : ""}`}
            >
              <span className={`icon-tile size-11 shrink-0 ${TONE[e.kind]}`}>
                <Icon className="size-6" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-foreground">
                  {eventLabel(e)}
                  {detail ? <span className={`ml-2 text-sm font-normal ${open ? "text-primary" : "text-muted-foreground"}`}>{detail}</span> : null}
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
