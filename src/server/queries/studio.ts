import "server-only";
import { db } from "@/server/db";
import { toCard, videoCardSelect } from "./shared";

export type DailyPoint = { date: string; views: number; watchHours: number };

/** Channel totals plus a day-by-day series for the last `days` days. */
export async function getStudioOverview(ownerId: string, days = 28) {
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - (days - 1));

  const [totals, subscribers, videoCount, watch, recent, top, daily, newSubs] = await Promise.all([
    db.video.aggregate({ where: { ownerId }, _sum: { views: true } }),
    db.subscription.count({ where: { channelId: ownerId } }),
    db.video.count({ where: { ownerId } }),
    db.videoView.aggregate({ where: { video: { ownerId } }, _sum: { watchSeconds: true } }),
    db.video.findMany({
      where: { ownerId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { ...videoCardSelect, _count: { select: { comments: true, likes: { where: { type: "LIKE" } } } } },
    }),
    db.video.findMany({ where: { ownerId }, orderBy: { views: "desc" }, take: 5, select: videoCardSelect }),
    db.$queryRaw<{ day: Date; views: bigint; seconds: bigint | null }[]>`
      SELECT date_trunc('day', vv."createdAt") AS day, COUNT(*) AS views, SUM(vv."watchSeconds") AS seconds
      FROM "VideoView" vv
      JOIN "Video" v ON v."id" = vv."videoId"
      WHERE v."ownerId" = ${ownerId} AND vv."createdAt" >= ${since}
      GROUP BY 1
      ORDER BY 1`,
    db.subscription.count({ where: { channelId: ownerId, createdAt: { gte: since } } }),
  ]);

  const byDay = new Map(daily.map((d) => [d.day.toISOString().slice(0, 10), d]));
  const series: DailyPoint[] = Array.from({ length: days }, (_, i) => {
    const d = new Date(since);
    d.setUTCDate(since.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    const row = byDay.get(key);
    return {
      date: key,
      views: Number(row?.views ?? 0),
      watchHours: Math.round((Number(row?.seconds ?? 0) / 3600) * 10) / 10,
    };
  });

  return {
    totalViews: totals._sum.views ?? 0,
    subscribers,
    newSubscribers: newSubs,
    videoCount,
    watchSeconds: watch._sum.watchSeconds ?? 0,
    periodViews: series.reduce((s, p) => s + p.views, 0),
    series,
    recent: recent.map((v) => ({ ...toCard(v), commentCount: v._count.comments, likeCount: v._count.likes })),
    top: top.map(toCard),
  };
}

export async function getVideoForEdit(id: string, ownerId: string) {
  const video = await db.video.findFirst({
    where: { id, ownerId },
    select: {
      id: true,
      title: true,
      description: true,
      thumbnailUrl: true,
      visibility: true,
      categoryId: true,
      durationSeconds: true,
      tags: { select: { tag: { select: { name: true } } } },
    },
  });
  if (!video) return null;
  return { ...video, tags: video.tags.map((t) => t.tag.name) };
}

