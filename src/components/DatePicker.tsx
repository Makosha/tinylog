import { useState } from "react";
import { isSameDay, startOfDay } from "@/domain/time";
import { CloseIcon } from "./icons";
import { Sheet } from "./Sheet";

const DAY = 86_400_000;

/** A date shown the app's way; tap to open the calendar. */
export function DateField({
  value,
  placeholder = "not set",
  max,
  min,
  onChange,
  label,
}: {
  value: number | undefined;
  placeholder?: string;
  max?: number;
  min?: number;
  onChange: (ms: number | undefined) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`flex h-12 flex-1 items-center rounded-2xl border border-border bg-secondary/60 px-3 text-left text-base ${value ? "font-semibold text-foreground" : "text-muted-foreground"}`}
        >
          {value ? new Date(value).toLocaleDateString([], { weekday: "short", day: "numeric", month: "long", year: "numeric" }) : placeholder}
        </button>
        {value !== undefined ? (
          <button type="button" aria-label={`Clear ${label}`} onClick={() => onChange(undefined)} className="flex size-12 items-center justify-center rounded-2xl border border-border bg-secondary/60 text-muted-foreground active:scale-95">
            <CloseIcon className="size-4" />
          </button>
        ) : null}
      </div>
      {open ? (
        <CalendarSheet
          label={label}
          value={value}
          max={max}
          min={min}
          onPick={(ms) => {
            onChange(ms);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

/** Month grid. Weeks start on Monday. */
export function CalendarSheet({
  label,
  value,
  max,
  min,
  onPick,
  onClose,
}: {
  label: string;
  value: number | undefined;
  max?: number;
  min?: number;
  onPick: (ms: number) => void;
  onClose: () => void;
}) {
  const today = startOfDay(Date.now());
  const initial = new Date(value ?? Math.min(today, max ?? today));
  const [month, setMonth] = useState(() => new Date(initial.getFullYear(), initial.getMonth(), 1));

  const first = new Date(month);
  const lead = (first.getDay() + 6) % 7; // Monday = 0
  const gridStart = new Date(first);
  gridStart.setDate(1 - lead);
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    cells.push(d);
  }
  const weekdays = cells.slice(0, 7).map((d) => d.toLocaleDateString([], { weekday: "narrow" }));
  const shift = (n: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + n, 1));
  const canGoNext = max === undefined || new Date(month.getFullYear(), month.getMonth() + 1, 1).getTime() <= max;
  const nav = "flex size-11 items-center justify-center rounded-2xl border border-border bg-secondary/60 text-lg font-bold text-foreground active:scale-95 disabled:opacity-40";

  return (
    <Sheet label={label} onClose={onClose}>
      <div className="mb-3 flex items-center justify-between">
        <p className="font-display text-xl font-bold text-foreground">{label}</p>
        <button type="button" aria-label="Close" onClick={onClose} className="flex size-11 items-center justify-center rounded-2xl border border-border bg-secondary/60 text-foreground active:scale-95">
          <CloseIcon className="size-5" />
        </button>
      </div>
      <div className="mb-2 flex items-center justify-between">
        <button type="button" aria-label="Previous month" onClick={() => shift(-1)} className={nav}>
          ‹
        </button>
        <p className="font-display text-lg font-bold text-foreground">{month.toLocaleDateString([], { month: "long", year: "numeric" })}</p>
        <button type="button" aria-label="Next month" disabled={!canGoNext} onClick={() => shift(1)} className={nav}>
          ›
        </button>
      </div>
      <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {weekdays.map((w, i) => (
          <span key={i} className="py-1">
            {w}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d) => {
          const ms = d.getTime();
          const inMonth = d.getMonth() === month.getMonth();
          const disabled = (max !== undefined && ms > max) || (min !== undefined && ms < min);
          const selected = value !== undefined && isSameDay(ms, value);
          const isToday = isSameDay(ms, today);
          return (
            <button
              key={ms}
              type="button"
              disabled={disabled}
              onClick={() => onPick(ms + 12 * 60 * 60_000)}
              aria-label={d.toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" })}
              aria-pressed={selected}
              className={`flex h-11 items-center justify-center rounded-xl text-sm font-semibold tabular-nums transition-transform active:scale-95 disabled:opacity-25 ${
                selected
                  ? "bg-primary text-primary-foreground"
                  : isToday
                    ? "border border-primary/60 text-primary"
                    : inMonth
                      ? "text-foreground"
                      : "text-muted-foreground/60"
              }`}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex justify-end">
        <button type="button" onClick={() => onPick(today + 12 * 60 * 60_000)} disabled={max !== undefined && today > max} className="h-10 rounded-xl px-3 text-sm font-bold text-primary active:bg-secondary disabled:opacity-40">
          Today
        </button>
      </div>
    </Sheet>
  );
}

export { DAY };
