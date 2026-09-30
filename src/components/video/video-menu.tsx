"use client";

import { Clock, ListPlus, MoreVertical, Share2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useCurrentUser } from "@/components/current-user";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toggleWatchLater } from "@/server/actions/interactions";
import { SaveToPlaylistDialog } from "./save-to-playlist-dialog";
import { shareVideo } from "./share";

export function requireSignIn(router: ReturnType<typeof useRouter>, message = "Sign in to do that") {
  toast(message, {
    action: { label: "Sign in", onClick: () => router.push(`/login?callbackUrl=${encodeURIComponent(location.pathname + location.search)}`) },
  });
}

/** The ⋮ menu on video cards and rows. `onRemove` adds a remove action for personal lists. */
export function VideoMenu({
  videoId,
  title,
  className,
  onRemove,
  removeLabel = "Remove",
}: {
  videoId: string;
  title: string;
  className?: string;
  onRemove?: () => void;
  removeLabel?: string;
}) {
  const user = useCurrentUser();
  const router = useRouter();
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [, startTransition] = useTransition();

  const saveForLater = () => {
    if (!user) return requireSignIn(router, "Sign in to save videos");
    startTransition(async () => {
      const res = await toggleWatchLater(videoId);
      if (!res.ok) toast.error(res.error);
      else toast.success(res.data.saved ? "Saved to Watch later" : "Removed from Watch later");
    });
  };

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`More actions for ${title}`}
            className={cn("shrink-0 rounded-full", className)}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onSelect={saveForLater}>
            <Clock /> Save to Watch later
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => (user ? setPlaylistOpen(true) : requireSignIn(router, "Sign in to use playlists"))}
          >
            <ListPlus /> Save to playlist
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => shareVideo(videoId, title)}>
            <Share2 /> Share
          </DropdownMenuItem>
          {onRemove && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onRemove} variant="destructive">
                <Trash2 /> {removeLabel}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {user && <SaveToPlaylistDialog videoId={videoId} open={playlistOpen} onOpenChange={setPlaylistOpen} />}
    </>
  );
}
