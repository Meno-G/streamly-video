"use client";

import { Globe, Link2, Loader2, Lock, Plus } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createPlaylist, listMyPlaylistsForVideo, setVideoInPlaylist } from "@/server/actions/playlists";
import type { Visibility } from "@/types";

type Row = { id: string; name: string; visibility: Visibility; hasVideo: boolean };

const VIS_ICON = { PUBLIC: Globe, UNLISTED: Link2, PRIVATE: Lock } as const;

export function SaveToPlaylistDialog({
  videoId,
  open,
  onOpenChange,
}: {
  videoId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("PRIVATE");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    listMyPlaylistsForVideo(videoId).then((res) => {
      if (cancelled) return;
      if (res.ok) setRows(res.data);
      else toast.error(res.error);
    });
    return () => {
      cancelled = true;
    };
  }, [open, videoId]);

  const toggle = (row: Row) => {
    const include = !row.hasVideo;
    setRows((rs) => rs?.map((r) => (r.id === row.id ? { ...r, hasVideo: include } : r)) ?? null);
    startTransition(async () => {
      const res = await setVideoInPlaylist(row.id, videoId, include);
      if (!res.ok) {
        toast.error(res.error);
        setRows((rs) => rs?.map((r) => (r.id === row.id ? { ...r, hasVideo: !include } : r)) ?? null);
      } else {
        toast.success(include ? `Saved to ${row.name}` : `Removed from ${row.name}`);
      }
    });
  };

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createPlaylist({ name, visibility, videoId });
      if (!res.ok) {
        toast.error(res.fieldErrors?.name?.[0] ?? res.error);
        return;
      }
      setRows((rs) => [{ id: res.data.id, name: name.trim(), visibility, hasVideo: true }, ...(rs ?? [])]);
      toast.success(`Saved to ${name.trim()}`);
      setName("");
      setCreating(false);
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setCreating(false);
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Save to playlist</DialogTitle>
          <DialogDescription className="sr-only">Choose playlists for this video</DialogDescription>
        </DialogHeader>

        <div className="-mx-2 max-h-72 overflow-y-auto">
          {rows === null ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Loading playlists" />
            </div>
          ) : rows.length === 0 ? (
            <p className="px-2 py-4 text-sm text-muted-foreground">You don’t have any playlists yet. Create one below.</p>
          ) : (
            <ul>
              {rows.map((row) => {
                const Icon = VIS_ICON[row.visibility];
                return (
                  <li key={row.id}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-accent">
                      <input
                        type="checkbox"
                        checked={row.hasVideo}
                        onChange={() => toggle(row)}
                        className="size-4 accent-[var(--primary)]"
                      />
                      <span className="flex-1 truncate text-sm">{row.name}</span>
                      <Icon className="size-4 text-muted-foreground" aria-label={row.visibility.toLowerCase()} />
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {creating ? (
          <form onSubmit={create} className="space-y-3 border-t border-border pt-4">
            <div className="space-y-1.5">
              <Label htmlFor="playlist-name">Name</Label>
              <Input
                id="playlist-name"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                placeholder="e.g. Weekend watch list"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Visibility</Label>
              <Select value={visibility} onValueChange={(v) => setVisibility(v as Visibility)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC">Public</SelectItem>
                  <SelectItem value="UNLISTED">Unlisted</SelectItem>
                  <SelectItem value="PRIVATE">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setCreating(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!name.trim() || pending}>
                {pending && <Loader2 className="animate-spin" />} Create
              </Button>
            </div>
          </form>
        ) : (
          <Button variant="ghost" className="justify-start" onClick={() => setCreating(true)}>
            <Plus /> New playlist
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
