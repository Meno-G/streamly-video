"use server";

import { AuthError } from "next-auth";
import { hashPassword, signIn, signOut } from "@/server/auth";
import { db } from "@/server/db";
import { safeCallbackUrl } from "@/server/session";
import { fieldErrorsOf, loginSchema, registerSchema, type FieldErrors } from "@/lib/validations";

export type AuthFormState = {
  error?: string;
  fieldErrors?: FieldErrors;
  values?: Record<string, string>;
};

export async function loginAction(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const parsed = loginSchema.safeParse(raw);
  const values = { email: raw.email ?? "" };
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error), values };

  try {
    await signIn("credentials", {
      ...parsed.data,
      redirectTo: safeCallbackUrl(raw.callbackUrl),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "That email and password don’t match an account.", values };
    }
    throw error; // the success redirect
  }
  return {};
}

export async function registerAction(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const values = { name: raw.name ?? "", username: raw.username ?? "", email: raw.email ?? "" };
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error), values };

  const { name, username, email, password } = parsed.data;
  const existing = await db.user.findFirst({
    where: { OR: [{ email }, { username }] },
    select: { email: true, username: true },
  });
  if (existing) {
    return {
      values,
      fieldErrors:
        existing.email === email
          ? { email: ["An account with this email already exists"] }
          : { username: ["That username is taken"] },
    };
  }

  try {
    await db.user.create({
      data: {
        name,
        username,
        email,
        passwordHash: await hashPassword(password),
        profile: { create: {} },
      },
    });
  } catch {
    return { error: "Couldn’t create your account. Try again.", values };
  }

  try {
    await signIn("credentials", { email, password, redirectTo: safeCallbackUrl(raw.callbackUrl) });
  } catch (error) {
    if (error instanceof AuthError) return { error: "Account created. Sign in to continue.", values };
    throw error;
  }
  return {};
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
