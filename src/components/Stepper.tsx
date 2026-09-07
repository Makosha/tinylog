import { useRef } from "react";
import { MinusIcon, PlusIcon } from "./icons";

/** A −/+ row with a big value in the middle. Press-and-hold repeats. */
export function Stepper({
  value,
  unit,
  onStep,
  minusLabel,
  plusLabel,
}: {
  value: string;
  unit?: string;
  onStep: (dir: -1 | 1) => void;
  minusLabel: string;
  plusLabel: string;
}) {
  return (
    <div className="flex w-full items-center justify-between rounded-2xl border border-border bg-secondary/60">
      <HoldButton label={minusLabel} onFire={() => onStep(-1)} className="rounded-l-2xl">
        <MinusIcon className="size-5" />
      </HoldButton>
      <span className="flex-1 text-center font-display text-lg font-bold tabular-nums text-foreground">
        {value}
        {unit ? <span className="ml-0.5 text-xs text-muted-foreground">{unit}</span> : null}
      </span>
      <HoldButton label={plusLabel} onFire={() => onStep(1)} className="rounded-r-2xl">
        <PlusIcon className="size-5" />
      </HoldButton>
    </div>
  );
}

/** Fires once on tap, then repeats while held. */
export function HoldButton({
  label,
  onFire,
  disabled,
  className = "",
  children,
}: {
  label: string;
  onFire: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const timer = useRef<number>(0);
  const fireRef = useRef(onFire);
  fireRef.current = onFire;

  const stop = () => {
    window.clearTimeout(timer.current);
    window.clearInterval(timer.current);
    timer.current = 0;
  };
  const start = () => {
    if (disabled) return;
    fireRef.current();
    timer.current = window.setTimeout(() => {
      timer.current = window.setInterval(() => fireRef.current(), 140);
    }, 450);
  };
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onPointerDown={(e) => {
        e.preventDefault();
        start();
      }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fireRef.current()}
      className={`flex h-12 w-12 shrink-0 items-center justify-center text-sm font-bold tabular-nums text-foreground active:bg-secondary disabled:opacity-45 ${className}`}
    >
      {children}
    </button>
  );
}
