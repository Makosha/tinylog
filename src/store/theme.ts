import type { Theme } from "./store";

const mq = () => (typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: light)") : null);

export const resolveTheme = (theme: Theme): "light" | "dark" =>
  theme === "system" ? (mq()?.matches ? "light" : "dark") : theme;

/** Apply the resolved theme to <html> and the browser chrome colour. */
export function applyTheme(theme: Theme) {
  const light = resolveTheme(theme) === "light";
  const root = document.documentElement;
  root.classList.toggle("daylight", light);
  root.style.colorScheme = light ? "light" : "dark";
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", light ? "#faf7f2" : "#221e19");
}

export function onSystemThemeChange(cb: () => void) {
  const m = mq();
  m?.addEventListener("change", cb);
  return () => m?.removeEventListener("change", cb);
}
