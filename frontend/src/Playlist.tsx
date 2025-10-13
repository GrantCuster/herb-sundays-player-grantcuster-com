import { useAtom } from "jotai";
import {
  SpotifyNowPlayingAtom,
  SpotifyPlaylistsAtom,
} from "./Spotify/SpotifyAtoms";
import { useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { CurrentPlaylist } from "./CurrentPlaylist";

export function Playlist() {
  const [nowPlaying] = useAtom(SpotifyNowPlayingAtom);
  const [playlists] = useAtom(SpotifyPlaylistsAtom);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedPlaylistNumber = searchParams.get("playlist");

  const currentHerbSunday = nowPlaying?.context?.uri
    ? playlists?.find((p) => p.uri === nowPlaying.context.uri)
    : null;

  const selectedPlaylist =
    playlists?.find((p) => p.formattedNumber === selectedPlaylistNumber) ||
    null;

  useEffect(() => {
    const checkMatch = playlists?.find(
      (p) => p.formattedNumber === selectedPlaylistNumber,
    );
    if (!checkMatch && !currentHerbSunday && playlists) {
      const randomPlaylist =
        playlists && playlists[Math.floor(Math.random() * playlists.length)];
      if (randomPlaylist) {
        setSearchParams({ playlist: randomPlaylist.formattedNumber });
      }
    }
  }, [selectedPlaylistNumber, currentHerbSunday, playlists]);

  if (!playlists) return null;

  return (
    <>
      {selectedPlaylist ? (
        <>
          {currentHerbSunday ? (
            selectedPlaylist.id !== currentHerbSunday.id ? (
              <div className="flex px-3 justify-between">
                <button
                  className="py-2 text-sm text-left underline"
                  onClick={() =>
                    setSearchParams({
                      playlist: currentHerbSunday.formattedNumber,
                    })
                  }
                >
                  ← Current playlist
                </button>
                <div className="py-2 text-sm">Random playlist ↓</div>
              </div>
            ) : (
              <div className="px-3 py-2 text-sm">From</div>
            )
          ) : (
            <div className="px-3 py-2 text-sm">Random playlist ↓</div>
          )}
          <CurrentPlaylist
            activePlaylist={selectedPlaylist}
            isCurrent={selectedPlaylist.id === currentHerbSunday?.id}
          />
        </>
      ) : (
        currentHerbSunday && (
          <>
            <div className="px-3 py-2 text-sm">From</div>
            <CurrentPlaylist
              activePlaylist={currentHerbSunday}
              isCurrent={true}
            />
          </>
        )
      )}
    </>
  );
}
