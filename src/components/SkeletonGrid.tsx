import React from "react";
import { SkeletonCard } from "./SkeletonCard";
import { SkeletonList } from "./SkeletonList";
import { motion } from "framer-motion";

interface SkeletonGridProps {
  count?: number;
  type?: "card" | "list";
  className?: string;
  style?: React.CSSProperties;
}

export const SkeletonGrid: React.FC<SkeletonGridProps> = ({
  count = 6,
  type = "card",
  style,
}) => {
  const items = Array.from({ length: count }, (_, i) => i);

  if (type === "list") {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          ...style,
        }}
      >
        {items.map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          >
            <SkeletonList />
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
        gap: "0.75rem",
        ...style,
      }}
    >
      {items.map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
        >
          <SkeletonCard />
        </motion.div>
      ))}
    </div>
  );
};
