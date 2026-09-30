import { History } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { ClearHistoryButton } from "@/components/library/clear-history-button";
import { EmptyState, PageContainer, PageHeader } from "@/components/empty-state";
import { Pager } from "@/components/pager";
import { Button } from "@/components/ui/button";
import { RemovableVideoList } from "@/components/video/removable-video-list";
import { removeFromHistory } from "@/server/actions/history";
import { getHistory } from "@/server/queries/library";
import { parsePage } from "@/server/queries/shared";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { title: "History" };

export default async function HistoryPage({ searchParams }: PageProps<"/history">) {
  const user = await requireUser("/history");
  const page = parsePage((await searchParams).page);
  const history = await getHistory(user.id, page);

  return (
    <PageContainer className="mx-auto max-w-5xl pt-6">
      <PageHeader
        icon={History}
        title="Watch history"
        description="Videos you’ve watched, most recent first."
        actions={history.items.length > 0 && <ClearHistoryButton />}
      />
      {history.items.length === 0 ? (
        <EmptyState
          icon={History}
          title="Nothing here yet"
          description="Videos you watch while signed in will show up here."
          action={
            <Button asChild>
              <Link href="/">Browse videos</Link>
            </Button>
          }
        />
      ) : (
        <>
          <RemovableVideoList
            videos={history.items}
            remove={removeFromHistory}
            removeLabel="Remove from history"
            removedMessage="Removed from history"
          />
          <Pager page={page} hasMore={history.hasMore} basePath="/history" />
        </>
      )}
    </PageContainer>
  );
}
