# Changelog

All notable changes to the Simple Calendar Compatibility Bridge will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

💖 **Love this compatibility bridge?** Consider supporting development:

[![Patreon](https://img.shields.io/badge/Patreon-Support%20Development-ff424d?style=for-the-badge&logo=patreon)](https://patreon.com/rayners)
[![GitHub Sponsors](https://img.shields.io/badge/GitHub%20Sponsors-Support%20Development-ea4aaa?style=for-the-badge&logo=github)](https://github.com/sponsors/rayners)

Your support helps fund bridge improvements and additional calendar module support!

## [0.2.0](https://github.com/rayners/foundryvtt-simple-calendar-compat/compare/v0.1.1...v0.2.0) (2025-09-19)


### Features

* add comprehensive Patreon and GitHub Sponsors support ([bef3bcb](https://github.com/rayners/foundryvtt-simple-calendar-compat/commit/bef3bcb7ee900deeae0cb4376a349ee492617c33))
* coordinate with S&S init changes ([90b8b0d](https://github.com/rayners/foundryvtt-simple-calendar-compat/commit/90b8b0d5af670d86069e55d38bc8748dca857fb1))
* cover more Simple calendar API ([90b8b0d](https://github.com/rayners/foundryvtt-simple-calendar-compat/commit/90b8b0d5af670d86069e55d38bc8748dca857fb1))


### Bug Fixes

* complete weekday conversion fix for WFRP4e issue [#15](https://github.com/rayners/foundryvtt-simple-calendar-compat/issues/15) ([50eb18c](https://github.com/rayners/foundryvtt-simple-calendar-compat/commit/50eb18c2b1eddbb6b011a24c1e48a109ce65b2a6))
* format code with prettier ([5ed1cce](https://github.com/rayners/foundryvtt-simple-calendar-compat/commit/5ed1cce2b672b669aa3bfae0a0eb5106a1fdebdf))
* increase API detection timeout for environments with many modules ([#31](https://github.com/rayners/foundryvtt-simple-calendar-compat/issues/31)) ([8e298fd](https://github.com/rayners/foundryvtt-simple-calendar-compat/commit/8e298fdef03cb890bfc90d4bfbf6474c10faa023))
* remove manual build from release-please workflow to prevent conflicts ([4454057](https://github.com/rayners/foundryvtt-simple-calendar-compat/commit/44540577fc37f700f9354d3cd56fedeca148bfa6))


### Documentation

* add CLAUDE.md development memory file ([#29](https://github.com/rayners/foundryvtt-simple-calendar-compat/issues/29)) ([cc850ae](https://github.com/rayners/foundryvtt-simple-calendar-compat/commit/cc850ae5e633a022e286ea730378f4dff86c5a5e))
* clean up repository documentation per standards ([ab7c43d](https://github.com/rayners/foundryvtt-simple-calendar-compat/commit/ab7c43dc243fa8b7785f120a465a8101d7c1faa8))

## [Unreleased]

### Added
- Automatically convert stored Simple Calendar world settings to Seasons & Stars format and register them when `seasons-stars:registerExternalCalendars` fires, including resilient defaults for missing month and weekday data.
- Expose a parse-time `SimpleCalendar` stub and register a compatibility module entry so dependent modules like Simple Weather or Item Piles can detect the API before their initialization hooks run.
- Mirror Simple Calendar DOM structure, CSS classes, and hook emissions on Seasons & Stars widgets so Simple Weather's attached mode and sidebar buttons render without Simple Calendar being installed.
- Notify users about calendar imports and continue registration even when malformed entries are skipped.
- Introduced comprehensive repository management assets: CODEOWNERS, SECURITY policy, release template, and Codecov configuration.
- Added GitHub workflows for CI, CodeQL scanning, release automation, semantic pull request validation, Discord release notifications, and stale issue management.

### Changed
- Initialize the compatibility bridge synchronously during the `seasons-stars:ready` hook so the Simple Calendar API, hook bridge, and widget integration are ready before downstream modules continue their setup.
- Upgraded the development toolchain to match Seasons & Stars: ESLint 9 flat config with `@rayners/foundry-dev-tools`, Prettier 3, Vitest 3, and refreshed TypeScript project configuration.
- Enabled Husky and lint-staged git hooks with expanded npm scripts for formatting, linting, testing, and build validation.

## [0.1.2] - 2025-06-06

### Fixed
- Fixed remaining weekday conversion errors in hook system and integration provider
- Completed weekday indexing fix across all code paths (hooks.ts, seasons-stars-integration.ts)
- All weekday conversions now correctly use 0-based indexing for full WFRP4e compatibility

### Technical Details
- Eliminated final instances of incorrect `weekday - 1` conversions in hook bridging
- Fixed weekday array access in integration provider display formatting
- Ensured consistent 0-based weekday handling across the entire bridge codebase

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
