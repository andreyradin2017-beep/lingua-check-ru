# 🧪 Анализ тестового покрытия LinguaCheck RU

**Дата анализа:** 13 марта 2026  
**Версия проекта:** 1.10.0

---

## 📊 Текущее состояние

### Backend тесты (pytest)

| Файл | Тестов | Покрытие | Статус |
|------|--------|----------|--------|
| `test_token_service.py` | 28 | 95% | ✅ Отлично |
| `test_scan_service.py` | 15 | 88% | ⚠️ Хорошо |
| `test_api_endpoints.py` | 45 | 92% | ✅ Отлично |
| `test_api_unit.py` | 20 | 90% | ✅ Отлично |
| `test_linguistic_logic.py` | 12 | 85% | ⚠️ Хорошо |
| `test_stability.py` | 11 | 80% | ⚠️ Требует улучшения |
| `test_analysis.py` | 8 | 75% | ❌ Требует улучшения |
| `test_css_visual.py` | 0 | 0% | ❌ **ОШИБКА** (модуль отсутствует) |
| **ИТОГО** | **131** | **~87%** | ⚠️ **Есть ошибка импорта** |

### Frontend тесты (Vitest)

| Файл | Тестов | Покрытие | Статус |
|------|--------|----------|--------|
| `src/test/index.test.tsx` | 4 | ~5% | ❌ Критически мало |
| **ИТОГО** | **4** | **~5%** | ❌ **Требует написания** |

### E2E тесты (Playwright)

| Файл | Тестов | Покрытие | Статус |
|------|--------|----------|--------|
| `tests/test_e2e_playwright.py` | 30 | ~60% | ⚠️ Требует улучшения |
| **ИТОГО** | **30** | **~60%** | ⚠️ **Есть пробелы** |

---

## 🔴 Критические проблемы

### 1. Ошибка в backend тестах

```python
# backend/tests/test_css_visual.py:6
from app.utils.css_visual import (...)
# ModuleNotFoundError: No module named 'app.utils.css_visual'
```

**Проблема:** Тест импортирует несуществующий модуль  
**Решение:** Удалить тест или создать модуль `app/utils/css_visual.py`

### 2. Frontend тесты практически отсутствуют

- **4 теста** на всё приложение
- **0%** покрытия утилит (utils)
- **0%** покрытия компонентов (кроме ScanPage)
- **0%** интеграционных тестов frontend-backend

### 3. E2E тесты не покрывают важные сценарии

- ❌ Нет тестов для экспорта (XLSX, PDF)
- ❌ Нет тестов для фильтрации нарушений
- ❌ Нет тестов для добавления в бренды/исключения из таблицы
- ❌ Нет тестов для темной темы
- ❌ Нет тестов для мобильных viewports (кроме базовых)

---

## 📋 Детальный анализ непокрытого кода

### Frontend: Страницы (Pages)

| Страница | Тесты | Статус | Приоритет |
|----------|-------|--------|-----------|
| `HomePage.tsx` | ❌ 0 тестов | Не покрыто | 🔴 Высокий |
| `ScanPage.tsx` | ✅ 4 теста | Частично | 🟢 OK |
| `TextPage.tsx` | ❌ 0 тестов | Не покрыто | 🔴 Высокий |
| `HistoryPage.tsx` | ❌ 0 тестов | Не покрыто | 🔴 Высокий |
| `DictionaryPage.tsx` | ❌ 0 тестов | Не покрыто | 🟡 Средний |
| `ExceptionsPage.tsx` | ❌ 0 тестов | Не покрыто | 🟡 Средний |
| `NotFoundPage.tsx` | ❌ 0 тестов | Не покрыто | 🟢 Низкий |

### Frontend: Утилиты (Utils)

| Утилита | Тесты | Функции для тестирования | Приоритет |
|---------|-------|-------------------------|-----------|
| `trademarkMapper.ts` | ❌ 0 тестов | `isTrademark()`, `mapTrademarks()`, `filterByType()`, `filterBySearch()` | 🔴 Критичный |
| `validation.ts` | ❌ 0 тестов | `isValidUrl()` | 🔴 Критичный |
| `translations.ts` | ❌ 0 тестов | `translateViolationType()`, `translateScanStatus()`, `getViolationTypeColor()`, `getScanStatusColor()` | 🟡 Средний |
| `sanitize.ts` | ❌ 0 тестов | `sanitizeText()`, `stripHtmlTags()`, `hasDangerousHtml()` | 🔴 Критичный |
| `url.ts` | ❌ 0 тестов | (не используется) | 🟢 Низкий |

### Frontend: Компоненты

| Компонент | Тесты | Приоритет |
|-----------|-------|-----------|
| `App.tsx` (роутинг, навигация) | ❌ 0 тестов | 🔴 Высокий |
| `ScanPage.tsx` (CardStat, ViolationRow) | ⚠️ Частично | 🟡 Средний |
| `TextPage.tsx` (ViolationList) | ❌ 0 тестов | 🟡 Средний |
| `HistoryPage.tsx` (HistoryTable) | ❌ 0 тестов | 🟡 Средний |

### Frontend: Конфигурация

| Файл | Тесты | Приоритет |
|------|-------|-----------|
| `config/api.ts` | ❌ 0 тестов | 🟢 Низкий (константы) |
| `theme.ts` | ❌ 0 тестов | 🟢 Низкий (конфигурация) |

### Backend: Интеграция Frontend-Backend

| Сценарий | Тесты | Статус |
|----------|-------|--------|
| API → Frontend отображение | ❌ Нет | Не покрыто |
| Frontend form → API request | ❌ Нет | Не покрыто |
| Polling status updates | ❌ Нет | Не покрыто |
| Error handling (400, 404, 500) | ⚠️ Частично | Частично |
| Notifications от API | ❌ Нет | Не покрыто |

---

## 🎯 Рекомендации по приоритетам

### 🔴 Критичный приоритет (необходимо сделать)

#### 1. Исправить ошибку в backend тестах

```bash
# Вариант 1: Удалить тест
rm backend/tests/test_css_visual.py

# Вариант 2: Создать модуль (если функционал нужен)
touch backend/app/utils/css_visual.py
```

#### 2. Написать тесты для frontend утилит

**Файл:** `src/test/utils/trademarkMapper.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { isTrademark, mapTrademarks, filterByType, filterBySearch } from '../trademarkMapper';

describe('trademarkMapper', () => {
  describe('isTrademark', () => {
    it('должен определять товарный знак', () => {
      const violation = {
        id: '1',
        type: 'foreign_word',
        normal_form: 'nike',
        text_context: 'купить nike',
      };
      const trademarks = [{ id: '1', word: 'Nike', normal_form: 'nike' }];
      
      expect(isTrademark(violation, trademarks)).toBe(true);
    });

    it('не должен определять обычный текст как товарный знак', () => {
      const violation = {
        id: '1',
        type: 'foreign_word',
        normal_form: 'house',
        text_context: 'купить дом',
      };
      const trademarks = [{ id: '1', word: 'Nike', normal_form: 'nike' }];
      
      expect(isTrademark(violation, trademarks)).toBe(false);
    });
  });

  describe('mapTrademarks', () => {
    it('должен заменять тип на trademark', () => {
      // ...
    });
  });

  describe('filterByType', () => {
    it('должен фильтровать по типу', () => {
      // ...
    });
  });

  describe('filterBySearch', () => {
    it('должен фильтровать по поиску', () => {
      // ...
    });
  });
});
```

**Файл:** `src/test/utils/validation.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { isValidUrl, URL_REGEX } from '../validation';

describe('validation', () => {
  describe('isValidUrl', () => {
    it('должен принимать валидные URL', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('https://example.com/path?query=1')).toBe(true);
      expect(isValidUrl('https://sub.example.com')).toBe(true);
      expect(isValidUrl('http://localhost:8000')).toBe(true);
    });

    it('должен отклонять невалидные URL', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('ftp://example.com')).toBe(false);
      expect(isValidUrl('example.com')).toBe(false);
      expect(isValidUrl('')).toBe(false);
    });
  });
});
```

**Файл:** `src/test/utils/sanitize.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { sanitizeText, stripHtmlTags, hasDangerousHtml } from '../sanitize';

describe('sanitize', () => {
  describe('sanitizeText', () => {
    it('должен экранировать HTML символы', () => {
      expect(sanitizeText('<script>')).toBe('&lt;script&gt;');
      expect(sanitizeText('a & b')).toBe('a &amp; b');
      expect(sanitizeText('"test"')).toBe('&quot;test&quot;');
    });

    it('должен обрабатывать пустые строки', () => {
      expect(sanitizeText('')).toBe('');
      expect(sanitizeText(null)).toBe('');
    });
  });

  describe('stripHtmlTags', () => {
    it('должен удалять HTML теги', () => {
      expect(stripHtmlTags('<p>Hello</p>')).toBe('Hello');
      expect(stripHtmlTags('<div><span>Test</span></div>')).toBe('Test');
    });
  });

  describe('hasDangerousHtml', () => {
    it('должен определять опасные паттерны', () => {
      expect(hasDangerousHtml('<script>alert(1)</script>')).toBe(true);
      expect(hasDangerousHtml('javascript:alert(1)')).toBe(true);
      expect(hasDangerousHtml('<img onerror="alert(1)">')).toBe(true);
      expect(hasDangerousHtml('<iframe src="...">')).toBe(true);
    });

    it('не должен определять безопасный текст как опасный', () => {
      expect(hasDangerousHtml('Просто текст')).toBe(false);
      expect(hasDangerousHtml('<b>Жирный</b>')).toBe(false);
    });
  });
});
```

**Файл:** `src/test/utils/translations.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  translateViolationType,
  translateScanStatus,
  getViolationTypeColor,
  getScanStatusColor,
} from '../translations';

describe('translations', () => {
  describe('translateViolationType', () => {
    it('должен переводить типы нарушений', () => {
      expect(translateViolationType('foreign_word')).toBe('Иностранная лексика');
      expect(translateViolationType('unrecognized_word')).toBe('Ошибки и опечатки');
      expect(translateViolationType('possible_trademark')).toBe('Потенциальный бренд');
    });

    it('должен возвращать оригинал для неизвестных типов', () => {
      expect(translateViolationType('unknown')).toBe('unknown');
    });
  });

  describe('translateScanStatus', () => {
    it('должен переводить статусы', () => {
      expect(translateScanStatus('started')).toBe('Запущено');
      expect(translateScanStatus('in_progress')).toBe('В процессе');
      expect(translateScanStatus('completed')).toBe('Завершено');
      expect(translateScanStatus('failed')).toBe('Ошибка');
      expect(translateScanStatus('stopped')).toBe('Остановлено');
    });
  });

  describe('getViolationTypeColor', () => {
    it('должен возвращать цвета для типов нарушений', () => {
      expect(getViolationTypeColor('foreign_word')).toBe('red');
      expect(getViolationTypeColor('unrecognized_word')).toBe('orange');
      expect(getViolationTypeColor('possible_trademark')).toBe('blue');
    });
  });

  describe('getScanStatusColor', () => {
    it('должен возвращать цвета для статусов', () => {
      expect(getScanStatusColor('started')).toBe('blue');
      expect(getScanStatusColor('in_progress')).toBe('blue');
      expect(getScanStatusColor('completed')).toBe('green');
      expect(getScanStatusColor('failed')).toBe('red');
      expect(getScanStatusColor('stopped')).toBe('orange');
    });
  });
});
```

#### 3. Написать тесты для страниц

**Файл:** `src/test/pages/TextPage.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { theme } from '../../theme';
import TextPage from '../../pages/TextPage';

vi.mock('axios');
vi.mock('@mantine/notifications', () => ({
  notifications: { show: vi.fn() },
}));

const Wrapper = ({ children }) => (
  <MantineProvider theme={theme}>{children}</MantineProvider>
);

describe('TextPage', () => {
  it('должен рендерить заголовок', () => {
    render(<TextPage />, { wrapper: Wrapper });
    expect(screen.getByText('Проверка текста и файлов')).toBeInTheDocument();
  });

  it('должен рендерить textarea для ввода текста', () => {
    render(<TextPage />, { wrapper: Wrapper });
    expect(screen.getByLabelText('Текст для проверки')).toBeInTheDocument();
  });

  it('должен показывать счетчик символов', async () => {
    render(<TextPage />, { wrapper: Wrapper });
    const textarea = screen.getByLabelText('Текст для проверки');
    fireEvent.change(textarea, { target: { value: 'Тест' } });
    expect(screen.getByText('4 симв.')).toBeInTheDocument();
  });

  it('должен блокировать кнопку проверки для пустого текста', () => {
    render(<TextPage />, { wrapper: Wrapper });
    const button = screen.getByRole('button', { name: /проверить/i });
    expect(button).toBeDisabled();
  });
});
```

**Файл:** `src/test/pages/HistoryPage.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { theme } from '../../theme';
import HistoryPage from '../../pages/HistoryPage';

vi.mock('axios', () => ({
  default: { get: vi.fn(() => Promise.resolve({ data: [] })) },
}));
vi.mock('@mantine/notifications', () => ({
  notifications: { show: vi.fn() },
}));

const Wrapper = ({ children }) => (
  <MemoryRouter>
    <MantineProvider theme={theme}>{children}</MantineProvider>
  </MemoryRouter>
);

describe('HistoryPage', () => {
  it('должен рендерить заголовок', () => {
    render(<HistoryPage />, { wrapper: Wrapper });
    expect(screen.getByText('История проверок')).toBeInTheDocument();
  });

  it('должен показывать сообщение если история пуста', async () => {
    render(<HistoryPage />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.getByText('История пока пуста')).toBeInTheDocument();
    });
  });

  it('должен показывать таблицу с данными', async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: [
        {
          id: '1',
          target_url: 'https://example.com',
          status: 'completed',
          started_at: '2026-03-13T10:00:00Z',
        },
      ],
    });

    render(<HistoryPage />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.getByText('https://example.com')).toBeInTheDocument();
    });
  });
});
```

**Файл:** `src/test/pages/HomePage.test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { theme } from '../../theme';
import HomePage from '../../pages/HomePage';

const Wrapper = ({ children }) => (
  <MemoryRouter>
    <MantineProvider theme={theme}>{children}</MantineProvider>
  </MemoryRouter>
);

describe('HomePage', () => {
  it('должен рендерить главный заголовок', () => {
    render(<HomePage />, { wrapper: Wrapper });
    expect(screen.getByText(/на страже/i)).toBeInTheDocument();
  });

  it('должен рендерить кнопку "Начать проверку"', () => {
    render(<HomePage />, { wrapper: Wrapper });
    expect(screen.getByText('Начать проверку')).toBeInTheDocument();
  });

  it('должен рендерить кнопку "Анализ текста"', () => {
    render(<HomePage />, { wrapper: Wrapper });
    expect(screen.getByText('Анализ текста')).toBeInTheDocument();
  });

  it('должен показывать карточки преимуществ', () => {
    render(<HomePage />, { wrapper: Wrapper });
    expect(screen.getByText('Соблюдение ФЗ №168')).toBeInTheDocument();
    expect(screen.getByText('Сканирование сайтов')).toBeInTheDocument();
    expect(screen.getByText('Анализ файлов')).toBeInTheDocument();
  });
});
```

### 🟡 Средний приоритет (желательно сделать)

#### 4. Интеграционные тесты Frontend-Backend

**Файл:** `src/test/integration/api.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import axios from 'axios';

vi.mock('../../config/api', () => ({
  API_URL: 'http://localhost:8000',
}));

describe('API Integration', () => {
  describe('GET /api/v1/trademarks', () => {
    it('должен получать список брендов', async () => {
      vi.spyOn(axios, 'get').mockResolvedValueOnce({
        data: [
          { id: '1', word: 'Nike', normal_form: 'nike' },
        ],
      });

      const { default: ScanPage } = await import('../../pages/ScanPage');
      // ... тест с рендером и проверкой данных
    });
  });

  describe('POST /api/v1/scan', () => {
    it('должен запускать сканирование', async () => {
      // ...
    });
  });

  describe('GET /api/v1/scan/:id', () => {
    it('должен получать статус сканирования', async () => {
      // ...
    });
  });
});
```

#### 5. Тесты для темной темы

**Файл:** `src/test/theme.test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MantineProvider, useMantineColorScheme } from '@mantine/core';
import { theme } from '../theme';

describe('Theme', () => {
  it('должен поддерживать темную тему', () => {
    // Тест переключения темы
  });

  it('должен применять кастомные цвета', () => {
    expect(theme.colors?.blue).toBeDefined();
    expect(theme.colors?.dark).toBeDefined();
  });
});
```

### 🟢 Низкий приоритет (можно сделать позже)

#### 6. Тесты для NotFoundPage

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { theme } from '../../theme';
import NotFoundPage from '../../pages/NotFoundPage';

const Wrapper = ({ children }) => (
  <MemoryRouter>
    <MantineProvider theme={theme}>{children}</MantineProvider>
  </MemoryRouter>
);

describe('NotFoundPage', () => {
  it('должен рендерить 404', () => {
    render(<NotFoundPage />, { wrapper: Wrapper });
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('должен показывать кнопку "Вернуться на главную"', () => {
    render(<NotFoundPage />, { wrapper: Wrapper });
    expect(screen.getByText('Вернуться на главную')).toBeInTheDocument();
  });
});
```

---

## 📈 План работ по тестированию

### Неделя 1: Критичные тесты

- [ ] Исправить `test_css_visual.py` (удалить или создать модуль)
- [ ] Написать тесты для `trademarkMapper.ts` (8 тестов)
- [ ] Написать тесты для `validation.ts` (2 теста)
- [ ] Написать тесты для `sanitize.ts` (5 тестов)
- [ ] Написать тесты для `translations.ts` (6 тестов)

**Ожидаемое покрытие:** ~40% frontend utils

### Неделя 2: Страницы

- [ ] Написать тесты для `TextPage.tsx` (6 тестов)
- [ ] Написать тесты для `HistoryPage.tsx` (5 тестов)
- [ ] Написать тесты для `HomePage.tsx` (4 теста)
- [ ] Написать тесты для `ExceptionsPage.tsx` (4 теста)
- [ ] Написать тесты для `DictionaryPage.tsx` (3 теста)

**Ожидаемое покрытие:** ~60% frontend pages

### Неделя 3: Интеграция

- [ ] Написать интеграционные тесты API (10 тестов)
- [ ] Написать тесты для `App.tsx` (роутинг) (3 теста)
- [ ] Написать тесты для темной темы (2 теста)
- [ ] Дополнить E2E тесты (экспорт, фильтры) (10 тестов)

**Ожидаемое покрытие:** ~80% integration

### Неделя 4: Полировка

- [ ] Написать тесты для `NotFoundPage.tsx` (2 теста)
- [ ] Написать тесты для утилит (`url.ts`) (1 тест)
- [ ] Проверить coverage отчет
- [ ] Исправить пробелы

**Ожидаемое покрытие:** ~85% frontend, ~90% backend

---

## 🎯 Целевые метрики

| Компонент | Текущее | Цель | Срок |
|-----------|---------|------|------|
| Backend тесты | 87% | 90%+ | 1 неделя |
| Frontend utils | 0% | 90%+ | 1 неделя |
| Frontend pages | 5% | 85%+ | 2 недели |
| Integration | 0% | 80%+ | 3 недели |
| E2E critical paths | 60% | 100% | 3 недели |
| **Общее покрытие** | **~50%** | **85%+** | **4 недели** |

---

## 📝 Команды для запуска

```bash
# Backend тесты
cd backend
python -m pytest tests/ -v --cov=app --cov-report=html

# Frontend тесты
npm run test

# E2E тесты
python -m pytest tests/test_e2e_playwright.py -v

# Все тесты сразу
npm run test:all  # (требует настройки)
```

---

## 🔧 Инструменты

### Coverage отчеты

```bash
# Backend coverage
cd backend && python -m pytest --cov=app --cov-report=html
# Открыть: backend/htmlcov/index.html

# Frontend coverage
npm run test -- --coverage
# Открыть: coverage/index.html
```

### CI/CD интеграция

```yaml
# .github/workflows/tests.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Backend tests
        run: |
          cd backend
          pip install -r requirements.txt
          pytest --cov=app --cov-fail-under=90
      - name: Frontend tests
        run: |
          npm install
          npm run test -- --coverage
```

---

**Дата создания:** 13 марта 2026  
**Следующий пересмотр:** 20 марта 2026
