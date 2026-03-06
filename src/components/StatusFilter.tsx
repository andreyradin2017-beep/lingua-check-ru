import React from "react";
import { motion } from "framer-motion";
import type { ItemStatus } from "../types";

export type StatusFilterType = "all" | ItemStatus;

interface StatusFilterProps {
  activeStatus: StatusFilterType;
  onStatusChange: (status: StatusFilterType) => void;
  compact?: boolean;
}

export const StatusFilter: React.FC<StatusFilterProps> = ({
  activeStatus,
  onStatusChange,
  compact,
}) => {
  const statuses: { id: StatusFilterType; label: string }[] = [
    { id: "all", label: "Все" },
    { id: "planned", label: "Планы" },
    { id: "in_progress", label: "В процессе" },
    { id: "completed", label: "Готово" },
  ];

  return (
    <div
      className="no-scrollbar"
      style={{
        display: "flex",
        gap: "0.5rem",
        overflowX: "auto",
        padding: "0 0.25rem",
        margin: compact ? "0" : "0 -0.25rem 1rem", // negative margin to allow scroll to edge
        scrollbarWidth: "none",
      }}
    >
      {statuses.map((status) => {
        const isActive = activeStatus === status.id;
        return (
          <motion.button
            key={status.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => onStatusChange(status.id)}
            className={isActive ? "btn" : "btn-secondary"}
            style={{
              padding: "var(--space-xs) 0.8rem",
              borderRadius: "var(--radius-full)",
              background: isActive ? "var(--primary-15)" : "var(--bg-surface)",
              border: isActive
                ? "1px solid var(--primary-30)"
                : "var(--border-glass)",
              color: isActive ? "var(--primary)" : "var(--text-secondary)",
              fontSize: "0.75rem",
              fontWeight: 600,
              whiteSpace: "nowrap",
              height: "32px",
              flexShrink: 0,
            }}
          >
            {status.label}
          </motion.button>
        );
      })}
    </div>
  );
};
