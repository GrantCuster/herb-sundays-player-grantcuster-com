import { useAtom } from "jotai";
import {
  SpotifyActiveDeviceAtom,
  SpotifyBumpRefreshAtom,
  SpotifyDevicesAtom,
  SpotifyDevicesLoadingAtom,
  SpotifyFavoritesAtom,
  SpotifyNowPlayingAtom,
  SpotifyPausePollingAtom,
  SpotifyPlaylistsAtom,
  SpotifyUserIdAtom,
} from "./Spotify/SpotifyAtoms";
import { useEffect } from "react";
import type { SpotifyPlaylistType } from "./Spotify/SpotifyTypes";

export async function transferToDevice(device_id: string, play = true) {
  const res = await fetch("/api/spotify/transfer", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ device_id, play }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Transfer failed: ${res.status} ${t}`);
  }
}

export function useSpotify() {
  const pollMs = 5000;
  const [userId] = useAtom(SpotifyUserIdAtom);
  const [devices, setDevices] = useAtom(SpotifyDevicesAtom);
  const [devicesLoading, setDevicesLoading] = useAtom(
    SpotifyDevicesLoadingAtom,
  );
  const [, setNowPlaying] = useAtom(SpotifyNowPlayingAtom);
  const [activeDevice, setActiveDevice] = useAtom(SpotifyActiveDeviceAtom);
  const [pausePolling] = useAtom(SpotifyPausePollingAtom);
  const [bumpRefresh] = useAtom(SpotifyBumpRefreshAtom);
  const [, setPlaylists] = useAtom(SpotifyPlaylistsAtom);
  const [, setFavorites] = useAtom(SpotifyFavoritesAtom);

  async function fetchDevices() {
    try {
      // setError(null);
      const res = await fetch("/api/spotify/devices");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setDevices(data.devices ?? []);
      setActiveDevice(data.devices.find((d: any) => d.is_active) ?? null);
    } catch (e: any) {
      // setError(e?.message ?? "Failed to load devices");
    } finally {
      setDevicesLoading(false);
    }
  }

  async function fetchNowPlaying() {
    try {
      const res = await fetch("/api/spotify/me/player/currently-playing");
      if (res.status === 204) {
        // 204 means nothing is playing
        setNowPlaying((prev) => {
          if (prev && prev.is_playing) {
            return { ...prev, is_playing: false };
          }
          return prev;
        });
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setNowPlaying(data);
    } catch (err) {
      console.error("Failed to fetch now playing:", err);
    }
  }

  async function fetchFavorites() {
    try {
      const res = await fetch("/api/getFavorites?userId=" + userId);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setFavorites(data.items ?? []);
    } catch (err) {
      console.error("Failed to fetch favorites:", err);
    }
  }

  async function fetchHerbSundays() {
    function formatName(name: string) {
      let _parts = [name];
      if (name.includes(": ")) {
        _parts = name.split(": ");
        if (_parts.length > 2) {
          _parts[1] = _parts.slice(1).join(": ");
        }
      } else if (name.includes(" - ")) {
        _parts = name.split(" - ");
        if (_parts.length > 2) {
          _parts[1] = _parts.slice(1).join(" - ");
        }
      }
      const number = _parts[0].replace("Herb Sundays", "").trim();
      const title = _parts[1];
      return [number, title];
    }

    const playlists = await fetch("/api/spotify/herb_sundays");
    const _data = await playlists.json();
    const filtered = _data
      .filter(
        (p: SpotifyPlaylistType) =>
          p.name.toLowerCase().includes("herb sundays") &&
          /\d/.test(p.name.split(" ")[2]),
      )
      .map((originalPlaylist: SpotifyPlaylistType) => {
        const [number, title] = formatName(originalPlaylist.name);
        return {
          ...originalPlaylist,
          formattedNumber: number,
          formattedName: title,
        };
      });
    setPlaylists(filtered);
  }

  useEffect(() => {
    if (userId) {
      fetchFavorites();
    }
  }, [userId]);

  useEffect(() => {
    fetchHerbSundays();
  }, []);

  useEffect(() => {
    if (pausePolling) return;
    fetchDevices();
    fetchNowPlaying();
    const id = setInterval(() => {
      fetchDevices();
      fetchNowPlaying();
    }, pollMs);
    return () => clearInterval(id);
  }, [pausePolling]);

  useEffect(() => {
    fetchDevices();
    fetchNowPlaying();
  }, [bumpRefresh]);

  useEffect(() => {
    if (!devicesLoading && devices.length > 0 && !activeDevice) {
      setActiveDevice(devices[0]);
      transferToDevice(devices[0].id, false);
    }
  }, [devices, devicesLoading]);
}
