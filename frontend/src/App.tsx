import { useEffect, useState } from "react";
import { useSpotify } from "./useSpotify";
import { DevicePicker } from "./DevicePicker";
import { PlaylistWrapper } from "./PlaylistWrapper.tsx";
import { Header } from "./Header";
import { BrowserRouter, useSearchParams } from "react-router-dom";
import { Favs } from "./Favs.tsx";
import { useAtom } from "jotai";
import {
  SpotifyDevicesAtom,
  SpotifyDevicesLoadingAtom,
  SpotifyUserIdAtom,
} from "./Spotify/SpotifyAtoms.tsx";
import { fetchWithRefresh } from "./fetchWithRefresh";
import { NowPlaying } from "./NowPlaying.tsx";

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

  return loaded ? (
    <BrowserRouter>
      <div className="w-full max-w-2xl mx-auto h-[100dvh]">
        <div className="w-full max-w-2xl -mx-[2px] border-l border-r border-neutral-700 h-full overflow-hidden flex flex-col">
          {loggedIn ? (
            <LoggedIn />
          ) : (
            <div className="w-sm mx-auto h-full flex flex-col justify-center items-center text-left">
              <div className="">
                A simple Spotify player for listening to playlists from{" "}
                <a
                  href="https://herbsundays.substack.com/"
                  className="underline"
                >
                  Herb Sundays
                </a>
                .
              </div>
              <div className="mt-5">
                You'll need a Spotify Premium account to use the player.
              </div>
              <a
                className="flex items-center justify-center underline w-full mx-auto my-5 py-4 rounded-full border border-neutral-400"
                href="/api/auth/spotify/login"
              >
                <div>Login with Spotify</div>
              </a>
              <div className="w-full">
                A personal project by{" "}
                <a href="https://grantcuster.com" className="underline">
                  Grant Custer
                </a>
                .<br />
                View the{" "}
                <a
                  className="underline"
                  href="https://github.com/GrantCuster/herb-sundays-player-grantcuster-com"
                >
                  code on GitHub
                </a>
                .
              </div>
            </div>
          )}
        </div>
      </div>
    </BrowserRouter>
  ) : null;
}

function LoggedIn() {
  useSpotify();
  const [searchParams] = useSearchParams();
  const [devicesLoading] = useAtom(SpotifyDevicesLoadingAtom);
  const [devices] = useAtom(SpotifyDevicesAtom);
  const viewMode = searchParams.get("view") ?? "player";

  return (
    <div className="h-full w-full mx-auto flex flex-col overflow-hidden">
      <Header />
      {!devicesLoading && devices.length === 0 ? (
        <div className="flex h-full jusify-center items-center">
          <div className="max-w-lg mx-auto p-2 text-center text-white">
            No active Spotify devices found. Please open Spotify on one of your
            devices.
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col grow overflow-hidden">
            {viewMode === "player" && <PlaylistWrapper />}
            {viewMode === "favs" && <Favs />}
          </div>
          <NowPlaying />
          <DevicePicker />
        </>
      )}
    </div>
  );
}

export default App;
