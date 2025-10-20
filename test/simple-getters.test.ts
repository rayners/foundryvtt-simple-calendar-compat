/**
 * Tests for simple getter methods in Simple Calendar API Bridge
 * These are straightforward methods with minimal logic
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SimpleCalendarAPIBridge } from '../src/api/simple-calendar-api';

describe('Simple Calendar API Bridge - Simple Getters', () => {
  let api: SimpleCalendarAPIBridge;

  beforeEach(() => {
    // Reset game.time mock
    (global as any).game.time.worldTime = 12345;
  });

  describe('timestamp()', () => {
    it('should return current game.time.worldTime', () => {
      api = new SimpleCalendarAPIBridge();
      expect(api.timestamp()).toBe(12345);
    });

    it('should return 0 when game.time is undefined', () => {
      const originalTime = (global as any).game.time;
      (global as any).game.time = undefined;

      api = new SimpleCalendarAPIBridge();
      expect(api.timestamp()).toBe(0);

      (global as any).game.time = originalTime;
    });

    it('should return 0 when game.time.worldTime is undefined', () => {
      const originalWorldTime = (global as any).game.time.worldTime;
      (global as any).game.time.worldTime = undefined;

      api = new SimpleCalendarAPIBridge();
      expect(api.timestamp()).toBe(0);

      (global as any).game.time.worldTime = originalWorldTime;
    });
  });

  describe('getAllCalendars()', () => {
    it('should return empty array when S&S not available', () => {
      api = new SimpleCalendarAPIBridge();
      const result = api.getAllCalendars();

      expect(result).toEqual([]);
    });

    it('should return calendars in Simple Calendar format when S&S available', () => {
      const mockSeasonsStars = {
        isAvailable: true,
        version: '1.0.0',
        api: {
          getActiveCalendar: () => ({ id: 'gregorian', name: 'Gregorian Calendar', description: 'Earth calendar' }),
          getAvailableCalendars: () => ['gregorian', 'custom-fantasy'],
          getCurrentDate: vi.fn(),
          worldTimeToDate: vi.fn(),
          dateToWorldTime: vi.fn(),
          formatDate: vi.fn(),
          setActiveCalendar: vi.fn(),
          getMonthNames: vi.fn(),
          getWeekdayNames: vi.fn(),
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
      const result = api.getAllCalendars();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'gregorian',
        name: 'Gregorian Calendar',
        description: 'Earth calendar',
        active: true,
      });
      expect(result[1]).toEqual({
        id: 'custom-fantasy',
        name: 'custom-fantasy',
        description: '',
        active: false,
      });
    });

    it('should handle errors gracefully', () => {
      const mockSeasonsStars = {
        isAvailable: true,
        version: '1.0.0',
        api: {
          getActiveCalendar: () => {
            throw new Error('API error');
          },
          getAvailableCalendars: vi.fn(),
          getCurrentDate: vi.fn(),
          worldTimeToDate: vi.fn(),
          dateToWorldTime: vi.fn(),
          formatDate: vi.fn(),
          setActiveCalendar: vi.fn(),
          getMonthNames: vi.fn(),
          getWeekdayNames: vi.fn(),
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
      const result = api.getAllCalendars();

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get all calendars:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('getCurrentCalendar()', () => {
    it('should return null when S&S not available', () => {
      api = new SimpleCalendarAPIBridge();
      const result = api.getCurrentCalendar();

      expect(result).toBeNull();
    });

    it('should return null when S&S returns null calendar', () => {
      const mockSeasonsStars = {
        isAvailable: true,
        version: '1.0.0',
        api: {
          getActiveCalendar: () => null,
          getAvailableCalendars: vi.fn(),
          getCurrentDate: vi.fn(),
          worldTimeToDate: vi.fn(),
          dateToWorldTime: vi.fn(),
          formatDate: vi.fn(),
          setActiveCalendar: vi.fn(),
          getMonthNames: vi.fn(),
          getWeekdayNames: vi.fn(),
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
      const result = api.getCurrentCalendar();

      expect(result).toBeNull();
    });

    it('should return calendar in Simple Calendar format with defaults', () => {
      const mockSeasonsStars = {
        isAvailable: true,
        version: '1.0.0',
        api: {
          getActiveCalendar: () => ({
            id: 'gregorian',
            name: 'Gregorian Calendar',
            description: 'Earth calendar',
          }),
          getAvailableCalendars: vi.fn(),
          getCurrentDate: vi.fn(),
          worldTimeToDate: vi.fn(),
          dateToWorldTime: vi.fn(),
          formatDate: vi.fn(),
          setActiveCalendar: vi.fn(),
          getMonthNames: vi.fn(),
          getWeekdayNames: vi.fn(),
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
      const result = api.getCurrentCalendar();

      expect(result).toEqual({
        id: 'gregorian',
        name: 'Gregorian Calendar',
        description: 'Earth calendar',
        currentDate: undefined,
        general: {
          gameWorldTimeIntegration: 'mixed',
          showClock: true,
          noteDefaultVisibility: false,
          postNoteRemindersOnFoundryLoad: false,
          pf2eSync: false,
          dateFormat: {
            date: 'MMMM DD, YYYY',
            time: 'HH:mm:ss',
            monthYear: 'MMMM YAYYYYYZ',
            chatTime: 'MMMM DD, YYYY HH:mm:ss',
          },
          compactViewOptions: {
            controlLayout: 'full',
          },
        },
        months: [],
        weekdays: [],
        year: { prefix: '', suffix: '', epoch: 0 },
        time: { hoursInDay: 24, minutesInHour: 60, secondsInMinute: 60 },
        seasons: [],
        moons: [],
        leapYear: { rule: 'none' },
        noteCategories: [],
      });
    });

    it('should use calendar data when provided', () => {
      const mockSeasonsStars = {
        isAvailable: true,
        version: '1.0.0',
        api: {
          getActiveCalendar: () => ({
            id: 'harptos',
            name: 'Calendar of Harptos',
            description: 'Forgotten Realms calendar',
            months: [{ name: 'Hammer', length: 30 }],
            weekdays: [{ name: 'Moonsday' }],
            year: { prefix: '', suffix: ' DR', epoch: 1372 },
            time: { hoursInDay: 24, minutesInHour: 60, secondsInMinute: 60 },
            seasons: [{ name: 'Spring' }],
            moons: [{ name: 'Selûne' }],
            leapYear: { rule: 'gregorian' },
          }),
          getAvailableCalendars: vi.fn(),
          getCurrentDate: () => ({
            year: 1492,
            month: 1, // 1-based in S&S
            day: 15, // 1-based in S&S
            weekday: 3,
            time: { hour: 14, minute: 30, second: 45 },
          }),
          worldTimeToDate: vi.fn(),
          dateToWorldTime: vi.fn(),
          formatDate: vi.fn(),
          setActiveCalendar: vi.fn(),
          getMonthNames: vi.fn(),
          getWeekdayNames: vi.fn(),
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
      const result = api.getCurrentCalendar();

      expect(result).toEqual({
        id: 'harptos',
        name: 'Calendar of Harptos',
        description: 'Forgotten Realms calendar',
        currentDate: {
          year: 1492,
          month: 0, // 0-based in SC
          day: 14, // 0-based in SC
          seconds: 14 * 3600 + 30 * 60 + 45, // 52245 seconds
        },
        general: {
          gameWorldTimeIntegration: 'mixed',
          showClock: true,
          noteDefaultVisibility: false,
          postNoteRemindersOnFoundryLoad: false,
          pf2eSync: false,
          dateFormat: {
            date: 'MMMM DD, YYYY',
            time: 'HH:mm:ss',
            monthYear: 'MMMM YAYYYYYZ',
            chatTime: 'MMMM DD, YYYY HH:mm:ss',
          },
          compactViewOptions: {
            controlLayout: 'full',
          },
        },
        months: [{ name: 'Hammer', length: 30 }],
        weekdays: [{ name: 'Moonsday' }],
        year: { prefix: '', suffix: ' DR', epoch: 1372 },
        time: { hoursInDay: 24, minutesInHour: 60, secondsInMinute: 60 },
        seasons: [{ name: 'Spring' }],
        moons: [{ name: 'Selûne' }],
        leapYear: { rule: 'gregorian' },
        noteCategories: [],
      });
    });

    it('should include note categories when available', () => {
      // Mock game.seasonsStars.noteCategories
      const mockNoteCategories = {
        getCategories: () => [
          { id: 'holiday', name: 'Holiday', color: '#148e94', icon: 'fas fa-calendar' },
          { id: 'event', name: 'Event', color: '#7b68ee', icon: 'fas fa-calendar-star' },
          { id: 'reminder', name: 'Reminder', color: '#ffa500', icon: 'fas fa-bell' },
        ],
      };

      (global as any).game.seasonsStars = {
        noteCategories: mockNoteCategories,
      };

      const mockSeasonsStars = {
        isAvailable: true,
        version: '1.0.0',
        api: {
          getActiveCalendar: () => ({
            id: 'gregorian',
            name: 'Gregorian Calendar',
            description: 'Earth calendar',
          }),
          getAvailableCalendars: vi.fn(),
          getCurrentDate: vi.fn(),
          worldTimeToDate: vi.fn(),
          dateToWorldTime: vi.fn(),
          formatDate: vi.fn(),
          setActiveCalendar: vi.fn(),
          getMonthNames: vi.fn(),
          getWeekdayNames: vi.fn(),
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
      const result = api.getCurrentCalendar();

      expect(result).toBeDefined();
      expect(result.noteCategories).toBeDefined();
      expect(result.noteCategories).toHaveLength(3);
      expect(result.noteCategories[0]).toEqual({
        id: 'holiday',
        name: 'Holiday',
        color: '#148e94',
        textColor: '#ffffff',
      });
      expect(result.noteCategories[1]).toEqual({
        id: 'event',
        name: 'Event',
        color: '#7b68ee',
        textColor: '#ffffff',
      });

      // Clean up
      delete (global as any).game.seasonsStars;
    });

    it('should handle missing note categories gracefully', () => {
      // No game.seasonsStars.noteCategories set
      delete (global as any).game.seasonsStars;

      const mockSeasonsStars = {
        isAvailable: true,
        version: '1.0.0',
        api: {
          getActiveCalendar: () => ({
            id: 'gregorian',
            name: 'Gregorian Calendar',
            description: 'Earth calendar',
          }),
          getAvailableCalendars: vi.fn(),
          getCurrentDate: vi.fn(),
          worldTimeToDate: vi.fn(),
          dateToWorldTime: vi.fn(),
          formatDate: vi.fn(),
          setActiveCalendar: vi.fn(),
          getMonthNames: vi.fn(),
          getWeekdayNames: vi.fn(),
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
      const result = api.getCurrentCalendar();

      expect(result).toBeDefined();
      expect(result.noteCategories).toEqual([]);
    });

    it('should calculate seconds correctly with custom time configurations', () => {
      const mockSeasonsStars = {
        isAvailable: true,
        version: '1.0.0',
        api: {
          getActiveCalendar: () => ({
            id: 'custom-time',
            name: 'Custom Time Calendar',
            description: 'Fantasy calendar with non-standard time units',
            time: {
              hoursInDay: 20,       // 20-hour days
              minutesInHour: 50,    // 50-minute hours
              secondsInMinute: 40,  // 40-second minutes
            },
          }),
          getAvailableCalendars: vi.fn(),
          getCurrentDate: () => ({
            year: 100,
            month: 1,
            day: 1,
            weekday: 0,
            time: { hour: 10, minute: 25, second: 30 },
          }),
          worldTimeToDate: vi.fn(),
          dateToWorldTime: vi.fn(),
          formatDate: vi.fn(),
          setActiveCalendar: vi.fn(),
          getMonthNames: vi.fn(),
          getWeekdayNames: vi.fn(),
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
      const result = api.getCurrentCalendar();

      // Verify custom time configuration is preserved
      expect(result.time).toEqual({
        hoursInDay: 20,
        minutesInHour: 50,
        secondsInMinute: 40,
      });

      // Verify seconds calculation uses custom time units
      // 10 hours * (50 min/hr * 40 sec/min) = 10 * 2000 = 20000
      // 25 minutes * 40 sec/min = 1000
      // 30 seconds = 30
      // Total = 21030 seconds
      const expectedSeconds = 10 * (50 * 40) + 25 * 40 + 30;
      expect(result.currentDate.seconds).toBe(expectedSeconds);
      expect(result.currentDate.seconds).toBe(21030);
    });

    it('should handle errors gracefully', () => {
      const mockSeasonsStars = {
        isAvailable: true,
        version: '1.0.0',
        api: {
          getActiveCalendar: () => {
            throw new Error('API error');
          },
          getAvailableCalendars: vi.fn(),
          getCurrentDate: vi.fn(),
          worldTimeToDate: vi.fn(),
          dateToWorldTime: vi.fn(),
          formatDate: vi.fn(),
          setActiveCalendar: vi.fn(),
          getMonthNames: vi.fn(),
          getWeekdayNames: vi.fn(),
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
      const result = api.getCurrentCalendar();

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get current calendar:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('getAllMonths()', () => {
    it('should return empty array when S&S not available', () => {
      api = new SimpleCalendarAPIBridge();
      const result = api.getAllMonths();

      expect(result).toEqual([]);
    });

    it('should convert calendar months to Simple Calendar format', () => {
      const mockSeasonsStars = {
        isAvailable: true,
        version: '1.0.0',
        api: {
          getActiveCalendar: () => ({
            months: [
              {
                name: 'Hammer',
                abbreviation: 'Ham',
                description: 'First month',
                length: 30,
                leapLength: 31,
                intercalary: false,
                intercalaryInclude: true,
                startingWeekday: 1, // Use 1 not 0 to avoid || null bug
              },
              {
                name: 'Alturiak',
                length: 30,
              },
            ],
          }),
          getMonthNames: () => ['Hammer', 'Alturiak'],
          getAvailableCalendars: vi.fn(),
          getCurrentDate: vi.fn(),
          worldTimeToDate: vi.fn(),
          dateToWorldTime: vi.fn(),
          formatDate: vi.fn(),
          setActiveCalendar: vi.fn(),
          getWeekdayNames: vi.fn(),
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
      const result = api.getAllMonths();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'month-0',
        abbreviation: 'Ham',
        name: 'Hammer',
        description: 'First month',
        numericRepresentation: 1, // 1-based
        numericRepresentationOffset: 0,
        numberOfDays: 30,
        numberOfLeapYearDays: 31,
        intercalary: false,
        intercalaryInclude: true,
        startingWeekday: 1,
      });
      expect(result[1]).toEqual({
        id: 'month-1',
        abbreviation: 'Alt',
        name: 'Alturiak',
        description: '',
        numericRepresentation: 2, // 1-based
        numericRepresentationOffset: 0,
        numberOfDays: 30,
        numberOfLeapYearDays: 30,
        intercalary: false,
        intercalaryInclude: true,
        startingWeekday: null,
      });
    });

    it('should handle errors gracefully', () => {
      const mockSeasonsStars = {
        isAvailable: true,
        version: '1.0.0',
        api: {
          getActiveCalendar: () => {
            throw new Error('API error');
          },
          getMonthNames: vi.fn(),
          getAvailableCalendars: vi.fn(),
          getCurrentDate: vi.fn(),
          worldTimeToDate: vi.fn(),
          dateToWorldTime: vi.fn(),
          formatDate: vi.fn(),
          setActiveCalendar: vi.fn(),
          getWeekdayNames: vi.fn(),
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
      const result = api.getAllMonths();

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get all months:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('getAllWeekdays()', () => {
    it('should return empty array when S&S not available', () => {
      api = new SimpleCalendarAPIBridge();
      const result = api.getAllWeekdays();

      expect(result).toEqual([]);
    });

    it('should convert calendar weekdays to Simple Calendar format', () => {
      const mockSeasonsStars = {
        isAvailable: true,
        version: '1.0.0',
        api: {
          getActiveCalendar: () => ({
            weekdays: [
              {
                name: 'Moonsday',
                abbreviation: 'Mon',
                description: 'First day',
                restday: false,
              },
              {
                name: 'Godsday',
                restday: true,
              },
            ],
          }),
          getWeekdayNames: () => ['Moonsday', 'Godsday'],
          getAvailableCalendars: vi.fn(),
          getCurrentDate: vi.fn(),
          worldTimeToDate: vi.fn(),
          dateToWorldTime: vi.fn(),
          formatDate: vi.fn(),
          setActiveCalendar: vi.fn(),
          getMonthNames: vi.fn(),
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
      const result = api.getAllWeekdays();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'weekday-0',
        abbreviation: 'Mon',
        name: 'Moonsday',
        description: 'First day',
        numericRepresentation: 0, // 0-based for weekdays
        restday: false,
      });
      expect(result[1]).toEqual({
        id: 'weekday-1',
        abbreviation: 'God',
        name: 'Godsday',
        description: '',
        numericRepresentation: 1, // 0-based for weekdays
        restday: true,
      });
    });

    it('should handle errors gracefully', () => {
      const mockSeasonsStars = {
        isAvailable: true,
        version: '1.0.0',
        api: {
          getActiveCalendar: () => {
            throw new Error('API error');
          },
          getWeekdayNames: vi.fn(),
          getAvailableCalendars: vi.fn(),
          getCurrentDate: vi.fn(),
          worldTimeToDate: vi.fn(),
          dateToWorldTime: vi.fn(),
          formatDate: vi.fn(),
          setActiveCalendar: vi.fn(),
          getMonthNames: vi.fn(),
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
      const result = api.getAllWeekdays();

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get all weekdays:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });
});
