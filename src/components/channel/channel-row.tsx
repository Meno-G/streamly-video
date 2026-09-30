import Link from "next/link";
import { SubscribeButton } from "@/components/channel/subscribe-button";
import { UserAvatar } from "@/components/user-avatar";
import { VerifiedBadge } from "@/components/video/video-card";
import { formatSubscribers, pluralize } from "@/lib/format";
import type { ChannelSearchResult } from "@/server/queries/search";

export function ChannelRow({ channel, subscribed }: { channel: ChannelSearchResult; subscribed: boolean }) {
  return (
    <article className="flex flex-col items-center gap-4 py-2 text-center sm:flex-row sm:text-left">
      <Link href={`/channel/${channel.username}`} className="flex w-full justify-center sm:w-[360px]">
        <UserAvatar name={channel.name} src={channel.avatarUrl} className="size-24 text-3xl sm:size-32" />
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={`/channel/${channel.username}`} className="flex items-center justify-center gap-1 text-lg font-medium sm:justify-start">
          {channel.name} {channel.verified && <VerifiedBadge className="size-4" />}
        </Link>
        <p className="text-xs text-muted-foreground">
          @{channel.username} · {formatSubscribers(channel.subscriberCount)} · {pluralize(channel.videoCount, "video")}
        </p>
        {channel.bio && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{channel.bio}</p>}
      </div>
      <SubscribeButton channelId={channel.id} channelName={channel.name} initialSubscribed={subscribed} />
    </article>
  );
}
