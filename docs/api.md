# API Specification: LinguaCheck-RU

**Версия:** 1.15.0
**Дата обновления:** 24 марта 2026
**Base URL:** `http://127.0.0.1:8000`
**Документация Swagger:** `http://127.0.0.1:8000/docs`

---

## 1. Сканирование сайтов

### POST `/api/v1/scan`

Запуск сканирования сайта.

**Request:**

```json
{
  "url": "https://example.com",
  "max_depth": 3,
  "max_pages": 500
}
```

**Response (200 OK):**

```json
{
  "scan_id": "4ee8a825-39b4-49cd-9271-4bb0a5311208",
  "status": "started"
}
```

**Коды ответов:**
| Код | Описание |
|-----|----------|
| 200 | Сканирование запущено |
| 400 | Неверный URL или параметры |
| 429 | Превышен лимит запросов (Rate Limit) |

---

### GET `/api/v1/scan/{scan_id}`

Получение статуса и результатов сканирования.

**Response (200 OK):**

```json
{
  "status": "completed",
  "target_url": "https://example.com",
  "summary": {
    "total_pages": 15,
    "pages_with_violations": 3,
    "total_violations": 12
  },
  "pages": [
    {
      "id": "page-uuid",
      "url": "https://example.com/about",
      "violations_count": 5
    }
  ],
  "violations": [
    {
      "id": "violation-uuid",
      "type": "foreign_word",
      "page_url": "https://example.com/about",
      "text_context": "Welcome to our company",
      "word": "Welcome",
      "normal_form": "welcome"
    }
  ]
}
```

**Статусы сканирования:**
| Статус | Описание |
|--------|----------|
| `started` | Сканирование запущено |
| `in_progress` | Идет обработка страниц |
| `completed` | Сканирование завершено |
| `failed` | Ошибка сканирования |
| `stopped` | Остановлено пользователем |

---

### GET `/api/v1/scan/{scan_id}/grouped`

Получение сгруппированных нарушений (версия 1.9.0+).

**Response (200 OK):**

```json
[
  {
    "word": "лайфстайл",
    "normal_form": "лайфстайл",
    "type": "foreign_word",
    "count": 30,
    "page_urls": [
      "https://example.com/page1",
      "https://example.com/page2"
    ]
  }
]
```

**Преимущества группировки:**
- Экономия трафика на 90%
- Удобный анализ частотных нарушений
- Быстрая загрузка frontend (~2с вместо ~30с)

---

### GET `/api/v1/scans`

Получение истории всех сканирований.

**Response (200 OK):**

```json
[
  {
    "id": "4ee8a825-39b4-49cd-9271-4bb0a5311208",
    "target_url": "https://example.com",
    "status": "completed",
    "started_at": "2026-03-09T08:11:34.922244Z",
    "finished_at": "2026-03-09T08:15:22.123456Z"
  }
]
```

---

### DELETE `/api/v1/scan/{scan_id}`

Удаление конкретного сканирования.

**Response (204 No Content)**

---

### DELETE `/api/v1/scans`

Очистка всей истории сканирований.

**Response (204 No Content)**

---

## 2. Проверка текста

### POST `/api/v1/check_text`

Проверка произвольного текста.

**Request:**

```json
{
  "text": "Я купил новую батарею для своего устройства",
  "format": "plain"
}
```

**Response (200 OK):**

```json
{
  "summary": {
    "total_tokens": 8,
    "violations_count": 0,
    "compliance_percent": 100.0
  },
  "violations": []
}
```

---

### POST `/api/v1/check_text/upload`

Загрузка файла для проверки (TXT, DOCX, PDF).

**Request (multipart/form-data):**

```
file: test_document.txt
```

**Response (200 OK):**

```json
{
  "summary": {
    "total_tokens": 150,
    "violations_count": 3,
    "compliance_percent": 98.0
  },
  "violations": [...]
}
```

**Коды ответов:**
| Код | Описание |
|-----|----------|
| 200 | Файл успешно обработан |
| 400 | Неверный формат файла |
| 413 | Файл слишком большой (>10 МБ) |

---

## 3. Товарные знаки

### GET `/api/v1/trademarks`

Получение списка всех зарегистрированных брендов.

**Response (200 OK):**

```json
[
  {
    "id": "trademark-uuid",
    "word": "CoffeeMaster",
    "normal_form": "coffeemaster"
  }
]
```

---

### POST `/api/v1/trademarks`

Добавление нового бренда. Слово автоматически нормализуется.

**Request:**

```json
{
  "word": "CoffeeMaster"
}
```

**Response (201 Created):**

```json
{
  "id": "trademark-uuid",
  "word": "CoffeeMaster",
  "normal_form": "coffeemaster"
}
```

**Коды ответов:**
| Код | Описание |
|-----|----------|
| 201 | Бренд успешно добавлен |
| 400 | Пустое слово или дубликат |

---

### DELETE `/api/v1/trademarks/{id}`

Удаление бренда из списка исключений.

**Response (204 No Content)**

---

## 4. Глобальные исключения

### GET `/api/v1/exceptions`

Получение списка всех глобальных исключений.

**Response (200 OK):**

```json
[
  {
    "id": "exception-uuid",
    "word": "gmp",
    "created_at": "2026-03-09T10:00:00Z"
  }
]
```

---

### POST `/api/v1/exceptions`

Добавление нового глобального исключения.

**Request:**

```json
{
  "word": "gmp"
}
```

**Response (201 Created):**

```json
{
  "id": "exception-uuid",
  "word": "gmp",
  "created_at": "2026-03-09T10:00:00Z"
}
```

---

### DELETE `/api/v1/exceptions/{id}`

Удаление глобального исключения.

**Response (204 No Content)**

---

## 5. Словари

### GET `/api/v1/dictionary_preview`

Предварительный просмотр словарей.

**Response (200 OK):**

```json
{
  "dictionary_versions": [
    {
      "name": "Orthographic",
      "version": "2024-01-15",
      "word_count": 120000
    },
    {
      "name": "ForeignWords",
      "version": "2024-01-15",
      "word_count": 5000
    }
  ]
}
```

---

## 6. Health Check

### GET `/api/v1/health`

Проверка работоспособности API.

**Response (200 OK):**

```json
{
  "status": "healthy"
}
```

---

## 7. Типы данных

### Violation

| Поле           | Тип            | Описание                 |
| -------------- | -------------- | ------------------------ |
| `id`           | string (UUID)  | Уникальный идентификатор |
| `type`         | string         | Тип нарушения            |
| `page_url`     | string \| null | URL страницы             |
| `text_context` | string         | Контекст нарушения       |
| `word`         | string \| null | Проблемное слово         |
| `normal_form`  | string \| null | Лемма слова              |

**Типы нарушений:**

- `foreign_word` — Иностранная лексика
- `no_russian_dub` — Отсутствие перевода
- `unrecognized_word` — Опечатка / Не распознано
- `trademark` — Товарный знак
- `possible_trademark` — Потенциальный бренд

### Page

| Поле               | Тип           | Описание                 |
| ------------------ | ------------- | ------------------------ |
| `id`               | string (UUID) | Уникальный идентификатор |
| `url`              | string        | URL страницы             |
| `violations_count` | int           | Количество нарушений     |

### ScanResult

| Поле         | Тип         | Описание            |
| ------------ | ----------- | ------------------- |
| `status`     | string      | Статус сканирования |
| `target_url` | string      | Целевой URL         |
| `summary`    | object      | Сводная статистика  |
| `pages`      | Page[]      | Список страниц      |
| `violations` | Violation[] | Список нарушений    |

### Trademark

| Поле          | Тип           | Описание                 |
| ------------- | ------------- | ------------------------ |
| `id`          | string (UUID) | Уникальный идентификатор |
| `word`        | string        | Оригинальное слово       |
| `normal_form` | string        | Нормализованная форма    |

### GlobalException

| Поле         | Тип               | Описание                 |
| ------------ | ----------------- | ------------------------ |
| `id`         | string (UUID)     | Уникальный идентификатор |
| `word`       | string            | Слово-исключение         |
| `created_at` | string (ISO 8601) | Дата добавления          |

---

## 8. Rate Limiting

| Endpoint             | Лимит              |
| -------------------- | ------------------ |
| `/api/v1/scan`       | 10 запросов/минуту |
| `/api/v1/check_text` | 20 запросов/минуту |
| Остальные            | 30 запросов/минуту |

**Ответ при превышении лимита (429 Too Many Requests):**

```json
{
  "detail": "Rate limit exceeded. Try again later."
}
```

---

## 9. CORS

**Разрешенные origin:**

- `http://localhost:5173` (development)
- Настраивается через `CORS_ORIGINS` в `.env`

**Разрешенные методы:** `GET`, `POST`, `DELETE`, `OPTIONS`

**Credentials:** `allowed`

---

## 10. Лимиты (версия 1.14.0)

| Параметр | Значение | Настройка |
|----------|----------|-----------|
| Макс. глубина сканирования | 5 уровней | `max_depth` |
| Макс. страниц за сканирование | 1000 | `max_pages` |
| Лимит нарушений в ответе | 1000 | `?limit=1000` |
| Макс. размер текста | 1 млн символов | - |
| Макс. размер файла | 10 МБ | - |

---

## 11. Новые функции (версия 1.14.0)

### Группировка нарушений (1.9.0)

**Endpoint:** `GET /api/v1/scan/{id}/grouped`

**Пример ответа:**
```json
[
  {
    "word": "нутриентах",
    "count": 80,
    "type": "unrecognized_word",
    "page_urls": ["https://example.com/page1"]
  }
]
```

### Smart Crawler (1.13.0)

- Автоматическое игнорирование скрытых блоков (`aria-hidden="true"`)
- Фильтрация иноязычных URL
- Safe Tokenizer: исключение технических терминов (например, `drug` в URL)

### Reliable Export (1.13.0)

- Корректные расширения файлов: `.xlsx`, `.pdf`
- Префиксы файлов: `linguacheck_{timestamp}`
- Исправлены заголовки `Content-Disposition`

---

_Документ синхронизирован с кодом 23 марта 2026 (версия 1.14.0)_
