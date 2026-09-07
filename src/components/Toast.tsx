export interface ToastData {
  message: string;
  action?: { label: string; onClick: () => void };
}

export function Toast({ toast }: { toast: ToastData | null }) {
  if (!toast) return null;
  return (
    <div
      role="status"
      className="animate-pop-in fixed bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-full bg-card py-1.5 pl-4 pr-1.5 text-sm font-semibold text-foreground shadow-lg ring-1 ring-border"
    >
      {toast.message}
      {toast.action ? (
        <button
          type="button"
          onClick={toast.action.onClick}
          className="h-9 rounded-full bg-primary px-3 text-sm font-bold text-primary-foreground active:scale-95"
        >
          {toast.action.label}
        </button>
      ) : null}
    </div>
  );
}
