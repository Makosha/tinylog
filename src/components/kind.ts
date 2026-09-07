import type { LogEvent } from "@/domain/events";
import { ICON } from "./icons";

export type IconKey = keyof typeof ICON;

/** Icon key for an event: feeds split by source. */
export const iconKey = (e: LogEvent): IconKey => (e.kind === "feed" ? e.source : e.kind);

const TEXT: Record<IconKey, string> = {
  breast: "text-breast",
  bottle: "text-feed",
  sleep: "text-sleep",
  nap: "text-nap",
  awake: "text-wake",
  wake: "text-wake",
  diaper: "text-wake",
  temperature: "text-destructive",
  medicine: "text-feed",
  tummy: "text-nap",
  bath: "text-feed",
  milestone: "text-primary",
  note: "text-muted-foreground",
  weight: "text-primary",
  length: "text-primary",
  other: "text-muted-foreground",
};

/** Text colour class for an icon key. */
export const toneOf = (k: IconKey) => TEXT[k];
export const eventTone = (e: LogEvent) => TEXT[iconKey(e)];
