import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

/**
 * The signed-in user, read fresh from the database once per request.
 * The JWT only carries the user id, so profile edits show up immediately.
 */
export const getCurrentUser = cache(async () => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  return db.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      createdAt: true,
      profile: { select: { avatarUrl: true, verified: true } },
    },
  });
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/** For pages: redirects to login (and back afterwards) when signed out. */
export async function requireUser(returnTo = "/") {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?callbackUrl=${encodeURIComponent(returnTo)}`);
  return user;
}

/** For server actions and route handlers: returns the user id or null. */
export async function getUserId() {
  return (await getCurrentUser())?.id ?? null;
}

/** Only same-site relative paths are allowed as post-login destinations. */
export function safeCallbackUrl(value: unknown, fallback = "/") {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}
