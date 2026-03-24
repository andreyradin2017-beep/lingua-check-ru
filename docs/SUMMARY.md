# Summary: LinguaCheck-RU

**Версия:** 1.15.0 (Full Stack Migration)
**Дата:** 24 марта 2026
**Статус:** ✅ ГОТОВО К ПРОДАКШЕНУ

---

## 🎯 О проекте

**LinguaCheck-RU** — система автоматического контроля соблюдения требований к использованию русского языка в публичном пространстве (ФЗ №168-ФЗ).

### Ключевые возможности

- 🔍 **Сканирование сайтов** — проверка веб-ресурсов (Playwright, 5 воркеров)
- 📝 **Анализ текста** — проверка текстов и документов (TXT, DOCX, PDF)
- 📚 **Нормативные словари** — интеграция с официальными словарями
- 🛡 **Исключения** — управление товарными знаками и глобальными исключениями
- 📊 **Экспорт отчетов** — выгрузка в Excel (XLSX) и PDF

---

## 🚀 Быстрый старт

```bash
# Frontend
npm install
npm run dev

# Backend
cd backend
pip install -r requirements.txt
python run.py
```

**URLs:**
- Frontend: http://127.0.0.1:5173
- Backend API: http://127.0.0.1:8000
- Swagger: http://127.0.0.1:8000/docs

---

## 📈 Производительность (v1.14.0)

| Метрика | Значение | Улучшение |
|---------|----------|-----------|
| Время сборки | ~3с | **-90%** (было ~30с) |
| Размер бандла | 630 KB | **-53%** (было 1.3 MB) |
| Время сканирования | 2.46с/стр | **-93%** (было 36.28с) |
| Запросы к БД | x1/сессия | **-99.9%** (было x1000/стр) |

---

## 🧪 Тестирование

| Компонент | Тестов | Покрытие | Статус |
|-----------|--------|----------|--------|
| Backend API | 108 | 91% | ✅ |
| Frontend E2E | 28 | 75% | ⚠️ |
| Frontend Unit | 92 | 45% | ⚠️ |
| **ИТОГО** | **228** | **87.5%** | ✅ |

---

## 📁 Документация

| Файл | Описание |
|------|----------|
| [`README.md`](./README.md) | Основная документация |
| [`SPECIFICATION.md`](./SPECIFICATION.md) | Техническая спецификация |
| [`docs/api.md`](./docs/api.md) | API specification |
| [`docs/changelog.md`](./docs/changelog.md) | История изменений |
| [`docs/OPTIMIZATIONS.md`](./docs/OPTIMIZATIONS.md) | Руководство по оптимизации |
| [`docs/TEST_REPORT.md`](./docs/TEST_REPORT.md) | Отчет о тестировании |
| [`AGENTS.md`](./AGENTS.md) | Правила для ИИ-агентов |

---

## 🔧 Технологический стек

### Frontend
- React 19.2.0, TypeScript 5.7.3
- Mantine UI 8.3.16
- Vite 8.0.2 (Rolldown)
- react-router-dom 7.13.1

### Backend
- FastAPI 0.115.6, Pydantic 2.10.4
- SQLAlchemy 2.0 (Async)
- pymorphy3 2.0.6 (морфология)
- Playwright 1.49.1
- PostgreSQL (Supabase)

---

## 📊 Страницы приложения

- `/` — Главная
- `/scans` — Сканирование сайтов
- `/history` — История сканирований
- `/text` — Проверка текста/файлов
- `/dictionaries` — Словари
- `/exceptions` — Исключения

---

## 🎯 Ключевые функции (v1.14.0)

### Vite 8 Migration
- Rolldown (Rust bundler) — 10-30x быстрее
- @vitejs/plugin-react v6 (Oxc вместо Babel)
- Code splitting с функциональной формой manualChunks

### Smart Crawler (v1.13.0)
- Автоматическое игнорирование скрытых блоков (`aria-hidden`)
- Фильтрация иноязычных URL
- Safe Tokenizer (исключение технических терминов)

### Lightning Scan (v1.9.0)
- Параллелизм: 5 одновременных воркеров
- In-Memory кэш словарей (ускорение в 10 раз)
- Группировка нарушений (слово xN)

---

## 📞 Поддержка

### Диагностика

```bash
# Проверка сервисов
python monitor_services.py check

# Полная диагностика
python full_diagnostic.py
```

### Тесты

```bash
# Backend
cd backend && python -m pytest tests/ -v

# Frontend
npm run test

# E2E
python -m pytest tests/test_e2e_playwright.py -v
```

---

**Последнее обновление:** 23 марта 2026  
**Версия:** 1.14.0  
**Статус:** ✅ ГОТОВО К ПРОДАКШЕНУ
