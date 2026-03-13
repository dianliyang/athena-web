export default function Loading() {
  return (
    <div className="w-full px-4 py-4">
      <div className="space-y-4 animate-pulse">
        <div className="space-y-2">
          <div className="h-8 w-32 rounded-lg bg-muted" />
          <div className="h-4 w-80 max-w-full rounded-lg bg-muted/70" />
        </div>
        <div className="min-h-[560px] rounded-2xl border border-border bg-background/70" />
      </div>
    </div>
  );
}
