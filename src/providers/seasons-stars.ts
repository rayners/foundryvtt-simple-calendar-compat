/**
 * Seasons & Stars calendar provider
 */

import { BaseCalendarProvider } from './base-provider';
import type { CalendarDate } from '../types';

export class SeasonsStarsProvider extends BaseCalendarProvider {
  readonly name = 'Seasons & Stars';
  readonly version: string;

  constructor() {
    super();
    this.version = game.modules.get('seasons-and-stars')?.version || '0.1.0';
  }

  static isAvailable(): boolean {
    const module = game.modules.get('seasons-and-stars');
    const api = game.seasonsStars?.api;

    console.log('🌟 Seasons & Stars Provider Debug:');
    console.log('  - module:', module);
    console.log('  - module.active:', module?.active);
    console.log('  - game.seasonsStars:', game.seasonsStars);
    console.log('  - game.seasonsStars.api:', api);

    return !!(module?.active && api);
  }

  getCurrentDate(): CalendarDate | null {
    try {
      const ssDate = game.seasonsStars?.api?.getCurrentDate();
      if (!ssDate) return null;

      return {
        year: ssDate.year,
        month: ssDate.month,
        day: ssDate.day,
        weekday: ssDate.weekday || 0,
        time: ssDate.time || { hour: 0, minute: 0, second: 0 },
      };
    } catch (error) {
      console.warn('Failed to get current date from Seasons & Stars:', error);
      return null;
    }
  }

  worldTimeToDate(timestamp: number): CalendarDate {
    try {
      const ssDate = game.seasonsStars.api.worldTimeToDate(timestamp);
      return {
        year: ssDate.year,
        month: ssDate.month,
        day: ssDate.day,
        weekday: ssDate.weekday || 0,
        time: ssDate.time || { hour: 0, minute: 0, second: 0 },
      };
    } catch (error) {
      console.warn('Failed to convert timestamp to date:', error);
      // Fallback to basic conversion
      const days = Math.floor(timestamp / 86400);
      return {
        year: 2023,
        month: 1,
        day: days + 1,
        weekday: 0,
        time: {
          hour: Math.floor((timestamp % 86400) / 3600),
          minute: Math.floor((timestamp % 3600) / 60),
          second: timestamp % 60,
        },
      };
    }
  }

  dateToWorldTime(date: CalendarDate): number {
    try {
      return game.seasonsStars.api.dateToWorldTime(date);
    } catch (error) {
      console.warn('Failed to convert date to timestamp:', error);
      // Fallback calculation
      return (
        (date.day - 1) * 86400 +
        (date.time?.hour || 0) * 3600 +
        (date.time?.minute || 0) * 60 +
        (date.time?.second || 0)
      );
    }
  }

  formatDate(date: CalendarDate, options?: any): string {
    try {
      if (options?.timeOnly) {
        const hour = (date.time?.hour || 0).toString().padStart(2, '0');
        const minute = (date.time?.minute || 0).toString().padStart(2, '0');
        return `${hour}:${minute}`;
      }

      if (options?.includeTime === false) {
        return game.seasonsStars?.api?.formatDate
          ? game.seasonsStars.api.formatDate(date, { includeTime: false })
          : `${date.day}/${date.month}/${date.year}`;
      }

      return game.seasonsStars?.api?.formatDate
        ? game.seasonsStars.api.formatDate(date, options)
        : `${date.day}/${date.month}/${date.year}`;
    } catch (error) {
      console.warn('Failed to format date:', error);
      if (options?.timeOnly) {
        const hour = (date.time?.hour || 0).toString().padStart(2, '0');
        const minute = (date.time?.minute || 0).toString().padStart(2, '0');
        return `${hour}:${minute}`;
      }
      return `${date.day}/${date.month}/${date.year}`;
    }
  }

  getActiveCalendar(): any {
    try {
      return game.seasonsStars.api.getActiveCalendar();
    } catch (error) {
      console.warn('Failed to get active calendar:', error);
      return null;
    }
  }

  getMonthNames(): string[] {
    try {
      const calendar = this.getActiveCalendar();
      return (
        calendar?.months?.map((m: any) => m.name) || [
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December',
        ]
      );
    } catch (error) {
      console.warn('Failed to get month names:', error);
      return [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];
    }
  }

  getWeekdayNames(): string[] {
    try {
      const calendar = this.getActiveCalendar();
      return (
        calendar?.weekdays?.map((w: any) => w.name) || [
          'Sunday',
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
        ]
      );
    } catch (error) {
      console.warn('Failed to get weekday names:', error);
      return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    }
  }

  getSunriseSunset(date: CalendarDate): { sunrise: number; sunset: number } {
    try {
      // Try to get from calendar if it has astronomical data
      const calendar = this.getActiveCalendar();
      if (calendar?.astronomy) {
        // Use calendar-specific astronomical calculations if available
        return super.getSunriseSunset(date);
      }

      return super.getSunriseSunset(date);
    } catch (error) {
      console.warn('Failed to calculate sunrise/sunset:', error);
      return super.getSunriseSunset(date);
    }
  }

  getSeasonInfo(date: CalendarDate): { icon: string; name: string } {
    try {
      const calendar = this.getActiveCalendar();
      if (calendar?.seasons && calendar.seasons.length > 0) {
        // Use calendar-defined seasons if available
        const monthsPerSeason = Math.ceil(calendar.months.length / calendar.seasons.length);
        const seasonIndex = Math.floor((date.month - 1) / monthsPerSeason);
        const season = calendar.seasons[seasonIndex];

        if (season) {
          return {
            icon: season.icon || season.name.toLowerCase(),
            name: season.name,
          };
        }
      }

      return super.getSeasonInfo(date);
    } catch (error) {
      console.warn('Failed to get season info:', error);
      return super.getSeasonInfo(date);
    }
  }

  getYearFormatting(): { prefix: string; suffix: string } {
    try {
      const calendar = this.getActiveCalendar();
      return {
        prefix: calendar?.year?.prefix || '',
        suffix: calendar?.year?.suffix || '',
      };
    } catch (error) {
      console.warn('Failed to get year formatting:', error);
      return super.getYearFormatting();
    }
  }

  // GM time advancement methods
  async advanceDays(days: number): Promise<void> {
    try {
      if (game.seasonsStars?.api?.advanceDays) {
        await game.seasonsStars.api.advanceDays(days);
      } else {
        console.warn('Seasons & Stars does not support day advancement');
      }
    } catch (error) {
      console.error('Failed to advance days:', error);
      throw error;
    }
  }

  async advanceHours(hours: number): Promise<void> {
    try {
      if (game.seasonsStars?.api?.advanceHours) {
        await game.seasonsStars.api.advanceHours(hours);
      } else {
        console.warn('Seasons & Stars does not support hour advancement');
      }
    } catch (error) {
      console.error('Failed to advance hours:', error);
      throw error;
    }
  }

  async advanceMinutes(minutes: number): Promise<void> {
    try {
      if (game.seasonsStars?.api?.advanceMinutes) {
        await game.seasonsStars.api.advanceMinutes(minutes);
      } else {
        console.warn('Seasons & Stars does not support minute advancement');
      }
    } catch (error) {
      console.error('Failed to advance minutes:', error);
      throw error;
    }
  }
}
