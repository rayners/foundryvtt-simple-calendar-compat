/**
 * Type definitions for Simple Calendar Compatibility Bridge
 */

// =============================================================================
// SIMPLE CALENDAR TYPES (COPIED FROM SIMPLE CALENDAR)
// =============================================================================
// The following types are copied from Simple Calendar's type definitions
// to ensure exact API compatibility. These are the actual return types
// that Simple Calendar modules expect.

/**
 * Type representing a date within Simple Calendar
 * @source Copied from Simple Calendar types/index.d.ts
 */
export interface SimpleCalendarDate {
  /** The year value of the date. */
  year: number;
  /** The month value of the date. The month is index based, meaning the first month of a year will have a value of 0. */
  month: number;
  /** The day value of the date. The day is index based, meaning the first day of the month will have a value of 0. */
  day: number;
}

/**
 * Type representing a time within Simple Calendar
 * @source Copied from Simple Calendar types/index.d.ts
 */
export interface SimpleCalendarTime {
  /** The hour value of the time. */
  hour: number;
  /** The minute value of the time. */
  minute: number;
  /** The second value of the time. */
  seconds: number;
}

/**
 * Type representing a date and time
 * @source Copied from Simple Calendar types/index.d.ts
 */
export type SimpleCalendarDateTime = SimpleCalendarDate &
  SimpleCalendarTime & {
    /** Optional display data for UI formatting (used by some modules like SmallTime) */
    display?: {
      monthName: string;
      day: string;
      year: string;
    };
  };

/**
 * Type representing a date and time with optional parameters
 * @source Copied from Simple Calendar types/index.d.ts
 */
export type SimpleCalendarDateTimeParts = Partial<SimpleCalendarDate> & Partial<SimpleCalendarTime>;

/**
 * Object containing all formatted strings for displaying a date and time
 * @source Copied from Simple Calendar types/index.d.ts
 */
export interface SimpleCalendarDateDisplayData {
  /** The formatted date string based on the configuration display option for Date Format. */
  date: string;
  /** The numerical representation of the day. */
  day: string;
  /** The Ordinal Suffix associated with the day number (st, nd, rd or th) */
  daySuffix: string;
  /** The name of the weekday this date falls on. */
  weekday: string;
  /** The name of the month. */
  monthName: string;
  /** The numerical representation of the month. */
  month: string;
  /** The numerical representation of the year */
  year: string;
  /** The name of the year, if year names have been set up. */
  yearName: string;
  /** The prefix text for the year. */
  yearPrefix: string;
  /** The postfix text for the year. */
  yearPostfix: string;
  /** The formatted time string based on the configuration display option for Time Format. */
  time: string;
}

/**
 * Interface for all information about a day
 * @source Copied from Simple Calendar types/index.d.ts
 */
export interface SimpleCalendarDayData {
  /** The ID of the day. */
  id: string;
  /** The name of the day, at the moment it is just the day number in string form. */
  name: string;
  /** The number associated with the day. */
  numericRepresentation: number;
}

/**
 * Interface for all information about a month
 * @source Copied from Simple Calendar types/index.d.ts
 */
export interface SimpleCalendarMonthData {
  /** The ID of the month. */
  id: string;
  /** The abbreviated name of the month. */
  abbreviation: string;
  /** The name of the month. */
  name: string;
  /** The description of the month. */
  description: string;
  /** The number associated with the display of this month. */
  numericRepresentation: number;
  /** The amount to offset day numbers by for this month. */
  numericRepresentationOffset: number;
  /** The number of days this month has during a non leap year. */
  numberOfDays: number;
  /** The number of days this month has during a leap year. */
  numberOfLeapYearDays: number;
  /** If this month is an intercalary month. */
  intercalary: boolean;
  /** If this month is intercalary then if its days should be included in total day calculations. */
  intercalaryInclude: boolean;
  /** The day of the week this month should always start on. */
  startingWeekday: number | null;
}

/**
 * Interface for all information about a weekday
 * @source Copied from Simple Calendar types/index.d.ts
 */
export interface SimpleCalendarWeekdayData {
  /** The ID of the weekday. */
  id: string;
  /** The abbreviated name of the weekday. */
  abbreviation: string;
  /** The name of the weekday. */
  name: string;
  /** The description of the weekday. */
  description: string;
  /** The number associated with the display of this weekday. */
  numericRepresentation: number;
  /** If this weekday is a rest day. */
  restday: boolean;
}

/**
 * Interface for all information about a season
 * @source Copied from Simple Calendar types/index.d.ts
 */
export interface SimpleCalendarSeasonData {
  /** The ID of the season. */
  id: string;
  /** The name of the season. */
  name: string;
  /** The description of the season. */
  description: string;
  /** The starting month of the season. */
  startingMonth: number;
  /** The day of the starting month this season starts on */
  startingDay: number;
  /** The time, in seconds, that the sun rises */
  sunriseTime: number;
  /** The time, in seconds, that the sun sets */
  sunsetTime: number;
  /** The color of the season */
  color: string;
  /** The icon associated with the season */
  icon: string;
}

/**
 * Interface for all information about how leap years are set up
 * @source Copied from Simple Calendar types/index.d.ts
 */

export interface SimpleCalendarLeapYearData {
  /** The ID of the leap year data. */
  id: string;
  /** This is the leap year rule to follow. */
  rule: string;
  /** The number of years that a leap year happens when the rule is set to 'custom'. */
  customMod: number;
  /** The year to start calculating leap years from. */
  startingYear: number;
}

/**
 * Interface for all information about time
 * @source Copied from Simple Calendar types/index.d.ts
 */

export interface SimpleCalendarTimeData {
  /** The ID of the time data. */
  id: string;
  /** The number of hours in a single day. */
  hoursInDay: number;
  /** The number of minutes in a single hour. */
  minutesInHour: number;
  /** The number of seconds in a single minute. */
  secondsInMinute: number;
  /** When running the clock for every second that passes in the real world how many seconds pass in game. */
  gameTimeRatio: number;
  /** If to start/stop the clock when the game is unpaused/paused. */
  unifyGameAndClockPause: boolean;
  /** How often (in real world seconds) to update the time while the clock is running. */
  updateFrequency: number;
}

/**
 * Interface for all calendar data
 * @source Copied from Simple Calendar types/index.d.ts
 */

export interface SimpleCalendarCalendarData {
  /** The ID of the calendar. */
  id: string;
  /** The name of the calendar. */
  name: string;
  /** The description of the calendar. */
  description: string;
  /** General settings for the calendar. */
  general?: any;
  /** The leap year settings for the calendar. */
  leapYear?: SimpleCalendarLeapYearData;
  /** An array of month settings for each month of the calendar. */
  months?: SimpleCalendarMonthData[];
  /** An array of season settings for each season of the calendar. */
  seasons?: SimpleCalendarSeasonData[];
  /** The time settings for the calendar. */
  time?: SimpleCalendarTimeData;
  /** An array of weekday settings for each weekday of the calendar. */
  weekdays?: SimpleCalendarWeekdayData[];
}

// =============================================================================
// BRIDGE-SPECIFIC TYPES (ORIGINAL)
// =============================================================================

// Core calendar date interface for internal bridge use
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

// Simple Calendar API interface with correct return types
export interface SimpleCalendarAPI {
  timestamp(): number;
  timestampToDate(timestamp: number): SimpleCalendarDateTime | null;
  timestampPlusInterval(timestamp: number, interval: SimpleCalendarDateTimeParts): number;
  getCurrentDate(): SimpleCalendarDateTime | null;
  currentDateTime(): SimpleCalendarDateTime | null;
  formatDateTime(
    date: SimpleCalendarDateTimeParts,
    format?: string
  ): string | { date: string; time: string };
  formatTimestamp(timestamp: number, format?: string): string | { date: string; time: string };
  dateToTimestamp(date: SimpleCalendarDateTimeParts): number;

  // Date manipulation
  changeDate(interval: SimpleCalendarDateTimeParts): boolean;
  setDate(date: SimpleCalendarDateTimeParts): boolean;
  advanceTimeToPreset(preset: string): boolean;
  chooseRandomDate(
    startDate?: SimpleCalendarDateTimeParts,
    endDate?: SimpleCalendarDateTimeParts
  ): SimpleCalendarDateTime;

  // Time advancement
  advanceDays(days: number): Promise<void>;

  // Calendar metadata
  getAllCalendars(): SimpleCalendarCalendarData[];
  getCurrentCalendar(): SimpleCalendarCalendarData | null;
  getAllMonths(): SimpleCalendarMonthData[];
  getAllWeekdays(): SimpleCalendarWeekdayData[];
  getLeapYearConfiguration(): SimpleCalendarLeapYearData | null;
  getTimeConfiguration(): SimpleCalendarTimeData | null;

  // Current date components
  getCurrentDay(): SimpleCalendarDayData | null;
  getCurrentMonth(): SimpleCalendarMonthData | null;
  getCurrentSeason(): SimpleCalendarSeasonData | null;
  getCurrentWeekday(): SimpleCalendarWeekdayData | null;
  getCurrentYear(): any;

  // Theme system
  getAllThemes(): { [themeId: string]: string };
  getCurrentTheme(): string;

  // Display formatting
  currentDateTimeDisplay(): SimpleCalendarDateDisplayData | null;

  // Utilities
  secondsToInterval(seconds: number): SimpleCalendarDateTimeParts;

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

  // Note management
  getNotesForDay(year: number, month: number, day: number): any[];
  getNotes(): any[];
  searchNotes(searchText: string, startDate?: any, endDate?: any): any[];
  addNote(
    title: string,
    content: string,
    startDate: any,
    endDate: any,
    allDay: boolean
  ): Promise<any>;
  removeNote(noteId: string): Promise<void>;

  // Clock control
  clockStatus(): { started: boolean };
  startClock(): void;
  stopClock(): void;
  pauseClock(): boolean;
  showCalendar(): void;

  // UI state
  isOpen(): boolean;
  isPrimaryGM(): boolean;

  // Calendar widget
  activateFullCalendarListeners(
    calendarId: string,
    onMonthChange?: Function,
    onDayClick?: Function
  ): void;

  // Migration
  runMigration(): void;

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

// Event interfaces
export interface DateChangeEvent {
  newDate: CalendarDate;
  oldDate: CalendarDate;
  worldTime: number;
  calendarId: string;
}

export interface CalendarChangeEvent {
  newCalendarId: string;
  oldCalendarId: string;
  calendar: any;
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
      api?: any;
      manager?: any;
      integration?: any;
      [key: string]: any; // Allow additional properties for compatibility
    };
  }
}
