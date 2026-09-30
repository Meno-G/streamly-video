"use client";

import { ImagePlus, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { MediaImage } from "@/components/media-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { VISIBILITY_OPTIONS } from "@/lib/constants";
import type { FieldErrors } from "@/lib/validations";
import { updateVideo } from "@/server/actions/studio";
import type { Visibility } from "@/types";

export function EditVideoForm({
  video,
  categories,
}: {
  video: {
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string | null;
    visibility: Visibility;
    categoryId: string | null;
    tags: string[];
  };
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(video.title);
  const [description, setDescription] = useState(video.description);
  const [tags, setTags] = useState(video.tags.join(", "));
  const [categoryId, setCategoryId] = useState(video.categoryId ?? "");
  const [visibility, setVisibility] = useState<Visibility>(video.visibility);
  const [thumb, setThumb] = useState<File | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, startTransition] = useTransition();
  const thumbInput = useRef<HTMLInputElement>(null);
  const preview = useMemo(() => (thumb ? URL.createObjectURL(thumb) : video.thumbnailUrl), [thumb, video.thumbnailUrl]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    data.set("title", title);
    data.set("description", description);
    data.set("tags", tags);
    data.set("categoryId", categoryId);
    data.set("visibility", visibility);
    if (thumb) data.set("thumbnail", thumb);
    startTransition(async () => {
      const res = await updateVideo(video.id, data);
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        toast.error(res.error);
        return;
      }
      setErrors({});
      setThumb(null);
      toast.success("Changes saved");
      router.refresh();
    });
  };

  const err = (k: string) => errors[k]?.[0];

  return (
    <form onSubmit={submit} className="grid gap-8 pb-10 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-6">
        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} aria-invalid={Boolean(err("title"))} />
          <div className="flex justify-between text-xs">
            <span className="text-destructive">{err("title")}</span>
            <span className="tabular-nums text-muted-foreground">{title.length}/100</span>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={10} maxLength={5000} />
          <p className="text-right text-xs tabular-nums text-muted-foreground">{description.length}/5000</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="tags">Tags</Label>
            <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Separate with commas" />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="w-full" aria-invalid={Boolean(err("categoryId"))}>
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {err("categoryId") && <p className="text-xs text-destructive">{err("categoryId")}</p>}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label>Thumbnail</Label>
          <button
            type="button"
            onClick={() => thumbInput.current?.click()}
            className="group relative block aspect-video w-full overflow-hidden rounded-xl bg-muted"
          >
            <MediaImage src={preview} alt="" fill sizes="340px" className="object-cover" />
            <span className="absolute inset-0 flex items-center justify-center gap-2 bg-black/55 text-sm font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              <ImagePlus className="size-5" /> Change thumbnail
            </span>
          </button>
          <input
            ref={thumbInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) return void toast.error("Use a JPG, PNG or WebP image");
              if (f.size > 5 * 1024 * 1024) return void toast.error("Images can be at most 5 MB");
              setThumb(f);
            }}
          />
          {err("thumbnail") && <p className="text-xs text-destructive">{err("thumbnail")}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Visibility</Label>
          <Select value={visibility} onValueChange={(v) => setVisibility(v as Visibility)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VISIBILITY_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{VISIBILITY_OPTIONS.find((o) => o.value === visibility)?.description}</p>
        </div>

        <div className="flex gap-2">
          <Button asChild variant="outline" className="flex-1">
            <Link href={`/watch/${video.id}`}>View video</Link>
          </Button>
          <Button type="submit" className="flex-1" disabled={pending}>
            {pending && <Loader2 className="animate-spin" />} Save
          </Button>
        </div>
      </div>
    </form>
  );
}
