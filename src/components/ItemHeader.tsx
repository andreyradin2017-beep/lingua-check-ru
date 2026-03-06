import { motion } from "framer-motion";
import { Play, Monitor, Gamepad2, Smartphone, MonitorSpeaker } from "lucide-react";
interface ItemHeaderProps {
  title: string;
  type: string;
  year?: string | number;
  hasTrailer: boolean;
  source?: string;
  genres?: string[];
  authors?: string[];
  platforms?: string[];
  onShowTrailer: () => void;
  onAuthorClick?: (author: string) => void;
  actionButtons?: React.ReactNode;
}

export const ItemHeader: React.FC<ItemHeaderProps> = ({
  title,
  type,
  year,
  hasTrailer,
  source,
  genres,
  authors,
  platforms,
  onShowTrailer,
  onAuthorClick,
  actionButtons,
}) => {
  const getPlatformIcon = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes("pc") || p.includes("mac") || p.includes("linux")) return <Monitor size={14} />;
    if (p.includes("playstation") || p.includes("xbox") || p.includes("nintendo") || p.includes("switch")) return <Gamepad2 size={14} />;
    if (p.includes("ios") || p.includes("android")) return <Smartphone size={14} />;
    return <MonitorSpeaker size={14} />; // Default generic
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Title & Actions */}
      <div className="flex justify-between items-start gap-4">
        <div className="flex flex-col gap-1 flex-1">
          <h2 className="text-3xl font-black font-main tracking-tight leading-tight text-zinc-100 m-0">
            {title}
          </h2>
          
          {hasTrailer && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onShowTrailer}
              className="mt-2 flex items-center gap-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-md px-3 py-1.5 w-fit rounded-xl text-white font-bold text-sm transition-colors border border-white/10 shrink-0"
              aria-label="Смотреть трейлер"
            >
              <Play size={14} fill="currentColor" /> Трейлер
            </motion.button>
          )}
        </div>

        {/* Action Buttons Container */}
        {actionButtons && (
          <div className="flex gap-2 shrink-0">
            {actionButtons}
          </div>
        )}
      </div>

      <div>
        {authors && authors.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center mb-3">
            {authors.map((author, i) => (
              <span
                key={i}
                onClick={() => onAuthorClick?.(author)}
                className={`text-sm font-bold text-primary opacity-90 ${onAuthorClick ? 'cursor-pointer hover:underline' : 'cursor-default'}`}
              >
                {author}
                {i < authors.length - 1 ? ", " : ""}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2 items-center mb-3">
          {source && (
            <span className="text-[0.65rem] bg-white/5 border border-white/5 px-2 py-0.5 rounded-md uppercase font-black text-zinc-400 tracking-wider">
              {source === "google_books" ? "BOOKS" : source}
            </span>
          )}
          <span className="text-[0.65rem] bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-md uppercase font-black tracking-wider">
            {type}
          </span>
          {year && (
            <span className="text-sm text-zinc-400 font-semibold ml-1">
              {year}
            </span>
          )}
        </div>

        {/* Genres Tags */}
        {genres && genres.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {genres.map((g, i) => (
              <span
                key={i}
                className="text-xs text-zinc-300 bg-white/5 px-2 py-1 rounded-md border border-white/5 font-semibold"
              >
                {g}
              </span>
            ))}
          </div>
        )}

        {/* Platforms */}
        {platforms && platforms.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {platforms.slice(0, 5).map((platform, i) => (
              <span
                key={i}
                title={platform}
                className="flex items-center justify-center text-white bg-white/10 p-1.5 rounded-md"
              >
                {getPlatformIcon(platform)}
              </span>
            ))}
            {platforms.length > 5 && (
              <span className="text-[0.65rem] text-zinc-500 font-bold flex items-center ml-1">
                +{platforms.length - 5}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
