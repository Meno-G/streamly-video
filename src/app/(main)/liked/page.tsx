import { ThumbsUp } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { EmptyState, PageContainer, PageHeader } from "@/components/empty-state";
import { Pager } from "@/components/pager";
import { Button } from "@/components/ui/button";
import { RemovableVideoList } from "@/components/video/removable-video-list";
import { LIST_PAGE_SIZE } from "@/lib/constants";
import { removeLike } from "@/server/actions/interactions";
import { getLikedVideos } from "@/server/queries/library";
import { parsePage } from "@/server/queries/shared";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { title: "Liked videos" };

export default async function LikedPage({ searchParams }: PageProps<"/liked">) {
  const user = await requireUser("/liked");
  const page = parsePage((await searchParams).page);
  const liked = await getLikedVideos(user.id, page);

  return (
    <PageContainer className="mx-auto max-w-5xl pt-6">
      <PageHeader icon={ThumbsUp} title="Liked videos" description="Everything you’ve given a thumbs up." />
      {liked.items.length === 0 ? (
        <EmptyState
          icon={ThumbsUp}
          title="No liked videos yet"
          description="Tap the like button on any video and it’ll be saved here."
          action={
            <Button asChild>
              <Link href="/">Find something to like</Link>
            </Button>
          }
        />
      ) : (
        <>
          <RemovableVideoList
            videos={liked.items}
            remove={removeLike}
            removeLabel="Remove from Liked videos"
            removedMessage="Removed from Liked videos"
            numbered
            startIndex={(page - 1) * LIST_PAGE_SIZE + 1}
          />
          <Pager page={page} hasMore={liked.hasMore} basePath="/liked" />
        </>
      )}
    </PageContainer>
  );
}
