import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Database, Merge, RefreshCw } from "lucide-react";

interface MigrationModalProps {
  isOpen: boolean;
  onMerge: () => void;
  onReplace: () => void;
  onClose: () => void;
}

export const MigrationModal: React.FC<MigrationModalProps> = ({
  isOpen,
  onMerge,
  onReplace,
  onClose,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.75)",
              backdropFilter: "blur(4px)",
              zIndex: 100,
            }}
          />
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 101,
              padding: "1rem",
              pointerEvents: "none",
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              style={{
                width: "100%",
                maxWidth: "400px",
                background: "var(--bg-surface)",
                borderRadius: "24px",
                border: "1px solid rgba(255,255,255,0.1)",
                padding: "1.5rem",
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
                pointerEvents: "auto",
              }}
            >
              <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "16px",
                    background: "rgba(139, 92, 246, 0.1)",
                    color: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 1rem",
                  }}
                >
                  <Database size={32} />
                </div>
                <h2
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 800,
                    margin: "0 0 0.5rem 0",
                  }}
                >
                  Найдена локальная библиотека
                </h2>
                <p
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "0.9rem",
                    lineHeight: 1.5,
                  }}
                >
                  У вас есть записи, созданные без входа в аккаунт. Что вы
                  хотите с ними сделать?
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <button
                  onClick={onMerge}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    padding: "1rem",
                    background: "rgba(139, 92, 246, 0.1)",
                    border: "1px solid rgba(139, 92, 246, 0.2)",
                    borderRadius: "16px",
                    color: "white",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <Merge size={20} color="var(--primary)" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                      Объединить
                    </div>
                    <div style={{ fontSize: "0.75rem", opacity: 0.7 }}>
                      Добавить локальные данные в ваш аккаунт
                    </div>
                  </div>
                </button>

                <button
                  onClick={onReplace}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    padding: "1rem",
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                    borderRadius: "16px",
                    color: "white",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <RefreshCw size={20} color="var(--text-secondary)" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                      Перезаписать
                    </div>
                    <div style={{ fontSize: "0.75rem", opacity: 0.7 }}>
                      Очистить локальные данные и загрузить из облака
                    </div>
                  </div>
                </button>
              </div>

              <button
                onClick={onClose}
                style={{
                  width: "100%",
                  marginTop: "1.25rem",
                  padding: "0.75rem",
                  background: "transparent",
                  border: "none",
                  color: "var(--text-tertiary)",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Решить позже
              </button>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
