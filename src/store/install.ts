import { useEffect, useState, useSyncExternalStore } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    emit();
  });
}

export const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);

const ua = () => (typeof navigator === "undefined" ? "" : navigator.userAgent);
export const isIOS = () => /iPhone|iPad|iPod/.test(ua()) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
/** Chrome, Firefox or Edge on iOS (all WebKit underneath). */
export const isIOSOtherBrowser = () => isIOS() && /CriOS|FxiOS|EdgiOS/.test(ua());

export type InstallState =
  | { kind: "installed" }
  | { kind: "prompt"; install: () => Promise<boolean> }
  | { kind: "ios-safari" }
  | { kind: "ios-other" }
  | { kind: "manual" };

export function useInstall(): InstallState {
  const hasPrompt = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => deferred !== null,
    () => false,
  );
  const [standalone, setStandalone] = useState(isStandalone);
  useEffect(() => {
    const mq = window.matchMedia("(display-mode: standalone)");
    const on = () => setStandalone(isStandalone());
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  if (standalone) return { kind: "installed" };
  if (hasPrompt)
    return {
      kind: "prompt",
      install: async () => {
        const d = deferred;
        if (!d) return false;
        await d.prompt();
        const { outcome } = await d.userChoice;
        if (outcome === "accepted") {
          deferred = null;
          emit();
        }
        return outcome === "accepted";
      },
    };
  if (isIOSOtherBrowser()) return { kind: "ios-other" };
  if (isIOS()) return { kind: "ios-safari" };
  return { kind: "manual" };
}
