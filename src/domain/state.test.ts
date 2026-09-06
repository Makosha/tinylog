import { describe, it, expect } from "vitest";
import { deriveState, feed, startRest, wake, updateEvent, deleteEvent } from "./state";
import type { LogEvent } from "./events";

const T0 = Date.parse("2026-09-07T20:00:00Z");
const m = (n: number) => T0 + n * 60_000;

describe("deriveState", () => {
  it("is awake with no events", () => {
    expect(deriveState([], T0)).toEqual({ name: "awake", since: T0 });
  });
  it("is asleep when a sleep is open", () => {
    const events: LogEvent[] = [{ id: "a", kind: "sleep", at: m(-30) }];
    expect(deriveState(events, T0)).toEqual({ name: "asleep", since: m(-30), eventId: "a" });
  });
  it("is napping when a nap is open", () => {
    const events: LogEvent[] = [{ id: "a", kind: "nap", at: m(-10) }];
    expect(deriveState(events, T0)).toEqual({ name: "napping", since: m(-10), eventId: "a" });
  });
  it("is awake since the end of the last rest", () => {
    const events: LogEvent[] = [
      { id: "b", kind: "feed", at: m(-5), source: "breast" },
      { id: "a", kind: "nap", at: m(-60), endAt: m(-20) },
    ];
    expect(deriveState(events, T0)).toEqual({ name: "awake", since: m(-20) });
  });
});

describe("transitions", () => {
  it("feed inserts a feed without changing state", () => {
    const { events, event } = feed([{ id: "a", kind: "sleep", at: m(-30) }], "bottle", T0);
    expect(event).toMatchObject({ kind: "feed", source: "bottle", at: T0 });
    expect(deriveState(events, T0).name).toBe("asleep");
    expect(events[0]).toBe(event); // newest first
  });
  it("startRest from awake opens a rest", () => {
    const { events, event } = startRest([], "nap", T0);
    expect(event).toMatchObject({ kind: "nap", at: T0 });
    expect(event.endAt).toBeUndefined();
    expect(deriveState(events, T0).name).toBe("napping");
  });
  it("startRest while a rest is open closes it at the new start", () => {
    const { events } = startRest([{ id: "a", kind: "nap", at: m(-30) }], "sleep", T0);
    expect(events).toHaveLength(2);
    expect(events.find((e) => e.id === "a")).toMatchObject({ endAt: T0 });
    expect(deriveState(events, T0).name).toBe("asleep");
  });
  it("startRest backfilled before the open rest deletes the open rest", () => {
    const { events } = startRest([{ id: "a", kind: "nap", at: m(-10) }], "sleep", m(-20));
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ kind: "sleep", at: m(-20) });
  });
  it("wake closes the open rest", () => {
    const { events, event } = wake([{ id: "a", kind: "sleep", at: m(-30) }], T0);
    expect(event).toMatchObject({ id: "a", endAt: T0 });
    expect(deriveState(events, T0)).toEqual({ name: "awake", since: T0 });
  });
  it("wake clamps end to be no earlier than start", () => {
    const { events } = wake([{ id: "a", kind: "sleep", at: m(-30) }], m(-45));
    expect(events[0]).toMatchObject({ endAt: m(-30) });
  });
  it("wake is a no-op when awake", () => {
    const initial: LogEvent[] = [{ id: "a", kind: "nap", at: m(-30), endAt: m(-10) }];
    const { events, event } = wake(initial, T0);
    expect(event).toBeNull();
    expect(events).toBe(initial);
  });
});

describe("editing", () => {
  it("updateEvent patches and keeps endAt >= at", () => {
    const events = updateEvent(
      [{ id: "a", kind: "nap", at: m(-30), endAt: m(-10) }],
      "a",
      { at: m(0) },
    );
    expect(events[0]).toMatchObject({ at: m(0), endAt: m(0) });
  });
  it("updateEvent re-sorts newest first", () => {
    const events = updateEvent(
      [
        { id: "b", kind: "feed", at: m(-5), source: "breast" },
        { id: "a", kind: "feed", at: m(-50), source: "bottle" },
      ],
      "a",
      { at: m(0) },
    );
    expect(events.map((e) => e.id)).toEqual(["a", "b"]);
  });
  it("deleteEvent removes and returns to awake", () => {
    const events = deleteEvent([{ id: "a", kind: "sleep", at: m(-30) }], "a");
    expect(events).toEqual([]);
    expect(deriveState(events, T0).name).toBe("awake");
  });
});
