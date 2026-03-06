import React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@db/db";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "@components/PageHeader";
import { CategorySelector } from "@components/CategorySelector";
import { DetailedListItem } from "@components/DetailedListItem";
import { Swipeable } from "@components/Swipeable";
import { triggerAutoSync } from "@services/dbSync";

export const Archive: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentCategory = (searchParams.get("category") as "movie" | "game" | "book") || "movie";

  const archivedItems = useLiveQuery(async () => {
    const all = await db.items.toArray();
    return all
      .filter((i) => {
        const isArchived = (i as any).isArchived === true || (i as any).isArchived === 1;
        if (!isArchived) return false;
        
        // Filter by category type
        if (currentCategory === "movie") return i.type === "movie" || i.type === "show";
        return i.type === currentCategory;
      })
      .sort((a, b) => (b.id || 0) - (a.id || 0));
  }, [currentCategory]);

  const handleUnarchive = async (id: number) => {
    await db.items.update(id, { isArchived: false, updatedAt: new Date() });
    triggerAutoSync();
  };

  const handleDelete = async (id: number) => {
    await db.items.delete(id);
    triggerAutoSync();
  };

  return (
    <div style={{ paddingBottom: "6rem" }}>
      <PageHeader title="Архив" showBack />

      <div className="mt-4">
        <CategorySelector
          style={{ marginLeft: "-4px" }}
          activeCategory={currentCategory}
          onCategoryChange={(cat) => {
            searchParams.set("category", cat);
            setSearchParams(searchParams);
          }}
        />
      </div>

      <div style={{ marginTop: "1rem" }}>
        {!archivedItems ? (
          <div style={{ textAlign: "center", color: "var(--text-secondary)" }}>
            Загрузка...
          </div>
        ) : archivedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <img src="/camera.png" alt="Empty Archive" className="w-48 h-48 object-contain mb-4 drop-shadow-[0_0_30px_rgba(239,68,68,0.2)]" />
            <p className="text-zinc-500 font-medium">В архиве пока ничего нет.</p>
          </div>
        ) : (
          <div className="flex flex-col w-full gap-1">
            {archivedItems.map((item) => (
              <Swipeable
                key={item.id}
                onDelete={() => handleDelete(item.id!)}
                onArchive={() => handleUnarchive(item.id!)}
              >
                <DetailedListItem
                  item={item}
                  onClick={() => navigate(`/item/${item.id}`)}
                  style={{
                    backgroundColor: "var(--bg-surface)",
                    borderRadius: "8px",
                    padding: "0.6rem 0.75rem",
                  }}
                />
              </Swipeable>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

