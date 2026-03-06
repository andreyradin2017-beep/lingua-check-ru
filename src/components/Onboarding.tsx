import React from "react";
import { motion } from "framer-motion";
import { Search, Film, Gamepad2, BookOpen } from "lucide-react";

interface OnboardingProps {
  onStart: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onStart }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1rem",
        textAlign: "center",
        minHeight: "60vh",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ marginBottom: "2rem" }}
      >
        <div
          style={{
            fontSize: "3rem",
            fontWeight: 900,
            background: "var(--primary-gradient)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: "0.5rem",
            letterSpacing: "-1px",
          }}
        >
          TrakerEvo
        </div>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "1.1rem",
            maxWidth: "300px",
            margin: "0 auto",
          }}
        >
          Твой персональный трекер развлечений.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "1rem",
          marginBottom: "3rem",
          width: "100%",
          maxWidth: "320px",
        }}
      >
        {[
          {
            icon: <Film size={24} />,
            label: "Кино",
            color: "var(--brand-tmdb)",
          },
          {
            icon: <Gamepad2 size={24} />,
            label: "Игры",
            color: "var(--brand-rawg)",
          },
          {
            icon: <BookOpen size={24} />,
            label: "Книги",
            color: "var(--brand-google-books)",
          },
        ].map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.5rem",
              padding: "1rem 0.5rem",
              background: "rgba(255,255,255,0.03)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div style={{ color: item.color }}>{item.icon}</div>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--text-secondary)",
              }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        style={{ width: "100%", maxWidth: "280px" }}
      >
        <button
          onClick={onStart}
          style={{
            width: "100%",
            padding: "1rem",
            background: "var(--primary-gradient)",
            color: "white",
            border: "none",
            borderRadius: "var(--radius-full)",
            fontSize: "1rem",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.75rem",
            boxShadow: "var(--shadow-glow)",
            marginBottom: "1rem",
          }}
        >
          <Search size={20} />
          Найти первое
        </button>
        <p style={{ fontSize: "0.8rem", color: "var(--text-tertiary)" }}>
          Начни с поиска любимого фильма или игры
        </p>
      </motion.div>
    </div>
  );
};
