/**
 * Tests for Simple Calendar Icon Constants
 * Required by Simple Weather and other modules for season-based functionality
 */

import { describe, it, expect } from 'vitest';
import { Icons } from '../src/api/simple-calendar-api';

describe('Simple Calendar Icon Constants', () => {
  describe('Icons export', () => {
    it('should export Icons object', () => {
      expect(Icons).toBeDefined();
      expect(typeof Icons).toBe('object');
    });

    it('should provide Fall icon constant', () => {
      expect(Icons.Fall).toBe('fall');
    });

    it('should provide Winter icon constant', () => {
      expect(Icons.Winter).toBe('winter');
    });

    it('should provide Spring icon constant', () => {
      expect(Icons.Spring).toBe('spring');
    });

    it('should provide Summer icon constant', () => {
      expect(Icons.Summer).toBe('summer');
    });

    it('should have exactly 4 season constants', () => {
      const keys = Object.keys(Icons);
      expect(keys).toHaveLength(4);
      expect(keys).toContain('Fall');
      expect(keys).toContain('Winter');
      expect(keys).toContain('Spring');
      expect(keys).toContain('Summer');
    });

    it('should have all lowercase string values', () => {
      expect(Icons.Fall).toMatch(/^[a-z]+$/);
      expect(Icons.Winter).toMatch(/^[a-z]+$/);
      expect(Icons.Spring).toMatch(/^[a-z]+$/);
      expect(Icons.Summer).toMatch(/^[a-z]+$/);
    });
  });

  describe('Simple Weather compatibility', () => {
    it('should match Simple Calendar icon format', () => {
      // Simple Weather expects these exact string values
      expect(Icons.Fall).toBe('fall');
      expect(Icons.Winter).toBe('winter');
      expect(Icons.Spring).toBe('spring');
      expect(Icons.Summer).toBe('summer');
    });

    it('should be importable for Simple Weather season-based weather generation', () => {
      // Verify that Icons can be imported and used
      const seasonIcon = Icons.Spring;
      expect(seasonIcon).toBeTruthy();
      expect(typeof seasonIcon).toBe('string');
    });
  });
});
