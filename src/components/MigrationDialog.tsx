import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Merge, RefreshCw, AlertTriangle } from "lucide-react";

interface MigrationDialogProps {
  isOpen: boolean;
  itemCount: number;
  onMerge: () => void;
  onReplace: () => void;
  loading?: boolean;
}

export const MigrationDialog: React.FC<MigrationDialogProps> = ({
  isOpen,
  itemCount,
  onMerge,
  onReplace,
  loading = false,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.8)",
              backdropFilter: "blur(8px)",
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
                maxWidth: "420px",
                background: "var(--bg-card)",
                borderRadius: "var(--radius-xl)",
                border: "1px solid rgba(255,255,255,0.1)",
                padding: "1.5rem",
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.7)",
                pointerEvents: "auto",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  background: "rgba(139, 92, 246, 0.1)",
                  borderRadius: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1.25rem",
                  color: "var(--primary)",
                }}
              >
                <Merge size={32} />
              </div>

              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 800,
                  marginBottom: "0.75rem",
                  color: "var(--text-primary)",
                }}
              >
                Найдены локальные данные
              </h2>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "var(--text-secondary)",
                  lineHeight: "1.5",
                  marginBottom: "1.5rem",
                }}
              >
                У вас есть <strong>{itemCount} эл.</strong>, добавленных в
                режиме гостя. Как вы хотите поступить при входе в аккаунт?
              </p>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                {/* MERGE BUTTON */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onMerge}
                  disabled={loading}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    padding: "1rem",
                    background: "rgba(139, 92, 246, 0.1)",
                    border: "1px solid rgba(139, 92, 246, 0.3)",
                    borderRadius: "var(--radius-lg)",
                    cursor: loading ? "not-allowed" : "pointer",
                    textAlign: "left",
                  }}
                >
                  <div style={{ color: "var(--primary)" }}>
                    <Merge size={20} />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "0.9rem",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                      }}
                    >
                      Объединить данные
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-tertiary)",
                      }}
                    >
                      Добавить гостевые списки в аккаунт
                    </div>
                  </div>
                </motion.button>

                {/* REPLACE BUTTON */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onReplace}
                  disabled={loading}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    padding: "1rem",
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "var(--radius-lg)",
                    cursor: loading ? "not-allowed" : "pointer",
                    textAlign: "left",
                  }}
                >
                  <div style={{ color: "var(--text-tertiary)" }}>
                    <RefreshCw size={20} />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "0.9rem",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                      }}
                    >
                      Использовать облако
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-tertiary)",
                      }}
                    >
                      Удалить локальные данные и скачать из аккаунта
                    </div>
                  </div>
                </motion.button>
              </div>

              <div
                style={{
                  marginTop: "1.5rem",
                  padding: "0.75rem",
                  background: "rgba(245, 158, 11, 0.05)",
                  borderRadius: "10px",
                  display: "flex",
                  gap: "0.75rem",
                  alignItems: "flex-start",
                  textAlign: "left",
                }}
              >
                <AlertTriangle
                  size={16}
                  style={{ color: "#f59e0b", flexShrink: 0, marginTop: "2px" }}
                />
                <p style={{ margin: 0, fontSize: "0.7rem", color: "#f59e0b" }}>
                  В режиме объединения дубликаты будут удалены автоматически на
                  основе ID фильмов и книг.
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
