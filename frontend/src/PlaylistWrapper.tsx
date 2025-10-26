import { useAtom } from "jotai";
import {
  SpotifyNowPlayingAtom,
  SpotifyPlaylistsAtom,
} from "./Spotify/SpotifyAtoms";
import { useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { Playlist } from "./Playlist";

export function PlaylistWrapper() {
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

  const activePlaylist = selectedPlaylist || currentHerbSunday;

  return activePlaylist ? <Playlist activePlaylist={activePlaylist} /> : null;
}
