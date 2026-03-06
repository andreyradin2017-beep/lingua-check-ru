import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@db/db";
import {
  Trash2,
  Edit2,
  Save,
  X,
  CheckSquare,
  Square,
  Archive as ArchiveIcon,
  CheckCircle2,
  List as ListIcon,
} from "lucide-react";
import { Skeleton } from "@components/Skeleton";
import { SkeletonList } from "@components/SkeletonList";
import { EmptyState } from "@components/EmptyState";
import { PageHeader } from "@components/PageHeader";
import { DetailedListItem } from "@components/DetailedListItem";
import { Swipeable } from "@components/Swipeable";
import type { Item } from "@types";
import { motion, AnimatePresence } from "framer-motion";
import { triggerAutoSync } from "@services/dbSync";
import { FilterToolbar } from "@components/FilterToolbar";
import { type StatusFilterType } from "@components/StatusFilter";
import { type SortOption } from "@components/SortSelector";

export const ListPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const listId = Number(id);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("dateAdded");
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("all");

  const data = useLiveQuery(async () => {
    if (!listId) return null;
    const list = await db.lists.get(listId);
    const items = await db.items.where("listId").equals(listId).toArray();

    // Sort items
    const sortedItems = items.sort((a, b) => {
      switch (sortBy) {
        case "dateAdded":
          return (b.id || 0) - (a.id || 0);
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        case "releaseDate":
          const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
          const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
          return dateB - dateA;
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return { list, items: sortedItems };
  }, [listId, sortBy]);

  const items = data?.items;

  // Filter items by status locally
  const filteredItems = React.useMemo(() => {
    if (!items) return [];
    const baseItems = items.filter((item) => !item.isArchived);
    if (statusFilter === "all") return baseItems;
    return baseItems.filter((item) => item.status === statusFilter);
  }, [items, statusFilter]);

  if (!data?.list) {
    return (
      <div style={{ padding: "1rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "1.5rem",
            gap: "1rem",
          }}
        >
          <Skeleton width={40} height={40} borderRadius="50%" />
          <Skeleton width={200} height={32} />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ marginBottom: "0.5rem" }}>
            <SkeletonList />
          </div>
        ))}
      </div>
    );
  }

  const { list } = data;

  const startEdit = () => {
    setEditName(list.name);
    setIsEditing(true);
  };

  const saveName = async () => {
    if (editName.trim()) {
      await db.lists.update(listId, {
        name: editName,
        updatedAt: new Date(),
      });
      triggerAutoSync();
    }
    setIsEditing(false);
  };

  const deleteList = async () => {
    if (
      window.confirm(
        "Удалить этот список? Элементы останутся, но не будут привязаны к списку.",
      )
    ) {
      await db.items
        .where("listId")
        .equals(listId)
        .modify({ listId: undefined, updatedAt: new Date() });

      if (list.supabaseId) {
        await db.deleted_metadata.put({
          id: list.supabaseId,
          table: "lists",
          timestamp: Date.now(),
        });
      }

      await db.lists.delete(listId);
      triggerAutoSync();
      navigate("/");
    }
  };

  const handleDeleteItem = async (itemId?: number) => {
    if (!itemId) return;
    const item = await db.items.get(itemId);
    if (item?.supabaseId) {
      await db.deleted_metadata.put({
        id: item.supabaseId,
        table: "items",
        timestamp: new Date().getTime(),
      });
    }
    await db.items.delete(itemId);
    triggerAutoSync();
  };

  const handleArchiveItem = async (itemId?: number, isArchived?: boolean) => {
    if (!itemId) return;
    await db.items.update(itemId, {
      isArchived: !isArchived,
      updatedAt: new Date(),
    });
    triggerAutoSync();
  };

  const toggleSelection = (itemId?: number) => {
    if (!itemId) return;
    setSelectedIds((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId],
    );
  };

  const handleMassDelete = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Удалить выбранные элементы (${selectedIds.length})?`)) {
      const selectedItems = await db.items
        .where("id")
        .anyOf(selectedIds)
        .toArray();
      for (const item of selectedItems) {
        if (item.supabaseId) {
          await db.deleted_metadata.put({
            id: item.supabaseId,
            table: "items",
            timestamp: new Date().getTime(),
          });
        }
      }
      await db.items.bulkDelete(selectedIds);
      setSelectedIds([]);
      setSelectionMode(false);
      triggerAutoSync();
    }
  };

  const handleMassArchive = async () => {
    if (selectedIds.length === 0) return;
    // In mass archive, we toggle based on the majority or just set to archived
    await db.items
      .where("id")
      .anyOf(selectedIds)
      .modify({ isArchived: true, updatedAt: new Date() });
    setSelectedIds([]);
    setSelectionMode(false);
    triggerAutoSync();
  };

  return (
    <div style={{ paddingBottom: "5rem" }}>
      <PageHeader
        title={list.name}
        titleClassName="text-gradient"
        showBack={!selectionMode}
        leftElement={
          selectionMode ? (
            <button
              onClick={() => {
                setSelectionMode(false);
                setSelectedIds([]);
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-secondary)",
                fontWeight: 600,
                fontSize: "0.9rem",
              }}
            >
              Отмена
            </button>
          ) : null
        }
        rightElement={
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            {selectionMode ? (
              <div
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: "var(--primary)",
                }}
              >
                Вбрано: {selectedIds.length}
              </div>
            ) : isEditing ? (
              <>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={saveName}
                  className="btn-icon"
                  style={{ color: "var(--primary)" }}
                >
                  <Save size={20} />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsEditing(false)}
                  className="btn-icon"
                >
                  <X size={20} />
                </motion.button>
              </>
            ) : (
              <>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectionMode(true)}
                  className="btn-icon"
                  title="Выбрать несколько"
                >
                  <CheckSquare size={18} />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={startEdit}
                  className="btn-icon"
                >
                  <Edit2 size={18} />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={deleteList}
                  className="btn-icon"
                  style={{ color: "var(--error)" }}
                >
                  <Trash2 size={18} />
                </motion.button>
              </>
            )}
          </div>
        }
      />

      {isEditing && (
        <div style={{ marginBottom: "1.5rem" }}>
          <input
            autoFocus
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Название списка"
            style={{
              width: "100%",
              padding: "0.75rem 1rem",
              borderRadius: "var(--radius-lg)",
              backgroundColor: "var(--bg-surface)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "var(--text-primary)",
              fontSize: "1rem",
              fontWeight: 600,
            }}
          />
        </div>
      )}

      {/* Filter Toolbar - Sticky */}
      {!selectionMode && items && items.length > 0 && (
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            background: "transparent",
            padding: "0.5rem 0",
            margin: "0 -var(--space-md) 1rem -var(--space-md)",
            paddingLeft: "var(--space-md)",
            paddingRight: "var(--space-md)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              backdropFilter: "blur(20px) saturate(160%)",
              background: "rgba(9, 9, 11, 0.8)",
              zIndex: -1,
              borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
              maskImage:
                "linear-gradient(to bottom, black 95%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, black 95%, transparent 100%)",
            }}
          />
          <FilterToolbar
            activeStatus={statusFilter}
            onStatusChange={setStatusFilter}
            activeSort={sortBy}
            onSortChange={setSortBy}
          />
        </div>
      )}

      {/* List Items Container */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {filteredItems && filteredItems.length > 0 ? (
          filteredItems.map((item: Item) => (
            <Swipeable
              key={item.id}
              disabled={selectionMode}
              onDelete={() => handleDeleteItem(item.id)}
              onArchive={() => handleArchiveItem(item.id, item.isArchived)}
            >
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  gap: selectionMode ? "0.75rem" : 0,
                }}
              >
                {selectionMode && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => toggleSelection(item.id)}
                    style={{
                      color: selectedIds.includes(item.id!)
                        ? "var(--primary)"
                        : "var(--text-tertiary)",
                      cursor: "pointer",
                    }}
                  >
                    {selectedIds.includes(item.id!) ? (
                      <CheckCircle2 size={24} />
                    ) : (
                      <Square size={24} />
                    )}
                  </motion.div>
                )}

                <DetailedListItem
                  item={item}
                  onClick={() =>
                    selectionMode
                      ? toggleSelection(item.id)
                      : navigate(`/item/${item.id}`)
                  }
                  style={{
                    flex: 1,
                    backgroundColor: selectedIds.includes(item.id!)
                      ? "rgba(139, 92, 246, 0.1)"
                      : "var(--bg-surface)",
                    borderRadius: "8px",
                    padding: "0.6rem 0.75rem",
                    transition: "background-color 0.2s",
                  }}
                />
              </div>
            </Swipeable>
          ))
        ) : (
          <EmptyState
            message="В этом списке пока пусто."
            icon={<ListIcon size={32} style={{ opacity: 0.5 }} />}
            action={{
              label: "Добавить элемент",
              onClick: () => navigate("/search"),
            }}
          />
        )}
      </div>

      {/* Selection Toolbar */}
      <AnimatePresence>
        {selectionMode && selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            style={{
              position: "fixed",
              bottom: "1.5rem",
              left: "1rem",
              right: "1rem",
              background: "rgba(20, 20, 20, 0.95)",
              backdropFilter: "blur(10px)",
              padding: "1rem 1.5rem",
              borderRadius: "16px",
              display: "flex",
              justifyContent: "space-around",
              alignItems: "center",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              border: "1px solid rgba(255,255,255,0.1)",
              zIndex: 2000,
            }}
          >
            <button
              onClick={handleMassArchive}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-primary)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                fontSize: "0.7rem",
                cursor: "pointer",
              }}
            >
              <ArchiveIcon size={20} /> В архив
            </button>
            <button
              onClick={handleMassDelete}
              style={{
                background: "none",
                border: "none",
                color: "var(--error)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                fontSize: "0.7rem",
                cursor: "pointer",
              }}
            >
              <Trash2 size={20} /> Удалить
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
