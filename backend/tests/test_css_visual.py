"""
Тесты визуального веса.
specs/test_data.md: COFFEE TO GO vs Кофе с собой.
"""
import pytest
from app.utils.css_visual import (
    compute_contrast_ratio,
    compute_visual_weight,
    is_visual_dominance_violation,
)


def test_contrast_ratio_black_white():
    ratio = compute_contrast_ratio("#000000", "#ffffff")
    assert ratio == pytest.approx(21.0, abs=0.1)


def test_contrast_ratio_same_color():
    ratio = compute_contrast_ratio("#ffffff", "#ffffff")
    assert ratio == pytest.approx(1.0, abs=0.05)


def test_visual_weight_formula():
    """visual_weight = 0.6*fs + 0.3*fw + 0.1*cr"""
    weight = compute_visual_weight(font_size_px=40, font_weight=700, contrast_ratio=21.0)
    expected = 0.6 * 40 + 0.3 * 700 + 0.1 * 21.0
    assert weight == pytest.approx(expected, abs=0.01)


def test_visual_dominance_coffee_to_go():
    """
    specs/test_data.md:
    COFFEE TO GO: font-size 40px, bold, contrast ~21
    Кофе с собой:  font-size 12px, normal, contrast ~21
    """
    weight_foreign = compute_visual_weight(40, 700, 21.0)
    weight_rus = compute_visual_weight(12, 400, 21.0)

    assert is_visual_dominance_violation(weight_foreign, weight_rus), (
        f"Ожидалось нарушение visual_dominance: {weight_foreign:.2f} vs {weight_rus:.2f}"
    )


def test_no_visual_dominance_equal():
    """Равные веса не должны триггерить нарушение."""
    weight = compute_visual_weight(16, 400, 4.5)
    assert not is_visual_dominance_violation(weight, weight)
