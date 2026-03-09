"""
core/analysis.py — Phase 3
Токенизация и морфологический анализ через pymorphy2.
"""
import html
import logging
import re
import unicodedata
from functools import lru_cache

import pymorphy3 as pymorphy2

logger = logging.getLogger(__name__)

# Инициализируем анализатор один раз (дорогая операция)
_morph = pymorphy2.MorphAnalyzer()

# Паттерн: символы кириллицы или латиницы (слова). Теперь разрешаем дефис внутри слова.
_WORD_RE = re.compile(r"[A-Za-zА-Яа-яЁё0-9]+(?:-[A-Za-zА-Яа-яЁё0-9]+)*", re.UNICODE)

# Кэш для морфологического анализа (10000 слов)
@lru_cache(maxsize=10000)
def _analyze_word_cached(word: str):
    """Кэшированный морфологический анализ слова."""
    return _morph.parse(word)


def detect_language(word: str) -> str:
    """
    Определяет язык слова.
    Returns: 'ru', 'en', 'other'
    """
    has_cyrillic = any("\u0400" <= ch <= "\u04ff" for ch in word)
    has_latin = any(ch.isalpha() and ch.isascii() for ch in word)
    if has_cyrillic:
        return "ru"
    if has_latin:
        return "en"
    return "other"


def pos_to_str(tag_pos: str | None) -> str:
    """Конвертирует тег pymorphy2 в часть речи из specs/data_model.md."""
    mapping = {
        "NOUN": "NOUN",
        "VERB": "VERB",
        "INFN": "VERB",
        "ADJF": "ADJ",
        "ADJS": "ADJ",
        "ADVB": "ADV",
    }
    return mapping.get(tag_pos or "", "OTHER")


def tokenize(text: str) -> list[dict]:
    """
    Токенизирует текст и возвращает список токенов.
    Каждый токен: {raw_text, normal_form, part_of_speech, language_hint}
    """
    text = html.unescape(text)
    tokens = []
    for match in _WORD_RE.finditer(text):
        raw = match.group()
        lang = detect_language(raw)

        if lang == "ru":
            # Используем кэшированный анализ
            parsed = _analyze_word_cached(raw)
            best = parsed[0] if parsed else None
            normal_form = best.normal_form if best else raw.lower()
            pos = pos_to_str(best.tag.POS if best else None)
            is_known = best.is_known if best else False
        else:
            normal_form = raw.lower()
            pos = "OTHER"
            is_known = False

        tokens.append(
            {
                "raw_text": raw,
                "normal_form": normal_form,
                "part_of_speech": pos,
                "language_hint": lang,
                "is_known": is_known,
            }
        )
    return tokens
