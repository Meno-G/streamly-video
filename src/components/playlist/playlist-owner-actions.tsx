"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { deletePlaylist } from "@/server/actions/playlists";
import type { Visibility } from "@/types";
import { PlaylistFormDialog } from "./playlist-form-dialog";

export function PlaylistOwnerActions({
  playlist,
}: {
  playlist: { id: string; name: string; description: string; visibility: Visibility };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex gap-2">
      <PlaylistFormDialog playlist={playlist}>
        <Button variant="secondary" size="icon" className="rounded-full" aria-label="Edit playlist">
          <Pencil />
        </Button>
      </PlaylistFormDialog>
      <ConfirmDialog
        title={`Delete “${playlist.name}”?`}
        description="The playlist is removed for everyone. The videos themselves are not deleted."
        confirmLabel="Delete playlist"
        destructive
        pending={pending}
        onConfirm={() =>
          startTransition(async () => {
            const res = await deletePlaylist(playlist.id);
            if (!res.ok) return void toast.error(res.error);
            toast.success("Playlist deleted");
            router.push("/library");
          })
        }
      >
        <Button variant="secondary" size="icon" className="rounded-full" aria-label="Delete playlist">
          <Trash2 />
        </Button>
      </ConfirmDialog>
    </div>
  );
}
