import { ListVideo } from "lucide-react";
import Link from "next/link";
import { MediaImage } from "@/components/media-image";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PlaylistPageData } from "@/server/queries/playlists";

export function PlaylistPanel({ playlist, currentId }: { playlist: PlaylistPageData; currentId: string }) {
  const index = playlist.videos.findIndex((v) => v.id === currentId);
  return (
    <section aria-label="Playlist" className="mb-6 overflow-hidden rounded-xl border border-border">
      <div className="border-b border-border bg-secondary/60 px-4 py-3">
        <Link href={`/playlist/${playlist.id}`} className="flex items-center gap-2 font-semibold hover:underline">
          <ListVideo className="size-4" /> {playlist.name}
        </Link>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {playlist.owner.name} · {index + 1} / {playlist.videos.length}
        </p>
      </div>
      <ol className="max-h-[420px] overflow-y-auto py-1">
        {playlist.videos.map((v, i) => (
          <li key={v.id}>
            <Link
              href={`/watch/${v.id}?list=${playlist.id}`}
              aria-current={v.id === currentId ? "true" : undefined}
              className={cn("flex items-center gap-2 px-2 py-1.5 hover:bg-accent", v.id === currentId && "bg-accent")}
            >
              <span className="w-5 shrink-0 text-center text-xs text-muted-foreground">{v.id === currentId ? "▶" : i + 1}</span>
              <div className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-md bg-muted">
                <MediaImage src={v.thumbnailUrl} alt="" fill sizes="96px" className="object-cover" />
                <span className="absolute bottom-0.5 right-0.5 rounded bg-black/75 px-1 text-[10px] text-white">
                  {formatDuration(v.durationSeconds)}
                </span>
              </div>
              <div className="min-w-0">
                <p className="line-clamp-2 text-sm font-medium leading-snug">{v.title}</p>
                <p className="truncate text-xs text-muted-foreground">{v.channel.name}</p>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
