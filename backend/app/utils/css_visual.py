"""
css_visual.py — Phase 5
Вычисление контраста и визуального веса элементов.
Формула из specs/product.md:
  visual_weight = 0.6 * font_size_px + 0.3 * font_weight + 0.1 * contrast_ratio
"""
import math
import re


def _hex_to_rgb(color: str) -> tuple[float, float, float]:
    """Конвертирует HEX цвет в RGB (0–1 диапазон)."""
    color = color.strip().lstrip("#")
    if len(color) == 3:
        color = "".join(c * 2 for c in color)
    r = int(color[0:2], 16) / 255
    g = int(color[2:4], 16) / 255
    b = int(color[4:6], 16) / 255
    return r, g, b


def _linearize(c: float) -> float:
    """sRGB → линейный канал (WCAG 2.x)."""
    if c <= 0.04045:
        return c / 12.92
    return ((c + 0.055) / 1.055) ** 2.4


def _relative_luminance(r: float, g: float, b: float) -> float:
    """Относительная яркость по WCAG 2.x."""
    rl = _linearize(r)
    gl = _linearize(g)
    bl = _linearize(b)
    return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl


def compute_contrast_ratio(color: str, bg_color: str) -> float:
    """
    Вычисляет контраст по WCAG (1:1 – 21:1).
    Принимает HEX-строки (#RRGGBB или #RGB).
    """
    try:
        r1, g1, b1 = _hex_to_rgb(color)
        r2, g2, b2 = _hex_to_rgb(bg_color)
        l1 = _relative_luminance(r1, g1, b1)
        l2 = _relative_luminance(r2, g2, b2)
        lighter = max(l1, l2)
        darker = min(l1, l2)
        return round((lighter + 0.05) / (darker + 0.05), 2)
    except Exception:
        return 1.0  # безопасный fallback


def compute_visual_weight(
    font_size_px: float,
    font_weight: int,
    contrast_ratio: float,
) -> float:
    """
    Формула из specs/product.md:
    visual_weight = 0.6 * font_size_px + 0.3 * font_weight + 0.1 * contrast_ratio
    """
    return round(
        0.6 * font_size_px + 0.3 * font_weight + 0.1 * contrast_ratio,
        4,
    )


def is_visual_dominance_violation(
    weight_foreign: float,
    weight_ru: float,
    threshold: float = 1.5,
) -> bool:
    """
    Правило доминирования из specs/product.md:
    если visual_weight_foreign > 1.5 * visual_weight_rus → нарушение.
    """
    return weight_foreign > threshold * weight_ru
