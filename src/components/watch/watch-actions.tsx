"use client";

import { Clock, ListPlus, Pencil, Share2, ThumbsDown, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { SubscribeButton } from "@/components/channel/subscribe-button";
import { useCurrentUser } from "@/components/current-user";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { VerifiedBadge } from "@/components/video/video-card";
import { SaveToPlaylistDialog } from "@/components/video/save-to-playlist-dialog";
import { shareVideo } from "@/components/video/share";
import { requireSignIn } from "@/components/video/video-menu";
import { formatCompact, formatSubscribers } from "@/lib/format";
import { cn } from "@/lib/utils";
import { reactToVideo, toggleWatchLater } from "@/server/actions/interactions";
import type { ChannelSummary } from "@/types";

type Props = {
  videoId: string;
  title: string;
  channel: ChannelSummary;
  subscriberCount: number;
  subscribed: boolean;
  likeCount: number;
  myReaction: "LIKE" | "DISLIKE" | null;
  saved: boolean;
  isOwner: boolean;
};

export function WatchActions(props: Props) {
  const user = useCurrentUser();
  const router = useRouter();
  const [likes, setLikes] = useState(props.likeCount);
  const [reaction, setReaction] = useState(props.myReaction);
  const [saved, setSaved] = useState(props.saved);
  const [subs, setSubs] = useState(props.subscriberCount);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [, startTransition] = useTransition();

  const react = (type: "LIKE" | "DISLIKE") => {
    if (!user) return requireSignIn(router, type === "LIKE" ? "Sign in to like videos" : "Sign in to rate videos");
    const prev = { likes, reaction };
    // optimistic
    const next = reaction === type ? null : type;
    setReaction(next);
    setLikes(likes + (next === "LIKE" ? 1 : 0) - (reaction === "LIKE" ? 1 : 0));
    startTransition(async () => {
      const res = await reactToVideo(props.videoId, type);
      if (!res.ok) {
        setReaction(prev.reaction);
        setLikes(prev.likes);
        toast.error(res.error);
        return;
      }
      setReaction(res.data.myReaction);
      setLikes(res.data.likeCount);
    });
  };

  const save = () => {
    if (!user) return requireSignIn(router, "Sign in to save videos");
    setSaved(!saved);
    startTransition(async () => {
      const res = await toggleWatchLater(props.videoId);
      if (!res.ok) {
        setSaved(saved);
        toast.error(res.error);
        return;
      }
      setSaved(res.data.saved);
      toast.success(res.data.saved ? "Saved to Watch later" : "Removed from Watch later");
    });
  };

  return (
    <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <Link href={`/channel/${props.channel.username}`} className="shrink-0 rounded-full">
          <UserAvatar name={props.channel.name} src={props.channel.avatarUrl} className="size-10" />
        </Link>
        <div className="mr-2 min-w-0">
          <Link href={`/channel/${props.channel.username}`} className="flex items-center gap-1 font-semibold">
            <span className="truncate">{props.channel.name}</span>
            {props.channel.verified && <VerifiedBadge />}
          </Link>
          <p className="text-xs text-muted-foreground">{formatSubscribers(subs)}</p>
        </div>
        {props.isOwner ? (
          <Button asChild variant="secondary" className="rounded-full">
            <Link href={`/studio/videos/${props.videoId}/edit`}>
              <Pencil /> Edit video
            </Link>
          </Button>
        ) : (
          <SubscribeButton
            channelId={props.channel.id}
            channelName={props.channel.name}
            initialSubscribed={props.subscribed}
            onCountChange={setSubs}
          />
        )}
      </div>

      <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:px-0 sm:pb-0">
        <div className="flex shrink-0 items-center rounded-full bg-secondary">
          <button
            type="button"
            onClick={() => react("LIKE")}
            aria-pressed={reaction === "LIKE"}
            aria-label={`Like this video along with ${likes} other people`}
            className="flex h-9 items-center gap-2 rounded-l-full pl-4 pr-3 text-sm font-medium hover:bg-accent"
          >
            <ThumbsUp className={cn("size-[18px]", reaction === "LIKE" && "fill-foreground")} />
            <span className="tabular-nums">{formatCompact(likes)}</span>
          </button>
          <span className="h-6 w-px bg-border" aria-hidden />
          <button
            type="button"
            onClick={() => react("DISLIKE")}
            aria-pressed={reaction === "DISLIKE"}
            aria-label="Dislike this video"
            className="flex h-9 items-center rounded-r-full pl-3 pr-4 hover:bg-accent"
          >
            <ThumbsDown className={cn("size-[18px]", reaction === "DISLIKE" && "fill-foreground")} />
          </button>
        </div>
        <Button variant="secondary" className="shrink-0 rounded-full" onClick={() => shareVideo(props.videoId, props.title)}>
          <Share2 /> Share
        </Button>
        <Button variant="secondary" className="shrink-0 rounded-full" onClick={save} aria-pressed={saved}>
          <Clock className={cn(saved && "text-primary")} /> {saved ? "Saved" : "Watch later"}
        </Button>
        <Button
          variant="secondary"
          className="shrink-0 rounded-full"
          onClick={() => (user ? setPlaylistOpen(true) : requireSignIn(router, "Sign in to use playlists"))}
        >
          <ListPlus /> Save
        </Button>
      </div>
      {user && <SaveToPlaylistDialog videoId={props.videoId} open={playlistOpen} onOpenChange={setPlaylistOpen} />}
    </div>
  );
}
