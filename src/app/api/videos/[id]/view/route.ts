import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { getUserId } from "@/server/session";

const bodySchema = z.object({
  /** "start": counted once playback passes the threshold; "progress": periodic position updates. */
  event: z.enum(["start", "progress"]),
  position: z.number().min(0).max(60 * 60 * 12).default(0),
  watched: z.number().min(0).max(60 * 60).default(0),
  viewId: z.string().max(64).optional(),
});

const DEDUPE_MS = 30 * 60 * 1000;

/**
 * Counts views and watch time, and keeps the signed-in viewer's history.
 * A signed-in user counts as at most one view per video per 30 minutes.
 */
export async function POST(request: Request, { params }: RouteContext<"/api/videos/[id]/view">) {
  const { id: videoId } = await params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const userId = await getUserId();
  const video = await db.video.findUnique({ where: { id: videoId }, select: { ownerId: true, visibility: true } });
  if (!video || (video.visibility === "PRIVATE" && video.ownerId !== userId)) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  const { event, position, watched } = parsed.data;

  if (userId) {
    await db.watchHistory.upsert({
      where: { userId_videoId: { userId, videoId } },
      create: { userId, videoId, progressSeconds: Math.floor(position) },
      update: { progressSeconds: Math.floor(position), watchedAt: new Date() },
    });
  }

  if (event === "start") {
    if (userId) {
      const recent = await db.videoView.findFirst({
        where: { videoId, userId, createdAt: { gte: new Date(Date.now() - DEDUPE_MS) } },
        select: { id: true },
      });
      if (recent) return NextResponse.json({ viewId: recent.id, counted: false });
    }
    const [view] = await db.$transaction([
      db.videoView.create({ data: { videoId, userId, watchSeconds: Math.floor(watched) }, select: { id: true } }),
      db.video.update({ where: { id: videoId }, data: { views: { increment: 1 } }, select: { id: true } }),
    ]);
    return NextResponse.json({ viewId: view.id, counted: true });
  }

  // progress: add watch time to the view this session created
  if (parsed.data.viewId && watched > 0) {
    await db.videoView.updateMany({
      where: { id: parsed.data.viewId, videoId, userId: userId ?? null },
      data: { watchSeconds: { increment: Math.min(Math.floor(watched), 120) } },
    });
  }
  return NextResponse.json({ ok: true });
}
