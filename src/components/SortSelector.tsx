import React from "react";
import { Calendar, Star, ArrowDownAZ } from "lucide-react";
import { selectionChanged } from "@/utils/haptics";
import { motion } from "framer-motion";

export type SortOption = "dateAdded" | "rating" | "releaseDate" | "title";

interface SortSelectorProps {
  activeSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  style?: React.CSSProperties;
}

export const SortSelector: React.FC<SortSelectorProps> = ({
  activeSort,
  onSortChange,
  style,
}) => {
  const options: { id: SortOption; icon: any; label: string }[] = [
    { id: "dateAdded", icon: Calendar, label: "Дата" },
    { id: "rating", icon: Star, label: "Рейтинг" },
    { id: "title", icon: ArrowDownAZ, label: "А-Я" },
  ];

  const currentOption =
    options.find((opt) => opt.id === activeSort) || options[0];

  const handleNext = () => {
    selectionChanged();
    const currentIndex = options.findIndex((opt) => opt.id === activeSort);
    const nextIndex = (currentIndex + 1) % options.length;
    onSortChange(options[nextIndex].id);
  };

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={handleNext}
      className="btn btn-secondary"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.4rem",
        padding: "0 0.75rem",
        borderRadius: "var(--radius-full)",
        fontSize: "0.75rem",
        fontWeight: 600,
        height: "32px",
        ...style,
      }}
    >
      <motion.div
        key={currentOption.id}
        initial={{ y: -5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 5, opacity: 0 }}
        style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
      >
        <currentOption.icon size={14} style={{ color: "var(--primary)" }} />
        <span>{currentOption.label}</span>
      </motion.div>
    </motion.button>
  );
};
