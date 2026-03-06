# Agent Plan: LinguaCheck‑RU

Требование: реализовывать код строго по спецификациям из папки `/specs`.

## Phase 1: Инфраструктура и БД

- Создать docker-compose с:
  - PostgreSQL,
  - backend‑service (Python + FastAPI).
- Сгенерировать модели и миграции БД по `specs/data_model.md`.

## Phase 2: Импорт словарей

- Реализовать `scripts/import_dictionaries.py`:
  - вход: путь к PDF;
  - шаги: OCR → парсинг → нормализация → загрузка в `dictionary_words`.
- Реализовать хранение версий в `dictionary_versions`.

## Phase 3: Морфология и анализ слов (pymorphy2)

- Модуль `core/analysis.py`:
  - токенизация текста,
  - вызов `pymorphy2` для `normal_form` и `part_of_speech`.
- Сервис `services/token_service.py`:
  - сопоставление с `dictionary_words`,
  - выставление статуса токенов.
- `services/violation_service.py`:
  - создание записи `violations` при нарушениях.

## Phase 4: Сканирование сайтов

- `services/scan_service.py`:
  - запуск и управление сканами (`start_scan`, статус).
- `scrapers/web_scraper.py`:
  - Playwright‑обход сайта,
  - извлечение текста и CSS (font-size, font-weight, color, background-color).

## Phase 5: Визуальное доминирование

- `utils/css_visual.py`:
  - `compute_contrast_ratio(color, bg_color)`,
  - `compute_visual_weight(font_size_px, font_weight, contrast_ratio)`.
- `services/visual_dominance_service.py`:
  - поиск пар foreign/ru в одном контейнере,
  - применение правила visual_weight_foreign > 1.5 \* visual_weight_rus,
  - создание `violations` типа `visual_dominance`.

## Phase 6: API

- Поднять FastAPI,
- Реализовать эндпоинты из `specs/api.md`,
- Pydantic‑схемы для запросов/ответов.

## Phase 7: Frontend (React + Mantine)

- Создать приложение React,
- Подключить Mantine UI,
- Реализовать страницы и компоненты по `specs/ui_design.md`,
- Интегрировать с API.

## Phase 8: Тесты и отладка

- Unit‑тесты для:
  - морфологии (pymorphy2),
  - визуального веса,
  - парсера словарей.
- Интеграционные тесты:
  - `/api/v1/check_text`,
  - `/api/v1/scan`.
