# Contributing to Simple Calendar Compatibility Bridge

Thank you for your interest in contributing to the Simple Calendar Compatibility Bridge! This module enables seamless migration from Simple Calendar to Seasons & Stars while maintaining compatibility with existing modules.

## Table of Contents

- [Project Overview](#project-overview)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Compatibility Guidelines](#compatibility-guidelines)

## Project Overview

The Simple Calendar Compatibility Bridge serves as a translation layer that:
- Provides Simple Calendar API emulation for dependent modules
- Enables migration from Simple Calendar to Seasons & Stars
- Maintains compatibility with modules like Simple Weather, SmallTime, and About Time
- Handles data conversion and API translation

### Related Repositories

- **Seasons & Stars**: [rayners/fvtt-seasons-and-stars](https://github.com/rayners/fvtt-seasons-and-stars)
- **Main Documentation**: [docs.rayners.dev](https://docs.rayners.dev)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Foundry VTT v13+ for testing
- Seasons & Stars module for integration testing
- Git and TypeScript knowledge recommended

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/foundryvtt-simple-calendar-compat.git
   cd foundryvtt-simple-calendar-compat
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Build the Module**
   ```bash
   npm run build
   ```

4. **Link to Foundry** (optional)
   ```bash
   ./link-module.sh
   ```

## Making Changes

### Branch Naming

Use descriptive branch names that indicate the type of change:
- `fix/simple-weather-integration`
- `feat/enhanced-migration-support`
- `compat/about-time-api-updates`
- `docs/migration-guide-updates`

### Commit Messages

Follow conventional commit format:
```
type(scope): description

fix(api): resolve date conversion issue in timestampToDate
feat(migration): add support for custom calendar migration
compat(weather): enhance Simple Weather integration reliability
```

## Testing

### Compatibility Testing Requirements

Since this module serves as a bridge, comprehensive testing is critical:

#### 1. **Simple Calendar API Compatibility**
```bash
# Test API methods match expected Simple Calendar behavior
game.SimpleCalendar.api.timestampToDate(timestamp)
game.SimpleCalendar.api.dateToTimestamp(dateObject)
```

#### 2. **Module Integration Testing**
Test with actual dependent modules:
- **Simple Weather**: Weather data storage and retrieval
- **SmallTime**: Date/time display formatting
- **About Time**: Time advancement integration

#### 3. **Migration Testing**
- Test migration from various Simple Calendar versions
- Verify data preservation during migration
- Test rollback scenarios

#### 4. **Cross-Module Testing**
```bash
# Install test environment
# 1. Seasons & Stars (latest)
# 2. Simple Calendar Compat Bridge (your changes)
# 3. Simple Weather / SmallTime / About Time
# 4. Test all functionality
```

### Test Scenarios

#### Essential Test Cases
1. **Fresh Installation**
   - Install S&S + Bridge without Simple Calendar
   - Verify modules detect "Simple Calendar" correctly

2. **Migration Path**
   - Start with Simple Calendar + dependent modules
   - Install S&S + Bridge
   - Disable Simple Calendar
   - Verify all functionality preserved

3. **API Accuracy**
   - Compare bridge API responses to Simple Calendar
   - Test edge cases (leap years, month boundaries, etc.)
   - Verify date format conversions

## Compatibility Guidelines

### Simple Calendar API Emulation

When implementing or modifying API methods:

1. **Maintain Exact API Signatures**
   ```typescript
   // Must match Simple Calendar exactly
   timestampToDate(timestamp: number): SimpleCalendarDateObject
   dateToTimestamp(dateObject: SimpleCalendarDateObject): number
   ```

2. **Preserve Data Formats**
   - Simple Calendar uses 0-based months/days
   - Seasons & Stars uses 1-based months/days
   - Bridge must handle conversion accurately

3. **Error Handling**
   - Graceful degradation when S&S unavailable
   - Clear error messages for debugging
   - Fallback to Foundry native time when possible

### Version Compatibility

Support multiple versions where possible:
- Simple Calendar v2.0+ (primary target)
- Seasons & Stars v0.1+ (current requirement)
- Foundry VTT v13+ (minimum requirement)

## Module-Specific Guidelines

### Simple Weather Integration
- Weather data stored via bridge should appear in S&S calendar
- Temperature and weather icons must display correctly
- Historical weather data should be preserved during migration

### SmallTime Integration
- Date/time display must match Simple Calendar formatting
- Month names and date formats should be accurate
- Custom calendar configurations should be respected

### About Time Integration
- Time advancement should work through bridge
- Game time synchronization must be maintained
- Clock display should update correctly

## Submitting Changes

### Pull Request Requirements

- [ ] All compatibility tests pass
- [ ] Integration with Seasons & Stars verified
- [ ] At least one dependent module tested (Simple Weather/SmallTime/About Time)
- [ ] Migration scenarios tested (if applicable)
- [ ] Documentation updated
- [ ] Console errors resolved

### Issue Coordination

Since bridge issues often relate to main S&S functionality:

1. **Check Related Issues**: Look for related issues in [rayners/fvtt-seasons-and-stars](https://github.com/rayners/fvtt-seasons-and-stars/issues)
2. **Cross-Reference**: Link issues between repositories when relevant
3. **Coordinate Fixes**: Some issues may require changes in both repositories

## Debugging and Troubleshooting

### Bridge Debug Information
```javascript
// Get bridge debug info
game.modules.get('simple-calendar-compat')?.api?.debug?.()

// Check S&S integration
game.seasonsStars?.integration?.detect()
```

### Common Issue Areas

1. **Date Conversion**: 0-based vs 1-based indexing
2. **Module Detection**: Timing of module initialization
3. **API Availability**: Methods available at different lifecycle stages
4. **Data Migration**: Preserving user data during transitions

## Documentation

### Required Documentation Updates

When making changes, update:
- Migration guides for affected scenarios
- API compatibility documentation
- Module-specific integration notes
- Troubleshooting guides

### Documentation Files

- `README.md` - Overview and quick setup
- `MIGRATION-GUIDE.md` - Step-by-step migration process
- `API-COMPATIBILITY.md` - Simple Calendar API coverage
- `TROUBLESHOOTING.md` - Common issues and solutions

## Getting Help

- **Issues**: Use appropriate issue templates for different problem types
- **Main S&S Issues**: Check [rayners/fvtt-seasons-and-stars](https://github.com/rayners/fvtt-seasons-and-stars/issues)
- **Discord**: Find @rayners78 on the Foundry VTT Discord
- **Documentation**: [docs.rayners.dev](https://docs.rayners.dev) for comprehensive guides

## License

By contributing, you agree that your contributions will be licensed under the same MIT License that covers this project.

---

Thank you for helping maintain compatibility between Simple Calendar and Seasons & Stars!