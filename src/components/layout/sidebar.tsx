"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "@/components/current-user";
import { UserAvatar } from "@/components/user-avatar";
import { cn } from "@/lib/utils";
import type { ChannelSummary } from "@/types";
import { CREATE_NAV, MAIN_NAV, YOU_NAV, authHref, isActivePath, type NavItem } from "./nav-items";

export function SidebarFull({ subscriptions, className }: { subscriptions: ChannelSummary[]; className?: string }) {
  const user = useCurrentUser();
  return (
    <nav aria-label="Main" className={cn("flex flex-col gap-1 px-3 pb-8 text-sm", className)}>
      <Section items={MAIN_NAV} />
      <Divider />
      <p className="px-3 pb-1 pt-1 text-sm font-semibold">You</p>
      <Section items={YOU_NAV} />
      {user && subscriptions.length > 0 && (
        <>
          <Divider />
          <p className="px-3 pb-1 pt-1 text-sm font-semibold">Subscriptions</p>
          <ul className="flex flex-col">
            {subscriptions.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/channel/${c.username}`}
                  className="flex h-10 items-center gap-4 rounded-lg px-3 hover:bg-accent"
                >
                  <UserAvatar name={c.name} src={c.avatarUrl} className="size-6 text-[11px]" />
                  <span className="truncate">{c.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
      <Divider />
      <Section items={CREATE_NAV} />
      {!user && (
        <>
          <Divider />
          <div className="px-3 py-2 text-[13px] leading-5 text-muted-foreground">
            Sign in to like videos, comment and subscribe.
            <Link
              href="/login"
              className="mt-3 flex h-9 w-fit items-center rounded-full border border-border px-4 font-medium text-primary hover:bg-primary/10"
            >
              Sign in
            </Link>
          </div>
        </>
      )}
      <p className="mt-4 px-3 text-xs text-muted-foreground">© {new Date().getFullYear()} Streamly</p>
    </nav>
  );
}

function Section({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const user = useCurrentUser();
  return (
    <ul className="flex flex-col">
      {items.map(({ href, label, icon: Icon, auth }) => {
        const active = isActivePath(pathname, href);
        return (
          <li key={href}>
            <Link
              href={authHref(href, Boolean(user), auth)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-10 items-center gap-5 rounded-lg px-3 transition-colors",
                active ? "bg-accent font-medium" : "hover:bg-accent/70"
              )}
            >
              <Icon className={cn("size-5", active && "text-primary")} strokeWidth={active ? 2.25 : 1.75} />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Divider() {
  return <hr className="mx-3 my-2 border-border" />;
}

/** 72px icon rail for tablets and the collapsed desktop state. */
export function SidebarRail({ className }: { className?: string }) {
  const pathname = usePathname();
  const user = useCurrentUser();
  const items = [...MAIN_NAV, YOU_NAV[0]];
  return (
    <nav aria-label="Main" className={cn("flex flex-col gap-1 px-1", className)}>
      {items.map(({ href, label, icon: Icon, auth }) => {
        const active = isActivePath(pathname, href);
        return (
          <Link
            key={href}
            href={authHref(href, Boolean(user), auth)}
            aria-current={active ? "page" : undefined}
            className="flex flex-col items-center gap-1.5 rounded-lg py-4 text-[10px] hover:bg-accent"
          >
            <Icon className={cn("size-5", active && "text-primary")} strokeWidth={active ? 2.25 : 1.75} />
            <span className={cn(active && "font-medium")}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
