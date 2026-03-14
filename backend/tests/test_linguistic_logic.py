import pytest
from app.services.token_service import _is_anglicism, _is_roman_numeral, _get_technical_word_parts

def test_is_anglicism():
    # Положительные случаи (англицизмы)
    assert _is_anglicism("маркетинг") is True
    assert _is_anglicism("бренд") is True
    assert _is_anglicism("хайп") is True
    assert _is_anglicism("стартап") is True
    assert _is_anglicism("дизайнер") is True
    
    # Отрицательные случаи (исконно русские или не подходящие под эвристики)
    assert _is_anglicism("хлеб") is False
    assert _is_anglicism("молоко") is False
    assert _is_anglicism("дорога") is False

def test_is_roman_numeral():
    assert _is_roman_numeral("X") is True
    assert _is_roman_numeral("XXI") is True
    assert _is_roman_numeral("MCMXC") is True
    assert _is_roman_numeral("abc") is False
    assert _is_roman_numeral("123") is False

def test_get_technical_word_parts():
    text = "Свяжитесь с нами по info@example.com или посетите https://lingua-check.ru"
    parts = _get_technical_word_parts(text)
    
    assert "info" in parts
    assert "example" in parts
    assert "com" in parts
    assert "https" in parts
    assert "lingua" in parts
    assert "check" in parts
    assert "ru" in parts
    assert "свяжитесь" not in parts  # Обычные слова не должны попадать
