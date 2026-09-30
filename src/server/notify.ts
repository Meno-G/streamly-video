import "server-only";
import type { NotificationType } from "@/generated/prisma/client";
import { db } from "@/server/db";

/**
 * Creates a notification unless the actor is the recipient.
 * Likes and subscriptions are de-duplicated so toggling doesn't spam the creator.
 */
export async function notify(input: {
  type: NotificationType;
  recipientId: string;
  actorId: string;
  videoId?: string | null;
  commentId?: string | null;
}) {
  if (input.recipientId === input.actorId) return;
  try {
    if (input.type === "VIDEO_LIKE" || input.type === "NEW_SUBSCRIBER") {
      const existing = await db.notification.findFirst({
        where: {
          type: input.type,
          recipientId: input.recipientId,
          actorId: input.actorId,
          videoId: input.videoId ?? null,
        },
        select: { id: true },
      });
      if (existing) return;
    }
    await db.notification.create({ data: input });
  } catch (error) {
    // Notifications are best-effort; never fail the user's action because of them.
    console.error("[notify]", error);
  }
}
