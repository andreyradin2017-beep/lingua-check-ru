"""
Тесты морфологии (pymorphy2).
Проверяем specs/test_data.md — лемматизация.
"""
import pytest
from app.core.analysis import detect_language, tokenize


def test_lemmatization_battery():
    """батарею / батареи / батарея → одна лемма 'батарея'"""
    forms = ["батарею", "батареи", "батарею"]
    for form in forms:
        tokens = tokenize(form)
        assert len(tokens) == 1, f"Ожидался 1 токен для '{form}'"
        assert tokens[0]["normal_form"] == "батарея", (
            f"Ожидалась лемма 'батарея', получили '{tokens[0]['normal_form']}'"
        )


def test_detect_language_russian():
    assert detect_language("батарея") == "ru"


def test_detect_language_english():
    assert detect_language("CoffeeMaster") == "en"


def test_detect_language_mixed():
    """Слово с кириллицей считается русским."""
    assert detect_language("Рё") == "ru"


def test_tokenize_mixed_text():
    """specs/test_data.md: тест-текст 1."""
    text = "Теперь я использую супер-гаджет CoffeeMaster Pro"
    tokens = tokenize(text)
    raw_words = [t["raw_text"] for t in tokens]
    assert "CoffeeMaster" in raw_words, "CoffeeMaster должен быть токеном"
    assert "использую" in raw_words, "использую должен быть токеном"


def test_pos_assignment():
    """Проверяем назначение части речи."""
    tokens = tokenize("купил")
    assert tokens[0]["part_of_speech"] == "VERB"

    tokens = tokenize("батарея")
    assert tokens[0]["part_of_speech"] == "NOUN"
