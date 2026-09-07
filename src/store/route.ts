import { useSyncExternalStore } from "react";

export type Route = "today" | "history" | "growth";

const parse = (): Route => {
  const h = typeof window === "undefined" ? "" : window.location.hash;
  if (h.startsWith("#/history")) return "history";
  if (h.startsWith("#/growth")) return "growth";
  return "today";
};

export const navigate = (r: Route) => {
  window.location.hash = r === "today" ? "#/" : `#/${r}`;
};

export function useRoute() {
  return useSyncExternalStore(
    (l) => {
      window.addEventListener("hashchange", l);
      return () => window.removeEventListener("hashchange", l);
    },
    parse,
    () => "today" as Route,
  );
}
