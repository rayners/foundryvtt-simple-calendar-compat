/**
 * Test setup for Simple Calendar Compatibility Bridge
 */

import { vi } from 'vitest';

// Basic globals for compatibility testing
global.console = console;

// Mock Hooks system (required by main.ts top-level code)
(global as any).Hooks = {
  on: vi.fn(),
  once: vi.fn(),
  callAll: vi.fn(),
  off: vi.fn(),
};

// Mock Foundry game global
(global as any).game = {
  time: {
    worldTime: 0,
  },
  modules: new Map(),
  settings: {
    get: () => undefined,
    set: () => undefined,
    register: () => undefined,
  },
  users: [],
  user: {
    isGM: false,
    id: 'test-user',
  },
};

// Mock basic types that might be needed for testing
export {};