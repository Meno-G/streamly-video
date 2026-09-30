import { Skeleton } from "@/components/ui/skeleton";
import { VideoGridSkeleton } from "@/components/video/video-grid";

export default function ChannelLoading() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6" aria-busy="true" aria-label="Loading channel">
      <Skeleton className="mt-4 aspect-[4/1] w-full rounded-2xl sm:aspect-[6/1]" />
      <div className="mt-5 flex items-center gap-6">
        <Skeleton className="size-20 rounded-full sm:size-40" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>
      </div>
      <Skeleton className="mt-8 h-10 w-full" />
      <div className="mt-6">
        <VideoGridSkeleton count={8} />
      </div>
    </div>
  );
}
