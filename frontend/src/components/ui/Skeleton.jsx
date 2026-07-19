export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-10 bg-muted/30 rounded-xl animate-pulse flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-6 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-muted/30 rounded-xl" />
            <div className="space-y-2 flex-1">
              <div className="h-3 bg-muted/30 rounded-lg w-1/3" />
              <div className="h-6 bg-muted/30 rounded-lg w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="h-8 bg-muted/30 rounded-xl w-48 animate-pulse" />
      <CardSkeleton />
      <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-6">
        <TableSkeleton />
      </div>
    </div>
  );
}
