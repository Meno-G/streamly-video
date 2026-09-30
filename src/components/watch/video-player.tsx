"use client";

import {
  AlertTriangle,
  Check,
  Gauge,
  Loader2,
  Maximize,
  Minimize,
  Pause,
  PictureInPicture2,
  Play,
  RotateCcw,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const VOLUME_KEY = "streamly-volume";
const noopSubscribe = () => () => {};

type Props = {
  videoId: string;
  src: string;
  poster?: string | null;
  title: string;
  startAt?: number;
  isShort?: boolean;
  onEnded?: () => void;
};

/** Reports a view once real playback passes a threshold, then adds watch time periodically. */
function useViewTracking(videoId: string, video: HTMLVideoElement | null, isShort: boolean) {
  useEffect(() => {
    if (!video) return;
    let viewId: string | undefined;
    let started = false;
    let watchedSinceReport = 0;
    let lastTime = video.currentTime;
    const threshold = isShort ? 2 : 5;

    const post = (body: object, beacon = false) => {
      const url = `/api/videos/${videoId}/view`;
      const payload = JSON.stringify(body);
      if (beacon && navigator.sendBeacon) {
        navigator.sendBeacon(url, new Blob([payload], { type: "application/json" }));
        return Promise.resolve(null);
      }
      return fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);
    };

    const flush = (beacon = false) => {
      if (!started) return;
      const watched = Math.round(watchedSinceReport);
      watchedSinceReport = 0;
      void post({ event: "progress", position: video.currentTime, watched, viewId }, beacon);
    };

    const onTime = () => {
      const delta = video.currentTime - lastTime;
      lastTime = video.currentTime;
      if (delta > 0 && delta < 2 && !video.paused) watchedSinceReport += delta;
      if (!started && watchedSinceReport >= threshold) {
        started = true;
        const watched = Math.round(watchedSinceReport);
        watchedSinceReport = 0;
        void post({ event: "start", position: video.currentTime, watched }).then((res) => {
          if (res && typeof res.viewId === "string") viewId = res.viewId;
        });
      }
    };
    const onSeek = () => (lastTime = video.currentTime);
    const onPause = () => flush();
    const onHide = () => document.visibilityState === "hidden" && flush(true);

    const interval = window.setInterval(() => watchedSinceReport >= 10 && flush(), 15_000);
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("seeked", onSeek);
    video.addEventListener("pause", onPause);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      flush(true);
      window.clearInterval(interval);
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("seeked", onSeek);
      video.removeEventListener("pause", onPause);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [videoId, video, isShort]);
}

export function VideoPlayer({ videoId, src, poster, title, startAt = 0, isShort = false, onEnded }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  const setContainer = useCallback((el: HTMLDivElement | null) => {
    containerRef.current = el;
    setContainerEl(el);
  }, []);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [waiting, setWaiting] = useState(true);
  const [ended, setEnded] = useState(false);
  const [error, setError] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  // src is only set after hydration: a server-rendered <video> starts loading before React
  // attaches its event handlers, and the early metadata events would be lost.
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const pipSupported = useSyncExternalStore(
    noopSubscribe,
    () => "pictureInPictureEnabled" in document && document.pictureInPictureEnabled,
    () => false
  );
  const [hover, setHover] = useState<{ x: number; t: number } | null>(null);
  const [flash, setFlash] = useState<"play" | "pause" | null>(null);
  const hideTimer = useRef<number | undefined>(undefined);
  const scrubbing = useRef(false);

  // The element lives in a ref (so handlers can control it) and in state (so effects re-run when it mounts).
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [video, setVideoState] = useState<HTMLVideoElement | null>(null);
  const setVideo = useCallback(
    (el: HTMLVideoElement | null) => {
      videoRef.current = el;
      setVideoState(el);
      if (!el) return;
      // React creates the element during render, so it can start loading (and fire its first media
      // events) before this component commits. Catch up on anything that already happened.
      if (el.readyState >= 1) {
        setDuration(el.duration || 0);
        if (startAt > 0 && startAt < el.duration - 5 && el.currentTime === 0) el.currentTime = startAt;
      }
      if (el.readyState >= 3) setWaiting(false);
      if (el.buffered.length) setBuffered(el.buffered.end(el.buffered.length - 1));
      setTime(el.currentTime);
      setPlaying(!el.paused);
    },
    [startAt]
  );

  useViewTracking(videoId, video, isShort);

  // Restore the saved volume once the element mounts.
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    try {
      const saved = JSON.parse(localStorage.getItem(VOLUME_KEY) ?? "null");
      if (saved && typeof saved.volume === "number") {
        el.volume = Math.min(1, Math.max(0, saved.volume));
        el.muted = Boolean(saved.muted);
      }
    } catch {}
  }, [video]);

  // Try to start playback once mounted; browsers may block unmuted autoplay, which is fine.
  useEffect(() => {
    videoRef.current?.play().catch(() => setWaiting(false));
  }, [video]);

  // Media events are attached as JSX props on <video> so none are missed before an effect runs.
  const media = {
    onPlay: () => {
      setPlaying(true);
      setEnded(false);
    },
    onPause: () => setPlaying(false),
    onTimeUpdate: (e: React.SyntheticEvent<HTMLVideoElement>) => {
      if (!scrubbing.current) setTime(e.currentTarget.currentTime);
    },
    onDurationChange: (e: React.SyntheticEvent<HTMLVideoElement>) => setDuration(e.currentTarget.duration || 0),
    onLoadedMetadata: (e: React.SyntheticEvent<HTMLVideoElement>) => {
      const el = e.currentTarget;
      setDuration(el.duration || 0);
      if (startAt > 0 && startAt < el.duration - 5) el.currentTime = startAt;
    },
    onProgress: (e: React.SyntheticEvent<HTMLVideoElement>) => {
      const b = e.currentTarget.buffered;
      if (b.length) setBuffered(b.end(b.length - 1));
    },
    onVolumeChange: (e: React.SyntheticEvent<HTMLVideoElement>) => {
      const el = e.currentTarget;
      setVolume(el.volume);
      setMuted(el.muted);
      try {
        localStorage.setItem(VOLUME_KEY, JSON.stringify({ volume: el.volume, muted: el.muted }));
      } catch {}
    },
    onRateChange: (e: React.SyntheticEvent<HTMLVideoElement>) => setRate(e.currentTarget.playbackRate),
    onWaiting: () => setWaiting(true),
    onCanPlay: () => setWaiting(false),
    onPlaying: () => setWaiting(false),
    onEnded: () => {
      setEnded(true);
      setPlaying(false);
      onEnded?.();
    },
    onError: () => {
      setError(true);
      setWaiting(false);
    },
  };

  useEffect(() => {
    const onFs = () => setFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused && !scrubbing.current) setControlsVisible(false);
    }, 2600);
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused || video.ended) {
      void video.play().catch(() => {});
      setFlash("play");
    } else {
      video.pause();
      setFlash("pause");
    }
    window.setTimeout(() => setFlash(null), 500);
    showControls();
  }, [showControls]);

  const seekBy = useCallback(
    (delta: number) => {
      const video = videoRef.current;
    if (!video) return;
      video.currentTime = Math.min(Math.max(0, video.currentTime + delta), video.duration || 0);
      setTime(video.currentTime);
      showControls();
    },
    [showControls]
  );

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    if (!video.muted && video.volume === 0) video.volume = 0.5;
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await el.requestFullscreen();
    } catch {}
  }, []);

  const togglePip = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await video.requestPictureInPicture();
    } catch {}
  }, []);

  const changeVolume = (delta: number) => {
    const video = videoRef.current;
    if (video) video.volume = Math.min(1, Math.max(0, video.volume + delta));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement && e.target.type !== "range") return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const actions: Record<string, () => void> = {
      " ": togglePlay,
      k: togglePlay,
      j: () => seekBy(-10),
      l: () => seekBy(10),
      ArrowLeft: () => seekBy(-5),
      ArrowRight: () => seekBy(5),
      ArrowUp: () => changeVolume(0.1),
      ArrowDown: () => changeVolume(-0.1),
      m: toggleMute,
      f: toggleFullscreen,
      i: togglePip,
    };
    const action = actions[e.key] ?? actions[e.key.toLowerCase()];
    if (action && !(e.target instanceof HTMLInputElement && (e.key === "ArrowLeft" || e.key === "ArrowRight"))) {
      e.preventDefault();
      action();
      showControls();
    }
  };

  const seekFromPointer = (clientX: number, bar: HTMLElement, commit: boolean) => {
    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const t = ratio * (duration || 0);
    setTime(t);
    const video = videoRef.current;
    if (commit && video) video.currentTime = t;
    return { x: clientX - rect.left, t };
  };

  const progress = duration ? (time / duration) * 100 : 0;
  const bufferedPct = duration ? (buffered / duration) * 100 : 0;
  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const visible = controlsVisible || !playing || ended;

  return (
    <div
      ref={setContainer}
      role="region"
      aria-label={`Video player: ${title}`}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseMove={showControls}
      onMouseLeave={() => playing && setControlsVisible(false)}
      onTouchStart={showControls}
      className={cn(
        "group/player relative aspect-video w-full overflow-hidden bg-black outline-none focus-visible:ring-2 focus-visible:ring-primary sm:rounded-xl",
        fullscreen && "sm:rounded-none",
        !visible && "cursor-none"
      )}
    >
      <video
        ref={setVideo}
        src={hydrated ? src : undefined}
        poster={poster ?? undefined}
        playsInline
        preload="metadata"
        className="size-full object-contain"
        {...media}
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
      />

      {/* center states */}
      {waiting && !error && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <Loader2 className="size-12 animate-spin text-white/90" aria-label="Loading video" />
        </div>
      )}
      {flash && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <span className="grid size-16 animate-in fade-in zoom-in-75 place-items-center rounded-full bg-black/55 text-white duration-200">
            {flash === "play" ? <Play className="ml-1 size-7 fill-white" /> : <Pause className="size-7 fill-white" />}
          </span>
        </div>
      )}
      {!playing && !waiting && !ended && !error && time === 0 && (
        <button
          type="button"
          onClick={togglePlay}
          aria-label="Play"
          className="absolute inset-0 m-auto grid size-[72px] place-items-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-transform hover:scale-105"
        >
          <Play className="ml-1 size-8 fill-white" />
        </button>
      )}
      {ended && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 m-auto flex h-12 w-fit items-center gap-2 rounded-full bg-black/65 px-5 text-sm font-medium text-white backdrop-blur-sm hover:bg-black/75"
        >
          <RotateCcw className="size-4" /> Replay
        </button>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 px-6 text-center text-white">
          <AlertTriangle className="size-8 text-amber-400" />
          <p className="font-medium">This video can’t be played right now</p>
          <p className="text-sm text-white/70">The file may be unavailable or in a format your browser doesn’t support.</p>
        </div>
      )}

      {/* controls */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-3 pb-2 pt-12 text-white transition-opacity duration-200 sm:px-4",
          visible ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        {/* progress */}
        <div
          role="slider"
          tabIndex={0}
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(time)}
          aria-valuetext={`${formatDuration(time)} of ${formatDuration(duration)}`}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
              e.preventDefault();
              e.stopPropagation();
              seekBy(e.key === "ArrowLeft" ? -5 : 5);
            }
          }}
          onPointerDown={(e) => {
            scrubbing.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            seekFromPointer(e.clientX, e.currentTarget, true);
          }}
          onPointerMove={(e) => {
            const info = seekFromPointer(e.clientX, e.currentTarget, scrubbing.current);
            setHover(info);
            if (!scrubbing.current) setTime(videoRef.current?.currentTime ?? 0);
          }}
          onPointerUp={(e) => {
            scrubbing.current = false;
            seekFromPointer(e.clientX, e.currentTarget, true);
          }}
          onPointerLeave={() => setHover(null)}
          className="group/bar relative flex h-4 cursor-pointer touch-none items-center"
        >
          {hover && duration > 0 && (
            <span
              className="pointer-events-none absolute -top-7 -translate-x-1/2 rounded bg-black/85 px-1.5 py-0.5 text-xs tabular-nums"
              style={{ left: hover.x }}
            >
              {formatDuration(hover.t)}
            </span>
          )}
          <div className="relative h-1 w-full rounded-full bg-white/25 transition-[height] group-hover/bar:h-1.5">
            <div className="absolute inset-y-0 left-0 rounded-full bg-white/40" style={{ width: `${bufferedPct}%` }} />
            <div className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${progress}%` }} />
            <div
              className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 scale-0 rounded-full bg-primary transition-transform group-hover/bar:scale-100"
              style={{ left: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mt-1 flex items-center gap-1 sm:gap-2">
          <ControlButton label={playing ? "Pause (k)" : "Play (k)"} onClick={togglePlay}>
            {playing ? <Pause className="size-5 fill-white" /> : <Play className="size-5 fill-white" />}
          </ControlButton>

          <div className="group/vol flex items-center">
            <ControlButton label={muted ? "Unmute (m)" : "Mute (m)"} onClick={toggleMute}>
              <VolumeIcon className="size-5" />
            </ControlButton>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              aria-label="Volume"
              onChange={(e) => {
                const video = videoRef.current;
                if (!video) return;
                video.volume = Number(e.target.value);
                video.muted = Number(e.target.value) === 0;
              }}
              className="hidden h-1 w-0 cursor-pointer accent-white opacity-0 transition-all duration-200 group-hover/vol:w-20 group-hover/vol:opacity-100 focus-visible:w-20 focus-visible:opacity-100 sm:block"
            />
          </div>

          <span className="ml-1 text-xs tabular-nums text-white/90 sm:text-sm">
            {formatDuration(time)} <span className="text-white/60">/ {formatDuration(duration)}</span>
          </span>

          <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Playback speed"
                  title="Playback speed"
                  className="flex h-9 items-center gap-1 rounded-full px-2 text-sm hover:bg-white/15"
                >
                  <Gauge className="size-5" />
                  <span className="tabular-nums">{rate === 1 ? "1x" : `${rate}x`}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                side="top"
                container={containerEl}
                className="min-w-36"
              >
                <DropdownMenuLabel>Playback speed</DropdownMenuLabel>
                {SPEEDS.map((s) => (
                  <DropdownMenuItem key={s} onSelect={() => videoRef.current && (videoRef.current.playbackRate = s)}>
                    <Check className={cn("size-4", rate === s ? "opacity-100" : "opacity-0")} />
                    {s === 1 ? "Normal" : `${s}x`}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {pipSupported && (
              <ControlButton label="Picture-in-picture (i)" onClick={togglePip}>
                <PictureInPicture2 className="size-5" />
              </ControlButton>
            )}
            <ControlButton label={fullscreen ? "Exit full screen (f)" : "Full screen (f)"} onClick={toggleFullscreen}>
              {fullscreen ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
            </ControlButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function ControlButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid size-9 shrink-0 place-items-center rounded-full transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white"
    >
      {children}
    </button>
  );
}
