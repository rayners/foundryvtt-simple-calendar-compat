/**
 * Hook bridging system for Simple Calendar compatibility
 */

import type { CalendarProvider } from '../types';

/**
 * Foundry User interface for type safety
 */
interface FoundryUser {
  id: string;
  isGM: boolean;
  active: boolean;
}

/**
 * Simple Calendar date object interface
 */
interface SimpleCalendarDate {
  year: number;
  month: number;
  day: number;
  dayOfTheWeek: number;
  hour: number;
  minute: number;
  second: number;
  sunrise: number;
  sunset: number;
  display: {
    monthName: string;
    weekday: string;
  };
}

/**
 * Simple Calendar moon data interface
 */
interface SimpleCalendarMoon {
  color: string;
  currentPhase: {
    icon: string;
  };
}

/**
 * Simple Calendar season data interface
 */
interface SimpleCalendarSeason {
  name: string;
  icon: string;
}

/**
 * Hooks system with internal structure access for debugging
 */
interface HooksSystemWithInternal {
  callAll: (hook: string, ...args: any[]) => void;
  on: (hook: string, callback: Function) => number;
  _hooks?: Record<string, Function[]>;
}

export class HookBridge {
  private provider: CalendarProvider;
  private clockRunning = false;
  private readyEmitted = false;
  private readyTimeoutId?: ReturnType<typeof setTimeout>;
  private isActive = true;

  // Simple Calendar hook names
  private readonly SIMPLE_CALENDAR_HOOKS = {
    Init: 'simple-calendar-init',
    DateTimeChange: 'simple-calendar-date-time-change',
    ClockStartStop: 'simple-calendar-clock-start-stop',
    PrimaryGM: 'simple-calendar-primary-gm',
    Ready: 'simple-calendar-ready',
  };

  constructor(provider: CalendarProvider) {
    this.provider = provider;
  }

  /**
   * Initialize hook bridging between provider and Simple Calendar format
   * @param skipInitHook - If true, don't fire the Init hook (caller will fire it later for timing control)
   */
  initialize(skipInitHook: boolean = false): void {
    console.log(`Simple Calendar Bridge: Setting up hook bridging for ${this.provider.name}`);

    // Listen for provider-specific hooks and translate to Simple Calendar format
    this.setupProviderHooks();

    // Set up Foundry core hooks
    this.setupFoundryHooks();

    // Emit the initialization hook that modules listen for (unless told to skip)
    if (!skipInitHook) {
      console.log('🌉 Simple Calendar Bridge: About to emit Init hook');
      console.log('🌉 Simple Calendar Bridge: Hook name:', this.SIMPLE_CALENDAR_HOOKS.Init);
      console.log(
        '🌉 Simple Calendar Bridge: Registered listeners before Init:',
        (Hooks as HooksSystemWithInternal)._hooks?.[this.SIMPLE_CALENDAR_HOOKS.Init]?.length || 0
      );

      Hooks.callAll(this.SIMPLE_CALENDAR_HOOKS.Init);

      console.log('🌉 Simple Calendar Bridge: Init hook emitted');
      console.log(
        '🌉 Simple Calendar Bridge: renderMainApp listeners after Init:',
        (Hooks as HooksSystemWithInternal)._hooks?.['renderMainApp']?.length || 0
      );
    } else {
      console.log('🌉 Simple Calendar Bridge: Skipping Init hook emission (will be fired later)');
    }

    // Check and emit primary GM hook
    this.triggerPrimaryGMCheck();

    // Emit ready hook after initialization completes
    this.readyTimeoutId = setTimeout(() => {
      if (this.isActive) {
        this.emitReadyHook();
      }
    }, 5000); // Match Simple Calendar's 5-second delay for GMs
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
    Hooks.on('clientSettingChanged', this.onSettingUpdate.bind(this));
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
        seasons: this.getAllSeasons(),
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
  private onSettingUpdate(key: string, _value: unknown, _options: object): void {
    // Check if it's a calendar-related setting
    if (key?.includes('calendar') || key?.includes('time')) {
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
  private getCurrentSimpleCalendarDate(): SimpleCalendarDate | null {
    try {
      const currentDate = this.provider.getCurrentDate();
      if (!currentDate) return null;

      const monthNames = this.provider.getMonthNames();
      const weekdayNames = this.provider.getWeekdayNames();
      const sunriseSunset = this.provider.getSunriseSunset?.(currentDate) || {
        sunrise: 0,
        sunset: 0,
      };
      // Get season info for compatibility (result not currently used)
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      this.provider.getSeasonInfo?.(currentDate) || {
        icon: 'none',
        name: 'Unknown',
      };

      return {
        year: currentDate.year,
        month: currentDate.month - 1, // 0-based for SC compatibility
        day: currentDate.day - 1, // 0-based for SC compatibility
        dayOfTheWeek: currentDate.weekday, // Already 0-based, no conversion needed
        hour: currentDate.time?.hour || 0,
        minute: currentDate.time?.minute || 0,
        second: currentDate.time?.second || 0,
        sunrise: sunriseSunset.sunrise,
        sunset: sunriseSunset.sunset,
        display: {
          monthName: monthNames[currentDate.month - 1] || '',
          weekday: weekdayNames[currentDate.weekday] || '',
          // ... other display properties
        },
      };
    } catch (error) {
      console.warn('Failed to get current Simple Calendar date:', error);
      return null;
    }
  }

  /**
   * Get moon data for compatibility
   */
  private getAllMoons(): SimpleCalendarMoon[] {
    return [
      {
        color: '#ffffff',
        currentPhase: { icon: 'new' },
      },
    ];
  }

  /**
   * Get season data for compatibility
   */
  private getAllSeasons(): SimpleCalendarSeason[] {
    return [
      { name: 'Spring', icon: 'spring' },
      { name: 'Summer', icon: 'summer' },
      { name: 'Fall', icon: 'fall' },
      { name: 'Winter', icon: 'winter' },
    ];
  }

  /**
   * Get the Simple Calendar hook constants for external access
   */
  getHookNames(): typeof this.SIMPLE_CALENDAR_HOOKS {
    return this.SIMPLE_CALENDAR_HOOKS;
  }

  /**
   * Check if current user is primary GM and emit hook if true
   */
  triggerPrimaryGMCheck(): void {
    if (!this.isPrimaryGM()) {
      return;
    }

    console.log('🌉 Simple Calendar Bridge: Emitting PrimaryGM hook');
    Hooks.callAll(this.SIMPLE_CALENDAR_HOOKS.PrimaryGM, {
      isPrimaryGM: true,
    });
  }

  /**
   * Determine if the current user is the primary GM
   * Based on Simple Calendar's logic: first active GM user
   */
  isPrimaryGM(): boolean {
    // Must be a GM to be primary GM
    if (!game?.user?.isGM) {
      return false;
    }

    try {
      // Get all active GM users using Foundry Collection API
      const activeGMs = game.users?.filter((user: FoundryUser) => user.isGM && user.active) ?? [];

      if (activeGMs.length === 0) {
        return false;
      }

      // Sort by ID to ensure consistent primary GM selection
      // Create copy to avoid mutating Collection result
      const sortedGMs = [...activeGMs].sort((a: FoundryUser, b: FoundryUser) =>
        a.id.localeCompare(b.id)
      );

      // First active GM is the primary GM
      return sortedGMs[0]?.id === game.user?.id;
    } catch (error) {
      console.warn('Simple Calendar Bridge: Error determining primary GM:', error);
      return false;
    }
  }

  /**
   * Emit the Ready hook - signals Simple Calendar is fully initialized
   */
  emitReadyHook(): void {
    if (this.readyEmitted) {
      return; // Only emit once
    }

    this.readyEmitted = true;
    console.log('🌉 Simple Calendar Bridge: Emitting Ready hook');
    Hooks.callAll(this.SIMPLE_CALENDAR_HOOKS.Ready);
  }

  /**
   * Clean up resources when bridge is destroyed
   */
  destroy(): void {
    this.isActive = false;
    if (this.readyTimeoutId !== undefined) {
      clearTimeout(this.readyTimeoutId);
      this.readyTimeoutId = undefined;
    }
  }
}
