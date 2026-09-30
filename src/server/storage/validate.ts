import "server-only";
import { IMAGE_MIME_TYPES, MAX_IMAGE_BYTES, MAX_VIDEO_BYTES, VIDEO_MIME_TYPES } from "@/lib/constants";

type Kind = "video" | "image";

/**
 * Checks declared type, size and the file's leading bytes, so a renamed
 * executable or HTML file can't be stored as a "video".
 */
export async function validateUpload(file: unknown, kind: Kind): Promise<{ ok: true; file: File } | { ok: false; error: string }> {
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: kind === "video" ? "Choose a video file" : "Choose an image file" };
  }

  const allowed: readonly string[] = kind === "video" ? VIDEO_MIME_TYPES : IMAGE_MIME_TYPES;
  if (!allowed.includes(file.type)) {
    return {
      ok: false,
      error: kind === "video" ? "Upload an MP4, WebM or MOV video" : "Upload a JPG, PNG or WebP image",
    };
  }

  const max = kind === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > max) {
    return { ok: false, error: `File is too large. The limit is ${Math.round(max / 1024 / 1024)} MB.` };
  }

  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (!matchesSignature(head, file.type)) {
    return { ok: false, error: "The file’s contents don’t match its type" };
  }

  return { ok: true, file };
}

function ascii(bytes: Uint8Array, start: number, end: number) {
  return String.fromCharCode(...bytes.slice(start, end));
}

function matchesSignature(b: Uint8Array, type: string) {
  switch (type) {
    case "video/mp4":
    case "video/quicktime":
      // ISO base media: "ftyp" at offset 4 (QuickTime may also start with "moov"/"wide"/"mdat").
      return ["ftyp", "moov", "wide", "mdat", "free", "skip"].includes(ascii(b, 4, 8));
    case "video/webm":
      return b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3;
    case "image/jpeg":
      return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
    case "image/png":
      return b[0] === 0x89 && ascii(b, 1, 4) === "PNG";
    case "image/webp":
      return ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 12) === "WEBP";
    default:
      return false;
  }
}
