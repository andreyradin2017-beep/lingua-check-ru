# 🚀 Деплой на Render.com (Бесплатно)

## 📋 Требования

- Аккаунт на [Render.com](https://render.com)
- PostgreSQL база (Supabase или Render PostgreSQL)
- Git репозиторий

---

## 🔧 Шаг 1: Подготовка

### 1.1 Обновите конфигурацию

**backend/.env:**
```env
DATABASE_URL=your_database_url
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_service_role_key
CORS_ORIGINS=["*"]
```

**render.yaml:**
```yaml
services:
  - type: web
    name: linguacheck-backend
    runtime: docker
    region: frankfurt
    plan: free
    dockerfilePath: backend/Dockerfile
    dockerContext: backend
    envVars:
      - key: DATABASE_URL
        value: "your_database_url"
      - key: SUPABASE_URL
        value: "your_supabase_url"
      - key: SUPABASE_KEY
        value: "your_service_role_key"
      - key: CORS_ORIGINS
        value: '["*"]'
```

---

## 🚀 Шаг 2: Деплой

### Вариант 1: Через Render Dashboard

1. **Зайдите на** https://render.com
2. **Создайте новый сервис:**
   - Click "New +" → "Web Service"
   - Connect ваш GitHub репозиторий
   - Выберите ветку `main`

3. **Настройте сервис:**
   - **Name:** `linguacheck-backend`
   - **Region:** `Frankfurt` (ближе к РФ)
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** `Docker`
   - **DockerfilePath:** `backend/Dockerfile`
   - **Plan:** `Free`

4. **Добавьте переменные окружения:**
   ```
   DATABASE_URL=your_database_url
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_service_role_key
   CORS_ORIGINS=["*"]
   ```

5. **Click "Create Web Service"**

### Вариант 2: Через render.yaml (Infrastructure as Code)

```bash
# Установите Render CLI
npm install -g @render-cloud/cli

# Авторизуйтесь
render login

# Задеплойте
render up render.yaml
```

---

## 🌐 Шаг 3: Настройка Frontend

Обновите `src/config/api.ts` или создайте `.env`:

**frontend/.env:**
```env
VITE_API_URL=https://your-app-name.onrender.com
```

**Или обновите src/config/api.ts:**
```typescript
export const API_URL = import.meta.env.VITE_API_URL || 
  'https://your-app-name.onrender.com';
```

---

## ⚙️ Шаг 4: Проверка

### Проверка Backend

```bash
# Health check
curl https://your-app-name.onrender.com/api/v1/health

# Ожидается:
# {"status":"ok","database":"ok","mode":"rest_api"}
```

### Проверка Frontend

```bash
# Локальный запуск
npm run dev

# Откройте http://localhost:5173
# Проверьте что API запросы идут на Render URL
```

---

## ⚠️ Важные замечания

### Бесплатный план Render

**Ограничения:**
- ⏱️ **750 часов/месяц** (один сервис всегда онлайн)
- 💤 **Засыпает** через 15 минут без активности
- 🐌 **Первый запуск** 30-60 секунд
- 📦 **512 MB RAM**
- 🎯 **0.1 CPU**

**Решения:**
- Используйте [UptimeRobot](https://uptimerobot.com/) для пинга (каждые 5 мин)
- Или перейдите на платный план ($7/месяц)

### База данных

**Варианты:**
1. **Supabase** (рекомендуется) — бесплатно, PostgreSQL
2. **Render PostgreSQL** — бесплатно, 1GB
3. **Neon** — бесплатно, serverless PostgreSQL

---

## 🔍 Диагностика

### Логи

```bash
# Через Render Dashboard
Services → your-service → Logs

# Или через CLI
render logs -s your-service-name
```

### Проблемы и решения

**1. CORS ошибки:**
```env
CORS_ORIGINS=["*"]
```

**2. Database connection failed:**
- Проверьте DATABASE_URL
- Убедитесь что SSL включен: `?ssl=require`

**3. Playwright ошибки:**
- Убедитесь что браузеры установлены: `playwright install chromium`
- Проверьте зависимости в Dockerfile

**4. Port binding failed:**
- Render передает PORT через переменную
- Убедитесь что `host="0.0.0.0"`

---

## 📊 Мониторинг

### Render Dashboard

- Metrics → CPU, Memory, Requests
- Alerts → Настройте уведомления

### Внешний мониторинг

- [UptimeRobot](https://uptimerobot.com/) — бесплатный uptime мониторинг
- [Pingdom](https://www.pingdom.com/) — расширенный мониторинг

---

## 💰 Стоимость

**Бесплатный план:**
- ✅ 750 часов/месяц (один сервис)
- ✅ 512 MB RAM
- ✅ 0.1 CPU
- ✅ Бесплатный SSL
- ✅ Автоматические деплои

**Платный план (от $7/месяц):**
- ✅ Не засыпает
- ✅ Больше RAM и CPU
- ✅ Приоритетная поддержка

---

## 📞 Поддержка

- Render Docs: https://render.com/docs
- Community: https://community.render.com
- Status: https://status.render.com

---

**Последнее обновление:** 14 марта 2026  
**Версия:** 1.11.0
