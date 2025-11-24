/**
 * Simple Calendar Import Button Registration
 *
 * Registers sidebar buttons with Seasons & Stars buttonRegistry to trigger
 * calendar and notes import functionality.
 */

import { SimpleCalendarImporter } from './simple-calendar-importer';

export class ButtonRegistration {
  private importer: SimpleCalendarImporter;
  private registered = false;

  constructor() {
    this.importer = new SimpleCalendarImporter();
  }

  /**
   * Register import buttons with Seasons & Stars buttonRegistry
   * Should be called during seasons-stars:ready hook
   */
  register(): void {
    if (this.registered) {
      console.log('🌉 Simple Calendar Compat: Import buttons already registered');
      return;
    }

    const buttonRegistry = (game as any).seasonsStars?.buttonRegistry;
    if (!buttonRegistry) {
      console.warn('🌉 Simple Calendar Compat: Button registry not available');
      return;
    }

    // Register calendar import button if applicable
    if (this.importer.shouldShowImportButton()) {
      buttonRegistry.register({
        name: 'simple-calendar-import-calendar',
        icon: 'fas fa-file-import',
        tooltip: 'Import Simple Calendar Configuration',
        callback: async () => {
          await this.handleCalendarImport();
        },
        only: ['main', 'grid'], // Only show on main and grid widgets
      });
      console.log('🌉 Simple Calendar Compat: Registered calendar import button');
    }

    // Register notes import button (always available if SC data exists)
    const scModule = game.modules?.get('foundryvtt-simple-calendar');
    if (scModule) {
      buttonRegistry.register({
        name: 'simple-calendar-import-notes',
        icon: 'fas fa-sticky-note',
        tooltip: 'Import Simple Calendar Notes',
        callback: async () => {
          await this.handleNotesImport();
        },
        only: ['main', 'grid'], // Only show on main and grid widgets
      });
      console.log('🌉 Simple Calendar Compat: Registered notes import button');
    }

    this.registered = true;
  }

  /**
   * Unregister import buttons from buttonRegistry
   */
  unregister(): void {
    if (!this.registered) {
      return;
    }

    const buttonRegistry = (game as any).seasonsStars?.buttonRegistry;
    if (!buttonRegistry) {
      return;
    }

    buttonRegistry.unregister('simple-calendar-import-calendar');
    buttonRegistry.unregister('simple-calendar-import-notes');

    this.registered = false;
    console.log('🌉 Simple Calendar Compat: Unregistered import buttons');
  }

  /**
   * Handle calendar import button click
   */
  private async handleCalendarImport(): Promise<void> {
    try {
      const success = await this.importer.importCalendarFromSettings();

      if (success) {
        // Mark as imported and hide the button
        await this.importer.markCalendarAsImported();

        // Unregister the calendar import button since it's now imported
        const buttonRegistry = (game as any).seasonsStars?.buttonRegistry;
        if (buttonRegistry) {
          buttonRegistry.unregister('simple-calendar-import-calendar');
          console.log(
            '🌉 Simple Calendar Compat: Removed calendar import button after successful import'
          );
        }
      }
    } catch (error) {
      console.error('🌉 Simple Calendar Compat: Calendar import failed:', error);
      ui.notifications?.error('Failed to import Simple Calendar configuration');
    }
  }

  /**
   * Handle notes import button click
   */
  private async handleNotesImport(): Promise<void> {
    try {
      const count = await this.importer.importNotesFromSimpleCalendar();

      if (count > 0) {
        ui.notifications?.info(`Successfully imported ${count} note(s) from Simple Calendar`);
      }
    } catch (error) {
      console.error('🌉 Simple Calendar Compat: Notes import failed:', error);
      ui.notifications?.error('Failed to import Simple Calendar notes');
    }
  }
}
