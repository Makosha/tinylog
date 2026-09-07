import { useState } from "react";
import { eventDetail, eventLabel, isRest, type LogEvent } from "@/domain/events";
import type { TimelineItem } from "@/domain/stats";
import { durationLabel, formatTime } from "@/domain/time";
import { ICON } from "./icons";

const TONE = { feed: "", sleep: "text-sleep", nap: "text-nap", diaper: "text-wake" } as const;

function Row({
  Icon,
  tone,
  title,
  detail,
  sub,
  time,
  open,
  onClick,
  nested,
}: {
  Icon: (p: React.SVGProps<SVGSVGElement>) => React.ReactElement;
  tone: string;
  title: string;
  detail?: string;
  /** second line under the title */
  sub?: string;
  time: string;
  open?: boolean;
  onClick: () => void;
  nested?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 text-left active:scale-[0.99] ${nested ? "py-2" : `card-soft p-3 ${open ? "border-sleep/50" : ""}`}`}
    >
      <span className={`icon-tile shrink-0 ${nested ? "size-9" : "size-11"} ${tone}`}>
        <Icon className={nested ? "size-5" : "size-6"} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold text-foreground">
          {title}
          {detail ? <span className={`ml-2 text-sm font-normal ${open ? "text-sleep" : "text-muted-foreground"}`}>{detail}</span> : null}
        </p>
        {sub ? <p className={`truncate text-sm ${open ? "text-sleep" : "text-muted-foreground"}`}>{sub}</p> : null}
      </div>
      <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">{time}</p>
    </button>
  );
}

function eventRow(e: LogEvent, now: number, onSelect: (e: LogEvent) => void, nested?: boolean) {
  const Icon = ICON[e.kind === "feed" ? e.source : e.kind];
  const open = isRest(e) && e.endAt === undefined;
  const tone = e.kind === "feed" ? (e.source === "breast" ? "text-breast" : "text-feed") : TONE[e.kind];
  const detail = open ? `still ${e.kind === "sleep" ? "asleep" : "napping"} · ${durationLabel(e.at, now)}` : isRest(e) ? durationLabel(e.at, e.endAt!) : eventDetail(e);
  const time = isRest(e) ? `${formatTime(e.at)} → ${e.endAt !== undefined ? formatTime(e.endAt) : "now"}` : formatTime(e.at);
  return <Row key={e.id} Icon={Icon} tone={tone} title={eventLabel(e)} detail={detail} time={time} open={open} onClick={() => onSelect(e)} nested={nested} />;
}

export function Timeline({ items, now, onSelect }: { items: TimelineItem[]; now: number; onSelect: (e: LogEvent) => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  if (!items.length) {
    return <p className="card-soft p-6 text-center text-sm text-muted-foreground">Nothing logged yet. Tap a button above.</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((it) => {
        if (it.type === "event") return <li key={it.event.id}>{eventRow(it.event, now, onSelect)}</li>;
        const key = it.parts[0]!.id;
        const isOpen = expanded === key;
        const total = it.parts.reduce((s, p) => s + ((p.endAt ?? now) - p.at), 0);
        return (
          <li key={key} className={`card-soft p-3 ${it.open ? "border-sleep/50" : ""}`}>
            <Row
              Icon={ICON.sleep}
              tone="text-sleep"
              title="Night"
              sub={`${durationLabel(0, total)} · ${it.wakings} ${it.wakings === 1 ? "waking" : "wakings"}${it.open ? " · still asleep" : ""}`}
              time={`${formatTime(it.at)} → ${it.endAt !== undefined ? formatTime(it.endAt) : "now"}`}
              open={it.open}
              onClick={() => setExpanded(isOpen ? null : key)}
              nested
            />
            {isOpen ? (
              <div className="mt-1 border-t border-border pl-1">
                {[...it.parts, ...it.inside]
                  .sort((a, b) => b.at - a.at)
                  .map((e) => eventRow(e, now, onSelect, true))}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
