"use client";

import { ArrowLeft, Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function useSearchSubmit() {
  const router = useRouter();
  return (q: string) => {
    const query = q.trim();
    if (query) router.push(`/search?q=${encodeURIComponent(query)}`);
  };
}

/** Desktop search field; submits to /search?q=. */
export function SearchBar({ className }: { className?: string }) {
  const params = useSearchParams();
  const initial = params.get("q") ?? "";
  const [value, setValue] = useState(initial);
  const [lastInitial, setLastInitial] = useState(initial);
  const submit = useSearchSubmit();
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep the field in sync when navigating between searches.
  if (initial !== lastInitial) {
    setLastInitial(initial);
    setValue(initial);
  }

  return (
    <form
      role="search"
      className={cn("flex w-full max-w-[640px] items-center", className)}
      onSubmit={(e) => {
        e.preventDefault();
        submit(value);
        inputRef.current?.blur();
      }}
    >
      <div className="relative flex h-10 flex-1 items-center rounded-l-full border border-input bg-background pl-4 pr-9 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
        <Search className="mr-2 size-4 shrink-0 text-muted-foreground" aria-hidden />
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search videos, channels, tags"
          aria-label="Search"
          maxLength={100}
          className="h-full w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
        />
        {value && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setValue("");
              inputRef.current?.focus();
            }}
            className="absolute right-2 grid size-7 place-items-center rounded-full text-muted-foreground hover:bg-accent"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      <button
        type="submit"
        aria-label="Search"
        className="grid h-10 w-16 place-items-center rounded-r-full border border-l-0 border-input bg-secondary transition-colors hover:bg-accent"
      >
        <Search className="size-5" />
      </button>
    </form>
  );
}

/** Phone search: an icon that expands into a full-width field over the top bar. */
export function MobileSearch() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const submit = useSearchSubmit();

  if (!open) {
    return (
      <Button variant="ghost" size="icon" className="rounded-full sm:hidden" aria-label="Search" onClick={() => setOpen(true)}>
        <Search className="size-5" />
      </Button>
    );
  }

  return (
    <form
      role="search"
      className="absolute inset-0 z-10 flex items-center gap-2 bg-background px-2"
      onSubmit={(e) => {
        e.preventDefault();
        submit(value);
        setOpen(false);
      }}
    >
      <Button type="button" variant="ghost" size="icon" className="rounded-full" aria-label="Close search" onClick={() => setOpen(false)}>
        <ArrowLeft className="size-5" />
      </Button>
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search Streamly"
        aria-label="Search"
        maxLength={100}
        className="h-10 flex-1 rounded-full bg-secondary px-4 text-[15px] outline-none"
      />
      <Button type="submit" variant="ghost" size="icon" className="rounded-full" aria-label="Search">
        <Search className="size-5" />
      </Button>
    </form>
  );
}
