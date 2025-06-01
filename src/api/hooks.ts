/**
 * Hook bridging system for Simple Calendar compatibility
 */

import type { CalendarProvider } from '../types';

export class HookBridge {
  private provider: CalendarProvider;
  private clockRunning = false;
  
  // Simple Calendar hook names
  private readonly SIMPLE_CALENDAR_HOOKS = {
    Init: 'simple-calendar-init',
    DateTimeChange: 'simple-calendar-date-time-change', 
    ClockStartStop: 'simple-calendar-clock-start-stop'
  };
  
  constructor(provider: CalendarProvider) {
    this.provider = provider;
  }
  
  /**
   * Initialize hook bridging between provider and Simple Calendar format
   */
  initialize(): void {
    console.log(`Simple Calendar Bridge: Setting up hook bridging for ${this.provider.name}`);
    
    // Listen for provider-specific hooks and translate to Simple Calendar format
    this.setupProviderHooks();
    
    // Set up Foundry core hooks
    this.setupFoundryHooks();
    
    // Emit the initialization hook that modules listen for
    console.log('🌉 Simple Calendar Bridge: About to emit Init hook');
    console.log('🌉 Simple Calendar Bridge: Hook name:', this.SIMPLE_CALENDAR_HOOKS.Init);
    console.log('🌉 Simple Calendar Bridge: Registered listeners before Init:', (Hooks as any)._hooks?.[this.SIMPLE_CALENDAR_HOOKS.Init]?.length || 0);
    
    Hooks.callAll(this.SIMPLE_CALENDAR_HOOKS.Init);
    
    console.log('🌉 Simple Calendar Bridge: Init hook emitted');
    console.log('🌉 Simple Calendar Bridge: renderMainApp listeners after Init:', (Hooks as any)._hooks?.['renderMainApp']?.length || 0);
  }
  
  /**
   * Set up provider-specific hook listeners
   */
  private setupProviderHooks(): void {
    // Seasons & Stars specific hooks
    if (this.provider.name === 'Seasons & Stars') {
      Hooks.on('seasons-stars:dateChanged', this.onDateChanged.bind(this));
      Hooks.on('seasons-stars:calendarChanged', this.onCalendarChanged.bind(this));
    }
    
    // About Time specific hooks (future)
    // if (this.provider.name === 'About Time') {
    //   Hooks.on('about-time:timeChanged', this.onDateChanged.bind(this));
    // }
  }
  
  /**
   * Set up Foundry core hook listeners
   */
  private setupFoundryHooks(): void {
    // Listen to core world time updates
    Hooks.on('updateWorldTime', this.onWorldTimeUpdate.bind(this));
    
    // Listen for setting changes that might affect calendar
    Hooks.on('updateSetting', this.onSettingUpdate.bind(this));
  }
  
  /**
   * Handle date/time changes from the provider
   */
  private onDateChanged(): void {
    try {
      const currentDate = this.getCurrentSimpleCalendarDate();
      
      Hooks.callAll(this.SIMPLE_CALENDAR_HOOKS.DateTimeChange, {
        date: currentDate,
        moons: this.getAllMoons(),
        seasons: this.getAllSeasons()
      });
      
      console.log('Simple Calendar Bridge: Date change hook emitted');
    } catch (error) {
      console.warn('Failed to emit date change hook:', error);
    }
  }
  
  /**
   * Handle calendar changes (switching between different calendars)
   */
  private onCalendarChanged(): void {
    // Re-emit date change with new calendar context
    this.onDateChanged();
  }
  
  /**
   * Handle Foundry core world time updates
   */
  private onWorldTimeUpdate(): void {
    // Emit Simple Calendar date change when Foundry time updates
    this.onDateChanged();
  }
  
  /**
   * Handle setting updates that might affect calendar display
   */
  private onSettingUpdate(setting: any): void {
    // Check if it's a calendar-related setting
    if (setting?.key?.includes('calendar') || setting?.key?.includes('time')) {
      this.onDateChanged();
    }
  }
  
  /**
   * Clock control methods
   */
  startClock(): void {
    this.clockRunning = true;
    Hooks.callAll(this.SIMPLE_CALENDAR_HOOKS.ClockStartStop, { started: true });
  }
  
  stopClock(): void {
    this.clockRunning = false;
    Hooks.callAll(this.SIMPLE_CALENDAR_HOOKS.ClockStartStop, { started: false });
  }
  
  getClockStatus(): { started: boolean } {
    return { started: this.clockRunning };
  }
  
  /**
   * Get current date in Simple Calendar format
   */
  private getCurrentSimpleCalendarDate(): any {
    try {
      const currentDate = this.provider.getCurrentDate();
      if (!currentDate) return null;
      
      const monthNames = this.provider.getMonthNames();
      const weekdayNames = this.provider.getWeekdayNames();
      const sunriseSunset = this.provider.getSunriseSunset?.(currentDate) || { sunrise: 0, sunset: 0 };
      const seasonInfo = this.provider.getSeasonInfo?.(currentDate) || { icon: 'none', name: 'Unknown' };
      
      return {
        year: currentDate.year,
        month: currentDate.month - 1, // 0-based for SC compatibility
        day: currentDate.day - 1,     // 0-based for SC compatibility
        dayOfTheWeek: currentDate.weekday - 1, // 0-based for SC compatibility
        hour: currentDate.time?.hour || 0,
        minute: currentDate.time?.minute || 0,
        second: currentDate.time?.second || 0,
        sunrise: sunriseSunset.sunrise,
        sunset: sunriseSunset.sunset,
        display: {
          monthName: monthNames[currentDate.month - 1] || '',
          weekday: weekdayNames[currentDate.weekday] || '',
          // ... other display properties
        }
      };
    } catch (error) {
      console.warn('Failed to get current Simple Calendar date:', error);
      return null;
    }
  }
  
  /**
   * Get moon data for compatibility
   */
  private getAllMoons(): any[] {
    return [{ 
      color: '#ffffff',
      currentPhase: { icon: 'new' }
    }];
  }
  
  /**
   * Get season data for compatibility  
   */
  private getAllSeasons(): any[] {
    return [
      { name: 'Spring', icon: 'spring' },
      { name: 'Summer', icon: 'summer' },
      { name: 'Fall', icon: 'fall' },
      { name: 'Winter', icon: 'winter' }
    ];
  }
  
  /**
   * Get the Simple Calendar hook constants for external access
   */
  getHookNames(): typeof this.SIMPLE_CALENDAR_HOOKS {
    return this.SIMPLE_CALENDAR_HOOKS;
  }
}