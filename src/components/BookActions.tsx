import React from "react";
import { motion } from "framer-motion";
import { BookOpen, Headphones } from "lucide-react";
import { BentoTile } from "./BentoTile";

interface BookActionsProps {
  source: string;
  externalId: string;
  title: string;
  delay?: number;
}

export const BookActions: React.FC<BookActionsProps> = ({
  source,
  externalId,
  title,
  delay = 0,
}) => {
  const isLitres = source === "litres";
  const isBookmate = source === "bookmate";
  const isBook = isLitres || isBookmate || source === "google_books";

  // Smart Yandex Books URL:
  // - If the item IS from Bookmate → direct link to the book
  // - Otherwise → search by title (much more useful than generic /search)
  const yandexBooksUrl = isBookmate && externalId
    ? `https://books.yandex.ru/books/${externalId}`
    : `https://books.yandex.ru/search/all/${encodeURIComponent(title)}`;

  // LitRes URL:
  // - If the item IS from LitRes → direct page
  // - Otherwise → search by title
  const litresUrl = isLitres && externalId
    ? `https://www.litres.ru/arts/${externalId}/`
    : `https://www.litres.ru/search/?q=${encodeURIComponent(title)}`;

  if (!isBook) return null;

  return (
    <BentoTile colSpan={2} delay={delay}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", padding: "0.25rem" }}>

        {/* LitRes — show for litres source and as a general option */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => window.open(litresUrl, "_blank")}
          style={{
            flex: 1,
            minWidth: "150px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            padding: "0.85rem",
            borderRadius: "12px",
            background: isLitres
              ? "linear-gradient(135deg, #FB6107 0%, #FF8C42 100%)"
              : "rgba(251, 97, 7, 0.12)",
            color: isLitres ? "white" : "#FF8C42",
            border: isLitres ? "none" : "1px solid rgba(251, 97, 7, 0.3)",
            fontWeight: 700,
            fontSize: "0.85rem",
            cursor: "pointer",
          }}
        >
          <Headphones size={18} />
          {isLitres ? "Читать в ЛитРес" : "Найти в ЛитРес"}
        </motion.button>

        {/* Yandex Books — always shown for book items */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => window.open(yandexBooksUrl, "_blank")}
          style={{
            flex: 1,
            minWidth: "150px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            padding: "0.85rem",
            borderRadius: "12px",
            background: isBookmate
              ? "linear-gradient(135deg, #FC3F1D 0%, #FF6B4A 100%)"
              : "rgba(252, 63, 29, 0.1)",
            color: isBookmate ? "white" : "#FC3F1D",
            border: isBookmate ? "none" : "1px solid rgba(252, 63, 29, 0.3)",
            fontWeight: 700,
            fontSize: "0.85rem",
            cursor: "pointer",
          }}
        >
          <BookOpen size={18} />
          {isBookmate ? "Читать в Яндекс Книгах" : "Найти в Яндекс Книгах"}
        </motion.button>

      </div>
    </BentoTile>
  );
};
