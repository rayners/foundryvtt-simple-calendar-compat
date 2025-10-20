/**
 * Base provider class that defines the interface calendar modules should implement
 */

import type { CalendarProvider, CalendarDate } from '../types';

export abstract class BaseCalendarProvider implements CalendarProvider {
  abstract readonly name: string;
  abstract readonly version: string;

  // Core required methods
  abstract getCurrentDate(): CalendarDate | null;
  abstract worldTimeToDate(timestamp: number): CalendarDate;
  abstract dateToWorldTime(date: CalendarDate): number;
  abstract formatDate(date: CalendarDate, options?: any): string;
  abstract getActiveCalendar(): any;
  abstract getMonthNames(): string[];
  abstract getWeekdayNames(): string[];

  // Default implementations for optional methods
  getSunriseSunset(date: CalendarDate): { sunrise: number; sunset: number } {
    // Default: 6 AM sunrise, 6 PM sunset
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
    // Default seasonal calculation based on month (Northern Hemisphere)
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

  getYearFormatting(): { prefix: string; suffix: string } {
    return { prefix: '', suffix: '' };
  }

  // Optional GM methods - default to no-op
  async advanceDays(_days: number): Promise<void> {
    console.warn(`${this.name} provider does not support time advancement`);
  }

  async advanceHours(_hours: number): Promise<void> {
    console.warn(`${this.name} provider does not support time advancement`);
  }

  async advanceMinutes(_minutes: number): Promise<void> {
    console.warn(`${this.name} provider does not support time advancement`);
  }

  // Utility methods
  protected getOrdinalSuffix(day: number): string {
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

  protected validateMonth(month: number, monthNames: string[]): boolean {
    return month >= 1 && month <= monthNames.length;
  }

  protected getCurrentTimestamp(): number {
    return game.time?.worldTime || 0;
  }
}
