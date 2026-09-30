import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklab,var(--brand-from)_22%,transparent),transparent)]"
      />
      <header className="relative flex h-16 items-center justify-between px-4 sm:px-6">
        <Logo />
        <ThemeToggle className="w-auto" />
      </header>
      <main className="relative flex flex-1 items-start justify-center px-4 pb-16 pt-[8vh]">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
