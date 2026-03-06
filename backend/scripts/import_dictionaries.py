"""
scripts/import_dictionaries.py — Phase 2
Импорт нормативных словарей из PDF-файлов.

Использование:
    python import_dictionaries.py <path_to_pdf> --dictionary-name Orthographic --version 2024-01-01

Шаги:
    PDF → OCR (pytesseract если PDF не текстовый) → парсинг слов → нормализация → загрузка в dictionary_words
"""
import argparse
import asyncio
import logging
import os
import re
import sys
import uuid
from datetime import datetime
from pathlib import Path

# Добавляем корень проекта в sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pymorphy3 as pymorphy2
from pdfminer.high_level import extract_pages
from pdfminer.layout import LTTextContainer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.config import settings
from app.models import Base, DictionaryVersion, DictionaryWord

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

morph = pymorphy2.MorphAnalyzer()

VALID_DICTIONARIES = {"Orthographic", "ForeignWords", "Explanatory", "Orthoepic"}
_WORD_RE = re.compile(r"[А-Яа-яЁё][А-Яа-яЁё'-]{2,}", re.UNICODE)


def extract_words_from_pdf(pdf_path: str) -> list[str]:
    """Извлекает слова из PDF через pdfminer."""
    logger.info(f"Начинаем извлечение текста из {pdf_path}...")
    
    words = []
    try:
        page_num = 0
        for page_layout in extract_pages(pdf_path):
            page_num += 1
            page_text = ""
            for element in page_layout:
                if isinstance(element, LTTextContainer):
                    page_text += element.get_text()
            
            # Предварительная фильтрация на странице
            found_on_page = re.findall(r'[a-zA-Zа-яА-ЯёЁ-]+', page_text)
            for w in found_on_page:
                if len(w) > 1:
                    words.append(w.lower())
            
            if page_num % 10 == 0:
                logger.info(f"Обработано страниц: {page_num}, найдено слов: {len(words)}")
                
    except Exception as e:
        logger.error(f"Ошибка при чтении PDF: {e}")
        return []

    logger.info(f"Извлечение завершено. Всего слов: {len(words)}. Начинаем нормализацию...")
    
    unique_words = set(words)
    logger.info(f"Уникальных словоформ: {len(unique_words)}")
    
    # Пакетная вставка
    return list(unique_words)


def normalize_word(word: str) -> dict:
    """Нормализует слово через pymorphy2."""
    parsed = morph.parse(word)
    if not parsed:
        return {"normal_form": word, "part_of_speech": "OTHER"}
    best = parsed[0]
    pos_map = {
        "NOUN": "NOUN", "VERB": "VERB", "INFN": "VERB",
        "ADJF": "ADJ", "ADJS": "ADJ", "ADVB": "ADV",
    }
    pos = pos_map.get(best.tag.POS or "", "OTHER")
    return {"normal_form": best.normal_form, "part_of_speech": pos}


async def import_dictionary(
    pdf_path: str,
    dictionary_name: str,
    version: str,
    is_foreign: bool = False,
) -> None:
    """Основная функция импорта словаря в БД."""
    if dictionary_name not in VALID_DICTIONARIES:
        raise ValueError(f"Неверное имя словаря. Допустимые: {VALID_DICTIONARIES}")

    engine = create_async_engine(settings.database_url, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    SessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False)

    words = extract_words_from_pdf(pdf_path)
    if not words:
        logger.error("Слова не найдены в PDF")
        return

    async with SessionLocal() as session:
        # Проверяем существующую версию
        existing = await session.execute(
            select(DictionaryVersion).where(
                DictionaryVersion.name == dictionary_name,
                DictionaryVersion.version == version,
            )
        )
        if existing.scalar():
            logger.warning("Версия %s/%s уже существует, пропускаем", dictionary_name, version)
            return

        # Сохраняем версию
        dv = DictionaryVersion(
            id=str(uuid.uuid4()),
            name=dictionary_name,
            version=version,
            pdf_path=pdf_path,
            processed_at=datetime.utcnow(),
        )
        session.add(dv)

        # Загружаем слова батчами
        batch_size = 500
        total_inserted = 0
        for i in range(0, len(words), batch_size):
            batch = words[i : i + batch_size]
            for raw_word in batch:
                normalized = normalize_word(raw_word)
                dw = DictionaryWord(
                    id=str(uuid.uuid4()),
                    word=raw_word,
                    normal_form=normalized["normal_form"],
                    part_of_speech=normalized["part_of_speech"],
                    source_dictionary=dictionary_name,
                    is_foreign=(is_foreign or dictionary_name == "ForeignWords"),
                    version=version,
                )
                session.add(dw)
                total_inserted += 1

            await session.flush()
            logger.info("Загружено %d / %d слов", total_inserted, len(words))

        await session.commit()
        logger.info(
            "Импорт завершён: %d слов из '%s' v%s", total_inserted, dictionary_name, version
        )

    await engine.dispose()


def main() -> None:
    parser = argparse.ArgumentParser(description="Импорт нормативного словаря из PDF")
    parser.add_argument("pdf_path", help="Путь к PDF-файлу словаря")
    parser.add_argument(
        "--dictionary-name",
        required=True,
        choices=list(VALID_DICTIONARIES),
        help="Тип словаря",
    )
    parser.add_argument(
        "--version",
        required=True,
        help="Версия словаря (YYYY-MM-DD)",
    )
    parser.add_argument(
        "--is-foreign",
        action="store_true",
        help="Пометить все слова как иностранные",
    )
    args = parser.parse_args()

    if not Path(args.pdf_path).exists():
        logger.error("Файл не найден: %s", args.pdf_path)
        sys.exit(1)

    asyncio.run(
        import_dictionary(
            args.pdf_path,
            args.dictionary_name,
            args.version,
            args.is_foreign,
        )
    )


if __name__ == "__main__":
    main()
