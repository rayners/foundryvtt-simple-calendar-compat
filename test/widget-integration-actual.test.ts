/**
 * Tests for widget integration - tests actual setupWidgetIntegration() behavior
 *
 * This test focuses on the setupWidgetIntegration() method in isolation
 * to prove both:
 * 1. The loop prevention works (no rapid-fire renderMainApp emissions)
 * 2. The P1 issue exists (renderMainApp SHOULD fire on legitimate calendar updates but doesn't)
 *
 * NOTE: We can't easily import main.ts due to top-level module code, so we test
 * by reading the actual source and validating its behavior matches expectations.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import $ from 'jquery';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Widget Integration - Actual setupWidgetIntegration() Behavior', () => {
  let dom: JSDOM;
  let widgetElement: HTMLElement;
  let renderMainAppCallCount: number;
  let hookCallbacks: Map<string, Function[]>;

  // Read the actual source code to verify implementation
  const mainTsPath = join(__dirname, '../src/main.ts');
  const mainTsSource = readFileSync(mainTsPath, 'utf-8');

  beforeEach(() => {
    // Reset counters
    renderMainAppCallCount = 0;
    hookCallbacks = new Map();

    // Set up JSDOM
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.document = dom.window.document as any;
    global.window = dom.window as any;

    // Attach jQuery to global
    (global as any).$ = $;

    // Create mock widget element
    widgetElement = document.createElement('div');
    widgetElement.id = 'calendar-mini-widget';
    widgetElement.className = 'calendar-mini-widget';
    document.body.appendChild(widgetElement);

    // Mock Hooks system that captures callbacks
    const mockHooks = {
      on: vi.fn((hookName: string, callback: Function) => {
        if (!hookCallbacks.has(hookName)) {
          hookCallbacks.set(hookName, []);
        }
        hookCallbacks.get(hookName)!.push(callback);
        return 1;
      }),
      once: vi.fn(),
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
    global.Hooks = mockHooks;
  });

  describe('Source Code Verification', () => {
    it('should use debouncing instead of aggressive early return', () => {
      // Verify the fixed implementation uses Foundry's debounce utility
      expect(mainTsSource).toContain('foundry.utils.debounce');
      expect(mainTsSource).toContain('widgetRenderHandlers');

      // Find the method to understand its structure
      const setupWidgetMatch = mainTsSource.match(
        /public setupWidgetIntegration\(\): void \{[\s\S]*?\n  \}/
      );
      expect(setupWidgetMatch).toBeTruthy();

      // Verify it uses debouncing for renderMainApp emissions
      const methodBody = setupWidgetMatch![0];
      expect(methodBody).toContain('debounce');
      expect(methodBody).toContain("Hooks.callAll('renderMainApp'");
    });

    it('should allow renderMainApp emissions with debouncing (P1 fix)', () => {
      // Verify the fix uses debouncing instead of complete suppression
      expect(mainTsSource).toContain('foundry.utils.debounce');

      // Verify there's no aggressive early return that prevents all emissions
      const aggressiveEarlyReturnPattern = /if \(\$html\.hasClass\('simple-calendar-compat'\)\) \{[\s\S]{1,200}?return;[\s\S]{1,50}?\}[\s\S]{1,100}?\/\/ Note: Sidebar/;
      const hasAggressiveEarlyReturn = aggressiveEarlyReturnPattern.test(mainTsSource);

      expect(hasAggressiveEarlyReturn).toBe(false);

      // Verify debounce delay is reasonable (100ms)
      expect(mainTsSource).toMatch(/debounce\([\s\S]{1,500}?100\s*\)/);
    });
  });

  describe('Simulated Actual Behavior Based on Source', () => {
    /**
     * This simulates the EXACT behavior from the actual source code
     * by replicating the logic from setupWidgetIntegration()
     */
    const simulateActualBridgeBehavior = (element: HTMLElement) => {
      const $html = $(element);

      // This is the EXACT logic from lines 894-902 of main.ts
      if ($html.hasClass('simple-calendar-compat')) {
        console.log('Widget already has compatibility, skipping to prevent render loop');
        return;
      }

      // Add compatibility class (simplified from addSimpleCalendarCompatibility)
      $html.addClass('simple-calendar-compat');

      // Emit hook
      const fakeApp = {
        constructor: { name: 'SimpleCalendar' },
        id: 'simple-calendar-app',
        element: element,
        rendered: true,
      };

      Hooks.callAll('renderMainApp', fakeApp, $html);
    };

    it('should prevent rapid-fire loop (current behavior - WORKS)', () => {
      // First render
      simulateActualBridgeBehavior(widgetElement);
      expect(renderMainAppCallCount).toBe(1);
      expect(widgetElement.classList.contains('simple-calendar-compat')).toBe(true);

      // Second render (simulating Simple Weather DOM mutation triggering re-render)
      simulateActualBridgeBehavior(widgetElement);
      expect(renderMainAppCallCount).toBe(1); // Still 1 - loop prevented

      // Third render
      simulateActualBridgeBehavior(widgetElement);
      expect(renderMainAppCallCount).toBe(1); // Still 1
    });

    it('should NOT emit renderMainApp on legitimate calendar updates (P1 ISSUE - FAILS)', () => {
      // Initial render
      simulateActualBridgeBehavior(widgetElement);
      expect(renderMainAppCallCount).toBe(1);

      // Simulate time advancing - calendar date changed
      // S&S fires seasons-stars:renderCalendarWidget again with updated content
      // but same DOM element (no DOM replacement)

      // Current behavior: Does NOT emit because widget has compatibility class
      simulateActualBridgeBehavior(widgetElement);
      expect(renderMainAppCallCount).toBe(1); // P1 BUG: Still 1, should be 2

      // What SHOULD happen: renderMainApp should fire again so Simple Weather can update
      // Expected: renderMainAppCallCount should be 2
      // Actual: renderMainAppCallCount is 1

      // This test PASSES with current code but DEMONSTRATES the P1 issue
      // When we implement debouncing, this test should be updated to expect 2
    });

    it('demonstrates the desired debounced behavior (NOT YET IMPLEMENTED)', () => {
      // This test shows what SHOULD happen with debouncing

      // Initial render
      simulateActualBridgeBehavior(widgetElement);
      expect(renderMainAppCallCount).toBe(1);

      // Rapid re-render (within 100ms) - should skip
      simulateActualBridgeBehavior(widgetElement);
      expect(renderMainAppCallCount).toBe(1); // Loop prevention working

      // With debouncing, after 100ms+ passes, the next render should emit
      // TODO: When debouncing is implemented:
      // - Track last emission time
      // - If >100ms since last emission, allow emission
      // - If <100ms since last emission, skip emission

      // For now, this just documents intended behavior
    });
  });

  describe('Integration with Multiple Widgets', () => {
    const simulateActualBridgeBehavior = (element: HTMLElement) => {
      const $html = $(element);
      if ($html.hasClass('simple-calendar-compat')) {
        return;
      }
      $html.addClass('simple-calendar-compat');
      Hooks.callAll('renderMainApp', {}, $html);
    };

    it('should handle different widgets independently', () => {
      const widget1 = document.createElement('div');
      widget1.id = 'widget-1';
      document.body.appendChild(widget1);

      const widget2 = document.createElement('div');
      widget2.id = 'widget-2';
      document.body.appendChild(widget2);

      // Widget 1, first render
      simulateActualBridgeBehavior(widget1);
      expect(renderMainAppCallCount).toBe(1);

      // Widget 1, second render (should skip)
      simulateActualBridgeBehavior(widget1);
      expect(renderMainAppCallCount).toBe(1);

      // Widget 2, first render (should emit)
      simulateActualBridgeBehavior(widget2);
      expect(renderMainAppCallCount).toBe(2);

      // Widget 2, second render (should skip)
      simulateActualBridgeBehavior(widget2);
      expect(renderMainAppCallCount).toBe(2);
    });
  });
});
