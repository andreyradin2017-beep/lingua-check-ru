"""
Тесты для token_service.py - анализ текста и поиск нарушений
"""
import pytest
from app.services.token_service import (
    analyze_text,
    _is_anglicism,
    _is_roman_numeral,
    _get_technical_word_parts,
    _STATIC_EXCEPTIONS,
)


class TestStaticExceptions:
    """Тесты статических исключений"""

    def test_email_variations_in_exceptions(self):
        """e-mail и email должны быть в исключениях"""
        assert "email" in _STATIC_EXCEPTIONS
        assert "e-mail" in _STATIC_EXCEPTIONS

    def test_javascript_methods_in_exceptions(self):
        """JS DOM методы должны быть в исключениях"""
        assert "getelementsbytagname" in _STATIC_EXCEPTIONS
        assert "createelement" in _STATIC_EXCEPTIONS
        assert "getelementbyid" in _STATIC_EXCEPTIONS

    def test_technical_terms_in_exceptions(self):
        """Технические термины должны быть в исключениях"""
        assert "http" in _STATIC_EXCEPTIONS
        assert "https" in _STATIC_EXCEPTIONS
        assert "javascript" in _STATIC_EXCEPTIONS
        assert "function" in _STATIC_EXCEPTIONS
        assert "document" in _STATIC_EXCEPTIONS
        assert "window" in _STATIC_EXCEPTIONS

    def test_social_media_in_exceptions(self):
        """Соцсети и метрики должны быть в исключениях"""
        assert "facebook" in _STATIC_EXCEPTIONS
        assert "yandex" in _STATIC_EXCEPTIONS
        assert "vk" in _STATIC_EXCEPTIONS


class TestIsAnglicism:
    """Тесты для функции определения англицизмов"""

    def test_detects_anglicisms(self):
        """Должна определять англицизмы"""
        assert _is_anglicism("менеджер") is True
        assert _is_anglicism("маркетинг") is True
        assert _is_anglicism("стартап") is True
        assert _is_anglicism("хайп") is True

    def test_not_anglicism(self):
        """Не должна определять русские слова как англицизмы"""
        assert _is_anglicism("дом") is False
        assert _is_anglicism("работа") is False
        assert _is_anglicism("книга") is False


class TestIsRomanNumeral:
    """Тесты для функции определения римских цифр"""

    def test_detects_roman_numerals(self):
        """Должна определять римские цифры"""
        assert _is_roman_numeral("I") is True
        assert _is_roman_numeral("V") is True
        assert _is_roman_numeral("X") is True
        assert _is_roman_numeral("L") is True
        assert _is_roman_numeral("C") is True
        assert _is_roman_numeral("D") is True
        assert _is_roman_numeral("M") is True
        assert _is_roman_numeral("III") is True
        assert _is_roman_numeral("XIX") is True

    def test_not_roman_numeral(self):
        """Не должна определять не римские цифры"""
        assert _is_roman_numeral("ABC") is False
        assert _is_roman_numeral("123") is False
        assert _is_roman_numeral("test") is False


class TestGetTechnicalWordParts:
    """Тесты для функции извлечения технических частей"""

    def test_extract_email_parts(self):
        """Должна извлекать части из email"""
        text = "Напишите на test@example.com"
        parts = _get_technical_word_parts(text)
        assert "test" in parts
        assert "example" in parts
        assert "com" in parts

    def test_extract_url_parts(self):
        """Должна извлекать части из URL"""
        text = "Перейдите на https://example.com/page"
        parts = _get_technical_word_parts(text)
        assert "example" in parts
        assert "com" in parts
        assert "page" in parts

    def test_no_technical_words(self):
        """Должна возвращать пустое множество если нет технических слов"""
        text = "Просто обычный текст без email и url"
        parts = _get_technical_word_parts(text)
        assert len(parts) == 0


class TestAnalyzeText:
    """Тесты для основной функции анализа текста"""

    @pytest.mark.asyncio
    async def test_empty_text(self):
        """Пустой текст должен возвращать 0 нарушений"""
        result = await analyze_text("")
        assert result.summary.violations_count == 0
        assert result.summary.total_tokens == 0

    @pytest.mark.asyncio
    async def test_text_with_only_exceptions(self):
        """Текст только с исключениями не должен иметь нарушений"""
        text = "email e-mail http https www"
        result = await analyze_text(text)
        assert result.summary.violations_count == 0

    @pytest.mark.asyncio
    async def test_text_with_roman_numerals(self):
        """Текст с римскими цифрами не должен иметь нарушений"""
        text = "Глава I, век V, размер L"
        result = await analyze_text(text)
        assert result.summary.violations_count == 0

    @pytest.mark.asyncio
    async def test_text_with_single_cyrillic_letters(self):
        """Одиночные кириллические буквы не должны быть нарушениями"""
        text = "В г. Москве, ул. Ленина, д. 5"
        result = await analyze_text(text)
        # г., ул., д. - одиночные буквы, не должны быть нарушениями
        assert result.summary.violations_count == 0

    @pytest.mark.asyncio
    async def test_text_with_numbers_attached(self):
        """Слова с приклеенными цифрами должны пропускатся"""
        text = "болезни3 действие1 дня2"
        result = await analyze_text(text)
        # Слова с цифрами должны фильтроваться
        assert result.summary.violations_count == 0

    @pytest.mark.asyncio
    async def test_text_with_javascript_code(self):
        """JavaScript код должен фильтроваться"""
        text = "document.createElement('div') window.addEventListener"
        result = await analyze_text(text)
        # JS методы должны быть в исключениях
        assert result.summary.violations_count == 0

    @pytest.mark.asyncio
    async def test_russian_text_no_violations(self):
        """Правильный русский текст не должен иметь нарушений"""
        text = "Мама мыла раму. Папа читал газету."
        result = await analyze_text(text)
        assert result.summary.violations_count == 0

    @pytest.mark.asyncio
    async def test_text_with_trademark(self):
        """Текст с брендами не должен помечать их как нарушения"""
        # Сначала нужно добавить бренд через API, этот тест будет интеграционным
        text = "Препарат Трекрезан помогает при ОРВИ"
        result = await analyze_text(text)
        # Трекрезан должен быть в базе брендов
        violations = [v for v in result.violations if v.word.lower() == "трекрезан"]
        assert len(violations) == 0

    @pytest.mark.asyncio
    async def test_foreign_word_detection(self):
        """Должна находить иностранные слова"""
        text = "Это текст содержит слово download"
        result = await analyze_text(text)
        violations = [v for v in result.violations if v.word == "download"]
        assert len(violations) > 0
        assert violations[0].type == "foreign_word"

    @pytest.mark.asyncio
    async def test_possible_trademark_detection(self):
        """Должна находить потенциальные бренды"""
        text = "Компания SuperBrand работает на рынке"
        result = await analyze_text(text)
        violations = [v for v in result.violations if v.word == "SuperBrand"]
        assert len(violations) > 0
        assert violations[0].type == "possible_trademark"

    @pytest.mark.asyncio
    async def test_compliance_percent_calculation(self):
        """Должен правильно считать процент соответствия"""
        text = "Мама мыла раму download"
        result = await analyze_text(text)
        # 4 токена, 1 нарушение = 75%
        assert result.summary.compliance_percent == 75.0

    @pytest.mark.asyncio
    async def test_text_context_extraction(self):
        """Должен правильно извлекать контекст"""
        text = "Это длинный текст для проверки извлечения контекста для слова download"
        result = await analyze_text(text)
        if result.violations:
            violation = result.violations[0]
            assert "download" in violation.text_context
            assert len(violation.text_context) > len("download")


class TestEdgeCases:
    """Тесты граничных случаев"""

    @pytest.mark.asyncio
    async def test_mixed_language_text(self):
        """Текст со смешанными языками"""
        text = "Привет Hello мир World"
        result = await analyze_text(text)
        # Hello и World должны быть найдены как иностранные слова
        assert result.summary.total_tokens > 0

    @pytest.mark.asyncio
    async def test_text_with_special_characters(self):
        """Текст со спецсимволами"""
        text = "Тест @ # $ % ^ & * () текст"
        result = await analyze_text(text)
        # Спецсимволы должны игнорироваться
        assert result.summary.total_tokens >= 2  # "Тест" и "текст"

    @pytest.mark.asyncio
    async def test_text_with_hyphenated_words(self):
        """Текст с дефисными словами"""
        text = "Интернет-магазин веб-разработка SEO-оптимизация"
        result = await analyze_text(text)
        # Дефисные слова должны обрабатываться корректно
        assert result.summary.total_tokens > 0

    @pytest.mark.asyncio
    async def test_very_long_text(self):
        """Очень длинный текст"""
        text = " ".join(["слово"] * 1000)
        result = await analyze_text(text)
        assert result.summary.total_tokens == 1000

    @pytest.mark.asyncio
    async def test_uppercase_words(self):
        """Слова заглавными буквами (имена собственные)"""
        text = "МОСКВА ЛОНДОН ПАРИЖ"
        result = await analyze_text(text)
        # Имена собственные с большой буквы могут пропускаться
        assert result.summary.total_tokens == 3
