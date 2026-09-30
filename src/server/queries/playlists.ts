import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";
import type { PlaylistSummary } from "@/types";
import { channelSelect, toCard, toChannel, videoCardSelect } from "./shared";

const playlistSummarySelect = {
  id: true,
  name: true,
  description: true,
  visibility: true,
  thumbnailUrl: true,
  updatedAt: true,
  owner: { select: channelSelect },
  _count: { select: { items: true } },
  items: {
    orderBy: { position: "asc" },
    take: 1,
    select: { video: { select: { id: true, thumbnailUrl: true } } },
  },
} satisfies Prisma.PlaylistSelect;

function toSummary(p: Prisma.PlaylistGetPayload<{ select: typeof playlistSummarySelect }>): PlaylistSummary {
  const first = p.items[0]?.video;
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    visibility: p.visibility,
    thumbnailUrl: p.thumbnailUrl ?? first?.thumbnailUrl ?? null,
    videoCount: p._count.items,
    updatedAt: p.updatedAt.toISOString(),
    firstVideoId: first?.id ?? null,
    owner: toChannel(p.owner),
  };
}

/** A user's playlists. Other viewers only see public ones. */
export async function getPlaylistsByOwner(ownerId: string, viewerId: string | null) {
  const rows = await db.playlist.findMany({
    where: { ownerId, ...(viewerId === ownerId ? {} : { visibility: "PUBLIC" }) },
    select: playlistSummarySelect,
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(toSummary);
}

/** Playlist with its videos. Private playlists are owner-only; unlisted ones work by link. */
export async function getPlaylist(id: string, viewerId: string | null) {
  const p = await db.playlist.findUnique({
    where: { id },
    select: {
      ...playlistSummarySelect,
      items: {
        orderBy: { position: "asc" },
        select: { position: true, addedAt: true, video: { select: videoCardSelect } },
      },
    },
  });
  if (!p) return null;
  const isOwner = viewerId === p.owner.id;
  if (p.visibility === "PRIVATE" && !isOwner) return null;

  // Hide private videos of other creators from the list.
  const videos = p.items
    .filter((i) => i.video.visibility !== "PRIVATE" || i.video.owner.id === viewerId)
    .map((i) => toCard(i.video));
  const first = p.items[0]?.video;

  return {
    id: p.id,
    name: p.name,
    description: p.description,
    visibility: p.visibility,
    thumbnailUrl: p.thumbnailUrl ?? first?.thumbnailUrl ?? null,
    updatedAt: p.updatedAt.toISOString(),
    owner: toChannel(p.owner),
    isOwner,
    videos,
    totalViews: videos.reduce((sum, v) => sum + v.views, 0),
  };
}

export type PlaylistPageData = NonNullable<Awaited<ReturnType<typeof getPlaylist>>>;

/** The viewer's playlists, flagged with whether each already contains the video. */
export async function getMyPlaylistsForVideo(userId: string, videoId: string) {
  const rows = await db.playlist.findMany({
    where: { ownerId: userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      visibility: true,
      items: { where: { videoId }, select: { videoId: true } },
    },
  });
  return rows.map((p) => ({ id: p.id, name: p.name, visibility: p.visibility, hasVideo: p.items.length > 0 }));
}
