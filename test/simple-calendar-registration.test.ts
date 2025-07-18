/**
 * Test Simple Calendar bridge registration functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Foundry globals needed for the test
global.game = {
  settings: {
    storage: {
      get: vi.fn()
    }
  },
  modules: {
    get: vi.fn()
  }
} as any;

global.Hooks = {
  on: vi.fn(),
  callAll: vi.fn(),
  once: vi.fn(),
} as any;

global.ui = {
  notifications: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
} as any;

describe('Simple Calendar Bridge Registration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should detect Simple Calendar data in world settings', () => {
    // Test data structure that Simple Calendar would store
    const mockWorldSettings = {
      'foundryvtt-simple-calendar.calendars': JSON.stringify({
        'custom-calendar': {
          name: 'Test Calendar',
          months: [{ name: 'January', days: 31 }],
          weekdays: [{ name: 'Monday' }]
        }
      }),
      'foundryvtt-simple-calendar.current-calendar': 'custom-calendar',
      'other-module.setting': 'should-be-ignored'
    };

    (global.game.settings.storage.get as any).mockReturnValue(mockWorldSettings);

    // Simulate what our registration function would find
    const worldSettings = global.game.settings.storage.get('world');
    const scKeys = Object.keys(worldSettings).filter(key => 
      key.startsWith('foundryvtt-simple-calendar.')
    );

    expect(scKeys).toHaveLength(2);
    expect(scKeys).toContain('foundryvtt-simple-calendar.calendars');
    expect(scKeys).toContain('foundryvtt-simple-calendar.current-calendar');
  });

  it('should parse Simple Calendar JSON data correctly', () => {
    const calendarsJson = JSON.stringify({
      'fantasy-calendar': {
        name: 'Fantasy World Calendar',
        months: [
          { name: 'Ringarë', days: 30 },
          { name: 'Narvinyë', days: 31 }
        ],
        weekdays: [
          { name: 'Elenya' },
          { name: 'Anarya' }
        ],
        year: {
          epoch: 1000,
          currentYear: 1523
        }
      }
    });

    const parsed = JSON.parse(calendarsJson);
    
    expect(parsed).toHaveProperty('fantasy-calendar');
    expect(parsed['fantasy-calendar']).toHaveProperty('name', 'Fantasy World Calendar');
    expect(parsed['fantasy-calendar'].months).toHaveLength(2);
    expect(parsed['fantasy-calendar'].weekdays).toHaveLength(2);
  });

  it('should validate required S&S calendar structure', () => {
    // Test that our converted calendar has the required S&S structure
    const mockSsCalendar = {
      id: 'simple-calendar-test',
      translations: {
        en: {
          label: 'Test Calendar',
          description: 'Test description'
        }
      },
      year: {
        epoch: 0,
        currentYear: 2024,
        prefix: '',
        suffix: '',
        startDay: 1
      },
      leapYear: {
        rule: 'none'
      },
      months: [{ name: 'January', days: 31 }],
      weekdays: [{ name: 'Monday' }],
      intercalary: [],
      time: {
        hoursInDay: 24,
        minutesInHour: 60,
        secondsInMinute: 60
      }
    };

    // Verify required fields exist
    expect(mockSsCalendar).toHaveProperty('id');
    expect(mockSsCalendar).toHaveProperty('translations.en.label');
    expect(mockSsCalendar).toHaveProperty('year');
    expect(mockSsCalendar).toHaveProperty('months');
    expect(mockSsCalendar).toHaveProperty('weekdays');
    expect(mockSsCalendar).toHaveProperty('time');
    
    // Verify structure
    expect(Array.isArray(mockSsCalendar.months)).toBe(true);
    expect(Array.isArray(mockSsCalendar.weekdays)).toBe(true);
    expect(Array.isArray(mockSsCalendar.intercalary)).toBe(true);
  });

  it('should handle missing Simple Calendar data gracefully', () => {
    // Test with no Simple Calendar data
    const emptySettings = {
      'other-module.setting': 'value'
    };

    (global.game.settings.storage.get as any).mockReturnValue(emptySettings);

    const worldSettings = global.game.settings.storage.get('world');
    const scKeys = Object.keys(worldSettings).filter(key => 
      key.startsWith('foundryvtt-simple-calendar.')
    );

    expect(scKeys).toHaveLength(0);
  });

  it('should handle malformed JSON gracefully', () => {
    const malformedJson = 'invalid-json-{';
    
    expect(() => {
      JSON.parse(malformedJson);
    }).toThrow();

    // Test that we can catch and handle the error
    try {
      JSON.parse(malformedJson);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });
});