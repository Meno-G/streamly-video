"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { VideoPlayer } from "./video-player";

/** Player that continues to the next playlist item when a video ends. */
export function WatchPlayer(props: {
  videoId: string;
  src: string;
  poster: string | null;
  title: string;
  startAt: number;
  isShort: boolean;
  nextHref: string | null;
}) {
  const router = useRouter();
  const { nextHref } = props;
  const onEnded = useCallback(() => {
    if (nextHref) window.setTimeout(() => router.push(nextHref), 1200);
  }, [nextHref, router]);

  return (
    <VideoPlayer
      key={props.videoId}
      videoId={props.videoId}
      src={props.src}
      poster={props.poster}
      title={props.title}
      startAt={props.startAt}
      isShort={props.isShort}
      onEnded={onEnded}
    />
  );
}
