"use client";

import { Menu, Plus, Settings2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";
import { useCurrentUser } from "@/components/current-user";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { ChannelSummary } from "@/types";
import { MobileNav } from "./mobile-nav";
import { NotificationsMenu } from "./notifications-menu";
import { MobileSearch, SearchBar } from "./search-bar";
import { SidebarFull, SidebarRail } from "./sidebar";
import { UserMenu } from "./user-menu";

/**
 * Layout chrome:
 * - xl and up: full 240px sidebar (menu button collapses it to the rail)
 * - md to xl: 72px icon rail, menu button opens a drawer
 * - phones: bottom tab bar, menu button opens a drawer
 * - watch pages: no persistent sidebar, drawer only (more room for the player)
 */
export function AppShell({
  subscriptions,
  unreadNotifications,
  children,
}: {
  subscriptions: ChannelSummary[];
  unreadNotifications: number;
  children: React.ReactNode;
}) {
  const user = useCurrentUser();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerPath, setDrawerPath] = useState<string | null>(null);
  const drawerOpen = drawerPath === pathname;
  const immersive = pathname.startsWith("/watch/");

  const toggleMenu = () => {
    if (!immersive && window.matchMedia("(min-width: 1280px)").matches) setCollapsed((c) => !c);
    else setDrawerPath(drawerOpen ? null : pathname);
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between gap-2 bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-4">
        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          <Button variant="ghost" size="icon" className="rounded-full" aria-label="Menu" onClick={toggleMenu}>
            <Menu className="size-5" />
          </Button>
          <Logo />
        </div>

        <div className="hidden flex-1 justify-center px-4 sm:flex">
          <Suspense fallback={<div className="h-10 w-full max-w-[640px]" />}>
            <SearchBar />
          </Suspense>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <MobileSearch />
          {user ? (
            <>
              <Button asChild variant="secondary" className="hidden rounded-full sm:inline-flex">
                <Link href="/upload">
                  <Plus className="size-5" /> Create
                </Link>
              </Button>
              <NotificationsMenu initialUnread={unreadNotifications} />
              <UserMenu user={user} />
            </>
          ) : (
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full" aria-label="Settings">
                    <Settings2 className="size-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-64">
                  <p className="mb-2 text-xs text-muted-foreground">Appearance</p>
                  <ThemeToggle />
                </PopoverContent>
              </Popover>
              <Button asChild variant="ghost" className="hidden rounded-full sm:inline-flex">
                <Link href="/register">Register</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full border-primary/40 text-primary hover:text-primary">
                <Link href={`/login?callbackUrl=${encodeURIComponent(pathname)}`}>Sign in</Link>
              </Button>
            </>
          )}
        </div>
      </header>

      {!immersive && (
        <>
          <aside
            className={cn(
              "fixed bottom-0 left-0 top-14 z-30 hidden w-60 overflow-y-auto overscroll-contain scrollbar-none hover:[scrollbar-width:thin]",
              !collapsed && "xl:block"
            )}
          >
            <SidebarFull subscriptions={subscriptions} />
          </aside>
          <aside
            className={cn(
              "fixed bottom-0 left-0 top-14 z-30 hidden w-[72px]",
              collapsed ? "md:block" : "md:block xl:hidden"
            )}
          >
            <SidebarRail />
          </aside>
        </>
      )}

      <Sheet open={drawerOpen} onOpenChange={(o) => setDrawerPath(o ? pathname : null)}>
        <SheetContent side="left" className="w-64 gap-0 p-0">
          <SheetHeader className="flex h-14 flex-row items-center gap-3 space-y-0 px-4 py-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <Logo />
          </SheetHeader>
          <div className="overflow-y-auto">
            <SidebarFull subscriptions={subscriptions} />
          </div>
        </SheetContent>
      </Sheet>

      <main
        className={cn(
          "min-h-dvh pb-20 pt-14 md:pb-8",
          !immersive && "md:pl-[72px]",
          !immersive && !collapsed && "xl:pl-60"
        )}
      >
        {children}
      </main>

      <MobileNav />
    </>
  );
}
