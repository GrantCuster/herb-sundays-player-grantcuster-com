import { useAtom } from "jotai";
import {
  SpotifyNowPlayingAtom,
  SpotifyPlaylistsAtom,
} from "./Spotify/SpotifyAtoms";
import { useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { CurrentPlaylist } from "./CurrentPlaylist";
import { ArrowLeftIcon, ShuffleIcon } from "lucide-react";

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
      <div className="w-full flex pt-1 px-1 justify-between -mb-1 items-center border-r border-l border-neutral-700">
        {/* left side */}
        {selectedPlaylist ? (
          <>
            {currentHerbSunday ? (
              selectedPlaylist.id !== currentHerbSunday.id ? (
                <div className="flex justify-between">
                  <button
                    className="py-1 px-2 bg-neutral-800 hover:bg-neutral-700 text-sm text-left"
                    onClick={() =>
                      setSearchParams({
                        playlist: currentHerbSunday.formattedNumber,
                      })
                    }
                  >
                    <ArrowLeftIcon size={12} className="inline mr-[1ch]" />
                    Current playlist
                  </button>
                </div>
              ) : (
                <div className="px-2 py-1 text-sm">From</div>
              )
            ) : (
              <div className="px-2 py-1 text-sm">Playlist</div>
            )}
          </>
        ) : (
          currentHerbSunday && (
            <>
              <div className="px-2 py-1 text-sm">From</div>
            </>
          )
        )}
        {/* Right side */}
        <button
          className="px-2 py-1 text-sm bg-neutral-800 hover:bg-neutral-700"
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
          Random <ShuffleIcon size={12} className="inline ml-[1ch]" />
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
