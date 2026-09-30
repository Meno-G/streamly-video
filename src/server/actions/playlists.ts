"use server";

import { revalidatePath } from "next/cache";
import { fieldErrorsOf, playlistSchema, type ActionResult } from "@/lib/validations";
import { db } from "@/server/db";
import { getMyPlaylistsForVideo } from "@/server/queries/playlists";
import { getUserId } from "@/server/session";

const SIGN_IN = "Sign in to manage playlists";

async function ownedPlaylist(playlistId: string, userId: string) {
  return db.playlist.findFirst({ where: { id: playlistId, ownerId: userId }, select: { id: true } });
}

async function canAddVideo(videoId: string, userId: string) {
  const v = await db.video.findUnique({ where: { id: videoId }, select: { ownerId: true, visibility: true } });
  return Boolean(v && (v.visibility !== "PRIVATE" || v.ownerId === userId));
}

export async function listMyPlaylistsForVideo(videoId: string) {
  const userId = await getUserId();
  if (!userId) return { ok: false as const, error: SIGN_IN };
  return { ok: true as const, data: await getMyPlaylistsForVideo(userId, videoId) };
}

export async function createPlaylist(input: {
  name: string;
  description?: string;
  visibility?: string;
  videoId?: string;
}): Promise<ActionResult<{ id: string }>> {
  const userId = await getUserId();
  if (!userId) return { ok: false, error: SIGN_IN };
  const parsed = playlistSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the highlighted fields", fieldErrors: fieldErrorsOf(parsed.error) };
  }
  if (input.videoId && !(await canAddVideo(input.videoId, userId))) return { ok: false, error: "Video not found" };

  const playlist = await db.playlist.create({
    data: {
      ...parsed.data,
      ownerId: userId,
      ...(input.videoId ? { items: { create: { videoId: input.videoId, position: 0 } } } : {}),
    },
    select: { id: true },
  });
  revalidatePath("/library");
  return { ok: true, data: playlist };
}

export async function updatePlaylist(
  playlistId: string,
  input: { name: string; description?: string; visibility?: string }
): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { ok: false, error: SIGN_IN };
  const parsed = playlistSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the highlighted fields", fieldErrors: fieldErrorsOf(parsed.error) };
  }
  const { count } = await db.playlist.updateMany({ where: { id: playlistId, ownerId: userId }, data: parsed.data });
  if (!count) return { ok: false, error: "Playlist not found" };
  revalidatePath(`/playlist/${playlistId}`);
  return { ok: true, data: null };
}

export async function setVideoInPlaylist(playlistId: string, videoId: string, include: boolean): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { ok: false, error: SIGN_IN };
  if (!(await ownedPlaylist(playlistId, userId))) return { ok: false, error: "Playlist not found" };

  if (include) {
    if (!(await canAddVideo(videoId, userId))) return { ok: false, error: "Video not found" };
    const last = await db.playlistVideo.aggregate({ where: { playlistId }, _max: { position: true } });
    await db.playlistVideo.upsert({
      where: { playlistId_videoId: { playlistId, videoId } },
      create: { playlistId, videoId, position: (last._max.position ?? -1) + 1 },
      update: {},
    });
  } else {
    await db.playlistVideo.deleteMany({ where: { playlistId, videoId } });
  }
  await db.playlist.update({ where: { id: playlistId }, data: { updatedAt: new Date() } });
  revalidatePath(`/playlist/${playlistId}`);
  return { ok: true, data: null };
}

export async function removeFromPlaylist(playlistId: string, videoId: string): Promise<ActionResult> {
  return setVideoInPlaylist(playlistId, videoId, false);
}

export async function deletePlaylist(playlistId: string): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { ok: false, error: SIGN_IN };
  const { count } = await db.playlist.deleteMany({ where: { id: playlistId, ownerId: userId } });
  if (!count) return { ok: false, error: "Playlist not found" };
  revalidatePath("/library");
  return { ok: true, data: null };
}
