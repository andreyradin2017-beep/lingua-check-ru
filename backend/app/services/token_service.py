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


async def _get_word_sources(normal_form: str, db: AsyncSession) -> set[str]:
    """Возвращает множество словарей, в которых найдена лемма."""
    result = await db.execute(
        select(DictionaryWord.source_dictionary)
        .where(DictionaryWord.normal_form == normal_form)
        .distinct()
    )
    return {row[0] for row in result.fetchall()}


async def _is_trademark(normal_form: str, db: AsyncSession) -> bool:
    """Проверяет, является ли слово товарным знаком."""
    result = await db.execute(
        select(Trademark.id).where(Trademark.normal_form == normal_form).limit(1)
    )
    return result.scalar() is not None


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

    trademark_cache = {}
    sources_cache = {}

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

        # Товарный знак
        if normal_form not in trademark_cache:
            trademark_cache[normal_form] = await _is_trademark(normal_form, db)
            
        if trademark_cache[normal_form]:
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

        # Получаем источники
        if normal_form not in sources_cache:
            sources_cache[normal_form] = await _get_word_sources(normal_form, db)
        
        sources = sources_cache[normal_form]

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
