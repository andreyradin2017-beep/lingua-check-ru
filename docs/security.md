# Security & Validation Specification

**Версия:** 1.15.0
**Дата обновления:** 24 марта 2026

---

## 1. Валидация ввода

### 1.1. URL

**Требования:**
```typescript
const urlPattern = /^(https?):\/\/[^\s/$.?#].[^\s]*$/i;
```

| Проверка | Реализация | Сообщение об ошибке |
|----------|------------|---------------------|
| Протокол | `http://` или `https://` | «Укажите полный URL (с http:// или https://)» |
| Запрет схем | Блокировка `javascript:`, `data:` | «Недопустимый протокол» |
| Валидность домена | RegExp + URL constructor | «Неверный формат URL» |

**Frontend (utils/url.ts):**
```typescript
export function validateUrl(url: string): string | null {
  if (!url.trim()) return 'URL не может быть пустым';

  if (!/^https?:\/\//i.test(url)) {
    return 'Укажите полный URL (с http:// или https://)';
  }

  try {
    new URL(url);
    return null;
  } catch {
    return 'Неверный формат URL';
  }
}
```

**Backend (Pydantic):**
```python
from pydantic import field_validator

class ScanRequest(BaseModel):
    url: str
    max_depth: int = 3
    max_pages: int = 500

    @field_validator('url')
    @classmethod
    def validate_url(cls, v: str) -> str:
        if not v.startswith(('http://', 'https://')):
            raise ValueError('URL должен начинаться с http:// или https://')
        if v.startswith(('javascript:', 'data:')):
            raise ValueError('Недопустимый протокол')
        return v
```

---

### 1.2. Параметры сканирования

| Параметр | Тип | Мин | Макс | Default |
|----------|-----|-----|------|---------|
| `max_depth` | int | 1 | 5 | 3 |
| `max_pages` | int | 1 | 1000 | 500 |

**Backend:**
```python
from pydantic import Field

class ScanRequest(BaseModel):
    max_depth: int = Field(default=3, ge=1, le=5)
    max_pages: int = Field(default=500, ge=1, le=1000)
```

---

### 1.3. Файлы

**Разрешенные форматы:**
| Формат | Расширения | MIME type |
|--------|------------|-----------|
| Text | `.txt` | `text/plain` |
| Word | `.docx` | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` |
| PDF | `.pdf` | `application/pdf` |

**Ограничения:**
```python
MAX_FILE_SIZE_MB = 10
ALLOWED_EXTENSIONS = {'.txt', '.docx', '.pdf'}
```

**Frontend:**
```tsx
<FileButton
  onChange={onFileUpload}
  accept=".txt,.docx,.pdf"
/>
```

---

### 1.4. Текст

**Ограничения:**
```python
MAX_TEXT_LENGTH = 1_000_000  # 1 млн символов
```

**Backend:**
```python
from pydantic import Field

class TextCheckRequest(BaseModel):
    text: str = Field(..., max_length=1_000_000)
    format: Literal['plain', 'html'] = 'plain'
```

---

## 2. Безопасность API

### 2.1. CORS

**Конфигурация:**
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,  # ['http://localhost:5173']
    allow_credentials=True,
    allow_methods=['GET', 'POST', 'DELETE', 'OPTIONS'],
    allow_headers=['*'],
)
```

**Environment (.env):**
```env
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

---

### 2.2. Rate Limiting

**Библиотека:** `slowapi`

**Лимиты:**
| Endpoint | Лимит | Окно |
|----------|-------|------|
| `/api/v1/scan` | 10 | 1 минута |
| `/api/v1/check_text` | 20 | 1 минута |
| Остальные | 30 | 1 минута |

**Реализация:**
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post('/api/v1/scan')
@limiter.limit('10/minute')
async def scan(request: Request, data: ScanRequest):
    ...
```

**Ответ при превышении (429):**
```json
{
  "detail": "Rate limit exceeded. Try again later."
}
```

---

### 2.3. XSS Защита

**Frontend (utils/sanitize.ts):**
```typescript
export function sanitizeText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
```

**Backend:**
```python
import html

def sanitize_html(text: str) -> str:
    return html.escape(text)
```

---

### 2.4. Валидация путей сканирования

**Защита от выхода за домен:**
```python
from urllib.parse import urlparse

def is_same_domain(base_url: str, target_url: str) -> bool:
    base = urlparse(base_url)
    target = urlparse(target_url)
    return base.netloc == target.netloc
```

**Запрет локальных адресов:**
```python
import ipaddress

def is_private_ip(hostname: str) -> bool:
    try:
        ip = ipaddress.ip_address(hostname)
        return ip.is_private
    except ValueError:
        return False
```

---

## 3. Ограничения сканирования

### 3.1. Глубина и страницы

| Параметр | Значение | Обоснование |
|----------|----------|-------------|
| `max_depth` | 5 | Достаточно для большинства сайтов |
| `max_pages` | 1000 | Защита от бесконечного сканирования |
| `timeout_per_page` | 120с | Защита от зависаний |

---

### 3.2. Роботы.txt

**Уважение к robots.txt:**
```python
from urllib.robotparser import RobotFileParser

def can_fetch(robots_url: str, user_agent: str, url: str) -> bool:
    rp = RobotFileParser()
    rp.set_url(robots_url)
    rp.read()
    return rp.can_fetch(user_agent, url)
```

**User-Agent:** `LinguaCheck-RU/1.14.0`

---

## 4. Smart Crawler (версия 1.13.0+)

### 4.1. aria-hidden фильтрация

**Игнорирование скрытых блоков:**
```python
# Playwright: игнорировать элементы с aria-hidden="true"
const content = await page.content();
// Фильтрация скрытых элементов
```

### 4.2. URL фильтрация

**Исключение иноязычных доменов:**
```python
def is_foreign_domain(url: str, base_domain: str) -> bool:
    parsed = urlparse(url)
    return base_domain not in parsed.netloc
```

### 4.3. Safe Tokenizer

**Исключение технических терминов:**
```python
_SAFE_TOKENS = {
    "drug",  # Технический термин, не нарушение
    "javascript", "typescript",
    "elementbytagname", "getelementsbytagname",
    # ... другие технические термины
}
```

---

## 5. Защита данных

### 5.1. Хранение данных

**Пути:**
- Скриншоты: удалены в версии 1.7.0
- Статические файлы: `backend/static/`

**Очистка:**
```python
# Удаление старых сканирований
import shutil

def delete_scan_data(scan_id: str):
    # Удаление данных сканирования
    pass
```

---

### 5.2. Персональные данные

**Не сохраняются:**
- Email адреса (нормализуются)
- IP адреса пользователей
- Cookies сессий

**Логирование:**
```python
import logging

logger = logging.getLogger(__name__)

# Не логировать чувствительные данные
logger.info(f'Scan started: {scan_id}')  # OK
logger.info(f'Scan URL: {url}')  # OK
# logger.info(f'User email: {email}')  # ЗАПРЕЩЕНО
```

---

## 6. Кэширование (версия 1.9.0+)

### 6.1. In-Memory Cache

**token_service.py:**
```python
_WORDS_CACHE: dict[str, set[str]] = {}
_TRADEMARKS_CACHE: set[str] = set()
_EXCEPTIONS_CACHE: set[str] = set()
_CACHE_INITIALIZED = False
```

**Преимущества:**
- Запросы к БД: x1/сессия (было x1000/стр)
- Ускорение: в 10 раз

### 6.2. Redis Cache (опционально)

**redis_service.py:**
```python
await redis_service.set("lingua:exceptions", list(exceptions))
cached = await redis_service.get("lingua:exceptions")
```

---

## 7. Чек-лист безопасности

- [x] Валидация URL (протокол, схема)
- [x] Rate limiting (slowapi)
- [x] CORS (только разрешенные origin)
- [x] XSS защита (sanitize)
- [x] Ограничение размера файлов (10 МБ)
- [x] Ограничение длины текста (1 млн)
- [x] Защита от локальных запросов
- [x] Smart Crawler (aria-hidden, URL фильтрация)
- [x] Safe Tokenizer (технические термины)
- [ ] Аутентификация API (Future)
- [ ] HTTPS в production (Deployment)

---

*Документ синхронизирован с кодом 23 марта 2026 (версия 1.14.0)*
