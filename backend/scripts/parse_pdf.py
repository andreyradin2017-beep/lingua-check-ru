import argparse
import logging
import json
import re
import sys
import os
from pathlib import Path

# Добавляем корень проекта в sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pymorphy3 as pymorphy2
from pdfminer.high_level import extract_pages
from pdfminer.layout import LTTextContainer

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

morph = pymorphy2.MorphAnalyzer()

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
            
            found_on_page = re.findall(r'[a-zA-Zа-яА-ЯёЁ-]+', page_text)
            for w in found_on_page:
                if len(w) > 1:
                    words.append(w.lower())
            
            if page_num % 100 == 0:
                logger.info(f"Обработано страниц: {page_num}, найдено слов: {len(words)}")
                
    except Exception as e:
        logger.error(f"Ошибка при чтении PDF: {e}")
        return []

    return list(set(words))

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

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("pdf_path", help="Путь к PDF-файлу")
    parser.add_argument("--dictionary-name", required=True)
    parser.add_argument("--version", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--is-foreign", action="store_true")
    args = parser.parse_args()

    words = extract_words_from_pdf(args.pdf_path)
    if not words:
        logger.error("Слова не найдены")
        return

    logger.info(f"Начинаем нормализацию {len(words)} слов...")
    cached_data = {
        "dictionary_name": args.dictionary_name,
        "version": args.version,
        "is_foreign": args.is_foreign,
        "words": []
    }

    for i, word in enumerate(words):
        norm = normalize_word(word)
        cached_data["words"].append({
            "word": word,
            "normal_form": norm["normal_form"],
            "part_of_speech": norm["part_of_speech"]
        })
        if (i + 1) % 10000 == 0:
            logger.info(f"Нормализовано {i+1} слов...")

    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(cached_data, f, ensure_ascii=False, indent=2)
    
    logger.info(f"Файл успешно сохранен в {args.output}")

if __name__ == "__main__":
    main()
