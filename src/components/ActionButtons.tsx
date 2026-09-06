import { LABEL, type FeedSource, type RestKind } from "@/domain/events";
import type { BabyState } from "@/domain/state";
import { ICON } from "./icons";

export type Action = { type: "feed"; source: FeedSource } | { type: "rest"; kind: RestKind } | { type: "wake" };

const TONE = {
  nap: "text-nap border-nap/30 bg-nap/10",
  sleep: "text-sleep border-sleep/30 bg-sleep/10",
  breast: "text-feed border-feed/30 bg-feed/10",
  bottle: "text-feed border-feed/30 bg-feed/10",
} as const;

function Big({ k, onClick, tall }: { k: keyof typeof TONE; onClick: () => void; tall?: boolean }) {
  const Icon = ICON[k];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex ${tall ? "h-28" : "h-24"} flex-col items-center justify-center gap-2 rounded-3xl border transition-transform active:scale-95 ${TONE[k]}`}
    >
      <span className="icon-tile size-13">
        <Icon className="size-8" />
      </span>
      <span className="text-base font-bold">{LABEL[k]}</span>
    </button>
  );
}

export function ActionButtons({ state, onAction }: { state: BabyState; onAction: (a: Action) => void }) {
  const feeds = (
    <>
      <Big k="breast" onClick={() => onAction({ type: "feed", source: "breast" })} />
      <Big k="bottle" onClick={() => onAction({ type: "feed", source: "bottle" })} />
    </>
  );
  if (state.name === "awake") {
    return (
      <section className="grid grid-cols-2 gap-3" aria-label="Log an event">
        <Big k="nap" tall onClick={() => onAction({ type: "rest", kind: "nap" })} />
        <Big k="sleep" tall onClick={() => onAction({ type: "rest", kind: "sleep" })} />
        {feeds}
      </section>
    );
  }
  return (
    <section className="grid grid-cols-2 gap-3" aria-label="Log an event">
      <button
        type="button"
        onClick={() => onAction({ type: "wake" })}
        className="surface-warm col-span-2 flex h-24 items-center justify-center gap-3 rounded-3xl transition-transform active:scale-95"
      >
        <span className="flex size-12 items-center justify-center rounded-2xl bg-white/20">
          <ICON.wake className="size-7" />
        </span>
        <span className="font-display text-2xl font-bold">{LABEL.wake}</span>
      </button>
      {feeds}
    </section>
  );
}
