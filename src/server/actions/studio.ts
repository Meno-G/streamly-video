"use server";

import { revalidatePath } from "next/cache";
import { fieldErrorsOf, videoMetaSchema, type ActionResult } from "@/lib/validations";
import { db } from "@/server/db";
import { setVideoTags, storeFile } from "@/server/media";
import { getUserId } from "@/server/session";
import { deleteStoredFile } from "@/server/storage";
import { validateUpload } from "@/server/storage/validate";

export async function updateVideo(videoId: string, formData: FormData): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { ok: false, error: "Sign in to edit videos" };

  const video = await db.video.findFirst({ where: { id: videoId, ownerId: userId }, select: { id: true, thumbnailKey: true } });
  if (!video) return { ok: false, error: "You can only edit your own videos" };

  const parsed = videoMetaSchema.safeParse({
    title: formData.get("title") ?? "",
    description: formData.get("description") ?? "",
    tags: formData.get("tags") ?? "",
    categoryId: formData.get("categoryId") ?? "",
    visibility: formData.get("visibility") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: "Check the highlighted fields", fieldErrors: fieldErrorsOf(parsed.error) };
  }
  const category = await db.category.findUnique({ where: { id: parsed.data.categoryId }, select: { id: true } });
  if (!category) return { ok: false, error: "Choose a category", fieldErrors: { categoryId: ["Choose a category"] } };

  let thumbnail: { url: string; key: string } | null = null;
  const rawThumb = formData.get("thumbnail");
  if (rawThumb instanceof File && rawThumb.size > 0) {
    const checked = await validateUpload(rawThumb, "image");
    if (!checked.ok) return { ok: false, error: checked.error, fieldErrors: { thumbnail: [checked.error] } };
    thumbnail = await storeFile(checked.file, "thumbnails");
  }

  const { tags, ...fields } = parsed.data;
  await db.video.update({
    where: { id: videoId },
    data: { ...fields, ...(thumbnail ? { thumbnailUrl: thumbnail.url, thumbnailKey: thumbnail.key } : {}) },
  });
  await setVideoTags(videoId, tags);
  if (thumbnail) await deleteStoredFile(video.thumbnailKey);

  revalidatePath("/studio");
  revalidatePath("/studio/videos");
  revalidatePath(`/watch/${videoId}`);
  return { ok: true, data: null };
}

export async function deleteVideo(videoId: string): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { ok: false, error: "Sign in to delete videos" };

  const video = await db.video.findFirst({
    where: { id: videoId, ownerId: userId },
    select: { videoKey: true, thumbnailKey: true },
  });
  if (!video) return { ok: false, error: "You can only delete your own videos" };

  await db.video.delete({ where: { id: videoId } });
  await Promise.all([deleteStoredFile(video.videoKey), deleteStoredFile(video.thumbnailKey)]);

  revalidatePath("/studio");
  revalidatePath("/studio/videos");
  return { ok: true, data: null };
}
