# Contributing to Simple Calendar Compatibility Bridge

Thank you for your interest in contributing to the Simple Calendar Compatibility Bridge! This module enables seamless migration from Simple Calendar to modern calendar systems while maintaining compatibility with existing modules.

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
- Enables migration from Simple Calendar to modern calendar systems
- Maintains compatibility with modules like Simple Weather, SmallTime, and About Time
- Handles data conversion and API translation

### Documentation

- **Main Documentation**: [docs.rayners.dev](https://docs.rayners.dev)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Foundry VTT v13+ for testing
- Compatible calendar module for integration testing
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

### Testing Requirements

Since this module serves as a bridge, comprehensive testing is critical:

#### 1. **Unit Tests**
```bash
npm run test
```

#### 2. **Build Tests**
```bash
npm run build
```

#### 3. **Module Integration Testing**
Test with actual dependent modules:
- **Simple Weather**: Weather data storage and retrieval
- **SmallTime**: Date/time display formatting
- **About Time**: Time advancement integration

#### 4. **API Compatibility**
Verify API methods match expected Simple Calendar behavior:
- Date conversion accuracy
- Hook system compatibility
- Data format preservation

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
- Compatible calendar modules
- Foundry VTT v13+ (minimum requirement)

## Submitting Changes

### Pull Request Requirements

- [ ] All tests pass (`npm run test`)
- [ ] Build completes successfully (`npm run build`) 
- [ ] At least one dependent module tested (Simple Weather/SmallTime/About Time)
- [ ] Documentation updated if needed
- [ ] Console errors resolved

## Documentation

### Required Documentation Updates

When making changes, update:
- Migration guides for affected scenarios
- API compatibility documentation
- Module-specific integration notes
- Troubleshooting guides

## Getting Help

- **Issues**: Use GitHub issues for bug reports and feature requests
- **Documentation**: [docs.rayners.dev](https://docs.rayners.dev) for comprehensive guides
- **Discord**: Foundry VTT community Discord

## License

By contributing, you agree that your contributions will be licensed under the same MIT License that covers this project.

---

Thank you for helping maintain compatibility between Simple Calendar and Seasons & Stars!