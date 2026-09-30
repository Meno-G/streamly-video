import { Skeleton } from "@/components/ui/skeleton";
import { VideoRowSkeleton } from "@/components/video/video-grid";

export default function WatchLoading() {
  return (
    <div
      className="mx-auto grid max-w-[1800px] gap-6 sm:px-6 sm:pt-6 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px]"
      aria-busy="true"
      aria-label="Loading video"
    >
      <div>
        <Skeleton className="aspect-video w-full rounded-none sm:rounded-xl" />
        <div className="space-y-3 px-4 pt-4 sm:px-0">
          <Skeleton className="h-6 w-3/4" />
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="ml-2 h-9 w-24 rounded-full" />
          </div>
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
      <div className="space-y-3 px-4 sm:px-0">
        {Array.from({ length: 8 }, (_, i) => (
          <VideoRowSkeleton key={i} size="sm" />
        ))}
      </div>
    </div>
  );
}
