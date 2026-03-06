import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ScreenshotsCarouselProps {
  screenshots: string[];
}

export const ScreenshotsCarousel: React.FC<ScreenshotsCarouselProps> = ({
  screenshots,
}) => {
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  if (!screenshots || screenshots.length === 0) return null;

  return (
    <>
      <div style={{ margin: "var(--space-md) 0" }}>
        <h3
          style={{
            fontSize: "1rem",
            fontWeight: 700,
            marginBottom: "0.75rem",
            color: "var(--text-primary)",
          }}
        >
          Медиа
        </h3>
        <div
          className="hide-scrollbar"
          style={{
            display: "flex",
            overflowX: "auto",
            gap: "0.75rem",
            paddingBottom: "1rem",
            margin: "0 -1rem",
            padding: "0 1rem 1rem 1rem",
            scrollbarWidth: "none",
          }}
        >
          {screenshots.map((img, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setFullscreenImage(img)}
              style={{
                flexShrink: 0,
                width: "220px",
                aspectRatio: "16/9",
                borderRadius: "12px",
                overflow: "hidden",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              }}
            >
              <img
                src={img}
                alt={`Screenshot ${idx + 1}`}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
                loading="lazy"
              />
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {fullscreenImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFullscreenImage(null)}
            className="flex-center"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1000,
              background: "rgba(0,0,0,0.9)",
              padding: "1rem",
              cursor: "zoom-out",
            }}
          >
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={fullscreenImage}
              alt="Fullscreen"
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
                borderRadius: "8px",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
