# Deployment Guide: LinguaCheck-RU

**Версия:** 1.15.0 (Full Stack Migration)
**Дата обновления:** 24 марта 2026

---

## 1. Архитектура

```mermaid
flowchart TB
    subgraph Frontend
        A[React App] --> B[Vite Dev Server]
        A --> C[Production Build]
    end

    subgraph Backend
        D[FastAPI] --> E[Uvicorn]
        E --> F[Playwright]
        E --> G[Pymorphy3]
    end

    subgraph Database
        H[(PostgreSQL)]
        H --> I[Supabase Cloud]
    end

    B --> E
    C --> E
    E --> H
```

---

## 2. Требования

### 2.1. Минимальные

| Компонент | Требование          |
| --------- | ------------------- |
| CPU       | 2 ядра              |
| RAM       | 4 GB                |
| Disk      | 10 GB               |
| OS        | Linux/macOS/Windows |

### 2.2. Рекомендуемые

| Компонент | Требование            |
| --------- | --------------------- |
| CPU       | 4 ядра                |
| RAM       | 8 GB                  |
| Disk      | 20 GB SSD             |
| OS        | Linux (Ubuntu 22.04+) |

---

## 3. Локальная разработка

### 3.1. Предварительные требования

**Node.js (для Vite 8):**
```bash
# Проверка версии (требуется 20.19+)
node --version

# Установка (Windows)
winget install OpenJS.NodeJS.LTS
```

**Python:**
```bash
# Проверка версии (требуется 3.12+)
python --version

# Установка (Windows)
winget install Python.Python.3.12
```

**Playwright:**
```bash
pip install playwright
playwright install chromium
```

---

### 3.2. Клонирование репозитория

```bash
git clone https://github.com/your-org/russian-lang.git
cd russian-lang
```

---

### 3.3. Настройка Frontend

```bash
# Установка зависимостей
npm install

# Копирование .env
cp .env.example .env

# Редактирование .env
# VITE_API_URL=http://127.0.0.1:8000

# Запуск dev-сервера (Vite 8)
npm run dev
```

**Проверка:**
- Открыть http://localhost:5173
- Должна отобразиться главная страница

---

### 3.4. Настройка Backend

```bash
cd backend

# Создание виртуального окружения
python -m venv .venv
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Linux/macOS

# Установка зависимостей
pip install -r requirements.txt

# Копирование .env
copy .env.example .env  # Windows
cp .env.example .env  # Linux/macOS

# Редактирование .env
# DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/dbname
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_KEY=your-service-role-key
```

**Миграции и настройка БД:**
```bash
python manage.py init
python manage.py seed
python manage.py update-counts
```

**Запуск:**
```bash
python run.py
```

**Проверка:**
- Открыть http://127.0.0.1:8000/docs
- Должен отобразиться Swagger UI

---

## 4. Production Deployment

### 4.1. Docker Compose

**docker-compose.yml:**
```yaml
version: "3.8"

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    environment:
      - VITE_API_URL=http://backend:8000

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://user:pass@db:5432/linguacheck
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_KEY=${SUPABASE_KEY}
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=linguacheck
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=linguacheck
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

**Запуск:**
```bash
docker-compose up -d
```

**Проверка:**
```bash
docker-compose ps
docker-compose logs -f
```

---

### 4.2. Frontend Dockerfile

**Dockerfile.frontend:**
```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**nginx.conf:**
```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

### 4.3. Backend Dockerfile

**backend/Dockerfile:**
```dockerfile
FROM python:3.12-slim

WORKDIR /app

# Установка системных зависимостей
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libatspi2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Установка Playwright
RUN pip install playwright
RUN playwright install chromium
RUN playwright install-deps chromium

# Копирование зависимостей
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копирование кода
COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 5. Environment Variables

### Frontend (.env)

| Переменная     | Описание        | Default                 |
| -------------- | --------------- | ----------------------- |
| `VITE_API_URL` | URL backend API | `http://127.0.0.1:8000` |

### Backend (.env)

| Переменная         | Описание                        | Required                |
| ------------------ | ------------------------------- | ----------------------- |
| `DATABASE_URL`     | PostgreSQL connection string    | ✅                      |
| `SUPABASE_URL`     | Supabase project URL            | ✅                      |
| `SUPABASE_KEY`     | Supabase service role key       | ✅                      |
| `CORS_ORIGINS`     | Comma-separated allowed origins | `http://localhost:5173` |
| `MAX_DEPTH_LIMIT`  | Макс. глубина сканирования      | `5`                     |
| `MAX_PAGES_LIMIT`  | Макс. страниц                   | `1000`                  |
| `MAX_FILE_SIZE_MB` | Макс. размер файла              | `10`                    |

**Пример .env:**
```env
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/dbname
SUPABASE_URL=https://abcdefgh.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
MAX_DEPTH_LIMIT=5
MAX_PAGES_LIMIT=1000
MAX_FILE_SIZE_MB=10
```

---

## 6. База данных

### 6.1. Подключение к Supabase

1. Создать проект на https://supabase.com
2. Получить credentials из Settings → Database
3. Скопировать connection string
4. Вставить в `.env`

### 6.2. Применение миграций

```bash
cd backend
alembic upgrade head
```

### 6.3. Импорт словарей

```bash
cd backend
python scripts/import_dictionaries.py path/to/dictionary.pdf
```

---

## 7. Мониторинг

### 7.1. Health Check

```bash
curl http://localhost:8000/api/v1/health
# Ожидаемый ответ: {"status": "healthy"}
```

### 7.2. Логи

**Frontend:**
```bash
docker-compose logs frontend
```

**Backend:**
```bash
docker-compose logs backend
```

### 7.3. Метрики

| Метрика    | Endpoint                     | Описание             |
| ---------- | ---------------------------- | -------------------- |
| Health     | `/api/v1/health`             | Статус сервиса       |
| Scans      | `/api/v1/scans`              | История сканирований |
| Dictionary | `/api/v1/dictionary_preview` | Статус словарей      |

---

## 8. Troubleshooting

### 8.1. Frontend не запускается

**Проблема:** `Error: listen EADDRINUSE: address already in use :::5173`

**Решение:**
```bash
# Найти процесс на порту 5173
netstat -ano | findstr :5173

# Убить процесс
taskkill /F /PID <PID>

# Или изменить порт
npm run dev -- --port 5174
```

---

### 8.2. Backend не подключается к БД

**Проблема:** `could not connect to server`

**Решение:**
1. Проверить DATABASE_URL в .env
2. Проверить доступность PostgreSQL
3. Проверить firewall правила

```bash
# Проверка подключения
psql "postgresql://user:pass@host:5432/dbname"
```

---

### 8.3. Playwright ошибка

**Проблема:** `Executable doesn't exist at /path/to/chromium`

**Решение:**
```bash
playwright install chromium
playwright install-deps chromium
```

---

### 8.4. Vite 8 ошибки сборки

**Проблема:** `manualChunks is not a function`

**Решение:** Использовать функциональную форму в Vite 8:
```typescript
// vite.config.ts
manualChunks(id) {
  if (id.includes('node_modules/')) {
    // logic
  }
  return undefined
}
```

---

## 9. CI/CD (GitHub Actions)

**.github/workflows/ci.yml:**
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "20"

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: "3.12"

      - name: Install dependencies
        run: |
          npm ci
          cd backend && pip install -r requirements.txt

      - name: Run tests
        run: |
          npm run lint
          cd backend && pytest
```

---

_Документ синхронизирован с кодом 23 марта 2026 (версия 1.14.0)_
