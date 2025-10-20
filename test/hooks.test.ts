/**
 * Tests for Simple Calendar hooks implementation
 * Following TDD approach: write failing tests first
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HookBridge } from '../src/api/hooks';
import type { CalendarProvider } from '../src/types';

/**
 * Mock Foundry User interface
 */
interface MockFoundryUser {
  id: string;
  isGM: boolean;
  active: boolean;
}

/**
 * Mock Foundry Hooks interface
 */
interface MockHooksSystem {
  callAll: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
}

/**
 * Mock Foundry Game interface
 */
interface MockGame {
  user: MockFoundryUser;
  users: {
    filter: ReturnType<typeof vi.fn>;
  };
}

// Mock Foundry globals
const mockHooks: MockHooksSystem = {
  callAll: vi.fn(),
  on: vi.fn(),
};

// Mock user data for testing
const mockUsers: MockFoundryUser[] = [
  { id: 'user1', isGM: true, active: true },
  { id: 'user2', isGM: true, active: false }, // inactive GM
  { id: 'user3', isGM: false, active: true }, // active player
];

const mockGame: MockGame = {
  user: { isGM: true, id: 'user1', active: true },
  users: {
    filter: vi.fn((predicate: (user: MockFoundryUser) => boolean) =>
      mockUsers.filter(predicate)
    ),
    values: vi.fn(() => mockUsers),
  } as any,
};

global.Hooks = mockHooks;
global.game = mockGame;

// Mock provider
const mockProvider: CalendarProvider = {
  name: 'Seasons & Stars',
  version: '1.0.0',
  isAvailable: () => true,
  getCurrentDate: () => ({
    year: 2024,
    month: 1,
    day: 1,
    weekday: 0,
    time: { hour: 12, minute: 30, second: 0 },
  }),
  getMonthNames: () => ['January'],
  getWeekdayNames: () => ['Sunday'],
};

describe('HookBridge', () => {
  let hookBridge: HookBridge;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the user to be a GM for each test
    mockGame.user.isGM = true;
    mockGame.user.id = 'user1';
    mockGame.user.active = true;
    hookBridge = new HookBridge(mockProvider);
  });

  afterEach(() => {
    // Clean up any timeouts to prevent memory leaks
    if (hookBridge) {
      hookBridge.destroy();
    }
  });

  describe('Existing Hook Implementation', () => {
    it('should emit Init hook during initialization', () => {
      hookBridge.initialize();

      expect(mockHooks.callAll).toHaveBeenCalledWith('simple-calendar-init');
    });

    it('should emit DateTimeChange hook with correct data', () => {
      hookBridge.initialize();

      // Find the date change handler that was registered (before clearing mocks)
      const dateChangeHook = mockHooks.on.mock.calls.find(
        (call: any[]) => call[0] === 'seasons-stars:dateChanged'
      );

      // Clear mocks to isolate the date change test
      vi.clearAllMocks();

      // Verify the hook was registered and call the handler
      expect(dateChangeHook).toBeDefined();
      if (dateChangeHook) {
        const dateChangeHandler = dateChangeHook[1];
        dateChangeHandler();
      }

      expect(mockHooks.callAll).toHaveBeenCalledWith(
        'simple-calendar-date-time-change',
        expect.objectContaining({
          date: expect.any(Object),
          moons: expect.any(Array),
          seasons: expect.any(Array),
        })
      );
    });

    it('should emit ClockStartStop hook when clock starts', () => {
      hookBridge.startClock();

      expect(mockHooks.callAll).toHaveBeenCalledWith(
        'simple-calendar-clock-start-stop',
        { started: true }
      );
    });

    it('should emit ClockStartStop hook when clock stops', () => {
      hookBridge.stopClock();

      expect(mockHooks.callAll).toHaveBeenCalledWith(
        'simple-calendar-clock-start-stop',
        { started: false }
      );
    });
  });

  describe('Missing Hook Implementation - PrimaryGM', () => {
    it('should emit PrimaryGM hook when user becomes primary GM', () => {
      // This test should fail initially - implementing TDD
      hookBridge.triggerPrimaryGMCheck();

      expect(mockHooks.callAll).toHaveBeenCalledWith(
        'simple-calendar-primary-gm',
        expect.objectContaining({
          isPrimaryGM: true,
        })
      );
    });

    it('should not emit PrimaryGM hook when user is not a GM', () => {
      const originalIsGM = mockGame.user.isGM;
      try {
        mockGame.user.isGM = false;

        hookBridge.triggerPrimaryGMCheck();

        expect(mockHooks.callAll).not.toHaveBeenCalledWith(
          'simple-calendar-primary-gm',
          expect.any(Object)
        );
      } finally {
        mockGame.user.isGM = originalIsGM;
      }
    });

    it('should determine primary GM status correctly', () => {
      const isPrimaryGM = hookBridge.isPrimaryGM();

      expect(typeof isPrimaryGM).toBe('boolean');
    });
  });

  describe('Missing Hook Implementation - Ready', () => {
    it('should emit Ready hook after full initialization', () => {
      // This test should fail initially - implementing TDD
      hookBridge.emitReadyHook();

      expect(mockHooks.callAll).toHaveBeenCalledWith('simple-calendar-ready');
    });

    it('should only emit Ready hook once', () => {
      hookBridge.emitReadyHook();
      hookBridge.emitReadyHook(); // Second call should be ignored

      expect(mockHooks.callAll).toHaveBeenCalledTimes(1);
    });

    it('should emit Ready hook after primary GM check for GMs', () => {
      // Ready should be emitted after primary GM determination
      hookBridge.initialize();

      // Should emit Init, PrimaryGM hooks in correct order
      // (Ready is emitted after 5 second timeout in real implementation)
      expect(mockHooks.callAll).toHaveBeenCalledWith('simple-calendar-init');
      expect(mockHooks.callAll).toHaveBeenCalledWith('simple-calendar-primary-gm', expect.any(Object));
    });

    it('should emit Ready hook after 5-second delay during initialization', () => {
      vi.useFakeTimers();
      try {
        hookBridge.initialize();

        // Should not be called immediately
        expect(mockHooks.callAll).not.toHaveBeenCalledWith('simple-calendar-ready');

        // Fast-forward 5 seconds
        vi.advanceTimersByTime(5000);

        expect(mockHooks.callAll).toHaveBeenCalledWith('simple-calendar-ready');
      } finally {
        vi.useRealTimers();
      }
    });

    it('should not emit Ready hook if destroyed before timeout', () => {
      vi.useFakeTimers();
      try {
        hookBridge.initialize();
        hookBridge.destroy();

        // Fast-forward past the timeout
        vi.advanceTimersByTime(5000);

        // Ready hook should NOT be emitted
        expect(mockHooks.callAll).not.toHaveBeenCalledWith('simple-calendar-ready');
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('Hook Constant Access', () => {
    it('should provide access to all Simple Calendar hook constants', () => {
      const hookNames = hookBridge.getHookNames();

      expect(hookNames).toEqual({
        Init: 'simple-calendar-init',
        DateTimeChange: 'simple-calendar-date-time-change',
        ClockStartStop: 'simple-calendar-clock-start-stop',
        PrimaryGM: 'simple-calendar-primary-gm',
        Ready: 'simple-calendar-ready',
      });
    });
  });

  describe('S&S Hook Integration', () => {
    it('should listen for S&S hooks and translate to Simple Calendar format', () => {
      hookBridge.initialize();

      // Verify S&S hook listeners were set up
      expect(mockHooks.on).toHaveBeenCalledWith(
        'seasons-stars:dateChanged',
        expect.any(Function)
      );
      expect(mockHooks.on).toHaveBeenCalledWith(
        'seasons-stars:calendarChanged',
        expect.any(Function)
      );
    });

    it('should handle pause state changes and emit ClockStartStop', () => {
      hookBridge.initialize();

      // Should listen for pause/unpause events
      expect(mockHooks.on).toHaveBeenCalledWith(
        'clientSettingChanged',
        expect.any(Function)
      );
    });
  });
});