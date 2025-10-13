import { atom } from "jotai";
import type {
  SpotifyDeviceType,
  SpotifyNowPlayingType,
  SpotifyPlaylistType,
  SpotifyTrackType,
} from "./SpotifyTypes";

export const SpotifyUserIdAtom = atom<string | null>(null);
export const SpotifyFavoritesAtom = atom<string[]>([]);
export const SpotifyNowPlayingAtom = atom<SpotifyNowPlayingType>(null);
export const SpotifyDevicesAtom = atom<SpotifyDeviceType[]>([]);
export const SpotifyDevicesLoadingAtom = atom<boolean>(true);
export const SpotifyActiveDeviceAtom = atom<SpotifyDeviceType | null>(null);
export const SpotifyPausePollingAtom = atom(false);
export const SpotifyBumpRefreshAtom = atom(0);
export const SpotifyPlaylistsAtom = atom<SpotifyPlaylistType[] | null>(null);
export const SpotifyPlaylistTracksMapAtom = atom<
  Record<string, { track: SpotifyTrackType }[] | "loading">
>({});
