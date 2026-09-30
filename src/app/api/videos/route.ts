import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/server/db";
import { getFeed } from "@/server/queries/videos";
import { parsePage } from "@/server/queries/shared";
import { getUserId } from "@/server/session";
import type { FeedSort } from "@/types";

/**
 * GET /api/videos?page=2&category=music&sort=popular&channel=username&shorts=true&feed=subscriptions
 * Paginated feed used by infinite scrolling.
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const page = parsePage(sp.get("page"));
  const sortParam = sp.get("sort");
  const sort: FeedSort = sortParam === "popular" || sortParam === "oldest" ? sortParam : "latest";
  const shortsParam = sp.get("shorts");
  const shorts = shortsParam === "true" ? true : shortsParam === "false" ? false : undefined;

  const viewerId = await getUserId();

  let channelId: string | undefined;
  const channel = sp.get("channel");
  if (channel) {
    const owner = await db.user.findUnique({ where: { username: channel.toLowerCase() }, select: { id: true } });
    if (!owner) return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    channelId = owner.id;
  }

  let subscribedBy: string | undefined;
  if (sp.get("feed") === "subscriptions") {
    if (!viewerId) return NextResponse.json({ error: "Sign in to see subscriptions" }, { status: 401 });
    subscribedBy = viewerId;
  }

  const result = await getFeed({
    page,
    sort,
    shorts,
    channelId,
    subscribedBy,
    category: sp.get("category"),
    includeNonPublicFor: viewerId,
  });
  return NextResponse.json(result);
}
