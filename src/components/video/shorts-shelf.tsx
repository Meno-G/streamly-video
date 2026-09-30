import { Zap } from "lucide-react";
import Link from "next/link";
import { MediaImage } from "@/components/media-image";
import { formatViews } from "@/lib/format";
import type { VideoCardData } from "@/types";

export function ShortCard({ video }: { video: VideoCardData }) {
  return (
    <Link href={`/watch/${video.id}`} className="group flex w-40 shrink-0 flex-col gap-2 sm:w-48">
      <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-muted">
        <MediaImage
          src={video.thumbnailUrl}
          alt=""
          fill
          sizes="192px"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>
      <div className="pr-2">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug">{video.title}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{formatViews(video.views)}</p>
      </div>
    </Link>
  );
}

export function ShortsShelf({ shorts }: { shorts: VideoCardData[] }) {
  if (!shorts.length) return null;
  return (
    <section aria-labelledby="shorts-heading" className="border-y border-border py-6">
      <h2 id="shorts-heading" className="mb-4 flex items-center gap-2 text-xl font-bold">
        <Zap className="size-5 fill-primary text-primary" aria-hidden /> Shorts
      </h2>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-none sm:-mx-6 sm:px-6">
        {shorts.map((s) => (
          <ShortCard key={s.id} video={s} />
        ))}
      </div>
    </section>
  );
}
