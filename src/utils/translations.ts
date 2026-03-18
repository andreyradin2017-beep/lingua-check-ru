/**
 * Перевод типов нарушений и статусов
 */

export type ViolationType =
  | 'foreign_word'
  | 'unrecognized_word'
  | 'possible_trademark'
  | 'trademark'
  | 'exception'
  | 'fz152_violation';

export type ScanStatus =
  | 'started'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'stopped';

/**
 * Переводит тип нарушения на русский язык
 */
export const translateViolationType = (type: ViolationType | string): string => {
  const translations: Record<ViolationType, string> = {
    foreign_word: 'Иностранная лексика',
    unrecognized_word: 'Ошибки и опечатки',
    possible_trademark: 'Потенциальный бренд',
    trademark: 'Зарегистрированный бренд',
    exception: 'Исключение (Словарь)',
    fz152_violation: 'Нарушение ФЗ-152',
  };

  return translations[type as ViolationType] || type;
};

/**
 * Переводит статус сканирования на русский язык
 */
export const translateScanStatus = (status: ScanStatus | string): string => {
  const translations: Record<ScanStatus, string> = {
    started: 'Запущено',
    in_progress: 'В процессе',
    completed: 'Завершено',
    failed: 'Ошибка',
    stopped: 'Остановлено',
  };

  return translations[status as ScanStatus] || status;
};

/**
 * Возвращает цвет для типа нарушения
 */
export const getViolationTypeColor = (type: ViolationType | string): string => {
  const colors: Record<ViolationType, string> = {
    foreign_word: 'red',
    unrecognized_word: 'orange',
    possible_trademark: 'blue',
    trademark: 'green',
    exception: 'teal',
    fz152_violation: 'red',
  };

  return colors[type as ViolationType] || 'gray';
};

/**
 * Возвращает цвет для статуса сканирования
 */
export const getScanStatusColor = (status: ScanStatus | string): string => {
  const colors: Record<ScanStatus, string> = {
    started: 'blue',
    in_progress: 'blue',
    completed: 'green',
    failed: 'red',
    stopped: 'orange',
  };
  
  return colors[status as ScanStatus] || 'gray';
};
