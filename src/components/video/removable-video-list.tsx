"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/validations";
import type { VideoCardData } from "@/types";
import { VideoRow } from "./video-card";

/** A personal list (history, liked, watch later) where each row can be removed. */
export function RemovableVideoList({
  videos,
  remove,
  removeLabel,
  removedMessage,
  numbered,
  startIndex = 1,
}: {
  videos: VideoCardData[];
  remove: (videoId: string) => Promise<ActionResult>;
  removeLabel: string;
  removedMessage: string;
  numbered?: boolean;
  startIndex?: number;
}) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  const onRemove = (id: string) => {
    setHidden((h) => new Set(h).add(id));
    startTransition(async () => {
      const res = await remove(id);
      if (!res.ok) {
        toast.error(res.error);
        setHidden((h) => {
          const next = new Set(h);
          next.delete(id);
          return next;
        });
      } else {
        toast.success(removedMessage);
      }
    });
  };

  const visible = videos.filter((v) => !hidden.has(v.id));
  return (
    <div className="flex flex-col gap-4">
      {visible.map((v, i) => (
        <VideoRow
          key={v.id}
          video={v}
          size="lg"
          showDescription
          index={numbered ? startIndex + i : undefined}
          onRemove={() => onRemove(v.id)}
          removeLabel={removeLabel}
        />
      ))}
    </div>
  );
}
