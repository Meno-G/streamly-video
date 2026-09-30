"use client";

import { ExternalLink, MoreVertical, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteVideo } from "@/server/actions/studio";

export function VideoRowActions({ videoId, title }: { videoId: string; title: string }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        <Button asChild variant="ghost" size="icon-sm" aria-label={`Edit ${title}`}>
          <Link href={`/studio/videos/${videoId}/edit`}>
            <Pencil />
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={`More actions for ${title}`}>
              <MoreVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/watch/${videoId}`}>
                <ExternalLink /> View on Streamly
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/studio/videos/${videoId}/edit`}>
                <Pencil /> Edit details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => setConfirmOpen(true)}>
              <Trash2 /> Delete forever
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete this video permanently?"
        description={`“${title}” and its comments, likes and stats will be deleted. This can’t be undone.`}
        confirmLabel="Delete video"
        destructive
        pending={pending}
        onConfirm={() =>
          startTransition(async () => {
            const res = await deleteVideo(videoId);
            if (!res.ok) return void toast.error(res.error);
            toast.success("Video deleted");
            router.refresh();
          })
        }
      />
    </>
  );
}
