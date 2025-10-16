import {
  validateRequestParams,
  isValidJsonString,
  isNonEmptyString,
  isPositiveNumber,
  isValidRange
} from '../../../src/middleware/shared/utils/validation.utils';

describe('Validation Utils', () => {
  describe('validateRequestParams', () => {
    it('should validate all required params are present', () => {
      const params = { name: 'test', age: 25, city: 'Berlin' };
      const required = ['name', 'age'];
      
      const result = validateRequestParams(params, required);
      
      expect(result.isValid).toBe(true);
      expect(result.missing).toEqual([]);
    });

    it('should detect missing params', () => {
      const params = { name: 'test' };
      const required = ['name', 'age', 'city'];
      
      const result = validateRequestParams(params, required);
      
      expect(result.isValid).toBe(false);
      expect(result.missing).toEqual(['age', 'city']);
    });

    it('should handle empty required list', () => {
      const params = { name: 'test' };
      const required: string[] = [];
      
      const result = validateRequestParams(params, required);
      
      expect(result.isValid).toBe(true);
      expect(result.missing).toEqual([]);
    });
  });

  describe('isValidJsonString', () => {
    it('should return true for valid JSON', () => {
      expect(isValidJsonString('{"key": "value"}')).toBe(true);
      expect(isValidJsonString('[1, 2, 3]')).toBe(true);
      expect(isValidJsonString('"string"')).toBe(true);
    });

    it('should return false for invalid JSON', () => {
      expect(isValidJsonString('{invalid}')).toBe(false);
      expect(isValidJsonString('undefined')).toBe(false);
      expect(isValidJsonString('')).toBe(false);
    });
  });

  describe('isNonEmptyString', () => {
    it('should return true for non-empty strings', () => {
      expect(isNonEmptyString('hello')).toBe(true);
      expect(isNonEmptyString(' text ')).toBe(true);
    });

    it('should return false for empty or whitespace strings', () => {
      expect(isNonEmptyString('')).toBe(false);
      expect(isNonEmptyString('   ')).toBe(false);
    });

    it('should return false for non-strings', () => {
      expect(isNonEmptyString(123)).toBe(false);
      expect(isNonEmptyString(null)).toBe(false);
      expect(isNonEmptyString(undefined)).toBe(false);
    });
  });

  describe('isPositiveNumber', () => {
    it('should return true for positive numbers', () => {
      expect(isPositiveNumber(1)).toBe(true);
      expect(isPositiveNumber(0.5)).toBe(true);
      expect(isPositiveNumber(100)).toBe(true);
    });

    it('should return false for non-positive numbers', () => {
      expect(isPositiveNumber(0)).toBe(false);
      expect(isPositiveNumber(-1)).toBe(false);
      expect(isPositiveNumber(-0.5)).toBe(false);
    });

    it('should return false for non-numbers', () => {
      expect(isPositiveNumber('5')).toBe(false);
      expect(isPositiveNumber(NaN)).toBe(false);
      expect(isPositiveNumber(null)).toBe(false);
    });
  });

  describe('isValidRange', () => {
    it('should return true when value is in range', () => {
      expect(isValidRange(0, 10, 5)).toBe(true);
      expect(isValidRange(0, 10, 0)).toBe(true);
      expect(isValidRange(0, 10, 10)).toBe(true);
    });

    it('should return false when value is out of range', () => {
      expect(isValidRange(0, 10, -1)).toBe(false);
      expect(isValidRange(0, 10, 11)).toBe(false);
      expect(isValidRange(5, 10, 4)).toBe(false);
    });
  });
});
