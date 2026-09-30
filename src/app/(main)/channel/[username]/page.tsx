import { BarChart3, CalendarDays, Clapperboard, Globe, Info, ListVideo, MapPin, PlaySquare, Settings, Zap } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SubscribeButton } from "@/components/channel/subscribe-button";
import { EmptyState } from "@/components/empty-state";
import { MediaImage } from "@/components/media-image";
import { PlaylistCard } from "@/components/playlist/playlist-card";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { VerifiedBadge } from "@/components/video/video-card";
import { ShortCard } from "@/components/video/shorts-shelf";
import { VideoFeed } from "@/components/video/video-feed";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { formatDate, formatSubscribers, pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getChannel } from "@/server/queries/channels";
import { getPlaylistsByOwner } from "@/server/queries/playlists";
import { getFeed } from "@/server/queries/videos";
import { getCurrentUser } from "@/server/session";
import type { FeedSort } from "@/types";

const TABS = [
  { key: "videos", label: "Videos", icon: PlaySquare },
  { key: "shorts", label: "Shorts", icon: Zap },
  { key: "playlists", label: "Playlists", icon: ListVideo },
  { key: "about", label: "About", icon: Info },
] as const;
type Tab = (typeof TABS)[number]["key"];

const SORTS: { key: FeedSort; label: string }[] = [
  { key: "latest", label: "Latest" },
  { key: "popular", label: "Popular" },
  { key: "oldest", label: "Oldest" },
];

export async function generateMetadata({ params }: PageProps<"/channel/[username]">): Promise<Metadata> {
  const { username } = await params;
  const viewer = await getCurrentUser();
  const channel = await getChannel(username, viewer?.id ?? null);
  if (!channel) return { title: "Channel not found" };
  const description = (channel.bio || `Watch videos from ${channel.name} on ${SITE_NAME}.`).slice(0, 160);
  return {
    title: `${channel.name} (@${channel.username})`,
    description,
    alternates: { canonical: `/channel/${channel.username}` },
    openGraph: {
      type: "profile",
      title: channel.name,
      description,
      url: `/channel/${channel.username}`,
      images: channel.avatarUrl ? [{ url: new URL(channel.avatarUrl, SITE_URL).toString() }] : undefined,
    },
  };
}

export default async function ChannelPage({ params, searchParams }: PageProps<"/channel/[username]">) {
  const [{ username }, sp] = await Promise.all([params, searchParams]);
  const viewer = await getCurrentUser();
  const channel = await getChannel(username, viewer?.id ?? null);
  if (!channel) notFound();

  const tab: Tab = TABS.some((t) => t.key === sp.tab) ? (sp.tab as Tab) : "videos";
  const sort: FeedSort = SORTS.some((s) => s.key === sp.sort) ? (sp.sort as FeedSort) : "latest";
  const base = `/channel/${channel.username}`;

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-10 sm:px-6">
      {/* Banner */}
      <div className="relative mt-4 aspect-[4/1] overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--brand-from)]/40 to-[var(--brand-to)]/40 sm:aspect-[6/1]">
        {channel.bannerUrl && (
          <MediaImage src={channel.bannerUrl} alt="" fill priority sizes="(max-width: 1440px) 100vw, 1440px" className="object-cover" />
        )}
      </div>

      {/* Header */}
      <header className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <UserAvatar name={channel.name} src={channel.avatarUrl} className="size-20 text-3xl sm:size-40 sm:text-5xl" />
        <div className="min-w-0 flex-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-4xl">
            {channel.name} {channel.verified && <VerifiedBadge className="size-5" />}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">@{channel.username}</span> · {formatSubscribers(channel.subscriberCount)} ·{" "}
            {pluralize(channel.videoCount, "video")}
          </p>
          {channel.bio && (
            <Link href={`${base}?tab=about`} className="mt-2 line-clamp-2 max-w-2xl text-sm text-muted-foreground hover:text-foreground">
              {channel.bio}
            </Link>
          )}
          {channel.links[0] && (
            <a
              href={channel.links[0].url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              <Globe className="size-3.5" /> {new URL(channel.links[0].url).hostname.replace(/^www\./, "")}
              {channel.links.length > 1 && <span className="text-muted-foreground"> and {channel.links.length - 1} more</span>}
            </a>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {channel.isOwner ? (
              <>
                <Button asChild variant="secondary" className="rounded-full">
                  <Link href="/profile">
                    <Settings /> Customize channel
                  </Link>
                </Button>
                <Button asChild variant="secondary" className="rounded-full">
                  <Link href="/studio/videos">
                    <BarChart3 /> Manage videos
                  </Link>
                </Button>
              </>
            ) : (
              <SubscribeButton channelId={channel.id} channelName={channel.name} initialSubscribed={channel.subscribed} />
            )}
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav aria-label="Channel sections" className="mt-6 flex gap-1 overflow-x-auto border-b border-border scrollbar-none">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key === "videos" ? base : `${base}?tab=${t.key}`}
            aria-current={tab === t.key ? "page" : undefined}
            scroll={false}
            className={cn(
              "-mb-px flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
              tab === t.key ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="mt-6">
        {tab === "videos" && <VideosTab channelId={channel.id} username={channel.username} viewerId={viewer?.id ?? null} sort={sort} base={base} />}
        {tab === "shorts" && <ShortsTab channelId={channel.id} viewerId={viewer?.id ?? null} />}
        {tab === "playlists" && <PlaylistsTab ownerId={channel.id} viewerId={viewer?.id ?? null} />}
        {tab === "about" && (
          <div className="grid max-w-4xl gap-10 md:grid-cols-[1fr_280px]">
            <section>
              <h2 className="text-lg font-semibold">Description</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{channel.bio || "This channel hasn’t added a description yet."}</p>
              {channel.links.length > 0 && (
                <>
                  <h2 className="mt-8 text-lg font-semibold">Links</h2>
                  <ul className="mt-3 space-y-3">
                    {channel.links.map((l) => (
                      <li key={l.url} className="text-sm">
                        <p className="font-medium">{l.label}</p>
                        <a href={l.url} target="_blank" rel="noopener noreferrer nofollow" className="text-primary hover:underline">
                          {l.url.replace(/^https?:\/\//, "")}
                        </a>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
            <section>
              <h2 className="text-lg font-semibold">Stats</h2>
              <dl className="mt-3 divide-y divide-border border-y border-border text-sm">
                <div className="flex items-center gap-3 py-3">
                  <CalendarDays className="size-4 text-muted-foreground" />
                  <dd suppressHydrationWarning>Joined {formatDate(channel.joinedAt)}</dd>
                </div>
                <div className="flex items-center gap-3 py-3">
                  <BarChart3 className="size-4 text-muted-foreground" />
                  <dd>{channel.totalViews.toLocaleString("en")} views</dd>
                </div>
                <div className="flex items-center gap-3 py-3">
                  <Clapperboard className="size-4 text-muted-foreground" />
                  <dd>{pluralize(channel.videoCount, "public video")}</dd>
                </div>
                {channel.location && (
                  <div className="flex items-center gap-3 py-3">
                    <MapPin className="size-4 text-muted-foreground" />
                    <dd>{channel.location}</dd>
                  </div>
                )}
              </dl>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

async function VideosTab({
  channelId,
  username,
  viewerId,
  sort,
  base,
}: {
  channelId: string;
  username: string;
  viewerId: string | null;
  sort: FeedSort;
  base: string;
}) {
  const feed = await getFeed({ channelId, sort, shorts: false, includeNonPublicFor: viewerId });
  const endpoint = `/api/videos?channel=${username}&shorts=false&sort=${sort}`;
  return (
    <>
      <div className="mb-5 flex gap-2">
        {SORTS.map((s) => (
          <Link
            key={s.key}
            href={s.key === "latest" ? base : `${base}?sort=${s.key}`}
            scroll={false}
            className={cn(
              "h-8 rounded-lg px-3 text-sm font-medium leading-8",
              sort === s.key ? "bg-foreground text-background" : "bg-secondary hover:bg-accent"
            )}
          >
            {s.label}
          </Link>
        ))}
      </div>
      {feed.items.length ? (
        <VideoFeed key={endpoint} endpoint={endpoint} initial={feed} hideChannel />
      ) : (
        <EmptyState icon={PlaySquare} title="No videos yet" description="This channel hasn’t published any videos." />
      )}
    </>
  );
}

async function ShortsTab({ channelId, viewerId }: { channelId: string; viewerId: string | null }) {
  const shorts = await getFeed({ channelId, shorts: true, includeNonPublicFor: viewerId, pageSize: 60 });
  if (!shorts.items.length) return <EmptyState icon={Zap} title="No Shorts yet" description="Videos under a minute appear here." />;
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 [&>a]:w-auto">
      {shorts.items.map((s) => (
        <ShortCard key={s.id} video={s} />
      ))}
    </div>
  );
}

async function PlaylistsTab({ ownerId, viewerId }: { ownerId: string; viewerId: string | null }) {
  const playlists = await getPlaylistsByOwner(ownerId, viewerId);
  if (!playlists.length) return <EmptyState icon={ListVideo} title="No playlists" description="This channel hasn’t created any public playlists." />;
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {playlists.map((p) => (
        <PlaylistCard key={p.id} playlist={p} />
      ))}
    </div>
  );
}
