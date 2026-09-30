"use client";

import { SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Group = { key: string; label: string; options: Record<string, string> };

/** Filter panel; every option is a link so filters are shareable and work without JS state. */
export function SearchFilters({
  groups,
  current,
  q,
}: {
  groups: Group[];
  current: Record<string, string | undefined>;
  q: string;
}) {
  const active = groups.filter((g) => current[g.key]);
  const [open, setOpen] = useState(active.length > 0);

  const href = (key: string, value: string | undefined) => {
    const sp = new URLSearchParams({ q });
    for (const g of groups) {
      const v = g.key === key ? value : current[g.key];
      if (v) sp.set(g.key, v);
    }
    return `/search?${sp.toString()}`;
  };

  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" className="rounded-full" onClick={() => setOpen(!open)} aria-expanded={open}>
          <SlidersHorizontal /> Filters
        </Button>
        {active.map((g) => (
          <Link
            key={g.key}
            href={href(g.key, undefined)}
            className="flex h-8 items-center gap-1 rounded-lg bg-secondary px-3 text-sm hover:bg-accent"
            aria-label={`Remove filter ${g.options[current[g.key]!]}`}
          >
            {g.options[current[g.key]!]} <X className="size-3.5" />
          </Link>
        ))}
        {active.length > 0 && (
          <Link href={`/search?q=${encodeURIComponent(q)}`} className="text-sm text-primary hover:underline">
            Clear all
          </Link>
        )}
      </div>

      {open && (
        <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-5 border-b border-border pb-5 sm:grid-cols-4">
          {groups.map((g) => (
            <div key={g.key}>
              <p className="mb-2 border-b border-border pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {g.label}
              </p>
              <ul className="space-y-1.5 text-sm">
                {Object.entries(g.options).map(([value, label]) => {
                  const selected = current[g.key] === value;
                  return (
                    <li key={value}>
                      <Link
                        href={href(g.key, selected ? undefined : value)}
                        aria-current={selected ? "true" : undefined}
                        className={cn("hover:text-foreground", selected ? "font-semibold text-foreground" : "text-muted-foreground")}
                      >
                        {label}
                        {selected && <X className="ml-1 inline size-3" aria-hidden />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
