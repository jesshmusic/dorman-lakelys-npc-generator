// Damage dice scaling utilities for CR-appropriate damage
import { parseCR } from './crCalculations.js';

interface DamageFormula {
  count: number;
  dieSize: number;
  bonus: number;
  type: string;
}

// Parse damage formula like "2d6+3 slashing" or "1d8" or "4"
export function parseDamageFormula(formula: string): DamageFormula {
  // Remove damage type if present
  const parts = formula.split(' ');
  const dice = parts[0].trim();
  const type = parts[1] || '';

  // Match patterns: "2d6+3", "1d8", "2d6-1", "4"
  const dicePattern = /^(\d+)?d(\d+)([+-]\d+)?$/;
  const flatPattern = /^(\d+)$/;

  const diceMatch = dice.match(dicePattern);
  if (diceMatch) {
    return {
      count: parseInt(diceMatch[1] || '1'),
      dieSize: parseInt(diceMatch[2]),
      bonus: parseInt(diceMatch[3] || '0'),
      type
    };
  }

  const flatMatch = dice.match(flatPattern);
  if (flatMatch) {
    return {
      count: 0,
      dieSize: 0,
      bonus: parseInt(flatMatch[1]),
      type
    };
  }

  // Fallback: treat as flat bonus
  return {
    count: 0,
    dieSize: 0,
    bonus: 0,
    type
  };
}

// Calculate average damage from formula
export function calculateAverageDamage(formula: DamageFormula): number {
  const diceDamage = formula.count * ((formula.dieSize + 1) / 2);
  return diceDamage + formula.bonus;
}

// Get target damage for a CR (using midpoint of CR table range)
export function getTargetDamageForCR(cr: string): number {
  const crValue = parseCR(cr);

  // Based on DMG CR table damage-per-round ranges
  const damageRanges: Record<number, { min: number; max: number }> = {
    0: { min: 0, max: 1 },
    0.125: { min: 2, max: 3 },
    0.25: { min: 4, max: 5 },
    0.5: { min: 6, max: 8 },
    1: { min: 9, max: 14 },
    2: { min: 15, max: 20 },
    3: { min: 21, max: 26 },
    4: { min: 27, max: 32 },
    5: { min: 33, max: 38 },
    6: { min: 39, max: 44 },
    7: { min: 45, max: 50 },
    8: { min: 51, max: 56 },
    9: { min: 57, max: 62 },
    10: { min: 63, max: 68 },
    11: { min: 69, max: 74 },
    12: { min: 75, max: 80 },
    13: { min: 81, max: 86 },
    14: { min: 87, max: 92 },
    15: { min: 93, max: 98 },
    16: { min: 99, max: 104 },
    17: { min: 105, max: 110 },
    18: { min: 111, max: 116 },
    19: { min: 117, max: 122 },
    20: { min: 123, max: 140 },
    21: { min: 141, max: 158 },
    22: { min: 159, max: 176 },
    23: { min: 177, max: 194 },
    24: { min: 195, max: 212 },
    25: { min: 213, max: 230 },
    26: { min: 231, max: 248 },
    27: { min: 249, max: 266 },
    28: { min: 267, max: 284 },
    29: { min: 285, max: 302 },
    30: { min: 303, max: 320 }
  };

  const range = damageRanges[crValue] || damageRanges[1];
  return (range.min + range.max) / 2;
}

// Scale damage formula to target average
export function scaleDamageToTarget(
  originalFormula: string,
  targetDamage: number,
  abilityModifier: number = 0
): string {
  const parsed = parseDamageFormula(originalFormula);

  // If no dice, just return scaled flat damage
  if (parsed.count === 0) {
    return `${Math.max(1, Math.floor(targetDamage))}`;
  }

  // Target damage minus ability modifier gives us dice damage needed
  const targetDiceDamage = Math.max(1, targetDamage - abilityModifier);

  // Standard die sizes in D&D
  const dieSizes = [4, 6, 8, 10, 12];

  // Find best die size and count to match target
  let bestDice = { count: 1, size: 4, diff: Infinity };

  for (const size of dieSizes) {
    const avgPerDie = (size + 1) / 2;
    const count = Math.max(1, Math.round(targetDiceDamage / avgPerDie));
    const avgDamage = count * avgPerDie;
    const diff = Math.abs(avgDamage - targetDiceDamage);

    if (diff < bestDice.diff) {
      bestDice = { count, size, diff };
    }
  }

  // Build formula
  let formula = `${bestDice.count}d${bestDice.size}`;
  if (abilityModifier > 0) {
    formula += `+${abilityModifier}`;
  } else if (abilityModifier < 0) {
    formula += `${abilityModifier}`;
  }

  // Add damage type if original had one
  if (parsed.type) {
    formula += ` ${parsed.type}`;
  }

  return formula;
}

// Scale damage for a specific CR
export function scaleDamageForCR(
  originalFormula: string,
  targetCR: string,
  abilityModifier: number = 0
): string {
  const targetDamage = getTargetDamageForCR(targetCR);
  return scaleDamageToTarget(originalFormula, targetDamage, abilityModifier);
}

// Scale all damage parts in an item (handles multi-damage attacks)
export function scaleDamageParts(
  damageParts: Array<[string, string]>,
  targetCR: string,
  abilityModifier: number = 0
): Array<[string, string]> {
  if (!damageParts || damageParts.length === 0) {
    return damageParts;
  }

  // Scale the primary damage (first part)
  const scaled: Array<[string, string]> = [];
  scaled.push([scaleDamageForCR(damageParts[0][0], targetCR, abilityModifier), damageParts[0][1]]);

  // Keep additional damage types (poison, fire, etc.) but scale them down
  for (let i = 1; i < damageParts.length; i++) {
    const [formula, type] = damageParts[i];
    // Secondary damage at ~50% of primary damage
    const secondaryTarget = getTargetDamageForCR(targetCR) * 0.5;
    scaled.push([scaleDamageToTarget(formula, secondaryTarget, 0), type]);
  }

  return scaled;
}
