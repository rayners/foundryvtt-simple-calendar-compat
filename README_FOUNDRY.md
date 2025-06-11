# Simple Calendar Compatibility Bridge

_API compatibility layer for Simple Calendar-dependent modules_

## What This Module Does

The Simple Calendar Compatibility Bridge provides API compatibility for modules that were designed to work with Simple Calendar. It acts as a translation layer, allowing these modules to function with Seasons & Stars as the underlying calendar system on Foundry VTT v13+.

## Who This Is For

- **Users migrating from Simple Calendar** who use modules like Simple Weather
- **GMs with existing setups** that include Simple Calendar-dependent modules
- **Anyone wanting compatibility** during the transition to v13-compatible calendar solutions

## How It Works

This bridge module:

- **Provides Simple Calendar API**: Presents the familiar Simple Calendar interface to dependent modules
- **Translates to Seasons & Stars**: Converts API calls to work with the Seasons & Stars calendar system
- **Preserves Functionality**: Maintains existing calendar notes and module data
- **Enables Transition**: Allows migration without immediately breaking module dependencies

## Intended Module Support

Designed to work with modules such as:

- **Simple Weather**: Weather tracking and display
- **SmallTime**: Enhanced time display
- **About Time**: Time advancement automation

_Note: This is an alpha release. While designed for these modules, extensive testing has not been completed._

## Installation Requirements

**Required:**

- Foundry VTT v13+
- Seasons & Stars module

**Important:**

- Simple Calendar should be disabled or removed when using this bridge

## Setup Process

1. Install Seasons & Stars and Simple Calendar Compatibility Bridge
2. Disable the original Simple Calendar module
3. Configure your calendar system in Seasons & Stars
4. Test that dependent modules continue to function
5. Remove Simple Calendar when confident in the setup

_Warning: Do not run this bridge alongside Simple Calendar - use one or the other._

## Expected Functionality

### **Simple Weather Integration**

- Weather data should continue to appear on calendar dates
- Temperature and weather displays should function
- Historical weather data should be maintained

### **SmallTime Integration**

- Date formatting should continue working
- Calendar data should populate displays correctly
- Time advancement should remain functional

### **General Module Support**

- Basic Simple Calendar API calls are implemented
- Date conversion and formatting functions are provided
- Time-related integrations are maintained

## Limitations

- **Alpha Status**: Early development software
- **API Coverage**: Not all Simple Calendar features are implemented
- **Testing Coverage**: Limited testing with third-party modules
- **Performance**: May introduce overhead compared to direct implementations

## Troubleshooting

**Common Issues:**

- Module compatibility problems
- Date formatting inconsistencies
- Missing functionality from original Simple Calendar

**Getting Help:**

- Check documentation for setup guidance
- Report issues through GitHub
- Use GitHub Discussions for community support

## Documentation

- **Setup Guide**: Installation and configuration instructions
- **Migration Guide**: Transitioning from Simple Calendar
- **Compatibility Notes**: Module-specific information
- **Troubleshooting**: Common issues and solutions

## Development Status

**Alpha Release**: This compatibility bridge is in active development. Not all Simple Calendar functionality may be available. Please report compatibility issues and missing features through GitHub.

## 💖 Support Development

Love this compatibility bridge? Consider supporting continued development:

[![Patreon](https://img.shields.io/badge/Patreon-Support%20Development-ff424d?style=for-the-badge&logo=patreon)](https://patreon.com/rayners)
[![GitHub Sponsors](https://img.shields.io/badge/GitHub%20Sponsors-Support%20Development-ea4aaa?style=for-the-badge&logo=github)](https://github.com/sponsors/rayners)

Your support helps fund bridge compatibility improvements, support for additional calendar modules, better Simple Calendar feature coverage, and enhanced module integration testing.

---

_Maintaining module compatibility during Foundry v13+ transitions_
