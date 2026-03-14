/**
 * Тесты для утилит валидации
 * Покрытие: isValidUrl, URL_REGEX
 */

import { describe, it, expect } from 'vitest';
import { isValidUrl, URL_REGEX } from '../../utils/validation';

describe('validation', () => {
  describe('URL_REGEX', () => {
    it('должен соответствовать валидным URL', () => {
      const validUrls = [
        'https://example.com',
        'http://example.com',
        'https://example.com/path',
        'https://example.com/path?query=1',
        'https://example.com/path?query=1&foo=bar',
        'https://sub.example.com',
        'https://sub.sub.example.com',
        'http://localhost',
        'http://localhost:8000',
        'https://127.0.0.1',
        'https://127.0.0.1:8000/path',
        'https://example.com:443',
        'http://example.com:8080/api/v1',
      ];

      validUrls.forEach(url => {
        expect(URL_REGEX.test(url)).toBe(true);
      });
    });

    it('не должен соответствовать невалидным URL', () => {
      const invalidUrls = [
        'not-a-url',
        'example.com',
        'www.example.com',
        'ftp://example.com',
        'javascript:alert(1)',
        'file:///path/to/file',
        '',
        '   ',
        'https://',
        'http://',
      ];

      invalidUrls.forEach(url => {
        expect(URL_REGEX.test(url)).toBe(false);
      });
    });
  });

  describe('isValidUrl', () => {
    it('должен принимать валидные URL', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('https://example.com/path?query=1')).toBe(true);
      expect(isValidUrl('http://localhost:8000')).toBe(true);
    });

    it('должен отклонять невалидные URL', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('example.com')).toBe(false);
      expect(isValidUrl('ftp://example.com')).toBe(false);
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl(null as any)).toBe(false);
    });
  });
});
