import { useAtom } from "jotai";
import {
  SpotifyBumpRefreshAtom,
  SpotifyNowPlayingAtom,
} from "./Spotify/SpotifyAtoms";
import { FastForwardIcon, PauseIcon, PlayIcon } from "lucide-react";
import { formatDuration } from "./Utils";

export function NowPlaying() {
  const [nowPlaying, setNowPlaying] = useAtom(SpotifyNowPlayingAtom);
  const [, setBumpRefresh] = useAtom(SpotifyBumpRefreshAtom);

  if (!nowPlaying) {
    return <div className="w-full px-3">Nothing is playing</div>;
  }
  const progress = Math.min(
    100,
    (nowPlaying.progress_ms / nowPlaying.item.duration_ms) * 100,
  );
  return (
    <div className="w-full flex flex-col px-3 pt-2 gap-3">
      <div className="w-full flex gap-3">
        {nowPlaying.is_playing ? (
          <button
            className="w-[2lh] rounded-full h-[2lh] bg-neutral-800 hover:bg-neutral-700 flex justify-center items-center shrink-0"
            onClick={() => {
              // optimistically update UI
              setNowPlaying((prev) =>
                prev ? { ...prev, is_playing: false } : prev,
              );
              fetch(`/api/spotify/pause`, { method: "PUT" });
            }}
          >
            <PauseIcon size={16} />
          </button>
        ) : (
          <button
            className="w-[2lh] rounded-full h-[2lh] bg-neutral-800 hover:bg-neutral-700 flex justify-center items-center shrink-0"
            onClick={() => {
              // optimistically update UI
              setNowPlaying((prev) =>
                prev ? { ...prev, is_playing: true } : prev,
              );
              fetch(`/api/spotify/play`, { method: "PUT" });
            }}
          >
            <PlayIcon size={16} />
          </button>
        )}
        <div className="grow overflow-hidden">
          <div className="truncate w-full">{nowPlaying.item.name}</div>
          <div className="text-neutral-400 truncate w-full">
            {nowPlaying.item.artists.map((a) => a.name).join(", ")}
          </div>
        </div>
        {nowPlaying.item.album.images[0] && (
          <img
            src={nowPlaying.item.album.images[0]?.url}
            className="h-[2lh] w-[2lh] shrink-0"
          />
        )}
      </div>
      <div className="w-full flex gap-3 items-center">
        <div className="grow relative h-2 bg-neutral-800">
          <div
            className="absolute h-2 bg-neutral-400 top-0 left-0"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="shrink-0 text-neutral-400">
          {formatDuration(nowPlaying.item.duration_ms)}
        </div>
        <button
          className="shrink-0 bg-neutral-800 hover:bg-neutral-700 flex justify-center items-center w-[5ch] h-[1lh]"
          onClick={async () => {
            setNowPlaying((prev) =>
              prev
                ? {
                    ...prev,
                    item: {
                      ...prev.item,
                      name: "...",
                      artists: [],
                      album: { images: [] },
                    },
                    progress_ms: 0,
                  }
                : prev,
            );
            await fetch(`/api/spotify/next`, { method: "POST" });
            setTimeout(() => {
              setBumpRefresh((v) => v + 1);
            }, 500);
          }}
        >
          <FastForwardIcon size={16} />
        </button>
      </div>
    </div>
  );
}


