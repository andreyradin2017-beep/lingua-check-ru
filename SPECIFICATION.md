# 📋 LinguaCheck-RU - Спецификация системы

**Версия:** 1.15.0 (Full Stack Migration)
**Дата обновления:** 2026-03-24
**Статус:** ✅ ГОТОВО К ПРОДАКШЕНУ

---

## 🎯 Описание

LinguaCheck-RU — система автоматического контроля соблюдения требований к использованию русского языка в публичном пространстве (ФЗ №168-ФЗ).

### Ключевые возможности

- **🔒 Безопасность** — обновлены Pillow 12.1.1, lxml 6.0.2, playwright 1.58.0.
- **⚡ Backend** — FastAPI 0.135.2, uvicorn 0.42.0, pydantic 2.12.5.
- **🧪 Тесты** — Vitest 4.1.1, Vite 8.0.2.
- **🎨 UI** — Mantine 8.3.18 (patch).
- **🗃 БД** — SQLAlchemy 2.0.48, redis 7.4.0 (Python 3.10+).
- **🛠 Инструменты** — ESLint 10.0.3, TypeScript 5.9.2, typescript-eslint 8.57.1.
- **📦 Зависимости** — httpx 0.28.1, pdfminer.six 20260107, @tabler/icons-react 3.40.0, lucide-react 1.0.1.
- **⚡ Vite 8 (Rolldown)** — 10-30x быстрее сборок, Rust bundler вместо esbuild + Rollup.
- **📁 Reliable Export** — исправлены ошибки скачивания XLSX/PDF, корректные расширения и префиксы файлов.
- **🧹 Smart Crawler** — автоматическое игнорирование скрытых блоков (`aria-hidden`) и фильтрация иноязычных URL.
- **🛡 Safe Tokenizer** — исключение технических терминов (например, `drug` в URL) из списка нарушений.
- **⚡ Lightning Scan** — ускорение в 15 раз (2.46с/стр), параллелизм 5 воркеров.
- **📊 Группировка нарушений** — слово xN, экономия 90% трафика.
- **🧠 In-Memory Caching** — локальное кэширование словарей в backend (ускорение в 10 раз).
- **🎨 Dark Theme** — полная поддержка темной темы (контраст 8.2:1).
- **♿ Accessibility** — ARIA-атрибуты, keyboard navigation, focus-visible.

---

## 🏗 Архитектура

### Технологический стек

| Компонент | Технологии |
|-----------|------------|
| **Frontend** | React 19, TypeScript 5.9, Mantine UI 8, react-router-dom, react-helmet-async |
| **Backend** | FastAPI 0.135, SQLAlchemy 2.0 Async, Pydantic v2, Playwright |
| **База данных** | PostgreSQL (Supabase), SQLAlchemy 2.0.48, asyncpg 0.31, redis 7.4 |
| **Анализ** | pymorphy3 (морфология) |
| **Тесты** | Vitest 4 (frontend), pytest 8.3 (backend), Playwright (E2E) |
| **Bundler** | Vite 8 + Rolldown (Rust) — 10-30x быстрее |
| **Build Tool** | @vitejs/plugin-react v6 (Oxc вместо Babel) |
| **Linter** | ESLint 10, typescript-eslint 8.57 |

### Структура проекта

```
russian-lang/
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   │   ├── scans.py          # API сканирования (+ группировка)
│   │   │   ├── texts.py          # API текста
│   │   │   ├── trademarks.py     # API брендов
│   │   │   └── exceptions.py     # API исключений
│   │   ├── services/
│   │   │   ├── scan_service.py   # Сканирование сайтов (параллелизм 5 воркеров)
│   │   │   ├── token_service.py  # Анализ текста (in-memory кэш)
│   │   │   └── export_service.py # Экспорт XLSX/PDF
│   │   ├── models.py             # SQLAlchemy ORM модели
│   │   └── schemas.py            # Pydantic схемы
│   ├── tests/                    # Backend тесты (90%+ покрытие)
│   ├── manage.py                 # CLI утилиты (init, seed, update-counts)
│   └── run.py                    # Точка входа
├── src/
│   ├── pages/
│   │   ├── ScanPage.tsx          # Оптимизированная таблица с группировкой
│   │   ├── HistoryPage.tsx       # История сканирований
│   │   ├── TextPage.tsx          # Проверка текста и файлов
│   │   └── DictionariesPage.tsx  # Информация о словарях
│   ├── components/
│   │   ├── Layout.tsx            # Основной макет с сайдбаром
│   │   ├── ScanForm.tsx          # Форма сканирования
│   │   ├── ViolationsTable.tsx   # Таблица нарушений
│   │   └── ExportButtons.tsx     # Кнопки экспорта
│   ├── utils/
│   │   ├── url.ts                # Валидация URL
│   │   ├── sanitize.ts           # Санитизация HTML
│   │   ├── translations.ts       # Перевод статусов
│   │   └── export.ts             # Утилиты экспорта
│   ├── config/
│   │   └── api.ts                # Конфигурация API
│   └── hooks/                    # Кастомные хуки
├── tests/                        # E2E тесты (Playwright)
├── docs/                         # Документация
├── scripts/                      # Вспомогательные скрипты
├── full_diagnostic.py            # Диагностика системы
└── monitor_services.py           # Мониторинг сервисов
```

---

## 🔌 API Endpoints

### Сканирование сайтов

| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | `/api/v1/scan` | Запустить сканирование |
| GET | `/api/v1/scan/{id}` | Получить статус и результаты |
| GET | `/api/v1/scan/{id}/grouped` | Сгруппированные нарушения |
| GET | `/api/v1/scans` | История сканирований |
| DELETE | `/api/v1/scan/{id}` | Удалить сканирование |
| DELETE | `/api/v1/scans` | Очистить историю |

#### Примеры:

```bash
# Запуск сканирования
curl -X POST http://127.0.0.1:8000/api/v1/scan \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "max_depth": 2}'

# Получение с лимитом
curl http://127.0.0.1:8000/api/v1/scan/{id}?limit=1000

# Получение сгруппированных данных
curl http://127.0.0.1:8000/api/v1/scan/{id}/grouped
# Ответ: [{"word": "лайфстайл", "count": 30, "type": "foreign_word", ...}]
```

### Проверка текста

| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | `/api/v1/check_text` | Проверить текст |
| POST | `/api/v1/check_text/upload` | Загрузить файл (TXT/DOCX/PDF) |

### Справочники

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/v1/dictionary_preview` | Список словарей |
| GET | `/api/v1/trademarks` | Получить бренды |
| POST | `/api/v1/trademarks` | Добавить бренд |
| DELETE | `/api/v1/trademarks/{id}` | Удалить бренд |
| GET | `/api/v1/exceptions` | Получить исключения |
| POST | `/api/v1/exceptions` | Добавить исключение |
| DELETE | `/api/v1/exceptions/{id}` | Удалить исключение |

### Экспорт

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/v1/scan/{id}/export/xlsx` | Экспорт в Excel |
| GET | `/api/v1/scan/{id}/export/pdf` | Экспорт в PDF |

---

## 📊 Оптимизация производительности

### Группировка нарушений

**Проблема:** При сканировании больших сайтов (100+ страниц) создавалось 1000+ нарушений, что приводило к:
- Медленной загрузке frontend (>30с)
- Падению браузера от нагрузки
- Нечитаемой таблице

**Решение:** Группировка одинаковых нарушений на странице

| Показатель | До | После | Улучшение |
|------------|-----|-------|-----------|
| Записей в таблице | 1000+ | 94 | **-91%** |
| Время загрузки | >30с | ~2с | **-93%** |
| Использование памяти | Высокое | Низкое | **-80%** |
| Скорость сканирования | 36с/стр | 2.46с/стр | **-93%** |
| Параллелизм | 1 воркер | 5 воркеров | **500%** |
| Запросы к БД | x1000/стр | x1/сессия | **-99.9%** |

### Пример группировки:

**До:**
```
"нутриентах" (unrecognized_word) - страница 1
"нутриентах" (unrecognized_word) - страница 2
"нутриентах" (unrecognized_word) - страница 3
... (еще 77 раз)
```

**После:**
```
"нутриентах" x80 (unrecognized_word) - страница 1
```

### Оптимизация экспорта (1.13.0)

| Проблема | Решение |
|----------|---------|
| Некорректные расширения файлов | Добавлены `.xlsx` и `.pdf` |
| Конфликты имён | Префиксы `linguacheck_` + timestamp |
| Ошибки скачивания | Исправлены заголовки `Content-Disposition` |

### Smart Crawler (1.13.0)

| Функция | Описание |
|---------|----------|
| `aria-hidden` фильтр | Игнорирование скрытых блоков |
| URL фильтрация | Исключение иноязычных доменов |
| Safe Tokenizer | Исключение технических терминов из нарушений |

### Лимиты

| Параметр | Значение | Настройка |
|----------|----------|-----------|
| Макс. глубина сканирования | 5 уровней | `max_depth` |
| Макс. страниц за сканирование | 500 | `max_pages` |
| Лимит нарушений в ответе | 1000 | `?limit=1000` |
| Макс. размер текста | 1 млн символов | - |
| Макс. размер файла | 10 МБ | - |

---

## 🧪 Тестирование

### Покрытие тестами

| Компонент | Тестов | Покрытие | Статус |
|-----------|--------|----------|--------|
| token_service.py | 28 | 95% | ✅ |
| scan_service.py | 15 | 88% | ✅ |
| export_service.py | 12 | 90% | ✅ |
| api_endpoints.py | 45 | 92% | ✅ |
| test_stability.py | 20 | 90% | ✅ |
| E2E (Playwright) | 28 | 75% | ⚠️ |
| **ИТОГО** | **148** | **87.5%** | ✅ |

### Запуск тестов

```bash
# Backend тесты
cd backend && python -m pytest tests/ -v --cov=app

# E2E тесты
python -m pytest tests/test_e2e_playwright.py -v

# Диагностика
python full_diagnostic.py

# Мониторинг
python monitor_services.py check
```

---

## 📱 Frontend

### Страницы

| Страница | URL | Описание |
|----------|-----|----------|
| Главная | `/` | Обзор возможностей |
| Сканирование | `/scans` | **Оптимизированная таблица** |
| История | `/history` | История сканирований |
| Текст | `/text` | Проверка текста/файлов |
| Словари | `/dictionaries` | Информация о словарях |
| Исключения | `/exceptions` | Управление исключениями |

### Оптимизированная таблица (ScanPage)

**Функции:**
- Группировка: "слово xN"
- Цветовая индикация частоты (красный >50, оранжевый >10, синий <10)
- Сортировка по убыванию частоты
- Фильтры по типу и поиску
- Добавление в бренды/исключения в 1 клик
- Экспорт в XLSX/PDF

**Пример отображения:**

| Слово | Повторений | Тип | Страница | Контекст | Действия |
|-------|------------|-----|----------|----------|----------|
| нутриентах | **x80** | Ошибка | trekrezan.ru | ... | 🔖🛡️ |
| лайфстайл | **x30** | Иностранное | trekrezan.ru | ... | 🔖🛡️ |
| D3 | **x26** | Бренд | elentra.ru | ... | 🔖🛡️ |

---

## 🔒 Безопасность

### Валидация

- **URL:** Проверка схемы (http/https), защита от XSS
- **Текст:** Лимит 1 млн символов, санитизация HTML
- **Файлы:** Проверка расширения (TXT/DOCX/PDF), лимит 10 МБ

### Rate Limiting

| Endpoint | Лимит |
|----------|-------|
| `/api/v1/scan` | 5/минуту |
| `/api/v1/check_text` | 10/минуту |
| `/api/v1/check_text/upload` | 5/минуту |

---

## 📈 Мониторинг

### Диагностика

```bash
# Полная проверка системы
python full_diagnostic.py

# Вывод:
# [OK] Backend
# [OK] Frontend
# [OK] Scans
# [OK] Trademarks
# [OK] Exceptions
# [OK] Text Analysis
# [OK] Delete
```

### Метрики

- **Всего сканов:** 14
- **Completed:** 10 (71%)
- **Failed:** 3 (21%) — данные сохранены
- **Stopped:** 1 (8%)

### Логирование

```bash
# Backend логи
cd backend && tail -f logs/app.log

# Ошибки сканирования
grep "failed" logs/app.log
```

---

## 🚀 Развертывание

### Требования

- **Python:** 3.12+
- **Node.js:** 18+
- **PostgreSQL:** 15+ (Supabase)
- **Playwright:** Chromium

### Установка

```bash
# Backend
cd backend
pip install -r requirements.txt
playwright install chromium
python manage.py init
python manage.py seed
python run.py

# Frontend
npm install
npm run dev
```

### Переменные окружения

**backend/.env:**
```env
DATABASE_URL=postgresql+asyncpg://...
SUPABASE_URL=https://...
SUPABASE_KEY=...
MAX_DEPTH_LIMIT=5
MAX_PAGES_LIMIT=500
MAX_FILE_SIZE_MB=10
```

**frontend/.env:**
```env
VITE_API_URL=http://127.0.0.1:8000
```

---

## 📝 История изменений

### Версия 1.14.0 (2026-03-23) — Vite 8 Migration

**Новые функции:**
- ✅ **Vite 8.0.2**: Переход на Rolldown (Rust bundler) — 10-30x быстрее сборок (3с вместо 30с).
- ✅ **@vitejs/plugin-react v6**: Использует Oxc вместо Babel — меньше зависимостей.
- ✅ **Code Splitting**: Функциональная форма manualChunks для Rolldown.
- ✅ **Производительность**: Сборка уменьшена с ~30с до ~3с.

**Требования:**
- Node.js 20.19+ или 22.12+ (проект использует 24.13.1)

**Breaking Changes:**
- `manualChunks` теперь требует функциональной формы вместо объектной

### Версия 1.13.0 (2026-03-15) — Export & Data Quality

**Новые функции:**
- ✅ **Reliable Export**: Исправлены ошибки скачивания XLSX/PDF, добавлены корректные расширения (`.xlsx`, `.pdf`) и префиксы (`linguacheck_`).
- ✅ **Smart Crawler**: Автоматическое игнорирование скрытых блоков (`aria-hidden="true"`) и фильтрация иноязычных URL.
- ✅ **Safe Tokenizer**: Исключение технических терминов (например, `drug` в URL) из списка нарушений.
- ✅ **Docs Sync**: Полная актуализация спецификаций и очистка структуры проекта.

### Версия 1.12.0 (2026-03-14) — Polishing Complete

**Новые функции:**
- ✅ **Dark Theme**: Улучшенная темная палитра (контраст 8.2:1).
- ✅ **UI Polish**: Консистентные отступы (8px grid).
- ✅ **Статусы сканирований**: Точные переводы + tooltip.
- ✅ **Accessibility**: focus-visible, improved contrast.
- ✅ **Retry Logic**: Экспоненциальная задержка при ошибках API.
- ✅ **Stability**: Улучшена стабильность dev сервера.

### Версия 1.10.0 (2026-03-13) — Frontend Optimization

**Новые функции:**
- ✅ **Оптимизация Frontend**: Уменьшение бандла на 53% (1.3MB → 630KB).
- ✅ **Code Splitting**: Lazy loading для jsPDF, XLSX (~850KB lazy).
- ✅ **React.memo**: Мемоизация компонентов (ScanPage, TextPage).
- ✅ **Доступность (a11y)**: ARIA-атрибуты, keyboard navigation.
- ✅ **useMemo/useCallback**: Оптимизация вычислений и обработчиков.
- ✅ **TypeScript**: Исправлены все ошибки сборки.

### Версия 1.9.0 (2026-03-12) — Lightning Scan

**Новые функции:**
- ✅ **Параллелизм**: 5 одновременных вкладок Playwright через Semaphore.
- ✅ **Кэширование**: In-memory кэш для словарей в `token_service.py`.
- ✅ **Глубина 0**: Возможность проверки одной страницы.
- ✅ **UX**: Интерактивные тултипы (Mantine Tooltip).
- ✅ **Буст скорости**: Общее ускорение в 14.7 раз (2.46 сек/стр).

### Версия 1.8.0 (2026-03-09) — Оптимизированная

### Версия 1.7.0 (2026-03-09)

**Удалено:**
- ❌ Скриншоты (для стабильности)

**Новые функции:**
- ✅ manage.py CLI
- ✅ SEO (react-helmet-async)
- ✅ Сворачиваемый сайдбар

### Версия 1.6.0 (Март 2026)

**Исправления:**
- ✅ Группировка одинаковых нарушений
- ✅ Сортировка таблицы
- ✅ Индекс БД

---

## 📞 Поддержка

### Документация

- `README.md` — основная документация
- `TESTING.md` — руководство по тестированию
- `TEST_PLAN.md` — план тестирования
- `DIAGNOSTIC_REPORT.md` — отчет диагностики

### Скрипты

- `full_diagnostic.py` — полная диагностика (7/7 проверок)
- `monitor_services.py` — мониторинг и перезапуск
- `backend/manage.py` — управление БД и словарями

### Контакты

- **Версия:** 1.13.0
- **Статус:** ✅ ГОТОВО К ПРОДАКШЕНУ
- **Последнее обновление:** 2026-03-23

---

**Сгенерировано:** 2026-03-23 00:00:00  
**Система:** LinguaCheck-RU v1.13.0 (Export & Data Quality)
