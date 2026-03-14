/**
 * Тесты для утилит санитизации
 * Покрытие: sanitizeText, stripHtmlTags, hasDangerousHtml
 */

import { describe, it, expect } from 'vitest';
import { sanitizeText, stripHtmlTags, hasDangerousHtml } from '../../utils/sanitize';

describe('sanitize', () => {
  describe('sanitizeText', () => {
    it('должен экранировать HTML символы', () => {
      expect(sanitizeText('<script>')).toBe('&lt;script&gt;');
      expect(sanitizeText('a & b')).toBe('a &amp; b');
      expect(sanitizeText('"test"')).toBe('&quot;test&quot;');
      expect(sanitizeText("'test'")).toBe('&#x27;test&#x27;');
      expect(sanitizeText('a / b')).toBe('a &#x2F; b');
      expect(sanitizeText('a > b')).toBe('a &gt; b');
      expect(sanitizeText('a < b')).toBe('a &lt; b');
    });

    it('должен обрабатывать пустые строки', () => {
      expect(sanitizeText('')).toBe('');
      expect(sanitizeText(null as any)).toBe('');
      expect(sanitizeText(undefined as any)).toBe('');
    });

    it('должен обрабатывать обычный текст без изменений', () => {
      expect(sanitizeText('Просто текст')).toBe('Просто текст');
      expect(sanitizeText('12345')).toBe('12345');
    });

    it('должен экранировать несколько опасных символов', () => {
      expect(sanitizeText('<script>alert("XSS")</script>'))
        .toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
    });
  });

  describe('stripHtmlTags', () => {
    it('должен удалять HTML теги', () => {
      expect(stripHtmlTags('<p>Hello</p>')).toBe('Hello');
      expect(stripHtmlTags('<div><span>Test</span></div>')).toBe('Test');
      expect(stripHtmlTags('<b>Жирный</b> <i>Курсив</i>')).toBe('Жирный Курсив');
    });

    it('должен обрабатывать пустые строки', () => {
      expect(stripHtmlTags('')).toBe('');
      expect(stripHtmlTags(null as any)).toBe('');
    });

    it('должен сохранять текст между тегами', () => {
      expect(stripHtmlTags('<div><p>Текст</p></div>')).toBe('Текст');
      expect(stripHtmlTags('Текст <b>между</b> тегами')).toBe('Текст между тегами');
    });

    it('должен удалять теги с атрибутами', () => {
      expect(stripHtmlTags('<a href="http://example.com">Link</a>'))
        .toBe('Link');
      expect(stripHtmlTags('<img src="test.jpg" alt="Image">'))
        .toBe('');
    });
  });

  describe('hasDangerousHtml', () => {
    it('должен определять script теги', () => {
      expect(hasDangerousHtml('<script>alert(1)</script>')).toBe(true);
      expect(hasDangerousHtml('<SCRIPT>alert(1)</SCRIPT>')).toBe(true);
      expect(hasDangerousHtml('<script src="evil.js">')).toBe(true);
    });

    it('должен определять javascript: протокол', () => {
      expect(hasDangerousHtml('javascript:alert(1)')).toBe(true);
      expect(hasDangerousHtml('JAVASCRIPT:alert(1)')).toBe(true);
      expect(hasDangerousHtml('<a href="javascript:alert(1)">')).toBe(true);
    });

    it('должен определять on* обработчики событий', () => {
      expect(hasDangerousHtml('<img onerror="alert(1)">')).toBe(true);
      expect(hasDangerousHtml('<div onclick="alert(1)">')).toBe(true);
      expect(hasDangerousHtml('<body onload="alert(1)">')).toBe(true);
      expect(hasDangerousHtml('<input onfocus="alert(1)">')).toBe(true);
    });

    it('должен определять iframe теги', () => {
      expect(hasDangerousHtml('<iframe src="evil.com">')).toBe(true);
      expect(hasDangerousHtml('<IFRAME SRC="evil.com">')).toBe(true);
    });

    it('должен определять object и embed теги', () => {
      expect(hasDangerousHtml('<object data="evil.swf">')).toBe(true);
      expect(hasDangerousHtml('<embed src="evil.swf">')).toBe(true);
    });

    it('не должен определять безопасный HTML как опасный', () => {
      expect(hasDangerousHtml('<p>Простой текст</p>')).toBe(false);
      expect(hasDangerousHtml('<b>Жирный</b>')).toBe(false);
      expect(hasDangerousHtml('<i>Курсив</i>')).toBe(false);
      expect(hasDangerousHtml('<a href="https://example.com">Link</a>')).toBe(false);
      expect(hasDangerousHtml('<img src="image.jpg" alt="Image">')).toBe(false);
    });

    it('должен обрабатывать пустые строки', () => {
      expect(hasDangerousHtml('')).toBe(false);
      expect(hasDangerousHtml(null as any)).toBe(false);
    });
  });
});
