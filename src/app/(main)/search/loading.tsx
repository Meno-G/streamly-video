import { VideoRowSkeleton } from "@/components/video/video-grid";

export default function SearchLoading() {
  return (
    <div className="mx-auto max-w-[1100px] space-y-4 px-4 pt-16 sm:px-6" aria-busy="true" aria-label="Searching">
      {Array.from({ length: 6 }, (_, i) => (
        <VideoRowSkeleton key={i} size="lg" />
      ))}
    </div>
  );
}
