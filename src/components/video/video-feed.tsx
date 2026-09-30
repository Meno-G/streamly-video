"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInfiniteFeed } from "@/hooks/use-infinite-feed";
import type { Paginated, VideoCardData } from "@/types";
import { VideoCard } from "./video-card";
import { VideoCardSkeleton, VideoGrid } from "./video-grid";

/** Infinite-scrolling grid backed by GET /api/videos. */
export function VideoFeed({
  initial,
  endpoint,
  hideChannel,
}: {
  initial: Paginated<VideoCardData>;
  /** e.g. "/api/videos?category=music" */
  endpoint: string;
  hideChannel?: boolean;
}) {
  const { items, hasMore, loading, error, loadMore, sentinelRef } = useInfiniteFeed(endpoint, initial);

  return (
    <>
      <VideoGrid>
        {items.map((video, i) => (
          <VideoCard key={video.id} video={video} priority={i < 4} hideChannel={hideChannel} />
        ))}
        {loading && Array.from({ length: 4 }, (_, i) => <VideoCardSkeleton key={`s${i}`} />)}
      </VideoGrid>
      <div ref={sentinelRef} className="h-px" />
      {error && (
        <div className="mt-8 flex flex-col items-center gap-3 text-sm text-muted-foreground">
          <p>{error}</p>
          <Button variant="outline" onClick={loadMore}>
            Try again
          </Button>
        </div>
      )}
      {!hasMore && items.length > 8 && (
        <p className="mt-10 text-center text-sm text-muted-foreground">You’ve reached the end</p>
      )}
      {loading && <Loader2 className="mx-auto mt-6 size-5 animate-spin text-muted-foreground" aria-label="Loading more" />}
    </>
  );
}
