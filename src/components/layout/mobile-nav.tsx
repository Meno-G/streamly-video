"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "@/components/current-user";
import { cn } from "@/lib/utils";
import { MOBILE_NAV, authHref, isActivePath } from "./nav-items";

/** Bottom tab bar on phones. */
export function MobileNav() {
  const pathname = usePathname();
  const user = useCurrentUser();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 grid h-14 grid-cols-5 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      {MOBILE_NAV.map(({ href, label, icon: Icon, auth }) => {
        const active = isActivePath(pathname, href);
        const isUpload = href === "/upload";
        return (
          <Link
            key={href}
            href={authHref(href, Boolean(user), auth)}
            aria-current={active ? "page" : undefined}
            className="flex flex-col items-center justify-center gap-0.5 text-[10px]"
          >
            {isUpload ? (
              <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground">
                <Icon className="size-5" />
              </span>
            ) : (
              <>
                <Icon className={cn("size-5", active && "text-primary")} strokeWidth={active ? 2.25 : 1.75} />
                <span className={cn(active ? "font-medium text-foreground" : "text-muted-foreground")}>{label}</span>
              </>
            )}
            {isUpload && <span className="sr-only">{label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
