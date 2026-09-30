import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EditVideoForm } from "@/components/studio/edit-video-form";
import { getVideoForEdit } from "@/server/queries/studio";
import { getCategories } from "@/server/queries/videos";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { title: "Edit video", robots: { index: false } };

export default async function EditVideoPage({ params }: PageProps<"/studio/videos/[id]/edit">) {
  const { id } = await params;
  const user = await requireUser(`/studio/videos/${id}/edit`);
  // Scoped to the owner: another user's video id simply isn't found.
  const [video, categories] = await Promise.all([getVideoForEdit(id, user.id), getCategories()]);
  if (!video) notFound();

  return (
    <div>
      <Link href="/studio/videos" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to content
      </Link>
      <h2 className="mb-6 text-xl font-semibold">Video details</h2>
      <EditVideoForm video={video} categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
    </div>
  );
}
