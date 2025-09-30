# Simple Calendar Hooks Implementation

This document details the implementation status of Simple Calendar hooks in the compatibility bridge.

## Implemented Hooks

### ✅ Init Hook

- **Constant**: `"simple-calendar-init"`
- **Implementation**: `HookBridge.initialize()` at hooks.ts:45
- **Fires**: During bridge initialization
- **Data Passed**: None
- **S&S Integration**: Emitted directly by bridge during setup

### ✅ DateTimeChange Hook

- **Constant**: `"simple-calendar-date-time-change"`
- **Implementation**: `HookBridge.onDateChanged()` at hooks.ts:85
- **Fires**: When current date updates via S&S hooks or world time changes
- **Data Passed**: `{ date, moons, seasons }`
- **S&S Integration**: Translates from `seasons-stars:dateChanged` and `seasons-stars:calendarChanged`

### ✅ ClockStartStop Hook

- **Constant**: `"simple-calendar-clock-start-stop"`
- **Implementation**: `HookBridge.startClock()/stopClock()` at hooks.ts:128
- **Fires**: When clock starts/stops, pause/unpause, combat events
- **Data Passed**: `{ started: boolean }`
- **S&S Integration**: Bridge maintains clock state and emits when changed

### ✅ PrimaryGM Hook

- **Constant**: `"simple-calendar-primary-gm"`
- **Implementation**: `HookBridge.triggerPrimaryGMCheck()` at hooks.ts:228
- **Fires**: When user becomes primary GM (first active GM by ID sort)
- **Data Passed**: `{ isPrimaryGM: true }`
- **S&S Integration**: Bridge determines primary GM using Foundry user data

### ✅ Ready Hook

- **Constant**: `"simple-calendar-ready"`
- **Implementation**: `HookBridge.emitReadyHook()` at hooks.ts:266
- **Fires**: 5 seconds after initialization (matches Simple Calendar behavior)
- **Data Passed**: None
- **S&S Integration**: Emitted after bridge initialization completes

## Implementation Notes

### Primary GM Logic

The bridge implements Simple Calendar's primary GM logic:

1. Must be a GM user (`game.user.isGM`)
2. Must be active (`user.active`)
3. First active GM when sorted by user ID becomes primary GM
4. Hook only fires for the primary GM user

### Hook Timing

- **Init**: Immediate during bridge initialization
- **PrimaryGM**: Immediate after Init hook
- **Ready**: 5 second delay after initialization (setTimeout)
- **DateTimeChange**: On-demand when S&S date events occur
- **ClockStartStop**: On-demand when clock state changes

### S&S Integration Points

The bridge connects to Seasons & Stars through these hooks:

- `seasons-stars:dateChanged` → `simple-calendar-date-time-change`
- `seasons-stars:calendarChanged` → `simple-calendar-date-time-change`
- `updateWorldTime` → `simple-calendar-date-time-change`
- `clientSettingChanged` → `simple-calendar-date-time-change` (calendar settings)

## Limitations and Design Decisions

### Clock Integration

The bridge maintains its own clock state since S&S may not have a direct clock concept. The bridge:

- Provides `startClock()/stopClock()` methods for API compatibility
- Emits `ClockStartStop` hooks when state changes
- Could be enhanced to listen for Foundry combat/pause events

### Data Format Translation

The bridge translates between:

- S&S 1-based dates → Simple Calendar 0-based dates
- S&S calendar data → Simple Calendar expected format
- Mock moon/season data for compatibility (S&S may provide real data)

### No Unimplementable Hooks

All 5 documented Simple Calendar hooks are implementable with the current S&S API surface:

- Bridge can emit all hooks at appropriate times
- All required data can be derived from S&S or Foundry core
- No S&S API limitations prevent implementation

## Testing Coverage

Comprehensive test suite covers:

- All 5 hooks fire correctly
- Primary GM logic works properly
- Hook constants are accessible
- S&S integration points are set up
- Error handling and edge cases
- TDD approach with failing tests first

## Troubleshooting

### Hook Not Firing

- Verify the bridge initialized successfully (`simple-calendar-init` fired)
- Check that S&S is loaded before the bridge module
- Ensure GM status for PrimaryGM hook

### Multiple Ready Hooks

- Bridge prevents duplicate Ready emissions
- Check for multiple bridge instances if seeing unexpected behavior

### Clock State Issues

- Bridge maintains independent clock state from S&S
- Use bridge's `startClock()/stopClock()` methods for proper event emission

### Primary GM Detection Issues

- Primary GM is determined by first active GM sorted by user ID
- Check `game.user.isGM` and `game.user.active` status
- Only the primary GM receives the PrimaryGM hook

## Future Enhancements

Potential improvements:

1. **Real Clock Integration**: Listen for Foundry combat/pause hooks
2. **Enhanced Moon Data**: Use S&S moon data if available
3. **Season Integration**: Use S&S season data instead of mock data
4. **Combat Integration**: Auto start/stop clock on combat begin/end
5. **Pause Integration**: Emit ClockStartStop on game pause/unpause
