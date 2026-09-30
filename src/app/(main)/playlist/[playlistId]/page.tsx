import { Link2, ListVideo, Lock, Play, Shuffle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { MediaImage } from "@/components/media-image";
import { PlaylistOwnerActions } from "@/components/playlist/playlist-owner-actions";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { RemovableVideoList } from "@/components/video/removable-video-list";
import { VideoRow } from "@/components/video/video-card";
import { formatViews, pluralize, timeAgo } from "@/lib/format";
import { removeFromPlaylist } from "@/server/actions/playlists";
import { getPlaylist } from "@/server/queries/playlists";
import { getCurrentUser } from "@/server/session";

export async function generateMetadata({ params }: PageProps<"/playlist/[playlistId]">): Promise<Metadata> {
  const { playlistId } = await params;
  const viewer = await getCurrentUser();
  const playlist = await getPlaylist(playlistId, viewer?.id ?? null);
  if (!playlist) return { title: "Playlist not found" };
  return {
    title: playlist.name,
    description: playlist.description || `A playlist by ${playlist.owner.name} with ${playlist.videos.length} videos.`,
    robots: playlist.visibility === "PUBLIC" ? undefined : { index: false },
  };
}

export default async function PlaylistPage({ params }: PageProps<"/playlist/[playlistId]">) {
  const { playlistId } = await params;
  const viewer = await getCurrentUser();
  const playlist = await getPlaylist(playlistId, viewer?.id ?? null);
  if (!playlist) notFound();

  const first = playlist.videos[0];

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 pt-4 sm:px-6 lg:flex-row lg:items-start lg:pt-6">
      <aside className="relative shrink-0 overflow-hidden rounded-2xl lg:sticky lg:top-20 lg:w-[360px]">
        <div className="absolute inset-0 -z-0 scale-150 blur-3xl saturate-150" aria-hidden>
          <MediaImage src={playlist.thumbnailUrl} alt="" fill sizes="360px" className="object-cover opacity-50" />
        </div>
        <div className="relative bg-gradient-to-b from-background/40 to-background/90 p-5">
          <div className="relative aspect-video overflow-hidden rounded-xl bg-muted shadow-lg">
            <MediaImage src={playlist.thumbnailUrl} alt="" fill priority sizes="360px" className="object-cover" />
          </div>
          <h1 className="mt-5 text-2xl font-bold leading-tight tracking-tight">{playlist.name}</h1>
          <Link href={`/channel/${playlist.owner.username}`} className="mt-3 flex items-center gap-2 text-sm font-medium">
            <UserAvatar name={playlist.owner.name} src={playlist.owner.avatarUrl} className="size-6 text-[10px]" />
            {playlist.owner.name}
          </Link>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
            {playlist.visibility === "PRIVATE" && (
              <span className="flex items-center gap-1">
                <Lock className="size-3" /> Private
              </span>
            )}
            {playlist.visibility === "UNLISTED" && (
              <span className="flex items-center gap-1">
                <Link2 className="size-3" /> Unlisted
              </span>
            )}
            <span>{pluralize(playlist.videos.length, "video")}</span>
            <span>{formatViews(playlist.totalViews)}</span>
            <span suppressHydrationWarning>Updated {timeAgo(playlist.updatedAt)}</span>
          </p>
          {playlist.description && <p className="mt-3 whitespace-pre-wrap text-sm">{playlist.description}</p>}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {first && (
              <>
                <Button asChild className="flex-1 rounded-full bg-foreground text-background hover:bg-foreground/85">
                  <Link href={`/watch/${first.id}?list=${playlist.id}`}>
                    <Play className="fill-current" /> Play all
                  </Link>
                </Button>
                <Button asChild variant="secondary" className="flex-1 rounded-full">
                  <Link href={`/playlist/${playlist.id}/shuffle`} prefetch={false}>
                    <Shuffle /> Shuffle
                  </Link>
                </Button>
              </>
            )}
            {playlist.isOwner && (
              <PlaylistOwnerActions
                playlist={{
                  id: playlist.id,
                  name: playlist.name,
                  description: playlist.description,
                  visibility: playlist.visibility,
                }}
              />
            )}
          </div>
        </div>
      </aside>

      <section className="min-w-0 flex-1" aria-label="Videos in playlist">
        {playlist.videos.length === 0 ? (
          <EmptyState
            icon={ListVideo}
            title="This playlist is empty"
            description={playlist.isOwner ? "Add videos with “Save to playlist” from any video’s ⋮ menu or watch page." : undefined}
          />
        ) : playlist.isOwner ? (
          <RemovableVideoList
            videos={playlist.videos}
            remove={removeFromPlaylist.bind(null, playlist.id)}
            removeLabel="Remove from playlist"
            removedMessage="Removed from playlist"
            numbered
          />
        ) : (
          <div className="flex flex-col gap-3">
            {playlist.videos.map((v, i) => (
              <VideoRow key={v.id} video={v} size="md" index={i + 1} href={`/watch/${v.id}?list=${playlist.id}`} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
