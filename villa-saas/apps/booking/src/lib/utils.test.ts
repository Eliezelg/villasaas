import { describe, it, expect } from '@jest/globals';
import { formatPrice, cn } from './utils';

describe('utils', () => {
  describe('formatPrice', () => {
    it('should format price in EUR', () => {
      expect(formatPrice(100)).toBe('100,00 €');
      expect(formatPrice(1234.56)).toBe('1 234,56 €');
    });

    it('should format price in USD', () => {
      expect(formatPrice(100, 'USD')).toBe('$100.00');
      expect(formatPrice(1234.56, 'USD')).toBe('$1,234.56');
    });

    it('should handle zero', () => {
      expect(formatPrice(0)).toBe('0,00 €');
    });

    it('should handle negative values', () => {
      expect(formatPrice(-100)).toBe('-100,00 €');
    });
  });

  describe('cn', () => {
    it('should merge class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
      expect(cn('foo', { bar: true })).toBe('foo bar');
      expect(cn('foo', { bar: false })).toBe('foo');
    });

    it('should handle conditional classes', () => {
      expect(cn('base', { active: true, disabled: false })).toBe('base active');
    });

    it('should handle arrays', () => {
      expect(cn(['foo', 'bar'])).toBe('foo bar');
    });

    it('should filter falsy values', () => {
      expect(cn('foo', null, undefined, false, 'bar')).toBe('foo bar');
    });

    it('should handle Tailwind conflicts', () => {
      expect(cn('px-2', 'px-4')).toBe('px-4');
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });
  });
});