# Simple Calendar Compatibility Bridge

A Foundry VTT module that provides Simple Calendar API compatibility for modern calendar modules like **Seasons & Stars**.

## Overview

This module acts as a bridge between modules that expect the Simple Calendar API and modern calendar implementations. Instead of each calendar module needing to implement Simple Calendar compatibility, this dedicated bridge module handles the translation layer.

## Features

- **Universal Compatibility**: Works with any supported calendar module
- **Complete API Coverage**: Implements the full Simple Calendar API surface
- **Automatic Detection**: Detects available calendar modules and adapts automatically  
- **Hook Bridging**: Translates between different module hook systems
- **Zero Configuration**: Just install and it works
- **Clean Architecture**: Keeps calendar modules focused on their core functionality

## Supported Calendar Modules

- ✅ **Seasons & Stars** - Full support
- 🔄 **About Time** - Planned
- 🔄 **Other calendar modules** - Extensible architecture

## Compatible Modules

This bridge enables the following modules to work with modern calendar systems:

- **SmallTime** - Time display widget
- **Simple Weather** - Weather system with calendar integration
- **Calendar/Weather** - Advanced weather systems
- Any module expecting Simple Calendar API

## Installation

1. Install your preferred calendar module (e.g., Seasons & Stars)
2. Install this compatibility bridge module
3. **Do NOT** install Simple Calendar (this replaces it)
4. Activate both modules in Foundry

## Usage

The bridge works automatically - no configuration needed! Once installed:

1. The bridge detects your calendar module
2. Exposes the Simple Calendar API (`window.SimpleCalendar`)
3. Translates all hooks and method calls
4. Other modules work seamlessly

## For Developers

### Adding Calendar Provider Support

To add support for your calendar module:

1. Implement the `CalendarProvider` interface:

```typescript
import { BaseCalendarProvider } from './providers/base-provider';

export class YourCalendarProvider extends BaseCalendarProvider {
  readonly name = 'Your Calendar';
  readonly version = '1.0.0';
  
  static isAvailable(): boolean {
    return !!(game.modules.get('your-calendar')?.active);
  }
  
  getCurrentDate(): CalendarDate | null {
    // Implementation
  }
  
  // ... other required methods
}
```

2. Add detection logic in `main.ts`:

```typescript
if (YourCalendarProvider.isAvailable()) {
  return new YourCalendarProvider();
}
```

### API Coverage

The bridge implements the complete Simple Calendar API:

- **Core Methods**: `timestamp()`, `timestampToDate()`, `getCurrentDate()`
- **Time Advancement**: `advanceDays()`, `addMonths()`, `setTime()`
- **Formatting**: `formatDateTime()`, `dateToTimestamp()`
- **SmallTime Integration**: Clock controls, display formatting
- **Simple Weather Integration**: Sidebar buttons, sunrise/sunset
- **Hook System**: All Simple Calendar hooks with proper data

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   SmallTime     │    │  Simple Weather  │    │  Other Modules  │
│                 │    │                  │    │                 │
└─────────┬───────┘    └─────────┬────────┘    └─────────┬───────┘
          │                      │                       │
          └──────────────────────┼───────────────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │                          │
                    │  Simple Calendar API     │
                    │  Compatibility Bridge    │
                    │                          │
                    └────────────┬─────────────┘
                                 │
          ┌──────────────────────┼───────────────────────┐
          │                      │                       │
          ▼                      ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Seasons & Stars │    │   About Time    │    │ Your Calendar   │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Benefits

### For Users
- **Compatibility**: Use any calendar module with any calendar-dependent module
- **Choice**: Switch between calendar modules without losing functionality
- **Simplicity**: One bridge module handles all compatibility

### For Developers
- **Focused Development**: Calendar modules focus on calendar functionality
- **Reduced Maintenance**: No need to maintain Simple Calendar compatibility in each module
- **Extensibility**: Easy to add support for new calendar modules

## Troubleshooting

### Module Not Working?

1. Check that Simple Calendar is **NOT** installed (conflicts)
2. Verify your calendar module is active and supported
3. Check browser console for bridge initialization messages
4. Ensure module load order: Calendar module → Bridge → Dependent modules

### Missing Features?

The bridge implements the complete Simple Calendar API. If something doesn't work:

1. Check if your calendar module supports the required features
2. Report issues with specific module combinations
3. Provide console logs and error messages

## Contributing

Contributions welcome! Areas of interest:

- Additional calendar module providers
- Enhanced API coverage
- Better error handling
- Documentation improvements

## License

MIT License - see LICENSE file for details.

## Credits

- Inspired by the original Simple Calendar module
- Built for the Foundry VTT community
- Designed to work with Seasons & Stars and future calendar modules