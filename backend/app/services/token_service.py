import logging
import uuid
import re

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.analysis import tokenize
from app.models import DictionaryWord, Trademark
from app.schemas import CheckTextResponse, CheckTextSummary, ViolationSchema

logger = logging.getLogger(__name__)

# Нормативные словари (слово признаётся правомерным)
_NORMATIVE_DICTS = {"Orthographic", "Orthoepic", "Explanatory", "ForeignWords"}

# Исключения: общепринятые сокращения, бренды и т.д. (нижний регистр)
_EXCEPTIONS = {
    "обл", "респ", "ул", "д", "г", "стр", "оф", "кв", "м", "т", "тел", 
    "ао", "ооо", "пао", "зао", "тм", "ип", "инн", "кпп", "огрн",
    "email", "info", "melkom", "tm", "ru", "en", "текат", "текарт", 
    "cookie", "cookies", "yandex", "smartcaptcha", "buher", "buhler", "pavan"
}


def _get_technical_word_parts(text: str) -> set[str]:
    """
    Находит в тексте Email и URL и возвращает все их буквенные компоненты.
    Это нужно, чтобы части email (info, russianlinen) не помечались как ошибки.
    """
    technical_parts = set()
    
    # Регулярки для Email и URL
    email_pattern = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
    url_pattern = r'https?://[^\s/$.?#].[^\s]*|www\.[^\s]*|[a-zA-Z0-9-]+\.[a-z]{2,}'
    
    found_tech = re.findall(f"{email_pattern}|{url_pattern}", text)
    
    for item in found_tech:
        # Разбиваем на части, оставляя только буквы и цифры
        parts = re.findall(r'[a-zA-Zа-яА-ЯёЁ0-9]+', item)
        for p in parts:
            if len(p) > 1:
                technical_parts.add(p.lower())
                
    return technical_parts


async def _load_batch_data(tokens: list[dict], db: AsyncSession) -> tuple[dict[str, set[str]], set[str]]:
    """
    Загружает все необходимые данные для токенов за 2 SQL-запроса (вместо N+1).
    Возвращает:
      - words_sources: dict[normal_form, set(sources)]
      - trademarks_set: set(normal_form)
    """
    # Собираем уникальные normal_form для слов, которые нужно проверить
    unique_nfs = {t["normal_form"] for t in tokens if t["language_hint"] == "ru" or t["raw_text"][0].isupper()}
    if not unique_nfs:
        return {}, set()

    # Запрос 1: Источники словарей
    words_result = await db.execute(
        select(DictionaryWord.normal_form, DictionaryWord.source_dictionary)
        .where(DictionaryWord.normal_form.in_(unique_nfs))
        .distinct()
    )
    
    words_sources: dict[str, set[str]] = {}
    for nf, source in words_result.fetchall():
        if nf not in words_sources:
            words_sources[nf] = set()
        words_sources[nf].add(source)

    # Запрос 2: Товарные знаки
    tm_result = await db.execute(
        select(Trademark.normal_form)
        .where(Trademark.normal_form.in_(unique_nfs))
        .distinct()
    )
    trademarks_set = {row[0] for row in tm_result.fetchall()}

    return words_sources, trademarks_set


async def analyze_text(text: str, db: AsyncSession) -> CheckTextResponse:
    """
    Анализирует текст и формирует violations.
    """
    # 1. Извлекаем компоненты технических строк (email/url) для исключения
    tech_exceptions = _get_technical_word_parts(text)
    
    tokens = tokenize(text)
    violations: list[ViolationSchema] = []

    # Есть ли в тексте русские слова (для определения no_russian_dub)
    has_russian = any(t["language_hint"] == "ru" for t in tokens)

    # Предварительно загружаем данные обо всех токенах одним батчем (решает N+1)
    words_sources, trademarks_set = await _load_batch_data(tokens, db)

    for token in tokens:
        lang = token["language_hint"]
        normal_form = token["normal_form"]
        raw_text = token["raw_text"]

        if lang == "other":
            continue

        # --- Пропускаем исключения ---
        # а) Глобальные исключения и Email/URL компоненты
        if normal_form.lower() in _EXCEPTIONS or normal_form.lower() in tech_exceptions:
            continue
            
        # б) Одиночные кириллические буквы (сокращения р-з, инициалы и т.д.)
        if lang == "ru" and len(raw_text) == 1:
            continue

        # Контекст для UI
        idx = text.lower().find(raw_text.lower())
        start = max(0, idx - 40)
        end = min(len(text), idx + len(raw_text) + 40)
        context = text[start:end].strip()

        # Товарный знак (проверка O(1) по in-memory сету загруженному в начале)
        if normal_form in trademarks_set:
            violations.append(
                ViolationSchema(
                    id=str(uuid.uuid4()),
                    type="trademark",
                    page_url=None,
                    text_context=context,
                    word=raw_text,
                    normal_form=normal_form,
                    details={"language": lang},
                )
            )
            continue

        # Получаем источники (O(1) чтение из in-memory словаря)
        sources = words_sources.get(normal_form, set())

        # Имена собственные (кириллица с большой буквы)
        if lang == "ru" and raw_text[0].isupper() and not sources:
            continue

        if lang == "ru":
            if not sources:
                if not token.get("is_known", False):
                    violations.append(
                        ViolationSchema(
                            id=str(uuid.uuid4()),
                            type="unrecognized_word",
                            page_url=None,
                            text_context=context,
                            word=raw_text,
                            normal_form=normal_form,
                            details={"language": lang, "info": "Опечатка или неизвестное слово"},
                        )
                    )
            continue

        # Иностранные слова
        if len(raw_text) == 1 and lang == "en":
            continue
        if sources:
            continue

        v_type = "no_russian_dub" if not has_russian else "foreign_word"
        if raw_text[0].isupper():
            v_type = "possible_trademark"
            
        violations.append(
            ViolationSchema(
                id=str(uuid.uuid4()),
                type=v_type,
                page_url=None,
                text_context=context,
                word=raw_text,
                normal_form=normal_form,
                details={"language": lang},
            )
        )

    total = len(tokens)
    real_violations = [v for v in violations if v.type != "trademark"]
    viol_count = len(real_violations)
    compliance = round((1 - viol_count / total) * 100, 2) if total > 0 else 100.0

    return CheckTextResponse(
        violations=violations,
        summary=CheckTextSummary(
            total_tokens=total,
            violations_count=viol_count,
            compliance_percent=compliance,
        ),
    )
