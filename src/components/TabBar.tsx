import { navigate, type Route } from "@/store/route";
import { ICON, ChartIcon, ListIcon } from "./icons";

const TABS: { key: Route; label: string; Icon: (p: React.SVGProps<SVGSVGElement>) => React.ReactElement }[] = [
  { key: "today", label: "Today", Icon: ICON.awake },
  { key: "history", label: "History", Icon: ListIcon },
  { key: "growth", label: "Growth", Icon: ChartIcon },
];

export function TabBar({ route }: { route: Route }) {
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-10 border-t border-border bg-card/95 backdrop-blur" aria-label="Pages">
      <div className="mx-auto grid max-w-md grid-cols-3">
        {TABS.map(({ key, label, Icon }) => {
          const active = route === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => navigate(key)}
              aria-current={active ? "page" : undefined}
              className={`flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-bold ${active ? "text-primary" : "text-muted-foreground"}`}
            >
              <Icon className="size-6" />
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
