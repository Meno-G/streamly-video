"use server";

import { commentSchema, type ActionResult } from "@/lib/validations";
import { db } from "@/server/db";
import { notify } from "@/server/notify";
import { getCommentById, getComments, getReplies, type CommentSort } from "@/server/queries/comments";
import { getUserId } from "@/server/session";
import type { CommentData, Paginated } from "@/types";

async function canSeeVideo(videoId: string, userId: string | null) {
  const v = await db.video.findUnique({ where: { id: videoId }, select: { ownerId: true, visibility: true } });
  if (!v || (v.visibility === "PRIVATE" && v.ownerId !== userId)) return null;
  return v;
}

export async function loadComments(videoId: string, page: number, sort: CommentSort): Promise<ActionResult<Paginated<CommentData>>> {
  const userId = await getUserId();
  if (!(await canSeeVideo(videoId, userId))) return { ok: false, error: "Video not found" };
  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  return { ok: true, data: await getComments(videoId, userId, safePage, sort === "newest" ? "newest" : "top") };
}

export async function loadReplies(parentId: string): Promise<ActionResult<CommentData[]>> {
  const userId = await getUserId();
  const parent = await db.comment.findUnique({ where: { id: parentId }, select: { videoId: true } });
  if (!parent || !(await canSeeVideo(parent.videoId, userId))) return { ok: false, error: "Comment not found" };
  return { ok: true, data: await getReplies(parentId, userId) };
}

export async function addComment(input: {
  videoId: string;
  content: string;
  parentId?: string | null;
}): Promise<ActionResult<CommentData>> {
  const userId = await getUserId();
  if (!userId) return { ok: false, error: "Sign in to comment" };

  const parsed = commentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid comment" };
  const { videoId, content } = parsed.data;

  const video = await canSeeVideo(videoId, userId);
  if (!video) return { ok: false, error: "Video not found" };

  let parentId: string | null = null;
  let parentAuthorId: string | null = null;
  if (parsed.data.parentId) {
    const parent = await db.comment.findUnique({
      where: { id: parsed.data.parentId },
      select: { id: true, videoId: true, parentId: true, authorId: true },
    });
    if (!parent || parent.videoId !== videoId) return { ok: false, error: "The comment you replied to was deleted" };
    // Replies stay one level deep: replying to a reply attaches to its thread.
    parentId = parent.parentId ?? parent.id;
    parentAuthorId = parent.authorId;
  }

  const comment = await db.comment.create({ data: { videoId, authorId: userId, content, parentId }, select: { id: true } });

  if (parentAuthorId) {
    await notify({ type: "COMMENT_REPLY", recipientId: parentAuthorId, actorId: userId, videoId, commentId: comment.id });
  }
  if (video.ownerId !== parentAuthorId) {
    await notify({ type: "VIDEO_COMMENT", recipientId: video.ownerId, actorId: userId, videoId, commentId: comment.id });
  }

  const data = await getCommentById(comment.id, userId);
  return data ? { ok: true, data } : { ok: false, error: "Comment could not be loaded" };
}

export async function deleteComment(commentId: string): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { ok: false, error: "Sign in to do that" };
  // Only the author can delete; deleteMany with authorId makes this a single authorized statement.
  const { count } = await db.comment.deleteMany({ where: { id: commentId, authorId: userId } });
  if (!count) return { ok: false, error: "You can only delete your own comments" };
  return { ok: true, data: null };
}

export async function toggleCommentLike(commentId: string): Promise<ActionResult<{ liked: boolean; likeCount: number }>> {
  const userId = await getUserId();
  if (!userId) return { ok: false, error: "Sign in to like comments" };
  const comment = await db.comment.findUnique({ where: { id: commentId }, select: { videoId: true } });
  if (!comment || !(await canSeeVideo(comment.videoId, userId))) return { ok: false, error: "Comment not found" };

  const key = { userId_commentId: { userId, commentId } };
  const existing = await db.commentLike.findUnique({ where: key, select: { userId: true } });
  if (existing) await db.commentLike.delete({ where: key });
  else await db.commentLike.upsert({ where: key, create: { userId, commentId }, update: {} });

  const likeCount = await db.commentLike.count({ where: { commentId } });
  return { ok: true, data: { liked: !existing, likeCount } };
}
