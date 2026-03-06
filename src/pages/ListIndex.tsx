import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@db/db";
import { PageHeader } from "@components/PageHeader";
import { EmptyState } from "@components/EmptyState";
import { InputDialog } from "@components/Dialogs";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, List, ChevronRight, Archive, Trash2 } from "lucide-react";
import { triggerAutoSync } from "@services/dbSync";
import { vibrate } from "@utils/haptics";
import { useToast } from "@context/ToastContext";

export const ListIndex: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const lists = useLiveQuery(() => db.lists.toArray(), []);

  const handleAddList = async (name: string) => {
    if (!name.trim()) return;
    await db.lists.add({ name: name.trim(), createdAt: new Date() });
    triggerAutoSync();
    setIsAddDialogOpen(false);
    showToast(`Список «${name}» создан`, "success");
  };

  const handleDeleteList = async (id: number, name: string) => {
    if (window.confirm(`Удалить список «${name}»? Элементы останутся в библиотеке.`)) {
      await db.items.where("listId").equals(id).modify({ listId: undefined, updatedAt: new Date() });
      await db.lists.delete(id);
      triggerAutoSync();
      showToast("Список удалён", "info");
    }
  };

  const itemCounts = useLiveQuery(async () => {
    if (!lists) return {};
    const counts: Record<number, number> = {};
    for (const list of lists) {
      if (list.id) {
        counts[list.id] = await db.items.where("listId").equals(list.id).count();
      }
    }
    return counts;
  }, [lists]);

  return (
    <div style={{ paddingBottom: "6rem" }}>
      <PageHeader
        title="Мои списки"
        showBack={true}
        rightElement={
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              vibrate("light");
              setIsAddDialogOpen(true);
            }}
            className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary hover:bg-primary/30 transition-colors"
            aria-label="Создать список"
          >
            <Plus size={18} />
          </motion.button>
        }
      />

      <InputDialog
        isOpen={isAddDialogOpen}
        title="Новый список"
        placeholder="Название списка..."
        onConfirm={handleAddList}
        onCancel={() => setIsAddDialogOpen(false)}
      />

      {/* Archive link */}
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate("/archive")}
        className="mx-0 mb-4 flex items-center gap-3 p-4 bg-white/5 border border-white/8 rounded-2xl cursor-pointer"
      >
        <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400">
          <Archive size={18} />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-white m-0">Архив</h3>
          <p className="text-xs text-zinc-500 m-0">Скрытые элементы</p>
        </div>
        <ChevronRight size={16} className="text-zinc-600" />
      </motion.div>

      <div className="flex flex-col gap-2">
        {!lists ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : lists.length === 0 ? (
          <EmptyState
            message="У вас пока нет списков"
            icon={<List size={32} style={{ opacity: 0.4 }} />}
            action={{
              label: "Создать список",
              onClick: () => setIsAddDialogOpen(true),
            }}
          />
        ) : (
          <AnimatePresence>
            {lists.map((list, idx) => (
              <motion.div
                key={list.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-3 p-4 bg-white/5 border border-white/8 rounded-2xl group cursor-pointer"
                onClick={() => navigate(`/list/${list.id}`)}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <List size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white m-0 truncate">{list.name}</h3>
                  <p className="text-xs text-zinc-500 m-0">
                    {itemCounts?.[list.id!] ?? 0} элементов
                  </p>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      vibrate("medium");
                      handleDeleteList(list.id!, list.name);
                    }}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-600 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    <Trash2 size={14} />
                  </motion.button>
                </div>
                <ChevronRight size={16} className="text-zinc-600 shrink-0" />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
