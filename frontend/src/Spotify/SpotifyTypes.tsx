export type ViewModeType = "player" | "favs" | "list";

// Types are not exhaustive
export type SpotifyPlaylistType = {
  id: string;
  description: string;
  name: string;
  // custom formatted
  formattedNumber: string;
  formattedName: string;
  uri: string;
  images: { url: string }[];
  tracks: { total: number };
};

export type SpotifyTrackType = {
  id: string;
  name: string;
  uri: string;
  artists: { name: string }[];
  album: { name: string; images: { url: string }[] };
};

export type SpotifyDeviceType = {
  id: string;
  name: string;
  type: "Computer" | "Smartphone" | "Speaker" | string;
  is_active: boolean;
  is_private_session: boolean;
  is_restricted: boolean;
  volume_percent: number | null;
};

export type SpotifyNowPlayingType = {
  is_playing: boolean;
  progress_ms: number;
  item: {
    id: string;
    name: string;
    artists: { name: string }[];
    album: { images: { url: string }[] };
    duration_ms: number;
  };
  context: { uri: string };
} | null;
