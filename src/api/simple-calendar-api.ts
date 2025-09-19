/**
 * Simple Calendar API implementation that bridges to Seasons & Stars Integration Interface
 */

import type {
  SimpleCalendarDateTime,
  SimpleCalendarDateDisplayData,
  SimpleCalendarDayData,
  SimpleCalendarMonthData,
  SimpleCalendarWeekdayData,
  SimpleCalendarSeasonData,
  CalendarDate as BridgeCalendarDate,
  DateChangeEvent,
  CalendarChangeEvent,
} from '../types';

// Simple Calendar Icon Constants - Required by Simple Weather and other modules
export const Icons = {
  Fall: 'fall',
  Winter: 'winter',
  Spring: 'spring',
  Summer: 'summer',
};

// Import S&S Integration interface types (matching bridge-integration.ts)
interface SeasonsStarsIntegration {
  readonly isAvailable: boolean;
  readonly version: string;
  readonly api: SeasonsStarsAPI;
  readonly widgets: SeasonsStarsWidgets;
  readonly hooks: SeasonsStarsHooks;

  hasFeature(feature: string): boolean;
  getFeatureVersion(feature: string): string | null;
}

interface SeasonsStarsAPI {
  getCurrentDate(calendarId?: string): CalendarDate;
  worldTimeToDate(timestamp: number, calendarId?: string): CalendarDate;
  dateToWorldTime(date: CalendarDate, calendarId?: string): number;
  formatDate(date: CalendarDate, options?: any): string;
  getActiveCalendar(): any;
  setActiveCalendar(calendarId: string): Promise<void>;
  getAvailableCalendars(): string[];
  getMonthNames(calendarId?: string): string[];
  getWeekdayNames(calendarId?: string): string[];
  advanceDays?(days: number, calendarId?: string): Promise<void>;
  advanceHours?(hours: number, calendarId?: string): Promise<void>;
  advanceMinutes?(minutes: number, calendarId?: string): Promise<void>;
  getSunriseSunset?(date: CalendarDate, calendarId?: string): { sunrise: number; sunset: number };
  getSeasonInfo?(date: CalendarDate, calendarId?: string): { name: string; icon: string };
}

interface SeasonsStarsWidgets {
  readonly main: BridgeCalendarWidget | null;
  readonly mini: BridgeCalendarWidget | null;
  readonly grid: BridgeCalendarWidget | null;

  getPreferredWidget(preference?: WidgetPreference): BridgeCalendarWidget | null;
  onWidgetChange(callback: (widgets: SeasonsStarsWidgets) => void): void;
  offWidgetChange(callback: (widgets: SeasonsStarsWidgets) => void): void;
}

interface BridgeCalendarWidget {
  readonly id: string;
  readonly isVisible: boolean;

  addSidebarButton(name: string, icon: string, tooltip: string, callback: Function): void;
  removeSidebarButton(name: string): void;
  hasSidebarButton(name: string): boolean;
  getInstance(): any;
}

interface SeasonsStarsHooks {
  onDateChanged(callback: (event: DateChangeEvent) => void): void;
  onCalendarChanged(callback: (event: CalendarChangeEvent) => void): void;
  onReady(callback: (event: ReadyEvent) => void): void;
  off(hookName: string, callback: Function): void;
}

interface CalendarDate {
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

interface DateChangeEvent {
  newDate: CalendarDate;
  oldDate: CalendarDate;
  worldTime: number;
  calendarId: string;
}

interface CalendarChangeEvent {
  newCalendarId: string;
  oldCalendarId: string;
  calendar: any;
}

interface ReadyEvent {
  api: SeasonsStarsAPI;
  widgets: SeasonsStarsWidgets;
  version: string;
}

enum WidgetPreference {
  MAIN = 'main',
  MINI = 'mini',
  GRID = 'grid',
  ANY = 'any',
}

/**
 * Simple Calendar API Bridge implementation
 *
 * Provides 100% Simple Calendar API compatibility by bridging to Seasons & Stars
 * Integration Interface. Handles all format conversions, CSS/DOM compatibility,
 * and Simple Calendar-specific quirks while maintaining complete separation
 * from the underlying calendar system.
 *
 * @example
 * ```typescript
 * // Automatic integration with S&S
 * const api = new SimpleCalendarAPIBridge();
 *
 * // Use standard Simple Calendar API
 * const currentDate = api.getCurrentDate();
 * await api.advanceDays(1);
 * ```
 */
export class SimpleCalendarAPIBridge implements SimpleCalendarAPI {
  /** Seasons & Stars integration interface */
  private seasonsStars: SeasonsStarsIntegration | null = null;

  /** Clock running state for SmallTime integration */
  private clockRunning = false;

  /** Registry of sidebar buttons added by other modules */
  public sidebarButtons: Array<{
    name: string;
    icon: string;
    callback: Function;
    tooltip?: string;
    isToggle?: boolean;
  }> = [];

  /**
   * Initialize the Simple Calendar API bridge
   *
   * @param seasonsStarsIntegration - Optional S&S integration instance, auto-detected if not provided
   */
  constructor(seasonsStarsIntegration?: SeasonsStarsIntegration) {
    this.seasonsStars = seasonsStarsIntegration || this.detectSeasonsStars();

    if (this.seasonsStars) {
      console.log(
        `Simple Calendar API bridging to Seasons & Stars v${this.seasonsStars.version} via Integration Interface`
      );
      this.setupHookBridging();
    } else {
      console.warn(
        'Simple Calendar API Bridge: No Seasons & Stars integration available, using fallback mode'
      );
    }
  }

  /**
   * Detect Seasons & Stars integration
   */
  private detectSeasonsStars(): SeasonsStarsIntegration | null {
    try {
      // Try S&S integration interface first (v2.0+)
      const integration = (game as any).seasonsStars?.integration;
      if (integration && integration.isAvailable) {
        return integration;
      }

      // Try static detection method
      if (game.seasonsStars?.integration?.detect) {
        const detected = game.seasonsStars.integration.detect();
        if (detected && detected.isAvailable) {
          return detected;
        }
      }

      return null;
    } catch (error) {
      console.error('Failed to detect S&S integration:', error);
      return null;
    }
  }

  /**
   * Setup hook bridging to translate S&S events to Simple Calendar format
   */
  private setupHookBridging(): void {
    if (!this.seasonsStars) return;

    this.seasonsStars.hooks.onDateChanged((event: DateChangeEvent) => {
      const scDate = this.convertSSToSCFormat(event.newDate);
      Hooks.callAll('simple-calendar-date-time-change', {
        date: scDate,
        moons: this.getAllMoons(),
        seasons: this.getAllSeasons(),
      });
    });

    this.seasonsStars.hooks.onCalendarChanged((event: CalendarChangeEvent) => {
      console.log('Bridge: Calendar changed from', event.oldCalendarId, 'to', event.newCalendarId);
    });
  }

  // Core time functions

  /**
   * Get current world time timestamp
   *
   * @returns Current Foundry world time in seconds
   */
  timestamp(): number {
    return game.time?.worldTime || 0;
  }

  /**
   * Convert Foundry timestamp to Simple Calendar date format
   *
   * Critical method for Simple Weather integration. Provides complete date
   * information including formatted display properties for UI rendering.
   *
   * @param timestamp - Foundry world time in seconds
   * @returns Complete Simple Calendar date object with display formatting
   *
   * @example
   * ```typescript
   * const dateInfo = SimpleCalendar.api.timestampToDate(game.time.worldTime);
   * console.log(`Today is ${dateInfo.display.monthName} ${dateInfo.display.day}${dateInfo.display.daySuffix}`);
   * // Output: "Today is December 25th"
   * ```
   */
  timestampToDate(timestamp: number): SimpleCalendarDateTime | null {
    try {
      if (!this.seasonsStars?.api) {
        return this.createFallbackDateTime(timestamp);
      }

      // Use S&S API to convert timestamp to date
      const ssDate = this.seasonsStars.api.worldTimeToDate(timestamp);

      // Convert S&S date format to Simple Calendar DateTime format
      return this.convertSSToSCDateTime(ssDate);
    } catch (error) {
      console.error('🌉 Failed to convert timestamp to Simple Calendar date:', error);
      return this.createFallbackDateTime(timestamp);
    }
  }

  /**
   * Convert S&S CalendarDate format to Simple Calendar format
   */
  private convertSSToSCFormat(ssDate: BridgeCalendarDate): SimpleCalendarDateTime {
    return {
      year: ssDate.year,
      month: ssDate.month - 1, // Convert 1-based to 0-based for SC compatibility
      day: ssDate.day - 1, // Convert 1-based to 0-based for SC compatibility
      hour: ssDate.time?.hour || 0,
      minute: ssDate.time?.minute || 0,
      seconds: ssDate.time?.second || 0, // Note: 'seconds' not 'second'
    };
  }

  timestampPlusInterval(timestamp: number, interval: any): number {
    if (!interval) return timestamp;

    try {
      if (!this.seasonsStars?.api) {
        // Fallback to simple arithmetic when S&S not available
        let newTimestamp = timestamp;

        if (interval.year) newTimestamp += interval.year * 365 * 86400;
        if (interval.month) newTimestamp += interval.month * 30 * 86400;
        if (interval.day) newTimestamp += interval.day * 86400;
        if (interval.hour) newTimestamp += interval.hour * 3600;
        if (interval.minute) newTimestamp += interval.minute * 60;
        if (interval.second) newTimestamp += interval.second;

        return newTimestamp;
      }

      // Use S&S API for proper calendar-aware interval calculation
      const currentDate = this.seasonsStars.api.worldTimeToDate(timestamp);
      let newTimestamp = timestamp;

      // For complex intervals, convert to date, modify, and convert back
      if (interval.year || interval.month) {
        const modifiedDate = { ...currentDate };
        if (interval.year) modifiedDate.year += interval.year;
        if (interval.month) {
          modifiedDate.month += interval.month;
          // Handle month overflow
          while (modifiedDate.month > 12) {
            modifiedDate.month -= 12;
            modifiedDate.year += 1;
          }
          while (modifiedDate.month < 1) {
            modifiedDate.month += 12;
            modifiedDate.year -= 1;
          }
        }
        newTimestamp = this.seasonsStars.api.dateToWorldTime(modifiedDate);
      }

      // Apply time-based intervals directly to timestamp
      if (interval.day) newTimestamp += interval.day * 86400;
      if (interval.hour) newTimestamp += interval.hour * 3600;
      if (interval.minute) newTimestamp += interval.minute * 60;
      if (interval.second) newTimestamp += interval.second;

      return newTimestamp;
    } catch (error) {
      console.warn('Failed to add interval to timestamp:', error);
      return timestamp;
    }
  }

  getCurrentDate(): SimpleCalendarDateTime | null {
    try {
      if (!this.seasonsStars?.api) {
        const currentTimestamp = this.timestamp();
        return this.createFallbackDateTime(currentTimestamp);
      }

      // Use S&S API to get current date
      const ssDate = this.seasonsStars.api.getCurrentDate();
      return this.convertSSToSCDateTime(ssDate);
    } catch (error) {
      console.error('Failed to get current date:', error);
      const currentTimestamp = this.timestamp();
      return this.createFallbackDateTime(currentTimestamp);
    }
  }

  /**
   * Get current date and time (alias for getCurrentDate)
   *
   * This method provides compatibility with modules that expect currentDateTime()
   * instead of getCurrentDate(). Both methods return identical results.
   *
   * @returns Current date and time in Simple Calendar format
   */
  currentDateTime(): SimpleCalendarDateTime | null {
    return this.getCurrentDate();
  }

  /**
   * Change the current date by adding an interval
   */
  changeDate(interval: any): boolean {
    try {
      if (!game.user?.isGM) {
        console.warn('Only GMs can change the date');
        return false;
      }

      if (!this.seasonsStars?.api) {
        console.warn('Cannot change date: Seasons & Stars not available');
        return false;
      }

      // Use S&S time advancement methods for proper calendar handling
      if (interval.year && (this.seasonsStars.api as any).advanceYears) {
        (this.seasonsStars.api as any).advanceYears(interval.year);
      }
      if (interval.month && (this.seasonsStars.api as any).advanceMonths) {
        (this.seasonsStars.api as any).advanceMonths(interval.month);
      }
      if (interval.week && (this.seasonsStars.api as any).advanceWeeks) {
        (this.seasonsStars.api as any).advanceWeeks(interval.week);
      }
      if (interval.day && this.seasonsStars.api.advanceDays) {
        this.seasonsStars.api.advanceDays(interval.day);
      }
      if (interval.hour && this.seasonsStars.api.advanceHours) {
        this.seasonsStars.api.advanceHours(interval.hour);
      }
      if (interval.minute && this.seasonsStars.api.advanceMinutes) {
        this.seasonsStars.api.advanceMinutes(interval.minute);
      }

      return true;
    } catch (error) {
      console.error('Failed to change date:', error);
      return false;
    }
  }

  /**
   * Set the current date to a specific date
   */
  setDate(date: any): boolean {
    try {
      if (!game.user?.isGM) {
        console.warn('Only GMs can set the date');
        return false;
      }

      if (!this.seasonsStars?.api) {
        console.warn('Cannot set date: Seasons & Stars not available');
        return false;
      }

      // Convert Simple Calendar format to S&S format and set via world time
      const ssDate = this.convertSCToSSFormat(date);
      const targetTimestamp = this.seasonsStars.api.dateToWorldTime(ssDate);
      const currentTimestamp = this.timestamp();
      const timeDiff = targetTimestamp - currentTimestamp;

      if (Math.abs(timeDiff) < 1) {
        return true; // Already at target time
      }

      // Use Foundry's time advancement to set the exact timestamp
      game.time?.advance(timeDiff);
      return true;
    } catch (error) {
      console.error('Failed to set date:', error);
      return false;
    }
  }

  /**
   * Advance time to a preset position (dawn, dusk, etc.)
   * Uses calendar-specific canonical hours if available
   */
  advanceTimeToPreset(preset: string): boolean {
    try {
      if (!game.user?.isGM) {
        console.warn('Only GMs can advance time');
        return false;
      }

      if (!this.seasonsStars?.api) {
        console.warn('Cannot advance time: Seasons & Stars not available');
        return false;
      }

      const calendar = this.seasonsStars.api.getActiveCalendar();
      const currentDate = this.getCurrentDate();
      let targetHour = 0;

      // Check if calendar has canonical hours defined
      if (calendar?.canonicalHours) {
        const canonicalHour = calendar.canonicalHours.find(
          (ch: any) => ch.name.toLowerCase() === preset.toLowerCase()
        );
        if (canonicalHour) {
          targetHour = canonicalHour.hour;
        } else {
          console.warn(`Preset "${preset}" not found in calendar canonical hours`);
          return false;
        }
      } else {
        // Fallback to common presets, but use calendar's hours per day
        const hoursInDay = calendar?.time?.hoursInDay || 24;

        switch (preset.toLowerCase()) {
          case 'dawn':
          case 'sunrise':
            targetHour = Math.floor(hoursInDay * 0.25); // 1/4 through day
            break;
          case 'midday':
          case 'noon':
            targetHour = Math.floor(hoursInDay * 0.5); // Middle of day
            break;
          case 'dusk':
          case 'sunset':
            targetHour = Math.floor(hoursInDay * 0.75); // 3/4 through day
            break;
          case 'midnight':
            targetHour = 0;
            break;
          default:
            console.warn(`Unknown preset: ${preset}`);
            return false;
        }
      }

      // Create target date with same day but different hour
      const targetDate = {
        ...currentDate,
        hour: targetHour,
        minute: 0,
        second: 0,
      };

      return this.setDate(targetDate);
    } catch (error) {
      console.error('Failed to advance time to preset:', error);
      return false;
    }
  }

  /**
   * Choose a random date between start and end dates
   * Uses calendar-specific month/day ranges
   */
  chooseRandomDate(startDate?: any, endDate?: any): any {
    try {
      if (!this.seasonsStars?.api) {
        console.warn('Cannot choose random date: Seasons & Stars not available');
        return this.getCurrentDate();
      }

      const calendar = this.seasonsStars.api.getActiveCalendar();
      const currentDate = this.getCurrentDate();

      // Default to current year range if no dates provided
      let start = startDate;
      let end = endDate;

      if (!start) {
        start = {
          ...currentDate,
          month: 0, // First month (0-based for SC compatibility)
          day: 0, // First day (0-based for SC compatibility)
        };
      }

      if (!end) {
        const monthCount = calendar?.months?.length || 12;
        const lastMonth = calendar?.months?.[monthCount - 1];
        const lastDayOfYear = lastMonth?.length || 30;

        end = {
          ...currentDate,
          month: monthCount - 1, // Last month (0-based)
          day: lastDayOfYear - 1, // Last day (0-based)
        };
      }

      const startTimestamp = this.dateToTimestamp(start);
      const endTimestamp = this.dateToTimestamp(end);

      const randomTimestamp = startTimestamp + Math.random() * (endTimestamp - startTimestamp);

      return this.timestampToDate(randomTimestamp);
    } catch (error) {
      console.error('Failed to choose random date:', error);
      return this.getCurrentDate();
    }
  }

  formatDateTime(date: any, format?: string): string | { date: string; time: string } {
    try {
      if (!this.seasonsStars?.api) {
        return format ? '' : { date: '', time: '' };
      }

      // Convert Simple Calendar format back to S&S CalendarDate format
      const ssDate = this.convertSCToSSFormat(date);

      if (format) {
        // When format is provided, return formatted string
        return this.seasonsStars.api.formatDate(ssDate, { format });
      } else {
        // When no format provided, return object with separate date and time
        const dateString = this.seasonsStars.api.formatDate(ssDate, { includeTime: false });
        const timeString = this.seasonsStars.api.formatDate(ssDate, { timeOnly: true });

        return {
          date: dateString,
          time: timeString,
        };
      }
    } catch (error) {
      console.warn('Failed to format date:', error);
      return format ? '' : { date: '', time: '' };
    }
  }

  dateToTimestamp(date: any): number {
    try {
      if (!this.seasonsStars?.api) {
        return 0;
      }

      // Convert Simple Calendar format to S&S CalendarDate format
      const ssDate = this.convertSCToSSFormat(date);

      // Use S&S API to convert date to timestamp
      return this.seasonsStars.api.dateToWorldTime(ssDate);
    } catch (error) {
      console.warn('Failed to convert date to timestamp:', error);
      return 0;
    }
  }

  /**
   * Convert Simple Calendar format to S&S CalendarDate format
   * CRITICAL: Simple Calendar uses 0-based months/days, S&S uses 1-based
   */
  private convertSCToSSFormat(scDate: any): BridgeCalendarDate {
    return {
      year: scDate.year,
      month: (scDate.month || 0) + 1, // Convert 0-based to 1-based
      day: (scDate.day || 0) + 1, // Convert 0-based to 1-based
      weekday: scDate.dayOfTheWeek || scDate.weekday || 0, // Already 0-based, no conversion needed
      time: {
        hour: scDate.hour || 0,
        minute: scDate.minute || 0,
        second: scDate.second || scDate.seconds || 0,
      },
    };
  }

  // Time advancement methods
  async advanceDays(days: number): Promise<void> {
    if (!this.seasonsStars?.api?.advanceDays) {
      throw new Error('Time advancement not supported by Seasons & Stars');
    }

    await this.seasonsStars.api.advanceDays(days);
  }

  async advanceHours(hours: number): Promise<void> {
    if (!this.seasonsStars?.api?.advanceHours) {
      throw new Error('Hour advancement not supported by Seasons & Stars');
    }

    await this.seasonsStars.api.advanceHours(hours);
  }

  async advanceMinutes(minutes: number): Promise<void> {
    if (!this.seasonsStars?.api?.advanceMinutes) {
      throw new Error('Minute advancement not supported by Seasons & Stars');
    }

    await this.seasonsStars.api.advanceMinutes(minutes);
  }

  // Calendar metadata functions

  /**
   * Get all available calendars
   */
  getAllCalendars(): any[] {
    try {
      if (!this.seasonsStars?.api) {
        return [];
      }

      const activeCalendar = this.seasonsStars.api.getActiveCalendar();
      const availableIds = this.seasonsStars.api.getAvailableCalendars();

      // Convert to Simple Calendar format
      return availableIds.map(id => ({
        id: id,
        name: id === activeCalendar?.id ? activeCalendar.name || id : id,
        description: id === activeCalendar?.id ? activeCalendar.description || '' : '',
        active: id === activeCalendar?.id,
      }));
    } catch (error) {
      console.error('Failed to get all calendars:', error);
      return [];
    }
  }

  /**
   * Get the currently active calendar
   */
  getCurrentCalendar(): any {
    try {
      if (!this.seasonsStars?.api) {
        return null;
      }

      const calendar = this.seasonsStars.api.getActiveCalendar();
      if (!calendar) {
        return null;
      }

      // Convert to Simple Calendar format
      return {
        id: calendar.id,
        name: calendar.name || calendar.id,
        description: calendar.description || '',
        months: calendar.months || [],
        weekdays: calendar.weekdays || [],
        year: calendar.year || { prefix: '', suffix: '', epoch: 0 },
        time: calendar.time || { hoursInDay: 24, minutesInHour: 60, secondsInMinute: 60 },
        seasons: calendar.seasons || [],
        moons: calendar.moons || [],
        leapYear: calendar.leapYear || { rule: 'none' },
      };
    } catch (error) {
      console.error('Failed to get current calendar:', error);
      return null;
    }
  }

  /**
   * Get all months for the current calendar
   */
  getAllMonths(): SimpleCalendarMonthData[] {
    try {
      if (!this.seasonsStars?.api) {
        return [];
      }

      const calendar = this.seasonsStars.api.getActiveCalendar();
      const monthNames = this.seasonsStars.api.getMonthNames();

      // Convert to Simple Calendar format
      return (calendar?.months || []).map((month: any, index: number) => {
        const monthName = monthNames?.[index] || month.name || `Month ${index + 1}`;
        return {
          id: `month-${index}`,
          abbreviation: month.abbreviation || monthName.substring(0, 3),
          name: monthName,
          description: month.description || '',
          numericRepresentation: index + 1, // 1-based for Simple Calendar
          numericRepresentationOffset: 0,
          numberOfDays: month.length || 30,
          numberOfLeapYearDays: month.leapLength || month.length || 30,
          intercalary: month.intercalary || false,
          intercalaryInclude: month.intercalaryInclude ?? true,
          startingWeekday: month.startingWeekday || null,
        };
      });
    } catch (error) {
      console.error('Failed to get all months:', error);
      return [];
    }
  }

  /**
   * Get all weekdays for the current calendar
   */
  getAllWeekdays(): SimpleCalendarWeekdayData[] {
    try {
      if (!this.seasonsStars?.api) {
        return [];
      }

      const calendar = this.seasonsStars.api.getActiveCalendar();
      const weekdayNames = this.seasonsStars.api.getWeekdayNames();

      // Convert to Simple Calendar format
      return (calendar?.weekdays || []).map((weekday: any, index: number) => {
        const weekdayName = weekdayNames?.[index] || weekday.name || `Day ${index + 1}`;
        return {
          id: `weekday-${index}`,
          abbreviation: weekday.abbreviation || weekdayName.substring(0, 3),
          name: weekdayName,
          description: weekday.description || '',
          numericRepresentation: index, // 0-based for Simple Calendar weekdays
          restday: weekday.restday || false,
        };
      });
    } catch (error) {
      console.error('Failed to get all weekdays:', error);
      return [];
    }
  }

  /**
   * Get leap year configuration for the current calendar
   */
  getLeapYearConfiguration(): any {
    try {
      if (!this.seasonsStars?.api) {
        return null;
      }

      const calendar = this.seasonsStars.api.getActiveCalendar();
      return calendar?.leapYear || { rule: 'none' };
    } catch (error) {
      console.error('Failed to get leap year configuration:', error);
      return null;
    }
  }

  /**
   * Get time configuration for the current calendar
   */
  getTimeConfiguration(): any {
    try {
      if (!this.seasonsStars?.api) {
        return null;
      }

      const calendar = this.seasonsStars.api.getActiveCalendar();
      return calendar?.time || { hoursInDay: 24, minutesInHour: 60, secondsInMinute: 60 };
    } catch (error) {
      console.error('Failed to get time configuration:', error);
      return null;
    }
  }

  // Current date component getters

  /**
   * Get current day information
   */
  getCurrentDay(): SimpleCalendarDayData | null {
    try {
      if (!this.seasonsStars?.api) {
        return null;
      }

      const currentDate = this.getCurrentDate();
      if (!currentDate) return null;

      // currentDate.day is 0-based from Simple Calendar format
      const dayNumber = currentDate.day + 1; // Convert to 1-based

      return {
        id: `day-${currentDate.day}`,
        name: dayNumber.toString(),
        numericRepresentation: dayNumber,
      };
    } catch (error) {
      console.error('Failed to get current day:', error);
      return null;
    }
  }

  /**
   * Get current month information
   */
  getCurrentMonth(): SimpleCalendarMonthData | null {
    try {
      if (!this.seasonsStars?.api) {
        return null;
      }

      const currentDate = this.getCurrentDate();
      if (!currentDate) return null;

      const calendar = this.seasonsStars.api.getActiveCalendar();
      const monthNames = this.seasonsStars.api.getMonthNames();

      // Get month data using 0-based index for calendar.months but 1-based month from currentDate
      const monthIndex = currentDate.month; // currentDate.month is 0-based from Simple Calendar format
      const monthData = calendar?.months?.[monthIndex] || {};
      const monthName = monthNames?.[monthIndex] || monthData.name || `Month ${monthIndex + 1}`;

      return {
        id: `month-${monthIndex}`,
        abbreviation: monthData.abbreviation || monthName.substring(0, 3),
        name: monthName,
        description: monthData.description || '',
        numericRepresentation: monthIndex + 1, // 1-based for Simple Calendar
        numericRepresentationOffset: 0,
        numberOfDays: monthData.length || 30,
        numberOfLeapYearDays: monthData.leapLength || monthData.length || 30,
        intercalary: monthData.intercalary || false,
        intercalaryInclude: monthData.intercalaryInclude ?? true,
        startingWeekday: monthData.startingWeekday || null,
      };
    } catch (error) {
      console.error('Failed to get current month:', error);
      return null;
    }
  }

  /**
   * Get current season information
   */
  getCurrentSeason(): SimpleCalendarSeasonData | null {
    try {
      if (!this.seasonsStars?.api) {
        return null;
      }

      const ssDate = this.seasonsStars.api.getCurrentDate();
      if (!ssDate) return null;

      const seasonInfo = this.seasonsStars.api.getSeasonInfo?.(ssDate);
      if (!seasonInfo) return null;

      // Create Simple Calendar season data structure
      return {
        id: `season-${seasonInfo.name?.toLowerCase().replace(/\s+/g, '-') || 'unknown'}`,
        name: seasonInfo.name || 'Unknown',
        description: (seasonInfo as any).description || '',
        startingMonth: 0, // S&S doesn't expose this detail yet
        startingDay: 0, // S&S doesn't expose this detail yet
        sunriseTime: (seasonInfo as any).sunriseTime || 21600, // 6 AM default
        sunsetTime: (seasonInfo as any).sunsetTime || 64800, // 6 PM default
        color: (seasonInfo as any).color || '#ffffff',
        icon: seasonInfo.icon || 'none',
      };
    } catch (error) {
      console.error('Failed to get current season:', error);
      return null;
    }
  }

  /**
   * Get current weekday information
   */
  getCurrentWeekday(): SimpleCalendarWeekdayData | null {
    try {
      if (!this.seasonsStars?.api) {
        return null;
      }

      // Get the current date from S&S directly (which includes weekday)
      const ssDate = this.seasonsStars.api.getCurrentDate();
      if (!ssDate) return null;

      const calendar = this.seasonsStars.api.getActiveCalendar();
      const weekdayNames = this.seasonsStars.api.getWeekdayNames();

      // ssDate.weekday is 0-based in S&S
      const weekdayIndex = ssDate.weekday;
      const weekdayData = calendar?.weekdays?.[weekdayIndex] || {};
      const weekdayName =
        weekdayNames?.[weekdayIndex] || weekdayData.name || `Day ${weekdayIndex + 1}`;

      return {
        id: `weekday-${weekdayIndex}`,
        abbreviation: weekdayData.abbreviation || weekdayName.substring(0, 3),
        name: weekdayName,
        description: weekdayData.description || '',
        numericRepresentation: weekdayIndex, // 0-based for Simple Calendar weekdays
        restday: weekdayData.restday || false,
      };
    } catch (error) {
      console.error('Failed to get current weekday:', error);
      return null;
    }
  }

  /**
   * Get current year information
   */
  getCurrentYear(): any {
    try {
      if (!this.seasonsStars?.api) {
        return null;
      }

      const currentDate = this.getCurrentDate();
      if (!currentDate) return null;

      const calendar = this.seasonsStars.api.getActiveCalendar();
      const yearConfig = calendar?.year || {};

      return {
        number: currentDate.year,
        name: `${yearConfig.prefix || ''}${currentDate.year}${yearConfig.suffix || ''}`,
        prefix: yearConfig.prefix || '',
        suffix: yearConfig.suffix || '',
        epochYear: yearConfig.epoch || 0,
        selected: true,
        isCurrentYear: true,
      };
    } catch (error) {
      console.error('Failed to get current year:', error);
      return null;
    }
  }

  // Formatting and utility functions

  /**
   * Format timestamp with optional format string
   */
  formatTimestamp(timestamp: number, format: string = ''): string | { date: string; time: string } {
    try {
      if (!this.seasonsStars?.api) {
        const date = new Date(timestamp * 1000);
        return {
          date: date.toLocaleDateString(),
          time: date.toLocaleTimeString(),
        };
      }

      const dateObj = this.timestampToDate(timestamp);
      if (!dateObj) {
        return { date: 'Unknown', time: 'Unknown' };
      }

      const ssDate = this.convertSCToSSFormat(dateObj);
      const formattedDate = this.seasonsStars.api.formatDate(ssDate, { includeTime: false });
      const formattedTime = this.seasonsStars.api.formatDate(ssDate, { timeOnly: true });

      if (!format) {
        // Return both date and time components
        return {
          date: formattedDate,
          time: formattedTime,
        };
      }

      // Use S&S formatting if format string provided
      return this.seasonsStars.api.formatDate(ssDate);
    } catch (error) {
      console.error('Failed to format timestamp:', error);
      return { date: 'Unknown', time: 'Unknown' };
    }
  }

  /**
   * Get current date and time display information
   */
  currentDateTimeDisplay(): SimpleCalendarDateDisplayData | null {
    try {
      if (!this.seasonsStars?.api) {
        return {
          date: 'Unknown',
          day: '1',
          daySuffix: 'st',
          weekday: 'Unknown',
          monthName: 'Unknown',
          month: '1',
          year: '2023',
          yearName: '',
          yearPrefix: '',
          yearPostfix: '',
          time: '00:00:00',
        };
      }

      const ssDate = this.seasonsStars.api.getCurrentDate();
      if (!ssDate) return null;

      // Get calendar metadata
      const activeCalendar = this.seasonsStars.api.getActiveCalendar();
      const monthNames = this.seasonsStars.api.getMonthNames();
      const weekdayNames = this.seasonsStars.api.getWeekdayNames();

      const safeMonthName = (monthNames && monthNames[ssDate.month - 1]) || `Month ${ssDate.month}`;
      const safeWeekdayName =
        (weekdayNames && weekdayNames[ssDate.weekday]) || `Day ${ssDate.weekday + 1}`;

      // Format date and time using S&S
      const formattedDate = this.seasonsStars.api.formatDate(ssDate, { includeTime: false });
      const formattedTime = this.seasonsStars.api.formatDate(ssDate, { timeOnly: true });

      // Get year formatting
      const yearPrefix = activeCalendar?.year?.prefix || '';
      const yearSuffix = activeCalendar?.year?.suffix || '';

      return {
        date: formattedDate,
        day: ssDate.day.toString(),
        daySuffix: this.getOrdinalSuffix(ssDate.day),
        weekday: safeWeekdayName,
        monthName: safeMonthName,
        month: ssDate.month.toString(),
        year: ssDate.year.toString(),
        yearName: '', // S&S doesn't expose year names yet
        yearPrefix: yearPrefix,
        yearPostfix: yearSuffix,
        time: formattedTime,
      };
    } catch (error) {
      console.error('Failed to get current date time display:', error);
      return {
        date: 'Unknown',
        day: '1',
        daySuffix: 'st',
        weekday: 'Unknown',
        monthName: 'Unknown',
        month: '1',
        year: '2023',
        yearName: '',
        yearPrefix: '',
        yearPostfix: '',
        time: '00:00:00',
      };
    }
  }

  /**
   * Convert seconds to interval object
   */
  secondsToInterval(seconds: number): any {
    try {
      if (!this.seasonsStars?.api) {
        // Fallback calculation using standard units
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;

        return { day: days, hour: hours, minute: minutes, second: remainingSeconds };
      }

      const calendar = this.seasonsStars.api.getActiveCalendar();
      const timeConfig = calendar?.time || {
        hoursInDay: 24,
        minutesInHour: 60,
        secondsInMinute: 60,
      };

      // Use calendar-specific time units
      const secondsInMinute = timeConfig.secondsInMinute;
      const minutesInHour = timeConfig.minutesInHour;
      const hoursInDay = timeConfig.hoursInDay;

      const secondsInHour = secondsInMinute * minutesInHour;
      const secondsInDay = secondsInHour * hoursInDay;

      const days = Math.floor(seconds / secondsInDay);
      const hours = Math.floor((seconds % secondsInDay) / secondsInHour);
      const minutes = Math.floor((seconds % secondsInHour) / secondsInMinute);
      const remainingSeconds = seconds % secondsInMinute;

      return {
        day: days,
        hour: hours,
        minute: minutes,
        second: remainingSeconds,
      };
    } catch (error) {
      console.error('Failed to convert seconds to interval:', error);
      return { day: 0, hour: 0, minute: 0, second: seconds };
    }
  }

  // Theme system functions

  /**
   * Get all available themes
   */
  getAllThemes(): { [themeId: string]: string } {
    return {
      default: 'Default Theme',
    };
  }

  /**
   * Get current theme (returns default)
   */
  getCurrentTheme(): string {
    return 'default';
  }

  // Legacy support methods
  addMonths(date: any, months: number): any {
    const timestamp = this.dateToTimestamp(date);
    const newTimestamp = this.timestampPlusInterval(timestamp, { month: months });
    return this.timestampToDate(newTimestamp);
  }

  addYears(date: any, years: number): any {
    const timestamp = this.dateToTimestamp(date);
    const newTimestamp = this.timestampPlusInterval(timestamp, { year: years });
    return this.timestampToDate(newTimestamp);
  }

  async setTime(time: number): Promise<void> {
    if (game.user?.isGM) {
      const currentTime = game.time?.worldTime || 0;
      await game.time?.advance(time - currentTime);
    } else {
      throw new Error('Only GMs can set world time');
    }
  }

  // Simple Weather specific APIs

  /**
   * Add sidebar button to calendar widgets
   *
   * Primary integration point for Simple Weather module. Adds buttons to all
   * available S&S calendar widgets (mini, main, grid) with fallback to DOM
   * manipulation when S&S APIs are unavailable.
   *
   * @param name - Unique button identifier
   * @param icon - FontAwesome icon class (e.g., 'fas fa-cloud')
   * @param tooltip - Button tooltip text
   * @param isToggle - Whether button should toggle (legacy parameter, not used)
   * @param callback - Function to call when button is clicked
   *
   * @example
   * ```typescript
   * SimpleCalendar.api.addSidebarButton(
   *   'weather',
   *   'fas fa-cloud',
   *   'Toggle Weather Display',
   *   false,
   *   () => toggleWeatherPanel()
   * );
   * ```
   */
  addSidebarButton(
    name: string,
    icon: string,
    tooltip: string,
    isToggle: boolean,
    callback: Function
  ): void {
    console.log(`🌉 Simple Calendar Bridge: addSidebarButton called with:`, {
      name,
      icon,
      tooltip,
      isToggle,
      callbackType: typeof callback,
    });

    this.sidebarButtons.push({ name, icon, callback, tooltip, isToggle });
    console.log(
      `Simple Calendar Bridge: Sidebar button "${name}" registered (tooltip: ${tooltip}, toggle: ${isToggle})`
    );

    // Add the button to existing Seasons & Stars widgets using S&S API
    this.addButtonToWidgets(name, icon, tooltip, callback);
  }

  /**
   * Add a button to existing Seasons & Stars widgets using S&S Integration API
   */
  private addButtonToWidgets(
    name: string,
    icon: string,
    tooltip: string,
    callback: Function
  ): void {
    console.log(`🌟 Adding weather button "${name}" to S&S widgets via Integration API`);

    if (!this.seasonsStars?.widgets) {
      console.warn('🌟 S&S widgets interface not available, falling back to DOM manipulation');
      this.addButtonToWidgetsViaDOM(name, icon, tooltip, callback);
      return;
    }

    try {
      // Try to add button to mini widget first (preferred for Simple Weather)
      const miniWidget = this.seasonsStars.widgets.mini;
      if (miniWidget) {
        // Ensure Simple Calendar compatibility DOM structure first
        this.addSimpleCalendarCompatibility(miniWidget);

        // Check if button already exists to avoid duplicates
        if (!miniWidget.hasSidebarButton(name)) {
          miniWidget.addSidebarButton(name, icon, tooltip, callback);
          console.log(`🌟 Successfully added "${name}" button to mini widget via S&S API`);
        } else {
          console.log(`🌟 Button "${name}" already exists on mini widget`);
        }
      }

      // Also try main widget for consistency
      const mainWidget = this.seasonsStars.widgets.main;
      if (mainWidget) {
        // Ensure Simple Calendar compatibility DOM structure first
        this.addSimpleCalendarCompatibility(mainWidget);

        if (!mainWidget.hasSidebarButton(name)) {
          mainWidget.addSidebarButton(name, icon, tooltip, callback);
          console.log(`🌟 Successfully added "${name}" button to main widget via S&S API`);
        } else {
          console.log(`🌟 Button "${name}" already exists on main widget`);
        }
      }

      // Also try grid widget if available
      const gridWidget = this.seasonsStars.widgets.grid;
      if (gridWidget) {
        // Ensure Simple Calendar compatibility DOM structure first
        this.addSimpleCalendarCompatibility(gridWidget);

        if (!gridWidget.hasSidebarButton(name)) {
          gridWidget.addSidebarButton(name, icon, tooltip, callback);
          console.log(`🌟 Successfully added "${name}" button to grid widget via S&S API`);
        } else {
          console.log(`🌟 Button "${name}" already exists on grid widget`);
        }
      }

      if (!miniWidget && !mainWidget && !gridWidget) {
        console.warn('🌟 No S&S widgets available, falling back to DOM manipulation');
        this.addButtonToWidgetsViaDOM(name, icon, tooltip, callback);
      }
    } catch (error) {
      console.error(`🌟 Failed to add button via S&S API:`, error);
      console.log(`🌟 Falling back to DOM manipulation for button "${name}"`);
      this.addButtonToWidgetsViaDOM(name, icon, tooltip, callback);
    }
  }

  /**
   * Add Simple Calendar compatibility DOM structure and CSS classes to S&S widgets
   * This ensures Simple Weather and other SC-dependent modules can find required elements
   */
  private addSimpleCalendarCompatibility(widget: BridgeCalendarWidget): void {
    try {
      const widgetInstance = widget.getInstance();
      if (!widgetInstance?.element) {
        console.warn('🌉 Cannot add SC compatibility: widget element not available');
        return;
      }

      const $widget = $(widgetInstance.element);

      // Check if already processed to avoid duplicate work
      if ($widget.hasClass('simple-calendar-compat-processed')) {
        return;
      }

      console.log('🌉 Adding Simple Calendar compatibility DOM structure to widget');

      // Add required Simple Calendar CSS classes and ID
      $widget.attr('id', 'fsc-if');
      $widget.addClass('fsc-if simple-calendar-compat-processed');

      // Ensure .window-content wrapper exists (required for Simple Weather)
      let $windowContent = $widget.find('.window-content');
      if (!$windowContent.length) {
        // Wrap existing content in window-content div
        $widget.wrapInner('<div class="window-content"></div>');
        $windowContent = $widget.find('.window-content');
      }

      // Add Simple Calendar tab structure required for Simple Weather positioning
      let $tabWrapper = $windowContent.find('.fsc-of');
      if (!$tabWrapper.length) {
        $tabWrapper = $(`
          <div class="fsc-of fsc-d" style="display: none; flex-direction: column; position: relative;">
            <!-- Simple Weather positioning anchor - ensures proper attachment -->
            <div class="sc-right" style="margin-left: auto; position: relative;">
              <!-- Container for Simple Weather attached mode -->
              <div id="swr-fsc-container" style="position: relative; z-index: 100; max-width: 300px; margin-top: 8px;">
                <!-- Simple Weather will inject its content here -->
              </div>
            </div>
          </div>
        `);
        $windowContent.append($tabWrapper);
      }

      // Add extended tab state toggle function (required by Simple Weather)
      if (!$widget.data('sc-toggle-attached')) {
        $widget.data('sc-toggle-attached', true);

        // Add global function for Simple Weather to toggle tab state
        (window as any).toggleExtendedCalendar = function () {
          const $tabPanel = $widget.find('.fsc-of');
          if ($tabPanel.hasClass('fsc-d')) {
            // Open tab
            $tabPanel.removeClass('fsc-d').addClass('fsc-c');
            $tabPanel.css('display', 'flex');
            console.log('🌉 Simple Calendar compatibility: Extended calendar opened');
          } else {
            // Close tab
            $tabPanel.removeClass('fsc-c').addClass('fsc-d');
            $tabPanel.css('display', 'none');
            console.log('🌉 Simple Calendar compatibility: Extended calendar closed');
          }
        };
      }

      console.log('🌉 Simple Calendar compatibility DOM structure added successfully');
    } catch (error) {
      console.error('🌉 Failed to add Simple Calendar compatibility:', error);
    }
  }

  /**
   * Fallback method: Add button via DOM manipulation (may be cleared on re-render)
   */
  private addButtonToWidgetsViaDOM(
    name: string,
    icon: string,
    tooltip: string,
    callback: Function
  ): void {
    // Find all calendar widgets
    const calendarWidgets = document.querySelectorAll('.calendar-widget, .calendar-mini-widget');
    console.log(`🌟 Found ${calendarWidgets.length} calendar widgets for DOM manipulation`);

    calendarWidgets.forEach(widget => {
      const $widget = $(widget);
      const buttonId = `simple-weather-button-${name.toLowerCase().replace(/\s+/g, '-')}`;

      console.log(`🌟 Processing widget via DOM:`, widget.className);

      // Add Simple Calendar compatibility DOM structure for fallback mode
      this.addSimpleCalendarCompatibilityViaDOM($widget);

      // Don't add if already exists
      if ($widget.find(`#${buttonId}`).length > 0) {
        console.log(`🌟 Button already exists on widget`);
        return;
      }

      // For calendar widgets, look for the header controls area
      let $targetLocation;

      if ($widget.hasClass('calendar-widget')) {
        // For full calendar widget, add to header controls
        $targetLocation = $widget.find('.window-header .window-controls');
        if (!$targetLocation.length) {
          $targetLocation = $widget.find('.calendar-header');
        }
      } else if ($widget.hasClass('calendar-mini-widget')) {
        // For mini widget, add to the mini header or create one
        $targetLocation = $widget.find('.mini-calendar-header');
        if (!$targetLocation.length) {
          // Create a header area in the mini widget
          $targetLocation = $(
            '<div class="mini-calendar-header" style="display: flex; justify-content: flex-end; padding: 4px;"></div>'
          );
          $widget.prepend($targetLocation);
        }
      }

      if (!$targetLocation || !$targetLocation.length) {
        console.log(`🌟 No suitable location found for button on widget, trying widget itself`);
        // Fallback: add to widget directly
        $targetLocation = $widget;
      }

      // Create the button with better styling
      const $button = $(`
        <div id="${buttonId}" class="simple-weather-button" style="cursor: pointer; padding: 4px 8px; margin: 2px; display: inline-flex; align-items: center; background: var(--color-bg-btn, #f0f0f0); border: 1px solid var(--color-border-dark, #999); border-radius: 3px; color: var(--color-text-primary, #000);" data-tooltip="${tooltip}" title="${tooltip}">
          <i class="fas ${icon}" style="font-size: 14px;"></i>
        </div>
      `);

      // Add click handler with error handling
      $button.on('click', event => {
        event.preventDefault();
        event.stopPropagation();
        console.log(`🌟 Weather button "${name}" clicked`);
        try {
          callback();
          console.log(`🌟 Weather button "${name}" callback executed successfully`);
        } catch (error) {
          console.error(`🌟 Error in weather button callback:`, error);
        }
      });

      // Add hover effects
      $button
        .on('mouseenter', function () {
          $(this).css('background', 'var(--color-bg-btn-hover, #e0e0e0)');
        })
        .on('mouseleave', function () {
          $(this).css('background', 'var(--color-bg-btn, #f0f0f0)');
        });

      // Add to target location
      $targetLocation.append($button);

      console.log(`🌟 Added "${name}" button to widget successfully via DOM`);
    });
  }

  /**
   * Add Simple Calendar compatibility DOM structure via direct DOM manipulation
   * Used when S&S widget API is not available
   */
  private addSimpleCalendarCompatibilityViaDOM($widget: JQuery): void {
    try {
      // Check if already processed to avoid duplicate work
      if ($widget.hasClass('simple-calendar-compat-processed')) {
        return;
      }

      console.log('🌉 Adding Simple Calendar compatibility DOM structure via DOM manipulation');

      // Add required Simple Calendar CSS classes and ID
      $widget.attr('id', 'fsc-if');
      $widget.addClass('fsc-if simple-calendar-compat-processed');

      // Ensure .window-content wrapper exists (required for Simple Weather)
      let $windowContent = $widget.find('.window-content');
      if (!$windowContent.length) {
        // Wrap existing content in window-content div
        $widget.wrapInner('<div class="window-content"></div>');
        $windowContent = $widget.find('.window-content');
      }

      // Add Simple Calendar tab structure required for Simple Weather positioning
      let $tabWrapper = $windowContent.find('.fsc-of');
      if (!$tabWrapper.length) {
        $tabWrapper = $(`
          <div class="fsc-of fsc-d" style="display: none; flex-direction: column; position: relative;">
            <!-- Simple Weather positioning anchor - ensures proper attachment -->
            <div class="sc-right" style="margin-left: auto; position: relative;">
              <!-- Container for Simple Weather attached mode -->
              <div id="swr-fsc-container" style="position: relative; z-index: 100; max-width: 300px; margin-top: 8px;">
                <!-- Simple Weather will inject its content here -->
              </div>
            </div>
          </div>
        `);
        $windowContent.append($tabWrapper);
      }

      // Add extended tab state toggle function (required by Simple Weather)
      if (!$widget.data('sc-toggle-attached')) {
        $widget.data('sc-toggle-attached', true);

        // Add global function for Simple Weather to toggle tab state
        (window as any).toggleExtendedCalendar = function () {
          const $tabPanel = $widget.find('.fsc-of');
          if ($tabPanel.hasClass('fsc-d')) {
            // Open tab
            $tabPanel.removeClass('fsc-d').addClass('fsc-c');
            $tabPanel.css('display', 'flex');
            console.log('🌉 Simple Calendar compatibility: Extended calendar opened');
          } else {
            // Close tab
            $tabPanel.removeClass('fsc-c').addClass('fsc-d');
            $tabPanel.css('display', 'none');
            console.log('🌉 Simple Calendar compatibility: Extended calendar closed');
          }
        };
      }

      console.log('🌉 Simple Calendar compatibility DOM structure added via DOM manipulation');
    } catch (error) {
      console.error('🌉 Failed to add Simple Calendar compatibility via DOM:', error);
    }
  }

  // Note management APIs (Enhanced for Simple Weather compatibility)

  /**
   * Get all calendar notes for a specific day
   *
   * Critical for Simple Weather: Must return JournalEntry documents that can accept flags
   * Simple Weather stores weather data in flags: `simple-weather.dailyWeather`
   *
   * @param year - Year (Simple Calendar format)
   * @param month - Month (0-based, Simple Calendar format)
   * @param day - Day (0-based, Simple Calendar format)
   * @returns Array of JournalEntry documents for that date
   */
  getNotesForDay(year: number, month: number, day: number): any[] {
    if (!game.journal) return [];

    try {
      // Convert 0-based Simple Calendar format to 1-based for storage key
      const storageKey = `${year}-${month + 1}-${day + 1}`;

      console.log(
        `🌉 Simple Calendar Bridge: getNotesForDay(${year}, ${month}, ${day}) -> storage key: ${storageKey}`
      );

      // Find all journal entries with S&S calendar note flags for this date
      const calendarNotes = game.journal.filter((journal: any) => {
        const noteFlags = journal.flags?.['seasons-and-stars'];
        if (!noteFlags?.calendarNote) return false;

        // Check if this note is for the requested date
        if (noteFlags.dateKey === storageKey) {
          console.log(`🌉 Simple Calendar Bridge: Found note for ${storageKey}:`, journal.name);
          return true;
        }

        // Legacy compatibility: check old startDate format (for bridge-created notes)
        if (noteFlags.startDate) {
          const startDate = noteFlags.startDate;
          // Note: S&S uses 1-based dates, but we're comparing with 0-based month/day from Simple Calendar API
          if (
            startDate.year === year &&
            startDate.month - 1 === month &&
            startDate.day - 1 === day
          ) {
            console.log(
              `🌉 Simple Calendar Bridge: Found S&S note for ${storageKey}:`,
              journal.name
            );
            return true;
          }
        }

        return false;
      });

      console.log(
        `🌉 Simple Calendar Bridge: Found ${calendarNotes.length} note(s) for date ${storageKey}`
      );
      return calendarNotes;
    } catch (error) {
      console.error('🌉 Simple Calendar Bridge: Error in getNotesForDay:', error);
      return [];
    }
  }

  /**
   * Add a calendar note
   *
   * Critical for Simple Weather: Must return a JournalEntry that supports setFlag()
   * Simple Weather calls: newNote?.setFlag(moduleJson.id, SC_NOTE_WEATHER_FLAG_NAME, weatherData)
   *
   * @param title - Note title
   * @param content - Note content
   * @param startDate - Start date (Simple Calendar format with 0-based month/day)
   * @param endDate - End date (Simple Calendar format)
   * @param allDay - Whether note is all-day
   * @returns Promise<JournalEntry> that supports flag operations
   */
  async addNote(
    title: string,
    content: string,
    startDate: any,
    endDate: any,
    allDay: boolean
  ): Promise<any> {
    if (!game.user?.isGM) {
      console.warn('🌉 Simple Calendar Bridge: Only GMs can create calendar notes');
      return null;
    }

    try {
      console.log('🌉 Simple Calendar Bridge: Creating calendar note:', {
        title,
        content,
        startDate,
        endDate,
        allDay,
      });

      // Create storage key for date-based retrieval (convert 0-based to 1-based)
      const dateKey = `${startDate.year}-${(startDate.month || 0) + 1}-${(startDate.day || 0) + 1}`;

      // Get or create the calendar notes folder
      const noteFolder = await this.getOrCreateNotesFolder();

      const journal = await JournalEntry.create({
        name: title,
        folder: noteFolder.id,
        flags: {
          // Create S&S-compatible notes only - S&S storage will index these properly
          'seasons-and-stars': {
            calendarNote: true,
            version: '1.0',
            dateKey: dateKey,
            startDate: {
              year: startDate.year || 0,
              month: (startDate.month || 0) + 1, // Convert back to 1-based for S&S
              day: (startDate.day || 0) + 1, // Convert back to 1-based for S&S
              hour: startDate.hour || 0,
              minute: startDate.minute || 0,
              second: startDate.second || 0,
            },
            endDate: endDate
              ? {
                  year: endDate.year || 0,
                  month: (endDate.month || 0) + 1, // Convert back to 1-based for S&S
                  day: (endDate.day || 0) + 1, // Convert back to 1-based for S&S
                  hour: endDate.hour || 0,
                  minute: endDate.minute || 0,
                  second: endDate.second || 0,
                }
              : undefined,
            allDay: allDay,
            calendarId: 'seasons-and-stars', // Use default S&S calendar
            category: 'general', // Default category
            tags: [],
            created: Date.now(),
            modified: Date.now(),
          },
          // Optional: Bridge tracking flags for internal use (separate from S&S)
          'foundryvtt-simple-calendar-compat': {
            bridgeCreated: true,
            originalFormat: {
              startDate: startDate,
              endDate: endDate,
            },
            created: Date.now(),
          },
        },
      });

      if (!journal) {
        throw new Error('Failed to create journal entry');
      }

      // Create content page using v13 pages system - match Simple Calendar's "Details" page name
      await journal.createEmbeddedDocuments('JournalEntryPage', [
        {
          type: 'text',
          name: 'Details', // Always use "Details" like original Simple Calendar
          text: {
            content: content || '',
            format: 1, // CONST.JOURNAL_ENTRY_PAGE_FORMATS.HTML
          },
        },
      ]);

      console.log(
        '🌉 Simple Calendar Bridge: Created calendar note:',
        journal.name,
        'with dateKey:',
        dateKey
      );

      // Force S&S storage system to rebuild its index to include new notes
      // This uses S&S's existing public API without making S&S aware of the bridge
      if ((game.seasonsStars as any)?.notes?.storage) {
        (game.seasonsStars as any).notes.storage.rebuildIndex();
        console.log('🌉 Simple Calendar Bridge: Triggered S&S storage reindex');
      }

      return journal;
    } catch (error) {
      console.error('🌉 Simple Calendar Bridge: Failed to create calendar note:', error);
      return null;
    }
  }

  /**
   * Remove a calendar note by ID
   *
   * @param noteId - JournalEntry document ID
   */
  async removeNote(noteId: string): Promise<void> {
    if (!game.user?.isGM) {
      console.warn('🌉 Simple Calendar Bridge: Only GMs can remove calendar notes');
      return;
    }

    try {
      const journal = game.journal?.get(noteId);
      if (journal) {
        console.log('🌉 Simple Calendar Bridge: Removing calendar note:', journal.name);
        await journal.delete();
        console.log('🌉 Simple Calendar Bridge: Note removed successfully');
      } else {
        console.warn('🌉 Simple Calendar Bridge: Note not found for removal:', noteId);
      }
    } catch (error) {
      console.error('🌉 Simple Calendar Bridge: Failed to remove calendar note:', error);
    }
  }

  /**
   * Get all calendar notes
   */
  getNotes(): any[] {
    if (!game.journal) return [];

    try {
      // Find all journal entries with calendar note flags
      const calendarNotes = game.journal.filter((journal: any) => {
        const ssFlags = journal.flags?.['seasons-and-stars'];
        const bridgeFlags = journal.flags?.['foundryvtt-simple-calendar-compat'];

        return ssFlags?.calendarNote || bridgeFlags?.bridgeCreated;
      });

      console.log(`🌉 Simple Calendar Bridge: Found ${calendarNotes.length} total calendar notes`);
      return calendarNotes;
    } catch (error) {
      console.error('🌉 Simple Calendar Bridge: Error getting all notes:', error);
      return [];
    }
  }

  /**
   * Search calendar notes by text content and optional date range
   */
  searchNotes(searchText: string, startDate?: any, endDate?: any): any[] {
    if (!game.journal) return [];

    try {
      const allNotes = this.getNotes();

      // Filter by search text
      let filteredNotes = allNotes.filter((note: any) => {
        const title = note.name?.toLowerCase() || '';
        const content = note.pages?.contents?.[0]?.text?.content?.toLowerCase() || '';
        const searchLower = searchText.toLowerCase();

        return title.includes(searchLower) || content.includes(searchLower);
      });

      // Filter by date range if provided
      if (startDate || endDate) {
        const startTimestamp = startDate ? this.dateToTimestamp(startDate) : 0;
        const endTimestamp = endDate ? this.dateToTimestamp(endDate) : Number.MAX_SAFE_INTEGER;

        filteredNotes = filteredNotes.filter((note: any) => {
          const ssFlags = note.flags?.['seasons-and-stars'];
          const bridgeFlags = note.flags?.['foundryvtt-simple-calendar-compat'];

          // Get date from flags
          let noteDate = null;
          if (ssFlags?.startDate) {
            noteDate = ssFlags.startDate;
          } else if (bridgeFlags?.originalFormat?.startDate) {
            noteDate = bridgeFlags.originalFormat.startDate;
          }

          if (!noteDate) return true; // Include if no date info

          const noteTimestamp = this.dateToTimestamp(noteDate);
          return noteTimestamp >= startTimestamp && noteTimestamp <= endTimestamp;
        });
      }

      console.log(
        `🌉 Simple Calendar Bridge: Search "${searchText}" found ${filteredNotes.length} notes`
      );
      return filteredNotes;
    } catch (error) {
      console.error('🌉 Simple Calendar Bridge: Error searching notes:', error);
      return [];
    }
  }

  // Clock control APIs for SmallTime integration
  clockStatus(): { started: boolean } {
    return { started: this.clockRunning };
  }

  startClock(): void {
    this.clockRunning = true;
    Hooks.callAll('simple-calendar-clock-start-stop', { started: true });
  }

  stopClock(): void {
    this.clockRunning = false;
    Hooks.callAll('simple-calendar-clock-start-stop', { started: false });
  }

  /**
   * Pause the clock (same as stop for Simple Calendar compatibility)
   */
  pauseClock(): boolean {
    try {
      this.stopClock();
      return true;
    } catch (error) {
      console.error('Failed to pause clock:', error);
      return false;
    }
  }

  showCalendar(): void {
    // Could trigger calendar widget display if available
    console.log('Simple Calendar Bridge: Calendar display requested');
  }

  // UI state functions

  /**
   * Check if calendar is open (always returns false since we don't manage UI state)
   */
  isOpen(): boolean {
    return false;
  }

  /**
   * Check if current user is primary GM
   */
  isPrimaryGM(): boolean {
    try {
      if (!game.user?.isGM) {
        return false;
      }

      // Find the GM with the lowest ID (primary GM)
      const gms = game.users?.filter((u: any) => u.isGM) || [];
      if (gms.length === 0) {
        return false;
      }

      const primaryGM = gms.sort((a: any, b: any) => a.id.localeCompare(b.id))[0];
      return game.user.id === primaryGM?.id;
    } catch (error) {
      console.error('Failed to check if primary GM:', error);
      return false;
    }
  }

  // Calendar widget event handling

  /**
   * Activate full calendar listeners (no-op as specified)
   */
  activateFullCalendarListeners(
    calendarId: string,
    _onMonthChange?: Function,
    _onDayClick?: Function
  ): void {
    console.log(`Simple Calendar Bridge: activateFullCalendarListeners called for ${calendarId}`);
    // No-op - S&S handles its own event listeners
  }

  // Migration function

  /**
   * Run migration (no-op as specified)
   */
  runMigration(): void {
    console.log('Simple Calendar Bridge: runMigration called - no migration needed');
    // No-op - bridge doesn't manage data migrations
  }

  // Additional APIs for module compatibility
  getAllMoons(): any[] {
    return [
      {
        color: '#ffffff',
        currentPhase: { icon: 'new' },
      },
    ];
  }

  getAllSeasons(): any[] {
    return [
      { name: 'Spring', icon: 'spring' },
      { name: 'Summer', icon: 'summer' },
      { name: 'Fall', icon: 'fall' },
      { name: 'Winter', icon: 'winter' },
    ];
  }

  // Utility methods
  private getOrdinalSuffix(day: number): string {
    if (day >= 11 && day <= 13) {
      return 'th';
    }

    const lastDigit = day % 10;
    switch (lastDigit) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
    }
  }

  /**
   * Create a Simple Calendar DateTime object from timestamp (Simple Calendar format)
   * @source Returns exact format expected by Simple Calendar modules
   */
  private createFallbackDateTime(timestamp: number): SimpleCalendarDateTime {
    const days = Math.floor(timestamp / 86400);
    const secondsInDay = timestamp % 86400;
    const hour = Math.floor(secondsInDay / 3600);
    const minute = Math.floor((secondsInDay % 3600) / 60);
    const seconds = secondsInDay % 60;

    return {
      year: 2023,
      month: 0, // 0-based January (Simple Calendar format)
      day: days, // 0-based day (Simple Calendar format)
      hour,
      minute,
      seconds, // Note: 'seconds' not 'second' (Simple Calendar format)
    };
  }

  /**
   * Convert Seasons & Stars date to Simple Calendar DateTime format
   * @source Returns exact format expected by Simple Calendar modules
   */
  private convertSSToSCDateTime(ssDate: CalendarDate): SimpleCalendarDateTime {
    const baseDate = {
      year: ssDate.year,
      month: ssDate.month - 1, // Convert from 1-based to 0-based
      day: ssDate.day - 1, // Convert from 1-based to 0-based
      hour: ssDate.time?.hour || 0,
      minute: ssDate.time?.minute || 0,
      seconds: ssDate.time?.second || 0, // Note: 'seconds' not 'second'
    };

    // Some modules (like SmallTime) expect getCurrentDate to include display data
    // Use S&S formatDate API for robust formatting
    const monthName =
      this.seasonsStars?.api?.formatDate?.(ssDate, { format: '{{month.name}}' }) ||
      `Month ${ssDate.month}`;

    return {
      ...baseDate,
      display: {
        monthName,
        day: ssDate.day.toString(),
        year: ssDate.year.toString(),
      },
    };
  }

  /**
   * Convert Simple Calendar format to Seasons & Stars format
   */

  /**
   * Get or create the calendar notes folder
   */
  private async getOrCreateNotesFolder(): Promise<any> {
    // Try to find existing folder - check BOTH flag types to prevent duplicates
    const existingFolder = game.folders?.find(
      (f: any) =>
        f.type === 'JournalEntry' &&
        // Check for bridge flags
        (f.getFlag?.('foundryvtt-simple-calendar-compat', 'notesFolder') === true ||
          // Check for S&S flags (in case S&S created the folder first)
          f.getFlag?.('seasons-and-stars', 'notesFolder') === true)
    );

    if (existingFolder) {
      // If found S&S folder, add bridge flag for future detection
      if (!existingFolder.getFlag('foundryvtt-simple-calendar-compat', 'notesFolder')) {
        await existingFolder.setFlag('foundryvtt-simple-calendar-compat', 'notesFolder', true);
        console.log('🌉 Simple Calendar Bridge: Added bridge flag to existing S&S notes folder');
      }
      return existingFolder;
    }

    // Create new folder with BOTH flag types for compatibility
    const folder = await Folder.create({
      name: 'Calendar Notes',
      type: 'JournalEntry',
      flags: {
        'foundryvtt-simple-calendar-compat': {
          notesFolder: true,
          version: '1.0',
        },
        'seasons-and-stars': {
          notesFolder: true,
          version: '1.0',
        },
      },
    });

    if (!folder) {
      throw new Error('Failed to create notes folder');
    }

    console.log('🌉 Simple Calendar Bridge: Created Calendar Notes folder with unified flags');
    return folder;
  }
}
