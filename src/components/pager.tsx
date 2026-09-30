import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Previous / next links that keep the other query params. */
export function Pager({
  page,
  hasMore,
  basePath,
  params = {},
}: {
  page: number;
  hasMore: boolean;
  basePath: string;
  params?: Record<string, string | undefined>;
}) {
  if (page <= 1 && !hasMore) return null;
  const href = (p: number) => {
    const sp = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => Boolean(e[1])));
    if (p > 1) sp.set("page", String(p));
    else sp.delete("page");
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-3">
      {page > 1 ? (
        <Button asChild variant="outline">
          <Link href={href(page - 1)}>
            <ChevronLeft /> Previous
          </Link>
        </Button>
      ) : (
        <Button variant="outline" disabled>
          <ChevronLeft /> Previous
        </Button>
      )}
      <span className="text-sm text-muted-foreground">Page {page}</span>
      {hasMore ? (
        <Button asChild variant="outline">
          <Link href={href(page + 1)}>
            Next <ChevronRight />
          </Link>
        </Button>
      ) : (
        <Button variant="outline" disabled>
          Next <ChevronRight />
        </Button>
      )}
    </nav>
  );
}
