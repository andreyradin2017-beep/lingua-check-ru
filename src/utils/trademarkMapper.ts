/**
 * Утилита для маппинга товарных знаков
 * Динамически определяет тип нарушения на основе списка брендов
 */

export interface Trademark {
  id: string;
  word: string;
  normal_form: string;
}

export interface BaseViolation {
  id: string;
  type: string;
  page_url?: string | null;
  text_context: string;
  word?: string | null;
  normal_form?: string | null;
  count?: number;
  contexts?: string[];
}

/**
 * Проверяет, является ли нарушение товарным знаком
 */
export const isTrademark = (
  violation: BaseViolation,
  trademarks: Trademark[]
): boolean => {
  if (!violation.normal_form) return false;
  
  const trademarkNormalForms = new Set(trademarks.map(t => t.normal_form));
  const isPotentialTrademark = 
    violation.type === 'foreign_word' || 
    violation.type === 'unrecognized_word' || 
    violation.type === 'possible_trademark';
  
  return isPotentialTrademark && trademarkNormalForms.has(violation.normal_form);
};

/**
 * Маппит нарушения, заменяя тип на 'trademark' если слово есть в списке брендов
 */
export const mapTrademarks = <T extends BaseViolation>(
  violations: T[],
  trademarks: Trademark[]
): T[] => {
  return violations.map(v => {
    if (isTrademark(v, trademarks)) {
      return { ...v, type: 'trademark' };
    }
    return v;
  });
};

/**
 * Фильтрует нарушения по типу с учетом динамического маппинга
 */
export const filterByType = <T extends BaseViolation>(
  violations: T[],
  typeFilter: string[]
): T[] => {
  if (typeFilter.length === 0) return violations;
  return violations.filter(v => typeFilter.includes(v.type));
};

/**
 * Фильтрует нарушения по поисковому запросу
 */
export const filterBySearch = <T extends BaseViolation>(
  violations: T[],
  searchQuery: string
): T[] => {
  if (!searchQuery) return violations;
  
  const q = searchQuery.toLowerCase();
  
  // Строгое совпадение по URL если запрос начинается с http
  if (q.startsWith('http')) {
    return violations.filter(v => v.page_url?.toLowerCase() === q);
  }
  
  return violations.filter(v =>
    (v.word && v.word.toLowerCase().includes(q)) ||
    (v.text_context && v.text_context.toLowerCase().includes(q)) ||
    (v.page_url && v.page_url.toLowerCase().includes(q))
  );
};
