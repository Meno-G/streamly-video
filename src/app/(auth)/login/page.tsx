import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/auth-forms";
import { getCurrentUser, safeCallbackUrl } from "@/server/session";

export const metadata: Metadata = { title: "Sign in" };

/** The seeded demo account. Hidden in production unless explicitly enabled. */
const DEMO =
  process.env.NODE_ENV !== "production" || process.env.SHOW_DEMO_LOGIN === "true"
    ? { email: "demo@streamly.dev", password: "streamly123" }
    : undefined;

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const callbackUrl = safeCallbackUrl(sp.callbackUrl);
  if (await getCurrentUser()) redirect(callbackUrl);
  // Auth.js redirects here with ?error=… when its own endpoints reject a sign-in.
  const initialError = sp.error ? "That email and password don’t match an account." : undefined;
  return <LoginForm callbackUrl={callbackUrl} demo={DEMO} initialError={initialError} />;
}
