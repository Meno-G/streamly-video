import { Compass } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function NotFoundView({
  title = "This page isn’t available",
  description = "The link may be broken, or the video or channel may have been removed or made private.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="bg-gradient-to-br from-[var(--brand-from)] to-[var(--brand-to)] bg-clip-text text-7xl font-bold tracking-tighter text-transparent">
        404
      </p>
      <h1 className="mt-4 text-xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <div className="mt-8 flex gap-2">
        <Button asChild>
          <Link href="/">Go home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/explore">
            <Compass /> Explore
          </Link>
        </Button>
      </div>
    </div>
  );
}
