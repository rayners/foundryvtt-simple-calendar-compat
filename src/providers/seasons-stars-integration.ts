/**
 * Seasons & Stars Integration Provider for Simple Calendar Compatibility Bridge
 *
 * Uses the new SeasonsStarsIntegration interface for clean, robust integration
 * without direct DOM manipulation or legacy API dependencies.
 */

import type { CalendarProvider, CalendarDate } from '../types';

// Integration types (matching S&S interface design)
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
 * Enhanced provider using the new S&S integration interface
 */
export class SeasonsStarsIntegrationProvider implements CalendarProvider {
  readonly name = 'Seasons & Stars (Integration)';
  readonly version: string;

  private integration: SeasonsStarsIntegration | null = null;
  private dateChangeCallback?: Function;
  private calendarChangeCallback?: Function;
  private widgetChangeCallback?: Function;

  constructor() {
    this.integration = this.detectIntegration();
    this.version = this.integration?.version || '0.0.0';

    if (this.integration) {
      this.setupHookListeners();
    }
  }

  /**
   * Detect S&S integration using new interface
   */
  private detectIntegration(): SeasonsStarsIntegration | null {
    try {
      // Try new integration interface first (S&S v2.0+)
      const integration = (game as any).seasonsStars?.integration;
      if (integration && integration.isAvailable) {
        console.log('Bridge: Using S&S integration interface v' + integration.version);
        return integration;
      }

      // Try static detection method
      if (game.seasonsStars?.integration?.detect) {
        const detected = game.seasonsStars.integration.detect();
        if (detected && detected.isAvailable) {
          console.log('Bridge: Detected S&S integration v' + detected.version);
          return detected;
        }
      }

      // Fallback: try to create integration from legacy API
      if ((game as any).seasonsStars?.api && (game as any).seasonsStars?.manager) {
        console.log('Bridge: Creating integration wrapper for legacy S&S API');
        return this.createLegacyIntegrationWrapper();
      }

      return null;
    } catch (error) {
      console.error('Bridge: Failed to detect S&S integration:', error);
      return null;
    }
  }

  /**
   * Create integration wrapper for older S&S versions
   */
  private createLegacyIntegrationWrapper(): SeasonsStarsIntegration {
    const api = (game as any).seasonsStars.api;
    const manager = (game as any).seasonsStars.manager;

    return {
      isAvailable: true,
      version: (game.modules?.get('seasons-and-stars') as any)?.version || '1.x.x',
      api: api,
      widgets: this.createLegacyWidgetWrapper(),
      hooks: this.createLegacyHookWrapper(),

      hasFeature: (feature: string) => {
        // Basic feature detection for legacy versions
        switch (feature) {
          case 'basic-api':
            return true;
          case 'widget-buttons':
            return this.hasWidgetButtonSupport();
          case 'time-advancement':
            return typeof api.advanceDays === 'function';
          default:
            return false;
        }
      },

      getFeatureVersion: (feature: string) => {
        return this.hasFeature(feature) ? this.version : null;
      },
    } as SeasonsStarsIntegration;
  }

  private createLegacyWidgetWrapper(): SeasonsStarsWidgets {
    return {
      get main() {
        return this.wrapWidget('CalendarWidget');
      },
      get mini() {
        return this.wrapWidget('CalendarMiniWidget');
      },
      get grid() {
        return this.wrapWidget('CalendarGridWidget');
      },

      getPreferredWidget: (preference = WidgetPreference.ANY) => {
        const mini = this.wrapWidget('CalendarMiniWidget');
        const main = this.wrapWidget('CalendarWidget');
        const grid = this.wrapWidget('CalendarGridWidget');

        switch (preference) {
          case WidgetPreference.MINI:
            return mini;
          case WidgetPreference.MAIN:
            return main;
          case WidgetPreference.GRID:
            return grid;
          default:
            return mini || main || grid;
        }
      },

      onWidgetChange: () => {},
      offWidgetChange: () => {},

      wrapWidget(widgetClassName: string): BridgeCalendarWidget | null {
        const widgetClass = game.seasonsStars?.manager?.widgets?.[widgetClassName];
        const instance = widgetClass?.getInstance?.();

        if (!instance) return null;

        return {
          id: widgetClassName.toLowerCase(),
          isVisible: instance.rendered || false,

          addSidebarButton: (name: string, icon: string, tooltip: string, callback: Function) => {
            if (typeof instance.addSidebarButton === 'function') {
              instance.addSidebarButton(name, icon, tooltip, callback);
            } else {
              throw new Error(`Widget ${widgetClassName} does not support sidebar buttons`);
            }
          },

          removeSidebarButton: (name: string) => {
            if (typeof instance.removeSidebarButton === 'function') {
              instance.removeSidebarButton(name);
            }
          },

          hasSidebarButton: (name: string) => {
            return typeof instance.hasSidebarButton === 'function'
              ? instance.hasSidebarButton(name)
              : false;
          },

          getInstance: () => instance,
        };
      },
    };
  }

  private createLegacyHookWrapper(): SeasonsStarsHooks {
    return {
      onDateChanged: (callback: Function) => {
        Hooks.on('seasons-stars:dateChanged', callback);
      },

      onCalendarChanged: (callback: Function) => {
        Hooks.on('seasons-stars:calendarChanged', callback);
      },

      onReady: (callback: Function) => {
        Hooks.on('seasons-stars:ready', callback);
      },

      off: (hookName: string, callback: Function) => {
        Hooks.off(hookName, callback as any);
      },
    };
  }

  private hasWidgetButtonSupport(): boolean {
    const widgets = ['CalendarWidget', 'CalendarMiniWidget', 'CalendarGridWidget'];

    for (const widgetName of widgets) {
      const widgetClass = game.seasonsStars?.manager?.widgets?.[widgetName];
      const instance = widgetClass?.getInstance?.();

      if (instance && typeof instance.addSidebarButton === 'function') {
        return true;
      }
    }

    return false;
  }

  /**
   * Setup hook listeners for S&S events
   */
  private setupHookListeners(): void {
    if (!this.integration) return;

    // Listen for date changes
    this.dateChangeCallback = (event: DateChangeEvent) => {
      // Translate to Simple Calendar hook format if needed
      Hooks.callAll('simple-calendar-date-time-change', {
        date: this.convertToSimpleCalendarFormat(event.newDate),
        moons: this.getAllMoons(),
        seasons: this.getAllSeasons(),
      });
    };

    this.integration.hooks.onDateChanged(this.dateChangeCallback);

    // Listen for calendar changes
    this.calendarChangeCallback = (event: CalendarChangeEvent) => {
      console.log('Bridge: Calendar changed from', event.oldCalendarId, 'to', event.newCalendarId);
    };

    this.integration.hooks.onCalendarChanged(this.calendarChangeCallback);

    // Listen for widget changes
    this.widgetChangeCallback = (widgets: SeasonsStarsWidgets) => {
      console.log('Bridge: Widgets changed, available:', {
        main: !!widgets.main,
        mini: !!widgets.mini,
        grid: !!widgets.grid,
      });
    };

    this.integration.widgets.onWidgetChange(this.widgetChangeCallback);
  }

  /**
   * Check if S&S is available with integration interface
   */
  static isAvailable(): boolean {
    // Check for module
    const module = game.modules?.get('seasons-and-stars');
    if (!module?.active) {
      return false;
    }

    // Check for current S&S API
    const hasIntegration = !!game.seasonsStars?.integration?.isAvailable;
    const hasAPI = !!game.seasonsStars?.api;

    return hasIntegration || hasAPI;
  }

  /**
   * Get integration instance for direct access
   */
  getIntegration(): SeasonsStarsIntegration | null {
    return this.integration;
  }

  // CalendarProvider interface implementation
  getCurrentDate(): CalendarDate | null {
    if (!this.integration?.api) return null;

    try {
      return this.integration.api.getCurrentDate();
    } catch (error) {
      console.error('Bridge: Failed to get current date:', error);
      return null;
    }
  }

  worldTimeToDate(timestamp: number): CalendarDate {
    if (!this.integration?.api) {
      throw new Error('S&S integration not available');
    }

    return this.integration.api.worldTimeToDate(timestamp);
  }

  dateToWorldTime(date: CalendarDate): number {
    if (!this.integration?.api) {
      throw new Error('S&S integration not available');
    }

    return this.integration.api.dateToWorldTime(date);
  }

  formatDate(date: CalendarDate, options?: any): string {
    if (!this.integration?.api) {
      throw new Error('S&S integration not available');
    }

    return this.integration.api.formatDate(date, options);
  }

  getActiveCalendar(): any {
    if (!this.integration?.api) return null;

    return this.integration.api.getActiveCalendar();
  }

  getMonthNames(): string[] {
    if (!this.integration?.api) return [];

    try {
      return this.integration.api.getMonthNames();
    } catch (error) {
      console.error('Bridge: Failed to get month names:', error);
      return [];
    }
  }

  getWeekdayNames(): string[] {
    if (!this.integration?.api) return [];

    try {
      return this.integration.api.getWeekdayNames();
    } catch (error) {
      console.error('Bridge: Failed to get weekday names:', error);
      return [];
    }
  }

  async advanceDays(days: number): Promise<void> {
    if (!this.integration?.api?.advanceDays) {
      throw new Error('Time advancement not supported');
    }

    return this.integration.api.advanceDays(days);
  }

  async advanceHours(hours: number): Promise<void> {
    if (!this.integration?.api?.advanceHours) {
      throw new Error('Time advancement not supported');
    }

    return this.integration.api.advanceHours(hours);
  }

  async advanceMinutes(minutes: number): Promise<void> {
    if (!this.integration?.api?.advanceMinutes) {
      throw new Error('Time advancement not supported');
    }

    return this.integration.api.advanceMinutes(minutes);
  }

  getSunriseSunset(date: CalendarDate): { sunrise: number; sunset: number } {
    if (this.integration?.api?.getSunriseSunset) {
      return this.integration.api.getSunriseSunset(date);
    }

    // Default fallback
    const dayStart = this.dateToWorldTime({
      ...date,
      time: { hour: 0, minute: 0, second: 0 },
    });

    return {
      sunrise: dayStart + 6 * 3600, // 6 AM
      sunset: dayStart + 18 * 3600, // 6 PM
    };
  }

  getSeasonInfo(date: CalendarDate): { icon: string; name: string } {
    if (this.integration?.api?.getSeasonInfo) {
      return this.integration.api.getSeasonInfo(date);
    }

    // Default seasonal calculation
    const month = date.month;

    if (month >= 3 && month <= 5) {
      return { icon: 'spring', name: 'Spring' };
    } else if (month >= 6 && month <= 8) {
      return { icon: 'summer', name: 'Summer' };
    } else if (month >= 9 && month <= 11) {
      return { icon: 'fall', name: 'Fall' };
    } else {
      return { icon: 'winter', name: 'Winter' };
    }
  }

  /**
   * Add sidebar button to preferred widget
   */
  addSidebarButton(name: string, icon: string, tooltip: string, callback: Function): void {
    if (!this.integration?.widgets) {
      throw new Error('Widget integration not available');
    }

    const widget = this.integration.widgets.getPreferredWidget(WidgetPreference.MINI);
    if (widget) {
      widget.addSidebarButton(name, icon, tooltip, callback);
    } else {
      console.warn('Bridge: No widgets available for sidebar button integration');
    }
  }

  /**
   * Remove sidebar button from widgets
   */
  removeSidebarButton(name: string): void {
    if (!this.integration?.widgets) return;

    for (const widget of [
      this.integration.widgets.mini,
      this.integration.widgets.main,
      this.integration.widgets.grid,
    ]) {
      if (widget) {
        widget.removeSidebarButton(name);
      }
    }
  }

  /**
   * Convert S&S date format to Simple Calendar format
   */
  private convertToSimpleCalendarFormat(ssDate: CalendarDate): any {
    const monthNames = this.getMonthNames();
    const weekdayNames = this.getWeekdayNames();
    const sunriseSunset = this.getSunriseSunset(ssDate);
    const seasonInfo = this.getSeasonInfo(ssDate);

    return {
      year: ssDate.year,
      month: ssDate.month - 1, // SC uses 0-based months
      day: ssDate.day - 1, // SC uses 0-based days
      dayOfTheWeek: ssDate.weekday, // Already 0-based, no conversion needed
      hour: ssDate.time?.hour || 0,
      minute: ssDate.time?.minute || 0,
      second: ssDate.time?.second || 0,
      sunrise: sunriseSunset.sunrise,
      sunset: sunriseSunset.sunset,

      display: {
        date: this.formatDate(ssDate),
        time: this.formatTime(ssDate),
        weekday: weekdayNames[ssDate.weekday] || '',
        day: ssDate.day.toString(),
        monthName: monthNames[ssDate.month - 1] || '',
        month: ssDate.month.toString(),
        year: ssDate.year.toString(),
        daySuffix: this.getOrdinalSuffix(ssDate.day),
        yearPrefix: '',
        yearPostfix: '',
      },

      weekdays: weekdayNames,
      showWeekdayHeadings: true,
      currentSeason: {
        icon: seasonInfo.icon,
      },
    };
  }

  private formatTime(date: CalendarDate): string {
    if (!date.time) return '00:00:00';

    const hour = date.time.hour.toString().padStart(2, '0');
    const minute = date.time.minute.toString().padStart(2, '0');
    const second = date.time.second.toString().padStart(2, '0');

    return `${hour}:${minute}:${second}`;
  }

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

  private getAllMoons(): any[] {
    // Default empty moons - can be enhanced with S&S moon data if available
    return [];
  }

  private getAllSeasons(): any[] {
    // Default seasons - can be enhanced with S&S season data if available
    return [
      { name: 'Spring', icon: 'spring' },
      { name: 'Summer', icon: 'summer' },
      { name: 'Fall', icon: 'fall' },
      { name: 'Winter', icon: 'winter' },
    ];
  }

  /**
   * Cleanup integration resources
   */
  cleanup(): void {
    if (this.integration) {
      if (this.dateChangeCallback) {
        this.integration.hooks.off('dateChanged', this.dateChangeCallback);
      }
      if (this.calendarChangeCallback) {
        this.integration.hooks.off('calendarChanged', this.calendarChangeCallback);
      }
      if (this.widgetChangeCallback) {
        this.integration.widgets.offWidgetChange(this.widgetChangeCallback);
      }
    }
  }
}
