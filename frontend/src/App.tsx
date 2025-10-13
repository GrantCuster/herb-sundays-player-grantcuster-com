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

function App() {
  const [loaded, setLoaded] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [, setUserId] = useAtom(SpotifyUserIdAtom);

  useEffect(() => {
    fetch("/api/spotify/me")
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
          <a
            className="flex items-center justify-center underline w-[512px] mx-auto my-4 h-full border border-neutral-400"
            href="/api/auth/spotify/login"
          >
            <div>Login with Spotify</div>
          </a>
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
    <div className="max-w-md h-full w-full mx-auto flex flex-col overflow-hidden">
      <Header />
      {viewMode === "player" && (
        <>
          <div className="border border-neutral-700 py-2 gap-2 flex flex-col">
            <NowPlaying />
            <DevicePicker />
          </div>
          <Playlist />
          <div className="h-[1lh] w-full"></div>
        </>
      )}
      {viewMode === "favs" && <Favs />}
    </div>
  );
}

export default App;
