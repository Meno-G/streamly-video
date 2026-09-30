import "server-only";
import { db } from "@/server/db";
import type { NotificationData } from "@/types";
import { channelSelect, toChannel } from "./shared";

export async function getNotifications(userId: string, take = 20): Promise<NotificationData[]> {
  const rows = await db.notification.findMany({
    where: { recipientId: userId },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      type: true,
      read: true,
      createdAt: true,
      actor: { select: channelSelect },
      video: { select: { id: true, title: true, thumbnailUrl: true } },
      comment: { select: { content: true } },
    },
  });
  return rows.map((n) => ({
    id: n.id,
    type: n.type,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
    actor: toChannel(n.actor),
    video: n.video,
    commentExcerpt: n.comment ? n.comment.content.slice(0, 120) : null,
  }));
}

export function getUnreadCount(userId: string) {
  return db.notification.count({ where: { recipientId: userId, read: false } });
}
