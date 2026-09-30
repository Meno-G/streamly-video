"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * next/image for thumbnails, banners and avatars. Locally stored uploads are served by our own
 * media route and skip the optimizer; a neutral placeholder replaces missing or broken images.
 */
export function MediaImage({
  src,
  alt,
  className,
  fallbackClassName,
  ...props
}: Omit<ImageProps, "src"> & { src: string | null | undefined; fallbackClassName?: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={cn("grid size-full place-items-center bg-muted text-muted-foreground", fallbackClassName, className)}>
        <ImageOff className="size-6 opacity-60" aria-hidden />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      unoptimized={src.startsWith("/api/media/") || src.startsWith("blob:") || src.startsWith("data:")}
      onError={() => setFailed(true)}
      className={className}
      {...props}
    />
  );
}
