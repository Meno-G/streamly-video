"use client";

import { CheckCircle2, FileVideo, ImagePlus, Link2, Loader2, Lock, Globe, UploadCloud, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { FieldErrors } from "@/lib/validations";
import type { Visibility } from "@/types";
import { inspectVideo } from "./video-inspect";

const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const VISIBILITY = [
  { value: "PUBLIC", label: "Public", hint: "Everyone can watch and find it", icon: Globe },
  { value: "UNLISTED", label: "Unlisted", hint: "Anyone with the link can watch", icon: Link2 },
  { value: "PRIVATE", label: "Private", hint: "Only you can watch", icon: Lock },
] as const;

function formatBytes(n: number) {
  return n > 1024 * 1024 * 1024 ? `${(n / 1024 ** 3).toFixed(2)} GB` : `${(n / 1024 ** 2).toFixed(1)} MB`;
}

function titleFromFile(name: string) {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

export function UploadForm({
  categories,
  maxVideoBytes,
  maxImageBytes,
}: {
  categories: { id: string; name: string }[];
  maxVideoBytes: number;
  maxImageBytes: number;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [frames, setFrames] = useState<Blob[]>([]);
  const [inspecting, setInspecting] = useState(false);
  const [thumbChoice, setThumbChoice] = useState<number | "custom">(0);
  const [customThumb, setCustomThumb] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("PUBLIC");
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const thumbInput = useRef<HTMLInputElement>(null);

  const frameUrls = useMemo(() => frames.map((f) => URL.createObjectURL(f)), [frames]);
  const customUrl = useMemo(() => (customThumb ? URL.createObjectURL(customThumb) : null), [customThumb]);
  useEffect(() => () => frameUrls.forEach(URL.revokeObjectURL), [frameUrls]);
  useEffect(() => () => void (customUrl && URL.revokeObjectURL(customUrl)), [customUrl]);

  const uploading = progress !== null;

  // Warn before leaving mid-upload.
  useEffect(() => {
    if (!uploading) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [uploading]);

  const chooseVideo = async (f: File | undefined) => {
    if (!f) return;
    setFormError(null);
    if (!VIDEO_TYPES.includes(f.type)) {
      setErrors({ video: ["Choose an MP4, WebM or MOV video"] });
      return;
    }
    if (f.size > maxVideoBytes) {
      setErrors({ video: [`That file is ${formatBytes(f.size)}. The limit is ${formatBytes(maxVideoBytes)}.`] });
      return;
    }
    setErrors({});
    setFile(f);
    if (!title) setTitle(titleFromFile(f.name));
    setInspecting(true);
    setFrames([]);
    setDuration(null);
    try {
      const info = await inspectVideo(f);
      setDuration(info.duration);
      setFrames(info.frames);
      setThumbChoice(info.frames.length ? 0 : "custom");
    } catch (e) {
      setErrors({ video: [e instanceof Error ? e.message : "This video can’t be read"] });
      setFile(null);
    } finally {
      setInspecting(false);
    }
  };

  const chooseThumb = (f: File | undefined) => {
    if (!f) return;
    if (!IMAGE_TYPES.includes(f.type)) return setErrors((e) => ({ ...e, thumbnail: ["Use a JPG, PNG or WebP image"] }));
    if (f.size > maxImageBytes) return setErrors((e) => ({ ...e, thumbnail: [`Images can be at most ${formatBytes(maxImageBytes)}`] }));
    setErrors((e) => ({ ...e, thumbnail: undefined }));
    setCustomThumb(f);
    setThumbChoice("custom");
  };

  const validate = () => {
    const next: FieldErrors = {};
    if (!file) next.video = ["Choose a video to upload"];
    if (!title.trim()) next.title = ["Title is required"];
    if (title.length > 100) next.title = ["Title must be 100 characters or fewer"];
    if (description.length > 5000) next.description = ["Description must be 5000 characters or fewer"];
    if (!categoryId) next.categoryId = ["Choose a category"];
    if (!duration) next.video = ["Still reading the video. Wait a moment and try again."];
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!validate() || !file || !duration) return;

    const data = new FormData();
    data.set("video", file);
    const thumb = thumbChoice === "custom" ? customThumb : frames[thumbChoice];
    if (thumb) data.set("thumbnail", thumb instanceof File ? thumb : new File([thumb], "thumbnail.jpg", { type: "image/jpeg" }));
    data.set("title", title);
    data.set("description", description);
    data.set("tags", tags);
    data.set("categoryId", categoryId);
    data.set("visibility", visibility);
    data.set("durationSeconds", String(duration));

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    xhr.open("POST", "/api/upload");
    xhr.responseType = "json";
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100));
    };
    xhr.upload.onload = () => setProcessing(true);
    xhr.onload = () => {
      setProcessing(false);
      const body = xhr.response ?? {};
      if (xhr.status === 201 && body.id) {
        toast.success("Upload complete", { description: title });
        router.push(`/watch/${body.id}`);
        return;
      }
      setProgress(null);
      setErrors(body.fieldErrors ?? {});
      setFormError(body.error ?? `Upload failed (${xhr.status}). Try again.`);
      if (xhr.status === 401) router.push("/login?callbackUrl=/upload");
    };
    xhr.onerror = () => {
      setProgress(null);
      setProcessing(false);
      setFormError("Network error. Check your connection and try again.");
    };
    xhr.onabort = () => {
      setProgress(null);
      setProcessing(false);
      toast("Upload cancelled");
    };
    setProgress(0);
    xhr.send(data);
  };

  const err = (k: string) => errors[k]?.[0];

  return (
    <form onSubmit={submit} noValidate className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        {/* Dropzone */}
        {!file ? (
          <div
            role="button"
            tabIndex={0}
            onClick={() => videoInput.current?.click()}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && videoInput.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              void chooseVideo(e.dataTransfer.files[0]);
            }}
            aria-describedby="video-help"
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-16 text-center transition-colors",
              dragging ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50 hover:bg-accent/40",
              err("video") && "border-destructive"
            )}
          >
            <span className="grid size-20 place-items-center rounded-full bg-muted">
              <UploadCloud className="size-9 text-muted-foreground" />
            </span>
            <p className="mt-5 text-lg font-medium">Drag and drop a video to upload</p>
            <p id="video-help" className="mt-1 text-sm text-muted-foreground">
              MP4, WebM or MOV, up to {formatBytes(maxVideoBytes)}
            </p>
            <Button type="button" className="mt-6 rounded-full" tabIndex={-1}>
              Select file
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-4 rounded-2xl border border-border p-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <FileVideo className="size-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatBytes(file.size)}
                {duration ? ` · ${formatDuration(duration)}` : inspecting ? " · reading video…" : ""}
              </p>
            </div>
            {!uploading && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remove video"
                onClick={() => {
                  setFile(null);
                  setFrames([]);
                  setDuration(null);
                }}
              >
                <X />
              </Button>
            )}
          </div>
        )}
        <input
          ref={videoInput}
          type="file"
          accept={VIDEO_TYPES.join(",")}
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            void chooseVideo(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        {err("video") && <p className="text-sm text-destructive">{err("video")}</p>}

        {/* Details */}
        <div className="space-y-1.5">
          <Label htmlFor="title">Title (required)</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} aria-invalid={Boolean(err("title"))} placeholder="Add a title that describes your video" />
          <div className="flex justify-between text-xs">
            <span className="text-destructive">{err("title")}</span>
            <span className="text-muted-foreground tabular-nums">{title.length}/100</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={5000}
            rows={6}
            placeholder="Tell viewers about your video"
            aria-invalid={Boolean(err("description"))}
          />
          <div className="flex justify-between text-xs">
            <span className="text-destructive">{err("description")}</span>
            <span className="text-muted-foreground tabular-nums">{description.length}/5000</span>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="tags">Tags</Label>
            <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="travel, tokyo, night walk" />
            <p className="text-xs text-muted-foreground">Separate with commas. Up to 15.</p>
          </div>
          <div className="space-y-1.5">
            <Label>Category (required)</Label>
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

        {/* Thumbnail */}
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Thumbnail</legend>
          <p className="text-xs text-muted-foreground">Pick a frame from your video or upload an image (16:9 works best).</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {inspecting &&
              Array.from({ length: 3 }, (_, i) => <div key={i} className="aspect-video animate-pulse rounded-lg bg-muted" />)}
            {frameUrls.map((url, i) => (
              <button
                key={url}
                type="button"
                onClick={() => setThumbChoice(i)}
                aria-pressed={thumbChoice === i}
                aria-label={`Use frame ${i + 1}`}
                className={cn(
                  "relative aspect-video overflow-hidden rounded-lg ring-2 ring-offset-2 ring-offset-background transition",
                  thumbChoice === i ? "ring-primary" : "ring-transparent hover:ring-border"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
                <img src={url} alt="" className="size-full object-cover" />
                {thumbChoice === i && <CheckCircle2 className="absolute right-1 top-1 size-5 fill-primary text-primary-foreground" />}
              </button>
            ))}
            <button
              type="button"
              onClick={() => thumbInput.current?.click()}
              aria-pressed={thumbChoice === "custom"}
              className={cn(
                "relative flex aspect-video flex-col items-center justify-center gap-1 overflow-hidden rounded-lg border border-dashed border-border text-xs text-muted-foreground ring-2 ring-offset-2 ring-offset-background transition hover:bg-accent",
                thumbChoice === "custom" && customUrl ? "ring-primary" : "ring-transparent"
              )}
            >
              {customUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- local blob preview
                <img src={customUrl} alt="" className="absolute inset-0 size-full object-cover" />
              ) : (
                <>
                  <ImagePlus className="size-5" /> Upload image
                </>
              )}
            </button>
          </div>
          <input
            ref={thumbInput}
            type="file"
            accept={IMAGE_TYPES.join(",")}
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              chooseThumb(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          {err("thumbnail") && <p className="text-xs text-destructive">{err("thumbnail")}</p>}
        </fieldset>
      </div>

      {/* Side panel */}
      <div className="space-y-6 lg:sticky lg:top-20 lg:self-start">
        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-medium">Visibility</legend>
          {VISIBILITY.map(({ value, label, hint, icon: Icon }) => (
            <label
              key={value}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
                visibility === value ? "border-primary bg-primary/5" : "border-border hover:bg-accent/50"
              )}
            >
              <input
                type="radio"
                name="visibility"
                value={value}
                checked={visibility === value}
                onChange={() => setVisibility(value)}
                className="mt-1 accent-[var(--primary)]"
              />
              <div>
                <p className="flex items-center gap-1.5 text-sm font-medium">
                  <Icon className="size-4" /> {label}
                </p>
                <p className="text-xs text-muted-foreground">{hint}</p>
              </div>
            </label>
          ))}
        </fieldset>

        {uploading && (
          <div className="space-y-2 rounded-xl border border-border p-4" aria-live="polite">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 font-medium">
                {processing ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
                {processing ? "Processing…" : "Uploading…"}
              </span>
              <span className="tabular-nums text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress ?? 0} aria-label="Upload progress" />
            {!processing && (
              <Button type="button" variant="ghost" size="sm" onClick={() => xhrRef.current?.abort()}>
                Cancel upload
              </Button>
            )}
          </div>
        )}

        {formError && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {formError}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full rounded-full" disabled={uploading || inspecting}>
          {uploading ? <Loader2 className="animate-spin" /> : <UploadCloud />}
          {uploading ? "Uploading" : "Upload video"}
        </Button>
      </div>
    </form>
  );
}
