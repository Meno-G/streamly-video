import { ChevronRight, Clock, History, Library, ListVideo, Plus, ThumbsUp } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { EmptyState, PageContainer } from "@/components/empty-state";
import { PlaylistCard } from "@/components/playlist/playlist-card";
import { PlaylistFormDialog } from "@/components/playlist/playlist-form-dialog";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { VideoCard } from "@/components/video/video-card";
import { formatDate } from "@/lib/format";
import { getHistory, getLibraryCounts, getLikedVideos, getWatchLater } from "@/server/queries/library";
import { getPlaylistsByOwner } from "@/server/queries/playlists";
import { requireUser } from "@/server/session";
import type { VideoCardData } from "@/types";

export const metadata: Metadata = { title: "Library" };

function Shelf({
  title,
  href,
  icon: Icon,
  count,
  videos,
  empty,
}: {
  title: string;
  href: string;
  icon: typeof History;
  count: number;
  videos: VideoCardData[];
  empty: string;
}) {
  return (
    <section className="border-b border-border pb-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2.5 text-lg font-semibold">
          <Icon className="size-5" aria-hidden /> {title}
          <span className="text-sm font-normal text-muted-foreground">{count}</span>
        </h2>
        {count > 0 && (
          <Button asChild variant="ghost" size="sm" className="rounded-full text-primary">
            <Link href={href}>
              See all <ChevronRight />
            </Link>
          </Button>
        )}
      </div>
      {videos.length ? (
        <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {videos.map((v) => (
            <VideoCard key={v.id} video={v} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{empty}</p>
      )}
    </section>
  );
}

export default async function LibraryPage() {
  const user = await requireUser("/library");
  const [counts, history, later, liked, playlists] = await Promise.all([
    getLibraryCounts(user.id),
    getHistory(user.id, 1, 4),
    getWatchLater(user.id, 1, 4),
    getLikedVideos(user.id, 1, 4),
    getPlaylistsByOwner(user.id, user.id),
  ]);

  return (
    <PageContainer className="pt-6">
      <div className="flex flex-col gap-8 lg:flex-row-reverse">
        <aside className="shrink-0 lg:w-64">
          <div className="flex flex-col items-center rounded-2xl border border-border p-6 text-center lg:sticky lg:top-20">
            <UserAvatar name={user.name} src={user.profile?.avatarUrl} className="size-20 text-2xl" />
            <p className="mt-3 font-semibold">{user.name}</p>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
            <dl className="mt-5 w-full space-y-2 border-t border-border pt-4 text-left text-sm">
              {[
                ["Playlists", counts.playlists],
                ["Watch later", counts.saved],
                ["Liked videos", counts.liked],
                ["Watched", counts.history],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-xs text-muted-foreground">Member since {formatDate(user.createdAt)}</p>
          </div>
        </aside>

        <div className="min-w-0 flex-1 space-y-8">
          <h1 className="sr-only">Library</h1>
          <Shelf title="History" href="/history" icon={History} count={counts.history} videos={history.items} empty="Videos you watch will appear here." />
          <Shelf title="Watch later" href="/watch-later" icon={Clock} count={counts.saved} videos={later.items} empty="Save videos to watch them later." />
          <Shelf title="Liked videos" href="/liked" icon={ThumbsUp} count={counts.liked} videos={liked.items} empty="Videos you like will appear here." />

          <section>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="flex items-center gap-2.5 text-lg font-semibold">
                <ListVideo className="size-5" aria-hidden /> Playlists
                <span className="text-sm font-normal text-muted-foreground">{playlists.length}</span>
              </h2>
              <PlaylistFormDialog>
                <Button variant="outline" size="sm" className="rounded-full">
                  <Plus /> New playlist
                </Button>
              </PlaylistFormDialog>
            </div>
            {playlists.length ? (
              <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {playlists.map((p) => (
                  <PlaylistCard key={p.id} playlist={p} />
                ))}
              </div>
            ) : (
              <EmptyState icon={Library} title="No playlists yet" description="Create a playlist to collect videos you love." className="py-8" />
            )}
          </section>
        </div>
      </div>
    </PageContainer>
  );
}
