/**
 * Simple Calendar Compatibility Bridge
 * Provides Simple Calendar API compatibility for modern calendar modules
 */

import { SeasonsStarsProvider } from './providers/seasons-stars';
import { SeasonsStarsIntegrationProvider } from './providers/seasons-stars-integration';
import { SimpleCalendarAPIBridge, Icons } from './api/simple-calendar-api';
import { HookBridge } from './api/hooks';
import type { CalendarProvider } from './types';

/**
 * CRITICAL: Expose SimpleCalendar immediately at module parse time
 * Simple Weather checks for 'SimpleCalendar' in globalThis when its module script loads
 * This must happen before any hooks, at the top level of our module
 */
console.log(
  '🌉 Simple Calendar Compatibility Bridge | Exposing SimpleCalendar at module parse time'
);

// Create a minimal SimpleCalendar object that Simple Weather can detect
const moduleParseTimeSimpleCalendar = {
  api: {
    timestampToDate: () => ({ display: { monthName: '', day: '1', year: '2024' } }),
    getCurrentDate: () => ({ display: { monthName: '', day: '1', year: '2024' } }),
  },
  Hooks: {
    DateTimeChange: 'simple-calendar-date-time-change',
    Init: 'simple-calendar-init',
    ClockStartStop: 'simple-calendar-clock-start-stop',
  },
};

// Expose globally immediately - this happens when the module script is parsed
(window as any).SimpleCalendar = moduleParseTimeSimpleCalendar;
(globalThis as any).SimpleCalendar = moduleParseTimeSimpleCalendar;

console.log(
  '🌉 Simple Calendar Compatibility Bridge | SimpleCalendar exposed at parse time - Simple Weather should detect it'
);

// Add minimal CSS classes that Simple Weather expects for attached mode
const compatCSS = `
  /* Minimal Simple Calendar compatibility classes for Simple Weather attached mode */
  .fsc-of {
    /* Tab wrapper - basic flex container */
    display: flex;
    flex-direction: column;
    position: relative;
  }
  
  .fsc-c {
    /* Tab extended/open state - visible */
    display: block;
  }
  
  .fsc-d {
    /* Tab closed state - hidden */
    display: none;
  }
  
  .sc-right {
    /* Right-aligned positioning - only within attached mode */
    margin-left: auto;
  }
  
  #swr-fsc-container {
    /* Simple Weather attached container */
    position: relative;
    z-index: 100;
    max-width: 300px;
    margin-top: 8px;
  }
  
  /* Only apply these styles when Simple Weather is in attached mode */
  #swr-fsc-container #swr-container {
    /* Simple Weather main container when attached */
    position: relative !important;
    background: var(--color-bg);
    border: 1px solid var(--color-border-dark);
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  }
  
  /* Ensure non-attached mode isn't affected by our CSS */
  #swr-container:not(#swr-fsc-container #swr-container) {
    /* Reset any unwanted styling for non-attached mode */
    margin-left: unset !important;
  }
`;

// Inject the CSS into the document head
const style = document.createElement('style');
style.textContent = compatCSS;
document.head.appendChild(style);

console.log(
  '🌉 Simple Calendar Compatibility Bridge | Minimal CSS classes added for attached mode'
);

class SimpleCalendarCompatibilityBridge {
  private provider: CalendarProvider | null = null;
  private api: SimpleCalendarAPIBridge | null = null;
  private hookBridge: HookBridge | null = null;

  /**
   * Initialize the compatibility bridge synchronously for immediate API availability
   * Critical for ensuring API is ready when Item Piles ready hook fires
   */
  initializeSync(): void {
    console.log('🌉 Simple Calendar Compatibility Bridge | Initializing synchronously...');

    // Check if Simple Calendar is already active (but not our fake module)
    const existingModule = game.modules.get('foundryvtt-simple-calendar');
    if (
      existingModule?.active &&
      existingModule.title !== 'Simple Calendar (Compatibility Bridge)'
    ) {
      console.log(
        '🌉 Simple Calendar Compatibility Bridge | Real Simple Calendar is active - bridge not needed'
      );
      return;
    }

    // Detect available calendar providers (for backward compatibility)
    this.provider = this.detectCalendarProvider();

    if (!this.provider) {
      console.warn('🌉 Simple Calendar Compatibility Bridge | No supported calendar module found');
      ui.notifications?.warn(game.i18n.localize('SIMPLE_CALENDAR_COMPAT.PROVIDER_NOT_FOUND'));
      return;
    }

    console.log(
      `🌉 Simple Calendar Compatibility Bridge | Using provider: ${this.provider.name} v${this.provider.version}`
    );

    // Create API bridge - detects integration interface internally
    this.api = new SimpleCalendarAPIBridge();

    // Create hook bridge using provider for compatibility
    this.hookBridge = new HookBridge(this.provider);

    // Expose Simple Calendar API synchronously
    this.exposeSimpleCalendarAPI();

    // Initialize hook bridging synchronously
    this.hookBridge.initialize();

    // Set up integration with Seasons & Stars widgets
    this.setupWidgetIntegration();

    console.log(
      '🌉 Simple Calendar Compatibility Bridge | Ready synchronously - API immediately available'
    );
    ui.notifications?.info(game.i18n.localize('SIMPLE_CALENDAR_COMPAT.API_READY'));
  }

  /**
   * Initialize the compatibility bridge
   */
  async initialize(): Promise<void> {
    console.log('🌉 Simple Calendar Compatibility Bridge | Initializing...');

    // Check if Simple Calendar is already active (but not our fake module)
    const existingModule = game.modules.get('foundryvtt-simple-calendar');
    if (
      existingModule?.active &&
      existingModule.title !== 'Simple Calendar (Compatibility Bridge)'
    ) {
      console.log(
        '🌉 Simple Calendar Compatibility Bridge | Real Simple Calendar is active - bridge not needed'
      );
      return;
    }

    // Detect available calendar providers (for backward compatibility)
    this.provider = this.detectCalendarProvider();

    if (!this.provider) {
      console.warn('🌉 Simple Calendar Compatibility Bridge | No supported calendar module found');
      ui.notifications?.warn(game.i18n.localize('SIMPLE_CALENDAR_COMPAT.PROVIDER_NOT_FOUND'));
      return;
    }

    console.log(
      `🌉 Simple Calendar Compatibility Bridge | Using provider: ${this.provider.name} v${this.provider.version}`
    );

    // Create API bridge - detects integration interface internally
    this.api = new SimpleCalendarAPIBridge();

    // Create hook bridge using provider for compatibility
    this.hookBridge = new HookBridge(this.provider);

    // Expose Simple Calendar API
    this.exposeSimpleCalendarAPI();

    // Initialize hook bridging
    this.hookBridge.initialize();

    // Set up integration with Seasons & Stars widgets
    this.setupWidgetIntegration();

    console.log('🌉 Simple Calendar Compatibility Bridge | Ready');
    ui.notifications?.info(game.i18n.localize('SIMPLE_CALENDAR_COMPAT.API_READY'));
  }

  /**
   * Detect available calendar providers in priority order
   */
  private detectCalendarProvider(): CalendarProvider | null {
    console.log('🌉 Detecting calendar providers...');
    console.log('🌉 Available modules:', Array.from(game.modules?.keys() || []));
    console.log('🌉 game.seasonsStars available:', !!(game as any).seasonsStars);

    // Priority 1: Seasons & Stars Integration Interface (v2.0+)
    if (SeasonsStarsIntegrationProvider.isAvailable()) {
      console.log('🌉 Seasons & Stars integration provider is available');
      return new SeasonsStarsIntegrationProvider();
    }

    // Priority 2: Seasons & Stars Legacy Provider (v1.x)
    if (SeasonsStarsProvider.isAvailable()) {
      console.log('🌉 Seasons & Stars legacy provider is available');
      return new SeasonsStarsProvider();
    } else {
      console.log('🌉 No Seasons & Stars providers available');
    }

    // Priority 2: About Time (future implementation)
    // if (AboutTimeProvider.isAvailable()) {
    //   return new AboutTimeProvider();
    // }

    // Priority 3: Other calendar modules (future)

    console.log('🌉 No calendar providers found');
    return null;
  }

  /**
   * Expose the Simple Calendar API to the global scope
   */
  private exposeSimpleCalendarAPI(): void {
    if (!this.api || !this.hookBridge) {
      throw new Error('API or Hook bridge not initialized');
    }

    console.log('🌉 Exposing Simple Calendar API...');
    console.log('🌉 API object:', this.api);
    console.log('🌉 Testing getCurrentDate:', this.api.getCurrentDate());
    console.log('🌉 Testing timestamp:', this.api.timestamp());

    // Replace any temporary SimpleCalendar object with the full bridge
    console.log('🌉 Replacing temporary SimpleCalendar with full bridge');

    // Create the global SimpleCalendar object that modules expect
    // Simple Weather checks for SimpleCalendar in globalThis, not window
    (window as any).SimpleCalendar = {
      api: this.api,
      Hooks: this.hookBridge.getHookNames(),
      Icons: Icons,
    };

    // Also expose in globalThis for Simple Weather compatibility
    (globalThis as any).SimpleCalendar = {
      api: this.api,
      Hooks: this.hookBridge.getHookNames(),
      Icons: Icons,
    };

    console.log('🌉 SimpleCalendar.api exposed:', !!(globalThis as any).SimpleCalendar?.api);
    console.log(
      '🌉 SimpleCalendar.api.getCurrentDate:',
      typeof (globalThis as any).SimpleCalendar?.api?.getCurrentDate
    );

    // Register fake Simple Calendar module for dependency checking
    this.registerFakeSimpleCalendarModule();

    // Also add to game object for easier access
    (game as any).simpleCalendarCompat = {
      provider: this.provider,
      api: this.api,
      version: game.modules.get('foundryvtt-simple-calendar-compat')?.version || '0.1.0',
    };

    console.log('🌉 Simple Calendar Compatibility Bridge | API exposed globally');
  }

  /**
   * Register a fake Simple Calendar module entry for dependency checking
   */
  registerFakeSimpleCalendarModule(): void {
    // Check if we should register the fake module
    // If Simple Weather is set to detached mode, don't register so it shows its own UI
    const simpleWeatherModule = game.modules.get('foundryvtt-simple-weather');
    if (simpleWeatherModule?.active) {
      const attachedToSC = game.settings?.get('foundryvtt-simple-weather', 'attachToCalendar');
      if (attachedToSC === false) {
        console.log(
          '🌉 Simple Calendar Compatibility Bridge | Simple Weather is in detached mode, skipping fake module registration'
        );
        return;
      }
    }

    // Create a complete module object that satisfies all Foundry systems
    const fakeModule = {
      id: 'foundryvtt-simple-calendar',
      title: 'Simple Calendar (Compatibility Bridge)',
      active: true,
      version: '2.4.18', // Version that Simple Weather expects
      compatibility: {
        minimum: '13',
        verified: '13',
        maximum: '13',
      },
      // Required arrays that Foundry expects
      authors: [{ name: 'Simple Calendar Compatibility Bridge' }],
      esmodules: [],
      styles: [],
      languages: [],
      packs: [],
      scripts: [],
      relationships: {
        requires: [],
        recommends: [],
        conflicts: [],
        systems: [], // Required by ModuleManagement
      },
      // Additional properties from module manifest
      description: 'Compatibility bridge providing Simple Calendar API for modern calendar modules',
      url: '',
      readme: '',
      bugs: '',
      flags: {},
      socket: false,

      // Add toObject method that Foundry's ModuleManagement expects
      toObject: function () {
        return {
          id: this.id,
          title: this.title,
          description: this.description,
          authors: this.authors,
          url: this.url,
          readme: this.readme,
          bugs: this.bugs,
          version: this.version,
          compatibility: this.compatibility,
          relationships: this.relationships,
          packs: this.packs,
          scripts: this.scripts,
          styles: this.styles,
          languages: this.languages,
          esmodules: this.esmodules,
          flags: this.flags,
          socket: this.socket,
        };
      },

      // Add getVersionBadge method that Foundry's ModuleManagement expects
      getVersionBadge: function () {
        return {
          type: 'success',
          tooltip: `Simple Calendar Compatibility Bridge v${this.version}`,
          label: this.version,
          icon: 'fa-check',
        };
      },
    };

    // Add to game.modules
    if (game.modules && !game.modules.get('foundryvtt-simple-calendar')) {
      // Use the internal modules collection to register our fake module
      (game.modules as any).set('foundryvtt-simple-calendar', fakeModule);
      console.log(
        '🌉 Simple Calendar Compatibility Bridge | Registered fake Simple Calendar module entry'
      );
    }
  }

  /**
   * Set up integration with Seasons & Stars widgets to support Simple Weather
   */
  public setupWidgetIntegration(): void {
    console.log('🌉 Simple Calendar Compatibility Bridge | Setting up widget integration');

    // Immediately check for existing widgets
    this.integrateWithSeasonsStarsWidgets();

    // Listen for specific widget renders (DOM is ready when this hook fires)
    Hooks.on('renderApplication', (app: any, html: JQuery) => {
      if (
        app.constructor.name === 'CalendarWidget' ||
        app.constructor.name === 'CalendarMiniWidget'
      ) {
        // DOM is ready, integrate immediately
        this.integrateWithSpecificWidget(html);
      }
    });

    // Also use MutationObserver for widgets created outside the normal render cycle
    this.setupDOMObserver();
  }

  /**
   * Set up DOM observer to detect new calendar widgets
   */
  private setupDOMObserver(): void {
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (
              element.matches?.('.calendar-widget, .calendar-mini-widget') ||
              element.querySelector?.('.calendar-widget, .calendar-mini-widget')
            ) {
              // New widget detected, integrate it
              this.integrateWithSeasonsStarsWidgets();
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Store for cleanup
    (this as any).domObserver = observer;
  }

  /**
   * Integrate with a specific widget (from renderApplication hook)
   */
  private integrateWithSpecificWidget(html: JQuery): void {
    console.log('🌉 Simple Calendar Compatibility Bridge | Integrating with specific widget');

    // Add Simple Calendar CSS classes that Simple Weather expects
    this.addSimpleCalendarCompatibility(html);

    // Create fake app and emit hook
    const fakeApp = {
      constructor: { name: 'SimpleCalendar' },
      id: 'simple-calendar-app',
      element: html[0],
      rendered: true,
    };

    // Emit hook immediately - Simple Weather should be ready to handle it
    console.log(
      '🌉 Simple Calendar Compatibility Bridge | Emitting renderMainApp hook for specific widget'
    );
    Hooks.callAll('renderMainApp', fakeApp, html);

    // Add any existing sidebar buttons
    this.addExistingSidebarButtons(html);
  }

  /**
   * Integrate with existing Seasons & Stars widgets to trigger Simple Weather
   */
  public integrateWithSeasonsStarsWidgets(): void {
    // Find Seasons & Stars calendar widgets
    const calendarWidgets = document.querySelectorAll('.calendar-widget, .calendar-mini-widget');

    if (calendarWidgets.length === 0) {
      console.log('🌉 Simple Calendar Compatibility Bridge | No S&S widgets found yet');
      return;
    }

    console.log(
      `🌉 Simple Calendar Compatibility Bridge | Found ${calendarWidgets.length} S&S widget(s), triggering Simple Weather integration`
    );

    calendarWidgets.forEach(widget => {
      const $html = $(widget);

      // Add Simple Calendar compatibility to this widget
      this.addSimpleCalendarCompatibility($html);

      // Create fake app and emit hook for this widget
      const fakeApp = {
        constructor: { name: 'SimpleCalendar' },
        id: 'simple-calendar-app',
        element: widget,
        rendered: true,
      };

      // Emit hook immediately - no delay needed
      console.log('🌉 Simple Calendar Compatibility Bridge | Emitting renderMainApp hook');
      console.log('🌉 Simple Calendar Compatibility Bridge | Hook details:', {
        hookName: 'renderMainApp',
        fakeApp: fakeApp,
        widgetElement: widget,
        hasJQuery: !!$html.length,
      });

      // Check if Simple Weather has registered listeners for this hook
      const hookListeners = (Hooks as any)._hooks?.['renderMainApp'] || [];
      console.log(
        '🌉 Simple Calendar Compatibility Bridge | renderMainApp hook listeners:',
        hookListeners.length
      );

      Hooks.callAll('renderMainApp', fakeApp, $html);
      console.log('🌉 Simple Calendar Compatibility Bridge | renderMainApp hook emitted');

      // Add existing sidebar buttons to this widget
      this.addExistingSidebarButtons($html);
    });
  }

  /**
   * Add Simple Calendar CSS classes and structure to a widget
   */
  private addSimpleCalendarCompatibility($widget: JQuery<any>): void {
    console.log(
      '🌉 Simple Calendar Compatibility Bridge | Adding compatibility to widget:',
      $widget.get(0)
    );

    if ($widget.hasClass('simple-calendar-compat')) {
      console.log(
        '🌉 Simple Calendar Compatibility Bridge | Widget already has compatibility structure'
      );
      return; // Already has compatibility structure
    }

    // Add compatibility indicator class
    $widget.addClass('simple-calendar-compat');
    console.log('🌉 Simple Calendar Compatibility Bridge | Added simple-calendar-compat class');

    // Simple Weather expects specific DOM structure for attached mode:
    // - Element with ID 'fsc-if' (SC_ID_FOR_WINDOW_WRAPPER)
    // - Contains .window-content
    // - Has panels with classes 'fsc-of' (SC_CLASS_FOR_TAB_WRAPPER) and 'fsc-d' (SC_CLASS_FOR_TAB_CLOSED)

    // Add the required ID to the widget for Simple Weather to find
    if (!$widget.attr('id')) {
      $widget.attr('id', 'fsc-if');
      console.log('🌉 Simple Calendar Compatibility Bridge | Added fsc-if ID to widget');
    }

    // Ensure the widget has window-content structure
    let $windowContent = $widget.find('.window-content');
    if (!$windowContent.length) {
      // Find the main content area and wrap it or use the widget itself
      $windowContent = $widget.hasClass('window-content') ? $widget : $widget;
      $windowContent.addClass('window-content');
      console.log('🌉 Simple Calendar Compatibility Bridge | Added window-content class');
    }

    // Add a dummy closed tab panel that Simple Weather can use for positioning
    // This gives Simple Weather a reference point to attach its weather panel
    const dummyPanelId = 'sc-compat-dummy-panel';
    if (!$windowContent.find(`#${dummyPanelId}`).length) {
      const $dummyPanel = $(`
        <div id="${dummyPanelId}" class="fsc-of fsc-d" style="display: none;">
          <!-- Dummy panel for Simple Weather positioning -->
        </div>
      `);
      $windowContent.append($dummyPanel);
      console.log(
        '🌉 Simple Calendar Compatibility Bridge | Added dummy panel for Simple Weather positioning'
      );
    }

    console.log(
      '🌉 Simple Calendar Compatibility Bridge | Compatibility structure added successfully'
    );
  }

  /**
   * Add any existing sidebar buttons to a specific widget
   */
  private addExistingSidebarButtons($widget: JQuery<any>): void {
    if (this.api?.sidebarButtons && this.api.sidebarButtons.length > 0) {
      console.log(
        `🌉 Simple Calendar Compatibility Bridge | Adding ${this.api.sidebarButtons.length} sidebar buttons to widget`
      );
      this.api.sidebarButtons.forEach((button: any) => {
        this.addButtonToSpecificWidget(
          $widget,
          button.name,
          button.icon,
          button.tooltip,
          button.callback
        );
      });
    } else {
      console.log('🌉 Simple Calendar Compatibility Bridge | No sidebar buttons to add');
    }
  }

  /**
   * Add a button to a specific widget using proper widget API when possible
   */
  private addButtonToSpecificWidget(
    $widget: JQuery,
    name: string,
    icon: string,
    tooltip: string,
    callback: Function
  ): void {
    // First try to use Seasons & Stars widget API directly
    if (
      $widget.hasClass('calendar-widget') &&
      game.seasonsStars?.manager?.widgets?.CalendarWidget
    ) {
      console.log(
        `🌉 Simple Calendar Compatibility Bridge | Using Seasons & Stars CalendarWidget API for button "${name}"`
      );
      try {
        const CalendarWidgetClass = game.seasonsStars.manager.widgets.CalendarWidget;
        const calendarWidget = CalendarWidgetClass.getInstance();

        if (calendarWidget && typeof calendarWidget.addSidebarButton === 'function') {
          // Check if button already exists to avoid duplicates
          const existingButton = calendarWidget.sidebarButtons?.find(
            (btn: any) => btn.name === name
          );
          if (existingButton) {
            console.log(
              `🌉 Simple Calendar Compatibility Bridge | Button "${name}" already exists in widget's sidebar buttons`
            );
            return;
          }

          calendarWidget.addSidebarButton(name, icon, tooltip, callback);
          console.log(
            `🌉 Simple Calendar Compatibility Bridge | Successfully added "${name}" button via Seasons & Stars widget API`
          );
          return;
        } else {
          console.log(
            `🌉 Simple Calendar Compatibility Bridge | CalendarWidget instance not available or doesn't support addSidebarButton`
          );
          console.log(`🌉 Simple Calendar Compatibility Bridge | Instance:`, calendarWidget);
        }
      } catch (error) {
        console.warn(
          `🌉 Simple Calendar Compatibility Bridge | Failed to use Seasons & Stars widget API:`,
          error
        );
      }
    }

    // Fall back to DOM manipulation for mini widgets or if API doesn't work
    console.log(
      `🌉 Simple Calendar Compatibility Bridge | Using DOM manipulation for button "${name}"`
    );
    this.addButtonToSpecificWidgetViaDOM($widget, name, icon, tooltip, callback);
  }

  /**
   * Fallback method: Add button via DOM manipulation
   */
  private addButtonToSpecificWidgetViaDOM(
    $widget: JQuery,
    name: string,
    icon: string,
    tooltip: string,
    callback: Function
  ): void {
    const buttonId = `simple-weather-button-${name.toLowerCase().replace(/\s+/g, '-')}`;

    // Don't add if already exists
    if ($widget.find(`#${buttonId}`).length > 0) {
      console.log(
        `🌉 Simple Calendar Compatibility Bridge | Button "${name}" already exists on widget`
      );
      return;
    }

    console.log(
      `🌉 Simple Calendar Compatibility Bridge | Adding button "${name}" to widget via DOM`
    );

    // Look for a good place to add the button
    let $targetLocation: JQuery<HTMLElement> = $();

    if ($widget.hasClass('calendar-widget')) {
      // For full calendar widget, try window-header first
      $targetLocation = $widget.find('.window-header .window-controls');
      if (!$targetLocation.length) {
        $targetLocation = $widget.find('.window-header');
      }
      if (!$targetLocation.length) {
        $targetLocation = $widget.find('.calendar-header');
      }
    } else if ($widget.hasClass('calendar-mini-widget')) {
      // For mini widget, add to existing header or create one
      $targetLocation = $widget.find('.mini-calendar-header');
      if (!$targetLocation.length) {
        // Create a header area in the mini widget
        $targetLocation = $(
          '<div class="mini-calendar-header" style="display: flex; justify-content: flex-end; padding: 4px; background: var(--color-bg-option, #f0f0f0); border-bottom: 1px solid var(--color-border-light-tertiary, #ccc);"></div>'
        );
        $widget.prepend($targetLocation);
      }
    }

    if (!$targetLocation || !$targetLocation.length) {
      console.log(
        `🌉 Simple Calendar Compatibility Bridge | No header found, adding to widget directly`
      );
      $targetLocation = $widget;
    }

    // Create the button
    const $button = $(`
      <div id="${buttonId}" class="simple-weather-button" style="cursor: pointer; padding: 4px 8px; margin: 2px; display: inline-flex; align-items: center; background: var(--color-bg-btn, #f0f0f0); border: 1px solid var(--color-border-dark, #999); border-radius: 3px; color: var(--color-text-primary, #000);" data-tooltip="${tooltip}" title="${tooltip}">
        <i class="fas ${icon}" style="font-size: 14px;"></i>
      </div>
    `);

    // Add click handler
    $button.on('click', (event: any) => {
      event.preventDefault();
      event.stopPropagation();
      console.log(`🌉 Simple Calendar Compatibility Bridge | Weather button "${name}" clicked`);
      try {
        callback();
        console.log(
          `🌉 Simple Calendar Compatibility Bridge | Weather button "${name}" callback executed successfully`
        );
      } catch (error) {
        console.error(
          `🌉 Simple Calendar Compatibility Bridge | Error in weather button callback:`,
          error
        );
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

    console.log(
      `🌉 Simple Calendar Compatibility Bridge | Added "${name}" button to widget successfully via DOM`
    );
  }

  /**
   * Clean up when module is disabled
   */
  cleanup(): void {
    if ((window as any).SimpleCalendar) {
      delete (window as any).SimpleCalendar;
    }

    if ((globalThis as any).SimpleCalendar) {
      delete (globalThis as any).SimpleCalendar;
    }

    if ((game as any).simpleCalendarCompat) {
      delete (game as any).simpleCalendarCompat;
    }

    // Clean up DOM observer
    if ((this as any).domObserver) {
      (this as any).domObserver.disconnect();
      delete (this as any).domObserver;
    }

    // Remove fake module registration
    if (game.modules && game.modules.get('foundryvtt-simple-calendar')) {
      (game.modules as any).delete('foundryvtt-simple-calendar');
      console.log(
        'Simple Calendar Compatibility Bridge | Removed fake Simple Calendar module entry'
      );
    }

    console.log('Simple Calendar Compatibility Bridge | Cleaned up');
  }
}

// Module instance
let compatBridge: SimpleCalendarCompatibilityBridge;

/**
 * CRITICAL: Expose SimpleCalendar as early as possible
 * Simple Weather checks for 'SimpleCalendar' in globalThis during its module initialization
 * We need to expose it before Simple Weather's init hook runs
 */

/**
 * Module initialization
 */
Hooks.once('init', () => {
  console.log('🌉 Simple Calendar Compatibility Bridge | Module initializing');
  compatBridge = new SimpleCalendarCompatibilityBridge();
});

/**
 * Setup fake module registration early for dependency checking
 */
Hooks.once('setup', () => {
  console.log('🌉 Simple Calendar Compatibility Bridge | Setup hook firing');

  // Register fake module immediately if Seasons & Stars module is active
  // This prevents Simple Weather from showing errors while we wait for the API
  const seasonsStarsModule = game.modules.get('seasons-and-stars');
  if (seasonsStarsModule?.active && !game.modules.get('foundryvtt-simple-calendar')) {
    console.log(
      '🌉 Simple Calendar Compatibility Bridge | Pre-registering fake SC module for dependency checks'
    );
    compatBridge.registerFakeSimpleCalendarModule();
  }
});

/**
 * Initialize Simple Calendar API using seasons-stars:ready hook
 * S&S fires this hook after exposing its API during setup hook
 * CRITICAL: This must be synchronous and block until complete - no async!
 */
Hooks.once('seasons-stars:ready', () => {
  console.log(
    '🌉 Simple Calendar Compatibility Bridge | S&S ready hook firing - API guaranteed available (BLOCKING)'
  );

  // Debug Simple Weather state
  const simpleWeatherModule = game.modules.get('foundryvtt-simple-weather');
  const attachToCalendarSetting = simpleWeatherModule?.active
    ? game.settings?.get('foundryvtt-simple-weather', 'attachToCalendar')
    : 'N/A';
  console.log('🌉 Simple Calendar Compatibility Bridge | Simple Weather module debug:', {
    found: !!simpleWeatherModule,
    active: simpleWeatherModule?.active,
    attachSetting: attachToCalendarSetting,
  });

  // Provide guidance if Simple Weather needs configuration
  if (simpleWeatherModule?.active && attachToCalendarSetting === false) {
    console.log(
      '🌉 Simple Calendar Compatibility Bridge | Simple Weather needs "Attach to Calendar" setting enabled'
    );
    if (game.user?.isGM) {
      ui.notifications?.info(
        'To complete Simple Weather integration, please enable "Attach to Calendar" in Simple Weather module settings.'
      );
    }
  }

  // Initialize bridge synchronously - S&S API should be immediately available
  console.log(
    '🌉 Simple Calendar Compatibility Bridge | Initializing bridge synchronously (BLOCKING)'
  );
  try {
    // Use synchronous initialization since S&S API is now synchronously available
    compatBridge.initializeSync();
    console.log('🌉 Simple Calendar Compatibility Bridge | Bridge initialized synchronously');
  } catch (error) {
    console.error(
      '🌉 Simple Calendar Compatibility Bridge | Failed to initialize synchronously:',
      error
    );
    ui.notifications?.error(
      'Simple Calendar Compatibility Bridge failed to initialize. Check console for details.'
    );
  }

  console.log(
    '🌉 Simple Calendar Compatibility Bridge | Setup complete - API ready for Item Piles ready hook'
  );
});

// No longer needed - bridge initializes immediately during ready hook
// since S&S now exposes its API during setup hook

/**
 * Module cleanup
 */
Hooks.once('destroy', () => {
  console.log('Simple Calendar Compatibility Bridge | Module shutting down');
  compatBridge?.cleanup();
});

// Export for potential external access
export { SimpleCalendarCompatibilityBridge };
