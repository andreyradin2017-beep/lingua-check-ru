"""
visual_dominance_service.py — Phase 5
Обнаружение нарушений визуального доминирования иностранного текста.
"""
import logging
import re

from app.core.analysis import detect_language
from app.utils.css_visual import compute_contrast_ratio, compute_visual_weight, is_visual_dominance_violation

logger = logging.getLogger(__name__)

_CSS_RGB_RE = re.compile(r"rgb\((\d+),\s*(\d+),\s*(\d+)\)")


def _css_color_to_hex(css_color: str) -> str:
    """Конвертирует CSS rgb() в HEX."""
    m = _CSS_RGB_RE.match(css_color.strip())
    if m:
        r, g, b = int(m.group(1)), int(m.group(2)), int(m.group(3))
        return f"#{r:02x}{g:02x}{b:02x}"
    # Если уже HEX или именованный цвет — возвращаем как есть
    return css_color if css_color.startswith("#") else "#000000"


async def analyze_visual_dominance(elements: list[dict]) -> list[dict]:
    """
    Ищет пары (иностранный элемент, русский элемент) и проверяет
    правило visual_weight_foreign > 1.5 * visual_weight_rus.

    elements: список dict {text, font_size, font_weight, color, bg_color}
    Возвращает список дополнительных данных для violations.
    """
    violations = []

    foreign_els = []
    ru_els = []

    for el in elements:
        text = el.get("text", "")
        # Определяем язык большинства слов
        words = re.findall(r"[A-Za-zА-Яа-яЁё]+", text)
        if not words:
            continue
        langs = [detect_language(w) for w in words]
        dominant_lang = max(set(langs), key=langs.count)

        color_hex = _css_color_to_hex(el.get("color", "#000000"))
        bg_hex = _css_color_to_hex(el.get("bg_color", "#ffffff"))
        contrast = compute_contrast_ratio(color_hex, bg_hex)
        weight = compute_visual_weight(
            font_size_px=float(el.get("font_size", 16)),
            font_weight=int(el.get("font_weight", 400)),
            contrast_ratio=contrast,
        )

        entry = {
            "text": text[:100],
            "weight": weight,
            "font_size": el.get("font_size"),
            "font_weight": el.get("font_weight"),
            "contrast": contrast,
            "color": color_hex,
            "bg_color": bg_hex,
        }

        if dominant_lang == "ru":
            ru_els.append(entry)
        elif dominant_lang == "en":
            foreign_els.append(entry)

    # Проверяем каждую пару foreign × ru
    for f_el in foreign_els:
        for ru_el in ru_els:
            if is_visual_dominance_violation(f_el["weight"], ru_el["weight"]):
                violation_data = {
                    "text_foreign": f_el["text"],
                    "text_rus": ru_el["text"],
                    "visual_weight_foreign": f_el["weight"],
                    "visual_weight_rus": ru_el["weight"],
                    "font_size_foreign": f_el["font_size"],
                    "font_size_rus": ru_el["font_size"],
                    "contrast_foreign": f_el["contrast"],
                }
                violations.append(violation_data)
                logger.info(
                    "visual_dominance: %.2f vs %.2f | '%s' > '%s'",
                    f_el["weight"],
                    ru_el["weight"],
                    f_el["text"][:30],
                    ru_el["text"][:30],
                )

    return violations
