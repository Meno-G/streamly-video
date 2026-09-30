"use client";

import { Camera, ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/user-avatar";
import { cn } from "@/lib/utils";
import type { FieldErrors } from "@/lib/validations";
import { updateProfile } from "@/server/actions/profile";

type Link = { label: string; url: string };

export function ProfileForm({
  initial,
}: {
  initial: {
    name: string;
    username: string;
    email: string;
    bio: string;
    location: string;
    links: Link[];
    avatarUrl: string | null;
    bannerUrl: string | null;
    createdAt: string;
  };
}) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [username, setUsername] = useState(initial.username);
  const [bio, setBio] = useState(initial.bio);
  const [location, setLocation] = useState(initial.location);
  const [links, setLinks] = useState<Link[]>(initial.links);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [banner, setBanner] = useState<File | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, startTransition] = useTransition();
  const avatarInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);

  const avatarPreview = useMemo(() => (avatar ? URL.createObjectURL(avatar) : initial.avatarUrl), [avatar, initial.avatarUrl]);
  const bannerPreview = useMemo(() => (banner ? URL.createObjectURL(banner) : initial.bannerUrl), [banner, initial.bannerUrl]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    data.set("name", name);
    data.set("username", username);
    data.set("bio", bio);
    data.set("location", location);
    data.set("links", JSON.stringify(links.filter((l) => l.label.trim() || l.url.trim())));
    if (avatar) data.set("avatar", avatar);
    if (banner) data.set("banner", banner);
    startTransition(async () => {
      const res = await updateProfile(data);
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        toast.error(res.error);
        return;
      }
      setErrors({});
      setAvatar(null);
      setBanner(null);
      toast.success("Profile saved");
      router.refresh();
    });
  };

  const pick = (setter: (f: File) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) return void toast.error("Use a JPG, PNG or WebP image");
    if (f.size > 5 * 1024 * 1024) return void toast.error("Images can be at most 5 MB");
    setter(f);
  };

  const err = (k: string) => errors[k]?.[0];
  const linkErrors = Object.entries(errors).filter(([k]) => k.startsWith("links"));

  return (
    <form onSubmit={submit} className="space-y-8">
      {/* Banner + avatar */}
      <div>
        <div className="relative aspect-[4/1] overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--brand-from)]/40 to-[var(--brand-to)]/40 sm:aspect-[6/1]">
          {bannerPreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bannerPreview} alt="" className="size-full object-cover" />
          )}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="absolute bottom-3 right-3 rounded-full shadow"
            onClick={() => bannerInput.current?.click()}
          >
            <ImagePlus /> {bannerPreview ? "Change banner" : "Add banner"}
          </Button>
        </div>
        <div className="-mt-10 ml-4 flex items-end gap-4 sm:-mt-14 sm:ml-6">
          <button
            type="button"
            onClick={() => avatarInput.current?.click()}
            className="group relative rounded-full ring-4 ring-background"
            aria-label="Change profile picture"
          >
            <UserAvatar name={name || initial.name} src={avatarPreview} className="size-20 text-2xl sm:size-28 sm:text-4xl" />
            <span className="absolute inset-0 grid place-items-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              <Camera className="size-6" />
            </span>
          </button>
          <p className="pb-2 text-xs text-muted-foreground">JPG, PNG or WebP, up to 5 MB</p>
        </div>
        <input ref={avatarInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} onChange={pick(setAvatar)} />
        <input ref={bannerInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} onChange={pick(setBanner)} />
        {(err("avatar") || err("banner")) && <p className="mt-2 text-sm text-destructive">{err("avatar") ?? err("banner")}</p>}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={50} aria-invalid={Boolean(err("name"))} />
          {err("name") && <p className="text-xs text-destructive">{err("name")}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="username">Username</Label>
          <div className="flex items-center rounded-md border border-input focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
            <span className="pl-3 text-sm text-muted-foreground">@</span>
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              maxLength={24}
              aria-invalid={Boolean(err("username"))}
              className="h-9 flex-1 bg-transparent px-1 text-sm outline-none"
            />
          </div>
          {err("username") ? (
            <p className="text-xs text-destructive">{err("username")}</p>
          ) : (
            <p className="text-xs text-muted-foreground">Your channel URL: /channel/{username || "…"}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={initial.email} disabled readOnly />
          <p className="text-xs text-muted-foreground">Used to sign in. Only you can see it.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="location">Location</Label>
          <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={60} placeholder="e.g. Lisbon, Portugal" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={1000} rows={5} placeholder="Tell viewers about your channel" aria-invalid={Boolean(err("bio"))} />
        <p className="text-right text-xs tabular-nums text-muted-foreground">{bio.length}/1000</p>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Links</legend>
        {links.map((l, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={l.label}
              onChange={(e) => setLinks(links.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
              placeholder="Label"
              aria-label={`Link ${i + 1} label`}
              maxLength={30}
              className="w-32 sm:w-44"
            />
            <Input
              value={l.url}
              onChange={(e) => setLinks(links.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))}
              placeholder="https://"
              aria-label={`Link ${i + 1} URL`}
              type="url"
              className="flex-1"
            />
            <Button type="button" variant="ghost" size="icon" aria-label={`Remove link ${i + 1}`} onClick={() => setLinks(links.filter((_, j) => j !== i))}>
              <Trash2 />
            </Button>
          </div>
        ))}
        {linkErrors.length > 0 && <p className="text-xs text-destructive">{linkErrors[0][1]?.[0] ?? "Check your links"}</p>}
        {links.length < 5 && (
          <Button type="button" variant="outline" size="sm" onClick={() => setLinks([...links, { label: "", url: "" }])}>
            <Plus /> Add link
          </Button>
        )}
      </fieldset>

      <div className={cn("flex flex-wrap items-center justify-end gap-3 border-t border-border pt-6")}>
        <Button asChild variant="ghost">
          <Link href={`/channel/${initial.username}`}>View channel</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />} Save changes
        </Button>
      </div>
    </form>
  );
}
