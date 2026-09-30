import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/empty-state";
import { UploadForm } from "@/components/upload/upload-form";
import { MAX_IMAGE_BYTES, MAX_VIDEO_BYTES } from "@/lib/constants";
import { getCategories } from "@/server/queries/videos";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { title: "Upload video", robots: { index: false } };

export default async function UploadPage() {
  await requireUser("/upload");
  const categories = await getCategories();
  return (
    <PageContainer className="mx-auto max-w-6xl pt-6">
      <PageHeader title="Upload video" description="Add a video, give it a title and choose who can watch it." />
      <UploadForm
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        maxVideoBytes={MAX_VIDEO_BYTES}
        maxImageBytes={MAX_IMAGE_BYTES}
      />
    </PageContainer>
  );
}
