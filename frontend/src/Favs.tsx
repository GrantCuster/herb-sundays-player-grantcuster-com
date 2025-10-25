import { useAtom } from "jotai";
import {
  SpotifyFavoritesAtom,
  SpotifyPlaylistsAtom,
} from "./Spotify/SpotifyAtoms";
import { useSearchParams } from "react-router-dom";

export function Favs() {
  const [, setSearchParams] = useSearchParams();
  const [playlists] = useAtom(SpotifyPlaylistsAtom);
  const [favorites] = useAtom(SpotifyFavoritesAtom);
  const favs =
    playlists?.filter((p) => favorites.includes(p.formattedNumber)) || [];

  return (
    <div className="overflow-hidden flex flex-col grow">
      <div className="overflow-y-auto grow">
        {favs?.map((playlist) => (
          <div
            key={playlist.id}
            className="flex py-[0.25lh] w-full border-b border-neutral-800"
            onClick={() => {
              setSearchParams((prev) => {
                prev.delete("view");
                prev.set("playlist", playlist.formattedNumber);
                return prev;
              });
            }}
          >
            <div className="flex w-full">
              <div className="grow">
                <div className="flex">
                  <div className="w-[5ch] px-[1ch] shrink-0 text-right">
                    {playlist.formattedNumber}
                  </div>
                  <div className="px-[1ch]">{playlist.formattedName}</div>
                </div>

                <div className="px-[1ch]">
                  <div
                    className="text-neutral-400 text-sm"
                    dangerouslySetInnerHTML={{
                      __html: playlist.description || "",
                    }}
                  ></div>
                </div>
              </div>
              <img
                className="h-[2.75lh] w-[2.75lh] mr-[1ch] object-cover"
                src={playlist.images[0].url}
                alt=""
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
