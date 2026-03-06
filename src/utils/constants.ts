// Z-Index constants for consistent layering
export const Z_INDEX = {
  BASE: 1,
  OVERLAY: 10,
  MODAL: 100,
  TOAST: 1000,
  MAX: 9999,
} as const;

// Animation durations in milliseconds
export const DURATION = {
  INSTANT: 0,
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  TOAST: 3000,
} as const;

// Cache TTL in milliseconds
export const CACHE = {
  SHORT: 5 * 60 * 1000,      // 5 minutes
  MEDIUM: 60 * 60 * 1000,    // 1 hour
  LONG: 24 * 60 * 60 * 1000, // 24 hours
  VERY_LONG: 30 * 24 * 60 * 60 * 1000, // 30 days
} as const;

// API retry configuration
export const RETRY = {
  MAX_ATTEMPTS: 3,
  BASE_DELAY: 1000,
  MAX_DELAY: 10000,
} as const;

// UI constants
export const UI = {
  CARD_ASPECT_RATIO: "2/3",
  SKELETON_COUNT: 6,
  TRENDING_LIMIT: 10,
  SEARCH_DEBOUNCE: 500,
  ITEMS_PER_PAGE: 50,
} as const;

// Validation patterns
export const PATTERNS = {
  YOUTUBE_ID: /^[a-zA-Z0-9_-]{11}$/,
  EXTERNAL_ID: /^[a-zA-Z0-9_-]+$/,
} as const;
