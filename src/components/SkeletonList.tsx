import React from "react";
import { motion } from "framer-motion";

export const SkeletonList: React.FC = () => {
  return (
    <div
      style={{
        width: "100%",
        padding: "0.75rem",
        background: "var(--bg-surface)",
        borderRadius: "12px",
        overflow: "hidden",
        position: "relative",
        border: "var(--border-glass)",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
      }}
    >
      {/* Shimmer Effect */}
      <motion.div
        animate={{
          x: ["-100%", "100%"],
        }}
        transition={{
          repeat: Infinity,
          duration: 1.2,
          ease: "linear",
        }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)",
          zIndex: 1,
        }}
      />

      {/* Icon Placeholder */}
      <div
        style={{
          width: "40px",
          height: "56px",
          borderRadius: "6px",
          background: "rgba(255,255,255,0.08)",
          zIndex: 2,
        }}
      />

      {/* Content Placeholders */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          zIndex: 2,
        }}
      >
        {/* Title Line */}
        <div
          style={{
            height: "1rem",
            width: "60%",
            background: "rgba(255,255,255,0.08)",
            borderRadius: "4px",
          }}
        />
        {/* Subtitle Line */}
        <div
          style={{
            height: "0.8rem",
            width: "30%",
            background: "rgba(255,255,255,0.05)",
            borderRadius: "4px",
          }}
        />
      </div>
    </div>
  );
};
