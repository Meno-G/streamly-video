import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { SITE_URL } from "@/lib/constants";
import { db } from "@/server/db";

/** Public videos and channels. Generated per request so it never goes stale. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const [videos, channels] = await Promise.all([
    db.video.findMany({
      where: { visibility: "PUBLIC" },
      select: { id: true, updatedAt: true },
      orderBy: { createdAt: "desc" },
      take: 5000,
    }),
    db.user.findMany({ select: { username: true, updatedAt: true }, take: 5000 }),
  ]);
  return [
    { url: SITE_URL, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE_URL}/explore`, changeFrequency: "hourly", priority: 0.8 },
    ...videos.map((v) => ({ url: `${SITE_URL}/watch/${v.id}`, lastModified: v.updatedAt, priority: 0.7 })),
    ...channels.map((c) => ({ url: `${SITE_URL}/channel/${c.username}`, lastModified: c.updatedAt, priority: 0.5 })),
  ];
}
