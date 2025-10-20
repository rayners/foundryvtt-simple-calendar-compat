/**
 * Test setup for Simple Calendar Compatibility Bridge
 */

// Basic globals for compatibility testing
global.console = console;

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