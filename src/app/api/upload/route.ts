import { NextResponse } from "next/server";
import { fieldErrorsOf, uploadSchema } from "@/lib/validations";
import { db } from "@/server/db";
import { isShortDuration, setVideoTags, storeFile } from "@/server/media";
import { getUserId } from "@/server/session";
import { deleteStoredFile, type StoredFile } from "@/server/storage";
import { validateUpload } from "@/server/storage/validate";

export const runtime = "nodejs";

/**
 * POST multipart/form-data: video, thumbnail?, title, description, tags, categoryId, visibility, durationSeconds.
 * Sent with XMLHttpRequest from the upload page so the browser can report progress.
 */
export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Sign in to upload videos" }, { status: 401 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "The upload was interrupted or malformed. Try again." }, { status: 400 });
  }

  const meta = uploadSchema.safeParse({
    title: form.get("title") ?? "",
    description: form.get("description") ?? "",
    tags: form.get("tags") ?? "",
    categoryId: form.get("categoryId") ?? "",
    visibility: form.get("visibility") ?? "PUBLIC",
    durationSeconds: form.get("durationSeconds") ?? "",
  });
  if (!meta.success) {
    return NextResponse.json(
      { error: "Check the highlighted fields", fieldErrors: fieldErrorsOf(meta.error) },
      { status: 422 }
    );
  }

  const category = await db.category.findUnique({ where: { id: meta.data.categoryId }, select: { id: true } });
  if (!category) {
    return NextResponse.json({ error: "Choose a category", fieldErrors: { categoryId: ["Choose a category"] } }, { status: 422 });
  }

  const video = await validateUpload(form.get("video"), "video");
  if (!video.ok) return NextResponse.json({ error: video.error, fieldErrors: { video: [video.error] } }, { status: 422 });

  const rawThumb = form.get("thumbnail");
  const hasThumb = rawThumb instanceof File && rawThumb.size > 0;
  const thumb = hasThumb ? await validateUpload(rawThumb, "image") : null;
  if (thumb && !thumb.ok) {
    return NextResponse.json({ error: thumb.error, fieldErrors: { thumbnail: [thumb.error] } }, { status: 422 });
  }

  const stored: StoredFile[] = [];
  try {
    const videoFile = await storeFile(video.file, "videos");
    stored.push(videoFile);
    const thumbFile = thumb?.ok ? await storeFile(thumb.file, "thumbnails") : null;
    if (thumbFile) stored.push(thumbFile);

    const { title, description, visibility, durationSeconds, tags } = meta.data;
    const created = await db.video.create({
      data: {
        title,
        description,
        visibility,
        durationSeconds: Math.round(durationSeconds),
        isShort: isShortDuration(durationSeconds),
        videoUrl: videoFile.url,
        videoKey: videoFile.key,
        thumbnailUrl: thumbFile?.url ?? null,
        thumbnailKey: thumbFile?.key ?? null,
        ownerId: userId,
        categoryId: category.id,
      },
      select: { id: true },
    });
    await setVideoTags(created.id, tags);

    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch (error) {
    console.error("[upload]", error);
    await Promise.all(stored.map((f) => deleteStoredFile(f.key)));
    return NextResponse.json({ error: "Saving the video failed. Try again." }, { status: 500 });
  }
}
