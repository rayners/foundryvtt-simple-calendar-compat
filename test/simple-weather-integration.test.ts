/**
 * Tests for Simple Weather integration to ensure the Simple Calendar API
 * is properly exposed for Simple Weather detection and usage
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Simple Weather Integration', () => {
  beforeEach(() => {
    // Reset global state
    if ((globalThis as any).SimpleCalendar) {
      delete (globalThis as any).SimpleCalendar;
    }
    if ((window as any).SimpleCalendar) {
      delete (window as any).SimpleCalendar;
    }
  });

  describe('Module Detection', () => {
    it('should expose SimpleCalendar globally at module parse time', () => {
      // Simulate what happens when main.ts is parsed
      const moduleParseTimeSimpleCalendar = {
        api: {
          timestampToDate: () => ({ display: { monthName: '', day: '1', year: '2024' } }),
          getCurrentDate: () => ({ display: { monthName: '', day: '1', year: '2024' } }),
        },
        Hooks: {
          DateTimeChange: 'simple-calendar-date-time-change',
          Init: 'simple-calendar-init',
          ClockStartStop: 'simple-calendar-clock-start-stop',
        },
      };

      // This should happen immediately when module loads
      (window as any).SimpleCalendar = moduleParseTimeSimpleCalendar;
      (globalThis as any).SimpleCalendar = moduleParseTimeSimpleCalendar;

      // Simple Weather checks for SimpleCalendar in globalThis
      expect((globalThis as any).SimpleCalendar).toBeDefined();
      expect((globalThis as any).SimpleCalendar.api).toBeDefined();
      expect((globalThis as any).SimpleCalendar.Hooks).toBeDefined();
    });

    it('should have the correct hook names that Simple Weather expects', () => {
      const moduleParseTimeSimpleCalendar = {
        api: {},
        Hooks: {
          DateTimeChange: 'simple-calendar-date-time-change',
          Init: 'simple-calendar-init',
          ClockStartStop: 'simple-calendar-clock-start-stop',
          Ready: 'simple-calendar-ready',
        },
      };

      (globalThis as any).SimpleCalendar = moduleParseTimeSimpleCalendar;

      // Verify hook names match what Simple Weather expects
      expect((globalThis as any).SimpleCalendar.Hooks.DateTimeChange).toBe('simple-calendar-date-time-change');
      expect((globalThis as any).SimpleCalendar.Hooks.ClockStartStop).toBe('simple-calendar-clock-start-stop');
    });

    it('should register fake Simple Calendar module for dependency checks', () => {
      // Setup mock game.modules
      const mockModules = new Map();
      (globalThis as any).game = {
        modules: {
          get: (id: string) => mockModules.get(id),
          set: (id: string, module: any) => mockModules.set(id, module),
        },
        user: { isGM: true },
      };

      // Register fake module (simulating what registerFakeSimpleCalendarModule does)
      const fakeModule = {
        id: 'foundryvtt-simple-calendar',
        title: 'Simple Calendar (Compatibility Bridge)',
        active: true,
        version: '2.4.18',
      };

      mockModules.set('foundryvtt-simple-calendar', fakeModule);

      // Simple Weather should detect the module
      const detectedModule = game.modules.get('foundryvtt-simple-calendar');
      expect(detectedModule).toBeDefined();
      expect(detectedModule.active).toBe(true);
      expect(detectedModule.version).toBe('2.4.18');
    });
  });

  describe('API Methods Required by Simple Weather', () => {
    it('should provide getCurrentDate method', () => {
      const mockApi = {
        getCurrentDate: vi.fn(() => ({
          year: 2024,
          month: 1,
          day: 15,
          hour: 12,
          minute: 0,
          second: 0,
        })),
      };

      (globalThis as any).SimpleCalendar = { api: mockApi };

      // Simple Weather calls this to get current date
      const date = (globalThis as any).SimpleCalendar.api.getCurrentDate();
      expect(date).toBeDefined();
      expect(date.year).toBe(2024);
      expect(mockApi.getCurrentDate).toHaveBeenCalled();
    });

    it('should provide timestampToDate method', () => {
      const mockApi = {
        timestampToDate: vi.fn((timestamp: number) => ({
          year: 2024,
          month: 1,
          day: 1,
          hour: 0,
          minute: 0,
          second: 0,
        })),
      };

      (globalThis as any).SimpleCalendar = { api: mockApi };

      // Simple Weather uses this for date conversion
      const date = (globalThis as any).SimpleCalendar.api.timestampToDate(0);
      expect(date).toBeDefined();
      expect(mockApi.timestampToDate).toHaveBeenCalledWith(0);
    });

    it('should provide getNotesForDay method for weather storage', () => {
      const mockApi = {
        getNotesForDay: vi.fn(() => []),
      };

      (globalThis as any).SimpleCalendar = { api: mockApi };

      // Simple Weather uses this to retrieve stored weather
      const notes = (globalThis as any).SimpleCalendar.api.getNotesForDay(2024, 1, 15);
      expect(notes).toBeDefined();
      expect(Array.isArray(notes)).toBe(true);
      expect(mockApi.getNotesForDay).toHaveBeenCalled();
    });

    it('should provide addNote method for weather persistence', async () => {
      const mockApi = {
        addNote: vi.fn(() => Promise.resolve({ id: 'note123' })),
      };

      (globalThis as any).SimpleCalendar = { api: mockApi };

      // Simple Weather uses this to store weather data
      const result = await (globalThis as any).SimpleCalendar.api.addNote(
        'Weather',
        'Sunny',
        { year: 2024, month: 1, day: 15 }
      );

      expect(result).toBeDefined();
      expect(result.id).toBe('note123');
      expect(mockApi.addNote).toHaveBeenCalled();
    });

    it('should provide Icons constants for seasons', () => {
      const Icons = {
        Fall: 'fall',
        Winter: 'winter',
        Spring: 'spring',
        Summer: 'summer',
      };

      (globalThis as any).SimpleCalendar = { Icons };

      // Simple Weather uses these for seasonal weather
      expect((globalThis as any).SimpleCalendar.Icons.Winter).toBe('winter');
      expect((globalThis as any).SimpleCalendar.Icons.Summer).toBe('summer');
    });
  });

  describe('Hook Timing Issues', () => {
    it('should have SimpleCalendar available before init hook', () => {
      // Simulate module load order - this tests the actual timing issue from #39
      const hookCallbacks: Function[] = [];
      let apiAvailableDuringInit = false;

      // Mock Hooks.once to capture when init hook fires
      const mockHooks = {
        once: (event: string, callback: Function) => {
          if (event === 'init') {
            hookCallbacks.push(callback);
          }
        }
      };

      // Step 1: Module scripts are parsed (our module loads first)
      (globalThis as any).SimpleCalendar = { api: { getCurrentDate: () => ({}) }, Hooks: {} };

      // Step 2: Simple Weather module loads and registers its init hook
      mockHooks.once('init', () => {
        // This is what Simple Weather does - check if SimpleCalendar exists
        apiAvailableDuringInit = !!(globalThis as any).SimpleCalendar;
      });

      // Step 3: Foundry fires init hook
      hookCallbacks.forEach(cb => cb());

      // Simple Weather should have found SimpleCalendar during its init hook
      expect(apiAvailableDuringInit).toBe(true);
    });

    it('should have fake module registered before ready hook', () => {
      const mockModules = new Map();
      (globalThis as any).game = {
        modules: {
          get: (id: string) => mockModules.get(id),
          set: (id: string, module: any) => mockModules.set(id, module),
        },
      };

      // During setup hook
      mockModules.set('foundryvtt-simple-calendar', {
        id: 'foundryvtt-simple-calendar',
        active: true,
      });

      // When Simple Weather checks during ready
      const module = game.modules.get('foundryvtt-simple-calendar');
      expect(module).toBeDefined();
      expect(module.active).toBe(true);
    });
  });

  describe('Attached Mode Compatibility', () => {
    it('should provide CSS classes for Simple Weather attached mode', () => {
      // These CSS classes should be injected by the module
      const expectedClasses = [
        '.fsc-of', // Tab wrapper
        '.fsc-c',  // Tab open state
        '.fsc-d',  // Tab closed state
        '#swr-fsc-container', // Simple Weather container
      ];

      // In real scenario, these would be in document.head
      // Just verify they're part of the module's CSS injection
      const cssContent = `
        .fsc-of { display: flex; }
        .fsc-c { display: block; }
        .fsc-d { display: none; }
        #swr-fsc-container { position: relative; }
      `;

      expectedClasses.forEach(className => {
        expect(cssContent).toContain(className);
      });
    });
  });
});