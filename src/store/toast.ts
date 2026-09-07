import { useSyncExternalStore } from "react";
import type { ToastData } from "@/components/Toast";

let current: ToastData | null = null;
let timer = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function showToast(t: ToastData | null) {
  window.clearTimeout(timer);
  current = t;
  emit();
  if (t) timer = window.setTimeout(() => showToast(null), t.action ? 8000 : 1800);
}

export const undoToast = (message: string, undo: () => void) =>
  showToast({
    message,
    action: {
      label: "Undo",
      onClick: () => {
        undo();
        showToast(null);
      },
    },
  });

export function useToast() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
    () => null,
  );
}
