import React from "react";
import { Clock } from "lucide-react";

interface CountdownBadgeProps {
  releaseDate: string;
  compact?: boolean;
}

export const CountdownBadge: React.FC<CountdownBadgeProps> = ({
  releaseDate,
  compact = false,
}) => {
  const now = new Date();
  const release = new Date(releaseDate);
  const diffMs = release.getTime() - now.getTime();

  // If already released, don't show
  if (diffMs <= 0) return null;

  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  let label: string;
  if (diffDays === 1) {
    label = "Завтра!";
  } else if (diffDays <= 7) {
    label = `Через ${diffDays} дн.`;
  } else if (diffDays <= 30) {
    const weeks = Math.floor(diffDays / 7);
    label = `Через ${weeks} нед.`;
  } else if (diffDays <= 365) {
    const months = Math.floor(diffDays / 30);
    label = `Через ${months} мес.`;
  } else {
    return null; // Too far away
  }

  const isImminent = diffDays <= 7;

  if (compact) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-xs)",
          background: isImminent ? "var(--error-20)" : "var(--primary-20)",
          color: isImminent ? "var(--error)" : "var(--primary)",
          padding: "2px var(--space-xs)",
          borderRadius: "var(--radius-sm)",
          fontSize: "var(--font-xs)",
          fontWeight: 700,
          lineHeight: 1,
          backdropFilter: "blur(4px)",
        }}
      >
        <Clock size={8} />
        {label}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-xs)",
        background: isImminent
          ? "linear-gradient(135deg, var(--error-15), var(--error-10))"
          : "linear-gradient(135deg, var(--primary-15), var(--primary-10))",
        color: isImminent ? "var(--error)" : "var(--primary)",
        padding: "var(--space-xs) var(--space-sm)",
        borderRadius: "var(--radius-md)",
        fontSize: "var(--font-sm)",
        fontWeight: 700,
        border: isImminent
          ? "1px solid var(--error-20)"
          : "1px solid var(--primary-20)",
      }}
    >
      <Clock size={12} />
      {label}
    </div>
  );
};
