import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { VideoRow } from "@/components/video/video-card";
import { CommentsSection } from "@/components/watch/comments";
import { DescriptionBox } from "@/components/watch/description-box";
import { PlaylistPanel } from "@/components/watch/playlist-panel";
import { WatchActions } from "@/components/watch/watch-actions";
import { WatchPlayer } from "@/components/watch/watch-player";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { db } from "@/server/db";
import { getComments } from "@/server/queries/comments";
import { getPlaylist } from "@/server/queries/playlists";
import { getRecommended, getVideoForWatch } from "@/server/queries/videos";
import { getCurrentUser } from "@/server/session";

const loadVideo = cache(async (id: string) => {
  const viewer = await getCurrentUser();
  return getVideoForWatch(id, viewer?.id ?? null);
});

const absolute = (url: string | null) => (url ? new URL(url, SITE_URL).toString() : undefined);

export async function generateMetadata({ params }: PageProps<"/watch/[videoId]">): Promise<Metadata> {
  const { videoId } = await params;
  const video = await loadVideo(videoId);
  if (!video) return { title: "Video unavailable" };
  const description = (video.description || `Watch ${video.title} by ${video.channel.name} on ${SITE_NAME}.`).slice(0, 160);
  return {
    title: video.title,
    description,
    alternates: { canonical: `/watch/${video.id}` },
    robots: video.visibility === "PUBLIC" ? undefined : { index: false, follow: false },
    openGraph: {
      type: "video.other",
      title: video.title,
      description,
      url: `/watch/${video.id}`,
      images: video.thumbnailUrl ? [{ url: absolute(video.thumbnailUrl)!, width: 1280, height: 720 }] : undefined,
      videos: [{ url: absolute(video.videoUrl)!, type: "video/mp4" }],
    },
    twitter: { card: "summary_large_image", title: video.title, description },
    other: { "video:duration": String(video.durationSeconds) },
  };
}

export default async function WatchPage({ params, searchParams }: PageProps<"/watch/[videoId]">) {
  const [{ videoId }, sp] = await Promise.all([params, searchParams]);
  const viewer = await getCurrentUser();
  const video = await loadVideo(videoId);
  if (!video) notFound();

  const listId = typeof sp.list === "string" ? sp.list : null;
  const [recommended, comments, playlist, history] = await Promise.all([
    getRecommended(video),
    getComments(video.id, viewer?.id ?? null),
    listId ? getPlaylist(listId, viewer?.id ?? null) : null,
    viewer
      ? db.watchHistory.findUnique({
          where: { userId_videoId: { userId: viewer.id, videoId: video.id } },
          select: { progressSeconds: true },
        })
      : null,
  ]);

  const t = Number(typeof sp.t === "string" ? sp.t : NaN);
  const startAt = Number.isFinite(t) && t > 0 ? t : (history?.progressSeconds ?? 0);

  const inPlaylist = playlist?.videos.some((v) => v.id === video.id) ? playlist : null;
  const idx = inPlaylist ? inPlaylist.videos.findIndex((v) => v.id === video.id) : -1;
  const next = inPlaylist ? inPlaylist.videos[idx + 1] : undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.title,
    description: video.description || video.title,
    thumbnailUrl: absolute(video.thumbnailUrl),
    uploadDate: video.createdAt,
    duration: `PT${Math.floor(video.durationSeconds / 60)}M${video.durationSeconds % 60}S`,
    contentUrl: absolute(video.videoUrl),
    embedUrl: `${SITE_URL}/watch/${video.id}`,
    interactionStatistic: [
      { "@type": "InteractionCounter", interactionType: { "@type": "WatchAction" }, userInteractionCount: video.views },
      { "@type": "InteractionCounter", interactionType: { "@type": "LikeAction" }, userInteractionCount: video.likeCount },
    ],
    author: { "@type": "Person", name: video.channel.name, url: `${SITE_URL}/channel/${video.channel.username}` },
  };

  return (
    <div className="mx-auto grid max-w-[1800px] gap-6 px-0 pt-0 sm:px-6 sm:pt-6 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px]">
      <script
        type="application/ld+json"
        // JSON.stringify output with "<" escaped cannot break out of the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <div className="min-w-0">
        <WatchPlayer
          videoId={video.id}
          src={video.videoUrl}
          poster={video.thumbnailUrl}
          title={video.title}
          startAt={startAt}
          isShort={video.isShort}
          nextHref={next ? `/watch/${next.id}?list=${inPlaylist!.id}` : null}
        />
        <div className="px-4 sm:px-0">
          <h1 className="mt-3 text-lg font-bold leading-snug sm:text-xl">{video.title}</h1>
          <WatchActions
            videoId={video.id}
            title={video.title}
            channel={video.channel}
            subscriberCount={video.subscriberCount}
            subscribed={video.subscribed}
            likeCount={video.likeCount}
            myReaction={video.myReaction}
            saved={video.saved}
            isOwner={video.isOwner}
          />
          <DescriptionBox
            views={video.views}
            createdAt={video.createdAt}
            description={video.description}
            tags={video.tags}
            category={video.category}
          />
          <div className="hidden lg:block">
            <CommentsSection videoId={video.id} initial={comments} initialCount={video.commentCount} />
          </div>
        </div>
      </div>

      <aside className="min-w-0 px-4 sm:px-0" aria-label="Recommended videos">
        {inPlaylist && <PlaylistPanel playlist={inPlaylist} currentId={video.id} />}
        <h2 className="mb-3 text-base font-semibold">Recommended</h2>
        <div className="flex flex-col gap-3">
          {recommended.map((v) => (
            <VideoRow key={v.id} video={v} size="sm" />
          ))}
        </div>
      </aside>

      {/* On small screens comments come after recommendations, as on most video apps. */}
      <div className="px-4 pb-8 sm:px-0 lg:hidden">
        <CommentsSection videoId={video.id} initial={comments} initialCount={video.commentCount} />
      </div>
    </div>
  );
}
