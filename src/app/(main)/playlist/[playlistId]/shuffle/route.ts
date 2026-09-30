import { NextResponse } from "next/server";
import { getPlaylist } from "@/server/queries/playlists";
import { getCurrentUser } from "@/server/session";

/** Redirects to a random video of the playlist, keeping the playlist queue. */
export async function GET(request: Request, { params }: RouteContext<"/playlist/[playlistId]/shuffle">) {
  const { playlistId } = await params;
  const viewer = await getCurrentUser();
  const playlist = await getPlaylist(playlistId, viewer?.id ?? null);
  if (!playlist || playlist.videos.length === 0) {
    return NextResponse.redirect(new URL(`/playlist/${playlistId}`, request.url));
  }
  const pick = playlist.videos[Math.floor(Math.random() * playlist.videos.length)];
  return NextResponse.redirect(new URL(`/watch/${pick.id}?list=${playlist.id}`, request.url));
}
