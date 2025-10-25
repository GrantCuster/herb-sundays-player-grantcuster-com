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
import { fetchWithRefresh } from "./fetchWithRefresh";

export function CurrentPlaylist({
  activePlaylist,
  currentPlaylist,
  isCurrent,
}: {
  activePlaylist: SpotifyPlaylistType;
  currentPlaylist: SpotifyPlaylistType | null;
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
    const tracks = await fetchWithRefresh(
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
    <div className="overflow-hidden flex flex-col grow bg-black gap-[1px]">
      <div className="flex gap-[1px] my-[0.25lh]">
        <img
          src={activePlaylist.images[0].url}
          alt={activePlaylist.name || "Playlist Cover"}
          className="w-[240px] h-[240px] object-cover shrink-0 ml-[1ch]"
        />
        <div className="grow h-[240px] flex flex-col md:flex-row gap-[2px] px-[1ch]">
          <div
            className="h-1/3 md:h-full w-full border border-neutral-700 rounded-lg flex justify-center items-center"
            onClick={async () => {
              if (!playlists) return;
              const randomIndex = Math.floor(Math.random() * playlists.length);
              const p = playlists[randomIndex];
              setSearchParams((prev) => {
                prev.set("playlist", p.formattedNumber);
                return prev;
              });
            }}
          >
            <ShuffleIcon size={16} />
          </div>
          <div
            className="h-1/3 md:h-full w-full border border-neutral-700 rounded-lg flex justify-center items-center"
            onClick={async () => {
              if (isCurrent) {
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
              } else {
                // optimistically update UI
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
                await fetchWithRefresh("/api/spotify/play", {
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
            {isCurrent && nowPlaying?.is_playing ? (
              <PauseIcon size={16} />
            ) : (
              <PlayIcon size={16} />
            )}
          </div>
          <div
            className={`h-1/3 md:h-full w-full border border-neutral-700 rounded-lg flex justify-center items-center ${isFavorited ? "text-red-500" : ""}`}
            onClick={() => {
              setFavorites((prev) => {
                const newFavorites = isFavorited
                  ? prev.filter((f) => f !== activePlaylist.formattedNumber)
                  : [...prev, activePlaylist.formattedNumber];
                // sync
                fetchWithRefresh("/api/setFavorites", {
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
            <HeartIcon fill={isFavorited ? "currentColor" : "none"} size={16} />
          </div>
        </div>
      </div>
      <div className="flex gap-[1px]">
        <div className="w-full overflow-hidden flex gap-[1px]">
          <div className="bg-black w-[5ch] text-right px-[1ch]">
            {activePlaylist.formattedNumber}
          </div>
          <div className="bg-black grow px-[1ch]">
            {activePlaylist.formattedName}
          </div>
        </div>
      </div>
      <div className="px-[1ch]">
        <div
          className="text-sm"
          dangerouslySetInnerHTML={{
            __html: activePlaylist?.description || "",
          }}
        />
      </div>

      <div className="overflow-auto flex flex-col grow gap-[1px] border-t border-neutral-700 py-[0.5ch]">
        {playlistTracksMap[activePlaylist?.id || ""] === "loading" ? (
          <div className="text-white bg-black"></div>
        ) : (
          playlistTracksMap[activePlaylist?.id || ""] &&
          (
            playlistTracksMap[activePlaylist!.id!] as {
              track: SpotifyTrackType;
            }[]
          ).map((t, i) => {
            const isActive = t.track && nowPlaying?.item?.id === t.track.id;
            return (
              t.track && (
                <div
                  key={t.track.id}
                  className={`cursor-pointer flex gap-[1px] ${isActive ? "bg-neutral-900" : ""}`}
                  onClick={async () => {
                    setPausePolling(true);
                    setSearchParams({
                      playlist: activePlaylist.formattedNumber,
                    });
                    // @ts-expect-error
                    setNowPlaying((prev) =>
                      prev
                        ? {
                            ...prev,
                            context: { uri: activePlaylist.uri },
                            item: {
                              ...t.track,
                            },
                            progress_ms: 0,
                            is_playing: true,
                          }
                        : prev,
                    );
                    await fetchWithRefresh("/api/spotify/play", {
                      method: "PUT",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        context_uri: activePlaylist.uri,
                        offset: { position: i },
                      }),
                    });
                    setTimeout(() => {
                      setPausePolling(false);
                    }, 2000);
                  }}
                >
                  <div className="w-[5ch] px-[1ch] text-right shrink-0">
                    {i + 1}
                  </div>
                  <div className={`grow px-[1ch]`}>
                    <div>{t.track.name}</div>
                    <div className={`text-neutral-400`}>
                      {t.track.artists.map((a: any) => a.name).join(", ")}
                    </div>
                  </div>
                </div>
              )
            );
          })
        )}
        <div className="grow w-full bg-black"></div>
      </div>
      {currentPlaylist && (
        <div
          className="bg-black px-[1ch] shrink-0 border-t border-neutral-700 flex"
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
            <div
              className="w-24 h-full border border-neutral-700 rounded-lg flex justify-center items-center"
              onClick={async () => {
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
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="overflow-hidden flex flex-col grow">
      <div className="py-2 text-center">device picker</div>
      <div className="flex gap-3 grow">
        <div className="w-full items-center flex justify-center gap-[1px] bg-black">
          <div className="flex flex-col items-center gap-[1px]">
            <div className="text-neutral-400 truncate bg-black w-full">
              {activePlaylist.formattedNumber}
            </div>
            <div className="bg-black w-full">
              {activePlaylist?.images && activePlaylist.images[0] && (
                <img
                  src={activePlaylist.images[0].url}
                  alt={activePlaylist.name || "Playlist Cover"}
                  className="w-[240px] h-[240px] object-cover shrink-0"
                />
              )}
            </div>
            <div className="w-full text-center bg-black text-left">
              <div className="">{activePlaylist.formattedName}</div>
              <div
                className="text-neutral-400 text-sm grow line-clamp-4 h-[4lh] overflow-hidden"
                dangerouslySetInnerHTML={{
                  __html: activePlaylist?.description || "",
                }}
              />
            </div>
          </div>
          <div className="h-[48px] bg-neutral-800 flex justify-center items-center w-full">
            <ShuffleIcon size={24} />
          </div>
        </div>
        <div className="grow overflow-hidden hidden">
          <div className="w-full overflow-hidden">
            <div className="text-neutral-400 truncate">
              {activePlaylist.formattedNumber}
            </div>
            <div className="">{activePlaylist.formattedName}</div>
          </div>
        </div>
        <div className="w-[2lh] flex hidden flex-col gap-[0.3lh]">
          {isCurrent && nowPlaying?.is_playing ? (
            <button
              className="w-[2lh] h-[2lh] rounded-full focus:outline-none bg-neutral-800 hover:bg-neutral-700 flex justify-center items-center shrink-0"
              onClick={() => {
                // optimistically update UI
                setNowPlaying((prev) =>
                  prev ? { ...prev, is_playing: false } : prev,
                );
                fetchWithRefresh(`/api/spotify/pause`, { method: "PUT" });
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
                  fetchWithRefresh(`/api/spotify/play`, { method: "PUT" });
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
                  await fetchWithRefresh("/api/spotify/play", {
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
            className={`w-[2lh] h-[2lh] rounded-full focus:outline-none bg-neutral-800 hover:bg-neutral-700 flex justify-center items-center shrink-0 ${isFavorited ? "bg-red-500" : "bg-neutral-800"}`}
            onClick={() => {
              setFavorites((prev) => {
                const newFavorites = isFavorited
                  ? prev.filter((f) => f !== activePlaylist.formattedNumber)
                  : [...prev, activePlaylist.formattedNumber];
                // sync
                fetchWithRefresh("/api/setFavorites", {
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
            <HeartIcon fill={isFavorited ? "currentColor" : "none"} size={16} />
          </button>
        </div>
      </div>
      <div className="flex gap-3 py-1 w-full hidden">
        <div
          className="text-neutral-400 text-sm grow line-clamp-4 h-[4lh] overflow-hidden"
          dangerouslySetInnerHTML={{
            __html: activePlaylist?.description || "",
          }}
        />
      </div>
      <div className="overflow-y-auto text-sm border-t hidden border-neutral-700 grow -mx-3 px-3 py-2">
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
                      className={`cursor-pointer hover:text-white ${nowPlaying?.item?.id === t.track.id ? "text-white" : "text-neutral-400 "}`}
                      onClick={async () => {
                        setPausePolling(true);
                        setSearchParams({
                          playlist: activePlaylist.formattedNumber,
                        });
                        // @ts-expect-error
                        setNowPlaying((prev) =>
                          prev
                            ? {
                                ...prev,
                                context: { uri: activePlaylist.uri },
                                item: {
                                  ...t.track,
                                },
                                progress_ms: 0,
                                is_playing: true,
                              }
                            : prev,
                        );
                        await fetchWithRefresh("/api/spotify/play", {
                          method: "PUT",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            context_uri: activePlaylist.uri,
                            offset: { position: i },
                          }),
                        });
                        setTimeout(() => {
                          setPausePolling(false);
                        }, 2000);
                      }}
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
