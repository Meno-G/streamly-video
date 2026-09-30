"use client";

import { BadgeCheck, Link2, Lock } from "lucide-react";
import Link from "next/link";
import { MediaImage } from "@/components/media-image";
import { UserAvatar } from "@/components/user-avatar";
import { formatDuration, formatViews, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { VideoCardData } from "@/types";
import { VideoMenu } from "./video-menu";

export function VerifiedBadge({ className }: { className?: string }) {
  return <BadgeCheck className={cn("inline size-3.5 shrink-0 text-muted-foreground", className)} aria-label="Verified" />;
}

export function DurationBadge({ seconds, isShort }: { seconds: number; isShort?: boolean }) {
  return (
    <span className="absolute bottom-1.5 right-1.5 rounded-[5px] bg-black/75 px-1.5 py-px text-xs font-medium tabular-nums text-white">
      {isShort ? "SHORT" : formatDuration(seconds)}
    </span>
  );
}

export function VisibilityBadge({ visibility }: { visibility: VideoCardData["visibility"] }) {
  if (visibility === "PUBLIC") return null;
  const Icon = visibility === "PRIVATE" ? Lock : Link2;
  return (
    <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-[5px] bg-black/75 px-1.5 py-px text-xs text-white">
      <Icon className="size-3" /> {visibility === "PRIVATE" ? "Private" : "Unlisted"}
    </span>
  );
}

export function VideoThumbnail({
  video,
  sizes,
  priority,
  className,
}: {
  video: Pick<VideoCardData, "thumbnailUrl" | "durationSeconds" | "isShort" | "visibility" | "title">;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("relative aspect-video overflow-hidden rounded-xl bg-muted", className)}>
      <MediaImage
        src={video.thumbnailUrl}
        alt=""
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
      />
      <VisibilityBadge visibility={video.visibility} />
      <DurationBadge seconds={video.durationSeconds} isShort={video.isShort} />
    </div>
  );
}

/** Grid card: thumbnail, title, channel, views and date, ⋮ menu. */
export function VideoCard({ video, priority, hideChannel }: { video: VideoCardData; priority?: boolean; hideChannel?: boolean }) {
  return (
    <article className="group relative flex flex-col gap-3">
      <Link href={`/watch/${video.id}`} aria-label={video.title} className="rounded-xl">
        <VideoThumbnail
          video={video}
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 33vw, 25vw"
        />
      </Link>
      <div className="flex gap-3 pr-1">
        {!hideChannel && (
          <Link href={`/channel/${video.channel.username}`} className="shrink-0 rounded-full" tabIndex={-1} aria-hidden>
            <UserAvatar name={video.channel.name} src={video.channel.avatarUrl} className="size-9" />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-[15px] font-medium leading-snug">
            <Link href={`/watch/${video.id}`} className="hover:text-foreground/90">
              {video.title}
            </Link>
          </h3>
          {!hideChannel && (
            <Link
              href={`/channel/${video.channel.username}`}
              className="mt-1 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <span className="truncate">{video.channel.name}</span>
              {video.channel.verified && <VerifiedBadge />}
            </Link>
          )}
          <p className="text-sm text-muted-foreground">
            {formatViews(video.views)} <span aria-hidden>·</span>{" "}
            <time dateTime={video.createdAt} suppressHydrationWarning>
              {timeAgo(video.createdAt)}
            </time>
          </p>
        </div>
        <VideoMenu
          videoId={video.id}
          title={video.title}
          className="-mr-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100 md:data-[state=open]:opacity-100"
        />
      </div>
    </article>
  );
}

/** Horizontal row for search results, recommendations and personal lists. */
export function VideoRow({
  video,
  size = "md",
  showDescription,
  onRemove,
  removeLabel,
  index,
  active,
  href,
}: {
  video: VideoCardData;
  size?: "sm" | "md" | "lg";
  showDescription?: boolean;
  onRemove?: () => void;
  removeLabel?: string;
  index?: number;
  active?: boolean;
  href?: string;
}) {
  const link = href ?? `/watch/${video.id}`;
  const thumbWidth = { sm: "w-40 sm:w-[168px]", md: "w-40 sm:w-60", lg: "w-full sm:w-[360px]" }[size];
  return (
    <article className={cn("group relative flex gap-3 rounded-xl", size === "lg" && "flex-col sm:flex-row sm:gap-4", active && "bg-accent")}>
      {index !== undefined && (
        <span className="hidden w-6 shrink-0 self-center text-center text-sm text-muted-foreground sm:block">{index}</span>
      )}
      <Link href={link} aria-label={video.title} className={cn("shrink-0 rounded-xl", thumbWidth)}>
        <VideoThumbnail video={video} sizes={size === "lg" ? "(max-width: 640px) 100vw, 360px" : "240px"} className={size === "sm" ? "rounded-lg" : undefined} />
      </Link>
      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex gap-1">
          <h3 className={cn("line-clamp-2 flex-1 font-medium leading-snug", size === "sm" ? "text-sm" : size === "lg" ? "text-lg" : "text-base")}>
            <Link href={link}>{video.title}</Link>
          </h3>
          <VideoMenu videoId={video.id} title={video.title} onRemove={onRemove} removeLabel={removeLabel} className="-mr-2 -mt-1" />
        </div>
        <div className={cn("text-muted-foreground", size === "sm" ? "text-xs" : "text-[13px]")}>
          {size === "lg" && (
            <p>
              {formatViews(video.views)} · <time suppressHydrationWarning>{timeAgo(video.createdAt)}</time>
            </p>
          )}
          <Link
            href={`/channel/${video.channel.username}`}
            className={cn("flex items-center gap-1.5 hover:text-foreground", size === "lg" ? "my-2" : "mt-1")}
          >
            {size === "lg" && <UserAvatar name={video.channel.name} src={video.channel.avatarUrl} className="size-6 text-[10px]" />}
            <span className="truncate">{video.channel.name}</span>
            {video.channel.verified && <VerifiedBadge />}
          </Link>
          {size !== "lg" && (
            <p>
              {formatViews(video.views)} · <time suppressHydrationWarning>{timeAgo(video.createdAt)}</time>
            </p>
          )}
          {showDescription && video.description && (
            <p className="mt-1 line-clamp-2 hidden text-xs sm:block">{video.description}</p>
          )}
        </div>
      </div>
    </article>
  );
}

