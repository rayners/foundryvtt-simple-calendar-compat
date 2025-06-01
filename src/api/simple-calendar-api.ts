/**
 * Simple Calendar API implementation that bridges to modern calendar providers
 */

import type { CalendarProvider, SimpleCalendarAPI, SimpleCalendarDate } from '../types';

export class SimpleCalendarAPIBridge implements SimpleCalendarAPI {
  private provider: CalendarProvider;
  private clockRunning = false;
  public sidebarButtons: Array<{name: string, icon: string, callback: Function, tooltip?: string, isToggle?: boolean}> = [];
  
  constructor(provider: CalendarProvider) {
    this.provider = provider;
    console.log(`Simple Calendar API bridging to ${provider.name} v${provider.version}`);
  }
  
  // Core time functions
  timestamp(): number {
    return game.time?.worldTime || 0;
  }
  
  timestampToDate(timestamp: number): SimpleCalendarDate {
    try {
      const date = this.provider.worldTimeToDate(timestamp);
      
      const monthNames = this.provider.getMonthNames();
      const weekdayNames = this.provider.getWeekdayNames();
      const sunriseSunset = this.provider.getSunriseSunset?.(date) || { sunrise: 0, sunset: 0 };
      const seasonInfo = this.provider.getSeasonInfo?.(date) || { icon: 'none', name: 'Unknown' };
      const yearFormatting = this.provider.getYearFormatting?.() || { prefix: '', suffix: '' };
      
      // Validate month for safe array access
      const monthName = (date.month >= 1 && date.month <= monthNames.length) ? 
        monthNames[date.month - 1] : 'Unknown Month';
      
      // Validate weekday for safe array access  
      const weekdayName = (date.weekday >= 0 && date.weekday < weekdayNames.length) ?
        weekdayNames[date.weekday] : 'Unknown Day';
      
      const formattedDate = this.provider.formatDate(date, { includeTime: false });
      const formattedTime = this.provider.formatDate(date, { timeOnly: true });
      
      const result = {
        year: date.year,
        month: date.month,     // Keep 1-based - Simple Weather expects 1-based values
        day: date.day,         // Keep 1-based - Simple Weather expects 1-based values
        dayOfTheWeek: date.weekday,
        hour: date.time?.hour || 0,
        minute: date.time?.minute || 0,
        second: date.time?.second || 0,
        dayOffset: 0,
        sunrise: sunriseSunset.sunrise,
        sunset: sunriseSunset.sunset,
        display: {
          date: formattedDate,
          time: formattedTime,
          weekday: weekdayName,
          day: date.day.toString(),
          monthName: monthName,
          month: date.month.toString(),
          year: date.year.toString(),
          daySuffix: this.getOrdinalSuffix(date.day),
          yearPrefix: yearFormatting.prefix,
          yearPostfix: yearFormatting.suffix
        },
        weekdays: weekdayNames,
        showWeekdayHeadings: true,
        currentSeason: {
          icon: seasonInfo.icon
        }
      };
      
      return result;
    } catch (error) {
      console.error('🌉 Failed to convert timestamp to Simple Calendar date:', error);
      
      // Return safe fallback
      return this.createFallbackDate(timestamp);
    }
  }
  
  timestampPlusInterval(timestamp: number, interval: any): number {
    if (!interval) return timestamp;
    
    try {
      const currentDate = this.provider.worldTimeToDate(timestamp);
      let newTimestamp = timestamp;
      
      // Apply intervals in order
      if (interval.year) {
        // Approximate year advancement (365 days)
        newTimestamp += interval.year * 365 * 86400;
      }
      if (interval.month) {
        // Approximate month advancement (30 days)
        newTimestamp += interval.month * 30 * 86400;
      }
      if (interval.day) {
        newTimestamp += interval.day * 86400;
      }
      if (interval.hour) {
        newTimestamp += interval.hour * 3600;
      }
      if (interval.minute) {
        newTimestamp += interval.minute * 60;
      }
      if (interval.second) {
        newTimestamp += interval.second;
      }
      
      return newTimestamp;
    } catch (error) {
      console.warn('Failed to add interval to timestamp:', error);
      return timestamp;
    }
  }
  
  getCurrentDate(): SimpleCalendarDate {
    const currentTimestamp = this.timestamp();
    return this.timestampToDate(currentTimestamp);
  }
  
  formatDateTime(date: any, format?: string): string {
    try {
      // Convert Simple Calendar format back to provider format
      const providerDate = {
        year: date.year,
        month: date.month || 1,        // Already 1-based
        day: date.day || 1,            // Already 1-based
        weekday: date.dayOfTheWeek || date.weekday || 0,
        time: {
          hour: date.hour || 0,
          minute: date.minute || 0,
          second: date.second || date.seconds || 0
        }
      };
      
      return this.provider.formatDate(providerDate);
    } catch (error) {
      console.warn('Failed to format date:', error);
      return '';
    }
  }
  
  dateToTimestamp(date: any): number {
    try {
      // Convert Simple Calendar format to provider format
      const providerDate = {
        year: date.year,
        month: date.month || 1,
        day: date.day || 1,
        weekday: date.dayOfTheWeek || date.weekday || 0,
        time: {
          hour: date.hour || 0,
          minute: date.minute || 0,
          second: date.second || date.seconds || 0
        }
      };
      
      return this.provider.dateToWorldTime(providerDate);
    } catch (error) {
      console.warn('Failed to convert date to timestamp:', error);
      return 0;
    }
  }
  
  // Time advancement methods
  async advanceDays(days: number): Promise<void> {
    if (this.provider.advanceDays) {
      await this.provider.advanceDays(days);
    } else {
      throw new Error(`${this.provider.name} does not support time advancement`);
    }
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
      callbackType: typeof callback,
      stackTrace: new Error().stack?.split('\n').slice(1, 4)
    });
    
    this.sidebarButtons.push({ name, icon, callback, tooltip, isToggle });
    console.log(`Simple Calendar Bridge: Sidebar button "${name}" registered (tooltip: ${tooltip}, toggle: ${isToggle})`);
    console.log(`Simple Calendar Bridge: Total sidebar buttons:`, this.sidebarButtons.length);
    
    // Add the button to existing Seasons & Stars widgets
    this.addButtonToWidgets(name, icon, tooltip, callback);
  }
  
  /**
   * Add a button to existing Seasons & Stars widgets using proper widget API
   */
  addButtonToWidgets(name: string, icon: string, tooltip: string, callback: Function): void {
    console.log(`🌟 Adding weather button "${name}" to existing widgets`);
    
    // First try to use Seasons & Stars widget API directly (proper method)
    if ((window as any).SeasonsStars?.CalendarWidget) {
      console.log(`🌟 Using Seasons & Stars CalendarWidget API for button "${name}"`);
      try {
        const CalendarWidgetClass = (window as any).SeasonsStars.CalendarWidget;
        const calendarWidget = CalendarWidgetClass.getInstance();
        
        if (calendarWidget && typeof calendarWidget.addSidebarButton === 'function') {
          // Check if button already exists to avoid duplicates
          const existingButton = calendarWidget.sidebarButtons?.find((btn: any) => btn.name === name);
          if (existingButton) {
            console.log(`🌟 Button "${name}" already exists in widget's sidebar buttons`);
            return;
          }
          
          calendarWidget.addSidebarButton(name, icon, tooltip, callback);
          console.log(`🌟 Successfully added "${name}" button via Seasons & Stars widget API`);
          return;
        } else {
          console.log(`🌟 CalendarWidget instance not available or doesn't support addSidebarButton`);
          console.log(`🌟 Instance:`, calendarWidget);
          console.log(`🌟 Has addSidebarButton:`, calendarWidget ? typeof calendarWidget.addSidebarButton : 'N/A');
        }
      } catch (error) {
        console.warn(`🌟 Failed to use Seasons & Stars widget API:`, error);
      }
    } else {
      console.log(`🌟 SeasonsStars.CalendarWidget not available:`, {
        hasSeasonsStars: !!((window as any).SeasonsStars),
        hasCalendarWidget: !!((window as any).SeasonsStars?.CalendarWidget)
      });
    }
    
    // If we can't access the widget API, fall back to DOM manipulation
    // This will likely get cleared on re-render, but it's better than nothing
    console.log(`🌟 Falling back to DOM manipulation for button "${name}"`);
    this.addButtonToWidgetsViaDOM(name, icon, tooltip, callback);
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