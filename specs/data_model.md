# Data Model Spec: LinguaCheck‑RU

## 1. Таблицы

### 1.1. dictionary_words

- `id` (PK)
- `word` (text)
- `normal_form` (text)
- `part_of_speech` (text, "NOUN" / "VERB" / "ADJ" / "ADV" / "OTHER")
- `source_dictionary` (text: "Orthographic" | "ForeignWords" | "Explanatory" | "Orthoepic")
- `is_foreign` (boolean)
- `version` (text, YYYY-MM-DD)

Индексы:

- `idx_dictionary_words_normal_form` on (`normal_form`)

---

### 1.2. projects

- `id` (PK)
- `name` (text, nullable)
- `created_at` (timestamp)

---

### 1.3. scans

- `id` (PK)
- `project_id` (FK → projects.id)
- `target_url` (text, nullable)
- `started_at` (timestamp)
- `finished_at` (timestamp, nullable)
- `status` (text: "started" | "in_progress" | "completed" | "failed")
- `max_depth` (int)
- `max_pages` (int)

---

### 1.4. pages

- `id` (PK)
- `scan_id` (FK → scans.id)
- `url` (text)
- `depth` (int)
- `status` (text: "ok" | "timeout" | "blocked")
- `content_hash` (text)
- `idx_pages_scan_id` on (`scan_id`)

---

### 1.5. tokens

- `id` (PK)
- `page_id` (FK → pages.id, nullable)
- `text_id` (FK, nullable — под будущий отдельный текстовый объект)
- `raw_text` (text)
- `normal_form` (text)
- `part_of_speech` (text)
- `is_foreign` (boolean)
- `is_trademark` (boolean)
- `language_hint` (text: "ru" | "en" | "other")

Индексы:

- `idx_tokens_normal_form` on (`normal_form`)
- `idx_tokens_page_id` on (`page_id`)

---

### 1.6. violations

- `id` (PK)
- `token_id` (FK → tokens.id, nullable)
- `page_id` (FK → pages.id, nullable)
- `text_id` (FK, nullable)
- `type` (text: "foreign_word" | "no_russian_dub" | "unrecognized_word" | "trademark" | "possible_trademark")
- `details` (JSONB)
- `created_at` (timestamp)
- `idx_violations_page_id` on (`page_id`)
- `idx_violations_text_id` on (`text_id`)

---

### 1.7. trademarks

- `id` (PK)
- `word` (text)
- `normal_form` (text)

Индексы:

- `idx_trademarks_normal_form` on (`normal_form`)

---

### 1.8. dictionary_versions

- `id` (PK)
- `name` (text)
- `version` (text)
- `pdf_path` (text)
- `processed_at` (timestamp)

---

## 2. Логика фильтрации (Phase 14)

Для минимизации ложных срабатываний применяется:

- **Технический фильтр**: Из анализа исключаются буквенные компоненты Email и URL (нормализованные части технических строк).
- **Минимальная длина**: Одиночные кириллические буквы игнорируются при поиске неизвестных слов (`unrecognized_word`), чтобы избежать ложноположительных срабатываний на сокращения типа "р-з".
