"use client";

import { toast } from "sonner";

/** Native share sheet where available, otherwise copy the link. */
export async function shareVideo(videoId: string, title: string) {
  const url = `${location.origin}/watch/${videoId}`;
  if (navigator.share && matchMedia("(pointer: coarse)").matches) {
    try {
      await navigator.share({ title, url });
      return;
    } catch {
      // cancelled; fall through to copying
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  } catch {
    toast.error("Couldn’t copy the link", { description: url });
  }
}
