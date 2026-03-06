import React from "react";
import { StatusFilter, type StatusFilterType } from "./StatusFilter";
import { SortSelector, type SortOption } from "./SortSelector";

interface FilterToolbarProps {
  activeStatus: StatusFilterType;
  onStatusChange: (status: StatusFilterType) => void;
  activeSort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  activeStatus,
  onStatusChange,
  activeSort,
  onSortChange,
}) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.6rem",
        padding: "0 0.2rem",
      }}
    >
      <div style={{ flexShrink: 0 }}>
        <SortSelector activeSort={activeSort} onSortChange={onSortChange} />
      </div>

      <div
        style={{
          width: "1px",
          height: "20px",
          background: "var(--border-glass)",
          flexShrink: 0,
        }}
      />

      <div style={{ flex: 1, overflow: "hidden" }}>
        <StatusFilter
          activeStatus={activeStatus}
          onStatusChange={onStatusChange}
          compact
        />
      </div>
    </div>
  );
};
