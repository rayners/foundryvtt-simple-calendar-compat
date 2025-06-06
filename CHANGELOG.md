# Changelog

All notable changes to the Simple Calendar Compatibility Bridge will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2025-06-06

### Fixed
- Fixed weekday conversion errors causing date offset issues in WFRP4e and other calendar systems
- Corrected weekday validation logic to properly handle 0-based weekday indexing
- Fixed array access issues when retrieving weekday names for display
- Eliminated double conversion of weekday values between Simple Calendar and Seasons & Stars formats

### Technical Details
- Both Simple Calendar and Seasons & Stars use 0-based weekdays (Sunday = 0), removing the need for +1/-1 conversions
- Updated validation checks from `>= 1` to `>= 0` for proper weekday range checking
- Fixed array indexing to use direct weekday values instead of `weekday - 1`

## [0.1.0] - 2025-06-02

### Added
- Initial release of Simple Calendar Compatibility Bridge
- Complete Simple Calendar API implementation with 50+ methods
- Seasons & Stars provider integration
- Simple Weather full compatibility
- SmallTime integration support
- Bridge pattern architecture for extensible calendar module support
- Comprehensive error handling and fallback strategies
- TypeScript support with Foundry v13 type definitions