import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type { ChannelSummary, VideoCardData } from "@/types";

export const channelSelect = {
  id: true,
  username: true,
  name: true,
  profile: { select: { avatarUrl: true, verified: true } },
} satisfies Prisma.UserSelect;

export type ChannelRow = Prisma.UserGetPayload<{ select: typeof channelSelect }>;

export function toChannel(u: ChannelRow): ChannelSummary {
  return {
    id: u.id,
    username: u.username,
    name: u.name,
    avatarUrl: u.profile?.avatarUrl ?? null,
    verified: u.profile?.verified ?? false,
  };
}

export const videoCardSelect = {
  id: true,
  title: true,
  thumbnailUrl: true,
  durationSeconds: true,
  views: true,
  createdAt: true,
  isShort: true,
  visibility: true,
  owner: { select: channelSelect },
} satisfies Prisma.VideoSelect;

export const videoCardWithDescriptionSelect = {
  ...videoCardSelect,
  description: true,
} satisfies Prisma.VideoSelect;

type VideoCardRow = Prisma.VideoGetPayload<{ select: typeof videoCardSelect }> & { description?: string };

export function toCard(v: VideoCardRow): VideoCardData {
  return {
    id: v.id,
    title: v.title,
    description: v.description,
    thumbnailUrl: v.thumbnailUrl,
    durationSeconds: v.durationSeconds,
    views: v.views,
    createdAt: v.createdAt.toISOString(),
    isShort: v.isShort,
    visibility: v.visibility,
    channel: toChannel(v.owner),
  };
}

/** Clamp a 1-based page number from untrusted input. */
export function parsePage(value: unknown) {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 0 && n < 10_000 ? n : 1;
}

/** Fetch one extra row to know whether another page exists. */
export function paginate<T>(rows: T[], page: number, size: number) {
  return { items: rows.slice(0, size), page, hasMore: rows.length > size };
}
