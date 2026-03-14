/**
 * Тесты для утилит маппинга товарных знаков
 * Покрытие: isTrademark, mapTrademarks, filterByType, filterBySearch
 */

import { describe, it, expect } from 'vitest';
import {
  isTrademark,
  mapTrademarks,
  filterByType,
  filterBySearch,
  type Trademark,
  type BaseViolation,
} from '../../utils/trademarkMapper';

describe('trademarkMapper', () => {
  const mockTrademarks: Trademark[] = [
    { id: '1', word: 'Nike', normal_form: 'nike' },
    { id: '2', word: 'Adidas', normal_form: 'adidas' },
  ];

  describe('isTrademark', () => {
    it('должен определять товарный знак из foreign_word', () => {
      const violation: BaseViolation = {
        id: '1',
        type: 'foreign_word',
        normal_form: 'nike',
        text_context: 'купить nike',
      };

      expect(isTrademark(violation, mockTrademarks)).toBe(true);
    });

    it('должен определять товарный знак из unrecognized_word', () => {
      const violation: BaseViolation = {
        id: '2',
        type: 'unrecognized_word',
        normal_form: 'adidas',
        text_context: 'обувь adidas',
      };

      expect(isTrademark(violation, mockTrademarks)).toBe(true);
    });

    it('не должен определять обычный текст как товарный знак', () => {
      const violation: BaseViolation = {
        id: '3',
        type: 'foreign_word',
        normal_form: 'house',
        text_context: 'купить дом',
      };

      expect(isTrademark(violation, mockTrademarks)).toBe(false);
    });

    it('должен возвращать false если нет normal_form', () => {
      const violation: BaseViolation = {
        id: '4',
        type: 'foreign_word',
        text_context: 'текст без normal_form',
      };

      expect(isTrademark(violation, mockTrademarks)).toBe(false);
    });

    it('не должен определять товарный знак из других типов', () => {
      const violation: BaseViolation = {
        id: '5',
        type: 'no_russian_dub',
        normal_form: 'nike',
        text_context: 'nike без перевода',
      };

      expect(isTrademark(violation, mockTrademarks)).toBe(false);
    });
  });

  describe('mapTrademarks', () => {
    it('должен заменять тип на trademark для известных брендов', () => {
      const violations: BaseViolation[] = [
        {
          id: '1',
          type: 'foreign_word',
          normal_form: 'nike',
          text_context: 'купить nike',
        },
        {
          id: '2',
          type: 'foreign_word',
          normal_form: 'house',
          text_context: 'купить дом',
        },
      ];

      const result = mapTrademarks(violations, mockTrademarks);

      expect(result[0].type).toBe('trademark');
      expect(result[1].type).toBe('foreign_word');
    });

    it('должен сохранять остальные поля нарушения', () => {
      const violation: BaseViolation = {
        id: '1',
        type: 'foreign_word',
        normal_form: 'nike',
        text_context: 'купить nike',
        word: 'nike',
      };

      const result = mapTrademarks([violation], mockTrademarks);

      expect(result[0]).toEqual({
        ...violation,
        type: 'trademark',
      });
    });
  });

  describe('filterByType', () => {
    const violations: BaseViolation[] = [
      { id: '1', type: 'foreign_word', text_context: '1' },
      { id: '2', type: 'unrecognized_word', text_context: '2' },
      { id: '3', type: 'trademark', text_context: '3' },
    ];

    it('должен возвращать все нарушения если фильтр пустой', () => {
      expect(filterByType(violations, [])).toEqual(violations);
    });

    it('должен фильтровать по одному типу', () => {
      const result = filterByType(violations, ['foreign_word']);
      expect(result.length).toBe(1);
      expect(result[0].type).toBe('foreign_word');
    });

    it('должен фильтровать по нескольким типам', () => {
      const result = filterByType(violations, ['foreign_word', 'trademark']);
      expect(result.length).toBe(2);
    });
  });

  describe('filterBySearch', () => {
    const violations: BaseViolation[] = [
      { id: '1', type: 'foreign_word', word: 'nike', text_context: 'купить nike shoes', page_url: 'https://shop.com' },
      { id: '2', type: 'foreign_word', word: 'adidas', text_context: 'adidas original', page_url: 'https://sport.com' },
      { id: '3', type: 'unrecognized_word', word: 'house', text_context: 'купить дом', page_url: 'https://realty.com' },
    ];

    it('должен возвращать все нарушения если запрос пустой', () => {
      expect(filterBySearch(violations, '')).toEqual(violations);
    });

    it('должен искать по слову', () => {
      const result = filterBySearch(violations, 'nike');
      expect(result.length).toBe(1);
      expect(result[0].word).toBe('nike');
    });

    it('должен искать по контексту', () => {
      const result = filterBySearch(violations, 'original');
      expect(result.length).toBe(1);
      expect(result[0].word).toBe('adidas');
    });

    it('должен искать по URL', () => {
      const result = filterBySearch(violations, 'shop.com');
      expect(result.length).toBe(1);
      expect(result[0].page_url).toBe('https://shop.com');
    });

    it('должен строго искать по URL если запрос начинается с http', () => {
      const result = filterBySearch(violations, 'https://shop.com');
      expect(result.length).toBe(1);
      expect(result[0].page_url).toBe('https://shop.com');
    });

    it('должен искать без учета регистра', () => {
      const result = filterBySearch(violations, 'NIKE');
      expect(result.length).toBe(1);
      expect(result[0].word).toBe('nike');
    });
  });
});
