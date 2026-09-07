const MIN = 60_000;
const HOUR = 60 * MIN;

export function formatTime(ms: number) {
  return new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function durationLabel(startMs: number, endMs: number) {
  const mins = Math.max(0, Math.round((endMs - startMs) / MIN));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

export function isSameDay(a: number, b: number) {
  const x = new Date(a);
  const y = new Date(b);
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate();
}

export const startOfDay = (ms: number) => new Date(ms).setHours(0, 0, 0, 0);

/** "HH:MM" for a native <input type="time">. */
export function toTimeInput(ms: number) {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/**
 * Apply a time-of-day ("HH:MM") to the date of `baseMs`. If the result is
 * in the future relative to `nowMs`, assume the user meant yesterday.
 */
export function resolveTimeOfDay(baseMs: number, hhmm: string, nowMs = Date.now()) {
  const [h, m] = hhmm.split(":").map((s) => parseInt(s, 10));
  if (h === undefined || m === undefined || Number.isNaN(h) || Number.isNaN(m)) return baseMs;
  const d = new Date(baseMs);
  d.setHours(h, m, 0, 0);
  if (d.getTime() > nowMs + MIN) d.setDate(d.getDate() - 1);
  return d.getTime();
}

export function dayLabel(ms: number, nowMs = Date.now()) {
  if (isSameDay(ms, nowMs)) return "today";
  if (isSameDay(ms, nowMs - 24 * HOUR)) return "yesterday";
  return new Date(ms).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

const GRID = 5 * MIN;

/**
 * Move `value` by `stepMins`, then snap to the 5-minute grid in the direction
 * of the move: −5 at 1:44 gives 1:40, +5 at 1:44 gives 1:45, −5 at 1:40 gives 1:35.
 */
export function stepSnapped(value: number, stepMins: number) {
  const target = value + stepMins * MIN;
  const offset = new Date(target).getTimezoneOffset() * MIN;
  const local = target - offset;
  const snapped = stepMins < 0 ? Math.ceil(local / GRID) * GRID : Math.floor(local / GRID) * GRID;
  return snapped + offset;
}

/** "day 6" from a birth date; day 1 is the birth day. */
export function ageLabel(dobMs: number, nowMs: number) {
  const days = Math.floor((startOfDay(nowMs) - startOfDay(dobMs)) / (24 * HOUR)) + 1;
  if (days < 1) return "";
  if (days <= 28) return `day ${days}`;
  const weeks = Math.floor((days - 1) / 7);
  if (weeks < 16) return `${weeks} weeks`;
  return `${Math.floor((days - 1) / 30.44)} months`;
}
