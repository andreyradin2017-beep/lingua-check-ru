import React from "react";
import { Film, Gamepad2, BookOpen } from "lucide-react";
import { selectionChanged } from "@/utils/haptics";
import { motion } from "framer-motion";

export type Category = "movie" | "game" | "book";

interface CategorySelectorProps {
  activeCategory: Category;
  onCategoryChange: (category: Category) => void;
  style?: React.CSSProperties;
}

import { pressAnimation, EASINGS } from "@utils/animations";

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  activeCategory,
  onCategoryChange,
  style,
}) => {
  const categories: { id: Category; icon: any; label: string }[] = [
    { id: "movie", icon: Film, label: "Кино" },
    { id: "game", icon: Gamepad2, label: "Игры" },
    { id: "book", icon: BookOpen, label: "Книги" },
  ];

  return (
    <div
      style={{
        display: "flex",
        gap: "0.3rem",
        background: "var(--bg-surface)",
        padding: "0.25rem",
        borderRadius: "var(--radius-xl)",
        border: "var(--border-glass)",
        overflowX: "auto",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        ...style,
      }}
      className="no-scrollbar"
    >
      {categories.map((cat) => {
        const isActive = activeCategory === cat.id;
        return (
          <motion.button
            key={cat.id}
            {...pressAnimation}
            onClick={() => {
              if (!isActive) {
                selectionChanged();
                onCategoryChange(cat.id);
              }
            }}
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              padding: "0.45rem 0.75rem",
              border: "none",
              borderRadius: "var(--radius-lg)", // Reduced radius to fit inside
              cursor: "pointer",
              background: "transparent",
              color: isActive ? "white" : "var(--text-secondary)",
              transition: "color 0.2s ease",
              fontSize: "0.75rem",
              fontWeight: 600,
              whiteSpace: "nowrap",
              zIndex: 1,
            }}
          >
            {isActive && (
              <motion.div
                layoutId="activeCategory"
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "var(--primary)",
                  borderRadius: "var(--radius-lg)",
                  zIndex: -1,
                  boxShadow: "0 2px 8px rgba(139, 92, 246, 0.3)",
                }}
                transition={EASINGS.spring}
              />
            )}
            <cat.icon size={13} style={{ position: "relative", zIndex: 2 }} />
            <span style={{ position: "relative", zIndex: 2 }}>{cat.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
};
