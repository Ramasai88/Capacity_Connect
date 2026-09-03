export function RouteLoadingSkeleton({ title = "Loading content..." }: { title?: string }) {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded bg-muted/60" />
          <div className="h-4 w-72 rounded bg-muted/40" />
        </div>
        <div className="h-8 w-28 rounded bg-muted/60" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-lg border bg-card/60 p-4 space-y-3">
            <div className="h-4 w-24 rounded bg-muted/60" />
            <div className="h-8 w-16 rounded bg-muted/80" />
          </div>
        ))}
      </div>

      <div className="h-80 rounded-lg border bg-card/60 p-6 space-y-4">
        <div className="h-5 w-40 rounded bg-muted/60" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 w-full rounded bg-muted/30" />
          ))}
        </div>
      </div>
    </div>
  );
}
