import { Clapperboard } from "lucide-react";
import { EmptyState, PageContainer } from "@/components/empty-state";
import { CategoryChips } from "@/components/video/category-chips";
import { ShortsShelf } from "@/components/video/shorts-shelf";
import { VideoFeed } from "@/components/video/video-feed";
import { getCategories, getFeed } from "@/server/queries/videos";

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const { category: rawCategory } = await searchParams;
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === rawCategory)?.slug ?? null;

  const [feed, shorts] = await Promise.all([
    getFeed({ category, shorts: false }),
    category ? null : getFeed({ shorts: true, sort: "popular", pageSize: 12 }),
  ]);

  const endpoint = `/api/videos?shorts=false${category ? `&category=${category}` : ""}`;
  const [firstRow, rest] = [
    { ...feed, items: feed.items.slice(0, 12), hasMore: false },
    { ...feed, items: feed.items.slice(12) },
  ];

  return (
    <PageContainer className="pt-0">
      <CategoryChips categories={categories} active={category} />
      <h1 className="sr-only">Home</h1>
      {feed.items.length === 0 ? (
        <EmptyState
          icon={Clapperboard}
          title="No videos in this topic yet"
          description="Try another topic, or upload the first one."
        />
      ) : shorts && shorts.items.length > 0 ? (
        <div className="space-y-8 pt-2">
          <VideoFeed key={`${endpoint}-top`} endpoint={endpoint} initial={firstRow} />
          <ShortsShelf shorts={shorts.items} />
          <VideoFeed key={endpoint} endpoint={endpoint} initial={rest} />
        </div>
      ) : (
        <div className="pt-2">
          <VideoFeed key={endpoint} endpoint={endpoint} initial={feed} />
        </div>
      )}
    </PageContainer>
  );
}
