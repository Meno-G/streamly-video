import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** 1 column on phones, 2 on tablets, 3 on laptops, 4 on wide screens, 5 on very wide ones. */
export const GRID_CLASS =
  "grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 min-[1900px]:grid-cols-5";

export function VideoGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn(GRID_CLASS, className)}>{children}</div>;
}

export function VideoCardSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      <Skeleton className="aspect-video w-full rounded-xl" />
      <div className="flex gap-3">
        <Skeleton className="size-9 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2 pt-0.5">
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3.5 w-1/2" />
        </div>
      </div>
    </div>
  );
}

export function VideoGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <VideoGrid>
      {Array.from({ length: count }, (_, i) => (
        <VideoCardSkeleton key={i} />
      ))}
    </VideoGrid>
  );
}

export function VideoRowSkeleton({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  return (
    <div className={cn("flex gap-3", size === "lg" && "flex-col sm:flex-row sm:gap-4")} aria-hidden>
      <Skeleton
        className={cn(
          "aspect-video shrink-0 rounded-xl",
          { sm: "w-40 sm:w-[168px]", md: "w-40 sm:w-60", lg: "w-full sm:w-[360px]" }[size]
        )}
      />
      <div className="flex-1 space-y-2 py-1">
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-3.5 w-1/2" />
        <Skeleton className="h-3.5 w-1/3" />
      </div>
    </div>
  );
}
