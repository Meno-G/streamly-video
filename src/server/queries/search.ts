import "server-only";
import { SEARCH_PAGE_SIZE } from "@/lib/constants";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";
import { channelSelect, paginate, toCard, toChannel, videoCardWithDescriptionSelect } from "./shared";

export const UPLOAD_FILTERS = {
  hour: { label: "Last hour", ms: 3_600_000 },
  today: { label: "Today", ms: 86_400_000 },
  week: { label: "This week", ms: 7 * 86_400_000 },
  month: { label: "This month", ms: 30 * 86_400_000 },
  year: { label: "This year", ms: 365 * 86_400_000 },
} as const;

export const DURATION_FILTERS = {
  short: { label: "Under 4 minutes", min: 0, max: 239 },
  medium: { label: "4–20 minutes", min: 240, max: 1200 },
  long: { label: "Over 20 minutes", min: 1201, max: null },
} as const;

export const TYPE_FILTERS = {
  video: "Videos",
  short: "Shorts",
  channel: "Channels",
} as const;

export const SORT_OPTIONS = {
  relevance: "Relevance",
  date: "Upload date",
  views: "View count",
} as const;

export type SearchParams = {
  q: string;
  upload?: keyof typeof UPLOAD_FILTERS;
  duration?: keyof typeof DURATION_FILTERS;
  type?: keyof typeof TYPE_FILTERS;
  sort?: keyof typeof SORT_OPTIONS;
  page: number;
};

function pick<T extends object>(obj: T, value: unknown): keyof T | undefined {
  return typeof value === "string" && value in obj ? (value as keyof T) : undefined;
}

export function parseSearchParams(sp: Record<string, string | string[] | undefined>): SearchParams {
  const first = (k: string) => (Array.isArray(sp[k]) ? sp[k]?.[0] : sp[k]) as string | undefined;
  const page = Number(first("page"));
  return {
    q: (first("q") ?? "").trim().slice(0, 100),
    upload: pick(UPLOAD_FILTERS, first("upload")),
    duration: pick(DURATION_FILTERS, first("duration")),
    type: pick(TYPE_FILTERS, first("type")),
    sort: pick(SORT_OPTIONS, first("sort")),
    page: Number.isInteger(page) && page > 0 && page < 500 ? page : 1,
  };
}

const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

/**
 * Ranked search over titles, descriptions, channel names and tags.
 * Every user-supplied value is a bound parameter (Prisma.sql), never string-concatenated.
 */
export async function searchVideos(params: SearchParams) {
  const size = SEARCH_PAGE_SIZE;
  const words = Array.from(new Set(params.q.toLowerCase().split(/\s+/).filter((w) => w.length > 1))).slice(0, 6);
  if (!params.q || (!words.length && params.q.length < 1)) return paginate([], params.page, size);
  const terms = (words.length ? words : [params.q.toLowerCase()]).map((w) => `%${escapeLike(w)}%`);
  const phrase = `%${escapeLike(params.q)}%`;

  const matchAny = Prisma.join(
    terms.map(
      (t) => Prisma.sql`(
        v."title" ILIKE ${t} OR v."description" ILIKE ${t} OR u."name" ILIKE ${t} OR u."username" ILIKE ${t}
        OR EXISTS (SELECT 1 FROM "VideoTag" vt JOIN "Tag" tg ON tg."id" = vt."tagId" WHERE vt."videoId" = v."id" AND tg."name" ILIKE ${t})
      )`
    ),
    " OR "
  );

  const score = Prisma.join(
    [
      Prisma.sql`CASE WHEN v."title" ILIKE ${phrase} THEN 10 ELSE 0 END`,
      ...terms.map(
        (t) => Prisma.sql`
          CASE WHEN v."title" ILIKE ${t} THEN 4 ELSE 0 END
          + CASE WHEN u."name" ILIKE ${t} OR u."username" ILIKE ${t} THEN 3 ELSE 0 END
          + CASE WHEN EXISTS (SELECT 1 FROM "VideoTag" vt JOIN "Tag" tg ON tg."id" = vt."tagId" WHERE vt."videoId" = v."id" AND tg."name" ILIKE ${t}) THEN 2 ELSE 0 END
          + CASE WHEN v."description" ILIKE ${t} THEN 1 ELSE 0 END`
      ),
    ],
    " + "
  );

  const filters: Prisma.Sql[] = [Prisma.sql`v."visibility" = 'PUBLIC'`, Prisma.sql`(${matchAny})`];
  if (params.upload) {
    filters.push(Prisma.sql`v."createdAt" >= ${new Date(Date.now() - UPLOAD_FILTERS[params.upload].ms)}`);
  }
  if (params.duration) {
    const d = DURATION_FILTERS[params.duration];
    filters.push(Prisma.sql`v."durationSeconds" >= ${d.min}`);
    if (d.max !== null) filters.push(Prisma.sql`v."durationSeconds" <= ${d.max}`);
  }
  if (params.type === "short") filters.push(Prisma.sql`v."isShort" = true`);
  if (params.type === "video") filters.push(Prisma.sql`v."isShort" = false`);

  const orderBy =
    params.sort === "date"
      ? Prisma.sql`v."createdAt" DESC`
      : params.sort === "views"
        ? Prisma.sql`v."views" DESC`
        : Prisma.sql`score DESC, v."views" DESC`;

  const rows = await db.$queryRaw<{ id: string }[]>`
    SELECT v."id", (${score}) AS score
    FROM "Video" v
    JOIN "User" u ON u."id" = v."ownerId"
    WHERE ${Prisma.join(filters, " AND ")}
    ORDER BY ${orderBy}, v."id"
    LIMIT ${size + 1} OFFSET ${(params.page - 1) * size}
  `;

  const ids = rows.map((r) => r.id);
  const videos = await db.video.findMany({ where: { id: { in: ids } }, select: videoCardWithDescriptionSelect });
  const byId = new Map(videos.map((v) => [v.id, toCard(v)]));
  return paginate(
    ids.map((id) => byId.get(id)).filter((v) => v !== undefined),
    params.page,
    size
  );
}

export async function searchChannels(q: string, take: number, page = 1) {
  if (!q) return paginate([], page, take);
  const rows = await db.user.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { username: { contains: q.replace(/^@/, ""), mode: "insensitive" } },
      ],
    },
    select: {
      ...channelSelect,
      profile: { select: { avatarUrl: true, verified: true, bio: true } },
      _count: { select: { subscribers: true, videos: { where: { visibility: "PUBLIC" } } } },
    },
    orderBy: { subscribers: { _count: "desc" } },
    skip: (page - 1) * take,
    take: take + 1,
  });
  return paginate(
    rows.map((u) => ({
      ...toChannel(u),
      bio: u.profile?.bio ?? "",
      subscriberCount: u._count.subscribers,
      videoCount: u._count.videos,
    })),
    page,
    take
  );
}

export type ChannelSearchResult = Awaited<ReturnType<typeof searchChannels>>["items"][number];
