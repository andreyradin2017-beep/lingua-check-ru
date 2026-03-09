# LinguaCheck-RU

Система автоматического контроля соблюдения требований к использованию русского языка в публичном пространстве (ФЗ №168-ФЗ).

## 📋 О проекте

LinguaCheck-RU avtomaticheski proveryayet sayty i teksty na sootvetstvie trebovaniyam Federalnogo zakona №168-FZ o zashchite russkogo yazyka:
- Prioritet russkogo yazyka v publichnom prostranstve
- Otsutstvie inostrannykh slov bez kirillicheskogo soprovozhdeniya
- Tekstovyy analiz narusheniy

**Версия:** 1.6.0
**Последнее обновление:** 8 марта 2026

## 🛠 Технологический стек

| Компонент | Технологии |
|-----------|------------|
| **Frontend** | React 19, TypeScript, Mantine UI, Vite, React Router |
| **Backend** | FastAPI, SQLAlchemy (Async), Pydantic v2 |
| **Анализ текста** | pymorphy3 (морфология), Playwright (сканирование) |
| **База данных** | PostgreSQL (Supabase) |
| **Экспорт** | jsPDF, XLSX, PapaParse (CSV) |

## 🚀 Запуск локально

### Предварительные требования

- Node.js 18+
- Python 3.12+
- Playwright

### Фронтенд

```bash
npm install
npm run dev
```

Открыть http://localhost:5173

### Бэкенд

```bash
cd backend
pip install -r requirements.txt
playwright install chromium
python run.py
```

Открыть http://127.0.0.1:8000/docs (Swagger UI)

---

## 📜 Скрипты

| Команда | Описание |
|---------|----------|
| `npm run dev` | Запуск frontend в режиме разработки |
| `npm run build` | Сборка проекта для продакшена |
| `npm run lint` | Проверка ESLint |
| `npm run lint:css` | Проверка stylelint |
| `npm run preview` | Предпросмотр продакшен-сборки |

---

## 📡 API Endpoints

### Сканирование сайтов

| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | `/api/v1/scan` | Запустить сканирование сайта |
| GET | `/api/v1/scan/{id}` | Получить статус и результаты |
| GET | `/api/v1/scans` | История сканирований |
| DELETE | `/api/v1/scan/{id}` | Удалить сканирование |
| DELETE | `/api/v1/scans` | Очистить историю |

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

---

## 📊 Страницы приложения

| Страница | URL | Описание |
|----------|-----|----------|
| Главная | `/` | Обзор возможностей, быстрый запуск |
| Сканирование | `/scans` | Проверка сайтов, результаты, фильтры |
| История | `/history` | Список прошлых сканирований |
| Текст/Файлы | `/text` | Проверка текста и загрузка файлов |
| Словари | `/dictionaries` | Информация о нормативных словарях |

---

## 🔧 Конфигурация

### Переменные окружения (backend/.env)

```env
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/dbname
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
MAX_DEPTH_LIMIT=5
MAX_PAGES_LIMIT=500
MAX_FILE_SIZE_MB=10
```

### Переменные окружения (frontend/.env)

```env
VITE_API_URL=http://127.0.0.1:8000
```

---

## 📝 История изменений

### Версия 1.6.0 (Март 2026)

**Новые функции:**
- ✅ Группировка одинаковых нарушений (B1)
- ✅ Сортировка таблицы нарушений (C2)
- ✅ Дополнительный индекс БД (C3)
- ✅ Исправлен горизонтальный скролл на мобильных (A1)

**Исправления:**
- ✅ Ошибки TypeScript в HistoryPage.tsx
- ✅ Совместимость с Mantine 8

### Версия 1.5.3 (Март 2026)

**Оптимизация:**
- ✅ Удалено визуальное доминирование (избыточные нарушения)
- ✅ Polling оптимизирован: 3с (сканирование), 15с (история)
- ✅ Увеличен чанк вставки нарушений: 100 → 200
- ✅ Добавлен debounce для поиска: 300мс
- ✅ Ограничение отображения нарушений: max 500

**Исправления:**
- ✅ Исправлено падение frontend при больших списках
- ✅ Удалены поля `visual_weight_foreign` и `visual_weight_rus`
- ✅ Обновлена документация

### Версия 1.4.0 (Март 2026)

**Безопасность:**
- ✅ XSS защита через санитизацию HTML
- ✅ Rate limiting для API endpoints
- ✅ Валидация URL на frontend и backend
- ✅ Лимит размера текста (1 млн символов)

**Производительность:**
- ✅ Кэширование морфологического анализа (10000 слов)
- ✅ Увеличен чанк вставки нарушений (20 → 100)
- ✅ Увеличен timeout Playwright (60с → 120с)

**Надёжность:**
- ✅ Обработка ошибок при загрузке файлов
- ✅ Инвалидация кэша словарей
- ✅ Индексация БД для ускорения поиска
- ✅ Централизованная конфигурация API

**Новые утилиты:**
- `src/utils/url.ts` — валидация URL
- `src/utils/sanitize.ts` — санитизация HTML
- `src/utils/translations.ts` — перевод статусов
- `src/config/api.ts` — конфигурация API

### Версия 1.3.0 (Январь 2026)

- Базовая функциональность сканирования
- Проверка текста и файлов
- Управление товарными знаками
- Экспорт в Excel/PDF

---

## 📝 Лицензия

Внутренний проект для личного использования (не коммерческий).
