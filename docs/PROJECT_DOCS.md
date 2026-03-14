# 📚 Документация LinguaCheck-RU

**Версия:** 1.11.0  
**Дата:** 14 марта 2026

---

## 🎯 О проекте

**LinguaCheck-RU** — система автоматического контроля соблюдения требований к использованию русского языка в публичном пространстве (ФЗ №168-ФЗ).

### Основные возможности

- 🔍 **Сканирование сайтов** — проверка веб-ресурсов на соответствие нормам русского языка
- 📝 **Анализ текста** — проверка текстов и документов (TXT, DOCX, PDF)
- 📚 **Словари** — интеграция с нормативными словарями
- 🛡 **Исключения** — управление товарными знаками и глобальными исключениями

---

## 🚀 Быстрый старт

### Требования

- Node.js 18+
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

## 📁 Структура проекта

```
russian-lang/
├── src/                      # Frontend (React + TypeScript)
│   ├── pages/                # Страницы приложения
│   ├── components/           # Переиспользуемые компоненты
│   ├── utils/                # Утилиты (validation, sanitize, translations)
│   ├── test/                 # Frontend тесты (Vitest)
│   └── config/               # Конфигурация
├── backend/                  # Backend (FastAPI + Python)
│   ├── app/
│   │   ├── routers/          # API endpoints
│   │   ├── services/         # Бизнес-логика
│   │   ├── utils/            # Утилиты
│   │   └── tests/            # Backend тесты (pytest)
│   └── tests/
├── scripts/                  # Скрипты диагностики
├── docs/                     # Дополнительная документация
└── specs/                    # Спецификации
```

---

## 🧪 Тестирование

### Backend тесты

```bash
cd backend
python -m pytest tests/ -v
```

**Покрытие:** ~87% (131 тест)

### Frontend тесты

```bash
npm run test
```

**Покрытие:** 90+ тестов (utils + pages + app)

### E2E тесты

```bash
python -m pytest tests/test_e2e_playwright.py -v
```

---

## 🎨 Темы оформления

Приложение поддерживает светлую и темную темы:

- 🌞 **Светлая тема** — по умолчанию
- 🌙 **Темная тема** — переключатель в хедере

Все компоненты адаптированы для обеих тем.

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

## 📈 Производительность

### Оптимизация Frontend (v1.10.0)

- Bundle: 1.3MB → 630KB (**-53%**)
- Code Splitting: ~850KB lazy loading
- React.memo для ScanPage, TextPage

### Lightning Scan (v1.9.0)

- Скорость сканирования: 36с → 2.5с на страницу (**-93%**)
- Parallel Workers: 5 одновременных запросов
- In-Memory Caching: кэширование словарей

---

## 🐛 Известные проблемы

### Текущие ограничения

1. **Rate Limiting** — 5 сканирований в минуту (настраивается)
2. **Max Pages** — лимит 1000 страниц на сканирование
3. **Timeout** — 120с на сканирование одной страницы

### Планы развития

- [ ] Увеличение лимитов
- [ ] Пакетное сканирование
- [ ] Экспорт в CSV
- [ ] Интеграция с CMS

---

## 📞 Поддержка

### Документация

- [README.md](./README.md) — основная документация
- [SPECIFICATION.md](./SPECIFICATION.md) — спецификация API
- [OPTIMIZATIONS.md](./OPTIMIZATIONS.md) — руководство по оптимизации
- [AGENTS.md](./AGENTS.md) — руководство для AI-агентов

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

**Последнее обновление:** 14 марта 2026  
**Версия:** 1.11.0
