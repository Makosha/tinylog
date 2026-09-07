import { describe, it, expect } from "vitest";
import { eventDetail, eventLabel, parseEvents } from "./events";

describe("event labels and details", () => {
  it("describes every kind", () => {
    const T = 0;
    expect(eventDetail({ id: "1", kind: "temperature", at: T, celsius: 38.4 })).toBe("38.4°C · fever");
    expect(eventDetail({ id: "1", kind: "temperature", at: T, celsius: 36.6 })).toBe("36.6°C");
    expect(eventDetail({ id: "1", kind: "medicine", at: T, name: "Paracetamol", dose: "2.5 ml" })).toBe("Paracetamol · 2.5 ml");
    expect(eventDetail({ id: "1", kind: "tummy", at: T, minutes: 5 })).toBe("5m");
    expect(eventDetail({ id: "1", kind: "bath", at: T })).toBe("");
    expect(eventDetail({ id: "1", kind: "milestone", at: T, title: "Rolled over" })).toBe("Rolled over");
    expect(eventDetail({ id: "1", kind: "note", at: T, text: "hiccups after feed" })).toBe("hiccups after feed");
    expect(eventLabel({ id: "1", kind: "tummy", at: T })).toBe("Tummy time");
  });
  it("parseEvents accepts the new kinds and rejects unknown ones", () => {
    expect(parseEvents([{ id: "1", kind: "bath", at: 1 }])).toHaveLength(1);
    expect(parseEvents([{ id: "1", kind: "bogus", at: 1 }])).toBeNull();
  });
});
