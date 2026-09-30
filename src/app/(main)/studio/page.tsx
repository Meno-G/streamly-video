import { Clock, Eye, PlaySquare, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { MediaImage } from "@/components/media-image";
import { ViewsChart, WatchTimeChart } from "@/components/studio/analytics-charts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCompact, formatHours, formatViews, timeAgo } from "@/lib/format";
import { getStudioOverview } from "@/server/queries/studio";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { title: "Studio", robots: { index: false } };

export default async function StudioDashboard() {
  const user = await requireUser("/studio");
  const data = await getStudioOverview(user.id);

  const stats = [
    { label: "Total views", value: formatCompact(data.totalViews), sub: `${data.periodViews.toLocaleString("en")} in the last 28 days`, icon: Eye },
    { label: "Subscribers", value: formatCompact(data.subscribers), sub: `+${data.newSubscribers} in the last 28 days`, icon: Users },
    { label: "Videos", value: data.videoCount.toLocaleString("en"), sub: "Including private and unlisted", icon: PlaySquare },
    { label: "Watch time", value: `${formatHours(data.watchSeconds)} h`, sub: "All time, in hours", icon: Clock },
  ];

  if (data.videoCount === 0) {
    return (
      <EmptyState
        icon={PlaySquare}
        title="Upload your first video"
        description="Your channel stats, charts and recent videos will appear here once you publish."
        action={
          <Button asChild>
            <Link href="/upload">Upload video</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ label, value, sub, icon: Icon }) => (
          <Card key={label} className="gap-2 py-4">
            <CardHeader className="flex flex-row items-center justify-between px-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="size-4 text-muted-foreground" aria-hidden />
            </CardHeader>
            <CardContent className="px-4">
              <p className="text-2xl font-bold tabular-nums sm:text-3xl">{value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Views</CardTitle>
            <p className="text-sm text-muted-foreground">Last 28 days</p>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <ViewsChart data={data.series} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Watch time (hours)</CardTitle>
            <p className="text-sm text-muted-foreground">Last 28 days</p>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <WatchTimeChart data={data.series} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent videos</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/studio/videos">See all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {data.recent.map((v) => (
                <li key={v.id} className="flex items-center gap-3 py-3">
                  <Link href={`/watch/${v.id}`} className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-md bg-muted">
                    <MediaImage src={v.thumbnailUrl} alt="" fill sizes="112px" className="object-cover" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/watch/${v.id}`} className="line-clamp-1 text-sm font-medium hover:underline">
                      {v.title}
                    </Link>
                    <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                      {timeAgo(v.createdAt)} · {v.visibility.toLowerCase()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatViews(v.views)} · {formatCompact(v.likeCount)} likes · {formatCompact(v.commentCount)} comments
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top videos</CardTitle>
            <p className="text-sm text-muted-foreground">By total views</p>
          </CardHeader>
          <CardContent>
            <ol className="divide-y divide-border">
              {data.top.map((v, i) => (
                <li key={v.id} className="flex items-center gap-3 py-3">
                  <span className="w-5 text-center text-sm text-muted-foreground">{i + 1}</span>
                  <Link href={`/watch/${v.id}`} className="min-w-0 flex-1 truncate text-sm font-medium hover:underline">
                    {v.title}
                  </Link>
                  <span className="text-sm tabular-nums text-muted-foreground">{formatCompact(v.views)}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
