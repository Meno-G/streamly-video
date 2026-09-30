import { Globe, Link2, Lock, PlaySquare } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { MediaImage } from "@/components/media-image";
import { Pager } from "@/components/pager";
import { VideoRowActions } from "@/components/studio/video-row-actions";
import { Button } from "@/components/ui/button";
import { formatDate, formatDuration } from "@/lib/format";
import { getStudioVideos } from "@/server/queries/videos";
import { parsePage } from "@/server/queries/shared";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { title: "Channel content", robots: { index: false } };

const VIS = {
  PUBLIC: { label: "Public", icon: Globe },
  UNLISTED: { label: "Unlisted", icon: Link2 },
  PRIVATE: { label: "Private", icon: Lock },
} as const;

const PAGE_SIZE = 20;

export default async function StudioVideosPage({ searchParams }: PageProps<"/studio/videos">) {
  const user = await requireUser("/studio/videos");
  const page = parsePage((await searchParams).page);
  const videos = await getStudioVideos(user.id, page, PAGE_SIZE);

  if (videos.total === 0) {
    return (
      <EmptyState
        icon={PlaySquare}
        title="No videos yet"
        description="Videos you upload will appear here for editing."
        action={
          <Button asChild>
            <Link href="/upload">Upload video</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="pb-10">
      <p className="mb-4 text-sm text-muted-foreground">{videos.total} videos</p>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Video</th>
              <th scope="col" className="px-3 py-3 font-medium">Visibility</th>
              <th scope="col" className="px-3 py-3 font-medium">Date</th>
              <th scope="col" className="px-3 py-3 text-right font-medium">Views</th>
              <th scope="col" className="px-3 py-3 text-right font-medium">Likes</th>
              <th scope="col" className="px-3 py-3 text-right font-medium">Comments</th>
              <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {videos.items.map((v) => {
              const vis = VIS[v.visibility];
              return (
                <tr key={v.id} className="hover:bg-accent/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link href={`/watch/${v.id}`} className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-md bg-muted">
                        <MediaImage src={v.thumbnailUrl} alt="" fill sizes="112px" className="object-cover" />
                        <span className="absolute bottom-0.5 right-0.5 rounded bg-black/75 px-1 text-[10px] text-white">
                          {formatDuration(v.durationSeconds)}
                        </span>
                      </Link>
                      <div className="min-w-0">
                        <Link href={`/studio/videos/${v.id}/edit`} className="line-clamp-2 font-medium hover:underline">
                          {v.title}
                        </Link>
                        {v.isShort && <span className="text-xs text-muted-foreground">Short</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      <vis.icon className="size-4 text-muted-foreground" /> {vis.label}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">{formatDate(v.createdAt)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{v.views.toLocaleString("en")}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{v.likeCount.toLocaleString("en")}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{v.commentCount.toLocaleString("en")}</td>
                  <td className="px-4 py-3">
                    <VideoRowActions videoId={v.id} title={v.title} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pager page={page} hasMore={videos.hasMore} basePath="/studio/videos" />
    </div>
  );
}
