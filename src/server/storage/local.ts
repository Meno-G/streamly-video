import "server-only";
import { createWriteStream } from "node:fs";
import { mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as NodeWebReadableStream } from "node:stream/web";
import type { SaveInput, StorageDriver, StoredFile } from "./types";

// Runtime-only paths (user uploads); turbopackIgnore keeps the bundler from tracing the whole project.
export const LOCAL_ROOT = path.resolve(
  /* turbopackIgnore: true */ process.cwd(),
  process.env.LOCAL_STORAGE_DIR ?? "./storage/uploads"
);

/** Resolves a key inside LOCAL_ROOT, rejecting anything that escapes it (e.g. "../"). */
export function resolveLocalPath(key: string) {
  const full = path.resolve(/* turbopackIgnore: true */ LOCAL_ROOT, key);
  if (full !== LOCAL_ROOT && !full.startsWith(LOCAL_ROOT + path.sep)) {
    throw new Error("Invalid storage key");
  }
  return full;
}

/** Files on disk, streamed back through /api/media/[...key] with HTTP range support. */
export class LocalStorage implements StorageDriver {
  readonly name = "local" as const;

  async save({ key, body }: SaveInput): Promise<StoredFile> {
    const target = resolveLocalPath(key);
    await mkdir(path.dirname(target), { recursive: true });
    try {
      await pipeline(Readable.fromWeb(body as unknown as NodeWebReadableStream), createWriteStream(target));
    } catch (error) {
      await rm(target, { force: true });
      throw error;
    }
    return { key, url: this.publicUrl(key) };
  }

  async delete(key: string) {
    await rm(resolveLocalPath(key), { force: true });
  }

  publicUrl(key: string) {
    return `/api/media/${key.split("/").map(encodeURIComponent).join("/")}`;
  }
}

export async function localFileStat(key: string) {
  try {
    const s = await stat(resolveLocalPath(key));
    return s.isFile() ? s : null;
  } catch {
    return null;
  }
}
