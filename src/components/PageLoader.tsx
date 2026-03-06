import React from "react";
import { Skeleton } from "./Skeleton";

export const PageLoader: React.FC = () => (
  <div
    style={{
      padding: "1rem",
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
    }}
  >
    <Skeleton width="100%" height={200} borderRadius={16} />
    <Skeleton width="100%" height={100} borderRadius={16} />
    <Skeleton width="100%" height={300} borderRadius={16} />
  </div>
);
