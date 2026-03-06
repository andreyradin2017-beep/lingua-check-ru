import React, { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@db/db";
import { useNavigate } from "react-router-dom";
import { Shuffle } from "lucide-react";
import type { Item } from "@types";
import { CategorySelector, type Category } from "@components/CategorySelector";
import { PageHeader } from "@components/PageHeader";
import { vibrate } from "@utils/haptics";
import { GridCard } from "@components/GridCard";
import { motion, AnimatePresence } from "framer-motion";

export const Random: React.FC = () => {
  const navigate = useNavigate();
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<Item | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category>("movie");
  const [displayItem, setDisplayItem] = useState<Item | null>(null);

  const plannedItems = useLiveQuery(() =>
    db.items.where({ status: "planned" }).toArray(),
  );

  const filteredItems = useMemo(() => {
    if (!plannedItems) return [];
    return plannedItems.filter((item) => item.type === activeCategory);
  }, [plannedItems, activeCategory]);

  const handleSpin = () => {
    if (filteredItems.length === 0) return;
    if (filteredItems.length === 1) {
      setResult(filteredItems[0]);
      return;
    }

    setIsSpinning(true);
    setResult(null);
    setDisplayItem(null);

    let speed = 250; // Slower start speed (was 100)
    let totalTime = 0;
    const maxTime = 1200; // Much shorter duration (was 3000)

    const spin = () => {
      // Pick random item for display effect
      const randomIndex = Math.floor(Math.random() * filteredItems.length);
      setDisplayItem(filteredItems[randomIndex]);

      // Slow down logic
      totalTime += speed;
      if (totalTime < maxTime) {
        // Constant speed phase
        speed = 250;
        setTimeout(spin, speed);
      } else if (speed < 700) {
        // Deceleration phase - faster ramp up to stop
        speed *= 1.3;
        setTimeout(spin, speed);
      } else {
        // Final stop
        const finalIndex = Math.floor(Math.random() * filteredItems.length);
        const winner = filteredItems[finalIndex];
        setDisplayItem(winner);
        setResult(winner);
        setIsSpinning(false);
        vibrate("heavy");
      }

      // Light vibration on every tick (if supported/desired)
      if (totalTime % 200 === 0) vibrate("light");
    };

    spin();
  };

  if (!plannedItems)
    return (
      <div style={{ textAlign: "center", padding: "4rem" }}>Загрузка...</div>
    );

  const currentDisplay = result || displayItem;

  return (
    <div style={{ paddingBottom: "2rem" }}>
      <PageHeader title="Мне повезёт!" showBack />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minHeight: "60vh",
          justifyContent: "center",
        }}
      >
        <CategorySelector
          activeCategory={activeCategory}
          onCategoryChange={(cat) => {
            setActiveCategory(cat);
            setResult(null);
            setDisplayItem(null);
          }}
          style={{ marginBottom: "2.5rem", width: "100%" }}
        />

        <p
          style={{
            color: "var(--text-secondary)",
            marginBottom: "2rem",
            fontSize: "1rem",
          }}
        >
          Доступно вариантов:{" "}
          <b style={{ color: "var(--text-primary)" }}>{filteredItems.length}</b>
        </p>

        {/* Result Display Workspace */}
        <div
          style={{
            width: "100%",
            maxWidth: "400px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: "3rem",
            height: "420px", // Fixed height to prevent layout jumps
            justifyContent: "center",
          }}
        >
          {currentDisplay ? (
            <div
              style={{
                width: "100%",
                maxWidth: "280px", // Reduced max-width to match GridCard typical size
                position: "relative",
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentDisplay.id}
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.05, filter: "blur(4px)" }}
                  transition={{ duration: 0.3 }}
                >
                  <GridCard
                    item={currentDisplay}
                    onClick={() => result && navigate(`/item/${result.id}`)}
                    enableMotion={false}
                  />
                </motion.div>
              </AnimatePresence>

              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  style={{
                    marginTop: "1rem",
                    textAlign: "center",
                    color: "var(--primary)",
                    fontWeight: 700,
                    fontSize: "1.2rem",
                    textShadow: "0 0 20px rgba(139, 92, 246, 0.5)",
                  }}
                >
                  Победитель!
                </motion.div>
              )}
            </div>
          ) : (
            <div
              style={{
                width: "240px",
                height: "360px", // Increased to match typical card aspect ratio
                background: "rgba(255,255,255,0.02)",
                borderRadius: "var(--radius-lg)",
                border: "1px dashed rgba(255,255,255,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-tertiary)",
                textAlign: "center",
                padding: "2rem",
              }}
            >
              Нажми кнопку ниже, чтобы выбрать случайный вариант из планов
            </div>
          )}
        </div>

        <button
          disabled={filteredItems.length === 0 || isSpinning}
          onClick={handleSpin}
          style={{
            background: isSpinning
              ? "var(--text-secondary)"
              : "var(--primary-gradient)",
            color: "white",
            border: "none",
            borderRadius: "var(--radius-full)",
            padding: "1rem 2.5rem",
            fontSize: "1.1rem",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            cursor:
              filteredItems.length === 0 || isSpinning
                ? "not-allowed"
                : "pointer",
            opacity: filteredItems.length === 0 ? 0.5 : 1,
            boxShadow: isSpinning ? "none" : "var(--shadow-glow)",
            transform: isSpinning ? "scale(0.95)" : "scale(1)",
            transition: "all 0.2s ease",
          }}
        >
          <Shuffle size={24} className={isSpinning ? "spin-reverse" : ""} />
          {isSpinning ? "Выбираю..." : result ? "Еще раз!" : "Крутить!"}
        </button>

        {filteredItems.length === 0 && (
          <p
            style={{
              marginTop: "1.5rem",
              color: "var(--error)",
              fontSize: "0.9rem",
            }}
          >
            В этой категории нет запланированных элементов.
          </p>
        )}
      </div>

      <style>{`
                @keyframes spin-reverse {
                    from { transform: rotate(360deg); }
                    to { transform: rotate(0deg); }
                }
                .spin-reverse {
                    animation: spin-reverse 1s linear infinite;
                }
            `}</style>
    </div>
  );
};
