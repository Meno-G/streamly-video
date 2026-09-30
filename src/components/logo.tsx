import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-8 place-items-center rounded-[10px] bg-gradient-to-br from-[var(--brand-from)] to-[var(--brand-to)] text-white shadow-sm",
        className
      )}
    >
      <svg viewBox="0 0 24 24" className="ml-0.5 size-3.5" fill="currentColor">
        <path d="M7 4.9v14.2a1.1 1.1 0 0 0 1.7.93l11.1-7.1a1.1 1.1 0 0 0 0-1.86L8.7 3.97A1.1 1.1 0 0 0 7 4.9Z" />
      </svg>
    </span>
  );
}

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link
      href={href}
      aria-label="Streamly home"
      className={cn("flex items-center gap-2 rounded-lg text-[19px] font-semibold tracking-[-0.03em]", className)}
    >
      <LogoMark />
      <span>Streamly</span>
    </Link>
  );
}
