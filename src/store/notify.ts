import { useEffect, useRef, useState } from "react";
import { useStore } from "./store";
import { deriveState } from "@/domain/state";
import { upcomingReminders, type Reminder } from "@/domain/reminders";
import { durationLabel } from "@/domain/time";
import { DICTS, fill } from "@/i18n/index";

export type Permission = "granted" | "denied" | "default" | "unsupported";

export const notificationsSupported = () => typeof window !== "undefined" && "Notification" in window;

export function permissionState(): Permission {
  return notificationsSupported() ? (Notification.permission as Permission) : "unsupported";
}

export async function requestPermission(): Promise<Permission> {
  if (!notificationsSupported()) return "unsupported";
  try {
    return (await Notification.requestPermission()) as Permission;
  } catch {
    return permissionState();
  }
}

/** Shows through the service worker when it has one (needed on Android), else directly. */
export async function showNotification(title: string, body: string, tag: string) {
  if (permissionState() !== "granted") return false;
  const opts: NotificationOptions = { body, tag, icon: `${import.meta.env.BASE_URL}icon-192.png`, badge: `${import.meta.env.BASE_URL}icon-192.png` };
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) {
      await reg.showNotification(title, opts);
      return true;
    }
  } catch {
    /* fall through */
  }
  try {
    new Notification(title, opts);
    return true;
  } catch {
    return false;
  }
}

/** Keys already fired this session, so a reminder never repeats after a re-render. */
const fired = new Set<string>();

/**
 * Schedules the state-driven reminders while the page is alive. Re-plans on
 * every store change and whenever the app comes back to the foreground.
 */
export function useReminderScheduler() {
  const { events, prefs } = useStore();
  const timers = useRef<number[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const onVis = () => document.visibilityState === "visible" && setTick((n) => n + 1);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    const r = prefs.reminders;
    if (!r?.enabled || permissionState() !== "granted") return;
    const now = Date.now();
    const t = DICTS[prefs.lang ?? "en"];
    const state = deriveState(events, now);
    const want = (x: Reminder) => (x.kind === "feed" ? r.feed : x.kind === "rest" ? r.rest : r.stale);
    for (const rem of upcomingReminders(events, state, now, prefs.babyDob)) {
      if (!want(rem) || fired.has(rem.key)) continue;
      // missed while the page was asleep: fire if it is less than an hour overdue
      const delay = rem.at - now;
      if (delay < -60 * 60_000) continue;
      const id = window.setTimeout(async () => {
        if (fired.has(rem.key)) return;
        fired.add(rem.key);
        const since = durationLabel(rem.kind === "feed" ? events.find((e) => e.kind === "feed")!.at : state.since, Date.now());
        const title = rem.kind === "feed" ? t.reminders.feedDue : rem.kind === "rest" ? (rem.restKind === "sleep" ? t.reminders.sleepDue : t.reminders.restDue) : t.reminders.staleTitle;
        const body = rem.kind === "feed" ? fill(t.reminders.feedDueBody, { t: since }) : rem.kind === "rest" ? fill(t.reminders.restDueBody, { t: since }) : fill(t.reminders.staleBody, { t: since });
        await showNotification(title, body, rem.key);
      }, Math.max(0, delay));
      timers.current.push(id);
    }
    return () => {
      timers.current.forEach((id) => window.clearTimeout(id));
      timers.current = [];
    };
  }, [events, prefs.reminders, prefs.lang, prefs.babyDob, tick]);
}
