export const SITE_NAME = "Streamly";
export const SITE_DESCRIPTION =
  "Streamly is a modern video platform to watch, share and create. Discover creators, build playlists and upload your own videos.";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const FEED_PAGE_SIZE = 24;
export const SEARCH_PAGE_SIZE = 20;
export const COMMENTS_PAGE_SIZE = 20;
export const LIST_PAGE_SIZE = 30;

/** Videos at or under this length are treated as Shorts. */
export const SHORT_MAX_SECONDS = 60;

export const VIDEO_MIME_TYPES = ["video/mp4", "video/webm", "video/quicktime"] as const;
export const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const MAX_VIDEO_BYTES = Number(process.env.MAX_VIDEO_SIZE_MB ?? 500) * 1024 * 1024;
export const MAX_IMAGE_BYTES = Number(process.env.MAX_THUMBNAIL_SIZE_MB ?? 5) * 1024 * 1024;

export const VISIBILITY_OPTIONS = [
  { value: "PUBLIC", label: "Public", description: "Everyone can watch and find it" },
  { value: "UNLISTED", label: "Unlisted", description: "Anyone with the link can watch" },
  { value: "PRIVATE", label: "Private", description: "Only you can watch" },
] as const;
