/**
 * Simple Calendar Import Service
 *
 * Handles one-time migration of Simple Calendar data into Seasons & Stars format.
 * Provides UI controls for importing calendars and notes from Simple Calendar settings.
 */

import { SimpleCalendarConverter } from './simple-calendar-converter';
import type { SimpleCalendarData } from './simple-calendar-types';

export class SimpleCalendarImporter {
  /**
   * Import calendar from Simple Calendar world settings into S&S Calendar Builder
   *
   * @returns Promise<boolean> Success status
   */
  async importCalendarFromSettings(): Promise<boolean> {
    try {
      // Check if S&S API is available
      const ssApi = (game as any).seasonsStars?.api;
      if (!ssApi?.calendarBuilder?.importJson) {
        ui.notifications?.error('Seasons & Stars Calendar Builder API not available');
        return false;
      }

      // Get Simple Calendar data from world settings
      const scData = this.getSimpleCalendarData();
      if (!scData) {
        ui.notifications?.error('No Simple Calendar configuration found in world settings');
        return false;
      }

      // Convert Simple Calendar data to S&S format
      const converter = new SimpleCalendarConverter();
      const result = converter.convert(scData, 'simple-calendar-settings');

      if (!result.calendar) {
        ui.notifications?.error('Failed to convert Simple Calendar data');
        console.error('Conversion warnings:', result.warnings);
        return false;
      }

      // Show warnings if any
      if (result.warnings.length > 0) {
        console.warn('Calendar conversion warnings:', result.warnings);
        ui.notifications?.warn(
          `Calendar converted with ${result.warnings.length} warning(s). Check console for details.`
        );
      }

      // Import into Calendar Builder
      const calendarJson = JSON.stringify(result.calendar, null, 2);
      await ssApi.calendarBuilder.importJson(calendarJson, 'simple-calendar-settings');

      ui.notifications?.info('Simple Calendar configuration imported into Calendar Builder');
      return true;
    } catch (error) {
      console.error('Failed to import Simple Calendar configuration:', error);
      ui.notifications?.error('Failed to import calendar configuration');
      return false;
    }
  }

  /**
   * Import notes from Simple Calendar into S&S notes system
   *
   * NOTE: This is a placeholder for future implementation.
   * Simple Calendar stores notes as JournalEntry documents with specific flags.
   * The actual migration would involve:
   * 1. Finding all JournalEntry documents with Simple Calendar flags
   * 2. Converting date formats (0-based to 1-based)
   * 3. Re-flagging with S&S format while preserving original data
   * 4. Updating S&S storage index
   *
   * @returns Promise<number> Number of notes imported
   */
  async importNotesFromSimpleCalendar(): Promise<number> {
    try {
      // Check if S&S notes API is available
      const ssNotes = (game as any).seasonsStars?.notes;
      if (!ssNotes) {
        ui.notifications?.error('Seasons & Stars notes system not available');
        return 0;
      }

      // Find all Simple Calendar notes
      const scNotes = this.findSimpleCalendarNotes();
      if (scNotes.length === 0) {
        ui.notifications?.info('No Simple Calendar notes found to import');
        return 0;
      }

      let importedCount = 0;
      for (const note of scNotes) {
        try {
          await this.convertNote(note);
          importedCount++;
        } catch (error) {
          console.error(`Failed to convert note ${note.name}:`, error);
        }
      }

      if (importedCount > 0) {
        // Trigger S&S storage reindex
        if (ssNotes.storage?.rebuildIndex) {
          ssNotes.storage.rebuildIndex();
        }

        ui.notifications?.info(`Imported ${importedCount} note(s) from Simple Calendar`);
      }

      return importedCount;
    } catch (error) {
      console.error('Failed to import Simple Calendar notes:', error);
      ui.notifications?.error('Failed to import notes');
      return 0;
    }
  }

  /**
   * Get Simple Calendar data from world settings
   */
  private getSimpleCalendarData(): SimpleCalendarData | null {
    try {
      // Simple Calendar stores its data in 'foundryvtt-simple-calendar.global-configuration'
      const scSettings = game.settings?.get('foundryvtt-simple-calendar', 'global-configuration');
      if (!scSettings) {
        return null;
      }

      // Extract the current calendar data
      const scData = (scSettings as any)?.currentDate || (scSettings as any);
      return scData as SimpleCalendarData;
    } catch (error) {
      console.warn('Could not retrieve Simple Calendar settings:', error);
      return null;
    }
  }

  /**
   * Find all JournalEntry documents that are Simple Calendar notes
   */
  private findSimpleCalendarNotes(): any[] {
    if (!game.journal) {
      return [];
    }

    // Find journal entries with Simple Calendar flags
    return game.journal.filter((journal: any) => {
      const scFlags = journal.flags?.['foundryvtt-simple-calendar'];
      return scFlags?.noteData || scFlags?.calendarNote;
    });
  }

  /**
   * Convert a Simple Calendar note to S&S format
   */
  private async convertNote(note: any): Promise<void> {
    const scFlags = note.flags?.['foundryvtt-simple-calendar'];
    if (!scFlags?.noteData) {
      return;
    }

    const noteData = scFlags.noteData;

    // Convert Simple Calendar date format (0-based) to S&S format (1-based)
    const startDate = noteData.startDate;
    const endDate = noteData.endDate;

    const ssStartDate = startDate
      ? {
          year: startDate.year || 0,
          month: (startDate.month || 0) + 1, // Convert 0-based to 1-based
          day: (startDate.day || 0) + 1, // Convert 0-based to 1-based
          hour: startDate.hour || 0,
          minute: startDate.minute || 0,
          second: startDate.second || 0,
        }
      : undefined;

    const ssEndDate = endDate
      ? {
          year: endDate.year || 0,
          month: (endDate.month || 0) + 1, // Convert 0-based to 1-based
          day: (endDate.day || 0) + 1, // Convert 0-based to 1-based
          hour: endDate.hour || 0,
          minute: endDate.minute || 0,
          second: endDate.second || 0,
        }
      : undefined;

    // Create S&S calendar note flags while preserving original SC flags
    await note.setFlag('seasons-and-stars', 'calendarNote', true);
    await note.setFlag('seasons-and-stars', 'version', '1.0');
    await note.setFlag('seasons-and-stars', 'startDate', ssStartDate);
    if (ssEndDate) {
      await note.setFlag('seasons-and-stars', 'endDate', ssEndDate);
    }
    await note.setFlag('seasons-and-stars', 'allDay', noteData.allDay || false);
    await note.setFlag('seasons-and-stars', 'calendarId', 'seasons-and-stars');
    await note.setFlag('seasons-and-stars', 'category', noteData.categories?.[0] || 'general');
    await note.setFlag('seasons-and-stars', 'created', noteData.createdTimestamp || Date.now());
    await note.setFlag('seasons-and-stars', 'modified', Date.now());

    // Create dateKey for efficient lookup
    if (ssStartDate) {
      const dateKey = `${ssStartDate.year}-${ssStartDate.month}-${ssStartDate.day}`;
      await note.setFlag('seasons-and-stars', 'dateKey', dateKey);
    }

    // Add migration tracking flag
    await note.setFlag('foundryvtt-simple-calendar-compat', 'migrated', true);
    await note.setFlag('foundryvtt-simple-calendar-compat', 'migrationDate', Date.now());
  }

  /**
   * Check if the import button should be visible
   * Returns true if Simple Calendar data is available and hasn't been imported yet
   */
  shouldShowImportButton(): boolean {
    // Check if Simple Calendar module exists
    const scModule = game.modules?.get('foundryvtt-simple-calendar');
    if (!scModule) {
      return false;
    }

    // Check if Simple Calendar data exists in settings
    const scData = this.getSimpleCalendarData();
    if (!scData) {
      return false;
    }

    // Check if we've already imported (stored in compat module settings)
    try {
      const alreadyImported = game.settings?.get(
        'foundryvtt-simple-calendar-compat',
        'calendar-imported'
      );
      if (alreadyImported) {
        return false;
      }
    } catch {
      // Setting doesn't exist yet, show button
    }

    return true;
  }

  /**
   * Mark calendar as imported to hide the button
   */
  async markCalendarAsImported(): Promise<void> {
    try {
      await game.settings?.set('foundryvtt-simple-calendar-compat', 'calendar-imported', true);
    } catch (error) {
      console.warn('Could not mark calendar as imported:', error);
    }
  }
}
