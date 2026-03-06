import React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import type { SearchProviderId } from "../types";
import { Section } from "./Section";

interface SearchProviderSettingsProps {
  showToast: (message: string, type: "success" | "error" | "info") => void;
  setConfirmState: (state: {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }) => void;
}

const PROVIDER_LABELS: Record<SearchProviderId, string> = {
  tmdb: "🎥 TMDB",
  kinopoisk: "🎬 Кинопоиск",
  rawg: "🎮 RAWG (Игры)",
  google_books: "📚 Google Books",
  litres: "📙 ЛитРес (Книги)",
} as any;

export const SearchProviderSettings: React.FC<SearchProviderSettingsProps> = ({
  showToast,
  setConfirmState,
}) => {
  const providers = useLiveQuery(() => db.search_providers.toArray(), []);

  const handleToggle = async (id: SearchProviderId) => {
    if (!providers) return;

    const provider = providers.find((p) => p.id === id);
    if (!provider) return;

    // Check if this is the last enabled provider
    const enabledCount = providers.filter((p) => p.enabled && (p.id as string) !== 'bookmate').length;

    if (provider.enabled && enabledCount === 1) {
      // Prevent disabling the last provider
      setConfirmState({
        isOpen: true,
        title: "Невозможно отключить",
        message: "Должен быть включен хотя бы один источник поиска.",
        onConfirm: () => {},
      });
      return;
    }

    // Toggle the provider
    await db.search_providers.update(id, { enabled: !provider.enabled });

    // Clear cache to force fresh search results
    await db.cache.clear();

    showToast(
      provider.enabled
        ? `${PROVIDER_LABELS[id]} отключен`
        : `${PROVIDER_LABELS[id]} включен`,
      "info",
    );
  };

  if (!providers || providers.length === 0) {
    return null;
  }

  const filteredProviders = providers.filter(p => (p.id as string) !== 'bookmate');
  const enabledCount = filteredProviders.filter((p) => p.enabled).length;

  return (
    <Section
      title="ИСТОЧНИКИ ПОИСКА"
      icon={<Search size={14} />}
      collapsible={true}
      defaultCollapsed={true}
      badge={`${enabledCount}/${filteredProviders.length}`}
      style={{ marginBottom: "0.25rem" }}
    >
      <p
        style={{
          fontSize: "0.85rem",
          color: "var(--text-secondary)",
          marginBottom: "1rem",
          lineHeight: "1.4",
        }}
      >
        Выберите, где искать фильмы, игры и книги. Включено: {enabledCount} из{" "}
        {filteredProviders.length}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {filteredProviders
          .sort((a, b) => a.priority - b.priority)
          .map((provider) => (

            <motion.div
              key={provider.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleToggle(provider.id)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.75rem",
                background: provider.enabled
                  ? "rgba(168, 85, 247, 0.05)"
                  : "rgba(255,255,255,0.02)",
                border: provider.enabled
                  ? "1px solid rgba(168, 85, 247, 0.2)"
                  : "1px solid rgba(255,255,255,0.05)",
                borderRadius: "var(--radius-lg)",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <span
                style={{
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  color: provider.enabled
                    ? "var(--text-primary)"
                    : "var(--text-tertiary)",
                }}
              >
                {PROVIDER_LABELS[provider.id]}
              </span>

              <div
                style={{
                  width: "44px",
                  height: "24px",
                  borderRadius: "12px",
                  background: provider.enabled
                    ? "var(--primary)"
                    : "rgba(255,255,255,0.1)",
                  position: "relative",
                  transition: "background 0.2s ease",
                }}
              >
                <motion.div
                  animate={{
                    x: provider.enabled ? 20 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  style={{
                    position: "absolute",
                    top: "2px",
                    left: "2px",
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    background: "white",
                  }}
                />
              </div>
            </motion.div>
          ))}
      </div>
    </Section>
  );
};
