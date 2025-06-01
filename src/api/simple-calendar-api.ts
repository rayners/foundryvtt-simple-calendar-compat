/**
 * Simple Calendar API implementation that bridges to Seasons & Stars Integration Interface
 */

import type { SimpleCalendarAPI, SimpleCalendarDate } from '../types';

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
  month: number;  // 1-based
  day: number;    // 1-based
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
  ANY = 'any'
}

export class SimpleCalendarAPIBridge implements SimpleCalendarAPI {
  private seasonsStars: SeasonsStarsIntegration | null = null;
  private clockRunning = false;
  public sidebarButtons: Array<{name: string, icon: string, callback: Function, tooltip?: string, isToggle?: boolean}> = [];
  
  constructor(seasonsStarsIntegration?: SeasonsStarsIntegration) {
    this.seasonsStars = seasonsStarsIntegration || this.detectSeasonsStars();
    
    if (this.seasonsStars) {
      console.log(`Simple Calendar API bridging to Seasons & Stars v${this.seasonsStars.version} via Integration Interface`);
      this.setupHookBridging();
    } else {
      console.warn('Simple Calendar API Bridge: No Seasons & Stars integration available, using fallback mode');
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
      if ((window as any).SeasonsStars?.integration?.detect) {
        const detected = (window as any).SeasonsStars.integration.detect();
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
        seasons: this.getAllSeasons()
      });
    });
    
    this.seasonsStars.hooks.onCalendarChanged((event: CalendarChangeEvent) => {
      console.log('Bridge: Calendar changed from', event.oldCalendarId, 'to', event.newCalendarId);
    });
  }
  
  // Core time functions
  timestamp(): number {
    return game.time?.worldTime || 0;
  }
  
  timestampToDate(timestamp: number): SimpleCalendarDate {
    try {
      if (!this.seasonsStars?.api) {
        return this.createFallbackDate(timestamp);
      }
      
      // Use S&S API to convert timestamp to date
      const ssDate = this.seasonsStars.api.worldTimeToDate(timestamp);
      
      // Convert S&S date format to Simple Calendar format
      return this.convertSSToSCFormat(ssDate);
    } catch (error) {
      console.error('🌉 Failed to convert timestamp to Simple Calendar date:', error);
      return this.createFallbackDate(timestamp);
    }
  }
  
  /**
   * Convert S&S CalendarDate format to Simple Calendar format
   */
  private convertSSToSCFormat(ssDate: CalendarDate): SimpleCalendarDate {
    if (!this.seasonsStars?.api) {
      throw new Error('S&S API not available for date conversion');
    }
    
    const monthNames = this.seasonsStars.api.getMonthNames();
    const weekdayNames = this.seasonsStars.api.getWeekdayNames();
    const sunriseSunset = this.seasonsStars.api.getSunriseSunset?.(ssDate) || { sunrise: 6, sunset: 18 };
    const seasonInfo = this.seasonsStars.api.getSeasonInfo?.(ssDate) || { icon: 'none', name: 'Unknown' };
    
    // Validate month for safe array access
    const monthName = (ssDate.month >= 1 && ssDate.month <= monthNames.length) ? 
      monthNames[ssDate.month - 1] : 'Unknown Month';
    
    // Validate weekday for safe array access  
    const weekdayName = (ssDate.weekday >= 0 && ssDate.weekday < weekdayNames.length) ?
      weekdayNames[ssDate.weekday] : 'Unknown Day';
    
    const formattedDate = this.seasonsStars.api.formatDate(ssDate, { includeTime: false });
    const formattedTime = this.seasonsStars.api.formatDate(ssDate, { timeOnly: true });
    
    // Get calendar metadata for year formatting
    const activeCalendar = this.seasonsStars.api.getActiveCalendar();
    const yearPrefix = activeCalendar?.year?.prefix || '';
    const yearSuffix = activeCalendar?.year?.suffix || '';
    
    return {
      year: ssDate.year,
      month: ssDate.month,     // Keep 1-based - Simple Weather expects 1-based values
      day: ssDate.day,         // Keep 1-based - Simple Weather expects 1-based values
      dayOfTheWeek: ssDate.weekday,
      hour: ssDate.time?.hour || 0,
      minute: ssDate.time?.minute || 0,
      second: ssDate.time?.second || 0,
      dayOffset: 0,
      sunrise: sunriseSunset.sunrise,
      sunset: sunriseSunset.sunset,
      display: {
        date: formattedDate,
        time: formattedTime,
        weekday: weekdayName,
        day: ssDate.day.toString(),
        monthName: monthName,
        month: ssDate.month.toString(),
        year: ssDate.year.toString(),
        daySuffix: this.getOrdinalSuffix(ssDate.day),
        yearPrefix: yearPrefix,
        yearPostfix: yearSuffix
      },
      weekdays: weekdayNames,
      showWeekdayHeadings: true,
      currentSeason: {
        icon: seasonInfo.icon
      }
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
  
  getCurrentDate(): SimpleCalendarDate {
    try {
      if (!this.seasonsStars?.api) {
        const currentTimestamp = this.timestamp();
        return this.createFallbackDate(currentTimestamp);
      }
      
      // Use S&S API to get current date
      const ssDate = this.seasonsStars.api.getCurrentDate();
      return this.convertSSToSCFormat(ssDate);
    } catch (error) {
      console.error('Failed to get current date:', error);
      const currentTimestamp = this.timestamp();
      return this.createFallbackDate(currentTimestamp);
    }
  }
  
  formatDateTime(date: any, format?: string): string {
    try {
      if (!this.seasonsStars?.api) {
        return '';
      }
      
      // Convert Simple Calendar format back to S&S CalendarDate format
      const ssDate = this.convertSCToSSFormat(date);
      
      // Use S&S API to format the date
      return this.seasonsStars.api.formatDate(ssDate);
    } catch (error) {
      console.warn('Failed to format date:', error);
      return '';
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
   */
  private convertSCToSSFormat(scDate: any): CalendarDate {
    return {
      year: scDate.year,
      month: scDate.month || 1,        // Already 1-based
      day: scDate.day || 1,            // Already 1-based
      weekday: scDate.dayOfTheWeek || scDate.weekday || 0,
      time: {
        hour: scDate.hour || 0,
        minute: scDate.minute || 0,
        second: scDate.second || scDate.seconds || 0
      }
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
  addSidebarButton(name: string, icon: string, tooltip: string, isToggle: boolean, callback: Function): void {
    console.log(`🌉 Simple Calendar Bridge: addSidebarButton called with:`, {
      name, icon, tooltip, isToggle, 
      callbackType: typeof callback
    });
    
    this.sidebarButtons.push({ name, icon, callback, tooltip, isToggle });
    console.log(`Simple Calendar Bridge: Sidebar button "${name}" registered (tooltip: ${tooltip}, toggle: ${isToggle})`);
    
    // Add the button to existing Seasons & Stars widgets using S&S API
    this.addButtonToWidgets(name, icon, tooltip, callback);
  }
  
  /**
   * Add a button to existing Seasons & Stars widgets using S&S Integration API
   */
  private addButtonToWidgets(name: string, icon: string, tooltip: string, callback: Function): void {
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
   * Fallback method: Add button via DOM manipulation (may be cleared on re-render)
   */
  private addButtonToWidgetsViaDOM(name: string, icon: string, tooltip: string, callback: Function): void {
    // Find all calendar widgets
    const calendarWidgets = document.querySelectorAll('.calendar-widget, .calendar-mini-widget');
    console.log(`🌟 Found ${calendarWidgets.length} calendar widgets for DOM manipulation`);
    
    calendarWidgets.forEach((widget) => {
      const $widget = $(widget);
      const buttonId = `simple-weather-button-${name.toLowerCase().replace(/\s+/g, '-')}`;
      
      console.log(`🌟 Processing widget via DOM:`, widget.className);
      
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
          $targetLocation = $('<div class="mini-calendar-header" style="display: flex; justify-content: flex-end; padding: 4px;"></div>');
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
      $button.on('click', (event) => {
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
      $button.on('mouseenter', function() {
        $(this).css('background', 'var(--color-bg-btn-hover, #e0e0e0)');
      }).on('mouseleave', function() {
        $(this).css('background', 'var(--color-bg-btn, #f0f0f0)');
      });
      
      // Add to target location
      $targetLocation.append($button);
      
      console.log(`🌟 Added "${name}" button to widget successfully via DOM`);
    });
  }
  
  // Note management APIs (basic implementation)
  getNotesForDay(year: number, month: number, day: number): any[] {
    // Basic implementation - could be enhanced to integrate with journal entries
    return [];
  }
  
  async addNote(title: string, content: string, startDate: any, endDate: any, allDay: boolean): Promise<any> {
    if (!game.user?.isGM) return null;
    
    try {
      const journal = await JournalEntry.create({
        name: title,
        content: content,
        flags: {
          'simple-calendar-compat': {
            isCalendarNote: true,
            startDate: startDate,
            endDate: endDate,
            allDay: allDay
          }
        }
      });
      
      return journal;
    } catch (error) {
      console.error('Failed to create calendar note:', error);
      return null;
    }
  }
  
  async removeNote(noteId: string): Promise<void> {
    if (!game.user?.isGM) return;
    
    try {
      const journal = game.journal?.get(noteId);
      if (journal) {
        await journal.delete();
      }
    } catch (error) {
      console.error('Failed to remove calendar note:', error);
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
  
  showCalendar(): void {
    // Could trigger calendar widget display if available
    console.log('Simple Calendar Bridge: Calendar display requested');
  }
  
  // Additional APIs for module compatibility
  getAllMoons(): any[] {
    return [{ 
      color: '#ffffff',
      currentPhase: { icon: 'new' }
    }];
  }
  
  getAllSeasons(): any[] {
    return [
      { name: 'Spring', icon: 'spring' },
      { name: 'Summer', icon: 'summer' },
      { name: 'Fall', icon: 'fall' },
      { name: 'Winter', icon: 'winter' }
    ];
  }
  
  // Utility methods
  private getOrdinalSuffix(day: number): string {
    if (day >= 11 && day <= 13) {
      return 'th';
    }
    
    const lastDigit = day % 10;
    switch (lastDigit) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }
  
  private createFallbackDate(timestamp: number): SimpleCalendarDate {
    const days = Math.floor(timestamp / 86400);
    const secondsInDay = timestamp % 86400;
    const hour = Math.floor(secondsInDay / 3600);
    const minute = Math.floor((secondsInDay % 3600) / 60);
    const second = secondsInDay % 60;
    
    return {
      year: 2023,
      month: 0, // 0-based January
      day: days,
      dayOfTheWeek: 0,
      hour,
      minute,
      second,
      dayOffset: 0,
      sunrise: days * 86400 + (6 * 3600),  // 6 AM
      sunset: days * 86400 + (18 * 3600),  // 6 PM
      display: {
        date: `2023-01-${(days + 1).toString().padStart(2, '0')}`,
        time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
        weekday: 'Sunday',
        day: (days + 1).toString(),
        monthName: 'January',
        month: '1',
        year: '2023',
        daySuffix: this.getOrdinalSuffix(days + 1),
        yearPrefix: '',
        yearPostfix: ''
      },
      weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      showWeekdayHeadings: true,
      currentSeason: {
        icon: 'winter'
      }
    };
  }
}