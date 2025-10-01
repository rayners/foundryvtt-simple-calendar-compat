/**
 * Tests for format conversion helpers
 * Critical for proper 0-based (Simple Calendar) ↔ 1-based (S&S) conversion
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SimpleCalendarAPIBridge } from '../src/api/simple-calendar-api';

describe('Format Conversion Helpers', () => {
  let api: SimpleCalendarAPIBridge;

  beforeEach(() => {
    // Create API without S&S integration to test fallback methods
    api = new SimpleCalendarAPIBridge();
  });

  describe('createFallbackDateTime', () => {
    it('should create fallback datetime from timestamp 0', () => {
      const result = (api as any).createFallbackDateTime(0);

      expect(result).toEqual({
        year: 2023,
        month: 0, // 0-based January
        day: 0, // 0-based day
        hour: 0,
        minute: 0,
        seconds: 0,
      });
    });

    it('should calculate days from timestamp', () => {
      const oneDayInSeconds = 86400;
      const result = (api as any).createFallbackDateTime(oneDayInSeconds);

      expect(result.year).toBe(2023);
      expect(result.month).toBe(0);
      expect(result.day).toBe(1); // 1 day elapsed (0-based)
      expect(result.hour).toBe(0);
      expect(result.minute).toBe(0);
      expect(result.seconds).toBe(0);
    });

    it('should calculate hours from timestamp', () => {
      const threeHoursInSeconds = 3 * 3600;
      const result = (api as any).createFallbackDateTime(threeHoursInSeconds);

      expect(result.day).toBe(0); // Same day
      expect(result.hour).toBe(3);
      expect(result.minute).toBe(0);
      expect(result.seconds).toBe(0);
    });

    it('should calculate minutes from timestamp', () => {
      const fortyFiveMinutesInSeconds = 45 * 60;
      const result = (api as any).createFallbackDateTime(fortyFiveMinutesInSeconds);

      expect(result.day).toBe(0);
      expect(result.hour).toBe(0);
      expect(result.minute).toBe(45);
      expect(result.seconds).toBe(0);
    });

    it('should calculate seconds from timestamp', () => {
      const result = (api as any).createFallbackDateTime(37);

      expect(result.day).toBe(0);
      expect(result.hour).toBe(0);
      expect(result.minute).toBe(0);
      expect(result.seconds).toBe(37);
    });

    it('should handle complex timestamp with days, hours, minutes, and seconds', () => {
      // 2 days, 5 hours, 30 minutes, 45 seconds
      const timestamp = 2 * 86400 + 5 * 3600 + 30 * 60 + 45;
      const result = (api as any).createFallbackDateTime(timestamp);

      expect(result.year).toBe(2023);
      expect(result.month).toBe(0);
      expect(result.day).toBe(2); // 2 days
      expect(result.hour).toBe(5);
      expect(result.minute).toBe(30);
      expect(result.seconds).toBe(45);
    });

    it('should use "seconds" not "second" property name', () => {
      const result = (api as any).createFallbackDateTime(0);

      expect(result).toHaveProperty('seconds');
      expect(result).not.toHaveProperty('second');
    });
  });

  describe('convertSSToSCFormat', () => {
    it('should convert 1-based S&S date to 0-based Simple Calendar date', () => {
      const ssDate = {
        year: 2024,
        month: 6, // June (1-based)
        day: 15, // 15th (1-based)
        weekday: 3,
        time: { hour: 12, minute: 30, second: 45 },
      };

      const result = (api as any).convertSSToSCFormat(ssDate);

      expect(result).toEqual({
        year: 2024,
        month: 5, // May (0-based) - converted from June
        day: 14, // 14 (0-based) - converted from 15
        hour: 12,
        minute: 30,
        seconds: 45, // Note: 'seconds' not 'second'
      });
    });

    it('should convert month 1 (January) to month 0', () => {
      const ssDate = {
        year: 2024,
        month: 1,
        day: 1,
        weekday: 0,
      };

      const result = (api as any).convertSSToSCFormat(ssDate);

      expect(result.month).toBe(0); // 0-based January
      expect(result.day).toBe(0); // 0-based first day
    });

    it('should convert month 12 (December) to month 11', () => {
      const ssDate = {
        year: 2024,
        month: 12,
        day: 31,
        weekday: 2,
      };

      const result = (api as any).convertSSToSCFormat(ssDate);

      expect(result.month).toBe(11); // 0-based December
      expect(result.day).toBe(30); // 0-based last day
    });

    it('should handle missing time with defaults', () => {
      const ssDate = {
        year: 2024,
        month: 6,
        day: 15,
        weekday: 3,
        // No time property
      };

      const result = (api as any).convertSSToSCFormat(ssDate);

      expect(result.hour).toBe(0);
      expect(result.minute).toBe(0);
      expect(result.seconds).toBe(0);
    });

    it('should handle partial time with defaults', () => {
      const ssDate = {
        year: 2024,
        month: 6,
        day: 15,
        weekday: 3,
        time: { hour: 12 }, // Missing minute and second
      };

      const result = (api as any).convertSSToSCFormat(ssDate);

      expect(result.hour).toBe(12);
      expect(result.minute).toBe(0);
      expect(result.seconds).toBe(0);
    });
  });

  describe('convertSCToSSFormat', () => {
    it('should convert 0-based Simple Calendar date to 1-based S&S date', () => {
      const scDate = {
        year: 2024,
        month: 5, // May (0-based)
        day: 14, // 14 (0-based)
        hour: 12,
        minute: 30,
        seconds: 45,
      };

      const result = (api as any).convertSCToSSFormat(scDate);

      expect(result).toEqual({
        year: 2024,
        month: 6, // June (1-based) - converted from May
        day: 15, // 15 (1-based) - converted from 14
        weekday: 0, // Default when not provided
        time: {
          hour: 12,
          minute: 30,
          second: 45, // Note: 'second' not 'seconds' in S&S format
        },
      });
    });

    it('should convert month 0 (January) to month 1', () => {
      const scDate = {
        year: 2024,
        month: 0,
        day: 0,
      };

      const result = (api as any).convertSCToSSFormat(scDate);

      expect(result.month).toBe(1); // 1-based January
      expect(result.day).toBe(1); // 1-based first day
    });

    it('should convert month 11 (December) to month 12', () => {
      const scDate = {
        year: 2024,
        month: 11,
        day: 30,
      };

      const result = (api as any).convertSCToSSFormat(scDate);

      expect(result.month).toBe(12); // 1-based December
      expect(result.day).toBe(31); // 1-based last day
    });

    it('should handle missing month/day with defaults', () => {
      const scDate = {
        year: 2024,
        // Missing month and day
      };

      const result = (api as any).convertSCToSSFormat(scDate);

      expect(result.month).toBe(1); // 0 + 1 = 1
      expect(result.day).toBe(1); // 0 + 1 = 1
    });

    it('should handle weekday field', () => {
      const scDate = {
        year: 2024,
        month: 5,
        day: 14,
        weekday: 3, // Wednesday (0-based, no conversion needed)
      };

      const result = (api as any).convertSCToSSFormat(scDate);

      expect(result.weekday).toBe(3); // Weekday stays 0-based
    });

    it('should handle dayOfTheWeek alias for weekday', () => {
      const scDate = {
        year: 2024,
        month: 5,
        day: 14,
        dayOfTheWeek: 5, // Friday
      };

      const result = (api as any).convertSCToSSFormat(scDate);

      expect(result.weekday).toBe(5); // Uses dayOfTheWeek when weekday not present
    });

    it('should prefer dayOfTheWeek over weekday if both present', () => {
      const scDate = {
        year: 2024,
        month: 5,
        day: 14,
        dayOfTheWeek: 5,
        weekday: 3,
      };

      const result = (api as any).convertSCToSSFormat(scDate);

      expect(result.weekday).toBe(5); // dayOfTheWeek takes precedence
    });

    it('should handle "second" vs "seconds" property name', () => {
      const scDateWithSeconds = {
        year: 2024,
        month: 5,
        day: 14,
        seconds: 45,
      };

      const result1 = (api as any).convertSCToSSFormat(scDateWithSeconds);
      expect(result1.time.second).toBe(45);

      const scDateWithSecond = {
        year: 2024,
        month: 5,
        day: 14,
        second: 30,
      };

      const result2 = (api as any).convertSCToSSFormat(scDateWithSecond);
      expect(result2.time.second).toBe(30);
    });

    it('should handle missing time fields with defaults', () => {
      const scDate = {
        year: 2024,
        month: 5,
        day: 14,
        // No time fields
      };

      const result = (api as any).convertSCToSSFormat(scDate);

      expect(result.time).toEqual({
        hour: 0,
        minute: 0,
        second: 0,
      });
    });
  });

  describe('Round-trip conversion accuracy', () => {
    it('should maintain data integrity through SC → SS → SC conversion', () => {
      const originalSC = {
        year: 2024,
        month: 5, // June (0-based)
        day: 14, // 15th (0-based)
        hour: 12,
        minute: 30,
        seconds: 45,
        weekday: 3,
      };

      // Convert to SS format
      const ssFormat = (api as any).convertSCToSSFormat(originalSC);

      // Convert back to SC format
      const backToSC = (api as any).convertSSToSCFormat(ssFormat);

      expect(backToSC.year).toBe(originalSC.year);
      expect(backToSC.month).toBe(originalSC.month);
      expect(backToSC.day).toBe(originalSC.day);
      expect(backToSC.hour).toBe(originalSC.hour);
      expect(backToSC.minute).toBe(originalSC.minute);
      expect(backToSC.seconds).toBe(originalSC.seconds);
    });

    it('should maintain data integrity through SS → SC → SS conversion', () => {
      const originalSS = {
        year: 2024,
        month: 6, // June (1-based)
        day: 15, // 15th (1-based)
        weekday: 3,
        time: { hour: 12, minute: 30, second: 45 },
      };

      // Convert to SC format
      const scFormat = (api as any).convertSSToSCFormat(originalSS);

      // Convert back to SS format
      const backToSS = (api as any).convertSCToSSFormat(scFormat);

      expect(backToSS.year).toBe(originalSS.year);
      expect(backToSS.month).toBe(originalSS.month);
      expect(backToSS.day).toBe(originalSS.day);
      expect(backToSS.time.hour).toBe(originalSS.time.hour);
      expect(backToSS.time.minute).toBe(originalSS.time.minute);
      expect(backToSS.time.second).toBe(originalSS.time.second);
    });
  });

  describe('Edge cases', () => {
    it('should handle year boundaries correctly', () => {
      const scDate = { year: 1, month: 0, day: 0 };
      const result = (api as any).convertSCToSSFormat(scDate);

      expect(result.year).toBe(1);
      expect(result.month).toBe(1);
      expect(result.day).toBe(1);
    });

    it('should handle large year values', () => {
      const scDate = { year: 9999, month: 11, day: 30 };
      const result = (api as any).convertSCToSSFormat(scDate);

      expect(result.year).toBe(9999);
      expect(result.month).toBe(12);
      expect(result.day).toBe(31);
    });

    it('should handle negative years (if supported)', () => {
      const scDate = { year: -100, month: 0, day: 0 };
      const result = (api as any).convertSCToSSFormat(scDate);

      expect(result.year).toBe(-100);
      expect(result.month).toBe(1);
      expect(result.day).toBe(1);
    });
  });
});
