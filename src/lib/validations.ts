import { z } from "zod";

/** Strip control characters (keeping newlines/tabs), trim, and collapse runs of blank lines. */
export function sanitizeText(value: string) {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const text = (max: number) =>
  z
    .string()
    .transform(sanitizeText)
    .pipe(z.string().max(max, `Must be ${max} characters or fewer`));

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Username must be at least 3 characters")
  .max(24, "Username must be 24 characters or fewer")
  .regex(/^[a-z0-9_]+$/, "Use only letters, numbers and underscores");

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your name").max(50, "Name is too long"),
    username: usernameSchema,
    email: z.string().trim().toLowerCase().email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password must be 72 characters or fewer")
      .regex(/[a-zA-Z]/, "Include at least one letter")
      .regex(/[0-9]/, "Include at least one number"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don’t match",
  });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export const visibilitySchema = z.enum(["PUBLIC", "UNLISTED", "PRIVATE"]);

export const tagsSchema = z
  .string()
  .default("")
  .transform((s) =>
    Array.from(
      new Set(
        s
          .split(",")
          .map((t) => sanitizeText(t).toLowerCase().replace(/^#/, ""))
          .filter(Boolean)
          .map((t) => t.slice(0, 30))
      )
    ).slice(0, 15)
  );

export const videoMetaSchema = z.object({
  title: text(100).pipe(z.string().min(1, "Title is required")),
  description: text(5000).default(""),
  tags: tagsSchema,
  categoryId: z.string().trim().min(1, "Choose a category"),
  visibility: visibilitySchema,
});

export const uploadSchema = videoMetaSchema.extend({
  durationSeconds: z.coerce
    .number()
    .finite()
    .min(1, "Couldn’t read the video length")
    .max(60 * 60 * 12, "Videos can be at most 12 hours long"),
});

export const commentSchema = z.object({
  videoId: z.string().min(1),
  parentId: z.string().min(1).optional().nullable(),
  content: text(2000).pipe(z.string().min(1, "Comment can’t be empty")),
});

export const playlistSchema = z.object({
  name: text(80).pipe(z.string().min(1, "Name is required")),
  description: text(1000).default(""),
  visibility: visibilitySchema.default("PUBLIC"),
});

const linkSchema = z.object({
  label: text(30).pipe(z.string().min(1)),
  url: z
    .string()
    .trim()
    .url("Enter a full URL, including https://")
    .refine((u) => /^https?:\/\//i.test(u), "Links must start with http:// or https://"),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(50, "Name is too long"),
  username: usernameSchema,
  bio: text(1000).default(""),
  location: text(60).default(""),
  links: z.array(linkSchema).max(5, "Add up to 5 links").default([]),
});

export type FieldErrors = Record<string, string[] | undefined>;

export type ActionResult<T = null> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: FieldErrors };

export function fieldErrorsOf(error: z.ZodError): FieldErrors {
  return z.flattenError(error).fieldErrors as FieldErrors;
}
