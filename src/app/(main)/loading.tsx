import { Skeleton } from "@/components/ui/skeleton";
import { VideoGridSkeleton } from "@/components/video/video-grid";

export default function Loading() {
  return (
    <div className="px-4 sm:px-6" aria-busy="true" aria-label="Loading">
      <div className="flex gap-2 overflow-hidden py-3">
        {Array.from({ length: 10 }, (_, i) => (
          <Skeleton key={i} className="h-8 w-20 shrink-0 rounded-lg" />
        ))}
      </div>
      <div className="pt-2">
        <VideoGridSkeleton count={12} />
      </div>
    </div>
  );
}
