/**
 * Конфигурация API
 * Использует переменную окружения VITE_API_URL или значение по умолчанию
 */

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Таймаут запросов в миллисекундах
 */
export const API_TIMEOUT = 30000;

/**
 * Интервал опроса статуса сканирования (мс)
 */
export const SCAN_POLLING_INTERVAL = 3000;

/**
 * Интервал автообновления истории (мс)
 */
export const HISTORY_REFRESH_INTERVAL = 10000;
