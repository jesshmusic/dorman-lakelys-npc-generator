# Changelog

All notable changes to this project will be documented in this file.

## [1.4.0] - 2025-11-06

### Added

- **Template-based NPC generation system** - Complete rewrite of NPC generation using actor templates from compendiums
- New role-to-template category mapping system covering all 67 roles
- Intelligent template fallback logic (primary → category fallback → Commoner/Guard)
- Damage dice scaling system that matches CR damage ranges
- Support for D&D Modern Content Compendium (optional) with fallback to core SRD
- Three new utility modules:
  - `templateData.ts` - Role-to-template mappings for 11 categories
  - `damageScaling.ts` - Damage formula parsing and CR-based scaling
  - `templateScaling.ts` - Complete template actor CR scaling logic

### Changed

- NPCs now generated from actual D&D 5e monster statblocks (Assassin, Guard, Mage, etc.)
- Attack bonuses, damage dice, save DCs all scaled to match target CR
- Features like Multiattack, Assassinate, Sneak Attack preserved from templates
- Equipment system now augments template features instead of being primary source
- All 67 roles now have proper template mappings (previously only 12 had equipment)

### Fixed

- Roles like Assassin, Spy, Merchant, Blacksmith now generate with appropriate features and actions
- Damage scaling ensures Offensive CR calculates correctly for all roles
- Template features provide proper action economy (bonus actions, reactions, etc.)

## [1.3.1] - 2025-11-06

### Fixed

- Add equipment and weapons to generated NPCs with proper attack bonuses to fix Offensive CR calculation
- Fix .claude/commands files to reference correct 'scripts/' directory instead of 'dist/'
- Fix package.json lint scripts to only target src/ directory

### Changed

- NPCs now include CR-appropriate weapons and armor from dnd5e.items compendium
- Weapons are automatically configured with attack bonuses based on target CR
- Equipment is marked as equipped on creation for accurate AC and attack calculations

## [1.2.4] - 2025-10-31

### Fixed

- Improve Foundry API token handling in release workflows

## [1.2.3] - 2025-10-30

### Added

- Simplified portrait prompt somewhat
- chore: add release script for automated version bumping
- Add configurable temperature/randomness settings for AI generation
- Add species dropdown and multi-select personality pills
- image generation rest of the files
- Add OpenAI portrait generation, flavor/gender dropdowns, and UI improvements
- Initial robust attempt
- add compendium destination options for NPC creation

### Fixed

- Release v1.2.0: Improve ability score generation and fix image rendering
- Fix DALL-E image generation to handle base64 responses
- refactor compendium actor creation to avoid embedded document issues

### Changed

- Quality of life fixes
- Simplify startup console messages
- bump version to 1.1.0

### Other

- Bump version to 1.2.2
- Update src/utils/crCalculations.ts
- Update src/utils/crCalculations.ts
- Replace personality pills with proper multi-select dropdown
- Expand species dropdown with 24 new humanoid creatures
- enhancement: Cleaned up the prompts a bit

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
