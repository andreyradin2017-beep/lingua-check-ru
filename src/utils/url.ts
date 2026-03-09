/**
 * Валидация URL
 * Проверяет корректность и безопасность URL
 */

/**
 * Проверяет, является ли строка корректным URL
 */
export const isValidUrl = (str: string): boolean => {
  if (!str || typeof str !== 'string') {
    return false;
  }
  
  try {
    const url = new URL(str);
    
    // Разрешаем только http и https
    if (!['http:', 'https:'].includes(url.protocol)) {
      return false;
    }
    
    // Запрещаем javascript: и data: схемы
    if (url.protocol.startsWith('javascript:') || url.protocol.startsWith('data:')) {
      return false;
    }
    
    // Проверяем наличие хоста
    if (!url.hostname) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
};

/**
 * Нормализует URL (добавляет https:// если нет протокола)
 */
export const normalizeUrl = (str: string): string => {
  if (!str) return str;
  
  const trimmed = str.trim();
  
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  
  return `https://${trimmed}`;
};

/**
 * Проверяет URL и возвращает сообщение об ошибке или null
 */
export const validateUrl = (str: string): string | null => {
  if (!str) {
    return 'Введите URL';
  }
  
  if (!isValidUrl(str)) {
    return 'URL должен начинаться с http:// или https:// и содержать корректный домен';
  }
  
  return null;
};
