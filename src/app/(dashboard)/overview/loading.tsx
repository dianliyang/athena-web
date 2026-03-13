export default function Loading() {
  return (
    <div className="w-full px-4 py-4">
      <div className="space-y-6 animate-pulse">
        <div className="space-y-2">
          <div className="h-8 w-32 rounded-lg bg-muted" />
          <div className="h-4 w-72 max-w-full rounded-lg bg-muted/70" />
        </div>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-h-[320px] rounded-2xl border border-border bg-background/70" />
          <div className="min-h-[320px] rounded-2xl border border-border bg-background/70" />
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          <div className="min-h-[260px] rounded-2xl border border-border bg-background/70" />
          <div className="min-h-[260px] rounded-2xl border border-border bg-background/70" />
          <div className="min-h-[260px] rounded-2xl border border-border bg-background/70" />
        </div>
      </div>
    </div>
  );
}
