"use server";

import type { ActionResult } from "@/lib/validations";
import { db } from "@/server/db";
import { getNotifications, getUnreadCount } from "@/server/queries/notifications";
import { getUserId } from "@/server/session";
import type { NotificationData } from "@/types";

export async function fetchNotifications(): Promise<ActionResult<{ items: NotificationData[]; unread: number }>> {
  const userId = await getUserId();
  if (!userId) return { ok: false, error: "Sign in to see notifications" };
  const [items, unread] = await Promise.all([getNotifications(userId), getUnreadCount(userId)]);
  return { ok: true, data: { items, unread } };
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { ok: false, error: "Sign in to do that" };
  await db.notification.updateMany({ where: { recipientId: userId, read: false }, data: { read: true } });
  return { ok: true, data: null };
}
