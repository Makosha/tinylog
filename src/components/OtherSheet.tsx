import { LABEL, OTHER_KINDS, type OtherKind } from "@/domain/events";
import { ICON } from "./icons";
import { toneOf } from "./kind";
import { Sheet } from "./Sheet";

export type OtherChoice = { type: "other"; kind: OtherKind } | { type: "measure" };

/** Chooser behind the "Other" button. One tap picks and logs. */
export function OtherSheet({ onPick, onClose }: { onPick: (c: OtherChoice) => void; onClose: () => void }) {
  const tiles: { key: keyof typeof ICON; label: string; choice: OtherChoice }[] = [
    ...OTHER_KINDS.map((k) => ({ key: k as keyof typeof ICON, label: LABEL[k], choice: { type: "other", kind: k } as OtherChoice })),
    { key: "weight", label: "Weight", choice: { type: "measure" } },
    { key: "length", label: "Height", choice: { type: "measure" } },
  ];
  return (
    <Sheet label="Log something else" onClose={onClose}>
      <p className="mb-4 font-display text-xl font-bold text-foreground">Log something else</p>
      <div className="grid grid-cols-3 gap-2">
        {tiles.map(({ key, label, choice }) => {
          const Icon = ICON[key];
          return (
            <button
              key={label}
              type="button"
              onClick={() => onPick(choice)}
              className={`flex h-24 flex-col items-center justify-center gap-2 rounded-3xl border border-border bg-secondary/40 active:scale-95 ${toneOf(key)}`}
            >
              <span className="icon-tile size-11">
                <Icon className="size-6" />
              </span>
              <span className="text-xs font-bold text-foreground">{label}</span>
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}
