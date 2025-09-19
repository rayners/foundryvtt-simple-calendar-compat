/**
 * Essential Foundry VTT v13 Type Definitions
 *
 * This file provides minimal but complete type definitions for Foundry VTT v13
 * to replace missing Foundry types in the Simple Calendar Compatibility module.
 *
 * Only includes types actually used by the compatibility bridge.
 */

// =============================================================================
// GLOBAL FOUNDRY OBJECTS
// =============================================================================

declare global {
  const game: Game;
  const ui: UI;
  const Hooks: typeof HooksManager;
  const CONFIG: Config;
  const JournalEntry: JournalEntryStatic;
  const Folder: FolderStatic;
  const CONST: {
    DOCUMENT_OWNERSHIP_LEVELS: {
      NONE: number;
      OBSERVER: number;
      OWNER: number;
    };
  };

  // jQuery globals provided by @types/jquery

  // Console global
  const console: Console;
}

// =============================================================================
// CORE FOUNDRY VTT INTERFACES
// =============================================================================

interface Game {
  modules: Map<string, Module>;
  settings: ClientSettings;
  user?: User;
  users: Collection<User>;
  time: GameTime;
  i18n: Localization;
  journal: Collection<JournalEntry>;
  folders: Collection<any>;

  // Simple Calendar API exposure point
  simpleCalendar?: any;

  // Seasons & Stars integration point
  seasonsStars?: {
    api?: any;
    manager?: any;
    integration?: any;
    [key: string]: any; // Allow additional properties for compatibility
  };
}

interface GameTime {
  worldTime: number;
  advance(seconds: number): Promise<void>;
}

interface Localization {
  lang: string;
  localize(key: string, data?: Record<string, unknown>): string;
  format(key: string, data?: Record<string, unknown>): string;
}

interface ClientSettings {
  get(module: string, setting: string): any;
  set(module: string, setting: string, value: any): Promise<any>;
  register(module: string, setting: string, config: any): void;
}

interface User {
  id: string;
  name: string;
  isGM: boolean;
}

interface Module {
  id: string;
  title: string;
  active: boolean;
  api?: any;
  version?: string;
}

interface UI {
  notifications: Notifications;
}

interface Notifications {
  notify(message: string, type?: 'info' | 'warning' | 'error'): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

interface Config {
  debug: {
    hooks: boolean;
  };
}

// =============================================================================
// HOOKS SYSTEM
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare class HooksManager {
  static on(hook: string, callback: Function): number;
  static once(hook: string, callback: Function): number;
  static off(hook: string, id: number): void;
  static call(hook: string, ...args: any[]): boolean;
  static callAll(hook: string, ...args: any[]): void;
}

// =============================================================================
// FOUNDRY DOCUMENTS (for Journal integration)
// =============================================================================

interface JournalEntry {
  id: string;
  name: string;
  content: string;
  folder?: string;
  pages: Collection<JournalEntryPage>;
  flags?: Record<string, any>;
  ownership?: Record<string, number>;

  update(data: any): Promise<JournalEntry>;
  delete(): Promise<JournalEntry>;
  setFlag(module: string, key: string, value: any): Promise<JournalEntry>;
  getFlag(module: string, key: string): any;
  createEmbeddedDocuments(type: string, data: any[]): Promise<any[]>;
}

interface JournalEntryStatic {
  create(data: any): Promise<JournalEntry>;
}

interface FolderStatic {
  create(data: any): Promise<any>;
}

interface JournalEntryPage {
  id: string;
  name: string;
  text: {
    content: string;
  };
  type: string;
}

// =============================================================================
// WINDOW DECLARATIONS (for module API exposure)
// =============================================================================

declare global {
  interface Window {
    SimpleCalendar?: any;
    seasonsStars?: any;
  }
}

// =============================================================================
// SIMPLE CALENDAR COMPATIBILITY TYPES
// =============================================================================

// SimpleCalendarAPI interface is defined in ../types.d.ts to avoid duplication

// SimpleCalendarDate, SimpleCalendarDateInput, and SimpleCalendarConfiguration
// interfaces are defined in ../types.d.ts to avoid duplication

// SimpleCalendarMonth, SimpleCalendarWeekday, and SimpleCalendarSeason
// interfaces are defined in ../types.d.ts to avoid duplication

// =============================================================================
// SEASONS & STARS INTEGRATION TYPES
// =============================================================================

// SeasonsStarsIntegration interface is defined in ../types.d.ts to avoid duplication

// SeasonsStarsAPI, SeasonsStarsWidgets, and SeasonsStarsHooks
// interfaces are defined in ../types.d.ts to avoid duplication

// SeasonsStarsDate and SeasonsStarsDateInput interfaces are defined
// in ../types.d.ts to avoid duplication

// SeasonsStarsCalendar interface is defined in ../types.d.ts to avoid duplication

// SeasonsStarsMonth, SeasonsStarsWeekday, and SeasonsStarsSeason interfaces
// are defined in ../types.d.ts to avoid duplication

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Collection utility class used by Foundry
 */
declare class Collection<T> extends Map<string, T> {
  get(key: string): T | undefined;
  set(key: string, value: T): this;
  find(predicate: (value: T) => boolean): T | undefined;
  filter(predicate: (value: T) => boolean): T[];
  map<U>(transform: (value: T) => U): U[];
}

// =============================================================================
// PROVIDER INTERFACES
// =============================================================================

// CalendarProvider interface is defined in ../types.d.ts to avoid duplication

// =============================================================================
// MODULE DECLARATION
// =============================================================================

export {};
