/**
 * Tests for classData.ts
 */

import { describe, it, expect } from '@jest/globals';
import { CLASS_SKILLS, CLASS_FEATURES } from '../../src/utils/classData';

describe('classData', () => {
  describe('CLASS_SKILLS', () => {
    it('should have skills for all standard D&D 5e classes', () => {
      const expectedClasses = [
        'Barbarian',
        'Bard',
        'Cleric',
        'Druid',
        'Fighter',
        'Monk',
        'Paladin',
        'Ranger',
        'Rogue',
        'Sorcerer',
        'Warlock',
        'Wizard'
      ];

      expectedClasses.forEach(className => {
        expect(CLASS_SKILLS[className]).toBeDefined();
        expect(Array.isArray(CLASS_SKILLS[className])).toBe(true);
        expect(CLASS_SKILLS[className].length).toBeGreaterThan(0);
      });
    });

    it('should have valid skill abbreviations', () => {
      const validSkills = [
        'acr',
        'ani',
        'arc',
        'ath',
        'dec',
        'his',
        'ins',
        'itm',
        'inv',
        'med',
        'nat',
        'prc',
        'prf',
        'per',
        'rel',
        'slt',
        'ste',
        'sur'
      ];

      Object.values(CLASS_SKILLS).forEach(skills => {
        skills.forEach(skill => {
          expect(validSkills).toContain(skill);
        });
      });
    });

    it('should have Barbarian with expected skills', () => {
      const barbarianSkills = CLASS_SKILLS.Barbarian;
      expect(barbarianSkills).toContain('ath'); // Athletics
      expect(barbarianSkills).toContain('sur'); // Survival
    });

    it('should have Wizard with expected skills', () => {
      const wizardSkills = CLASS_SKILLS.Wizard;
      expect(wizardSkills).toContain('arc'); // Arcana
      expect(wizardSkills).toContain('his'); // History
      expect(wizardSkills).toContain('inv'); // Investigation
    });
  });

  describe('CLASS_FEATURES', () => {
    it('should have features for all standard D&D 5e classes', () => {
      const expectedClasses = [
        'Barbarian',
        'Bard',
        'Cleric',
        'Druid',
        'Fighter',
        'Monk',
        'Paladin',
        'Ranger',
        'Rogue',
        'Sorcerer',
        'Warlock',
        'Wizard'
      ];

      expectedClasses.forEach(className => {
        expect(CLASS_FEATURES[className]).toBeDefined();
        expect(typeof CLASS_FEATURES[className]).toBe('object');
      });
    });

    it('should have level 1 features for all classes', () => {
      Object.values(CLASS_FEATURES).forEach(classFeatures => {
        expect(classFeatures[1]).toBeDefined();
        expect(Array.isArray(classFeatures[1])).toBe(true);
        expect(classFeatures[1].length).toBeGreaterThan(0);
      });
    });

    it('should have Fighter with Extra Attack at level 5', () => {
      const fighterFeatures = CLASS_FEATURES.Fighter;
      expect(fighterFeatures[5]).toBeDefined();
      expect(fighterFeatures[5]).toContain('Extra Attack');
    });

    it('should have Wizard with Spellcasting at level 1', () => {
      const wizardFeatures = CLASS_FEATURES.Wizard;
      expect(wizardFeatures[1]).toBeDefined();
      expect(wizardFeatures[1]).toContain('Spellcasting');
    });

    it('should have features organized by level', () => {
      Object.values(CLASS_FEATURES).forEach(classFeatures => {
        const levels = Object.keys(classFeatures).map(Number);
        levels.forEach(level => {
          expect(level).toBeGreaterThanOrEqual(1);
          expect(level).toBeLessThanOrEqual(20);
        });
      });
    });
  });
});
