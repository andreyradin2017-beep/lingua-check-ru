import React from "react";
import { Skeleton } from "./Skeleton";

export const SkeletonCard: React.FC = () => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        padding: "0.5rem",
        background: "rgba(255,255,255,0.02)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <Skeleton width="100%" height="200px" borderRadius="var(--radius-md)" />
      <div style={{ padding: "0 0.25rem" }}>
        <Skeleton
          width="80%"
          height="1.2rem"
          style={{ marginBottom: "0.5rem" }}
        />
        <Skeleton width="40%" height="0.8rem" />
      </div>
    </div>
  );
};
