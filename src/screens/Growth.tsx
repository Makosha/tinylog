import { useState } from "react";
import { GrowthChart, ordinal } from "@/components/GrowthChart";
import { Switch } from "@/components/Switch";
import { MeasureSheet } from "@/components/MeasureSheet";
import { SettingsSheet } from "@/components/SettingsSheet";
import { useNow } from "@/components/useNow";
import { PlusIcon } from "@/components/icons";
import { MEASURE_META, assess, type Measure, type Measurement } from "@/domain/growth";
import { ageLabel } from "@/domain/time";
import { actions, useStore } from "@/store/store";
import { undoToast } from "@/store/toast";

const MEASURES: Measure[] = ["weight", "length", "head"];

export function Growth() {
  const { measurements, prefs } = useStore();
  const now = useNow(60_000);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [settings, setSettings] = useState(false);
  const [measure, setMeasure] = useState<Measure>("weight");

  const ready = prefs.babyDob !== undefined && prefs.babySex !== undefined;
  // born more than a week before the due date: offer corrected age
  const preterm = prefs.babyDob !== undefined && prefs.babyDue !== undefined && prefs.babyDue - prefs.babyDob > 7 * 86_400_000;
  const [corrected, setCorrected] = useState(true);
  const useCorrected = preterm && corrected;
  const dobForCharts = useCorrected ? prefs.babyDue! : prefs.babyDob!;
  const hiddenBeforeDue = useCorrected ? measurements.filter((m) => m.at < prefs.babyDue!).length : 0;
  const editing = editingId ? measurements.find((m) => m.id === editingId) : undefined;

  return (
    <main className="safe-top mx-auto min-h-dvh w-full max-w-md px-4 pb-24">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Growth</h1>
          <p className="text-sm text-muted-foreground">
            {prefs.babyDob
              ? `${prefs.babyName ? `${prefs.babyName} · ` : ""}${ageLabel(prefs.babyDob, now)}${preterm ? ` · corrected ${ageLabel(prefs.babyDue!, now)}` : ""}`
              : "WHO growth standards"}
          </p>
        </div>
        {ready ? (
          <button
            type="button"
            onClick={() => {
              const last = measurements[0];
              const created = actions.addMeasurement({
                at: now,
                ...(last?.weightKg ? { weightKg: last.weightKg } : {}),
                ...(last?.lengthCm ? { lengthCm: last.lengthCm } : {}),
                ...(last?.headCm ? { headCm: last.headCm } : {}),
              });
              setEditingId(created.id);
            }}
            className="surface-warm flex h-11 items-center gap-1.5 rounded-full pl-3 pr-4 text-sm font-bold active:scale-95"
          >
            <PlusIcon className="size-5" /> Add
          </button>
        ) : null}
      </header>

      {!ready ? (
        <section className="card-soft mb-6 p-5">
          <p className="mb-1 font-display text-lg font-bold text-foreground">Two things first</p>
          <p className="mb-4 text-sm text-muted-foreground">
            The WHO growth curves depend on the baby's sex and birth date. Set both in settings and the charts appear here.
          </p>
          <button type="button" onClick={() => setSettings(true)} className="surface-warm h-12 w-full rounded-2xl text-sm font-bold active:scale-[0.98]">
            Open settings
          </button>
        </section>
      ) : (
        <>
          {preterm ? (
            <div className={`mb-4 flex h-14 items-center justify-between rounded-2xl border px-3 ${corrected ? "border-primary/40 bg-primary/10" : "border-border bg-card"}`}>
              <div>
                <p className="text-sm font-bold text-foreground">Corrected age</p>
                <p className="text-xs text-muted-foreground">
                  {corrected ? "curves counted from the due date, as for preterm babies" : "curves counted from the birth date"}
                </p>
              </div>
              <Switch checked={corrected} label="Use corrected age" onChange={setCorrected} />
            </div>
          ) : null}
          <div className="mb-4 grid grid-cols-3 gap-2" role="tablist" aria-label="Measure">
            {MEASURES.map((k) => {
              const meta = MEASURE_META[k];
              const last = measurements.find((m) => typeof m[meta.key] === "number");
              const a = last ? assess(k, prefs.babySex!, dobForCharts, last) : null;
              const on = measure === k;
              return (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setMeasure(k)}
                  className={`rounded-2xl border p-3 text-left ${on ? "border-primary bg-primary/10" : "border-border bg-card"}`}
                >
                  <p className="text-xs text-muted-foreground">{meta.label}</p>
                  <p className="font-display text-lg font-bold leading-tight text-foreground">
                    {last ? `${(last[meta.key] as number).toFixed(meta.decimals)}` : "—"}
                    <span className="ml-0.5 text-xs font-normal text-muted-foreground">{meta.unit}</span>
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{a ? `${ordinal(a.percentile)} pct` : "no data"}</p>
                </button>
              );
            })}
          </div>

          <section className="card-soft mb-6 p-3">
            <GrowthChart measure={measure} sex={prefs.babySex!} dobMs={dobForCharts} measurements={measurements} now={now} />
            <p className="mt-1 text-center text-xs text-muted-foreground">
              WHO {prefs.babySex === "boy" ? "boys" : "girls"}
              {useCorrected ? " · corrected age" : ""} · dashed lines are the 3rd, 15th, 85th and 97th percentiles
              {hiddenBeforeDue ? ` · ${hiddenBeforeDue} before the due date not shown` : ""}
            </p>
          </section>

          <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Measurements</h2>
          {measurements.length ? (
            <ul className="space-y-2">
              {measurements.map((m) => (
                <li key={m.id}>
                  <button type="button" onClick={() => setEditingId(m.id)} className="card-soft flex w-full items-center gap-3 p-3 text-left active:scale-[0.99]">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-foreground">
                        {MEASURES.filter((k) => typeof m[MEASURE_META[k].key] === "number")
                          .map((k) => `${(m[MEASURE_META[k].key] as number).toFixed(MEASURE_META[k].decimals)} ${MEASURE_META[k].unit}`)
                          .join(" · ") || "empty"}
                      </p>
                      <p className="text-sm text-muted-foreground">{ageLabel(prefs.babyDob!, m.at)}{preterm ? ` · corrected ${ageLabel(prefs.babyDue!, m.at)}` : ""}</p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                      {new Date(m.at).toLocaleDateString([], { month: "short", day: "numeric" })}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="card-soft p-6 text-center text-sm text-muted-foreground">No measurements yet. Add the birth weight and length to start the curve.</p>
          )}
        </>
      )}

      {editing ? (
        <MeasureSheet
          measurement={editing}
          now={now}
          onPatch={(p) => actions.updateMeasurement(editing.id, p)}
          onDelete={() => {
            const removed = actions.deleteMeasurement(editing.id);
            setEditingId(null);
            if (removed) undoToast("Measurement deleted", () => actions.restoreMeasurement(removed as Measurement));
          }}
          onClose={() => setEditingId(null)}
        />
      ) : null}
      {settings ? <SettingsSheet onClose={() => setSettings(false)} /> : null}
    </main>
  );
}
