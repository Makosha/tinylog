import { useState } from "react";
import { actions, useStore, useUnits } from "@/store/store";
import type { Units } from "@/domain/units";
import { Chip } from "./Chip";
import { Field } from "./Field";
import { CloseIcon, DownloadIcon } from "./icons";
import { Sheet } from "./Sheet";
import { DateField } from "./DatePicker";
import type { Theme } from "@/store/store";

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
  const setUnit = <K extends keyof Units>(k: K, v: Units[K]) => actions.setPrefs({ units: { ...units, [k]: v } });
  const [name, setName] = useState(prefs.babyName ?? "");
  const input = "h-12 w-full rounded-2xl border border-border bg-secondary/60 px-3 text-base text-foreground outline-none focus:border-primary";

  return (
    <Sheet label="Settings" onClose={onClose}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="font-display text-xl font-bold leading-tight text-foreground">Settings</p>
          <p className="text-xs text-muted-foreground">saved as you go</p>
        </div>
        <button type="button" aria-label="Close" onClick={onClose} className="flex size-11 items-center justify-center rounded-2xl border border-border bg-secondary/60 text-foreground active:scale-95">
          <CloseIcon className="size-5" />
        </button>
      </div>
      <Field label="Theme">
        <div className="flex rounded-2xl border border-border bg-secondary/60 p-1">
          {(
            [
              ["system", "System"],
              ["light", "Light"],
              ["dark", "Dark"],
            ] as [Theme, string][]
          ).map(([v, text]) => (
            <button
              key={v}
              type="button"
              aria-pressed={prefs.theme === v}
              onClick={() => actions.setPrefs({ theme: v })}
              className={`h-10 flex-1 rounded-xl text-sm font-bold ${prefs.theme === v ? "bg-primary text-primary-foreground" : "text-foreground"}`}
            >
              {text}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Baby's name">
        <input
          type="text"
          value={name}
          placeholder="optional"
          onChange={(e) => {
            setName(e.target.value);
            actions.setPrefs({ babyName: e.target.value.trim() || undefined });
          }}
          className={input}
        />
      </Field>
      <Field label="Born on">
        <DateField label="Birth date" value={prefs.babyDob} max={Date.now()} onChange={(ms) => actions.setPrefs({ babyDob: ms })} />
      </Field>
      <Field label="Was due on · only if born early">
        <DateField label="Due date" value={prefs.babyDue} min={prefs.babyDob} onChange={(ms) => actions.setPrefs({ babyDue: ms })} />
        <p className="mt-1.5 text-xs text-muted-foreground">For a preterm baby the growth charts can also be read by corrected age, counted from this date.</p>
      </Field>
      <Field label="Sex · for the WHO growth curves">
        <div className="grid grid-cols-2 gap-2">
          <Chip active={prefs.babySex === "girl"} onClick={() => actions.setPrefs({ babySex: "girl" })}>
            Girl
          </Chip>
          <Chip active={prefs.babySex === "boy"} onClick={() => actions.setPrefs({ babySex: "boy" })}>
            Boy
          </Chip>
        </div>
      </Field>
      <Field label="Units">
        <div className="grid grid-cols-2 gap-2">
          <UnitRow label="Temperature" value={units.temp} options={[["c", "°C"], ["f", "°F"]]} onChange={(v) => setUnit("temp", v)} />
          <UnitRow label="Weight" value={units.weight} options={[["kg", "kg"], ["lb", "lb · oz"]]} onChange={(v) => setUnit("weight", v)} />
          <UnitRow label="Length" value={units.length} options={[["cm", "cm"], ["in", "in"]]} onChange={(v) => setUnit("length", v)} />
          <UnitRow label="Bottle" value={units.volume} options={[["ml", "ml"], ["oz", "fl oz"]]} onChange={(v) => setUnit("volume", v)} />
        </div>
      </Field>
      <Field label="Your data">
        <p className="mb-2 text-sm text-muted-foreground">
          Everything lives only on this phone. Clearing the browser's site data, or losing the phone, loses the log. Export a backup now and then.
        </p>
        <button
          type="button"
          onClick={() => download(`tinylog-${new Date().toISOString().slice(0, 10)}.json`, actions.exportJson())}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-secondary/60 text-sm font-bold text-foreground active:scale-95"
        >
          <DownloadIcon className="size-5" /> Export a backup
        </button>
      </Field>
    </Sheet>
  );
}

function UnitRow<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div>
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      <div className="flex rounded-2xl border border-border bg-secondary/60 p-1">
        {options.map(([v, text]) => (
          <button
            key={v}
            type="button"
            aria-pressed={value === v}
            onClick={() => onChange(v)}
            className={`h-9 flex-1 rounded-xl text-sm font-bold ${value === v ? "bg-primary text-primary-foreground" : "text-foreground"}`}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
