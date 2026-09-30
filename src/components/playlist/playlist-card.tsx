import { Link2, ListVideo, Lock } from "lucide-react";
import Link from "next/link";
import { MediaImage } from "@/components/media-image";
import { timeAgo } from "@/lib/format";
import type { PlaylistSummary } from "@/types";

export function PlaylistCard({ playlist, showOwner }: { playlist: PlaylistSummary; showOwner?: boolean }) {
  return (
    <article className="group">
      <Link href={`/playlist/${playlist.id}`} className="block">
        <div className="relative">
          {/* stacked-cards effect */}
          <div className="absolute inset-x-3 -top-1.5 h-3 rounded-t-lg bg-muted-foreground/25" aria-hidden />
          <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
            <MediaImage src={playlist.thumbnailUrl} alt="" fill sizes="(max-width: 640px) 100vw, 320px" className="object-cover" />
            <span className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded-[5px] bg-black/75 px-1.5 py-px text-xs font-medium text-white">
              <ListVideo className="size-3.5" /> {playlist.videoCount} {playlist.videoCount === 1 ? "video" : "videos"}
            </span>
          </div>
        </div>
        <h3 className="mt-3 line-clamp-2 text-[15px] font-medium leading-snug">{playlist.name}</h3>
      </Link>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
        {playlist.visibility === "PRIVATE" && <Lock className="size-3.5" aria-label="Private" />}
        {playlist.visibility === "UNLISTED" && <Link2 className="size-3.5" aria-label="Unlisted" />}
        {showOwner ? (
          <Link href={`/channel/${playlist.owner.username}`} className="hover:text-foreground">
            {playlist.owner.name}
          </Link>
        ) : (
          <span suppressHydrationWarning>Updated {timeAgo(playlist.updatedAt)}</span>
        )}
      </p>
      <Link href={`/playlist/${playlist.id}`} className="mt-0.5 block text-sm font-medium text-muted-foreground hover:text-foreground">
        View full playlist
      </Link>
    </article>
  );
}
