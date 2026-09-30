import "server-only";
import { randomUUID } from "node:crypto";
import { CloudinaryStorage } from "./cloudinary";
import { LocalStorage } from "./local";
import { S3Storage } from "./s3";
import type { StorageDriver } from "./types";

export type { StorageDriver, StoredFile } from "./types";

let driver: StorageDriver | undefined;

/** The configured storage backend (STORAGE_DRIVER=local | s3 | cloudinary). */
export function getStorage(): StorageDriver {
  if (driver) return driver;
  switch (process.env.STORAGE_DRIVER ?? "local") {
    case "s3":
      driver = new S3Storage();
      break;
    case "cloudinary":
      driver = new CloudinaryStorage();
      break;
    default:
      driver = new LocalStorage();
  }
  return driver;
}

const EXT: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** "videos/2026/09/<uuid>.mp4" — random, so keys can't be guessed or collide. */
export function makeStorageKey(folder: "videos" | "thumbnails" | "avatars" | "banners", contentType: string) {
  const now = new Date();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${folder}/${now.getUTCFullYear()}/${month}/${randomUUID()}.${EXT[contentType] ?? "bin"}`;
}

/** Deletes a stored file, ignoring failures (the database row is already gone). */
export async function deleteStoredFile(key: string | null | undefined) {
  if (!key) return;
  try {
    await getStorage().delete(key);
  } catch (error) {
    console.error(`[storage] Failed to delete ${key}`, error);
  }
}
