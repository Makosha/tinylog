const MIN = 60_000;

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
  if (isSameDay(ms, nowMs - 24 * 60 * MIN)) return "yesterday";
  return new Date(ms).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}
