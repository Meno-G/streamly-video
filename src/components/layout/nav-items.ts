import {
  Clock,
  Compass,
  History,
  House,
  LayoutDashboard,
  Library,
  type LucideIcon,
  SquarePlay,
  ThumbsUp,
  Upload,
  UserRound,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon; auth?: boolean };

export const MAIN_NAV: NavItem[] = [
  { href: "/", label: "Home", icon: House },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/subscriptions", label: "Subscriptions", icon: SquarePlay, auth: true },
];

export const YOU_NAV: NavItem[] = [
  { href: "/library", label: "Library", icon: Library, auth: true },
  { href: "/history", label: "History", icon: History, auth: true },
  { href: "/liked", label: "Liked videos", icon: ThumbsUp, auth: true },
  { href: "/watch-later", label: "Watch later", icon: Clock, auth: true },
];

export const CREATE_NAV: NavItem[] = [
  { href: "/studio", label: "Studio", icon: LayoutDashboard, auth: true },
  { href: "/upload", label: "Upload", icon: Upload, auth: true },
  { href: "/profile", label: "Your profile", icon: UserRound, auth: true },
];

export const MOBILE_NAV: NavItem[] = [
  { href: "/", label: "Home", icon: House },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/upload", label: "Upload", icon: Upload, auth: true },
  { href: "/subscriptions", label: "Subscriptions", icon: SquarePlay, auth: true },
  { href: "/library", label: "Library", icon: Library, auth: true },
];

export function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Signed-out visitors are sent to login first, then back to the page. */
export function authHref(href: string, signedIn: boolean, needsAuth?: boolean) {
  return needsAuth && !signedIn ? `/login?callbackUrl=${encodeURIComponent(href)}` : href;
}
