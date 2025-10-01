/**
 * Tests for current date and date manipulation methods
 * Core functionality for calendar integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SimpleCalendarAPIBridge } from '../src/api/simple-calendar-api';

describe('Simple Calendar API Bridge - Date Methods', () => {
  let api: SimpleCalendarAPIBridge;

  beforeEach(() => {
    (global as any).game.time.worldTime = 86400; // 1 day
    (global as any).game.user.isGM = false;
  });

  describe('getCurrentDate()', () => {
    it('should return fallback datetime when S&S not available', () => {
      api = new SimpleCalendarAPIBridge();
      const result = api.getCurrentDate();

      expect(result).toEqual({
        year: 2023,
        month: 0,
        day: 1,
        hour: 0,
        minute: 0,
        seconds: 0,
        weekdays: [],
        dayOfTheWeek: 0,
      });
    });

    it('should convert S&S date to Simple Calendar format', () => {
      const mockSeasonsStars = {
        isAvailable: true,
        version: '1.0.0',
        api: {
          getCurrentDate: () => ({
            year: 2024,
            month: 6,
            day: 15,
            weekday: 3,
            time: { hour: 12, minute: 30, second: 45 },
          }),
          formatDate: (date: any, options: any) => {
            if (options.format === '{{month.name}}') return 'June';
            return '';
          },
          worldTimeToDate: vi.fn(),
          dateToWorldTime: vi.fn(),
          setActiveCalendar: vi.fn(),
          getAvailableCalendars: vi.fn(),
          getMonthNames: vi.fn(),
          getWeekdayNames: () => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
          getActiveCalendar: vi.fn(),
        },
        widgets: {
          main: null,
          mini: null,
          grid: null,
          getPreferredWidget: vi.fn(),
          onWidgetChange: vi.fn(),
          offWidgetChange: vi.fn(),
        },
        hooks: {
          onDateChanged: vi.fn(),
          onCalendarChanged: vi.fn(),
          onReady: vi.fn(),
          off: vi.fn(),
        },
        hasFeature: vi.fn(),
        getFeatureVersion: vi.fn(),
      };

      api = new SimpleCalendarAPIBridge(mockSeasonsStars as any);
      const result = api.getCurrentDate();

      expect(result).toEqual({
        year: 2024,
        month: 5,
        day: 14,
        hour: 12,
        minute: 30,
        seconds: 45,
        weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        dayOfTheWeek: 3,
        display: {
          monthName: 'June',
          day: '15',
          year: '2024',
        },
      });
    });

    it('should handle errors and fall back', () => {
      const mockSeasonsStars = {
        isAvailable: true,
        version: '1.0.0',
        api: {
          getCurrentDate: () => {
            throw new Error('API error');
          },
          formatDate: vi.fn(),
          worldTimeToDate: vi.fn(),
          dateToWorldTime: vi.fn(),
          setActiveCalendar: vi.fn(),
          getAvailableCalendars: vi.fn(),
          getMonthNames: vi.fn(),
          getWeekdayNames: vi.fn(),
          getActiveCalendar: vi.fn(),
        },
        widgets: {
          main: null,
          mini: null,
          grid: null,
          getPreferredWidget: vi.fn(),
          onWidgetChange: vi.fn(),
          offWidgetChange: vi.fn(),
        },
        hooks: {
          onDateChanged: vi.fn(),
          onCalendarChanged: vi.fn(),
          onReady: vi.fn(),
          off: vi.fn(),
        },
        hasFeature: vi.fn(),
        getFeatureVersion: vi.fn(),
      };

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      api = new SimpleCalendarAPIBridge(mockSeasonsStars as any);
      const result = api.getCurrentDate();

      expect(result).toEqual({
        year: 2023,
        month: 0,
        day: 1,
        hour: 0,
        minute: 0,
        seconds: 0,
        weekdays: [],
        dayOfTheWeek: 0,
      });
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get current date:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('currentDateTime()', () => {
    it('should be an alias for getCurrentDate', () => {
      api = new SimpleCalendarAPIBridge();
      const getCurrentDateResult = api.getCurrentDate();
      const currentDateTimeResult = api.currentDateTime();

      expect(currentDateTimeResult).toEqual(getCurrentDateResult);
    });
  });

  describe('changeDate()', () => {
    it('should return false when user is not GM', () => {
      const mockSeasonsStars = {
        isAvailable: true,
        version: '1.0.0',
        api: {
          advanceDays: vi.fn(),
          getCurrentDate: vi.fn(),
          worldTimeToDate: vi.fn(),
          dateToWorldTime: vi.fn(),
          formatDate: vi.fn(),
          setActiveCalendar: vi.fn(),
          getAvailableCalendars: vi.fn(),
          getMonthNames: vi.fn(),
          getWeekdayNames: vi.fn(),
          getActiveCalendar: vi.fn(),
        },
        widgets: {
          main: null,
          mini: null,
          grid: null,
          getPreferredWidget: vi.fn(),
          onWidgetChange: vi.fn(),
          offWidgetChange: vi.fn(),
        },
        hooks: {
          onDateChanged: vi.fn(),
          onCalendarChanged: vi.fn(),
          onReady: vi.fn(),
          off: vi.fn(),
        },
        hasFeature: vi.fn(),
        getFeatureVersion: vi.fn(),
      };

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      api = new SimpleCalendarAPIBridge(mockSeasonsStars as any);
      (global as any).game.user.isGM = false;

      const result = api.changeDate({ day: 1 });

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Only GMs can change the date');

      consoleSpy.mockRestore();
    });

    it('should return false when S&S not available', () => {
      api = new SimpleCalendarAPIBridge();
      (global as any).game.user.isGM = true;

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = api.changeDate({ day: 1 });

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Cannot change date: Seasons & Stars not available');

      consoleSpy.mockRestore();
    });

    it('should advance days when provided', async () => {
      const advanceDaysSpy = vi.fn().mockResolvedValue(undefined);

      const mockSeasonsStars = {
        isAvailable: true,
        version: '1.0.0',
        api: {
          advanceDays: advanceDaysSpy,
          getCurrentDate: vi.fn(),
          worldTimeToDate: vi.fn(),
          dateToWorldTime: vi.fn(),
          formatDate: vi.fn(),
          setActiveCalendar: vi.fn(),
          getAvailableCalendars: vi.fn(),
          getMonthNames: vi.fn(),
          getWeekdayNames: vi.fn(),
          getActiveCalendar: vi.fn(),
        },
        widgets: {
          main: null,
          mini: null,
          grid: null,
          getPreferredWidget: vi.fn(),
          onWidgetChange: vi.fn(),
          offWidgetChange: vi.fn(),
        },
        hooks: {
          onDateChanged: vi.fn(),
          onCalendarChanged: vi.fn(),
          onReady: vi.fn(),
          off: vi.fn(),
        },
        hasFeature: vi.fn(),
        getFeatureVersion: vi.fn(),
      };

      api = new SimpleCalendarAPIBridge(mockSeasonsStars as any);
      (global as any).game.user.isGM = true;

      const result = api.changeDate({ day: 5 });

      expect(result).toBe(true);
      expect(advanceDaysSpy).toHaveBeenCalledWith(5);
    });

    it('should advance hours when provided', async () => {
      const advanceHoursSpy = vi.fn().mockResolvedValue(undefined);

      const mockSeasonsStars = {
        isAvailable: true,
        version: '1.0.0',
        api: {
          advanceHours: advanceHoursSpy,
          getCurrentDate: vi.fn(),
          worldTimeToDate: vi.fn(),
          dateToWorldTime: vi.fn(),
          formatDate: vi.fn(),
          setActiveCalendar: vi.fn(),
          getAvailableCalendars: vi.fn(),
          getMonthNames: vi.fn(),
          getWeekdayNames: vi.fn(),
          getActiveCalendar: vi.fn(),
        },
        widgets: {
          main: null,
          mini: null,
          grid: null,
          getPreferredWidget: vi.fn(),
          onWidgetChange: vi.fn(),
          offWidgetChange: vi.fn(),
        },
        hooks: {
          onDateChanged: vi.fn(),
          onCalendarChanged: vi.fn(),
          onReady: vi.fn(),
          off: vi.fn(),
        },
        hasFeature: vi.fn(),
        getFeatureVersion: vi.fn(),
      };

      api = new SimpleCalendarAPIBridge(mockSeasonsStars as any);
      (global as any).game.user.isGM = true;

      const result = api.changeDate({ hour: 3 });

      expect(result).toBe(true);
      expect(advanceHoursSpy).toHaveBeenCalledWith(3);
    });

    it('should advance minutes when provided', async () => {
      const advanceMinutesSpy = vi.fn().mockResolvedValue(undefined);

      const mockSeasonsStars = {
        isAvailable: true,
        version: '1.0.0',
        api: {
          advanceMinutes: advanceMinutesSpy,
          getCurrentDate: vi.fn(),
          worldTimeToDate: vi.fn(),
          dateToWorldTime: vi.fn(),
          formatDate: vi.fn(),
          setActiveCalendar: vi.fn(),
          getAvailableCalendars: vi.fn(),
          getMonthNames: vi.fn(),
          getWeekdayNames: vi.fn(),
          getActiveCalendar: vi.fn(),
        },
        widgets: {
          main: null,
          mini: null,
          grid: null,
          getPreferredWidget: vi.fn(),
          onWidgetChange: vi.fn(),
          offWidgetChange: vi.fn(),
        },
        hooks: {
          onDateChanged: vi.fn(),
          onCalendarChanged: vi.fn(),
          onReady: vi.fn(),
          off: vi.fn(),
        },
        hasFeature: vi.fn(),
        getFeatureVersion: vi.fn(),
      };

      api = new SimpleCalendarAPIBridge(mockSeasonsStars as any);
      (global as any).game.user.isGM = true;

      const result = api.changeDate({ minute: 30 });

      expect(result).toBe(true);
      expect(advanceMinutesSpy).toHaveBeenCalledWith(30);
    });

    it('should handle errors gracefully', () => {
      const mockSeasonsStars = {
        isAvailable: true,
        version: '1.0.0',
        api: {
          advanceDays: () => {
            throw new Error('API error');
          },
          getCurrentDate: vi.fn(),
          worldTimeToDate: vi.fn(),
          dateToWorldTime: vi.fn(),
          formatDate: vi.fn(),
          setActiveCalendar: vi.fn(),
          getAvailableCalendars: vi.fn(),
          getMonthNames: vi.fn(),
          getWeekdayNames: vi.fn(),
          getActiveCalendar: vi.fn(),
        },
        widgets: {
          main: null,
          mini: null,
          grid: null,
          getPreferredWidget: vi.fn(),
          onWidgetChange: vi.fn(),
          offWidgetChange: vi.fn(),
        },
        hooks: {
          onDateChanged: vi.fn(),
          onCalendarChanged: vi.fn(),
          onReady: vi.fn(),
          off: vi.fn(),
        },
        hasFeature: vi.fn(),
        getFeatureVersion: vi.fn(),
      };

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      api = new SimpleCalendarAPIBridge(mockSeasonsStars as any);
      (global as any).game.user.isGM = true;

      const result = api.changeDate({ day: 1 });

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to change date:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('setDate()', () => {
    beforeEach(() => {
      (global as any).game.time = {
        worldTime: 86400,
        advance: vi.fn(),
      };
    });

    it('should return false when user is not GM', () => {
      const mockSeasonsStars = {
        isAvailable: true,
        version: '1.0.0',
        api: {
          dateToWorldTime: vi.fn(),
          getCurrentDate: vi.fn(),
          worldTimeToDate: vi.fn(),
          formatDate: vi.fn(),
          setActiveCalendar: vi.fn(),
          getAvailableCalendars: vi.fn(),
          getMonthNames: vi.fn(),
          getWeekdayNames: vi.fn(),
          getActiveCalendar: vi.fn(),
        },
        widgets: {
          main: null,
          mini: null,
          grid: null,
          getPreferredWidget: vi.fn(),
          onWidgetChange: vi.fn(),
          offWidgetChange: vi.fn(),
        },
        hooks: {
          onDateChanged: vi.fn(),
          onCalendarChanged: vi.fn(),
          onReady: vi.fn(),
          off: vi.fn(),
        },
        hasFeature: vi.fn(),
        getFeatureVersion: vi.fn(),
      };

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      api = new SimpleCalendarAPIBridge(mockSeasonsStars as any);
      (global as any).game.user.isGM = false;

      const result = api.setDate({ year: 2024, month: 5, day: 14 });

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Only GMs can set the date');

      consoleSpy.mockRestore();
    });

    it('should return false when S&S not available', () => {
      api = new SimpleCalendarAPIBridge();
      (global as any).game.user.isGM = true;

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = api.setDate({ year: 2024, month: 5, day: 14 });

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Cannot set date: Seasons & Stars not available');

      consoleSpy.mockRestore();
    });

    it('should convert date and advance time', () => {
      const mockSeasonsStars = {
        isAvailable: true,
        version: '1.0.0',
        api: {
          dateToWorldTime: (date: any) => 200000, // Target timestamp
          getCurrentDate: vi.fn(),
          worldTimeToDate: vi.fn(),
          formatDate: vi.fn(),
          setActiveCalendar: vi.fn(),
          getAvailableCalendars: vi.fn(),
          getMonthNames: vi.fn(),
          getWeekdayNames: vi.fn(),
          getActiveCalendar: vi.fn(),
        },
        widgets: {
          main: null,
          mini: null,
          grid: null,
          getPreferredWidget: vi.fn(),
          onWidgetChange: vi.fn(),
          offWidgetChange: vi.fn(),
        },
        hooks: {
          onDateChanged: vi.fn(),
          onCalendarChanged: vi.fn(),
          onReady: vi.fn(),
          off: vi.fn(),
        },
        hasFeature: vi.fn(),
        getFeatureVersion: vi.fn(),
      };

      api = new SimpleCalendarAPIBridge(mockSeasonsStars as any);
      (global as any).game.user.isGM = true;
      (global as any).game.time.worldTime = 100000;

      const advanceSpy = (global as any).game.time.advance as any;

      const result = api.setDate({ year: 2024, month: 5, day: 14 });

      expect(result).toBe(true);
      expect(advanceSpy).toHaveBeenCalledWith(100000); // 200000 - 100000
    });

    it('should return true if already at target time', () => {
      const mockSeasonsStars = {
        isAvailable: true,
        version: '1.0.0',
        api: {
          dateToWorldTime: (date: any) => 100000, // Same as current
          getCurrentDate: vi.fn(),
          worldTimeToDate: vi.fn(),
          formatDate: vi.fn(),
          setActiveCalendar: vi.fn(),
          getAvailableCalendars: vi.fn(),
          getMonthNames: vi.fn(),
          getWeekdayNames: vi.fn(),
          getActiveCalendar: vi.fn(),
        },
        widgets: {
          main: null,
          mini: null,
          grid: null,
          getPreferredWidget: vi.fn(),
          onWidgetChange: vi.fn(),
          offWidgetChange: vi.fn(),
        },
        hooks: {
          onDateChanged: vi.fn(),
          onCalendarChanged: vi.fn(),
          onReady: vi.fn(),
          off: vi.fn(),
        },
        hasFeature: vi.fn(),
        getFeatureVersion: vi.fn(),
      };

      api = new SimpleCalendarAPIBridge(mockSeasonsStars as any);
      (global as any).game.user.isGM = true;
      (global as any).game.time.worldTime = 100000;

      const advanceSpy = (global as any).game.time.advance as any;

      const result = api.setDate({ year: 2024, month: 5, day: 14 });

      expect(result).toBe(true);
      expect(advanceSpy).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', () => {
      const mockSeasonsStars = {
        isAvailable: true,
        version: '1.0.0',
        api: {
          dateToWorldTime: () => {
            throw new Error('API error');
          },
          getCurrentDate: vi.fn(),
          worldTimeToDate: vi.fn(),
          formatDate: vi.fn(),
          setActiveCalendar: vi.fn(),
          getAvailableCalendars: vi.fn(),
          getMonthNames: vi.fn(),
          getWeekdayNames: vi.fn(),
          getActiveCalendar: vi.fn(),
        },
        widgets: {
          main: null,
          mini: null,
          grid: null,
          getPreferredWidget: vi.fn(),
          onWidgetChange: vi.fn(),
          offWidgetChange: vi.fn(),
        },
        hooks: {
          onDateChanged: vi.fn(),
          onCalendarChanged: vi.fn(),
          onReady: vi.fn(),
          off: vi.fn(),
        },
        hasFeature: vi.fn(),
        getFeatureVersion: vi.fn(),
      };

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      api = new SimpleCalendarAPIBridge(mockSeasonsStars as any);
      (global as any).game.user.isGM = true;

      const result = api.setDate({ year: 2024, month: 5, day: 14 });

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to set date:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });
});
