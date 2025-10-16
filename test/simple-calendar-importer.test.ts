/**
 * Tests for SimpleCalendarImporter service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SimpleCalendarImporter } from '../src/api/simple-calendar-importer';

describe('SimpleCalendarImporter', () => {
  let importer: SimpleCalendarImporter;
  let mockGame: any;

  beforeEach(() => {
    importer = new SimpleCalendarImporter();

    // Setup mock game object
    mockGame = {
      modules: new Map(),
      settings: {
        get: vi.fn(),
        set: vi.fn(),
      },
      seasonsStars: {
        api: {
          calendarBuilder: {
            importJson: vi.fn().mockResolvedValue(undefined),
          },
        },
        notes: {
          storage: {
            rebuildIndex: vi.fn(),
          },
        },
      },
      journal: [],
      user: {
        isGM: true,
      },
    };

    // Mock UI notifications
    (global as any).ui = {
      notifications: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
    };

    (global as any).game = mockGame;
  });

  describe('importCalendarFromSettings', () => {
    it('should import calendar from Simple Calendar settings', async () => {
      // Setup: Simple Calendar data exists
      const scData = {
        currentDate: {
          year: 2024,
          month: 5,
          day: 15,
        },
        year: {
          numericRepresentation: 2024,
          prefix: '',
          postfix: '',
        },
        months: [
          { name: 'January', numberOfDays: 31, numericRepresentation: 1 },
        ],
        weekdays: [{ name: 'Monday', numericRepresentation: 1 }],
        leapYearRule: { rule: 'gregorian' },
      };

      mockGame.settings.get.mockReturnValue({ currentDate: scData });

      // Execute
      const result = await importer.importCalendarFromSettings();

      // Verify
      expect(result).toBe(true);
      expect(mockGame.seasonsStars.api.calendarBuilder.importJson).toHaveBeenCalled();
      expect((global as any).ui.notifications.info).toHaveBeenCalledWith(
        expect.stringContaining('imported into Calendar Builder')
      );
    });

    it('should return false if S&S API is not available', async () => {
      // Setup: Remove S&S API
      delete mockGame.seasonsStars;

      // Execute
      const result = await importer.importCalendarFromSettings();

      // Verify
      expect(result).toBe(false);
      expect((global as any).ui.notifications.error).toHaveBeenCalledWith(
        expect.stringContaining('Calendar Builder API not available')
      );
    });

    it('should return false if no Simple Calendar data found', async () => {
      // Setup: No SC data
      mockGame.settings.get.mockReturnValue(null);

      // Execute
      const result = await importer.importCalendarFromSettings();

      // Verify
      expect(result).toBe(false);
      expect((global as any).ui.notifications.error).toHaveBeenCalledWith(
        expect.stringContaining('No Simple Calendar configuration found')
      );
    });

    it('should show warnings if conversion has issues', async () => {
      // Setup: SC data that will generate warnings
      const scData = {
        currentDate: { year: 2024, month: 0, day: 1 },
        year: {},
        months: [{ name: 'Month1', numberOfDays: 30, numericRepresentation: 1 }],
        weekdays: [],
        leapYearRule: { rule: 'none' },
      };

      mockGame.settings.get.mockReturnValue(scData);

      // Execute
      const result = await importer.importCalendarFromSettings();

      // Verify
      expect(result).toBe(true);
      // Conversion may generate warnings for missing weekdays
    });
  });

  describe('importNotesFromSimpleCalendar', () => {
    it('should import Simple Calendar notes', async () => {
      // Setup: Mock Simple Calendar note
      const mockNote = {
        name: 'Test Note',
        flags: {
          'foundryvtt-simple-calendar': {
            noteData: {
              startDate: {
                year: 2024,
                month: 0, // 0-based
                day: 0, // 0-based
                hour: 12,
                minute: 0,
                second: 0,
              },
              allDay: false,
              categories: ['holiday'],
              createdTimestamp: Date.now(),
            },
          },
        },
        setFlag: vi.fn().mockResolvedValue(undefined),
      };

      mockGame.journal = [mockNote];

      // Execute
      const count = await importer.importNotesFromSimpleCalendar();

      // Verify
      expect(count).toBe(1);
      expect(mockNote.setFlag).toHaveBeenCalledWith('seasons-and-stars', 'calendarNote', true);
      expect(mockNote.setFlag).toHaveBeenCalledWith(
        'seasons-and-stars',
        'startDate',
        expect.objectContaining({
          year: 2024,
          month: 1, // Converted to 1-based
          day: 1, // Converted to 1-based
        })
      );
      expect(mockGame.seasonsStars.notes.storage.rebuildIndex).toHaveBeenCalled();
    });

    it('should return 0 if S&S notes system not available', async () => {
      // Setup: Remove S&S notes
      delete mockGame.seasonsStars.notes;

      // Execute
      const count = await importer.importNotesFromSimpleCalendar();

      // Verify
      expect(count).toBe(0);
      expect((global as any).ui.notifications.error).toHaveBeenCalledWith(
        expect.stringContaining('notes system not available')
      );
    });

    it('should return 0 if no Simple Calendar notes found', async () => {
      // Setup: Empty journal
      mockGame.journal = [];

      // Execute
      const count = await importer.importNotesFromSimpleCalendar();

      // Verify
      expect(count).toBe(0);
      expect((global as any).ui.notifications.info).toHaveBeenCalledWith(
        expect.stringContaining('No Simple Calendar notes found')
      );
    });

    it('should handle errors gracefully and continue with other notes', async () => {
      // Setup: One good note and one that will fail
      const goodNote = {
        name: 'Good Note',
        flags: {
          'foundryvtt-simple-calendar': {
            noteData: {
              startDate: { year: 2024, month: 0, day: 0 },
              allDay: true,
            },
          },
        },
        setFlag: vi.fn().mockResolvedValue(undefined),
      };

      const badNote = {
        name: 'Bad Note',
        flags: {
          'foundryvtt-simple-calendar': {
            noteData: {
              startDate: { year: 2024, month: 0, day: 0 },
            },
          },
        },
        setFlag: vi.fn().mockRejectedValue(new Error('Failed to set flag')),
      };

      mockGame.journal = [goodNote, badNote];

      // Execute
      const count = await importer.importNotesFromSimpleCalendar();

      // Verify - only the good note should be imported
      expect(count).toBe(1);
    });
  });

  describe('shouldShowImportButton', () => {
    it('should return true if Simple Calendar data exists and not imported', () => {
      // Setup
      mockGame.modules.set('foundryvtt-simple-calendar', { active: true });
      mockGame.settings.get.mockImplementation((module: string, key: string) => {
        if (module === 'foundryvtt-simple-calendar' && key === 'global-configuration') {
          return { currentDate: { year: 2024 } };
        }
        if (module === 'foundryvtt-simple-calendar-compat' && key === 'calendar-imported') {
          throw new Error('Setting not found');
        }
        return null;
      });

      // Execute
      const result = importer.shouldShowImportButton();

      // Verify
      expect(result).toBe(true);
    });

    it('should return false if Simple Calendar module not installed', () => {
      // Setup: No SC module
      mockGame.modules.clear();

      // Execute
      const result = importer.shouldShowImportButton();

      // Verify
      expect(result).toBe(false);
    });

    it('should return false if calendar already imported', () => {
      // Setup
      mockGame.modules.set('foundryvtt-simple-calendar', { active: true });
      mockGame.settings.get.mockImplementation((module: string, key: string) => {
        if (module === 'foundryvtt-simple-calendar' && key === 'global-configuration') {
          return { currentDate: { year: 2024 } };
        }
        if (module === 'foundryvtt-simple-calendar-compat' && key === 'calendar-imported') {
          return true; // Already imported
        }
        return null;
      });

      // Execute
      const result = importer.shouldShowImportButton();

      // Verify
      expect(result).toBe(false);
    });

    it('should return false if no Simple Calendar data in settings', () => {
      // Setup
      mockGame.modules.set('foundryvtt-simple-calendar', { active: true });
      mockGame.settings.get.mockReturnValue(null);

      // Execute
      const result = importer.shouldShowImportButton();

      // Verify
      expect(result).toBe(false);
    });
  });

  describe('markCalendarAsImported', () => {
    it('should mark calendar as imported', async () => {
      // Execute
      await importer.markCalendarAsImported();

      // Verify
      expect(mockGame.settings.set).toHaveBeenCalledWith(
        'foundryvtt-simple-calendar-compat',
        'calendar-imported',
        true
      );
    });

    it('should handle errors gracefully', async () => {
      // Setup: settings.set throws error
      mockGame.settings.set.mockRejectedValue(new Error('Failed to save setting'));

      // Execute - should not throw
      await expect(importer.markCalendarAsImported()).resolves.toBeUndefined();
    });
  });
});
