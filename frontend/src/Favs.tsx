import { useAtom } from "jotai";
import {
  SpotifyFavoritesAtom,
  SpotifyPlaylistsAtom,
} from "./Spotify/SpotifyAtoms";
import { HeartIcon } from "lucide-react";
import { useSearchParams } from "react-router-dom";

export function Favs() {
  const [, setSearchParams] = useSearchParams();
  const [playlists] = useAtom(SpotifyPlaylistsAtom);
  const [favorites] = useAtom(SpotifyFavoritesAtom);
  const favs =
    playlists?.filter((p) => favorites.includes(p.formattedNumber)) || [];

  return (
    <div className="px-3 py-2 overflow-hidden flex flex-col grow gap-2 border border-neutral-700">
      <div className="overflow-y-auto grow">
        {favs?.map((playlist) => (
          <div
            key={playlist.id}
            className="text-neutral-400 flex gap-3 text-sm items-start border-b border-neutral-700 py-1"
          >
            <div className="w-[5ch] shrink-0">{playlist.formattedNumber}</div>
            <button
              className="text-left"
              onClick={() => {
                setSearchParams((prev) => {
                  prev.delete("view");
                  prev.set("playlist", playlist.formattedNumber);
                  return prev;
                });
              }}
            >
              <div className="text-white text-left">
                {playlist.formattedName}
              </div>
              <div
                className="text-xs mt-0.5"
                dangerouslySetInnerHTML={{ __html: playlist.description || "" }}
              ></div>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
