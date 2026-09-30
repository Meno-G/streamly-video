import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/empty-state";
import { ProfileForm } from "@/components/profile/profile-form";
import { formatDate } from "@/lib/format";
import { db } from "@/server/db";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { title: "Your profile", robots: { index: false } };

export default async function ProfilePage() {
  const user = await requireUser("/profile");
  const profile = await db.profile.findUnique({
    where: { userId: user.id },
    select: { bio: true, location: true, links: true, avatarUrl: true, bannerUrl: true },
  });
  const links = Array.isArray(profile?.links)
    ? (profile.links as unknown[]).filter(
        (l): l is { label: string; url: string } =>
          typeof l === "object" && l !== null && "label" in l && "url" in l
      )
    : [];

  return (
    <PageContainer className="mx-auto max-w-4xl pt-6">
      <PageHeader title="Your profile" description={`Member since ${formatDate(user.createdAt)}`} />
      <ProfileForm
        initial={{
          name: user.name,
          username: user.username,
          email: user.email,
          bio: profile?.bio ?? "",
          location: profile?.location ?? "",
          links,
          avatarUrl: profile?.avatarUrl ?? null,
          bannerUrl: profile?.bannerUrl ?? null,
          createdAt: user.createdAt.toISOString(),
        }}
      />
    </PageContainer>
  );
}
