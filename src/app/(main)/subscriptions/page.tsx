import { SquarePlay } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { EmptyState, PageContainer, PageHeader } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { VideoFeed } from "@/components/video/video-feed";
import { getSubscribedChannels } from "@/server/queries/channels";
import { getFeed } from "@/server/queries/videos";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { title: "Subscriptions" };

export default async function SubscriptionsPage() {
  const user = await requireUser("/subscriptions");
  const [channels, feed] = await Promise.all([
    getSubscribedChannels(user.id, 100),
    getFeed({ subscribedBy: user.id }),
  ]);

  if (channels.length === 0) {
    return (
      <PageContainer>
        <EmptyState
          icon={SquarePlay}
          title="You’re not subscribed to anyone yet"
          description="Subscribe to channels you like and their latest videos will appear here."
          action={
            <Button asChild>
              <Link href="/explore">Explore channels</Link>
            </Button>
          }
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="pt-6">
      <PageHeader title="Subscriptions" description={`Latest from ${channels.length} channels you follow`} />
      <div className="-mx-4 mb-8 flex gap-4 overflow-x-auto px-4 pb-2 scrollbar-none sm:-mx-6 sm:px-6">
        {channels.map((c) => (
          <Link key={c.id} href={`/channel/${c.username}`} className="flex w-20 shrink-0 flex-col items-center gap-2 text-center">
            <UserAvatar name={c.name} src={c.avatarUrl} className="size-16 text-xl" />
            <span className="line-clamp-2 text-xs">{c.name}</span>
          </Link>
        ))}
      </div>
      {feed.items.length ? (
        <VideoFeed endpoint="/api/videos?feed=subscriptions" initial={feed} />
      ) : (
        <EmptyState icon={SquarePlay} title="No videos yet" description="Channels you follow haven’t published anything public." />
      )}
    </PageContainer>
  );
}
