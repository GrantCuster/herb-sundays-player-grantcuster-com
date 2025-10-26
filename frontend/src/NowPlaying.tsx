import { useAtom } from "jotai";
import {
  SpotifyNowPlayingAtom,
  SpotifyPlaylistsAtom,
} from "./Spotify/SpotifyAtoms";
import { useSearchParams } from "react-router-dom";
import { PauseIcon, PlayIcon } from "lucide-react";
import { fetchWithRefresh } from "./fetchWithRefresh";

export function NowPlaying() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [playlists] = useAtom(SpotifyPlaylistsAtom);
  const [nowPlaying, setNowPlaying] = useAtom(SpotifyNowPlayingAtom);
  const selectedPlaylistNumber = searchParams.get("playlist");
  const viewMode = searchParams.get("view") ?? "player";

  const currentPlaylist = nowPlaying?.context?.uri
    ? playlists?.find((p) => p.uri === nowPlaying.context.uri)
    : null;

  const selectedPlaylist =
    playlists?.find((p) => p.formattedNumber === selectedPlaylistNumber) ||
    null;

  const isCurrent =
    currentPlaylist &&
    selectedPlaylist &&
    currentPlaylist.id === selectedPlaylist.id && viewMode !== "favs";

  return (
    currentPlaylist && (
      <div
        className="bg-neutral-800 px-[1ch] shrink-0 border-t border-neutral-700 flex"
        onClick={() => {
          setSearchParams({ playlist: currentPlaylist.formattedNumber });
        }}
      >
        <div className="px-[1ch] grow flex overflow-hidden flex-col">
          <div className="-ml-[1ch]">
            <span className="text-neutral-400">{isCurrent ? "↑" : "←"}</span>{" "}
            Playing
          </div>
          <div className="flex gap-[1px]">
            <div className="w-[5ch] px-[1ch] text-right">
              {currentPlaylist.formattedNumber}
            </div>
            <div className="px-[1ch] truncate grow">
              {currentPlaylist.formattedName}
            </div>
          </div>
          <div className="h-[2lh]">
            <div className="truncate pl-[1ch]">{nowPlaying?.item?.name}</div>
            <div className="truncate text-neutral-400 pl-[1ch]">
              {nowPlaying?.item?.artists.map((a: any) => a.name).join(", ")}
            </div>
          </div>
        </div>
        <div className="w-24 h-full shrink-0 py-[0.25lh]">
          <button
            className="w-24 text-left h-full border border-neutral-600 rounded-lg flex justify-center items-center"
            onClick={async (e) => {
              e.stopPropagation();
              if (nowPlaying?.is_playing) {
                // pause
                setNowPlaying((prev) =>
                  prev ? { ...prev, is_playing: false } : prev,
                );
                fetchWithRefresh(`/api/spotify/pause`, { method: "PUT" });
              } else {
                // play
                setNowPlaying((prev) =>
                  prev ? { ...prev, is_playing: true } : prev,
                );
                fetchWithRefresh(`/api/spotify/play`, { method: "PUT" });
              }
            }}
          >
            {nowPlaying?.is_playing ? (
              <PauseIcon size={16} />
            ) : (
              <PlayIcon size={16} />
            )}
          </button>
        </div>
      </div>
    )
  );
}
