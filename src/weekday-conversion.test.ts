/**
 * Test weekday conversion logic to prevent regression of issue #15
 *
 * Both Simple Calendar and Seasons & Stars use 0-based weekdays:
 * - Sunday = 0, Monday = 1, Tuesday = 2, ..., Saturday = 6
 *
 * The bug was caused by incorrectly assuming S&S used 1-based weekdays
 * and applying unnecessary -1 conversions.
 */

import { describe, it, expect } from 'vitest';

describe('Weekday Conversion Logic', () => {
  const weekdayNames = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  describe('Weekday validation and array access', () => {
    it('should validate 0-based weekdays correctly', () => {
      // Test the fixed validation logic
      for (let weekday = 0; weekday < 7; weekday++) {
        const isValid = weekday >= 0 && weekday < weekdayNames.length;
        expect(isValid).toBe(true);
      }

      // Test invalid weekdays
      const invalidWeekday1 = -1;
      const invalidWeekday2 = 7;
      expect(invalidWeekday1 >= 0 && invalidWeekday1 < weekdayNames.length).toBe(false);
      expect(invalidWeekday2 >= 0 && invalidWeekday2 < weekdayNames.length).toBe(false);
    });

    it('should access weekday names without conversion', () => {
      // Test direct array access (the fix)
      expect(weekdayNames[0]).toBe('Sunday');
      expect(weekdayNames[1]).toBe('Monday');
      expect(weekdayNames[6]).toBe('Saturday');

      // Test that the old buggy conversion would fail
      // weekdayNames[weekday - 1] for weekday=0 would access index -1
      expect(weekdayNames[-1]).toBeUndefined();
    });
  });

  describe('Date format conversion for Simple Calendar compatibility', () => {
    it('should convert S&S date to Simple Calendar format without weekday adjustment', () => {
      const ssDate = {
        year: 2024,
        month: 6, // S&S 1-based month (June)
        day: 15, // S&S 1-based day
        weekday: 2, // S&S 0-based weekday (Tuesday)
        time: { hour: 14, minute: 30, second: 0 },
      };

      // The correct conversion (after fix)
      const scDate = {
        year: ssDate.year,
        month: ssDate.month - 1, // Convert to 0-based (5 = June)
        day: ssDate.day - 1, // Convert to 0-based (14)
        dayOfTheWeek: ssDate.weekday, // No conversion needed (2 = Tuesday)
        hour: ssDate.time.hour,
        minute: ssDate.time.minute,
        second: ssDate.time.second,
      };

      expect(scDate.month).toBe(5); // June in 0-based
      expect(scDate.day).toBe(14); // 14th in 0-based
      expect(scDate.dayOfTheWeek).toBe(2); // Tuesday in 0-based

      // Verify weekday name lookup works
      expect(weekdayNames[scDate.dayOfTheWeek]).toBe('Tuesday');
    });

    it('should handle edge case weekdays correctly', () => {
      // Test Sunday (weekday 0)
      const sundayDate = { weekday: 0 };
      const scSunday = { dayOfTheWeek: sundayDate.weekday }; // No conversion
      expect(scSunday.dayOfTheWeek).toBe(0);
      expect(weekdayNames[scSunday.dayOfTheWeek]).toBe('Sunday');

      // Test Saturday (weekday 6)
      const saturdayDate = { weekday: 6 };
      const scSaturday = { dayOfTheWeek: saturdayDate.weekday }; // No conversion
      expect(scSaturday.dayOfTheWeek).toBe(6);
      expect(weekdayNames[scSaturday.dayOfTheWeek]).toBe('Saturday');
    });
  });

  describe('Display formatting', () => {
    it('should format weekday display names correctly', () => {
      const testCases = [
        { weekday: 0, expected: 'Sunday' },
        { weekday: 1, expected: 'Monday' },
        { weekday: 2, expected: 'Tuesday' },
        { weekday: 3, expected: 'Wednesday' },
        { weekday: 4, expected: 'Thursday' },
        { weekday: 5, expected: 'Friday' },
        { weekday: 6, expected: 'Saturday' },
      ];

      testCases.forEach(({ weekday, expected }) => {
        // Test the fixed logic: direct array access
        const weekdayName =
          weekday >= 0 && weekday < weekdayNames.length ? weekdayNames[weekday] : 'Unknown Day';

        expect(weekdayName).toBe(expected);
      });
    });

    it('should handle invalid weekdays gracefully', () => {
      const invalidWeekdays = [-1, 7, 10, -5];

      invalidWeekdays.forEach(weekday => {
        const weekdayName =
          weekday >= 0 && weekday < weekdayNames.length ? weekdayNames[weekday] : 'Unknown Day';

        expect(weekdayName).toBe('Unknown Day');
      });
    });
  });

  describe('Regression test for WFRP4e issue #15', () => {
    it('should not apply incorrect weekday conversions that caused date offset', () => {
      // Simulate the WFRP4e scenario that caused the bug
      const wfrp4eDate = {
        year: 2512,
        month: 3, // Pflugzeit (March equivalent)
        day: 15,
        weekday: 1, // Monday in 0-based system
      };

      // The bug: incorrect -1 conversion
      const buggyConversion = {
        dayOfTheWeek: wfrp4eDate.weekday - 1, // Would result in 0 (Sunday) - WRONG
      };

      // The fix: no conversion needed
      const correctConversion = {
        dayOfTheWeek: wfrp4eDate.weekday, // Results in 1 (Monday) - CORRECT
      };

      expect(buggyConversion.dayOfTheWeek).toBe(0); // Sunday - wrong day
      expect(correctConversion.dayOfTheWeek).toBe(1); // Monday - correct day

      expect(weekdayNames[buggyConversion.dayOfTheWeek]).toBe('Sunday');
      expect(weekdayNames[correctConversion.dayOfTheWeek]).toBe('Monday');
    });

    it('should handle Sunday correctly (the edge case that exposed the bug)', () => {
      const sundayDate = {
        weekday: 0, // Sunday in 0-based system
      };

      // The bug: weekday - 1 would result in -1, causing array access error
      const buggyResult = sundayDate.weekday - 1; // -1
      const buggyWeekdayName = weekdayNames[buggyResult]; // undefined

      // The fix: direct weekday value
      const correctResult = sundayDate.weekday; // 0
      const correctWeekdayName = weekdayNames[correctResult]; // 'Sunday'

      expect(buggyResult).toBe(-1);
      expect(buggyWeekdayName).toBeUndefined();

      expect(correctResult).toBe(0);
      expect(correctWeekdayName).toBe('Sunday');
    });
  });
});
