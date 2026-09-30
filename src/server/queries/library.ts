import "server-only";
import { LIST_PAGE_SIZE } from "@/lib/constants";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";
import { paginate, toCard, videoCardWithDescriptionSelect } from "./shared";

/** Private videos of other channels drop out of personal lists. */
const visibleTo = (userId: string): Prisma.VideoWhereInput => ({
  OR: [{ visibility: { not: "PRIVATE" } }, { ownerId: userId }],
});

export async function getHistory(userId: string, page = 1, size = LIST_PAGE_SIZE) {
  const rows = await db.watchHistory.findMany({
    where: { userId, video: visibleTo(userId) },
    orderBy: { watchedAt: "desc" },
    skip: (page - 1) * size,
    take: size + 1,
    select: { watchedAt: true, progressSeconds: true, video: { select: videoCardWithDescriptionSelect } },
  });
  return paginate(
    rows.map((r) => ({ ...toCard(r.video), watchedAt: r.watchedAt.toISOString(), progressSeconds: r.progressSeconds })),
    page,
    size
  );
}

export async function getLikedVideos(userId: string, page = 1, size = LIST_PAGE_SIZE) {
  const rows = await db.like.findMany({
    where: { userId, type: "LIKE", video: visibleTo(userId) },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * size,
    take: size + 1,
    select: { video: { select: videoCardWithDescriptionSelect } },
  });
  return paginate(
    rows.map((r) => toCard(r.video)),
    page,
    size
  );
}

export async function getWatchLater(userId: string, page = 1, size = LIST_PAGE_SIZE) {
  const rows = await db.savedVideo.findMany({
    where: { userId, video: visibleTo(userId) },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * size,
    take: size + 1,
    select: { video: { select: videoCardWithDescriptionSelect } },
  });
  return paginate(
    rows.map((r) => toCard(r.video)),
    page,
    size
  );
}

export async function getLibraryCounts(userId: string) {
  const [history, liked, saved, playlists] = await Promise.all([
    db.watchHistory.count({ where: { userId } }),
    db.like.count({ where: { userId, type: "LIKE" } }),
    db.savedVideo.count({ where: { userId } }),
    db.playlist.count({ where: { ownerId: userId } }),
  ]);
  return { history, liked, saved, playlists };
}
