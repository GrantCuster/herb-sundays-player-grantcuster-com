import { useEffect, useState } from "react";
import { useSpotify } from "./useSpotify";
import { DevicePicker } from "./DevicePicker";
import { Playlist } from "./Playlist";
import { Header } from "./Header";
import { NowPlaying } from "./NowPlaying";
import { BrowserRouter, useSearchParams } from "react-router-dom";
import { Favs } from "./Favs.tsx";
import { useAtom } from "jotai";
import { SpotifyUserIdAtom } from "./Spotify/SpotifyAtoms.tsx";
import { fetchWithRefresh } from "./fetchWithRefresh";

function App() {
  const [loaded, setLoaded] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [, setUserId] = useAtom(SpotifyUserIdAtom);

  useEffect(() => {
    fetchWithRefresh("/api/spotify/me")
      .then(async (res) => {
        if (res.status === 200) {
          const json = await res.json();
          setUserId(json.id);
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
    }
  }, [loggedIn]);

  return loaded ? (
    <BrowserRouter>
      <div className="w-full h-[100dvh] overflow-hidden flex flex-col">
        {loggedIn ? (
          <LoggedIn />
        ) : (
          <div className="w-full mx-auto h-full flex flex-col justify-center items-center text-left text-neutral-400 ">
            <div className="pt-4">
              A simple Spotify player for listening to playlists from{" "}
              <a
                href="https://herbsundays.substack.com/"
                target="_blank"
                className="underline"
              >
                Herb Sundays
              </a>
            </div>
            <a
              className="flex items-center justify-center underline w-full mx-auto my-5 py-4 rounded-full border border-neutral-400"
              href="/api/auth/spotify/login"
            >
              <div>Login with Spotify</div>
            </a>
          </div>
        )}
      </div>
    </BrowserRouter>
  ) : null;
}

function LoggedIn() {
  useSpotify();
  const [searchParams] = useSearchParams();
  const viewMode = searchParams.get("view") ?? "player";

  return (
    <div className="h-full w-full mx-auto flex flex-col overflow-hidden">
      <Header />
      {viewMode === "player" && <Playlist />}
      {viewMode === "favs" && <Favs />}
      <DevicePicker />
    </div>
  );
}

export default App;
