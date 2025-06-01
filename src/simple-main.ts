/**
 * Simple Calendar Compatibility Bridge - Minimal Implementation
 */

// Just expose what Simple Weather needs to detect Simple Calendar
Hooks.once('init', () => {
  console.log('Simple Calendar Compatibility Bridge | Minimal setup starting...');
  
  // Register fake module for dependency checking
  const fakeModule = {
    id: 'foundryvtt-simple-calendar',
    title: 'Simple Calendar (Compatibility Bridge)',
    active: true,
    version: '2.4.18'
  };
  
  if (game.modules && !game.modules.get('foundryvtt-simple-calendar')) {
    (game.modules as any).set('foundryvtt-simple-calendar', fakeModule);
    console.log('Simple Calendar Compatibility Bridge | Fake module registered');
  }
  
  // Expose minimal SimpleCalendar API that Simple Weather expects
  const simpleCalendarAPI = {
    api: {
      addSidebarButton: (name: string, icon: string, tooltip: string, isToggle: boolean, callback: Function) => {
        console.log(`Simple Calendar Bridge | Adding button: ${name}`);
        
        // Find calendar widgets and add button
        setTimeout(() => {
          const widgets = document.querySelectorAll('.calendar-widget, .calendar-mini-widget');
          widgets.forEach(widget => {
            const $widget = $(widget);
            
            // Add button wrapper if it doesn't exist
            let $wrapper = $widget.find('.fsc-pj');
            if (!$wrapper.length) {
              $wrapper = $('<div class="fsc-pj" style="display: flex; gap: 4px; align-items: center; margin-left: auto;"></div>');
              const $header = $widget.find('.window-header, .calendar-header').first();
              if ($header.length) {
                $header.append($wrapper);
              } else {
                $widget.prepend($wrapper);
              }
            }
            
            // Add the actual button
            const $button = $(`
              <div class="simple-weather-button" style="cursor: pointer; padding: 4px;" data-tooltip="${tooltip}">
                <i class="fas ${icon}"></i>
              </div>
            `);
            
            $button.on('click', callback);
            $wrapper.append($button);
            
            console.log(`Simple Calendar Bridge | Button "${name}" added to widget`);
          });
        }, 50);
      },
      
      // Minimal API methods that return reasonable defaults
      getCurrentDate: () => ({ display: { monthName: '', day: '1', year: '2024' } }),
      timestampToDate: () => ({ display: { monthName: '', day: '1', year: '2024' } })
    },
    
    Hooks: {
      Init: 'simple-calendar-init',
      DateTimeChange: 'simple-calendar-date-time-change', 
      ClockStartStop: 'simple-calendar-clock-start-stop'
    }
  };
  
  // Expose in both locations
  (window as any).SimpleCalendar = simpleCalendarAPI;
  (globalThis as any).SimpleCalendar = simpleCalendarAPI;
  
  console.log('Simple Calendar Compatibility Bridge | API exposed globally');
});

// Emit the init hook once everything is ready
Hooks.once('ready', () => {
  // Small delay to let Simple Weather set up its listeners
  setTimeout(() => {
    console.log('Simple Calendar Compatibility Bridge | Emitting init hook');
    Hooks.callAll('simple-calendar-init');
    
    // Trigger renderMainApp on existing widgets
    const widgets = document.querySelectorAll('.calendar-widget, .calendar-mini-widget');
    widgets.forEach(widget => {
      const $widget = $(widget);
      
      // Add compatibility class
      $widget.addClass('simple-calendar-compat');
      
      // Create fake app and emit hook
      const fakeApp = {
        constructor: { name: 'SimpleCalendar' },
        element: widget
      };
      
      console.log(`Simple Calendar Bridge | Emitting renderMainApp for widget`);
      Hooks.callAll('renderMainApp', fakeApp, $widget);
    });
  }, 200);
});