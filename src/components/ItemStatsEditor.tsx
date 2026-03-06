import React from "react";
import { motion } from "framer-motion";
import type { Item } from "../types";
import { pressAnimation } from "@utils/animations";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface ItemStatsEditorProps {
  status: Item["status"];
  itemType: Item["type"];
  isArchived: boolean;
  isTVShow: boolean;
  currentSeason: number;
  currentEpisode: number;
  progress: number;
  totalProgress: number;
  episodesPerSeason?: number[]; // Auto-filled from API
  numberOfSeasons?: number; // Total seasons from API
  onStatusChange: (status: Item["status"]) => void;
  onArchiveToggle: () => void;
  onSeasonChange: (val: number) => void;
  onEpisodeChange: (val: number) => void;
  onProgressChange: (val: number) => void;
}

export const ItemStatsEditor: React.FC<ItemStatsEditorProps> = ({
  status,
  itemType,
  isArchived,
  isTVShow,
  currentSeason,
  currentEpisode,
  progress,
  totalProgress,
  episodesPerSeason,
  numberOfSeasons,
  onStatusChange,
  onArchiveToggle,
  onSeasonChange,
  onEpisodeChange,
  onProgressChange,
}) => {
  const getProgressLabel = () => {
    switch (itemType) {
      case "movie":
        return "Прогресс (мин)";
      case "show":
        return "Серии";
      case "book":
        return "Страницы";
      case "game":
        return "Прогресс";
      default:
        return "Прогресс";
    }
  };

  const showProgressSlider = itemType === "book" || itemType === "show";

  return (
    <div className="flex flex-col gap-5">
      {/* Status Tabs */}
      <div>
        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
          Статус
        </label>
        <Tabs
          value={status}
          onValueChange={(val) => onStatusChange(val as any)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 bg-zinc-900 border border-white/5 h-auto p-1 rounded-xl">
            <TabsTrigger
              value="planned"
              className="py-2 rounded-lg data-[state=active]:bg-zinc-600/30 data-[state=active]:text-zinc-300 text-xs font-bold transition-all"
            >
              В планах
            </TabsTrigger>
            <TabsTrigger
              value="in_progress"
              className="py-2 flex items-center gap-1.5 rounded-lg data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400 text-xs font-bold transition-all"
            >
              В процессе
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="py-2 flex items-center gap-1.5 rounded-lg data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-500 text-xs font-bold transition-all"
            >
              Завершено
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Archive Button */}
      {status === "completed" && (
        <div>
          <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
            Архив
          </label>
          <button
            onClick={onArchiveToggle}
            className={cn(
              "w-full py-3 flex items-center justify-center rounded-xl text-sm font-bold transition-all outline-none",
              isArchived
                ? "bg-amber-500/20 text-amber-500 border border-amber-500/30"
                : "bg-white/5 text-zinc-400 border border-white/5 hover:bg-white/10"
            )}
          >
            {isArchived ? "В АРХИВЕ" : "В АКТИВНЫХ"}
          </button>
        </div>
      )}

      {/* Series Tracker - STRICTLY FOR SHOWS */}
      {isTVShow && (
        <div className="bg-primary/5 border border-primary/10 rounded-xl p-3">
          <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-3">
            Трекер серий
          </label>
          <div className="flex flex-row items-center justify-between gap-1">
            <div className="flex-1 flex flex-col items-center">
              <span className="block text-[0.6rem] text-zinc-500 text-center mb-1.5 font-bold uppercase tracking-tighter">
                СЕЗОН
              </span>
              <div className="flex items-center gap-1.5">
                <motion.button
                  {...pressAnimation}
                  onClick={() => onSeasonChange(Math.max(1, currentSeason - 1))}
                  className="w-7 h-7 shrink-0 rounded-lg bg-white/10 flex items-center justify-center font-black"
                >
                  -
                </motion.button>
                <div className="text-lg font-black min-w-[1.2rem] text-center">
                  {currentSeason}
                  {numberOfSeasons && (
                    <span className="text-[0.65rem] font-semibold text-zinc-500 ml-0.5">
                      /{numberOfSeasons}
                    </span>
                  )}
                </div>
                <motion.button
                  {...pressAnimation}
                  onClick={() => {
                    const maxSeasons = numberOfSeasons || episodesPerSeason?.length || 999;
                    if (currentSeason < maxSeasons) {
                      onSeasonChange(currentSeason + 1);
                    }
                  }}
                  disabled={numberOfSeasons ? currentSeason >= numberOfSeasons : false}
                  className="w-7 h-7 shrink-0 rounded-lg bg-white/10 disabled:opacity-30 flex items-center justify-center font-black"
                >
                  +
                </motion.button>
              </div>
            </div>

            <div className="w-[1px] h-8 bg-white/5 shrink-0" />

            <div className="flex-1 flex flex-col items-center">
              <span className="block text-[0.6rem] text-zinc-500 text-center mb-1.5 font-bold uppercase tracking-tighter">
                СЕРИЯ
              </span>
              <div className="flex items-center gap-1.5">
                <motion.button
                  {...pressAnimation}
                  onClick={() => onEpisodeChange(Math.max(1, currentEpisode - 1))}
                  className="w-7 h-7 shrink-0 rounded-lg bg-white/10 flex items-center justify-center font-black"
                >
                  -
                </motion.button>
                <div className="text-lg font-black min-w-[1.2rem] text-center">
                  {currentEpisode}
                  {episodesPerSeason && episodesPerSeason[currentSeason - 1] && (
                    <span className="text-[0.65rem] font-semibold text-zinc-500 ml-0.5">
                      /{episodesPerSeason[currentSeason - 1]}
                    </span>
                  )}
                </div>
                <motion.button
                  {...pressAnimation}
                  onClick={() => {
                    const maxEpisode = episodesPerSeason?.[currentSeason - 1];
                    if (!maxEpisode || currentEpisode < maxEpisode) {
                      onEpisodeChange(currentEpisode + 1);
                    }
                  }}
                  disabled={
                    episodesPerSeason?.[currentSeason - 1]
                      ? currentEpisode >= episodesPerSeason[currentSeason - 1]
                      : false
                  }
                  className="w-7 h-7 shrink-0 rounded-lg bg-white/10 disabled:opacity-30 flex items-center justify-center font-black"
                >
                  +
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Slider */}
      {showProgressSlider && (
        <div className="bg-white/5 border border-white/5 rounded-xl p-4">
          <div className="flex justify-between mb-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              {getProgressLabel()}
            </label>
            <div className="flex gap-4">
              <span className="text-xs font-bold text-primary">
                {progress} / {totalProgress || "?"}
              </span>
              {totalProgress > 0 && (
                <span className="text-xs font-bold text-zinc-500">
                  {Math.round((progress / totalProgress) * 100)}%
                </span>
              )}
            </div>
          </div>
          <input
            type="range"
            min="0"
            max={totalProgress || (itemType === "book" ? 1000 : 100)}
            value={progress || 0}
            onChange={(e) => onProgressChange(Number(e.target.value))}
            className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none accent-primary cursor-pointer hover:accent-primary/80 transition-all"
          />
        </div>
      )}
    </div>
  );
};
