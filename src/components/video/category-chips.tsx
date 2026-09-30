import Link from "next/link";
import { cn } from "@/lib/utils";

/** Horizontally scrolling topic chips. Selection lives in the URL (?category=slug). */
export function CategoryChips({
  categories,
  active,
  basePath = "/",
  extraParams = {},
}: {
  categories: { name: string; slug: string }[];
  active: string | null;
  basePath?: string;
  extraParams?: Record<string, string>;
}) {
  const href = (slug: string | null) => {
    const params = new URLSearchParams(extraParams);
    if (slug) params.set("category", slug);
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const chips = [{ name: "All", slug: null as string | null }, ...categories];

  return (
    <div className="sticky top-14 z-20 -mx-4 bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-6 sm:px-6">
      <nav aria-label="Topics" className="flex gap-2 overflow-x-auto scrollbar-none">
        {chips.map((c) => {
          const selected = c.slug === active;
          return (
            <Link
              key={c.slug ?? "all"}
              href={href(c.slug)}
              scroll={false}
              aria-current={selected ? "true" : undefined}
              className={cn(
                "h-8 shrink-0 whitespace-nowrap rounded-lg px-3 text-sm font-medium leading-8 transition-colors",
                selected ? "bg-foreground text-background" : "bg-secondary hover:bg-accent"
              )}
            >
              {c.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
