/**
 * Tests for timestamp conversion and manipulation methods
 * Critical for Simple Weather and other time-dependent modules
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SimpleCalendarAPIBridge } from '../src/api/simple-calendar-api';

describe('Simple Calendar API Bridge - Timestamp Methods', () => {
  let api: SimpleCalendarAPIBridge;

  beforeEach(() => {
    (global as any).game.time.worldTime = 0;
  });

  describe('timestampToDate()', () => {
    it('should return fallback datetime when S&S not available', () => {
      api = new SimpleCalendarAPIBridge();
      const result = api.timestampToDate(86400); // 1 day

      expect(result).toEqual({
        year: 2023,
        month: 0,
        day: 1, // 1 day elapsed (0-based)
        hour: 0,
        minute: 0,
        seconds: 0,
        weekdays: [],
        dayOfTheWeek: 0,
      });
    });

    it('should convert S&S date to Simple Calendar format with display data', () => {
      const mockSeasonsStars = {
        isAvailable: true,
        version: '1.0.0',
        api: {
          worldTimeToDate: (timestamp: number) => ({
            year: 2024,
            month: 6, // June (1-based)
            day: 15, // 15th (1-based)
            weekday: 3,
            time: { hour: 12, minute: 30, second: 45 },
          }),
          formatDate: (date: any, options: any) => {
            if (options.format === '{{month.name}}') return 'June';
            return '';
          },
          getCurrentDate: vi.fn(),
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
      const result = api.timestampToDate(12345);

      expect(result).toEqual({
        year: 2024,
        month: 5, // May (0-based) - converted from June
        day: 14, // 14 (0-based) - converted from 15
        hour: 12,
        minute: 30,
        seconds: 45, // Simple Calendar format
        second: 45,  // Simple Weather format - both must be present
        weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        dayOfTheWeek: 3,
        display: {
          monthName: 'June',
          day: '15',
          year: '2024',
        },
      });
    });

    it('should handle errors gracefully and fall back', () => {
      const mockSeasonsStars = {
        isAvailable: true,
        version: '1.0.0',
        api: {
          worldTimeToDate: () => {
            throw new Error('API error');
          },
          formatDate: vi.fn(),
          getCurrentDate: vi.fn(),
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
      const result = api.timestampToDate(86400);

      // Should fall back to basic calculation
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
      expect(consoleSpy).toHaveBeenCalledWith(
        '🌉 Failed to convert timestamp to Simple Calendar date:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should handle timestamps with complex time components', () => {
      api = new SimpleCalendarAPIBridge();
      // 2 days, 5 hours, 30 minutes, 45 seconds
      const timestamp = 2 * 86400 + 5 * 3600 + 30 * 60 + 45;
      const result = api.timestampToDate(timestamp);

      expect(result).toEqual({
        year: 2023,
        month: 0,
        day: 2,
        hour: 5,
        minute: 30,
        seconds: 45,
        weekdays: [],
        dayOfTheWeek: 0,
      });
    });
  });

  describe('timestampPlusInterval()', () => {
    it('should return original timestamp when interval is null', () => {
      api = new SimpleCalendarAPIBridge();
      const result = api.timestampPlusInterval(12345, null);

      expect(result).toBe(12345);
    });

    it('should return original timestamp when interval is undefined', () => {
      api = new SimpleCalendarAPIBridge();
      const result = api.timestampPlusInterval(12345, undefined);

      expect(result).toBe(12345);
    });

    it('should add days using fallback arithmetic when S&S not available', () => {
      api = new SimpleCalendarAPIBridge();
      const result = api.timestampPlusInterval(0, { day: 5 });

      expect(result).toBe(5 * 86400); // 5 days in seconds
    });

    it('should add hours using fallback arithmetic', () => {
      api = new SimpleCalendarAPIBridge();
      const result = api.timestampPlusInterval(0, { hour: 3 });

      expect(result).toBe(3 * 3600); // 3 hours in seconds
    });

    it('should add minutes using fallback arithmetic', () => {
      api = new SimpleCalendarAPIBridge();
      const result = api.timestampPlusInterval(0, { minute: 45 });

      expect(result).toBe(45 * 60); // 45 minutes in seconds
    });

    it('should add seconds using fallback arithmetic', () => {
      api = new SimpleCalendarAPIBridge();
      const result = api.timestampPlusInterval(0, { second: 30 });

      expect(result).toBe(30);
    });

    it('should handle complex intervals with multiple components (fallback)', () => {
      api = new SimpleCalendarAPIBridge();
      const result = api.timestampPlusInterval(0, {
        day: 2,
        hour: 5,
        minute: 30,
        second: 45,
      });

      const expected = 2 * 86400 + 5 * 3600 + 30 * 60 + 45;
      expect(result).toBe(expected);
    });

    it('should add years using fallback arithmetic (365 days)', () => {
      api = new SimpleCalendarAPIBridge();
      const result = api.timestampPlusInterval(0, { year: 1 });

      expect(result).toBe(365 * 86400); // 1 year ≈ 365 days
    });

    it('should add months using fallback arithmetic (30 days)', () => {
      api = new SimpleCalendarAPIBridge();
      const result = api.timestampPlusInterval(0, { month: 2 });

      expect(result).toBe(2 * 30 * 86400); // 2 months ≈ 60 days
    });

    it('should use S&S API for calendar-aware interval calculation', () => {
      const mockSeasonsStars = {
        isAvailable: true,
        version: '1.0.0',
        api: {
          worldTimeToDate: (timestamp: number) => ({
            year: 2024,
            month: 1, // January (1-based)
            day: 15,
            weekday: 0,
            time: { hour: 0, minute: 0, second: 0 },
          }),
          dateToWorldTime: (date: any) => {
            // Simulate converting modified date back to timestamp
            return 100000; // Mock timestamp after modification
          },
          getCurrentDate: vi.fn(),
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
      const result = api.timestampPlusInterval(50000, { month: 2 });

      // Should use dateToWorldTime for month-based intervals
      expect(result).toBe(100000);
    });

    it('should handle month overflow correctly with S&S', () => {
      let capturedDate: any = null;

      const mockSeasonsStars = {
        isAvailable: true,
        version: '1.0.0',
        api: {
          worldTimeToDate: () => ({
            year: 2024,
            month: 11, // November (1-based)
            day: 15,
            weekday: 0,
            time: { hour: 0, minute: 0, second: 0 },
          }),
          dateToWorldTime: (date: any) => {
            capturedDate = date;
            return 200000;
          },
          getCurrentDate: vi.fn(),
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
      api.timestampPlusInterval(50000, { month: 3 }); // 11 + 3 = 14 (overflow)

      // Should wrap to month 2 of next year
      expect(capturedDate.month).toBe(2); // 14 - 12 = 2
      expect(capturedDate.year).toBe(2025); // Year incremented
    });

    it('should handle month underflow correctly with S&S', () => {
      let capturedDate: any = null;

      const mockSeasonsStars = {
        isAvailable: true,
        version: '1.0.0',
        api: {
          worldTimeToDate: () => ({
            year: 2024,
            month: 2, // February (1-based)
            day: 15,
            weekday: 0,
            time: { hour: 0, minute: 0, second: 0 },
          }),
          dateToWorldTime: (date: any) => {
            capturedDate = date;
            return 200000;
          },
          getCurrentDate: vi.fn(),
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
      api.timestampPlusInterval(50000, { month: -3 }); // 2 - 3 = -1 (underflow)

      // Should wrap to month 11 of previous year
      expect(capturedDate.month).toBe(11); // -1 + 12 = 11
      expect(capturedDate.year).toBe(2023); // Year decremented
    });

    it('should add time-based intervals after calendar modification', () => {
      const mockSeasonsStars = {
        isAvailable: true,
        version: '1.0.0',
        api: {
          worldTimeToDate: () => ({
            year: 2024,
            month: 6,
            day: 15,
            weekday: 0,
            time: { hour: 0, minute: 0, second: 0 },
          }),
          dateToWorldTime: () => 100000, // Base timestamp after year/month modification
          getCurrentDate: vi.fn(),
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
      const result = api.timestampPlusInterval(50000, {
        year: 1,
        day: 2,
        hour: 3,
      });

      // Should be dateToWorldTime result + time-based intervals
      const expected = 100000 + 2 * 86400 + 3 * 3600;
      expect(result).toBe(expected);
    });

    it('should handle errors gracefully', () => {
      const mockSeasonsStars = {
        isAvailable: true,
        version: '1.0.0',
        api: {
          worldTimeToDate: () => {
            throw new Error('API error');
          },
          dateToWorldTime: vi.fn(),
          getCurrentDate: vi.fn(),
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
      const result = api.timestampPlusInterval(1000, { day: 1 });

      // Should return original timestamp on error
      expect(result).toBe(1000);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to add interval to timestamp:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});
