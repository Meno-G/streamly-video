import "server-only";
import { cache } from "react";
import { FEED_PAGE_SIZE } from "@/lib/constants";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";
import type { FeedSort, Paginated, VideoCardData } from "@/types";
import { channelSelect, paginate, toCard, toChannel, videoCardSelect } from "./shared";

export type FeedOptions = {
  page?: number;
  category?: string | null;
  sort?: FeedSort;
  channelId?: string;
  /** true: only Shorts, false: exclude Shorts, undefined: both */
  shorts?: boolean;
  /** Only videos from channels this user subscribes to. */
  subscribedBy?: string;
  /** Include the channel owner's unlisted/private videos (their own channel page). */
  includeNonPublicFor?: string | null;
  pageSize?: number;
};

const ORDER: Record<FeedSort, Prisma.VideoOrderByWithRelationInput[]> = {
  latest: [{ createdAt: "desc" }, { id: "desc" }],
  popular: [{ views: "desc" }, { id: "desc" }],
  oldest: [{ createdAt: "asc" }, { id: "asc" }],
};

export async function getFeed(opts: FeedOptions = {}): Promise<Paginated<VideoCardData>> {
  const page = opts.page ?? 1;
  const size = opts.pageSize ?? FEED_PAGE_SIZE;
  const ownerView = opts.includeNonPublicFor && opts.includeNonPublicFor === opts.channelId;

  const where: Prisma.VideoWhereInput = {
    ...(ownerView ? {} : { visibility: "PUBLIC" }),
    ...(opts.channelId ? { ownerId: opts.channelId } : {}),
    ...(opts.category ? { category: { slug: opts.category } } : {}),
    ...(opts.shorts === undefined ? {} : { isShort: opts.shorts }),
    ...(opts.subscribedBy ? { owner: { subscribers: { some: { subscriberId: opts.subscribedBy } } } } : {}),
  };

  const rows = await db.video.findMany({
    where,
    select: videoCardSelect,
    orderBy: ORDER[opts.sort ?? "latest"],
    skip: (page - 1) * size,
    take: size + 1,
  });
  return paginate(rows.map(toCard), page, size);
}

export const getCategories = cache(() =>
  db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } })
);

/**
 * A video for the watch page, or null when it doesn't exist or the viewer may not see it.
 * Unlisted videos are viewable by link; private ones only by their owner.
 */
export async function getVideoForWatch(id: string, viewerId: string | null) {
  const video = await db.video.findUnique({
    where: { id },
    select: {
      ...videoCardSelect,
      description: true,
      videoUrl: true,
      updatedAt: true,
      category: { select: { name: true, slug: true } },
      tags: { select: { tag: { select: { name: true } } } },
      owner: {
        select: { ...channelSelect, _count: { select: { subscribers: true } } },
      },
      _count: { select: { comments: true } },
    },
  });
  if (!video) return null;
  if (video.visibility === "PRIVATE" && video.owner.id !== viewerId) return null;

  const [likeCount, dislikeCount, myReaction, saved, subscribed] = await Promise.all([
    db.like.count({ where: { videoId: id, type: "LIKE" } }),
    db.like.count({ where: { videoId: id, type: "DISLIKE" } }),
    viewerId
      ? db.like.findUnique({ where: { userId_videoId: { userId: viewerId, videoId: id } }, select: { type: true } })
      : null,
    viewerId
      ? db.savedVideo.findUnique({ where: { userId_videoId: { userId: viewerId, videoId: id } }, select: { videoId: true } })
      : null,
    viewerId && viewerId !== video.owner.id
      ? db.subscription.findUnique({
          where: { subscriberId_channelId: { subscriberId: viewerId, channelId: video.owner.id } },
          select: { channelId: true },
        })
      : null,
  ]);

  return {
    ...toCard(video),
    description: video.description,
    videoUrl: video.videoUrl,
    category: video.category,
    tags: video.tags.map((t) => t.tag.name),
    commentCount: video._count.comments,
    subscriberCount: video.owner._count.subscribers,
    channel: toChannel(video.owner),
    likeCount,
    dislikeCount,
    myReaction: myReaction?.type ?? null,
    saved: Boolean(saved),
    subscribed: Boolean(subscribed),
    isOwner: viewerId === video.owner.id,
  };
}

export type WatchVideo = NonNullable<Awaited<ReturnType<typeof getVideoForWatch>>>;

/** Same-category videos first, then popular ones; never the current video. */
export async function getRecommended(video: { id: string; channel: { id: string }; category: { slug: string } | null }, limit = 20) {
  const related = video.category
    ? await db.video.findMany({
        where: { visibility: "PUBLIC", id: { not: video.id }, category: { slug: video.category.slug } },
        select: videoCardSelect,
        orderBy: [{ views: "desc" }],
        take: Math.ceil(limit / 2),
      })
    : [];
  const exclude = [video.id, ...related.map((v) => v.id)];
  const popular = await db.video.findMany({
    where: { visibility: "PUBLIC", id: { notIn: exclude }, isShort: false },
    select: videoCardSelect,
    orderBy: [{ views: "desc" }],
    take: limit - related.length,
  });

  // Interleave so the list isn't all one topic.
  const out: VideoCardData[] = [];
  for (let i = 0; out.length < related.length + popular.length; i++) {
    if (related[i]) out.push(toCard(related[i]));
    if (popular[i]) out.push(toCard(popular[i]));
  }
  return out;
}

/** Videos of the viewer's own studio, with engagement counts. */
export async function getStudioVideos(ownerId: string, page: number, size: number) {
  const rows = await db.video.findMany({
    where: { ownerId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * size,
    take: size + 1,
    select: {
      ...videoCardSelect,
      _count: { select: { comments: true, likes: { where: { type: "LIKE" } } } },
    },
  });
  const total = await db.video.count({ where: { ownerId } });
  return {
    ...paginate(
      rows.map((v) => ({ ...toCard(v), commentCount: v._count.comments, likeCount: v._count.likes })),
      page,
      size
    ),
    total,
  };
}
