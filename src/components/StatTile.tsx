export function StatTile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="card-soft p-3 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-display text-xl font-bold text-foreground">{value}</p>
      <p className="truncate text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
