import { useEffect, useRef, useState } from "react";
import { useSpotifyNowPlaying } from "./useSpotifyNowPlaying";
import type { PlaylistType, TrackType } from "./Types";
import { PlaylistsAtom } from "./Atoms";
import { useAtom } from "jotai";
import { Header } from "./Header";
import { NowPlaying } from "./NowPlaying";
import { CurrentPlaylist } from "./CurrentPlaylist";
import { DevicePicker } from "./DevicePicker";

function App() {
  const [loaded, setLoaded] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [, setPlaylists] = useAtom(PlaylistsAtom);

  useEffect(() => {
    fetch("/api/spotify/me")
      .then((res) => {
        if (res.status === 200) {
          setLoggedIn(true);
          setLoaded(true);
        } else {
          setLoggedIn(false);
          setLoaded(true);
        }
      })
      .catch(() => setLoggedIn(false));
  }, []);

  useEffect(() => {
    if (loggedIn) {
      async function fetchHerbSundays() {
        const playlists = await fetch("/api/spotify/herb_sundays");
        const _data = await playlists.json();
        const filtered = _data.filter(
          (p: PlaylistType) =>
            p.name.toLowerCase().includes("herb sundays") &&
            /\d/.test(p.name.split(" ")[2]),
        );
        setPlaylists(filtered);
      }
      fetchHerbSundays();
    }
  }, [loggedIn]);

  return loaded ? (
    <div className="w-full h-[100dvh] overflow-hidden flex flex-col">
      {loggedIn ? (
        <LoggedIn />
      ) : (
        <a className="underline" href="/api/auth/spotify/login">
          Login with Spotify
        </a>
      )}
    </div>
  ) : null;
}

function LoggedIn() {
  const [playlists] = useAtom(PlaylistsAtom);
  const { nowPlaying, loading } = useSpotifyNowPlaying();
  const [randomPlaylist, setRandomPlaylist] = useState<PlaylistType | null>(
    null,
  );
  const [currentTracks, setCurrentTracks] = useState<{ track: TrackType }[]>(
    [],
  );
  const [randomPlaylistTracks, setRandomPlaylistTracks] = useState<
    { track: TrackType }[]
  >([]);

  function getRandomPlaylist(_playlists: PlaylistType[]) {
    if (_playlists.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * _playlists.length);
    return _playlists[randomIndex];
  }

  useEffect(() => {
    async function fetchTracks() {
      if (!randomPlaylist) return;
      const tracks = await fetch(
        "/api/spotify/playlist/" + randomPlaylist.id + "/tracks",
      );
      const _tracks = await tracks.json();
      setRandomPlaylistTracks(_tracks);
    }
    fetchTracks();
  }, [randomPlaylist]);

  const currentHerbSunday = nowPlaying?.context?.uri
    ? playlists.find((p) => p.uri === nowPlaying.context.uri)
    : null;

  const currentId = currentHerbSunday?.id || null;
  const currentIdRef = useRef<string | null>(null);
  useEffect(() => {
    async function fetchTracks() {
      const tracks = await fetch(
        "/api/spotify/playlist/" + currentId + "/tracks",
      );
      const _tracks = await tracks.json();
      setCurrentTracks(_tracks);
    }
    if (currentId !== currentIdRef.current) {
      if (currentId) {
        fetchTracks();
      }
      currentIdRef.current = currentId;
    }
  }, [currentId]);

  const activePlaylist = randomPlaylist || currentHerbSunday;
  const activeTracks = randomPlaylist ? randomPlaylistTracks : currentTracks;

  return (
    <>
      <Header />
      {false ? (
        <div className="overflow-auto flex flex-col gap-3">
          {playlists.map((p) => (
            <div key={p.id} className="flex gap-[2ch]">
              <div className="w-[5ch] shrink-0">
                {p.name.split(":")[0].replaceAll("Herb Sundays", "").trim()}
              </div>
              <div className="w-1/3">{p.name.split(":")[1]}</div>
              <div
                className="w-2/3 text-sm"
                dangerouslySetInnerHTML={{ __html: p.description }}
              ></div>
              <div className="w-[5ch] shrink-0 text-right">
                {p.tracks.total}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="w-full max-w-[512px] mx-auto">
          <NowPlaying nowPlaying={nowPlaying} />
          <DevicePicker />
          {activePlaylist ? (
            <CurrentPlaylist
              playlist={activePlaylist}
              tracks={activeTracks}
              nowPlaying={nowPlaying}
              currentHerbSunday={currentHerbSunday || null}
              setRandomPlaylist={setRandomPlaylist}
              getRandomPlaylist={() => {
                setRandomPlaylistTracks([]);
                setRandomPlaylist(getRandomPlaylist(playlists));
              }}
            />
          ) : null}
        </div>
      )}
    </>
  );
}

export default App;
