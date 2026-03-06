import React from "react";
import { Save, Trash2 } from "lucide-react";
import { BentoTile } from "./BentoTile";
import type { List } from "@types";

interface ItemNotesAndListProps {
  notes: string;
  setNotes: (val: string) => void;
  selectedListId?: number;
  setSelectedListId: (val?: number) => void;
  lists?: List[];
  onSave: () => void;
  onDelete: () => void;
}

export const ItemNotesAndList: React.FC<ItemNotesAndListProps> = ({
  notes,
  setNotes,
  selectedListId,
  setSelectedListId,
  lists,
  onSave,
  onDelete,
}) => {
  const isLargeScreen = window.innerWidth > 600;

  return (
    <>
      <BentoTile
        colSpan={isLargeScreen ? 1 : 2}
        delay={0.3}
        style={{ gap: "0.5rem" }}
      >
        <label className="section-label">Заметки</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          style={{
            width: "100%",
            padding: "0.75rem",
            borderRadius: "var(--radius-md)",
            backgroundColor: "rgba(0,0,0,0.2)",
            color: "var(--text-primary)",
            border: "1px solid rgba(255,255,255,0.05)",
            resize: "none",
            fontSize: "0.9rem",
            outline: "none",
            flex: 1,
          }}
          placeholder="О чем этот тайтл? Или ваши мысли..."
        />
      </BentoTile>

      <BentoTile colSpan={isLargeScreen ? 1 : 2} delay={0.4}>
        <label className="section-label" style={{ marginBottom: "0.75rem" }}>
          Настройка
        </label>
        <div className="flex-column" style={{ height: "100%", gap: "1rem" }}>
          <div>
            <span
              style={{
                fontSize: "0.7rem",
                color: "var(--text-tertiary)",
                marginBottom: "0.25rem",
                display: "block",
              }}
            >
              Список
            </span>
            <select
              value={selectedListId || ""}
              onChange={(e) =>
                setSelectedListId(
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
              style={{
                width: "100%",
                height: "50px",
                padding: "0 2.5rem 0 1rem",
                borderRadius: "var(--radius-lg)",
                backgroundColor: "rgba(0,0,0,0.2)",
                color: "var(--text-primary)",
                border: "1px solid rgba(255,255,255,0.05)",
                fontSize: "0.95rem",
                fontWeight: 600,
                outline: "none",
                appearance: "none",
                cursor: "pointer",
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 0.75rem center",
                backgroundSize: "1.25rem",
              }}
            >
              <option value="">Без списка</option>
              {lists?.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </select>
          </div>

          <div
            className="flex-center"
            style={{ gap: "0.5rem", marginTop: "auto" }}
          >
            <button
              onClick={onSave}
              className="btn btn-primary"
              style={{ flex: 1, height: "50px" }}
            >
              <Save size={18} /> Сохранить
            </button>
            <button
              onClick={onDelete}
              className="btn-icon"
              style={{
                height: "50px",
                width: "50px",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                color: "var(--error)",
              }}
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      </BentoTile>
    </>
  );
};
