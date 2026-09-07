import { describe, it, expect } from "vitest";
import { upcomingReminders } from "./reminders";
import type { LogEvent } from "./events";

const MIN = 60_000;
const noon = new Date(2026, 8, 7, 12, 0).getTime();
const m = (n: number) => noon + n * MIN;

describe("upcomingReminders", () => {
  it("feed and rest while awake", () => {
    const events: LogEvent[] = [
      { id: "f1", kind: "feed", at: m(-30), source: "bottle" },
      { id: "n", kind: "nap", at: m(-120), endAt: m(-40) },
    ];
    const r = upcomingReminders(events, { name: "awake", since: m(-40) }, noon);
    expect(r.map((x) => x.kind)).toEqual(["rest", "feed"]);
    expect(r.find((x) => x.kind === "rest")).toMatchObject({ at: m(-40 + 75), restKind: "nap", key: `rest:${m(-40)}` });
    expect(r.find((x) => x.kind === "feed")).toMatchObject({ at: m(-30 + 150), key: "feed:f1" });
  });
  it("stale instead of rest while asleep", () => {
    const events: LogEvent[] = [{ id: "s", kind: "sleep", at: m(-60) }];
    const r = upcomingReminders(events, { name: "asleep", since: m(-60), eventId: "s" }, noon);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ kind: "stale", at: m(-60 + 12 * 60), key: "stale:s" });
  });
  it("suggests sleep rather than nap when the window ends at night", () => {
    const evening = new Date(2026, 8, 7, 19, 30).getTime();
    const r = upcomingReminders([], { name: "awake", since: evening - 10 * MIN }, evening);
    expect(r[0]).toMatchObject({ kind: "rest", restKind: "sleep" });
  });
});
