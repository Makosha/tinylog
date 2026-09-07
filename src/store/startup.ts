/** How long the first render took, measured from the navigation start. */
declare global {
  interface Window {
    __startAt?: number;
    __renderedAt?: number;
  }
}

export function markRendered() {
  if (window.__renderedAt === undefined) window.__renderedAt = Date.now();
}

export function startupInfo() {
  const nav = performance.timing?.navigationStart || window.__startAt || Date.now();
  const rendered = window.__renderedAt ?? Date.now();
  return {
    seconds: Math.max(0, (rendered - nav) / 1000),
    cached: Boolean(navigator.serviceWorker?.controller),
  };
}
