import { useAtom } from "jotai";
import { useRef, useEffect } from "react";
import {
  SpotifyFavoritesAtom,
  SpotifyNowPlayingAtom,
  SpotifyPausePollingAtom,
  SpotifyPlaylistsAtom,
  SpotifyPlaylistTracksMapAtom,
  SpotifyUserIdAtom,
} from "./Spotify/SpotifyAtoms";
import type {
  SpotifyPlaylistType,
  SpotifyTrackType,
} from "./Spotify/SpotifyTypes";
import { useSearchParams } from "react-router-dom";
import { HeartIcon, PauseIcon, PlayIcon, ShuffleIcon } from "lucide-react";

export function CurrentPlaylist({
  activePlaylist,
  isCurrent,
}: {
  activePlaylist: SpotifyPlaylistType;
  isCurrent: boolean;
}) {
  const [nowPlaying, setNowPlaying] = useAtom(SpotifyNowPlayingAtom);
  const [playlists] = useAtom(SpotifyPlaylistsAtom);
  const [userId] = useAtom(SpotifyUserIdAtom);
  const [favorites, setFavorites] = useAtom(SpotifyFavoritesAtom);
  const [, setSearchParams] = useSearchParams();
  const [, setPausePolling] = useAtom(SpotifyPausePollingAtom);
  const [playlistTracksMap, setPlaylistTracksMap] = useAtom(
    SpotifyPlaylistTracksMapAtom,
  );

  const isFavorited = favorites.includes(activePlaylist.formattedNumber);

  async function fetchTracks(playlistId: string) {
    const tracks = await fetch(
      "/api/spotify/playlist/" + playlistId + "/tracks",
    );
    const _tracks = await tracks.json();
    return _tracks;
  }

  const currentRef = useRef<SpotifyPlaylistType | null>(null);
  useEffect(() => {
    if (activePlaylist && activePlaylist.id !== currentRef.current?.id) {
      if (!playlistTracksMap[activePlaylist.id]) {
        const currentId = activePlaylist.id;
        setPlaylistTracksMap((prev) => ({
          ...prev,
          [currentId]: "loading",
        }));
        fetchTracks(currentId).then((tracks) => {
          setPlaylistTracksMap((prev) => ({
            ...prev,
            [currentId]: tracks,
          }));
        });
      }
    }
    currentRef.current = activePlaylist;
  }, [activePlaylist, playlistTracksMap]);

  return (
    <div className="px-3 pt-3 overflow-hidden flex flex-col grow gap-2 border-l border-r border-b border-neutral-700">
      <div className="flex gap-3">
        {activePlaylist?.images && activePlaylist.images[0] && (
          <img
            src={activePlaylist.images[0].url}
            alt={activePlaylist.name || "Playlist Cover"}
            className="w-[4.3lh] h-[4.3lh] object-cover shrink-0"
          />
        )}
        <div className="grow overflow-hidden">
          <div className="w-full overflow-hidden">
            <div className="text-neutral-400 truncate">
              {activePlaylist.formattedNumber}
            </div>
            <div className="">{activePlaylist.formattedName}</div>
          </div>
        </div>
        <div className="w-[2lh] flex flex-col gap-[0.3lh]">
          {isCurrent && nowPlaying?.is_playing ? (
            <button
              className="w-[2lh] h-[2lh] rounded-full focus:outline-none bg-neutral-800 hover:bg-neutral-700 flex justify-center items-center shrink-0"
              onClick={() => {
                // optimistically update UI
                setNowPlaying((prev) =>
                  prev ? { ...prev, is_playing: false } : prev,
                );
                fetch(`/api/spotify/pause`, { method: "PUT" });
              }}
            >
              <PauseIcon size={16} />
            </button>
          ) : (
            <button
              className="w-[2lh] h-[2lh] rounded-full focus:outline-none bg-neutral-800 hover:bg-neutral-700 flex justify-center items-center shrink-0"
              onClick={async () => {
                if (!playlists) return;
                if (isCurrent) {
                  // optimistically update UI
                  setNowPlaying((prev) =>
                    prev ? { ...prev, is_playing: true } : prev,
                  );
                  fetch(`/api/spotify/play`, { method: "PUT" });
                } else {
                  setPausePolling(true);
                  setSearchParams({ playlist: activePlaylist.formattedNumber });
                  setNowPlaying((prev) =>
                    prev
                      ? {
                          ...prev,
                          context: { uri: activePlaylist.uri },
                          item: {
                            ...prev.item,
                            name: "...",
                            artists: [],
                            album: { images: [] },
                          },
                          progress_ms: 0,
                        }
                      : prev,
                  );
                  await fetch("/api/spotify/play", {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      context_uri: activePlaylist.uri,
                    }),
                  });
                  setTimeout(() => {
                    setPausePolling(false);
                  }, 2000);
                }
              }}
            >
              <PlayIcon size={16} />
            </button>
          )}
          <button
            className="w-[2lh] h-[2lh] rounded-full focus:outline-none bg-neutral-800 hover:bg-neutral-700 flex justify-center items-center shrink-0"
            onClick={() => {
              setFavorites((prev) => {
                const newFavorites = isFavorited
                  ? prev.filter((f) => f !== activePlaylist.formattedNumber)
                  : [...prev, activePlaylist.formattedNumber];
                // sync
                fetch("/api/setFavorites", {
                  headers: { "Content-Type": "application/json" },
                  method: "POST",
                  body: JSON.stringify({
                    userId: userId,
                    items: newFavorites,
                  }),
                });
                return newFavorites;
              });
            }}
          >
            <HeartIcon
              className={`${isFavorited ? "text-red-500" : ""}`}
              fill={isFavorited ? "currentColor" : "none"}
              size={16}
            />
          </button>
        </div>
      </div>
      <div className="flex gap-3 py-1 w-full">
        <div
          className="text-neutral-400 text-xs grow line-clamp-4 h-[4lh] overflow-hidden"
          dangerouslySetInnerHTML={{
            __html: activePlaylist?.description || "",
          }}
        />
      </div>
      <div className="overflow-y-auto text-sm border-t border-neutral-700 grow -mx-3 px-3 py-2">
        {playlistTracksMap[activePlaylist?.id || ""] === "loading" ? (
          <div className="text-neutral-400">loading...</div>
        ) : (
          playlistTracksMap[activePlaylist?.id || ""] && (
            <div>
              {(
                playlistTracksMap[activePlaylist!.id!] as {
                  track: SpotifyTrackType;
                }[]
              ).map(
                (t, i) =>
                  t.track && (
                    <div
                      key={t.track.id}
                      className={`${nowPlaying?.item?.id === t.track.id ? "text-white" : "text-neutral-400 "}`}
                    >
                      {i + 1}. {t.track.name} -{" "}
                      {t.track.artists.map((a: any) => a.name).join(", ")}
                    </div>
                  ),
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}
