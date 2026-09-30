import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic gate for signed-in-only pages: without a session cookie, redirect to login
 * before rendering. The pages still verify the session themselves (cookies can be forged),
 * this just gives signed-out visitors a proper 307 instead of a streamed redirect.
 */
const SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));
  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?callbackUrl=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

// Must be a static literal so Next can analyze it at build time.
export const config = {
  matcher: [
    "/studio/:path*",
    "/upload",
    "/profile",
    "/library",
    "/history",
    "/liked",
    "/watch-later",
    "/subscriptions",
  ],
};
