export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="status"
      className="animate-pop-in pointer-events-none fixed left-1/2 top-4 z-40 -translate-x-1/2 rounded-full bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-lg ring-1 ring-border"
    >
      {message}
    </div>
  );
}
