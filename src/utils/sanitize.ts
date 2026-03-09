/**
 * Утилиты для санитизации контента
 * Защита от XSS атак
 */

/**
 * Базовая санитизация текста для безопасного отображения
 * Заменяет потенциально опасные HTML-сущности
 */
export const sanitizeText = (text: string): string => {
  if (!text) return '';
  
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Очищает текст от HTML тегов (полное удаление)
 */
export const stripHtmlTags = (html: string): string => {
  if (!html) return '';
  
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
};

/**
 * Проверяет, содержит ли текст потенциально опасный HTML
 */
export const hasDangerousHtml = (text: string): boolean => {
  if (!text) return false;
  
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,  // onclick=, onerror=, и т.д.
    /<iframe/i,
    /<object/i,
    /<embed/i,
  ];
  
  return dangerousPatterns.some(pattern => pattern.test(text));
};
