"use client";

/** Reads duration and captures a few JPEG frames from a local video file, in the browser. */
export async function inspectVideo(file: File, frameCount = 3): Promise<{ duration: number; frames: Blob[] }> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "auto";
  video.muted = true;
  video.playsInline = true;
  video.src = url;

  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("This video can’t be read. Try an MP4 (H.264) file."));
    });
    const duration = video.duration;
    if (!Number.isFinite(duration) || duration <= 0) throw new Error("Couldn’t read the video’s length.");

    const frames: Blob[] = [];
    const canvas = document.createElement("canvas");
    const w = Math.min(1280, video.videoWidth || 1280);
    const h = Math.round(w * ((video.videoHeight || 720) / (video.videoWidth || 1280)));
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");

    for (let i = 0; i < frameCount && ctx; i++) {
      const t = Math.min(duration - 0.1, Math.max(0.1, duration * ((i + 1) / (frameCount + 1))));
      await new Promise<void>((resolve) => {
        video.onseeked = () => resolve();
        video.currentTime = t;
        window.setTimeout(resolve, 4000); // don't hang on odd files
      });
      ctx.drawImage(video, 0, 0, w, h);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
      if (blob) frames.push(blob);
    }
    return { duration, frames };
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}
