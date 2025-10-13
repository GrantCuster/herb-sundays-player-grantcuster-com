import { useAtom } from "jotai";
import {
  SpotifyDevicesAtom,
  SpotifyDevicesLoadingAtom,
  SpotifyActiveDeviceAtom,
  SpotifyNowPlayingAtom,
  SpotifyPausePollingAtom,
} from "./Spotify/SpotifyAtoms";
import { transferToDevice } from "./useSpotify";

export function DevicePicker() {
  const [devices] = useAtom(SpotifyDevicesAtom);
  const [nowPlaying] = useAtom(SpotifyNowPlayingAtom);
  const [devicesLoading] = useAtom(SpotifyDevicesLoadingAtom);
  const [activeDevice, setActiveDevice] = useAtom(SpotifyActiveDeviceAtom);
  const [, setPausePolling] = useAtom(SpotifyPausePollingAtom);

  if (devicesLoading) {
    return <div className="w-full px-3">Loading...</div>;
  } else if (devices.length === 0) {
    return (
      <div className="w-full px-3 text-sm text-neutral-400 py-1">
        No Spotify devices found. Please open Spotify on one of your devices.
      </div>
    );
  } else if (devices.length === 1) {
    return (
      <div className="text-neutral-400 text-sm px-3 py-1">
        Connected to {activeDevice?.name}
      </div>
    );
  } else if (devices.length === 2) {
    return (
      <div className="flex gap-2 items-center w-full px-3">
        <div className="text-neutral-400">Connected to</div>
        <select
          className="bg-neutral-900 hover:bg-neutral-800 px-2 grow py-1 text-sm focus:outline-none text-white"
          value={activeDevice?.id ?? ""}
          onChange={(e) => {
            const d = devices.find((d) => d.id === e.target.value);
            if (d && d.id !== activeDevice?.id) {
              setPausePolling(true);
              setActiveDevice(d);
              transferToDevice(d.id, nowPlaying?.is_playing ?? false);
              setTimeout(() => {
                setPausePolling(false);
              }, 2000);
            }
          }}
        >
          {devices.map((d) => (
            <option
              className="bg-neutral-900 hover:bg-neutral-800 px-2 py-1 text-white"
              key={d.id}
              value={d.id}
            >
              {d.name} {d.is_active}
            </option>
          ))}
        </select>
      </div>
    );
  }
}
