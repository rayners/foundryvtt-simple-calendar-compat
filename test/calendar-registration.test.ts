/**
 * Test Simple Calendar to Seasons & Stars calendar registration flow
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock global Foundry objects
global.game = {
  settings: {
    storage: {
      get: vi.fn()
    }
  },
  modules: {
    get: vi.fn()
  },
  seasonsStars: {
    api: true // Mock S&S API availability
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

global.console = {
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
} as any;

describe('Simple Calendar Registration Flow', () => {
  let registrationCallback: any;
  let registerCalendarMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    registrationCallback = undefined;
    registerCalendarMock = vi.fn().mockReturnValue(true);

    // Capture the hook callback when it's registered
    (global.Hooks.on as any).mockImplementation((hookName: string, callback: any) => {
      if (hookName === 'seasons-stars:registerExternalCalendars') {
        registrationCallback = callback;
      }
    });
  });

  it('should register hook listener for external calendar registration', async () => {
    // Import the module (this registers the hook)
    await import('../src/main');

    expect(global.Hooks.on).toHaveBeenCalledWith(
      'seasons-stars:registerExternalCalendars',
      expect.any(Function)
    );
  });

  it('should handle Simple Calendar data and register calendars', async () => {
    // Import the module to register the hook
    await import('../src/main');

    // Mock Simple Calendar world data
    const mockWorldSettings = {
      'foundryvtt-simple-calendar.calendars': JSON.stringify({
        'custom-calendar-1': {
          name: 'My Custom Calendar',
          year: {
            epoch: 0,
            currentYear: 2024,
            prefix: 'AC',
            suffix: '',
            startDay: 1
          },
          months: [
            { name: 'January', days: 31 },
            { name: 'February', days: 28 },
            { name: 'March', days: 31 }
          ],
          weekdays: [
            { name: 'Monday' },
            { name: 'Tuesday' },
            { name: 'Wednesday' },
            { name: 'Thursday' },
            { name: 'Friday' },
            { name: 'Saturday' },
            { name: 'Sunday' }
          ],
          time: {
            hoursInDay: 24,
            minutesInHour: 60,
            secondsInMinute: 60
          }
        }
      }),
      'foundryvtt-simple-calendar.current-calendar': 'custom-calendar-1'
    };

    (global.game.settings.storage.get as any).mockReturnValue(mockWorldSettings);

    // Simulate S&S firing the registration hook
    registrationCallback({ registerCalendar: registerCalendarMock });

    // Verify that registerCalendar was called with converted data
    expect(registerCalendarMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'simple-calendar-custom-calendar-1',
        translations: expect.objectContaining({
          en: expect.objectContaining({
            label: 'My Custom Calendar'
          })
        }),
        months: expect.arrayContaining([
          expect.objectContaining({ name: 'January', days: 31 }),
          expect.objectContaining({ name: 'February', days: 28 }),
          expect.objectContaining({ name: 'March', days: 31 })
        ]),
        weekdays: expect.arrayContaining([
          expect.objectContaining({ name: 'Monday' }),
          expect.objectContaining({ name: 'Tuesday' })
        ])
      }),
      expect.objectContaining({
        type: 'module',
        sourceName: 'Simple Calendar',
        moduleId: 'simple-calendar'
      })
    );

    // Verify success notification
    expect(global.ui.notifications?.info).toHaveBeenCalledWith(
      'Registered 1 calendars from Simple Calendar data'
    );
  });

  it('should handle missing Simple Calendar data gracefully', async () => {
    // Import the module to register the hook
    await import('../src/main');

    // Mock empty world settings
    (global.game.settings.storage.get as any).mockReturnValue({});

    // Simulate S&S firing the registration hook
    registrationCallback({ registerCalendar: registerCalendarMock });

    // Should not call registerCalendar
    expect(registerCalendarMock).not.toHaveBeenCalled();

    // Should log appropriate message
    expect(global.console.log).toHaveBeenCalledWith(
      expect.stringContaining('No Simple Calendar data found')
    );
  });

  it('should handle malformed Simple Calendar data gracefully', async () => {
    // Import the module to register the hook
    await import('../src/main');

    // Mock malformed Simple Calendar data
    const mockWorldSettings = {
      'foundryvtt-simple-calendar.calendars': 'invalid-json'
    };

    (global.game.settings.storage.get as any).mockReturnValue(mockWorldSettings);

    // Simulate S&S firing the registration hook
    registrationCallback({ registerCalendar: registerCalendarMock });

    // Should not call registerCalendar due to JSON parsing error
    expect(registerCalendarMock).not.toHaveBeenCalled();

    // Should log error
    expect(global.console.error).toHaveBeenCalledWith(
      expect.stringContaining('Error parsing calendars data'),
      expect.any(Error)
    );
  });

  it('should convert Simple Calendar format to S&S format correctly', async () => {
    // Import the module to register the hook
    await import('../src/main');

    // Mock detailed Simple Calendar data
    const mockWorldSettings = {
      'foundryvtt-simple-calendar.calendars': JSON.stringify({
        'detailed-calendar': {
          name: 'Fantasy Calendar',
          description: 'A fantasy world calendar',
          year: {
            epoch: 1000,
            currentYear: 1523,
            prefix: 'FA',
            suffix: 'Third Age',
            startDay: 2
          },
          leapYear: {
            rule: 'gregorian'
          },
          months: [
            { name: 'Ringarë', days: 30, abbreviation: 'Rin' },
            { name: 'Narvinyë', days: 31, abbreviation: 'Nar' }
          ],
          weekdays: [
            { name: 'Elenya', abbreviation: 'Ele' },
            { name: 'Anarya', abbreviation: 'Ana' }
          ],
          time: {
            hoursInDay: 24,
            minutesInHour: 60,
            secondsInMinute: 60
          }
        }
      })
    };

    (global.game.settings.storage.get as any).mockReturnValue(mockWorldSettings);

    // Simulate S&S firing the registration hook
    registrationCallback({ registerCalendar: registerCalendarMock });

    // Verify detailed conversion
    expect(registerCalendarMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'simple-calendar-detailed-calendar',
        translations: {
          en: {
            label: 'Fantasy Calendar',
            description: 'A fantasy world calendar'
          }
        },
        year: {
          epoch: 1000,
          currentYear: 1523,
          prefix: 'FA',
          suffix: 'Third Age',
          startDay: 2
        },
        leapYear: {
          rule: 'gregorian'
        },
        months: [
          { name: 'Ringarë', days: 30, abbreviation: 'Rin' },
          { name: 'Narvinyë', days: 31, abbreviation: 'Nar' }
        ],
        weekdays: [
          { name: 'Elenya', abbreviation: 'Ele' },
          { name: 'Anarya', abbreviation: 'Ana' }
        ],
        intercalary: [],
        time: {
          hoursInDay: 24,
          minutesInHour: 60,
          secondsInMinute: 60
        }
      }),
      expect.any(Object)
    );
  });
});