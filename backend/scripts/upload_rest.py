"""
upload_rest.py — загрузка словаря из JSON-кэша через Supabase REST API (supabase-py).
Не требует psycopg2 и работает через HTTPS.

Использование:
    python scripts/upload_rest.py cache/orthographic_2024.json
"""
import json
import uuid
import sys
import logging
import argparse
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from supabase import create_client

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

SUPABASE_URL = "https://tefpshqwdlpzohcldayr.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZnBzaHF3ZGxwem9oY2xkYXlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjgxODQyOSwiZXhwIjoyMDg4Mzk0NDI5fQ.y014Ojsi8d65faV_sazRa1ICW8f0UQNQugpPdn5bOvc"


def upload_from_cache(json_path: str, no_delete: bool = False) -> None:
    logger.info(f"Читаем {json_path}...")
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    dict_name = data["dictionary_name"]
    version = data["version"]
    is_foreign_base = data.get("is_foreign", False)
    words_data = data["words"]

    logger.info(f"Словарь: {dict_name} v{version}, слов: {len(words_data)}")

    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    # 1. Проверяем / создаём запись версии
    existing = (
        supabase.table("dictionary_versions")
        .select("id")
        .eq("name", dict_name)
        .eq("version", version)
        .execute()
    )

    if existing.data:
        if not no_delete:
            logger.info("Версия уже есть — удаляем старые слова...")
            supabase.table("dictionary_words") \
                .delete() \
                .eq("source_dictionary", dict_name) \
                .eq("version", version) \
                .execute()
        else:
            logger.info("Версия уже есть — дозагружаем слова (флаг --no-delete).")
    else:
        supabase.table("dictionary_versions").insert({
            "id": str(uuid.uuid4()),
            "name": dict_name,
            "version": version,
            "pdf_path": "from_cache",
            "processed_at": datetime.now(timezone.utc).isoformat(),
        }).execute()
        logger.info("Версия словаря создана.")

    # 2. Заливаем словами пачками (Supabase REST лимит — 1000 строк)
    batch_size = 100
    total = 0
    
    # Используем детерминированный Namespace для UUID v5
    NAMESPACE = uuid.uuid5(uuid.NAMESPACE_DNS, "linguacheck.ru")

    rows = []
    for w in words_data:
        # Генерируем ID детерминированно на основе слова, словаря и версии
        # Это позволит перезапускать скрипт без создания дубликатов
        word_id = str(uuid.uuid5(NAMESPACE, f"{dict_name}:{version}:{w['word']}"))
        rows.append({
            "id": word_id,
            "word": w["word"],
            "normal_form": w["normal_form"],
            "part_of_speech": w["part_of_speech"],
            "source_dictionary": dict_name,
            "is_foreign": is_foreign_base or dict_name == "ForeignWords",
            "version": version,
        })

    import time
    from httpx import HTTPError

    for i in range(0, len(rows), batch_size):
        batch = rows[i: i + batch_size]
        
        success = False
        retries = 15
        while not success and retries > 0:
            try:
                supabase.table("dictionary_words").upsert(batch).execute()
                success = True
                total += len(batch)
                if total % 1000 == 0 or total == len(rows):
                    logger.info("Вставлено %d / %d", total, len(rows))
                # Небольшая пауза между батчами для снижения нагрузки на API
                time.sleep(0.2)
            except Exception as e:
                retries -= 1
                logger.warning(f"Ошибка при вставке батча {i//batch_size}: {e}. Ретарй ({retries} осталось)...")
                time.sleep(10)
                if retries == 0:
                    logger.error("Не удалось вставить батч после 15 попыток. Прерывание.")
                    raise

    logger.info("✅ Импорт завершён: %d слов из '%s' v%s", total, dict_name, version)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Загрузка словаря из JSON-кэша в Supabase.")
    parser.add_argument("json_path", help="Путь к JSON-файлу кэша")
    parser.add_argument("--no-delete", action="store_true", help="Не удалять существующие слова (для дозагрузки)")
    args = parser.parse_args()
    
    upload_from_cache(args.json_path, args.no_delete)
