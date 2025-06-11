/**
 * Type definitions for Simple Calendar Compatibility Bridge
 */

// Core calendar date interface
export interface CalendarDate {
  year: number;
  month: number; // 1-based
  day: number; // 1-based
  weekday: number;
  time?: {
    hour: number;
    minute: number;
    second: number;
  };
}

// Simple Calendar compatible date format
export interface SimpleCalendarDate {
  year: number;
  month: number; // 0-based for SC compatibility
  day: number; // 0-based for SC compatibility
  dayOfTheWeek: number;
  hour: number;
  minute: number;
  second: number;
  dayOffset: number; // Additional offset for compatibility
  sunrise: number;
  sunset: number;
  display: {
    date: string;
    time: string;
    weekday: string;
    day: string;
    monthName: string;
    month: string;
    year: string;
    daySuffix: string;
    yearPrefix: string;
    yearPostfix: string;
  };
  weekdays: string[];
  showWeekdayHeadings: boolean;
  currentSeason: {
    icon: string;
  };
}

// Provider interface that calendar modules implement
export interface CalendarProvider {
  readonly name: string;
  readonly version: string;

  // Core date methods
  getCurrentDate(): CalendarDate | null;
  worldTimeToDate(timestamp: number): CalendarDate;
  dateToWorldTime(date: CalendarDate): number;
  formatDate(date: CalendarDate, options?: any): string;

  // Calendar metadata
  getActiveCalendar(): any;
  getMonthNames(): string[];
  getWeekdayNames(): string[];

  // Time advancement (optional - for GM features)
  advanceDays?(days: number): Promise<void>;
  advanceHours?(hours: number): Promise<void>;
  advanceMinutes?(minutes: number): Promise<void>;

  // Display helpers
  getSunriseSunset?(date: CalendarDate): { sunrise: number; sunset: number };
  getSeasonInfo?(date: CalendarDate): { icon: string; name: string };
  getYearFormatting?(): { prefix: string; suffix: string };
}

// Simple Calendar API interface
export interface SimpleCalendarAPI {
  timestamp(): number;
  timestampToDate(timestamp: number): SimpleCalendarDate;
  timestampPlusInterval(timestamp: number, interval: any): number;
  getCurrentDate(): SimpleCalendarDate;
  formatDateTime(date: any, format?: string): string;
  dateToTimestamp(date: any): number;

  // Time advancement
  advanceDays(days: number): Promise<void>;

  // Legacy support
  addMonths(date: any, months: number): any;
  addYears(date: any, years: number): any;
  setTime(time: number): Promise<void>;

  // Simple Weather specific
  addSidebarButton(
    name: string,
    icon: string,
    tooltip: string,
    isToggle: boolean,
    callback: Function
  ): void;

  // Note management (basic)
  getNotesForDay(year: number, month: number, day: number): any[];
  addNote(
    title: string,
    content: string,
    startDate: any,
    endDate: any,
    allDay: boolean
  ): Promise<any>;
  removeNote(noteId: string): Promise<void>;

  // Clock control for SmallTime
  clockStatus(): { started: boolean };
  startClock(): void;
  stopClock(): void;
  showCalendar(): void;

  // Moon and season APIs
  getAllMoons(): any[];
  getAllSeasons(): any[];
}

// Hook system compatibility
export interface SimpleCalendarHooks {
  Init: string;
  DateTimeChange: string;
  ClockStartStop: string;
}

// Global extensions
declare global {
  interface Window {
    SimpleCalendar?: {
      api: SimpleCalendarAPI;
      Hooks: SimpleCalendarHooks;
    };
  }

  interface Game {
    seasonsStars?: {
      api: any;
      manager: any;
    };
  }
}
