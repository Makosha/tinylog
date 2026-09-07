import { LABEL, type FeedSource, type RestKind } from "@/domain/events";
import type { BabyState } from "@/domain/state";
import type { Suggestion } from "@/domain/suggest";
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

type Key = keyof typeof TONE;

function Big({ k, onClick, tall, wide }: { k: Key; onClick: () => void; tall?: boolean; wide?: boolean }) {
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

function Hero({ k, label, reason, onClick }: { k: Key | "wake"; label: string; reason?: string; onClick: () => void }) {
  const Icon = ICON[k];
  return (
    <button
      type="button"
      onClick={onClick}
      className="surface-warm col-span-2 flex h-24 items-center justify-center gap-3 rounded-3xl px-4 transition-transform active:scale-95"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white/20">
        <Icon className="size-7" />
      </span>
      <span className="min-w-0 text-left">
        <span className="block font-display text-2xl font-bold leading-tight">{label}</span>
        {reason ? <span className="block truncate text-sm opacity-80">{reason}</span> : null}
      </span>
    </button>
  );
}

const suggestionKey = (s: Suggestion): Key => (s.type === "feed" ? s.source : s.kind);
const suggestionAction = (s: Suggestion): Action => (s.type === "feed" ? { type: "feed", source: s.source } : { type: "rest", kind: s.kind });

export function ActionButtons({ state, suggestion, onAction }: { state: BabyState; suggestion: Suggestion | null; onAction: (a: Action) => void }) {
  const diaper = <Big k="diaper" wide onClick={() => onAction({ type: "diaper" })} />;
  const actionFor = (k: Key): Action => (k === "breast" || k === "bottle" ? { type: "feed", source: k } : k === "diaper" ? { type: "diaper" } : { type: "rest", kind: k });

  if (state.name !== "awake") {
    return (
      <section className="grid grid-cols-2 gap-3" aria-label="Log an event">
        <Hero k="wake" label={LABEL.wake} onClick={() => onAction({ type: "wake" })} />
        <Big k="breast" onClick={() => onAction({ type: "feed", source: "breast" })} />
        <Big k="bottle" onClick={() => onAction({ type: "feed", source: "bottle" })} />
        {diaper}
      </section>
    );
  }
  if (suggestion) {
    const hk = suggestionKey(suggestion);
    const rest: Key[] = (["nap", "sleep", "breast", "bottle"] as Key[]).filter((k) => k !== hk);
    return (
      <section className="grid grid-cols-2 gap-3" aria-label="Log an event">
        <Hero k={hk} label={LABEL[hk]} reason={suggestion.reason} onClick={() => onAction(suggestionAction(suggestion))} />
        <div className="col-span-2 grid grid-cols-3 gap-3">
          {rest.map((k) => (
            <Big key={k} k={k} onClick={() => onAction(actionFor(k))} />
          ))}
        </div>
        {diaper}
      </section>
    );
  }
  return (
    <section className="grid grid-cols-2 gap-3" aria-label="Log an event">
      <Big k="nap" tall onClick={() => onAction({ type: "rest", kind: "nap" })} />
      <Big k="sleep" tall onClick={() => onAction({ type: "rest", kind: "sleep" })} />
      <Big k="breast" onClick={() => onAction({ type: "feed", source: "breast" })} />
      <Big k="bottle" onClick={() => onAction({ type: "feed", source: "bottle" })} />
      {diaper}
    </section>
  );
}
