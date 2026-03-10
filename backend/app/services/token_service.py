import logging
import uuid
import re

from app.core.analysis import tokenize
from app.supabase_client import get_async_supabase
from app.schemas import CheckTextResponse, CheckTextSummary, ViolationSchema

logger = logging.getLogger(__name__)

# Нормативные словари (слово признаётся правомерным)
_NORMATIVE_DICTS = {"Orthographic", "Orthoepic", "Explanatory", "ForeignWords"}

# Исключения: общепринятые сокращения, бренды и т.д. (нижний регистр)
_STATIC_EXCEPTIONS = {
    # Сокращения
    "обл", "респ", "ул", "д", "г", "стр", "оф", "кв", "м", "т", "тел",
    "ао", "ооо", "пао", "зао", "тм", "ип", "инн", "кпп", "огрн",
    # Технические
    "email", "e-mail", "info", "melkom", "tm", "ru", "en", "текат", "текарт",
    "cookie", "cookies", "yandex", "smartcaptcha", "buher", "buhler", "pavan", "nbsp",
    # JavaScript DOM методы (чтобы не помечались как нарушения)
    "elementbytagname", "getelementsbytagname", "createelement", "getelementbyid",
    "addeventlistener", "queryselector", "queryselectorall", "getcomputedstyle",
    "innerhtml", "innerhtml", "textcontent", "innertext", "parentnode",
    "insertbefore", "appendchild", "createpixel", "callmethod",
    # JavaScript термины
    "javascript", "js", "typescript", "ts", "node", "npm", "webpack",
    # Технические термины
    "http", "https", "www", "html", "script", "style", "async", "function",
    "var", "document", "window", "push", "arguments", "length", "queue",
    "init", "track", "pageview", "event", "data", "type", "src", "id",
    "display", "none", "position", "absolute", "fixed", "left", "top", "px",
    "border", "alt", "width", "height", "style", "class", "target", "blank",
    "rel", "nofollow", "noopener", "noreferrer", "charset", "utf", "content",
    "name", "value", "form", "input", "button", "submit", "click",
    # Социальные сети и метрики
    "facebook", "fbq", "yandex", "ym", "mc", "top", "fwz", "mail", "ru",
    "connect", "fbevents", "js", "tag", "pixel", "nr", "viewcontent",
    "vk", "vkontakte", "retargeting", "hit", "init", "rutarget",
    # Пиксели и трекеры
    "tr", "ev", "noscript", "img", "src", "alt",
    # CMS и платформы
    "wordpress", "joomla", "drupal", "bitrix", "react", "angular", "vue",
    # Прочие технические
    "jpg", "jpeg", "png", "gif", "svg", "webp", "mp4", "webm", "pdf",
    "ajax", "json", "xml", "api", "cdn", "ssl", "tls", "dns",
    "get", "post", "put", "delete", "patch", "head", "options"
}

_ROMAN_RE = re.compile(r"^[IVXLCDM]+$", re.IGNORECASE)


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


async def _load_batch_data(tokens: list[dict], client: any = None) -> tuple[dict[str, set[str]], set[str]]:
    """
    Загружает все необходимые данные для токенов через Supabase REST API.
    """
    if client is None:
        client = await get_async_supabase()

    unique_nfs = {t["normal_form"] for t in tokens if t["language_hint"] == "ru" or t["raw_text"][0].isupper()}
    if not unique_nfs:
        return {}, set()

    words_sources: dict[str, set[str]] = {}
    trademarks_set: set[str] = set()
    global_exceptions: set[str] = set()
    
    # Загружаем глобальные исключения
    try:
        ge_resp = await client.table("global_exceptions").select("word").execute()
        for item in ge_resp.data:
            global_exceptions.add(item["word"].lower())
    except Exception as e:
        logger.error("Error loading global_exceptions: %s", e)

    # Чанкуем запросы по 200 элементов, чтобы не превысить лимит URL/памяти Postgrest
    chunk_size = 200
    unique_nfs_list = list(unique_nfs)
    for i in range(0, len(unique_nfs_list), chunk_size):
        chunk = unique_nfs_list[i : i + chunk_size]
        
        # REST запрос 1: Словарные слова
        try:
            words_resp = await client.table("dictionary_words").select("normal_form, source_dictionary").in_("normal_form", chunk).execute()
            for item in words_resp.data:
                nf = item["normal_form"]
                source = item["source_dictionary"]
                if nf not in words_sources:
                    words_sources[nf] = set()
                words_sources[nf].add(source)
        except Exception as e:
            logger.error("Error loading dictionary_words chunk: %s", e)

        # REST запрос 2: Товарные знаки
        try:
            tm_resp = await client.table("trademarks").select("normal_form").in_("normal_form", chunk).execute()
            for item in tm_resp.data:
                trademarks_set.add(item["normal_form"])
        except Exception as e:
            logger.error("Error loading trademarks chunk: %s", e)

    return words_sources, trademarks_set, global_exceptions


def _is_anglicism(word: str) -> bool:
    """
    Эвристически определяет, является ли кириллическое слово англицизмом (заимствованием).
    """
    # Характерные суффиксы и окончания англицизмов
    suffixes = [
        r"стайл$", r"инг$", r"мен$", r"мент$", r"ер$", r"ор$", r"изация$", 
        r"ировать$", r"бел$", r"бук$", r"каст$", r"хаб$", r"ток$", r"плей$", 
        r"шоп$", r"мол$", r"ворк$", r"бокс$", r"стор$", r"ап$", r"даун$",
        r"кей$", r"сет$", r"фит$", r"фуд$", r"чат$"
    ]
    # Характерные корни/целые слова (минимум 4 символа, чтобы не бить по коротким русским)
    roots = [
        "лайф", "маркет", "менедж", "бренд", "тренд", "хайп", "дедлайн", 
        "кейс", "релиз", "апдейт", "фейк", "чек", "оффер", "профит", 
        "стартап", "юзер", "контент", "холдинг", "шоу", "бизнес", "дизайн"
    ]
    
    w = word.lower()
    if any(re.search(s, w) for s in suffixes):
        return True
    if any(r in w for r in roots):
        return True
    return False


def _is_roman_numeral(word: str) -> bool:
    """Проверяет, является ли слово римской цифрой."""
    return bool(_ROMAN_RE.match(word))


async def analyze_text(text: str, client: any = None) -> CheckTextResponse:
    """
    Анализирует текст и формирует violations.
    """
    if client is None:
        client = await get_async_supabase()

    # 1. Извлекаем компоненты технических строк (email/url) для исключения
    tech_exceptions = _get_technical_word_parts(text)

    tokens = tokenize(text)
    violations: list[ViolationSchema] = []

    # Предварительно загружаем данные обо всех токенах одним батчем через REST
    words_sources, trademarks_set, db_exceptions = await _load_batch_data(tokens, client)

    for token in tokens:
        lang = token["language_hint"]
        normal_form = token["normal_form"]
        raw_text = token["raw_text"]

        if lang == "other":
            continue

        # --- Пропускаем исключения ---
        # а) Статические, динамические (из БД) и технические (Email/URL) исключения
        nf_low = normal_form.lower()
        if nf_low in _STATIC_EXCEPTIONS or nf_low in db_exceptions or nf_low in tech_exceptions:
            continue

        # б) Римские цифры (I, V, X, L, C, D, M)
        if _is_roman_numeral(raw_text):
            continue

        # в) Одиночные кириллические буквы (сокращения р-з, инициалы и т.д.)
        if lang == "ru" and len(raw_text) == 1:
            continue

        # г) Слова с приклеенными цифрами (болезни3, действие1) - это ошибки парсинга
        if re.search(r"[а-яА-ЯёЁ][0-9]|[0-9][а-яА-ЯёЁ]", raw_text):
            continue

        # д) Слова содержащие спецсимволы кроме дефиса
        if re.search(r"[^а-яА-ЯёЁa-zA-Z0-9\-]", raw_text):
            continue

        # Контекст для UI
        idx = text.lower().find(raw_text.lower())
        start = max(0, idx - 40)
        end = min(len(text), idx + len(raw_text) + 40)
        context = text[start:end].strip()

        # Товарный знак (пропускаем - это не нарушение)
        if normal_form in trademarks_set:
            continue

        # Получаем источники (O(1) чтение из in-memory словаря)
        sources = words_sources.get(normal_form, set())

        # Имена собственные (кириллица с большой буквы)
        if lang == "ru" and raw_text[0].isupper() and not sources:
            continue

        if lang == "ru":
            if not sources:
                if not token.get("is_known", False):
                    # Эвристика: англицизм или опечатка?
                    v_type = "unrecognized_word"
                    v_info = "Опечатка или неизвестное слово"

                    if _is_anglicism(normal_form):
                        v_type = "foreign_word"
                        v_info = "Иностранное заимствование (англицизм) на кириллице"

                    violations.append(
                        ViolationSchema(
                            id=str(uuid.uuid4()),
                            type=v_type,
                            page_url=None,
                            text_context=context,
                            word=raw_text,
                            normal_form=normal_form,
                            details={"language": lang, "info": v_info},
                        )
                    )
            continue

        # Иностранные слова (латиница)
        if len(raw_text) == 1 and lang == "en":
            continue
        if sources:
            continue

        v_type = "foreign_word"
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
    viol_count = len(violations)
    compliance = round((1 - viol_count / total) * 100, 2) if total > 0 else 100.0

    return CheckTextResponse(
        violations=violations,
        summary=CheckTextSummary(
            total_tokens=total,
            violations_count=viol_count,
            compliance_percent=compliance,
        ),
    )
