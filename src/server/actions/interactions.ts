"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/validations";
import { db } from "@/server/db";
import { notify } from "@/server/notify";
import { getUserId } from "@/server/session";

const SIGN_IN = "Sign in to do that";
const idSchema = z.string().min(1).max(64);

/** Videos a user may interact with: public/unlisted, or their own. */
async function findInteractableVideo(videoId: string, userId: string) {
  const video = await db.video.findUnique({ where: { id: videoId }, select: { id: true, ownerId: true, visibility: true } });
  if (!video || (video.visibility === "PRIVATE" && video.ownerId !== userId)) return null;
  return video;
}

export async function reactToVideo(
  videoId: string,
  type: "LIKE" | "DISLIKE"
): Promise<ActionResult<{ myReaction: "LIKE" | "DISLIKE" | null; likeCount: number; dislikeCount: number }>> {
  const userId = await getUserId();
  if (!userId) return { ok: false, error: SIGN_IN };
  if (!idSchema.safeParse(videoId).success || !["LIKE", "DISLIKE"].includes(type)) {
    return { ok: false, error: "Invalid request" };
  }
  const video = await findInteractableVideo(videoId, userId);
  if (!video) return { ok: false, error: "Video not found" };

  const key = { userId_videoId: { userId, videoId } };
  const existing = await db.like.findUnique({ where: key, select: { type: true } });
  let myReaction: "LIKE" | "DISLIKE" | null;

  if (existing?.type === type) {
    await db.like.delete({ where: key });
    myReaction = null;
  } else {
    // upsert + the unique (userId, videoId) constraint make duplicate likes impossible
    await db.like.upsert({ where: key, create: { userId, videoId, type }, update: { type } });
    myReaction = type;
    if (type === "LIKE") await notify({ type: "VIDEO_LIKE", recipientId: video.ownerId, actorId: userId, videoId });
  }

  const [likeCount, dislikeCount] = await Promise.all([
    db.like.count({ where: { videoId, type: "LIKE" } }),
    db.like.count({ where: { videoId, type: "DISLIKE" } }),
  ]);
  revalidatePath("/liked");
  return { ok: true, data: { myReaction, likeCount, dislikeCount } };
}

export async function toggleSubscription(
  channelId: string
): Promise<ActionResult<{ subscribed: boolean; subscriberCount: number }>> {
  const userId = await getUserId();
  if (!userId) return { ok: false, error: SIGN_IN };
  if (!idSchema.safeParse(channelId).success) return { ok: false, error: "Invalid request" };
  if (channelId === userId) return { ok: false, error: "You can’t subscribe to your own channel" };

  const channel = await db.user.findUnique({ where: { id: channelId }, select: { id: true } });
  if (!channel) return { ok: false, error: "Channel not found" };

  const key = { subscriberId_channelId: { subscriberId: userId, channelId } };
  const existing = await db.subscription.findUnique({ where: key, select: { channelId: true } });
  if (existing) {
    await db.subscription.delete({ where: key });
  } else {
    await db.subscription.upsert({ where: key, create: { subscriberId: userId, channelId }, update: {} });
    await notify({ type: "NEW_SUBSCRIBER", recipientId: channelId, actorId: userId });
  }

  const subscriberCount = await db.subscription.count({ where: { channelId } });
  revalidatePath("/subscriptions");
  return { ok: true, data: { subscribed: !existing, subscriberCount } };
}

export async function toggleWatchLater(videoId: string): Promise<ActionResult<{ saved: boolean }>> {
  const userId = await getUserId();
  if (!userId) return { ok: false, error: SIGN_IN };
  if (!idSchema.safeParse(videoId).success) return { ok: false, error: "Invalid request" };
  if (!(await findInteractableVideo(videoId, userId))) return { ok: false, error: "Video not found" };

  const key = { userId_videoId: { userId, videoId } };
  const existing = await db.savedVideo.findUnique({ where: key, select: { videoId: true } });
  if (existing) await db.savedVideo.delete({ where: key });
  else await db.savedVideo.upsert({ where: key, create: { userId, videoId }, update: {} });

  revalidatePath("/watch-later");
  revalidatePath("/library");
  return { ok: true, data: { saved: !existing } };
}

export async function removeFromWatchLater(videoId: string): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { ok: false, error: SIGN_IN };
  await db.savedVideo.deleteMany({ where: { userId, videoId } });
  revalidatePath("/watch-later");
  return { ok: true, data: null };
}

export async function removeLike(videoId: string): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { ok: false, error: SIGN_IN };
  await db.like.deleteMany({ where: { userId, videoId, type: "LIKE" } });
  revalidatePath("/liked");
  return { ok: true, data: null };
}
