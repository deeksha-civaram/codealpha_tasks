import { Skeleton } from "@/components/ui/skeleton";

export function TaskCardSkeleton() {
  return (
    <div className="glass rounded-xl p-4 relative overflow-hidden">
      <span className="absolute left-0 top-0 bottom-0 w-1 bg-muted" />
      <div className="flex items-start gap-3 pl-2">
        <Skeleton className="w-5 h-5 rounded-md mt-0.5" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-full" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-4 w-12 rounded-full" />
            <Skeleton className="h-4 w-16 rounded-full" />
            <Skeleton className="h-4 w-14 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="glass rounded-2xl p-5">
      <Skeleton className="h-3 w-20 mb-3" />
      <Skeleton className="h-8 w-16" />
    </div>
  );
}
