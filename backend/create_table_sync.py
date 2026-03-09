import psycopg2
import os
import re

# Извлекаем URL из .env вручную, чтобы не зависеть от асинхронного движка
with open(".env", "r") as f:
    env_content = f.read()
    match = re.search(r"DATABASE_URL=postgresql\+asyncpg://([^ ]+)", env_content)
    if not match:
        print("Could not find DATABASE_URL in .env")
        exit(1)
    
    # Конвертируем postgresql+asyncpg:// в postgresql:// и убираем параметры запроса, если они мешают
    db_url = "postgresql://" + match.group(1).split("?")[0]
    # Добавляем sslmode=require отдельно, если нужно
    db_url += "?sslmode=require"

try:
    print(f"Connecting to database...")
    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    with conn.cursor() as cur:
        print("Executing CREATE TABLE...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS global_exceptions (
                id VARCHAR(36) PRIMARY KEY,
                word TEXT NOT NULL UNIQUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """)
        print("Success! Table 'global_exceptions' is ready.")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
