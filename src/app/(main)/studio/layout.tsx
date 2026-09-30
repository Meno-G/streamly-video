import { LayoutDashboard, PlaySquare, Upload } from "lucide-react";
import Link from "next/link";
import { StudioTabs } from "@/components/studio/studio-tabs";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/server/session";

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  await requireUser("/studio");
  return (
    <div className="mx-auto max-w-[1400px] px-4 pt-6 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Studio</h1>
          <p className="text-sm text-muted-foreground">Track how your channel is doing and manage your videos.</p>
        </div>
        <Button asChild className="rounded-full">
          <Link href="/upload">
            <Upload /> Upload video
          </Link>
        </Button>
      </div>
      <StudioTabs
        tabs={[
          { href: "/studio", label: "Dashboard", icon: <LayoutDashboard className="size-4" /> },
          { href: "/studio/videos", label: "Content", icon: <PlaySquare className="size-4" /> },
        ]}
      />
      <div className="pt-6">{children}</div>
    </div>
  );
}
