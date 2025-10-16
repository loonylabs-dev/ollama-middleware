import { getMemoryUsage, isMemoryUsageCritical } from '../../../src/middleware/shared/utils/memory-management.utils';

describe('Memory Management Utils', () => {
  describe('getMemoryUsage', () => {
    it('should return memory usage with MB formatting', () => {
      const usage = getMemoryUsage();
      
      expect(usage).toHaveProperty('rss');
      expect(usage).toHaveProperty('heapTotal');
      expect(usage).toHaveProperty('heapUsed');
      expect(usage).toHaveProperty('external');
      
      expect(usage.rss).toMatch(/^\d+MB$/);
      expect(usage.heapTotal).toMatch(/^\d+MB$/);
      expect(usage.heapUsed).toMatch(/^\d+MB$/);
      expect(usage.external).toMatch(/^\d+MB$/);
    });
  });

  describe('isMemoryUsageCritical', () => {
    it('should return false when under limit', () => {
      const result = isMemoryUsageCritical(10000); // 10GB limit
      expect(result).toBe(false);
    });

    it('should return true when over limit', () => {
      const result = isMemoryUsageCritical(1); // 1MB limit
      expect(result).toBe(true);
    });

    it('should handle edge cases', () => {
      const result = isMemoryUsageCritical(0);
      expect(result).toBe(true);
    });
  });
});
