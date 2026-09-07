import { useState } from "react";
import { actions, useStore } from "@/store/store";
import { Chip } from "./Chip";
import { Field } from "./Field";
import { CheckIcon, DownloadIcon } from "./icons";
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
  const [name, setName] = useState(prefs.babyName ?? "");
  const dob = prefs.babyDob ? toDateInput(prefs.babyDob) : "";
  const due = prefs.babyDue ? toDateInput(prefs.babyDue) : "";
  const input = "h-12 w-full rounded-2xl border border-border bg-secondary/60 px-3 text-base text-foreground outline-none focus:border-primary";

  return (
    <Sheet label="Settings" onClose={onClose}>
      <p className="mb-4 font-display text-xl font-bold text-foreground">Settings</p>
      <Field label="Baby's name">
        <input
          type="text"
          value={name}
          placeholder="optional"
          onChange={(e) => setName(e.target.value)}
          onBlur={() => actions.setPrefs({ babyName: name.trim() || undefined })}
          className={input}
        />
      </Field>
      <Field label="Born on">
        <input
          type="date"
          value={dob}
          max={toDateInput(Date.now())}
          onChange={(e) => actions.setPrefs({ babyDob: e.target.value ? new Date(`${e.target.value}T12:00:00`).getTime() : undefined })}
          className={input}
        />
      </Field>
      <Field label="Was due on · only if born early">
        <input
          type="date"
          value={due}
          onChange={(e) => actions.setPrefs({ babyDue: e.target.value ? new Date(`${e.target.value}T12:00:00`).getTime() : undefined })}
          className={input}
        />
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
      <button type="button" onClick={onClose} className="surface-warm flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-bold active:scale-[0.98]">
        <CheckIcon className="size-5" /> Done
      </button>
    </Sheet>
  );
}

function toDateInput(ms: number) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
