import "server-only";
import { cache } from "react";
import { db } from "@/server/db";
import { toChannel, channelSelect } from "./shared";

export type SocialLink = { label: string; url: string };

function parseLinks(value: unknown): SocialLink[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (l): l is SocialLink =>
      typeof l === "object" && l !== null && typeof l.label === "string" && typeof l.url === "string" && /^https?:\/\//.test(l.url)
  );
}

export const getChannel = cache(async (username: string, viewerId: string | null) => {
  const user = await db.user.findUnique({
    where: { username: username.toLowerCase() },
    select: {
      ...channelSelect,
      createdAt: true,
      profile: { select: { avatarUrl: true, bannerUrl: true, bio: true, location: true, links: true, verified: true } },
      _count: { select: { subscribers: true, videos: { where: { visibility: "PUBLIC" } } } },
    },
  });
  if (!user) return null;

  const [subscribed, totalViews] = await Promise.all([
    viewerId && viewerId !== user.id
      ? db.subscription.findUnique({
          where: { subscriberId_channelId: { subscriberId: viewerId, channelId: user.id } },
          select: { channelId: true },
        })
      : null,
    db.video.aggregate({ where: { ownerId: user.id, visibility: "PUBLIC" }, _sum: { views: true } }),
  ]);

  return {
    ...toChannel(user),
    bannerUrl: user.profile?.bannerUrl ?? null,
    bio: user.profile?.bio ?? "",
    location: user.profile?.location ?? null,
    links: parseLinks(user.profile?.links),
    joinedAt: user.createdAt.toISOString(),
    subscriberCount: user._count.subscribers,
    videoCount: user._count.videos,
    totalViews: totalViews._sum.views ?? 0,
    subscribed: Boolean(subscribed),
    isOwner: viewerId === user.id,
  };
});

export type ChannelPageData = NonNullable<Awaited<ReturnType<typeof getChannel>>>;

/** Channels the user subscribes to, for the sidebar and subscriptions page. */
export async function getSubscribedChannels(userId: string, take = 50) {
  const subs = await db.subscription.findMany({
    where: { subscriberId: userId },
    orderBy: { createdAt: "desc" },
    take,
    select: { channel: { select: channelSelect } },
  });
  return subs.map((s) => toChannel(s.channel));
}
