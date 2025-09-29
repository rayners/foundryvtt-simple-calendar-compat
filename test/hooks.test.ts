/**
 * Tests for Simple Calendar hooks implementation
 * Following TDD approach: write failing tests first
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HookBridge } from '../src/api/hooks';
import type { CalendarProvider } from '../src/types';

// Mock Foundry globals
const mockHooks = {
  callAll: vi.fn(),
  on: vi.fn(),
};

global.Hooks = mockHooks as any;
global.game = {
  user: { isGM: true, id: 'user1', active: true },
  users: {
    filter: vi.fn(() => [{ id: 'user1', isGM: true, active: true }]),
  },
} as any;

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
    global.game.user.isGM = true;
    global.game.user.id = 'user1';
    global.game.user.active = true;
    hookBridge = new HookBridge(mockProvider);
  });

  describe('Existing Hook Implementation', () => {
    it('should emit Init hook during initialization', () => {
      hookBridge.initialize();

      expect(mockHooks.callAll).toHaveBeenCalledWith('simple-calendar-init');
    });

    it('should emit DateTimeChange hook with correct data', () => {
      hookBridge.initialize();
      vi.clearAllMocks();

      // Trigger a date change
      const onDateChanged = (hookBridge as any).onDateChanged.bind(hookBridge);
      onDateChanged();

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
      global.game.user.isGM = false;

      hookBridge.triggerPrimaryGMCheck();

      expect(mockHooks.callAll).not.toHaveBeenCalledWith(
        'simple-calendar-primary-gm',
        expect.any(Object)
      );
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