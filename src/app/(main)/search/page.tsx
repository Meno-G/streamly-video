import { SearchX, Search as SearchIcon } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { ChannelRow } from "@/components/channel/channel-row";
import { EmptyState, PageContainer } from "@/components/empty-state";
import { Pager } from "@/components/pager";
import { SearchFilters } from "@/components/search/search-filters";
import { Button } from "@/components/ui/button";
import { VideoRow } from "@/components/video/video-card";
import { db } from "@/server/db";
import {
  DURATION_FILTERS,
  SORT_OPTIONS,
  TYPE_FILTERS,
  UPLOAD_FILTERS,
  parseSearchParams,
  searchChannels,
  searchVideos,
} from "@/server/queries/search";
import { getCurrentUser } from "@/server/session";

export async function generateMetadata({ searchParams }: PageProps<"/search">): Promise<Metadata> {
  const { q } = parseSearchParams(await searchParams);
  return { title: q ? `${q} – Search` : "Search", robots: { index: false } };
}

const labels = (obj: Record<string, { label: string } | string>) =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, typeof v === "string" ? v : v.label]));

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const params = parseSearchParams(await searchParams);
  const viewer = await getCurrentUser();

  if (!params.q) {
    return (
      <PageContainer>
        <EmptyState icon={SearchIcon} title="Search Streamly" description="Find videos by title, description, channel or tag." />
      </PageContainer>
    );
  }

  const channelsOnly = params.type === "channel";
  const [videos, channels] = await Promise.all([
    channelsOnly ? null : searchVideos(params),
    params.type && !channelsOnly ? null : searchChannels(params.q, channelsOnly ? 20 : 2, channelsOnly ? params.page : 1),
  ]);

  const subscribedIds = viewer && channels?.items.length
    ? new Set(
        (
          await db.subscription.findMany({
            where: { subscriberId: viewer.id, channelId: { in: channels.items.map((c) => c.id) } },
            select: { channelId: true },
          })
        ).map((s) => s.channelId)
      )
    : new Set<string>();

  const showChannels = channels && channels.items.length > 0 && params.page === 1 || channelsOnly;
  const nothing = !(videos?.items.length) && !(channels?.items.length);

  const filterGroups = [
    { key: "upload", label: "Upload date", options: labels(UPLOAD_FILTERS) },
    { key: "type", label: "Type", options: labels(TYPE_FILTERS) },
    { key: "duration", label: "Duration", options: labels(DURATION_FILTERS) },
    { key: "sort", label: "Sort by", options: labels(SORT_OPTIONS) },
  ];
  const current = { upload: params.upload, type: params.type, duration: params.duration, sort: params.sort };

  return (
    <PageContainer className="mx-auto max-w-[1100px] pt-4">
      <h1 className="sr-only">Search results for {params.q}</h1>
      <SearchFilters groups={filterGroups} current={current} q={params.q} />

      {nothing ? (
        <EmptyState
          icon={SearchX}
          title={`No results for “${params.q}”`}
          description="Check the spelling, try more general words, or remove some filters."
          action={
            <div className="flex gap-2">
              {Object.values(current).some(Boolean) && (
                <Button asChild variant="outline">
                  <Link href={`/search?q=${encodeURIComponent(params.q)}`}>Clear filters</Link>
                </Button>
              )}
              <Button asChild>
                <Link href="/explore">Explore trending</Link>
              </Button>
            </div>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {showChannels &&
            channels?.items.map((c) => <ChannelRow key={c.id} channel={c} subscribed={subscribedIds.has(c.id)} />)}
          {showChannels && !channelsOnly && videos && videos.items.length > 0 && <hr className="border-border" />}
          {videos?.items.map((v) => <VideoRow key={v.id} video={v} size="lg" showDescription />)}
          <Pager
            page={params.page}
            hasMore={channelsOnly ? Boolean(channels?.hasMore) : Boolean(videos?.hasMore)}
            basePath="/search"
            params={{ q: params.q, ...current }}
          />
        </div>
      )}
    </PageContainer>
  );
}
