import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { searchAll } from "../services/api";
import type { Item } from "../types";
import { getProxiedImageUrl } from "../utils/images";

interface AuthorBooksRowProps {
  authorName: string;
  onBookClick: (item: Item) => void;
}

export const AuthorBooksRow: React.FC<AuthorBooksRowProps> = ({
  authorName,
  onBookClick,
}) => {
  const [books, setBooks] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchBooks = async () => {
      setLoading(true);
      try {
        const results = await searchAll(authorName, {
          includeBooks: true,
        });

        if (active) {
          // Filter to make sure we show actual books by this author
          // We limit to top 8 visually distinct results
          const validBooks = results
            .filter((r) => r.type === "book" && r.image)
            .slice(0, 8);
          setBooks(validBooks);
        }
      } catch (err) {
        console.error("Failed to fetch author books", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchBooks();
    return () => {
      active = false;
    };
  }, [authorName]);

  if (loading) return null; // Can add a skeleton here later
  if (!books || books.length === 0) return null;

  return (
    <div style={{ margin: "var(--space-md) 0" }}>
      <h3
        style={{
          fontSize: "1rem",
          fontWeight: 700,
          marginBottom: "0.75rem",
          color: "var(--text-primary)",
        }}
      >
        Другие книги автора
      </h3>
      <div
        className="hide-scrollbar"
        style={{
          display: "flex",
          overflowX: "auto",
          gap: "1rem",
          paddingBottom: "1rem",
          margin: "0 -1rem",
          padding: "0 1rem 1rem 1rem",
          scrollbarWidth: "none",
        }}
      >
        {books.map((book, idx) => (
          <motion.div
            key={idx}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onBookClick(book)}
            style={{
              flexShrink: 0,
              width: "120px",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: "120px",
                height: "170px",
                borderRadius: "8px",
                overflow: "hidden",
                background: "var(--surface-hover)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                marginBottom: "0.5rem",
              }}
            >
              <img
                src={getProxiedImageUrl(book.image)}
                alt={book.title}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
                loading="lazy"
              />
            </div>
            <div
              style={{
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "var(--text-primary)",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
              title={book.title}
            >
              {book.title}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
