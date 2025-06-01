/**
 * Ultra-minimal Simple Calendar compatibility - just the essentials
 */

console.log('Simple Calendar Compatibility Bridge | Starting ultra-minimal setup');

// Wait for Foundry to be fully ready
Hooks.once('ready', () => {
  console.log('Simple Calendar Compatibility Bridge | Ready hook - setting up minimal compatibility');
  
  // Only register fake module if Simple Calendar doesn't exist
  if (!game.modules.get('foundryvtt-simple-calendar')) {
    try {
      // Minimal fake module
      const fakeModule = {
        id: 'foundryvtt-simple-calendar',
        title: 'Simple Calendar (Compatibility Bridge)',
        active: true,
        version: '2.4.18'
      };
      
      (game.modules as any).set('foundryvtt-simple-calendar', fakeModule);
      console.log('Simple Calendar Compatibility Bridge | Fake module registered');
    } catch (error) {
      console.error('Simple Calendar Compatibility Bridge | Failed to register fake module:', error);
    }
  }
  
  // Only expose SimpleCalendar if it doesn't exist
  if (!(window as any).SimpleCalendar) {
    try {
      const simpleAPI = {
        api: {
          addSidebarButton: (name: string, icon: string, tooltip: string, isToggle: boolean, callback: Function) => {
            console.log(`Simple Calendar Bridge | Button requested: ${name}`);
            // Just log for now - don't manipulate DOM immediately
          },
          getCurrentDate: () => ({ display: { monthName: 'January', day: '1', year: '2024' } }),
          timestampToDate: (timestamp: number) => ({ display: { monthName: 'January', day: '1', year: '2024' } })
        },
        Hooks: {
          Init: 'simple-calendar-init'
        }
      };
      
      (window as any).SimpleCalendar = simpleAPI;
      (globalThis as any).SimpleCalendar = simpleAPI;
      console.log('Simple Calendar Compatibility Bridge | API exposed');
    } catch (error) {
      console.error('Simple Calendar Compatibility Bridge | Failed to expose API:', error);
    }
  }
  
  console.log('Simple Calendar Compatibility Bridge | Setup complete');
});