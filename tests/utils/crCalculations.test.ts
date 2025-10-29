/**
 * Tests for crCalculations.ts
 */

import { describe, it, expect } from '@jest/globals';
import { parseCR, getCRStats, crToLevel } from '../../src/utils/crCalculations';

describe('crCalculations', () => {
  describe('parseCR', () => {
    it('should parse whole number CR values', () => {
      expect(parseCR('0')).toBe(0);
      expect(parseCR('1')).toBe(1);
      expect(parseCR('5')).toBe(5);
      expect(parseCR('10')).toBe(10);
      expect(parseCR('20')).toBe(20);
      expect(parseCR('30')).toBe(30);
    });

    it('should parse fractional CR values', () => {
      expect(parseCR('0.125')).toBe(0.125);
      expect(parseCR('0.25')).toBe(0.25);
      expect(parseCR('0.5')).toBe(0.5);
    });

    it('should parse CR fractions in slash format', () => {
      expect(parseCR('1/8')).toBe(0.125);
      expect(parseCR('1/4')).toBe(0.25);
      expect(parseCR('1/2')).toBe(0.5);
    });
  });

  describe('getCRStats', () => {
    it('should return stats for CR 0', () => {
      const stats = getCRStats('0');

      expect(stats.proficiencyBonus).toBe(2);
      expect(stats.baseAC).toBe(13);
      expect(stats.attackBonus).toBe(3);
      expect(stats.saveDC).toBe(13);
      expect(stats.xp).toBe(10);
      expect(stats.baseAbilityScore).toBe(10);
      expect(stats.hpMultiplier).toBeGreaterThan(0);
    });

    it('should return stats for CR 1/4', () => {
      const stats = getCRStats('0.25');

      expect(stats.proficiencyBonus).toBe(2);
      expect(stats.baseAC).toBe(13);
      expect(stats.attackBonus).toBe(3);
      expect(stats.saveDC).toBe(13);
      expect(stats.xp).toBe(50);
      expect(stats.baseAbilityScore).toBeGreaterThanOrEqual(10);
    });

    it('should return stats for CR 1', () => {
      const stats = getCRStats('1');

      expect(stats.proficiencyBonus).toBe(2);
      expect(stats.baseAC).toBe(13);
      expect(stats.attackBonus).toBe(3);
      expect(stats.saveDC).toBe(13);
      expect(stats.xp).toBe(200);
      expect(stats.baseAbilityScore).toBe(12);
    });

    it('should return stats for CR 5', () => {
      const stats = getCRStats('5');

      expect(stats.proficiencyBonus).toBe(3);
      expect(stats.baseAC).toBe(15);
      expect(stats.attackBonus).toBe(6);
      expect(stats.saveDC).toBe(15);
      expect(stats.xp).toBe(1800);
      expect(stats.baseAbilityScore).toBeGreaterThanOrEqual(13);
    });

    it('should return stats for CR 10', () => {
      const stats = getCRStats('10');

      expect(stats.proficiencyBonus).toBe(4);
      expect(stats.baseAC).toBe(17);
      expect(stats.attackBonus).toBe(7);
      expect(stats.saveDC).toBe(16);
      expect(stats.xp).toBe(5900);
      expect(stats.baseAbilityScore).toBeGreaterThanOrEqual(16);
    });

    it('should return stats for CR 20', () => {
      const stats = getCRStats('20');

      expect(stats.proficiencyBonus).toBe(6);
      expect(stats.baseAC).toBe(19);
      expect(stats.attackBonus).toBe(10);
      expect(stats.saveDC).toBe(19);
      expect(stats.xp).toBe(25000);
      expect(stats.baseAbilityScore).toBe(18);
    });

    it('should return stats for CR 30', () => {
      const stats = getCRStats('30');

      expect(stats.proficiencyBonus).toBe(9);
      expect(stats.baseAC).toBe(19);
      expect(stats.attackBonus).toBe(14);
      expect(stats.saveDC).toBe(23);
      expect(stats.xp).toBe(155000);
      expect(stats.baseAbilityScore).toBe(20);
    });

    it('should scale ability scores appropriately with CR', () => {
      const cr1 = getCRStats('1');
      const cr5 = getCRStats('5');
      const cr10 = getCRStats('10');
      const cr20 = getCRStats('20');

      expect(cr1.baseAbilityScore).toBeLessThan(cr5.baseAbilityScore);
      expect(cr5.baseAbilityScore).toBeLessThan(cr10.baseAbilityScore);
      expect(cr10.baseAbilityScore).toBeLessThan(cr20.baseAbilityScore);
    });

    it('should cap ability scores at 20', () => {
      const stats = getCRStats('30');
      expect(stats.baseAbilityScore).toBeLessThanOrEqual(20);
    });

    it('should default to CR 1 stats for unknown CR', () => {
      const stats = getCRStats('999');
      const cr1Stats = getCRStats('1');

      expect(stats.proficiencyBonus).toBe(cr1Stats.proficiencyBonus);
      expect(stats.baseAC).toBe(cr1Stats.baseAC);
      expect(stats.xp).toBe(cr1Stats.xp);
    });

    it('should calculate HP multiplier as midpoint of range', () => {
      const stats = getCRStats('1');
      // CR 1 has hpMin: 71, hpMax: 85
      const expectedHP = Math.floor((71 + 85) / 2);
      expect(stats.hpMultiplier).toBe(expectedHP);
    });
  });

  describe('crToLevel', () => {
    it('should convert CR 0 to level 1', () => {
      expect(crToLevel('0')).toBe(1);
    });

    it('should convert CR 0.5 to level 1', () => {
      expect(crToLevel('0.5')).toBe(1);
    });

    it('should convert CR 1 to level 2', () => {
      expect(crToLevel('1')).toBe(2);
    });

    it('should convert CR 2 to level 4', () => {
      expect(crToLevel('2')).toBe(4);
    });

    it('should convert CR 3-10 approximately to same level', () => {
      expect(crToLevel('3')).toBe(3);
      expect(crToLevel('5')).toBe(5);
      expect(crToLevel('8')).toBe(8);
      expect(crToLevel('10')).toBe(10);
    });

    it('should scale CR above 10 to level', () => {
      expect(crToLevel('15')).toBeGreaterThan(10);
      expect(crToLevel('20')).toBeGreaterThan(15);
    });

    it('should cap level at 20', () => {
      expect(crToLevel('25')).toBeLessThanOrEqual(20);
      expect(crToLevel('30')).toBeLessThanOrEqual(20);
    });

    it('should handle fractional CR values', () => {
      expect(crToLevel('0.25')).toBe(1);
      expect(crToLevel('1/4')).toBe(1);
      expect(crToLevel('1/2')).toBe(1);
    });
  });
});
