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
    return <div className="w-full border-t border-neutral-700 px-[1ch] py-[0.5lh] text-neutral-400">Loading...</div>;
  } else if (devices.length === 0) {
    return (
      <div className="w-full border-t border-neutral-700 px-[1ch] py-[0.5lh] text-red-400">
        Not connected. Please open Spotify on one of your devices.
      </div>
    );
  } else if (devices.length === 1) {
    return (
      <div className="text-neutral-400 border border-neutral-700 py-[0.5lh] w-full px-[1ch]">
        Connected to {activeDevice?.name}
      </div>
    );
  } else if (devices.length === 2) {
    return (
      <div className="flex border-t border-neutral-700 gap-[1ch] items-center w-full px-[1ch] pt-[0.25lh] pb-[1lh]">
        <div className="text-neutral-400">Connected to</div>
        <select
          className="bg-neutral-800 hover:bg-neutral-700 px-[1ch] grow py-[0.25lh] focus:outline-none text-white rounded-lg"
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
