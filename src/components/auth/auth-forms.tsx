"use client";

import { Eye, EyeOff, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction, registerAction, type AuthFormState } from "@/server/actions/auth";

function Field({
  name,
  label,
  type = "text",
  autoComplete,
  defaultValue,
  error,
  hint,
}: {
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  defaultValue?: string;
  error?: string;
  hint?: string;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const describedBy = error ? `${name}-error` : hint ? `${name}-hint` : undefined;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <div className="relative">
        <Input
          id={name}
          name={name}
          type={isPassword && show ? "text" : type}
          autoComplete={autoComplete}
          defaultValue={defaultValue}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={isPassword ? "h-10 pr-10" : "h-10"}
          required
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute right-1 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:text-foreground"
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      {error ? (
        <p id={`${name}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${name}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function LoginForm({
  callbackUrl,
  demo,
  initialError,
}: {
  callbackUrl: string;
  demo?: { email: string; password: string };
  initialError?: string;
}) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(loginAction, { error: initialError });
  const formRef = useRef<HTMLFormElement>(null);
  const fe = state.fieldErrors ?? {};

  const fillDemo = () => {
    const form = formRef.current;
    if (!form || !demo) return;
    (form.elements.namedItem("email") as HTMLInputElement).value = demo.email;
    (form.elements.namedItem("password") as HTMLInputElement).value = demo.password;
    form.requestSubmit();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
      <p className="mt-1 text-sm text-muted-foreground">Welcome back to Streamly.</p>
      <form ref={formRef} action={action} className="mt-8 space-y-5" noValidate>
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <Field name="email" label="Email" type="email" autoComplete="email" defaultValue={state.values?.email} error={fe.email?.[0]} />
        <Field name="password" label="Password" type="password" autoComplete="current-password" error={fe.password?.[0]} />
        {state.error && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}
          </p>
        )}
        <Button type="submit" className="h-10 w-full" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />} Sign in
        </Button>
        {demo && (
          <Button type="button" variant="outline" className="h-10 w-full" onClick={fillDemo} disabled={pending}>
            <Sparkles /> Continue with the demo account
          </Button>
        )}
      </form>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        New to Streamly?{" "}
        <Link href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}

export function RegisterForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(registerAction, {});
  const fe = state.fieldErrors ?? {};
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
      <p className="mt-1 text-sm text-muted-foreground">Your account comes with a channel for your uploads.</p>
      <form action={action} className="mt-8 space-y-5" noValidate>
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <Field name="name" label="Name" autoComplete="name" defaultValue={state.values?.name} error={fe.name?.[0]} hint="Shown as your channel name." />
        <Field
          name="username"
          label="Username"
          autoComplete="username"
          defaultValue={state.values?.username}
          error={fe.username?.[0]}
          hint="Letters, numbers and underscores. Used in your channel URL."
        />
        <Field name="email" label="Email" type="email" autoComplete="email" defaultValue={state.values?.email} error={fe.email?.[0]} />
        <Field
          name="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          error={fe.password?.[0]}
          hint="At least 8 characters, with a letter and a number."
        />
        <Field name="confirmPassword" label="Confirm password" type="password" autoComplete="new-password" error={fe.confirmPassword?.[0]} />
        {state.error && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}
          </p>
        )}
        <Button type="submit" className="h-10 w-full" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />} Create account
        </Button>
      </form>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
