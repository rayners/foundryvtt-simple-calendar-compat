/**
 * Tests for BaseCalendarProvider utility methods and default implementations
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BaseCalendarProvider } from '../src/providers/base-provider';
import type { CalendarDate } from '../src/types';

// Concrete test implementation of BaseCalendarProvider
class TestCalendarProvider extends BaseCalendarProvider {
  readonly name = 'TestCalendar';
  readonly version = '1.0.0';

  getCurrentDate(): CalendarDate {
    return {
      year: 2024,
      month: 6,
      day: 15,
      weekday: 3,
      time: { hour: 12, minute: 30, second: 0 },
    };
  }

  worldTimeToDate(timestamp: number): CalendarDate {
    const days = Math.floor(timestamp / 86400);
    const secondsInDay = timestamp % 86400;
    const hour = Math.floor(secondsInDay / 3600);
    const minute = Math.floor((secondsInDay % 3600) / 60);
    const second = secondsInDay % 60;

    return {
      year: 2024,
      month: 1,
      day: days + 1,
      weekday: days % 7,
      time: { hour, minute, second },
    };
  }

  dateToWorldTime(date: CalendarDate): number {
    const daysSinceEpoch = date.day - 1;
    const timeInDay =
      (date.time?.hour || 0) * 3600 + (date.time?.minute || 0) * 60 + (date.time?.second || 0);
    return daysSinceEpoch * 86400 + timeInDay;
  }

  formatDate(date: CalendarDate, _options?: any): string {
    return `${date.year}-${date.month}-${date.day}`;
  }

  getActiveCalendar(): any {
    return { id: 'test-calendar', name: 'Test Calendar' };
  }

  getMonthNames(): string[] {
    return [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
  }

  getWeekdayNames(): string[] {
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  }
}

describe('BaseCalendarProvider', () => {
  let provider: TestCalendarProvider;

  beforeEach(() => {
    provider = new TestCalendarProvider();
  });

  describe('Utility Methods', () => {
    describe('getOrdinalSuffix', () => {
      it('should return "st" for 1, 21, 31, etc.', () => {
        expect((provider as any).getOrdinalSuffix(1)).toBe('st');
        expect((provider as any).getOrdinalSuffix(21)).toBe('st');
        expect((provider as any).getOrdinalSuffix(31)).toBe('st');
        expect((provider as any).getOrdinalSuffix(101)).toBe('st');
      });

      it('should return "nd" for 2, 22, 32, etc.', () => {
        expect((provider as any).getOrdinalSuffix(2)).toBe('nd');
        expect((provider as any).getOrdinalSuffix(22)).toBe('nd');
        expect((provider as any).getOrdinalSuffix(32)).toBe('nd');
        expect((provider as any).getOrdinalSuffix(102)).toBe('nd');
      });

      it('should return "rd" for 3, 23, 33, etc.', () => {
        expect((provider as any).getOrdinalSuffix(3)).toBe('rd');
        expect((provider as any).getOrdinalSuffix(23)).toBe('rd');
        expect((provider as any).getOrdinalSuffix(33)).toBe('rd');
        expect((provider as any).getOrdinalSuffix(103)).toBe('rd');
      });

      it('should return "th" for 4-10', () => {
        expect((provider as any).getOrdinalSuffix(4)).toBe('th');
        expect((provider as any).getOrdinalSuffix(5)).toBe('th');
        expect((provider as any).getOrdinalSuffix(6)).toBe('th');
        expect((provider as any).getOrdinalSuffix(7)).toBe('th');
        expect((provider as any).getOrdinalSuffix(8)).toBe('th');
        expect((provider as any).getOrdinalSuffix(9)).toBe('th');
        expect((provider as any).getOrdinalSuffix(10)).toBe('th');
      });

      it('should return "th" for 11, 12, 13 (special cases)', () => {
        expect((provider as any).getOrdinalSuffix(11)).toBe('th');
        expect((provider as any).getOrdinalSuffix(12)).toBe('th');
        expect((provider as any).getOrdinalSuffix(13)).toBe('th');
        // Note: 111, 112, 113 don't fall into the 11-13 special case
        // because they check day >= 11 && day <= 13, not the tens digit
        expect((provider as any).getOrdinalSuffix(111)).toBe('st');
        expect((provider as any).getOrdinalSuffix(112)).toBe('nd');
        expect((provider as any).getOrdinalSuffix(113)).toBe('rd');
      });

      it('should return "th" for other numbers', () => {
        expect((provider as any).getOrdinalSuffix(14)).toBe('th');
        expect((provider as any).getOrdinalSuffix(20)).toBe('th');
        expect((provider as any).getOrdinalSuffix(100)).toBe('th');
      });
    });

    describe('validateMonth', () => {
      it('should return true for valid months (1-based)', () => {
        const monthNames = provider.getMonthNames();
        expect((provider as any).validateMonth(1, monthNames)).toBe(true);
        expect((provider as any).validateMonth(6, monthNames)).toBe(true);
        expect((provider as any).validateMonth(12, monthNames)).toBe(true);
      });

      it('should return false for month 0', () => {
        const monthNames = provider.getMonthNames();
        expect((provider as any).validateMonth(0, monthNames)).toBe(false);
      });

      it('should return false for months exceeding array length', () => {
        const monthNames = provider.getMonthNames();
        expect((provider as any).validateMonth(13, monthNames)).toBe(false);
        expect((provider as any).validateMonth(100, monthNames)).toBe(false);
      });

      it('should return false for negative months', () => {
        const monthNames = provider.getMonthNames();
        expect((provider as any).validateMonth(-1, monthNames)).toBe(false);
        expect((provider as any).validateMonth(-5, monthNames)).toBe(false);
      });
    });

    describe('getCurrentTimestamp', () => {
      it('should return 0 when game.time.worldTime is not available', () => {
        // In test environment, game is not defined, so should return 0
        expect((provider as any).getCurrentTimestamp()).toBe(0);
      });
    });
  });

  describe('Default Implementations', () => {
    describe('getSunriseSunset', () => {
      it('should return default sunrise at 6 AM and sunset at 6 PM', () => {
        const date: CalendarDate = {
          year: 2024,
          month: 6,
          day: 15,
          weekday: 3,
          time: { hour: 12, minute: 0, second: 0 },
        };

        const result = provider.getSunriseSunset(date);

        // Day starts at timestamp for day 15 (0-based = day 14)
        const dayStart = provider.dateToWorldTime({
          ...date,
          time: { hour: 0, minute: 0, second: 0 },
        });

        expect(result.sunrise).toBe(dayStart + 6 * 3600); // 6 AM
        expect(result.sunset).toBe(dayStart + 18 * 3600); // 6 PM
      });

      it('should work correctly for different days', () => {
        const date1: CalendarDate = {
          year: 2024,
          month: 1,
          day: 1,
          weekday: 0,
          time: { hour: 0, minute: 0, second: 0 },
        };

        const date2: CalendarDate = {
          year: 2024,
          month: 1,
          day: 10,
          weekday: 2,
          time: { hour: 0, minute: 0, second: 0 },
        };

        const result1 = provider.getSunriseSunset(date1);
        const result2 = provider.getSunriseSunset(date2);

        // Results should differ by 9 days worth of seconds
        const expectedDiff = 9 * 86400;
        expect(result2.sunrise - result1.sunrise).toBe(expectedDiff);
        expect(result2.sunset - result1.sunset).toBe(expectedDiff);
      });
    });

    describe('getSeasonInfo', () => {
      it('should return Spring for months 3-5', () => {
        expect(provider.getSeasonInfo({ year: 2024, month: 3, day: 1, weekday: 0 })).toEqual({
          icon: 'spring',
          name: 'Spring',
        });
        expect(provider.getSeasonInfo({ year: 2024, month: 4, day: 1, weekday: 0 })).toEqual({
          icon: 'spring',
          name: 'Spring',
        });
        expect(provider.getSeasonInfo({ year: 2024, month: 5, day: 1, weekday: 0 })).toEqual({
          icon: 'spring',
          name: 'Spring',
        });
      });

      it('should return Summer for months 6-8', () => {
        expect(provider.getSeasonInfo({ year: 2024, month: 6, day: 1, weekday: 0 })).toEqual({
          icon: 'summer',
          name: 'Summer',
        });
        expect(provider.getSeasonInfo({ year: 2024, month: 7, day: 1, weekday: 0 })).toEqual({
          icon: 'summer',
          name: 'Summer',
        });
        expect(provider.getSeasonInfo({ year: 2024, month: 8, day: 1, weekday: 0 })).toEqual({
          icon: 'summer',
          name: 'Summer',
        });
      });

      it('should return Fall for months 9-11', () => {
        expect(provider.getSeasonInfo({ year: 2024, month: 9, day: 1, weekday: 0 })).toEqual({
          icon: 'fall',
          name: 'Fall',
        });
        expect(provider.getSeasonInfo({ year: 2024, month: 10, day: 1, weekday: 0 })).toEqual({
          icon: 'fall',
          name: 'Fall',
        });
        expect(provider.getSeasonInfo({ year: 2024, month: 11, day: 1, weekday: 0 })).toEqual({
          icon: 'fall',
          name: 'Fall',
        });
      });

      it('should return Winter for months 12, 1, 2', () => {
        expect(provider.getSeasonInfo({ year: 2024, month: 12, day: 1, weekday: 0 })).toEqual({
          icon: 'winter',
          name: 'Winter',
        });
        expect(provider.getSeasonInfo({ year: 2024, month: 1, day: 1, weekday: 0 })).toEqual({
          icon: 'winter',
          name: 'Winter',
        });
        expect(provider.getSeasonInfo({ year: 2024, month: 2, day: 1, weekday: 0 })).toEqual({
          icon: 'winter',
          name: 'Winter',
        });
      });

      it('should return Winter for month 0', () => {
        expect(provider.getSeasonInfo({ year: 2024, month: 0, day: 1, weekday: 0 })).toEqual({
          icon: 'winter',
          name: 'Winter',
        });
      });
    });

    describe('getYearFormatting', () => {
      it('should return empty prefix and suffix by default', () => {
        const result = provider.getYearFormatting();
        expect(result).toEqual({ prefix: '', suffix: '' });
      });
    });
  });

  describe('Optional Time Advancement Methods', () => {
    describe('advanceDays', () => {
      it('should log warning and not throw error', async () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        await expect(provider.advanceDays(5)).resolves.toBeUndefined();
        expect(consoleSpy).toHaveBeenCalledWith(
          'TestCalendar provider does not support time advancement'
        );

        consoleSpy.mockRestore();
      });
    });

    describe('advanceHours', () => {
      it('should log warning and not throw error', async () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        await expect(provider.advanceHours(3)).resolves.toBeUndefined();
        expect(consoleSpy).toHaveBeenCalledWith(
          'TestCalendar provider does not support time advancement'
        );

        consoleSpy.mockRestore();
      });
    });

    describe('advanceMinutes', () => {
      it('should log warning and not throw error', async () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        await expect(provider.advanceMinutes(30)).resolves.toBeUndefined();
        expect(consoleSpy).toHaveBeenCalledWith(
          'TestCalendar provider does not support time advancement'
        );

        consoleSpy.mockRestore();
      });
    });
  });

  describe('Abstract Method Implementation', () => {
    it('should provide name and version', () => {
      expect(provider.name).toBe('TestCalendar');
      expect(provider.version).toBe('1.0.0');
    });

    it('should implement getCurrentDate', () => {
      const date = provider.getCurrentDate();
      expect(date).toBeDefined();
      expect(date.year).toBe(2024);
      expect(date.month).toBe(6);
      expect(date.day).toBe(15);
    });

    it('should implement worldTimeToDate', () => {
      const date = provider.worldTimeToDate(86400); // 1 day
      expect(date.day).toBe(2); // Day 2 (1 day from epoch + 1)
    });

    it('should implement dateToWorldTime', () => {
      const timestamp = provider.dateToWorldTime({
        year: 2024,
        month: 1,
        day: 2,
        weekday: 0,
        time: { hour: 12, minute: 0, second: 0 },
      });
      expect(timestamp).toBe(86400 + 12 * 3600); // 1 day + 12 hours
    });

    it('should implement formatDate', () => {
      const formatted = provider.formatDate({
        year: 2024,
        month: 6,
        day: 15,
        weekday: 3,
      });
      expect(formatted).toBe('2024-6-15');
    });

    it('should implement getActiveCalendar', () => {
      const calendar = provider.getActiveCalendar();
      expect(calendar).toBeDefined();
      expect(calendar.id).toBe('test-calendar');
    });

    it('should implement getMonthNames', () => {
      const months = provider.getMonthNames();
      expect(months).toHaveLength(12);
      expect(months[0]).toBe('January');
      expect(months[11]).toBe('December');
    });

    it('should implement getWeekdayNames', () => {
      const weekdays = provider.getWeekdayNames();
      expect(weekdays).toHaveLength(7);
      expect(weekdays[0]).toBe('Sunday');
      expect(weekdays[6]).toBe('Saturday');
    });
  });
});
