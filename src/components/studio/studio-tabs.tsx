"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function StudioTabs({ tabs }: { tabs: { href: string; label: string; icon: React.ReactNode }[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Studio sections" className="flex gap-1 border-b border-border">
      {tabs.map((t) => {
        const active = t.href === "/studio" ? pathname === "/studio" : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
              active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.icon}
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
