import { useState } from "react";
import { isRest, type LogEvent } from "@/domain/events";
import type { TimelineItem } from "@/domain/stats";
import { durationLabel } from "@/domain/time";
import type { Units } from "@/domain/units";
import { useUnits } from "@/store/store";
import { fill, useT } from "@/i18n/index";
import type { Dict } from "@/i18n/en";
import { detailOf, fmtTime, labelOf } from "@/i18n/labels";
import { ICON } from "./icons";
import { eventTone, iconKey } from "./kind";

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
  sub?: string;
  time: string;
  open?: boolean;
  onClick: () => void;
  nested?: boolean;
}) {
  return (
    <button type="button" onClick={onClick} className={`flex w-full items-center gap-3 text-left active:scale-[0.99] ${nested ? "py-2" : `card-soft p-3 ${open ? "border-sleep/50" : ""}`}`}>
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

function eventRow(t: Dict, locale: string, e: LogEvent, now: number, units: Units, onSelect: (e: LogEvent) => void, nested?: boolean) {
  const Icon = ICON[iconKey(e)];
  const open = isRest(e) && e.endAt === undefined;
  const detail = open
    ? `${e.kind === "sleep" ? t.time.stillAsleep : t.time.stillNapping} · ${durationLabel(e.at, now)}`
    : isRest(e)
      ? durationLabel(e.at, e.endAt!)
      : detailOf(t, e, units);
  const time = isRest(e) ? `${fmtTime(locale, e.at)} → ${e.endAt !== undefined ? fmtTime(locale, e.endAt) : t.time.now}` : fmtTime(locale, e.at);
  return <Row key={e.id} Icon={Icon} tone={eventTone(e)} title={labelOf(t, e)} detail={detail} time={time} open={open} onClick={() => onSelect(e)} nested={nested} />;
}

export function Timeline({ items, now, onSelect }: { items: TimelineItem[]; now: number; onSelect: (e: LogEvent) => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const units = useUnits();
  const { t, locale } = useT();
  if (!items.length) {
    return <p className="card-soft p-6 text-center text-sm text-muted-foreground">{t.home.nothingLogged}</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((it) => {
        if (it.type === "event") return <li key={it.event.id}>{eventRow(t, locale, it.event, now, units, onSelect)}</li>;
        const key = it.parts[0]!.id;
        const isOpen = expanded === key;
        const total = it.parts.reduce((s, p) => s + ((p.endAt ?? now) - p.at), 0);
        return (
          <li key={key} className={`card-soft p-3 ${it.open ? "border-sleep/50" : ""}`}>
            <Row
              Icon={ICON.sleep}
              tone="text-sleep"
              title={t.kind.night}
              sub={`${durationLabel(0, total)} · ${fill(t.time.wakings, { n: it.wakings })}${it.open ? ` · ${t.time.stillAsleep}` : ""}`}
              time={`${fmtTime(locale, it.at)} → ${it.endAt !== undefined ? fmtTime(locale, it.endAt) : t.time.now}`}
              open={it.open}
              onClick={() => setExpanded(isOpen ? null : key)}
              nested
            />
            {isOpen ? (
              <div className="mt-1 border-t border-border pl-1">
                {[...it.parts, ...it.inside].sort((a, b) => b.at - a.at).map((e) => eventRow(t, locale, e, now, units, onSelect, true))}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
