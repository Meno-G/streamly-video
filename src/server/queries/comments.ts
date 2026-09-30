import "server-only";
import { COMMENTS_PAGE_SIZE } from "@/lib/constants";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";
import type { CommentData } from "@/types";
import { channelSelect, paginate, toChannel } from "./shared";

export type CommentSort = "top" | "newest";

function commentSelect(viewerId: string | null) {
  return {
    id: true,
    content: true,
    createdAt: true,
    updatedAt: true,
    parentId: true,
    authorId: true,
    author: { select: channelSelect },
    video: { select: { ownerId: true } },
    _count: { select: { likes: true, replies: true } },
    likes: viewerId ? { where: { userId: viewerId }, select: { userId: true } } : false,
  } satisfies Prisma.CommentSelect;
}

type CommentRow = Prisma.CommentGetPayload<{ select: ReturnType<typeof commentSelect> }>;

function toComment(c: CommentRow, viewerId: string | null): CommentData {
  return {
    id: c.id,
    content: c.content,
    createdAt: c.createdAt.toISOString(),
    edited: c.updatedAt.getTime() - c.createdAt.getTime() > 1000,
    likeCount: c._count.likes,
    replyCount: c._count.replies,
    likedByMe: Array.isArray(c.likes) && c.likes.length > 0,
    isMine: viewerId === c.authorId,
    isByCreator: c.authorId === c.video.ownerId,
    parentId: c.parentId,
    author: toChannel(c.author),
  };
}

export async function getComments(videoId: string, viewerId: string | null, page = 1, sort: CommentSort = "top") {
  const rows = await db.comment.findMany({
    where: { videoId, parentId: null },
    select: commentSelect(viewerId),
    orderBy: sort === "top" ? [{ likes: { _count: "desc" } }, { createdAt: "desc" }] : [{ createdAt: "desc" }],
    skip: (page - 1) * COMMENTS_PAGE_SIZE,
    take: COMMENTS_PAGE_SIZE + 1,
  });
  return paginate(
    rows.map((r) => toComment(r, viewerId)),
    page,
    COMMENTS_PAGE_SIZE
  );
}

export async function getReplies(parentId: string, viewerId: string | null) {
  const rows = await db.comment.findMany({
    where: { parentId },
    select: commentSelect(viewerId),
    orderBy: { createdAt: "asc" },
    take: 100,
  });
  return rows.map((r) => toComment(r, viewerId));
}

export async function getCommentById(id: string, viewerId: string | null) {
  const row = await db.comment.findUnique({ where: { id }, select: commentSelect(viewerId) });
  return row ? toComment(row, viewerId) : null;
}
