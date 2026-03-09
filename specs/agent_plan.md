# Agent Plan: LinguaCheck-RU

**Версия:** 1.6.0  
**Дата обновления:** 9 марта 2026  
**Статус:** ✅ Актуально

Требование: реализовывать код строго по спецификациям из папки `/specs`.

---

## ✅ Завершенные фазы

### Phase 1: Инфраструктура и БД

- [x] Создан docker-compose с:
  - PostgreSQL (Supabase)
  - Backend-service (Python + FastAPI)
- [x] Сгенерированы модели и миграции БД по `specs/data_model.md`
- [x] Применены миграции через Alembic

### Phase 2: Импорт словарей

- [x] Реализован `scripts/import_dictionaries.py`:
  - Вход: путь к PDF
  - Шаги: OCR → парсинг → нормализация → загрузка в `dictionary_words`
- [x] Реализовано хранение версий в `dictionary_versions`

### Phase 3: Морфология и анализ слов (pymorphy2/pymorphy3)

- [x] Модуль `core/analysis.py`:
  - Токенизация текста
  - Вызов `pymorphy3` для `normal_form` и `part_of_speech`
- [x] Сервис `services/token_service.py`:
  - Сопоставление с `dictionary_words`
  - Выставление статуса токенов
- [x] Сервис `services/violation_service.py`:
  - Создание записей `violations` при нарушениях

### Phase 4: Сканирование сайтов

- [x] `services/scan_service.py`:
  - Запуск и управление сканами (`start_scan`, статус)
- [x] `scrapers/web_scraper.py`:
  - Playwright-обход сайта
  - Извлечение текста и CSS (font-size, font-weight, color, background-color)

### Phase 5: Визуальное доминирование

- [x] `utils/css_visual.py`:
  - `compute_contrast_ratio(color, bg_color)`
  - `compute_visual_weight(font_size_px, font_weight, contrast_ratio)`
- [x] `services/visual_dominance_service.py`:
  - Поиск пар foreign/ru в одном контейнере
  - Применение правила `visual_weight_foreign > 1.5 * visual_weight_rus`
  - Создание `violations` типа `visual_dominance`

**Примечание:** Функционал удален из frontend (версия 1.6.0), доступен только в backend.

### Phase 6: API

- [x] Поднят FastAPI
- [x] Реализованы эндпоинты из `specs/api.md`:
  - `/api/v1/scan` — запуск сканирования
  - `/api/v1/scan/{id}` — статус и результаты
  - `/api/v1/scans` — история сканирований
  - `/api/v1/check_text` — проверка текста
  - `/api/v1/check_text/upload` — загрузка файлов
  - `/api/v1/trademarks` — управление брендами
  - `/api/v1/exceptions` — глобальные исключения
  - `/api/v1/dictionary_preview` — просмотр словарей
  - `/api/v1/health` — health check

### Phase 7: Frontend (React + Mantine)

- [x] Создано приложение React
- [x] Подключен Mantine UI v8
- [x] Реализованы страницы и компоненты по `specs/ui_design.md`:
  - `/` — Главная
  - `/scans` — Сканирование
  - `/history` — История
  - `/text` — Текст и файлы
  - `/dictionaries` — Словари
  - `/exceptions` — Исключения
- [x] Интеграция с API

### Phase 8: Тесты и отладка

- [x] Unit-тесты для:
  - Морфологии (pymorphy3)
  - Визуального веса
  - Парсера словарей
- [x] Интеграционные тесты:
  - `/api/v1/check_text`
  - `/api/v1/scan`
- [x] E2E тесты (Playwright):
  - `test_linguacheck.py` — проверка всех страниц
  - `test_final_check.py` — финальная валидация

### Phase 9: Аудит и UX/UI Рефакторинг

- [x] Проведен полный аудит приложения (168-ФЗ compliance check)
- [x] **История (/history)**:
  - Реализован автоматический поллинг статусов (каждые 15 сек)
  - Унифицирован дизайн кнопок через Tooltips и ActionIcons
  - Добавлены Empty States (заглушки) при отсутствии данных
  - Добавлена пагинация при >20 записей
- [x] **Сканирование (/scans)**:
  - Внедрена валидация URL на фронтенде
  - Улучшены Toast-уведомления
  - Добавлены Tooltip для всех полей и кнопок
  - Удалена кнопка «Все в бренды»
  - Упрощена таблица нарушений (удален visual_weight)
- [x] **Текст (/text)**:
  - Внедрено сохранение текста в `localStorage` (защита от потери)
  - Добавлен счетчик символов
  - Исправлена логика блокировки кнопки «Проверить сейчас»
- [x] **Доступность (WCAG 2.1 AA)**:
  - ARIA-labels для всех интерактивных иконок
  - Touch-цели 44×44px
  - Контраст текста 4.5:1 minimum
  - Reduced-motion поддержка

---

## 🔄 Текущие задачи

### Phase 10: Документация

- [x] Синхронизация `specs/` с текущим кодом
- [x] Создание `docs/` с полной документацией:
  - `product.md` — product specification
  - `api.md` — API specification (Swagger-style)
  - `ui_design.md` — UI design specification
  - `data_model.md` — data model specification
  - `security.md` — security & validation
  - `test_data.md` — test data & cases
  - `deployment.md` — deployment guide
  - `changelog.md` — changelog

### Phase 11: Production Ready

- [ ] HTTPS в production
- [ ] Аутентификация API (API keys)
- [ ] Мониторинг и алертинг
- [ ] Резервное копирование БД
- [ ] Оптимизация производительности (кэширование, CDN)

---

## 📋 Roadmap

### Q2 2026

- [ ] Интеграция с CI/CD (GitHub Actions)
- [ ] Автоматическое развертывание в production
- [ ] Мониторинг метрик (Prometheus + Grafana)

### Q3 2026

- [ ] Поддержка дополнительных форматов файлов (RTF, ODT)
- [ ] Массовая загрузка файлов (zip-архивы)
- [ ] API для внешних интеграций

### Q4 2026

- [ ] Машинное обучение для классификации нарушений
- [ ] Расширенные отчеты (аналитика, тренды)
- [ ] Мультиязычный интерфейс (EN, KZ)

---

*Документ синхронизирован с кодом 9 марта 2026*
