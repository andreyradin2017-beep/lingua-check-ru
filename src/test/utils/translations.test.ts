/**
 * Тесты для утилит переводов
 * Покрытие: translateViolationType, translateScanStatus, getViolationTypeColor, getScanStatusColor
 */

import { describe, it, expect } from 'vitest';
import {
  translateViolationType,
  translateScanStatus,
  getViolationTypeColor,
  getScanStatusColor,
} from '../../utils/translations';

describe('translations', () => {
  describe('translateViolationType', () => {
    it('должен переводить foreign_word', () => {
      expect(translateViolationType('foreign_word')).toBe('Иностранная лексика');
    });

    it('должен переводить unrecognized_word', () => {
      expect(translateViolationType('unrecognized_word')).toBe('Ошибки и опечатки');
    });

    it('должен переводить possible_trademark', () => {
      expect(translateViolationType('possible_trademark')).toBe('Потенциальный бренд');
    });

    it('должен возвращать оригинал для неизвестных типов', () => {
      expect(translateViolationType('unknown_type')).toBe('unknown_type');
      expect(translateViolationType('')).toBe('');
    });
  });

  describe('translateScanStatus', () => {
    it('должен переводить started', () => {
      expect(translateScanStatus('started')).toBe('Запущено');
    });

    it('должен переводить in_progress', () => {
      expect(translateScanStatus('in_progress')).toBe('В процессе');
    });

    it('должен переводить completed', () => {
      expect(translateScanStatus('completed')).toBe('Завершено');
    });

    it('должен переводить failed', () => {
      expect(translateScanStatus('failed')).toBe('Ошибка');
    });

    it('должен переводить stopped', () => {
      expect(translateScanStatus('stopped')).toBe('Остановлено');
    });

    it('должен возвращать оригинал для неизвестных статусов', () => {
      expect(translateScanStatus('unknown_status')).toBe('unknown_status');
      expect(translateScanStatus('')).toBe('');
    });
  });

  describe('getViolationTypeColor', () => {
    it('должен возвращать red для foreign_word', () => {
      expect(getViolationTypeColor('foreign_word')).toBe('red');
    });

    it('должен возвращать orange для unrecognized_word', () => {
      expect(getViolationTypeColor('unrecognized_word')).toBe('orange');
    });

    it('должен возвращать blue для possible_trademark', () => {
      expect(getViolationTypeColor('possible_trademark')).toBe('blue');
    });

    it('должен возвращать gray для неизвестных типов', () => {
      expect(getViolationTypeColor('unknown_type')).toBe('gray');
      expect(getViolationTypeColor('')).toBe('gray');
    });
  });

  describe('getScanStatusColor', () => {
    it('должен возвращать blue для started', () => {
      expect(getScanStatusColor('started')).toBe('blue');
    });

    it('должен возвращать blue для in_progress', () => {
      expect(getScanStatusColor('in_progress')).toBe('blue');
    });

    it('должен возвращать green для completed', () => {
      expect(getScanStatusColor('completed')).toBe('green');
    });

    it('должен возвращать red для failed', () => {
      expect(getScanStatusColor('failed')).toBe('red');
    });

    it('должен возвращать orange для stopped', () => {
      expect(getScanStatusColor('stopped')).toBe('orange');
    });

    it('должен возвращать gray для неизвестных статусов', () => {
      expect(getScanStatusColor('unknown_status')).toBe('gray');
      expect(getScanStatusColor('')).toBe('gray');
    });
  });
});
