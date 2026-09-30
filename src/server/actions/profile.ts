"use server";

import { revalidatePath } from "next/cache";
import { fieldErrorsOf, profileSchema, type ActionResult } from "@/lib/validations";
import { db } from "@/server/db";
import { storeFile } from "@/server/media";
import { getUserId } from "@/server/session";
import { deleteStoredFile } from "@/server/storage";
import { validateUpload } from "@/server/storage/validate";

/** Updates the signed-in user's own profile. There is no way to target another user. */
export async function updateProfile(formData: FormData): Promise<ActionResult<{ username: string }>> {
  const userId = await getUserId();
  if (!userId) return { ok: false, error: "Sign in to edit your profile" };

  let links: unknown = [];
  try {
    links = JSON.parse(String(formData.get("links") ?? "[]"));
  } catch {
    return { ok: false, error: "Links are invalid" };
  }

  const parsed = profileSchema.safeParse({
    name: formData.get("name") ?? "",
    username: formData.get("username") ?? "",
    bio: formData.get("bio") ?? "",
    location: formData.get("location") ?? "",
    links,
  });
  if (!parsed.success) {
    return { ok: false, error: "Check the highlighted fields", fieldErrors: fieldErrorsOf(parsed.error) };
  }

  const taken = await db.user.findFirst({
    where: { username: parsed.data.username, NOT: { id: userId } },
    select: { id: true },
  });
  if (taken) return { ok: false, error: "That username is taken", fieldErrors: { username: ["That username is taken"] } };

  const current = await db.profile.findUnique({
    where: { userId },
    select: { avatarUrl: true, bannerUrl: true },
  });

  const uploads: { avatarUrl?: string; bannerUrl?: string } = {};
  for (const field of ["avatar", "banner"] as const) {
    const raw = formData.get(field);
    if (raw instanceof File && raw.size > 0) {
      const checked = await validateUpload(raw, "image");
      if (!checked.ok) return { ok: false, error: checked.error, fieldErrors: { [field]: [checked.error] } };
      const stored = await storeFile(checked.file, field === "avatar" ? "avatars" : "banners");
      uploads[`${field}Url`] = stored.url;
    }
  }

  const { name, username, bio, location, links: cleanLinks } = parsed.data;
  await db.user.update({
    where: { id: userId },
    data: {
      name,
      username,
      profile: {
        upsert: {
          create: { bio, location: location || null, links: cleanLinks, ...uploads },
          update: { bio, location: location || null, links: cleanLinks, ...uploads },
        },
      },
    },
  });

  // Remove replaced uploads that live in our storage.
  const oldKey = (url?: string | null) => (url?.startsWith("/api/media/") ? decodeURIComponent(url.slice("/api/media/".length)) : null);
  if (uploads.avatarUrl) await deleteStoredFile(oldKey(current?.avatarUrl));
  if (uploads.bannerUrl) await deleteStoredFile(oldKey(current?.bannerUrl));

  revalidatePath("/", "layout");
  return { ok: true, data: { username } };
}
