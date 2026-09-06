import { META, type FeedSource, type RestKind } from "@/domain/events";
import type { BabyState } from "@/domain/state";

export type Action = { type: "feed"; source: FeedSource } | { type: "rest"; kind: RestKind } | { type: "wake" };

const BIG = "flex flex-col items-center justify-center gap-1 rounded-3xl border text-base font-semibold transition-transform active:scale-95";
const STYLE = {
  nap: "bg-nap/12 text-nap border-nap/30",
  sleep: "bg-sleep/12 text-sleep border-sleep/30",
  breast: "bg-feed/12 text-feed border-feed/30",
  bottle: "bg-feed/12 text-feed border-feed/30",
};

function Big({ k, onClick, tall }: { k: keyof typeof STYLE; onClick: () => void; tall?: boolean }) {
  const m = META[k];
  return (
    <button type="button" onClick={onClick} className={`${BIG} ${tall ? "h-24" : "h-20"} ${STYLE[k]}`}>
      <span className="text-3xl">{m.emoji}</span>
      {m.label}
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
        className={`${BIG} surface-warm col-span-2 h-24 flex-row gap-3 border-transparent text-xl`}
      >
        <span className="text-3xl">{META.wake.emoji}</span>
        {META.wake.label}
      </button>
      {feeds}
    </section>
  );
}
