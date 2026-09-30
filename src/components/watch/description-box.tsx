"use client";

import Link from "next/link";
import { useState } from "react";
import { formatDate, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const URL_RE = /(https?:\/\/[^\s<]+)/g;

/** Renders plain text with http(s) links made clickable. Never injects HTML. */
function Linkified({ text }: { text: string }) {
  return (
    <>
      {text.split(URL_RE).map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer nofollow ugc" className="text-primary hover:underline">
            {part}
          </a>
        ) : (
          part
        )
      )}
    </>
  );
}

export function DescriptionBox({
  views,
  createdAt,
  description,
  tags,
  category,
}: {
  views: number;
  createdAt: string;
  description: string;
  tags: string[];
  category: { name: string; slug: string } | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const long = description.length > 220 || description.split("\n").length > 3;

  return (
    <div
      className={cn("mt-4 rounded-xl bg-secondary p-3 text-sm", !expanded && long && "cursor-pointer hover:bg-accent")}
      onClick={() => !expanded && long && setExpanded(true)}
    >
      <p className="font-semibold">
        {views.toLocaleString("en")} views{" "}
        <span className="ml-1" title={formatDate(createdAt)} suppressHydrationWarning>
          {expanded ? formatDate(createdAt) : timeAgo(createdAt)}
        </span>
        {tags.slice(0, 3).map((t) => (
          <Link key={t} href={`/search?q=${encodeURIComponent(t)}`} className="ml-2 font-normal text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
            #{t}
          </Link>
        ))}
      </p>
      <div className={cn("mt-2 whitespace-pre-wrap break-words", !expanded && "line-clamp-3")}>
        {description ? <Linkified text={description} /> : <span className="text-muted-foreground">No description.</span>}
      </div>
      {expanded && (
        <div className="mt-4 space-y-2">
          {category && (
            <p>
              <span className="text-muted-foreground">Category: </span>
              <Link href={`/explore?category=${category.slug}`} className="text-primary hover:underline">
                {category.name}
              </Link>
            </p>
          )}
          {tags.length > 3 && (
            <p className="flex flex-wrap gap-x-2">
              {tags.map((t) => (
                <Link key={t} href={`/search?q=${encodeURIComponent(t)}`} className="text-primary hover:underline">
                  #{t}
                </Link>
              ))}
            </p>
          )}
        </div>
      )}
      {long && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="mt-2 font-semibold"
        >
          {expanded ? "Show less" : "…more"}
        </button>
      )}
    </div>
  );
}
