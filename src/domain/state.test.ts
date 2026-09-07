import { describe, it, expect } from "vitest";
import {
  deriveState,
  feed,
  diaper,
  addOther,
  startRest,
  wake,
  reopenRest,
  updateEvent,
  deleteEvent,
  restoreEvent,
  isStale,
  mergeAroundFeed,
  restEndedByFeed,
} from "./state";
import type { LogEvent } from "./events";

const T0 = new Date(2026, 8, 7, 20, 0).getTime(); // local 20:00
const m = (n: number) => T0 + n * 60_000;
const h = (n: number) => T0 + n * 3_600_000;

describe("deriveState", () => {
  it("is awake with no events", () => {
    expect(deriveState([], T0)).toEqual({ name: "awake", since: T0 });
  });
  it("is awake since the first event of the day when no rest was ever logged", () => {
    const events: LogEvent[] = [
      { id: "b", kind: "feed", at: m(-30), source: "bottle" },
      { id: "a", kind: "feed", at: h(-5), source: "breast" },
    ];
    expect(deriveState(events, T0)).toEqual({ name: "awake", since: h(-5) });
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

describe("stale rests", () => {
  it("flags a nap over 3h and a sleep over 12h", () => {
    expect(isStale([{ id: "a", kind: "nap", at: h(-2) }], T0)).toBe(false);
    expect(isStale([{ id: "a", kind: "nap", at: h(-4) }], T0)).toBe(true);
    expect(isStale([{ id: "a", kind: "sleep", at: h(-11) }], T0)).toBe(false);
    expect(isStale([{ id: "a", kind: "sleep", at: h(-13) }], T0)).toBe(true);
  });
});

describe("transitions", () => {
  it("feed while awake inserts a feed and stays awake", () => {
    const { events, event, closedRestId } = feed([], "bottle", T0);
    expect(event).toMatchObject({ kind: "feed", source: "bottle", at: T0 });
    expect(closedRestId).toBeUndefined();
    expect(deriveState(events, T0)).toEqual({ name: "awake", since: T0 });
    expect(events[0]).toBe(event);
  });
  it("bottle feed can be prefilled with the last amount; breast ignores it", () => {
    expect(feed([], "bottle", T0, { ml: 120 }).event).toMatchObject({ ml: 120 });
    expect(feed([], "breast", T0, { ml: 120 }).event).not.toHaveProperty("ml");
  });
  it("feed while asleep wakes the baby and closes the sleep at the feed", () => {
    const { events, closedRestId } = feed([{ id: "a", kind: "sleep", at: m(-30) }], "breast", T0);
    expect(closedRestId).toBe("a");
    expect(events.find((e) => e.id === "a")).toMatchObject({ endAt: T0 });
    expect(deriveState(events, T0)).toEqual({ name: "awake", since: T0 });
  });
  it("feed backfilled to before the sleep started leaves the sleep open", () => {
    const { events, closedRestId } = feed([{ id: "a", kind: "sleep", at: m(-30) }], "breast", m(-40));
    expect(closedRestId).toBeUndefined();
    expect(deriveState(events, T0).name).toBe("asleep");
  });
  it("diaper never changes the state", () => {
    const { events, event } = diaper([{ id: "a", kind: "sleep", at: m(-30) }], T0);
    expect(event).toMatchObject({ kind: "diaper", wet: true, dirty: false });
    expect(deriveState(events, T0).name).toBe("asleep");
  });
  it("other events start with sensible defaults and never change the state", () => {
    const asleep: LogEvent[] = [{ id: "a", kind: "sleep", at: m(-30) }];
    expect(addOther(asleep, "temperature", T0).event).toMatchObject({ kind: "temperature", celsius: 36.8 });
    expect(addOther(asleep, "medicine", T0).event).toMatchObject({ kind: "medicine", name: "Vitamin D" });
    expect(addOther(asleep, "milestone", T0).event).toMatchObject({ kind: "milestone", title: "First smile" });
    for (const k of ["tummy", "bath", "note"] as const) expect(deriveState(addOther(asleep, k, T0).events, T0).name).toBe("asleep");
  });
  it("updateEvent drops an empty dose and zero tummy minutes", () => {
    const med = updateEvent([{ id: "x", kind: "medicine", at: T0, name: "Paracetamol", dose: "2.5 ml" }], "x", { dose: "" });
    expect(med[0]).not.toHaveProperty("dose");
    const tummy = updateEvent([{ id: "y", kind: "tummy", at: T0, minutes: 5 }], "y", { minutes: 0 });
    expect(tummy[0]).not.toHaveProperty("minutes");
  });
  it("reopenRest undoes the wake caused by a dream feed", () => {
    const { events } = feed([{ id: "a", kind: "sleep", at: m(-30) }], "breast", T0);
    expect(deriveState(reopenRest(events, "a"), T0)).toEqual({ name: "asleep", since: m(-30), eventId: "a" });
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

describe("stayed asleep after the fact", () => {
  const night: LogEvent[] = [
    { id: "s2", kind: "sleep", at: m(-20) },
    { id: "f", kind: "feed", at: m(-40), source: "breast" },
    { id: "s1", kind: "sleep", at: h(-3), endAt: m(-40) },
  ];
  it("finds the rest a feed ended", () => {
    expect(restEndedByFeed(night, "f")?.id).toBe("s1");
  });
  it("merges the rest before and after the feed into one", () => {
    const merged = mergeAroundFeed(night, "f");
    expect(merged.filter((e) => e.kind === "sleep")).toHaveLength(1);
    expect(merged.find((e) => e.id === "s1")).toEqual({ id: "s1", kind: "sleep", at: h(-3) });
    expect(deriveState(merged, T0)).toEqual({ name: "asleep", since: h(-3), eventId: "s1" });
  });
  it("just reopens the rest when no rest followed", () => {
    const merged = mergeAroundFeed(night.slice(1), "f");
    expect(merged.find((e) => e.id === "s1")).toEqual({ id: "s1", kind: "sleep", at: h(-3) });
  });
  it("does nothing for a feed that did not end a rest", () => {
    const events: LogEvent[] = [{ id: "f", kind: "feed", at: T0, source: "bottle" }];
    expect(mergeAroundFeed(events, "f")).toBe(events);
  });
});

describe("editing", () => {
  it("updateEvent patches and keeps endAt >= at", () => {
    const events = updateEvent([{ id: "a", kind: "nap", at: m(-30), endAt: m(-10) }], "a", { at: m(0) });
    expect(events[0]).toMatchObject({ at: m(0), endAt: m(0) });
  });
  it("updateEvent can turn a nap into a sleep", () => {
    const events = updateEvent([{ id: "a", kind: "nap", at: m(-30) }], "a", { kind: "sleep" });
    expect(events[0]?.kind).toBe("sleep");
  });
  it("switching a feed to breast drops ml; to bottle drops side and minutes", () => {
    const toBreast = updateEvent([{ id: "a", kind: "feed", at: T0, source: "bottle", ml: 90 }], "a", { source: "breast", side: "left", minutes: 15 });
    expect(toBreast[0]).toEqual({ id: "a", kind: "feed", at: T0, source: "breast", side: "left", minutes: 15 });
    const toBottle = updateEvent(toBreast, "a", { source: "bottle", ml: 60 });
    expect(toBottle[0]).toEqual({ id: "a", kind: "feed", at: T0, source: "bottle", ml: 60 });
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
  it("deleteEvent removes and returns to awake; restoreEvent brings it back", () => {
    const original: LogEvent = { id: "a", kind: "sleep", at: m(-30) };
    const events = deleteEvent([original], "a");
    expect(events).toEqual([]);
    expect(deriveState(events, T0).name).toBe("awake");
    expect(restoreEvent(events, original)).toEqual([original]);
  });
  it("restoreEvent refuses a second open rest", () => {
    const events: LogEvent[] = [{ id: "b", kind: "nap", at: m(-5) }];
    expect(restoreEvent(events, { id: "a", kind: "sleep", at: m(-30) })).toBe(events);
  });
});
