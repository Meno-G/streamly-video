import { createReadStream } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import type { NextRequest } from "next/server";
import { localFileStat, resolveLocalPath } from "@/server/storage/local";

const TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

/**
 * Serves locally stored uploads. Supports Range requests so the browser can seek
 * in videos without downloading the whole file.
 */
export async function GET(request: NextRequest, { params }: RouteContext<"/api/media/[...key]">) {
  const { key: parts } = await params;
  const key = parts.map(decodeURIComponent).join("/");

  let filePath: string;
  try {
    filePath = resolveLocalPath(key);
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const info = await localFileStat(key);
  const contentType = TYPES[path.extname(filePath).toLowerCase()];
  if (!info || !contentType) return new Response("Not found", { status: 404 });

  const headers = new Headers({
    "Content-Type": contentType,
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  });

  const range = request.headers.get("range");
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    let start = match?.[1] ? Number(match[1]) : NaN;
    let end = match?.[2] ? Number(match[2]) : info.size - 1;
    if (Number.isNaN(start)) {
      // suffix range: last N bytes
      start = Math.max(0, info.size - (match?.[2] ? Number(match[2]) : 0));
      end = info.size - 1;
    }
    if (!match || start > end || start >= info.size) {
      headers.set("Content-Range", `bytes */${info.size}`);
      return new Response(null, { status: 416, headers });
    }
    end = Math.min(end, info.size - 1);
    headers.set("Content-Range", `bytes ${start}-${end}/${info.size}`);
    headers.set("Content-Length", String(end - start + 1));
    const stream = Readable.toWeb(createReadStream(filePath, { start, end })) as ReadableStream;
    return new Response(stream, { status: 206, headers });
  }

  headers.set("Content-Length", String(info.size));
  const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream;
  return new Response(stream, { status: 200, headers });
}
