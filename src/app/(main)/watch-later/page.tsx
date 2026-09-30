import { Clock } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { EmptyState, PageContainer, PageHeader } from "@/components/empty-state";
import { Pager } from "@/components/pager";
import { Button } from "@/components/ui/button";
import { RemovableVideoList } from "@/components/video/removable-video-list";
import { LIST_PAGE_SIZE } from "@/lib/constants";
import { removeFromWatchLater } from "@/server/actions/interactions";
import { getWatchLater } from "@/server/queries/library";
import { parsePage } from "@/server/queries/shared";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { title: "Watch later" };

export default async function WatchLaterPage({ searchParams }: PageProps<"/watch-later">) {
  const user = await requireUser("/watch-later");
  const page = parsePage((await searchParams).page);
  const saved = await getWatchLater(user.id, page);

  return (
    <PageContainer className="mx-auto max-w-5xl pt-6">
      <PageHeader icon={Clock} title="Watch later" description="Videos you saved for later." />
      {saved.items.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="Your Watch later list is empty"
          description="Use Save on a video, or “Save to Watch later” in any video’s ⋮ menu."
          action={
            <Button asChild>
              <Link href="/">Browse videos</Link>
            </Button>
          }
        />
      ) : (
        <>
          <RemovableVideoList
            videos={saved.items}
            remove={removeFromWatchLater}
            removeLabel="Remove from Watch later"
            removedMessage="Removed from Watch later"
            numbered
            startIndex={(page - 1) * LIST_PAGE_SIZE + 1}
          />
          <Pager page={page} hasMore={saved.hasMore} basePath="/watch-later" />
        </>
      )}
    </PageContainer>
  );
}
