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

  // Simple Calendar API exposure point
  simpleCalendar?: any;

  // Seasons & Stars integration point
  seasonsStars?: {
    manager?: any;
    integration?: any;
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

/**
 * Simple Calendar API interface for compatibility
 * These types match what modules expect from Simple Calendar
 */
interface SimpleCalendarAPI {
  timestampToDate(timestamp: number): SimpleCalendarDate;
  dateToTimestamp(date: SimpleCalendarDateInput): number;
  getCurrentDate(): SimpleCalendarDate;
  setCurrentDate(date: SimpleCalendarDateInput): Promise<boolean>;
  advanceTimeToPreset(preset: string): Promise<void>;

  // Configuration access
  getCalendars(): SimpleCalendarConfiguration[];
  getCurrentCalendar(): SimpleCalendarConfiguration | null;

  // Hook integration
  Hooks: {
    on: (hook: string, callback: Function) => number;
    off: (hook: string, id: number) => void;
  };
}

interface SimpleCalendarDate {
  year: number;
  month: number; // 0-based for compatibility
  day: number; // 0-based for compatibility
  hour: number;
  minute: number;
  second: number;
  dayOffset?: number; // Additional offset for compatibility

  // Display formatting (critical for module integration)
  display: {
    monthName: string; // Full month name
    month: string; // Month number as string
    day: string; // Day number as string
    year: string; // Year as string
    daySuffix: string; // Ordinal suffix (1st, 2nd, 3rd)
    yearPrefix: string; // Year prefix from calendar
    yearPostfix: string; // Year suffix from calendar
    date: string; // Full formatted date
    time: string; // Formatted time
    weekday: string; // Weekday name
  };

  // Additional data for compatibility
  sunrise: number;
  sunset: number;
  weekdays: string[];
  currentSeason?: {
    name: string;
    color: string;
    icon: string;
  };
}

interface SimpleCalendarDateInput {
  year?: number;
  month?: number;
  day?: number;
  hour?: number;
  minute?: number;
  second?: number;
}

interface SimpleCalendarConfiguration {
  id: string;
  name: string;
  months: SimpleCalendarMonth[];
  weekdays: SimpleCalendarWeekday[];
  year: {
    prefix: string;
    suffix: string;
    yearZero: number;
  };
  seasons?: SimpleCalendarSeason[];
}

interface SimpleCalendarMonth {
  id: string;
  name: string;
  length: number;
  isLeapMonth?: boolean;
}

interface SimpleCalendarWeekday {
  id: string;
  name: string;
  abbreviation: string;
}

interface SimpleCalendarSeason {
  id: string;
  name: string;
  color: string;
  icon: string;
  startMonth: number;
  startDay: number;
}

// =============================================================================
// SEASONS & STARS INTEGRATION TYPES
// =============================================================================

/**
 * Seasons & Stars integration interface
 * These types define how the bridge connects to S&S
 */
interface SeasonsStarsIntegration {
  detect(): SeasonsStarsIntegration | null;
  hasFeature(feature: string): boolean;
  getFeatureVersion(feature: string): string | null;

  // API access
  readonly api: SeasonsStarsAPI;
  readonly widgets: SeasonsStarsWidgets;
  readonly hooks: SeasonsStarsHooks;
}

interface SeasonsStarsAPI {
  getCurrentDate(): SeasonsStarsDate;
  setCurrentDate(date: SeasonsStarsDateInput): Promise<boolean>;
  advanceTime(amount: number, unit: string): Promise<void>;
  getActiveCalendar(): SeasonsStarsCalendar | null;
  getAvailableCalendars(): SeasonsStarsCalendar[];
  setActiveCalendar(calendarId: string): Promise<boolean>;
}

interface SeasonsStarsWidgets {
  getCalendarWidget(): any;
  getMiniWidget(): any;
  isCalendarWidgetOpen(): boolean;
  isMiniWidgetOpen(): boolean;
  toggleCalendarWidget(): Promise<void>;
  addSidebarButton(config: any): void;
}

interface SeasonsStarsHooks {
  onDateChanged(callback: (date: SeasonsStarsDate) => void): number;
  onCalendarChanged(callback: (calendar: SeasonsStarsCalendar) => void): number;
  offHook(hookId: number): void;
}

interface SeasonsStarsDate {
  year: number;
  month: number; // 1-based in S&S
  day: number; // 1-based in S&S
  hour: number;
  minute: number;
  second: number;
}

interface SeasonsStarsDateInput {
  year?: number;
  month?: number;
  day?: number;
  hour?: number;
  minute?: number;
  second?: number;
}

interface SeasonsStarsCalendar {
  id: string;
  name: string;
  description?: string;
  months: SeasonsStarsMonth[];
  weekdays: SeasonsStarsWeekday[];
  year: {
    prefix?: string;
    suffix?: string;
    yearZero?: number;
  };
  seasons?: SeasonsStarsSeason[];
}

interface SeasonsStarsMonth {
  name: string;
  length: number;
  isLeapMonth?: boolean;
}

interface SeasonsStarsWeekday {
  name: string;
  abbreviation?: string;
}

interface SeasonsStarsSeason {
  name: string;
  color?: string;
  icon?: string;
  startMonth: number;
  startDay: number;
  endMonth?: number;
  endDay?: number;
}

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

/**
 * Base provider interface for calendar integrations
 */
interface CalendarProvider {
  readonly name: string;
  readonly version: string;

  isAvailable(): boolean;
  initialize(): Promise<void>;

  // Date operations
  getCurrentDate(): SimpleCalendarDate;
  setCurrentDate(date: SimpleCalendarDateInput): Promise<boolean>;
  timestampToDate(timestamp: number): SimpleCalendarDate;
  dateToTimestamp(date: SimpleCalendarDateInput): number;

  // Calendar operations
  getActiveCalendar(): SimpleCalendarConfiguration | null;
  getAvailableCalendars(): SimpleCalendarConfiguration[];

  // Event handling
  onDateChanged(callback: (date: SimpleCalendarDate) => void): void;
  onCalendarChanged(callback: (calendar: SimpleCalendarConfiguration) => void): void;
}

// =============================================================================
// MODULE DECLARATION
// =============================================================================

export {};
