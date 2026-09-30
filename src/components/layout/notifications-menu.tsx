"use client";

import { Bell, BellOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { MediaImage } from "@/components/media-image";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { UserAvatar } from "@/components/user-avatar";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { fetchNotifications, markAllNotificationsRead } from "@/server/actions/notifications";
import type { NotificationData } from "@/types";

function describe(n: NotificationData) {
  switch (n.type) {
    case "NEW_SUBSCRIBER":
      return "subscribed to your channel";
    case "VIDEO_LIKE":
      return `liked your video “${n.video?.title ?? ""}”`;
    case "VIDEO_COMMENT":
      return `commented on “${n.video?.title ?? ""}”`;
    case "COMMENT_REPLY":
      return "replied to your comment";
  }
}

function hrefFor(n: NotificationData) {
  return n.type === "NEW_SUBSCRIBER" || !n.video ? `/channel/${n.actor.username}` : `/watch/${n.video.id}`;
}

export function NotificationsMenu({ initialUnread }: { initialUnread: number }) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(initialUnread);
  const [items, setItems] = useState<NotificationData[] | null>(null);
  const [pending, startTransition] = useTransition();

  const load = () =>
    startTransition(async () => {
      const res = await fetchNotifications();
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setItems(res.data.items);
      if (res.data.unread > 0) {
        setUnread(0);
        await markAllNotificationsRead();
      }
    });

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) load();
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}>
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[min(92vw,420px)] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="font-semibold">Notifications</p>
          {pending && <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Loading" />}
        </div>
        <div className="max-h-[min(70vh,520px)] overflow-y-auto py-1">
          {items === null ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="size-9 animate-pulse rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-10 text-center text-sm text-muted-foreground">
              <BellOff className="size-8 opacity-60" />
              <p className="font-medium text-foreground">No notifications yet</p>
              <p>New subscribers, comments, replies and likes on your videos show up here.</p>
            </div>
          ) : (
            <ul>
              {items.map((n) => (
                <li key={n.id}>
                  <Link
                    href={hrefFor(n)}
                    onClick={() => setOpen(false)}
                    className={cn("flex gap-3 px-4 py-3 hover:bg-accent", !n.read && "bg-primary/5")}
                  >
                    <UserAvatar name={n.actor.name} src={n.actor.avatarUrl} className="size-9 shrink-0" />
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="line-clamp-2">
                        <span className="font-medium">{n.actor.name}</span> {describe(n)}
                      </p>
                      {n.commentExcerpt && (
                        <p className="mt-0.5 line-clamp-1 text-muted-foreground">“{n.commentExcerpt}”</p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">{timeAgo(n.createdAt)}</p>
                    </div>
                    {n.video && (
                      <div className="relative aspect-video w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                        <MediaImage src={n.video.thumbnailUrl} alt="" fill sizes="80px" className="object-cover" />
                      </div>
                    )}
                    {!n.read && <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
