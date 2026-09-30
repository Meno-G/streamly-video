"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/validations";
import { db } from "@/server/db";
import { getUserId } from "@/server/session";

export async function removeFromHistory(videoId: string): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { ok: false, error: "Sign in to manage history" };
  await db.watchHistory.deleteMany({ where: { userId, videoId } });
  revalidatePath("/history");
  return { ok: true, data: null };
}

export async function clearHistory(): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { ok: false, error: "Sign in to manage history" };
  await db.watchHistory.deleteMany({ where: { userId } });
  revalidatePath("/history");
  revalidatePath("/library");
  return { ok: true, data: null };
}
