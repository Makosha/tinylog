import { useState } from "react";
import { actions, useStore, useUnits, type Theme } from "@/store/store";
import type { Units } from "@/domain/units";
import { DICTS, LANGS, useT, type Lang } from "@/i18n/index";
import { Chip } from "./Chip";
import { DateField } from "./DatePicker";
import { Field } from "./Field";
import { CloseIcon, DownloadIcon } from "./icons";
import { Sheet } from "./Sheet";

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function SettingsSheet({ onClose }: { onClose: () => void }) {
  const { prefs } = useStore();
  const units = useUnits();
  const { t, lang } = useT();
  const setUnit = <K extends keyof Units>(k: K, v: Units[K]) => actions.setPrefs({ units: { ...units, [k]: v } });
  const [name, setName] = useState(prefs.babyName ?? "");
  const input = "h-12 w-full rounded-2xl border border-border bg-secondary/60 px-3 text-base text-foreground outline-none focus:border-primary";

  return (
    <Sheet label={t.settings.title} onClose={onClose}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="font-display text-xl font-bold leading-tight text-foreground">{t.settings.title}</p>
          <p className="text-xs text-muted-foreground">{t.edit.savedAsYouGo}</p>
        </div>
        <button type="button" aria-label={t.capture.close} onClick={onClose} className="flex size-11 items-center justify-center rounded-2xl border border-border bg-secondary/60 text-foreground active:scale-95">
          <CloseIcon className="size-5" />
        </button>
      </div>
      <Field label={t.settings.language}>
        <div className="grid grid-cols-3 gap-2">
          {LANGS.map((l: Lang) => (
            <Chip key={l} active={lang === l} onClick={() => actions.setPrefs({ lang: l })}>
              {DICTS[l].langName}
            </Chip>
          ))}
        </div>
      </Field>
      <Field label={t.settings.theme}>
        <Segmented
          value={prefs.theme}
          options={[
            ["system", t.settings.system],
            ["light", t.settings.light],
            ["dark", t.settings.dark],
          ]}
          onChange={(v: Theme) => actions.setPrefs({ theme: v })}
        />
      </Field>
      <Field label={t.settings.babyName}>
        <input
          type="text"
          value={name}
          placeholder={t.settings.optional}
          onChange={(e) => {
            setName(e.target.value);
            actions.setPrefs({ babyName: e.target.value.trim() || undefined });
          }}
          className={input}
        />
      </Field>
      <Field label={t.settings.bornOn}>
        <DateField label={t.settings.birthDate} value={prefs.babyDob} max={Date.now()} onChange={(ms) => actions.setPrefs({ babyDob: ms })} />
      </Field>
      <Field label={t.settings.dueOn}>
        <DateField label={t.settings.dueDate} value={prefs.babyDue} min={prefs.babyDob} onChange={(ms) => actions.setPrefs({ babyDue: ms })} />
        <p className="mt-1.5 text-xs text-muted-foreground">{t.settings.dueHint}</p>
      </Field>
      <Field label={t.settings.sex}>
        <div className="grid grid-cols-2 gap-2">
          <Chip active={prefs.babySex === "girl"} onClick={() => actions.setPrefs({ babySex: "girl" })}>
            {t.settings.girl}
          </Chip>
          <Chip active={prefs.babySex === "boy"} onClick={() => actions.setPrefs({ babySex: "boy" })}>
            {t.settings.boy}
          </Chip>
        </div>
      </Field>
      <Field label={t.settings.units}>
        <div className="grid grid-cols-2 gap-2">
          <UnitRow label={t.settings.temperature} value={units.temp} options={[["c", "°C"], ["f", "°F"]]} onChange={(v) => setUnit("temp", v)} />
          <UnitRow label={t.settings.weight} value={units.weight} options={[["kg", "kg"], ["lb", "lb · oz"]]} onChange={(v) => setUnit("weight", v)} />
          <UnitRow label={t.settings.length} value={units.length} options={[["cm", "cm"], ["in", "in"]]} onChange={(v) => setUnit("length", v)} />
          <UnitRow label={t.settings.bottle} value={units.volume} options={[["ml", "ml"], ["oz", "fl oz"]]} onChange={(v) => setUnit("volume", v)} />
        </div>
      </Field>
      <Field label={t.settings.yourData}>
        <p className="mb-2 text-sm text-muted-foreground">{t.settings.dataNote}</p>
        <button
          type="button"
          onClick={() => download(`tinylog-${new Date().toISOString().slice(0, 10)}.json`, actions.exportJson())}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-secondary/60 text-sm font-bold text-foreground active:scale-95"
        >
          <DownloadIcon className="size-5" /> {t.settings.export}
        </button>
      </Field>
    </Sheet>
  );
}

function Segmented<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="flex rounded-2xl border border-border bg-secondary/60 p-1">
      {options.map(([v, text]) => (
        <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)} className={`h-10 flex-1 rounded-xl text-sm font-bold ${value === v ? "bg-primary text-primary-foreground" : "text-foreground"}`}>
          {text}
        </button>
      ))}
    </div>
  );
}

function UnitRow<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div>
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      <div className="flex rounded-2xl border border-border bg-secondary/60 p-1">
        {options.map(([v, text]) => (
          <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)} className={`h-9 flex-1 rounded-xl text-sm font-bold ${value === v ? "bg-primary text-primary-foreground" : "text-foreground"}`}>
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
