# 📚 Документация LinguaCheck-RU

**Версия:** 1.15.0
**Дата:** 24 марта 2026

---

## 🎯 О проекте

**LinguaCheck-RU** — система автоматического контроля соблюдения требований к использованию русского языка в публичном пространстве (ФЗ №168-ФЗ).

### Основные возможности

- 🔍 **Сканирование сайтов** — проверка веб-ресурсов на соответствие нормам русского языка
- 📝 **Анализ текста** — проверка текстов и документов (TXT, DOCX, PDF)
- 📚 **Словари** — интеграция с нормативными словарями
- 🛡 **Исключения** — управление товарными знаками и глобальными исключениями
- 📊 **Экспорт** — выгрузка отчетов в Excel (XLSX) и PDF

---

## 🚀 Быстрый старт

### Требования

- Node.js 20.19+ (для Vite 8)
- Python 3.12+
- PostgreSQL (Supabase)

### Установка

```bash
# Frontend
npm install
npm run dev

# Backend
cd backend
pip install -r requirements.txt
python run.py
```

### URLs

- Frontend: http://127.0.0.1:5173
- Backend API: http://127.0.0.1:8000
- Swagger Docs: http://127.0.0.1:8000/docs

---

## 📁 Структура документации

### Основная документация

| Файл | Описание | Статус |
|------|----------|--------|
| [`README.md`](../README.md) | Входная точка проекта | ✅ Актуален (1.14.0) |
| [`SPECIFICATION.md`](../SPECIFICATION.md) | Техническая спецификация | ✅ Актуален (1.14.0) |
| [`AGENTS.md`](../AGENTS.md) | Правила для ИИ-агентов | ✅ Актуален (1.14.0) |

### Техническая документация (`docs/`)

| Файл | Описание | Версия | Статус |
|------|----------|--------|--------|
| [`api.md`](./api.md) | API specification (Swagger-style) | 1.14.0 | ✅ Актуален |
| [`changelog.md`](./changelog.md) | История изменений | 1.14.0 | ✅ Актуален |
| [`data_model.md`](./data_model.md) | Data model specification | 1.7.0 | ⚠️ Устарел |
| [`deployment.md`](./deployment.md) | Deployment guide | 1.7.0 | ⚠️ Устарел |
| [`OPTIMIZATIONS.md`](./OPTIMIZATIONS.md) | Руководство по оптимизации | 1.14.0 | ✅ Актуален |
| [`product.md`](./product.md) | Product specification | 1.14.0 | ✅ Актуален |
| [`security.md`](./security.md) | Security & validation spec | 1.7.0 | ⚠️ Устарел |
| [`test_data.md`](./test_data.md) | Test data specification | 1.6.0 | ⚠️ Устарел |
| [`TEST_REPORT.md`](./TEST_REPORT.md) | Отчет о тестировании | 1.14.0 | ✅ Актуален |
| [`ui_design.md`](./ui_design.md) | UI design specification | 1.6.0 | ⚠️ Устарел |

### Деплой (`docs/`)

| Файл | Описание | Версия | Статус |
|------|----------|--------|--------|
| [`DEPLOY_RENDER.md`](./DEPLOY_RENDER.md) | Деплой на Render.com | 1.11.0 | ⚠️ Устарел |

### Архивная документация (`docs/`)

| Файл | Описание | Версия | Статус |
|------|----------|--------|--------|
| [`POLISHING_COMPLETE.md`](./POLISHING_COMPLETE.md) | Отчет о полировке v1.12.0 | 1.12.0 | 📜 Архив |
| [`POLISHING_REPORT.md`](./POLISHING_REPORT.md) | Отчет об улучшениях v1.12.0 | 1.12.0 | 📜 Архив |
| [`POLISHING_PLAN.md`](./POLISHING_PLAN.md) | План полировки v1.12.0 | 1.12.0 | 📜 Архив |
| [`SUMMARY.md`](./SUMMARY.md) | Краткое резюме проекта | 1.13.0 | ⚠️ Устарел |

---

## 🧪 Тестирование

### Backend тесты

```bash
cd backend
python -m pytest tests/ -v
```

**Покрытие:** ~91% (108 тестов)

### Frontend тесты

```bash
npm run test
```

**Покрытие:** ~45% (92 теста)

### E2E тесты

```bash
python -m pytest tests/test_e2e_playwright.py -v
```

**Покрытие:** ~75% (28 тестов)

---

## 🎨 Темы оформления

Приложение поддерживает светлую и темную темы:

- 🌞 **Светлая тема** — по умолчанию
- 🌙 **Темная тема** — переключатель в хедере

Все компоненты адаптированы для обеих тем (контраст 8.2:1).

---

## 📊 Страницы приложения

| Страница | URL | Описание |
|----------|-----|----------|
| Главная | `/` | Обзор возможностей, быстрый запуск |
| Сканирование | `/scans` | Проверка сайтов, результаты, фильтры |
| История | `/history` | Список прошлых сканирований |
| Текст/Файлы | `/text` | Проверка текста и загрузка файлов |
| Словари | `/dictionaries` | Информация о нормативных словарях |
| Исключения | `/exceptions` | Управление глобальными исключениями |

---

## 🔧 Конфигурация

### Frontend (.env)

```env
VITE_API_URL=http://127.0.0.1:8000
```

### Backend (.env)

```env
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/dbname
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
REDIS_URL=redis://localhost:6379/0
```

---

## 📈 Производительность (v1.14.0)

### Оптимизация Frontend

- Bundle: 1.3MB → 630KB (**-53%**)
- Code Splitting: ~850KB lazy loading
- React.memo для ScanPage, TextPage

### Lightning Scan (v1.9.0)

- Скорость сканирования: 36с → 2.5с на страницу (**-93%**)
- Parallel Workers: 5 одновременных запросов
- In-Memory Caching: кэширование словарей

### Vite 8 Migration (v1.14.0)

- Время сборки: ~30с → ~3с (**-90%**)
- Rolldown (Rust bundler) вместо esbuild + Rollup
- Меньше зависимостей: -211 пакетов

---

## 🐛 Известные проблемы

### Текущие ограничения

1. **Frontend тесты** — покрытие 45%, требуют доработки
2. **Rate Limiting** — 10 сканирований в минуту (настраивается)
3. **Max Pages** — лимит 1000 страниц на сканирование
4. **Timeout** — 120с на сканирование одной страницы

---

## 📞 Поддержка

### Документация

- [`README.md`](../README.md) — основная документация
- [`SPECIFICATION.md`](../SPECIFICATION.md) — спецификация API
- [`OPTIMIZATIONS.md`](./OPTIMIZATIONS.md) — руководство по оптимизации
- [`TEST_REPORT.md`](./TEST_REPORT.md) — отчет о тестировании
- [`AGENTS.md`](../AGENTS.md) — руководство для AI-агентов

### Скрипты диагностики

```bash
# Проверка сервисов
python scripts/monitor_services.py check

# Полная диагностика
python scripts/full_diagnostic.py
```

---

## 📝 Лицензия

Внутренний проект для личного использования (не коммерческий).

---

**Последнее обновление:** 23 марта 2026  
**Версия:** 1.14.0 (Vite 8 Migration)
