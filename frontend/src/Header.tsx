import { useSearchParams } from "react-router-dom";
import type { ViewModeType } from "./Spotify/SpotifyTypes";

const viewModeOptions = ["player", "favs"] as ViewModeType[];

export function Header() {
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get("view") ?? "player";

  return (
    <div className="bg-black flex justify-between px-[0.5ch] border-b border-neutral-700">
      <div className="flex gap-[1ch]">
        {viewModeOptions.map((value, index) => (
          <button
            key={index}
            className={`py-[0.125lh] px-[0.5ch] ${viewMode === value ? "text-white" : "text-neutral-400"}`}
            onClick={() => {
              setSearchParams((prev) => {
                if (value === "player") {
                  prev.delete("view");
                } else {
                  prev.set("view", value);
                }
                return prev;
              });
            }}
          >
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </button>
        ))}
      </div>
      <a
        className={`py-[0.125lh] px-[0.5ch] text-neutral-200 underline text-white`}
        href="https://herbsundays.substack.com/"
        target="_blank"
        rel="noreferrer"
      >
        Herb Sundays →
      </a>
    </div>
  );
}
