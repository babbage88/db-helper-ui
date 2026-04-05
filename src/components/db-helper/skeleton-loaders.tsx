import { Skeleton } from "@/components/ui/skeleton";

export function TableSkeleton({ rows = 5, columns = 6 }) {
  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 flex-1 max-w-xs" />
      </div>
      <div className="rounded-md border">
        <div className="p-4 space-y-1">
          {/* Header row */}
          <div className="flex gap-4 pb-3 border-b">
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton key={i} className="h-5 flex-1" />
            ))}
          </div>
          {/* Data rows */}
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <div key={rowIdx} className="flex gap-4 py-3 border-b last:border-0">
              {Array.from({ length: columns }).map((_, colIdx) => (
                <Skeleton key={colIdx} className="h-6 flex-1" />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-24" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>
    </div>
  );
}

export function HeaderSkeleton() {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="space-y-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>
  );
}
