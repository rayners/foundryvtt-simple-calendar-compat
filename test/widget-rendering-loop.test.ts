/**
 * Tests for widget rendering loop prevention - ACTUAL BRIDGE CODE TESTING
 *
 * This test imports and exercises the real SimpleCalendarCompatibilityBridge class
 * to prove the loop prevention works (no rapid-fire renderMainApp emissions).
 *
 * KNOWN LIMITATION: This approach prevents renderMainApp from firing on legitimate
 * calendar updates (e.g., when time advances). This is an acceptable trade-off to
 * prevent the infinite rendering loop caused by Simple Weather DOM mutations.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import $ from 'jquery';

// CRITICAL: Set up globals BEFORE importing main.ts
// main.ts has top-level code that runs immediately and requires these globals
let dom: JSDOM;
let hookCallbacks: Map<string, Function[]>;

// Initialize JSDOM and basic globals before any imports
dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document as any;
global.window = dom.window as any;
(global as any).$ = $;

// Mock Hooks system that main.ts will use during module parse
hookCallbacks = new Map();
const mockHooks = {
  on: vi.fn((hookName: string, callback: Function) => {
    if (!hookCallbacks.has(hookName)) {
      hookCallbacks.set(hookName, []);
    }
    hookCallbacks.get(hookName)!.push(callback);
    return 1;
  }),
  once: vi.fn((hookName: string, callback: Function) => {
    if (!hookCallbacks.has(hookName)) {
      hookCallbacks.set(hookName, []);
    }
    hookCallbacks.get(hookName)!.push(callback);
    return 1;
  }),
  callAll: vi.fn((hookName: string, ...args: any[]) => {
    // Execution happens here
    const callbacks = hookCallbacks.get(hookName);
    if (callbacks) {
      callbacks.forEach(cb => cb(...args));
    }
  }),
  off: vi.fn(),
};
global.Hooks = mockHooks;
(globalThis as any).Hooks = mockHooks;

// Mock other globals required by main.ts top-level code
(global as any).game = {
  modules: new Map(),
  settings: {
    get: vi.fn(),
    storage: {
      get: vi.fn(() => ({})),
    },
  },
  i18n: {
    localize: vi.fn((key: string) => key),
  },
  user: {
    isGM: true,
  },
};
(global as any).ui = {
  notifications: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
};

// Mock foundry.packages.Module constructor
(global as any).foundry = {
  packages: {
    Module: class Module {
      constructor(data: any) {
        Object.assign(this, data);
      }
    },
  },
};

// NOW we can safely import main.ts
import { SimpleCalendarCompatibilityBridge } from '../src/main';

describe('Widget Rendering Loop Prevention - Actual Bridge Code', () => {
  let widgetElement: HTMLElement;
  let renderMainAppCallCount: number;
  let bridge: SimpleCalendarCompatibilityBridge;

  beforeEach(() => {
    // Reset counters
    renderMainAppCallCount = 0;
    hookCallbacks.clear();

    // Re-setup hooks with counter tracking
    const mockHooksWithCounter = {
      on: vi.fn((hookName: string, callback: Function) => {
        if (!hookCallbacks.has(hookName)) {
          hookCallbacks.set(hookName, []);
        }
        hookCallbacks.get(hookName)!.push(callback);
        return 1;
      }),
      once: vi.fn((hookName: string, callback: Function) => {
        if (!hookCallbacks.has(hookName)) {
          hookCallbacks.set(hookName, []);
        }
        hookCallbacks.get(hookName)!.push(callback);
        return 1;
      }),
      callAll: vi.fn((hookName: string, ...args: any[]) => {
        if (hookName === 'renderMainApp') {
          renderMainAppCallCount++;
        }
        const callbacks = hookCallbacks.get(hookName);
        if (callbacks) {
          callbacks.forEach(cb => cb(...args));
        }
      }),
      off: vi.fn(),
    };
    global.Hooks = mockHooksWithCounter;

    // Clear and recreate widget element
    document.body.innerHTML = '';
    widgetElement = document.createElement('div');
    widgetElement.id = 'calendar-mini-widget';
    widgetElement.className = 'calendar-mini-widget';
    document.body.appendChild(widgetElement);

    // Mock other required globals
    (global as any).game = {
      modules: new Map(),
      settings: {
        get: vi.fn(),
        storage: {
          get: vi.fn(() => ({})),
        },
      },
      i18n: {
        localize: vi.fn((key: string) => key),
      },
      user: {
        isGM: true,
      },
    };
    (global as any).ui = {
      notifications: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
    };

    // Mock Seasons & Stars API for bridge detection
    (global as any).game.seasonsStars = {
      manager: {
        getName: () => 'Seasons & Stars',
        getVersion: () => '2.0.0',
        integration: {
          getCurrentDate: () => ({
            year: 2024,
            month: 1,
            day: 15,
            hour: 12,
            minute: 0,
            second: 0,
          }),
        },
      },
    };

    // Create bridge instance
    bridge = new SimpleCalendarCompatibilityBridge();
  });

  afterEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
    hookCallbacks.clear();
  });

  describe('Loop Prevention', () => {
    it('should prevent rapid-fire renderMainApp emissions when widget re-renders quickly', () => {
      // Initialize the bridge which sets up widget integration
      bridge.setupWidgetIntegration();

      // Get the actual hook callback that was registered
      const widgetHookCallbacks = hookCallbacks.get('seasons-stars:renderCalendarWidget');
      expect(widgetHookCallbacks).toBeDefined();
      expect(widgetHookCallbacks!.length).toBe(1);

      const actualCallback = widgetHookCallbacks![0];

      // First render - widget doesn't have compatibility class yet
      actualCallback({}, widgetElement, 'mini');

      // Should emit renderMainApp once
      expect(renderMainAppCallCount).toBe(1);
      expect(widgetElement.classList.contains('simple-calendar-compat')).toBe(true);

      // Second render immediately (simulating Simple Weather DOM mutation causing re-render)
      actualCallback({}, widgetElement, 'mini');

      // Should NOT emit again (loop prevention)
      expect(renderMainAppCallCount).toBe(1);

      // Third render
      actualCallback({}, widgetElement, 'mini');

      // Still should be 1
      expect(renderMainAppCallCount).toBe(1);
    });

    it('should handle multiple different widgets independently', () => {
      bridge.setupWidgetIntegration();

      const widget1 = document.createElement('div');
      widget1.id = 'widget-1';
      document.body.appendChild(widget1);

      const widget2 = document.createElement('div');
      widget2.id = 'widget-2';
      document.body.appendChild(widget2);

      const actualCallback = hookCallbacks.get('seasons-stars:renderCalendarWidget')![0];

      // Widget 1, first render
      actualCallback({}, widget1, 'mini');
      expect(renderMainAppCallCount).toBe(1);
      expect(widget1.classList.contains('simple-calendar-compat')).toBe(true);

      // Widget 1, second render (should skip)
      actualCallback({}, widget1, 'mini');
      expect(renderMainAppCallCount).toBe(1);

      // Widget 2, first render (should emit)
      actualCallback({}, widget2, 'mini');
      expect(renderMainAppCallCount).toBe(2);
      expect(widget2.classList.contains('simple-calendar-compat')).toBe(true);

      // Widget 2, second render (should skip)
      actualCallback({}, widget2, 'mini');
      expect(renderMainAppCallCount).toBe(2);
    });
  });

  describe('Widget Compatibility Structure', () => {
    it('should not re-add compatibility structure if already present', () => {
      bridge.setupWidgetIntegration();
      const actualCallback = hookCallbacks.get('seasons-stars:renderCalendarWidget')![0];

      // Pre-add the class (simulating already-initialized widget)
      widgetElement.classList.add('simple-calendar-compat');
      const originalHTML = widgetElement.innerHTML;

      // Render
      actualCallback({}, widgetElement, 'mini');

      // DOM should not change
      expect(widgetElement.innerHTML).toBe(originalHTML);
      expect(renderMainAppCallCount).toBe(0);
    });
  });
});
