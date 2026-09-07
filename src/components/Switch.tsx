export function Switch({ checked, label, onChange }: { checked: boolean; label: string; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-8 w-13 shrink-0 rounded-full border transition-colors ${
        checked ? "border-primary bg-primary" : "border-border bg-input"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 size-6.5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,.35)] transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
