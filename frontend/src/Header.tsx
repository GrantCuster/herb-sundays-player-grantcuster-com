import { useSearchParams } from "react-router-dom";
import type { ViewModeType } from "./Spotify/SpotifyTypes";

const viewModeOptions = ["player", "favs"] as ViewModeType[];

export function Header() {
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get("view") ?? "player";

  return (
    <div className="w-full text-sm flex justify-between text-neutral-400">
      <div className="flex px-1">
        {viewModeOptions.map((value, index) => (
          <button
            key={index}
            className={`py-2 px-3 ${viewMode === value ? "text-white" : ""}`}
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
      <div className="py-2 px-3">
        <a
          href="https://herbsundays.substack.com/"
          target="_blank"
          rel="noreferrer"
          className="underline text-white"
        >
          Herb Sundays
        </a>
      </div>
    </div>
  );
}
