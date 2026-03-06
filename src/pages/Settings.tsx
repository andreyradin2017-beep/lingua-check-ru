import React, { useState, useRef } from "react";
import { db } from "@db/db";
import { PageHeader } from "@components/PageHeader";
import {
  Database,
  Info,
  Download,
  Upload,
  Loader,
  User,
  LogOut,
  Check,
  BarChart3,
} from "lucide-react";
import { motion } from "framer-motion";

import { useAuth } from "@context/AuthContext";
import { LoginModal } from "@components/LoginModal";
import { syncAll } from "@services/dbSync";
import { useToast } from "@context/ToastContext";
import { ConfirmDialog } from "@components/Dialogs";
import { SearchProviderSettings } from "@components/SearchProviderSettings";
import { useUserStats } from "@hooks/useStats";
import { StatsBarChart } from "@components/StatsBarChart";
import { Section } from "@components/Section";

export const Settings: React.FC = () => {
  const { user, signOut } = useAuth();
  const { showToast } = useToast();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const userStats = useUserStats();

  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dialog States
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = {
        items: await db.items.toArray(),
        lists: await db.lists.toArray(),
        settings: await db.settings.toArray(),
        exportDate: new Date().toISOString(),
        version: 6,
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `trakerevo_backup_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("Экспорт завершен успешно", "success");
    } catch (error) {
      console.error("Export failed:", error);
      showToast("Ошибка при экспорте данных", "error");
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (fileInputRef.current) fileInputRef.current.value = "";

    const text = await file.text();
    let data: any;
    try {
      data = JSON.parse(text);
      if (!data.items || !data.lists) {
        throw new Error("Неверный формат файла");
      }
    } catch (err) {
      showToast("Неверный файл бэкапа", "error");
      return;
    }

    setConfirmState({
      isOpen: true,
      title: "Импорт данных",
      message: `Это действие перезапишет текущие данные (${data.items.length} элементов и ${data.lists.length} списков). Продолжить?`,
      onConfirm: async () => {
        setImporting(true);
        try {
          await Promise.all([
            db.items.clear(),
            db.lists.clear(),
            db.settings.clear(),
          ]);

          if (data.items.length > 0) await db.items.bulkAdd(data.items);
          if (data.lists.length > 0) await db.lists.bulkAdd(data.lists);
          if (data.settings && data.settings.length > 0)
            await db.settings.bulkAdd(data.settings);

          showToast("Данные успешно импортированы!", "success");
          setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
          console.error("Import failed:", error);
          showToast("Ошибка при импорте базы данных", "error");
        } finally {
          setImporting(false);
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const clearDatabase = async (mode: "local" | "full") => {
    if (mode === "full") {
      setConfirmState({
        isOpen: true,
        title: "⚠️ ПОЛНОЕ УДАЛЕНИЕ",
        message:
          "Это удалит ВСЕ данные из локальной базы И ИЗ ОБЛАКА (Supabase). Восстановление будет невозможно! Вы уверены?",
        onConfirm: async () => {
          try {
            // Mark all items for deletion in Supabase
            if (user) {
              const items = await db.items.toArray();
              const lists = await db.lists.toArray();

              const deletions: any[] = [];

              items.forEach((item) => {
                if (item.supabaseId) {
                  deletions.push({
                    id: item.supabaseId,
                    table: "items",
                    timestamp: Date.now(),
                  });
                }
              });

              lists.forEach((list) => {
                if (list.supabaseId) {
                  deletions.push({
                    id: list.supabaseId,
                    table: "lists",
                    timestamp: Date.now(),
                  });
                }
              });

              if (deletions.length > 0) {
                await db.deleted_metadata.bulkPut(deletions);
              }
            }

            // Close Dexie connection
            await db.close();

            // Delete IndexedDB
            await new Promise<void>((resolve, reject) => {
              const request = window.indexedDB.deleteDatabase("TrakerEvoDB");
              request.onsuccess = () => resolve();
              request.onerror = () => reject(request.error);
              request.onblocked = () => resolve();
            });

            // Sync deletions to Supabase
            if (user) {
              showToast("Удаление из облака...", "info");
              await syncAll();
            }

            showToast("Все данные удалены", "success");
            setTimeout(() => window.location.reload(), 500);
          } catch (error) {
            console.error("Full delete error:", error);
            showToast("Ошибка: " + (error as Error).message, "error");
          }
        },
      });
    } else {
      // Local only
      setConfirmState({
        isOpen: true,
        title: "Очистка локальных данных",
        message:
          "Это удалит только локальную базу. Данные в облаке (Supabase) сохранятся и загрузятся при синхронизации.",
        onConfirm: async () => {
          try {
            await db.close();
            await new Promise<void>((resolve, reject) => {
              const request = window.indexedDB.deleteDatabase("TrakerEvoDB");
              request.onsuccess = () => resolve();
              request.onerror = () => reject(request.error);
              request.onblocked = () => resolve();
            });
            showToast("Локальная база очищена", "success");
            setTimeout(() => window.location.reload(), 500);
          } catch (error) {
            console.error("Local delete error:", error);
            showToast("Ошибка: " + (error as Error).message, "error");
          }
        },
      });
    }
  };

  return (
    <div className="settings-container px-4">
      <PageHeader title="Профиль" showBack={true} />
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
      />

      <div className="settings-stack">
        {/* Profile Card Section */}
        <div className="profile-card">
          <div className="profile-glow" />
          
          <div className="flex items-center gap-5 relative z-10 mb-6">
            <div className="avatar-initial">
              {user ? user.email?.charAt(0).toUpperCase() : <User size={32} />}
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-extrabold m-0 tracking-tight">
                {user ? user.email?.split("@")[0] : "Гость"}
              </h2>
              {user && (
                <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold text-[var(--success)] opacity-80 uppercase tracking-wider">
                  <Check size={10} strokeWidth={3} /> Синхронизация ВКЛ
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 relative z-10 mt-6">
            {!user ? (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsLoginOpen(true)}
                className="btn btn-primary flex-1 h-11 text-sm font-bold"
              >
                Войти в аккаунт
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={signOut}
                className="btn btn-secondary flex-1 h-11 text-sm font-bold opacity-60 hover:opacity-100"
              >
                <LogOut size={16} /> Выйти
              </motion.button>
            )}
          </div>
        </div>

        {/* Account Sync Button (Only if logged in) */}
        {user && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={async () => {
              const btn = document.getElementById("sync-btn");
              if (btn) btn.innerText = "Синхронизация...";

              const result = await syncAll();

              if (btn) btn.innerText = "Синхронизировать сейчас";

              if (result.success) {
                showToast("Синхронизация завершена", "success");
              } else {
                showToast("Ошибка синхронизации", "error");
                console.error(result.errors);
              }
            }}
            id="sync-btn"
            style={{
              width: "100%",
              padding: "0.75rem",
              background: "rgba(56, 189, 248, 0.1)",
              border: "1px solid rgba(56, 189, 248, 0.2)",
              borderRadius: "var(--radius-lg)",
              color: "#38bdf8",
              fontWeight: 600,
              fontSize: "0.9rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            <Database size={16} /> Синхронизировать сейчас
          </motion.button>
        )}

        {/* Favorite Genres Section */}
        {userStats && userStats.topGenres.length > 0 && (
          <Section
            title="ЛЮБИМЫЕ ЖАНРЫ"
            icon={<BarChart3 size={14} />}
            collapsible={true}
            defaultCollapsed={true}
            style={{ marginBottom: "0.25rem" }}
          >
            <StatsBarChart
              data={userStats.topGenres}
              maxCount={userStats.topGenres[0]?.count || 1}
            />
          </Section>
        )}



        {/* Search Provider Settings */}
        <SearchProviderSettings
          showToast={showToast}
          setConfirmState={setConfirmState}
        />

        {/* Database Actions Section */}
        <Section
          title="УПРАВЛЕНИЕ ДАННЫМИ"
          icon={<Database size={14} />}
          collapsible={true}
          defaultCollapsed={true}
        >
          <div className="action-grid">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleExport}
              disabled={exporting}
              className="btn btn-secondary"
              style={{ flex: 1, height: "48px" }}
            >
              {exporting ? (
                <Loader size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              Экспорт
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="btn btn-secondary"
              style={{ flex: 1, height: "48px" }}
            >
              {importing ? (
                <Loader size={16} className="animate-spin" />
              ) : (
                <Upload size={16} />
              )}
              Импорт
            </motion.button>
          </div>

          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              marginBottom: "0.75rem",
            }}
          >
            <button
              onClick={() => clearDatabase("local")}
              style={{
                flex: 1,
                padding: "0.85rem",
                background: "rgba(239, 68, 68, 0.05)",
                border: "1px solid rgba(239, 68, 68, 0.1)",
                borderRadius: "var(--radius-lg)",
                color: "var(--error)",
                fontWeight: 600,
                fontSize: "0.75rem",
                cursor: "pointer",
                opacity: 0.8,
              }}
            >
              🗑️ Только локально
            </button>
            <button
              onClick={() => clearDatabase("full")}
              style={{
                flex: 1,
                padding: "0.85rem",
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "var(--radius-lg)",
                color: "var(--error)",
                fontWeight: 700,
                fontSize: "0.75rem",
                cursor: "pointer",
              }}
            >
              🔥 Полное удаление
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".json"
            style={{ display: "none" }}
          />
        </Section>

        {/* App Info */}
        <div style={{ textAlign: "center", opacity: 0.5, marginTop: "1rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              marginBottom: "0.5rem",
            }}
          >
            <Info size={14} />
            <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>
              TrakerEvo v1.3.0 Stable (RU Books)
            </span>
          </div>
          <p style={{ fontSize: "0.65rem", margin: 0 }}>
            Сделано на React и Dexie DB
          </p>
        </div>
      </div>
    </div>
  );
};
