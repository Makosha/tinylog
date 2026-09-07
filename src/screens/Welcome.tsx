import { useState } from "react";
import { Chip } from "@/components/Chip";
import { DateField } from "@/components/DatePicker";
import { Field } from "@/components/Field";
import { DICTS, LANGS, detectLang, type Lang } from "@/i18n/index";
import { actions, useStore } from "@/store/store";

/** First launch: pick the language (preselected from the phone) and, optionally, the basics. */
export function Welcome() {
  const { prefs } = useStore();
  const lang: Lang = prefs.lang ?? detectLang();
  const t = DICTS[lang];
  const setLang = (l: Lang) => actions.setPrefs({ lang: l });
  const [name, setName] = useState("");
  const input = "h-12 w-full rounded-2xl border border-border bg-secondary/60 px-3 text-base text-foreground outline-none focus:border-primary";

  return (
    <main className="safe-top mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pb-8">
      <div className="mb-6 mt-4 flex items-center gap-3">
        <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" className="size-14 rounded-2xl" />
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">{t.app.name}</h1>
          <p className="text-sm text-muted-foreground">{t.app.tagline}</p>
        </div>
      </div>
      <p className="font-display text-2xl font-bold text-foreground">{t.welcome.hello}</p>
      <p className="mb-6 mt-2 text-base text-muted-foreground">{t.welcome.intro}</p>

      <Field label={t.welcome.language}>
        <div className="grid grid-cols-3 gap-2">
          {LANGS.map((l) => (
            <Chip key={l} active={lang === l} onClick={() => setLang(l)}>
              {DICTS[l].langName}
            </Chip>
          ))}
        </div>
      </Field>

      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t.welcome.quickSetup}</p>
      <div className="card-soft mb-4 p-4">
        <Field label={t.settings.babyName}>
          <input type="text" value={name} placeholder={t.settings.optional} onChange={(e) => setName(e.target.value)} className={input} />
        </Field>
        <Field label={t.settings.bornOn}>
          <DateField label={t.settings.birthDate} placeholder={t.settings.notSet} value={prefs.babyDob} max={Date.now()} onChange={(ms) => actions.setPrefs({ babyDob: ms })} />
        </Field>
        <div className="mb-1">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t.settings.sex}</p>
          <div className="grid grid-cols-2 gap-2">
            <Chip active={prefs.babySex === "girl"} onClick={() => actions.setPrefs({ babySex: prefs.babySex === "girl" ? undefined : "girl" })}>
              {t.settings.girl}
            </Chip>
            <Chip active={prefs.babySex === "boy"} onClick={() => actions.setPrefs({ babySex: prefs.babySex === "boy" ? undefined : "boy" })}>
              {t.settings.boy}
            </Chip>
          </div>
        </div>
      </div>

      <div className="mt-auto">
        <button
          type="button"
          onClick={() => actions.setPrefs({ lang, welcomeDone: true, babyName: name.trim() || undefined })}
          className="surface-warm flex h-14 w-full items-center justify-center rounded-2xl text-base font-bold active:scale-[0.98]"
        >
          {t.welcome.start}
        </button>
        <p className="mt-3 text-center text-xs text-muted-foreground">{t.welcome.later}</p>
      </div>
    </main>
  );
}
