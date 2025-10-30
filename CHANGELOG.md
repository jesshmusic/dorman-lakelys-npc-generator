# Changelog

All notable changes to this project will be documented in this file.

## [1.3.0] - 2025-10-30

### Added

- Patreon integration for AI feature gating
- Two-tier Patreon system (Apprentice $3/month, Wizard $5/month)
- PatreonService for OAuth 2.0 authentication flow
- PatreonAuthDialog for managing Patreon connection
- Feature access control at UI and service levels
- Visual indicators for locked features (badges and disabled buttons)
- Patreon status header in NPC generator form
- Client-scoped Patreon authentication storage

### Changed

- AI features now require Patreon membership
- Name and biography generation require Apprentice tier
- Portrait generation requires Wizard tier
- Updated README with Patreon feature documentation

## [1.2.2] - 2025-10-29

### Added

- Consolidated prompt editor in single modal
- Simplified portrait prompt generation

### Changed

- Improved prompt editing workflow

## [1.2.1] - 2025-10-28

### Added

- HTML instructions creation
- Improved documentation

## [1.2.0] - 2025-10-27

### Added

- Comprehensive test coverage (96.21% achieved)
- Jest test suite for core functionality
- Test coverage reporting

### Changed

- Improved code quality and reliability

## [1.1.1] - 2025-10-25

### Added

- add compendium destination options for NPC creation
- add GitHub workflows and release automation
- rebrand to Dorman Lakely's NPC Generator
- enhancements

### Fixed

- refactor compendium actor creation to avoid embedded document issues

### Changed

- bump version to 1.1.0

### Other

- initial commit

## [1.1.0] - 2025-10-25

### Added

- add compendium destination options for NPC creation
- add GitHub workflows and release automation
- rebrand to Dorman Lakely's NPC Generator
- enhancements

### Fixed

- refactor compendium actor creation to avoid embedded document issues

### Other

- initial commit

## [1.0.0] - 2025-10-24

### Added

- Initial release of Dorman Lakely's NPC Generator
- NPC generation with species, alignment, challenge rating, and class selection
- Automated ability score generation based on CR
- Equipment assignment from D&D 5e compendiums
- Class features integration
- Spellcasting support for caster classes
- Monster features based on CR
- Automated actor creation with proper stats and items
- FoundryVTT v11-13 compatibility
