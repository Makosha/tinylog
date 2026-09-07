import { describe, it, expect } from "vitest";
import { DICTS, LANGS, detectLang, fill } from "./index";
import { en } from "./en";

function keys(o: unknown, prefix = ""): string[] {
  if (typeof o !== "object" || o === null) return [prefix];
  return Object.entries(o).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k));
}
function get(o: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((x, k) => (x && typeof x === "object" ? (x as Record<string, unknown>)[k] : undefined), o);
}

describe("dictionaries", () => {
  const ref = keys(en);
  for (const lang of LANGS) {
    it(`${lang} has every key with the same placeholders`, () => {
      expect(keys(DICTS[lang]).sort()).toEqual([...ref].sort());
      for (const k of ref) {
        const a = String(get(en, k)).match(/\{\w+\}/g) ?? [];
        const b = String(get(DICTS[lang], k)).match(/\{\w+\}/g) ?? [];
        expect([k, b.sort()]).toEqual([k, a.sort()]);
      }
    });
  }
  it("detects the language from the phone's list", () => {
    expect(detectLang(["kk-KZ", "ru-RU"])).toBe("kk");
    expect(detectLang(["pt-BR", "es-419"])).toBe("es");
    expect(detectLang(["ja"])).toBe("en");
  });
  it("fills placeholders", () => {
    expect(fill("hace {t}", { t: "5m" })).toBe("hace 5m");
  });
});
