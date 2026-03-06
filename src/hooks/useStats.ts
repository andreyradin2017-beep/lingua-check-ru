import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";

export function useCategoryStats() {
  return useLiveQuery(async () => {
    const all = await db.items.toArray();
    const unarchived = all.filter(
      (i) => (i as any).isArchived !== true && (i as any).isArchived !== 1,
    );

    return {
      planned: unarchived.filter((i) => i.status === "planned").length,
      inProgress: unarchived.filter((i) => i.status === "in_progress").length,
      completed: unarchived.filter((i) => i.status === "completed").length,
    };
  });
}

export function useUserStats() {
  return useLiveQuery(async () => {
    const all = await db.items.toArray();
    const unarchived = all.filter(
      (i) => (i as any).isArchived !== true && (i as any).isArchived !== 1,
    );

    const movies = unarchived.filter(
      (i) => i.type === "movie" || i.type === "show",
    );
    const books = unarchived.filter((i) => i.type === "book");
    const games = unarchived.filter((i) => i.type === "game");

    const completed = unarchived.filter((i) => i.status === "completed");

    // Genres aggregation
    const genreMap: Record<string, number> = {};
    unarchived.forEach((item) => {
      item.tags?.forEach((tag) => {
        genreMap[tag] = (genreMap[tag] || 0) + 1;
      });
    });

    const topGenres = Object.entries(genreMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Get streak from localStorage (synchronous)
    const streakData = localStorage.getItem("trakerevo_streaks");
    const streak = streakData ? JSON.parse(streakData).currentStreak : 0;

    return {
      moviesWatched: completed.filter(
        (i) => i.type === "movie" || i.type === "show",
      ).length,
      booksRead: completed.filter((i) => i.type === "book").length,
      gamesPlayed: completed.filter((i) => i.type === "game").length,
      totalCompleted: completed.length,
      streak,
      // Additional for charts
      totalMovies: movies.length,
      totalBooks: books.length,
      totalGames: games.length,
      totalItems: unarchived.length,
      // Enhanced Metrics
      topGenres,
      completionRate: {
        movies: movies.length
          ? (completed.filter((i) => i.type === "movie" || i.type === "show")
              .length /
              movies.length) *
            100
          : 0,
        games: games.length
          ? (completed.filter((i) => i.type === "game").length / games.length) *
            100
          : 0,
        books: books.length
          ? (completed.filter((i) => i.type === "book").length / books.length) *
            100
          : 0,
      },
    };
  });
}
