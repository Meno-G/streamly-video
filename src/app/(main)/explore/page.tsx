import { Clapperboard, Compass, Cpu, Dumbbell, Film, Gamepad2, GraduationCap, Laugh, Music, Plane, Soup, Trophy, FlaskConical, Newspaper } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { EmptyState, PageContainer, PageHeader } from "@/components/empty-state";
import { VideoFeed } from "@/components/video/video-feed";
import { cn } from "@/lib/utils";
import { getCategories, getFeed } from "@/server/queries/videos";

export const metadata: Metadata = {
  title: "Explore",
  description: "Trending videos and topics on Streamly.",
};

const ICONS: Record<string, typeof Music> = {
  music: Music,
  gaming: Gamepad2,
  technology: Cpu,
  travel: Plane,
  cooking: Soup,
  education: GraduationCap,
  sports: Trophy,
  "film-animation": Film,
  science: FlaskConical,
  fitness: Dumbbell,
  comedy: Laugh,
  news: Newspaper,
};

export default async function ExplorePage({ searchParams }: PageProps<"/explore">) {
  const { category: raw } = await searchParams;
  const categories = await getCategories();
  const active = categories.find((c) => c.slug === raw) ?? null;
  const feed = await getFeed({ category: active?.slug, sort: "popular", shorts: false });
  const endpoint = `/api/videos?sort=popular&shorts=false${active ? `&category=${active.slug}` : ""}`;

  return (
    <PageContainer className="pt-6">
      <PageHeader icon={Compass} title="Explore" description="Trending across Streamly, or pick a topic." />

      <nav aria-label="Topics" className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
        {categories.map((c) => {
          const Icon = ICONS[c.slug] ?? Clapperboard;
          const selected = active?.slug === c.slug;
          return (
            <Link
              key={c.slug}
              href={selected ? "/explore" : `/explore?category=${c.slug}`}
              scroll={false}
              aria-current={selected ? "true" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-colors",
                selected ? "border-primary bg-primary/10 text-foreground" : "border-border hover:bg-accent"
              )}
            >
              <Icon className={cn("size-5", selected ? "text-primary" : "text-muted-foreground")} aria-hidden />
              {c.name}
            </Link>
          );
        })}
      </nav>

      <h2 className="mb-4 text-xl font-bold">{active ? `Trending in ${active.name}` : "Trending now"}</h2>
      {feed.items.length ? (
        <VideoFeed key={endpoint} endpoint={endpoint} initial={feed} />
      ) : (
        <EmptyState icon={Clapperboard} title="Nothing trending here yet" description="Check back soon, or explore another topic." />
      )}
    </PageContainer>
  );
}
