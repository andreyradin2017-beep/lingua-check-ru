# API Spec: LinguaCheck‑RU

## 1. Сканирование сайта

### POST `/api/v1/scan`

Запуск сканирования сайта.

Request (JSON):

- `url`: string, required
- `max_depth`: int, default 3
- `max_pages`: int, default 500, max 1000

Response (JSON):

- `scan_id`: string
- `status`: "started"

### GET `/api/v1/scan/{scan_id}`

Получение статуса и результатов сканирования.

Response (JSON):

- `status`: "started" | "in_progress" | "completed" | "failed"
- `summary`:
  - `total_pages`: int
  - `pages_with_violations`: int
  - `total_violations`: int
- `pages`: Page[]
- `violations`: Violation[]

---

## 2. Проверка текста

### POST `/api/v1/check_text`

Проверка произвольного текста.

Request (JSON):

- `text`: string, required
- `format`: "plain" | "html", default "plain"

Response (JSON):

- `violations`: Violation[]
- `summary`:
  - `total_tokens`: int
  - `violations_count`: int
  - `compliance_percent`: float (0–100)

---

## 3. Словари и статус

### GET `/api/v1/dictionary_preview`

Предварительный просмотр словарей.

Response (JSON):

- `dictionary_versions`: [
  {
  `name`: string,
  `version`: string (YYYY-MM-DD),
  `word_count`: int
  }
  ]

### GET `/api/v1/health`

Простой health‑check.

Response:

- `{ "status": "healthy" }`

---

## 4. Типы данных

### Page

- `id`: string
- `url`: string
- `depth`: int
- `tokens_count`: int
- `violations_count`: int

### Token (внутренний тип, в основной API не обязательно возвращать полностью)

- `raw_text`: string
- `normal_form`: string
- `part_of_speech`: string
- `is_foreign`: bool
- `is_trademark`: bool
- `status`: "allowed" | "potential_violation"

### Violation

- `id`: string
- `type`: "foreign_word" | "no_russian_dub" | "unrecognized_word" | "trademark" | "possible_trademark"
- `page_url`: string | null
- `text_context`: string
- `word`: string | null
- `normal_form`: string | null
- `details`: object (произвольные поля: word, normal_form, text_context, etc.)

---

## 5. Товарные знаки

### GET `/api/v1/trademarks`

Получить список всех зарегистрированных брендов.

Response (JSON):

- `List[Trademark]`

### POST `/api/v1/trademarks`

Добавить новый бренд. При добавлении слово автоматически нормализуется.

Request (JSON):

- `word`: string, required

Response (JSON):

- `id`: string (uuid)
- `word`: string
- `normal_form`: string

### DELETE `/api/v1/trademarks/{id}`

Удалить бренд из списка исключений.

Response: `204 No Content`
