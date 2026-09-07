import { useStore } from "@/store/store";
import { en, type Dict } from "./en";
import { ru } from "./ru";
import { kk } from "./kk";
import { es } from "./es";
import { fr } from "./fr";
import { de } from "./de";

export type Lang = "en" | "ru" | "kk" | "es" | "fr" | "de";
export const LANGS: Lang[] = ["en", "ru", "kk", "es", "fr", "de"];
export const DICTS: Record<Lang, Dict> = { en, ru, kk, es, fr, de };

/** BCP-47 tag used for date and number formatting; falls back when the browser lacks the locale data. */
const PREFERRED: Record<Lang, string[]> = { en: ["en"], ru: ["ru"], kk: ["kk", "ru"], es: ["es"], fr: ["fr"], de: ["de"] };
const resolveLocale = (lang: Lang) => {
  try {
    return Intl.DateTimeFormat.supportedLocalesOf(PREFERRED[lang])[0] ?? "en";
  } catch {
    return "en";
  }
};
export const LOCALE: Record<Lang, string> = Object.fromEntries(LANGS.map((l) => [l, resolveLocale(l)])) as Record<Lang, string>;

/** Best language for the phone's settings; English when none match. */
export function detectLang(tags: readonly string[] = navigator.languages ?? [navigator.language]): Lang {
  for (const tag of tags) {
    const base = tag.toLowerCase().split("-")[0] ?? "";
    if ((LANGS as string[]).includes(base)) return base as Lang;
  }
  return "en";
}

/** Fill "{name}" placeholders. */
export function fill(s: string, vars?: Record<string, string | number>) {
  return vars ? s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] === undefined ? `{${k}}` : String(vars[k]))) : s;
}

export function useLang(): Lang {
  return useStore().prefs.lang ?? "en";
}

/** The current dictionary plus its locale. */
export function useT() {
  const lang = useLang();
  return { t: DICTS[lang], lang, locale: LOCALE[lang] };
}

/** English ordinal for percentiles; other languages use the bare number. */
export function pct(lang: Lang, n: number) {
  if (n < 1) return "<1";
  if (n > 99) return ">99";
  if (lang !== "en") return `${n}`;
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}
