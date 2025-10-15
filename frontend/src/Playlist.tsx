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
      <div className="w-full flex justify-between items-center">
        {/* left side */}
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
                  <div className="py-2 text-sm">Playlist</div>
                </div>
              ) : (
                <div className="px-3 py-2 text-sm">From</div>
              )
            ) : (
              <div className="px-3 py-2 text-sm">Playlist</div>
            )}
          </>
        ) : (
          currentHerbSunday && (
            <>
              <div className="px-3 py-2 text-sm">From</div>
            </>
          )
        )}
        {/* Right side */}
        <button
          className="underline px-3 py-2 text-sm"
          onClick={() => {
            if (!playlists) return;
            const randomIndex = Math.floor(Math.random() * playlists.length);
            const p = playlists[randomIndex];
            setSearchParams((prev) => {
              prev.set("playlist", p.formattedNumber);
              return prev;
            });
          }}
        >
          Random →
        </button>
      </div>
      {selectedPlaylist ? (
        <CurrentPlaylist
          activePlaylist={selectedPlaylist}
          isCurrent={selectedPlaylist.id === currentHerbSunday?.id}
        />
      ) : (
        currentHerbSunday && (
          <CurrentPlaylist
            activePlaylist={currentHerbSunday}
            isCurrent={true}
          />
        )
      )}
    </>
  );
}
