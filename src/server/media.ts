import "server-only";
import { SHORT_MAX_SECONDS } from "@/lib/constants";
import { db } from "@/server/db";
import { getStorage, makeStorageKey } from "@/server/storage";

export async function storeFile(file: File, folder: "videos" | "thumbnails" | "avatars" | "banners") {
  return getStorage().save({
    key: makeStorageKey(folder, file.type),
    body: file.stream(),
    contentType: file.type,
    size: file.size,
  });
}

/** Replace a video's tags, creating any tags that don't exist yet. */
export async function setVideoTags(videoId: string, names: string[]) {
  await db.$transaction(async (tx) => {
    await tx.videoTag.deleteMany({ where: { videoId } });
    for (const name of names) {
      const tag = await tx.tag.upsert({ where: { name }, create: { name }, update: {}, select: { id: true } });
      await tx.videoTag.create({ data: { videoId, tagId: tag.id } });
    }
  });
}

export const isShortDuration = (seconds: number) => seconds <= SHORT_MAX_SECONDS;
