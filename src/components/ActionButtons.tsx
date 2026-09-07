import { LABEL, type FeedSource, type RestKind } from "@/domain/events";
import type { BabyState } from "@/domain/state";
import { ICON } from "./icons";

export type Action =
  | { type: "feed"; source: FeedSource }
  | { type: "rest"; kind: RestKind }
  | { type: "wake" }
  | { type: "diaper" };

export const TONE = {
  nap: "text-nap border-nap/30 bg-nap/10",
  sleep: "text-sleep border-sleep/30 bg-sleep/10",
  breast: "text-breast border-breast/30 bg-breast/10",
  bottle: "text-feed border-feed/30 bg-feed/10",
  diaper: "text-wake border-wake/30 bg-wake/10",
} as const;

function Big({ k, onClick, tall, wide }: { k: keyof typeof TONE; onClick: () => void; tall?: boolean; wide?: boolean }) {
  const Icon = ICON[k];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex ${tall ? "h-28 flex-col" : wide ? "h-16 flex-row" : "h-24 flex-col"} items-center justify-center gap-2 rounded-3xl border transition-transform active:scale-95 ${wide ? "col-span-2" : ""} ${TONE[k]}`}
    >
      <span className={`icon-tile ${wide ? "size-10" : "size-13"}`}>
        <Icon className={wide ? "size-6" : "size-8"} />
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
  const diaper = <Big k="diaper" wide onClick={() => onAction({ type: "diaper" })} />;
  if (state.name === "awake") {
    return (
      <section className="grid grid-cols-2 gap-3" aria-label="Log an event">
        <Big k="nap" tall onClick={() => onAction({ type: "rest", kind: "nap" })} />
        <Big k="sleep" tall onClick={() => onAction({ type: "rest", kind: "sleep" })} />
        {feeds}
        {diaper}
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
        <span className="flex size-12 items-center justify-center rounded-full bg-white/20">
          <ICON.wake className="size-7" />
        </span>
        <span className="font-display text-2xl font-bold">{LABEL.wake}</span>
      </button>
      {feeds}
      {diaper}
    </section>
  );
}
