// CR-related calculations and utilities
// Based on official D&D 5e CR calculation table

export interface CRStats {
  proficiencyBonus: number;
  baseAbilityScore: number;
  hpMultiplier: number;
  baseAC: number;
  attackBonus: number;
  saveDC: number;
  xp: number;
}

// Official CR table from D&D 5e
interface CRTableEntry {
  xp: number;
  profBonus: number;
  ac: number;
  hpMin: number;
  hpMax: number;
  attackBonus: number;
  damageMin: number;
  damageMax: number;
  saveDC: number;
}

const CR_TABLE: Record<string, CRTableEntry> = {
  '0': {
    xp: 10,
    profBonus: 2,
    ac: 13,
    hpMin: 1,
    hpMax: 6,
    attackBonus: 3,
    damageMin: 0,
    damageMax: 1,
    saveDC: 13
  },
  '0.125': {
    xp: 25,
    profBonus: 2,
    ac: 13,
    hpMin: 7,
    hpMax: 35,
    attackBonus: 3,
    damageMin: 2,
    damageMax: 3,
    saveDC: 13
  },
  '0.25': {
    xp: 50,
    profBonus: 2,
    ac: 13,
    hpMin: 36,
    hpMax: 49,
    attackBonus: 3,
    damageMin: 4,
    damageMax: 5,
    saveDC: 13
  },
  '0.5': {
    xp: 100,
    profBonus: 2,
    ac: 13,
    hpMin: 50,
    hpMax: 70,
    attackBonus: 3,
    damageMin: 6,
    damageMax: 8,
    saveDC: 13
  },
  '1': {
    xp: 200,
    profBonus: 2,
    ac: 13,
    hpMin: 71,
    hpMax: 85,
    attackBonus: 3,
    damageMin: 9,
    damageMax: 14,
    saveDC: 13
  },
  '2': {
    xp: 450,
    profBonus: 2,
    ac: 13,
    hpMin: 86,
    hpMax: 100,
    attackBonus: 3,
    damageMin: 15,
    damageMax: 20,
    saveDC: 13
  },
  '3': {
    xp: 700,
    profBonus: 2,
    ac: 13,
    hpMin: 101,
    hpMax: 115,
    attackBonus: 4,
    damageMin: 21,
    damageMax: 26,
    saveDC: 13
  },
  '4': {
    xp: 1100,
    profBonus: 2,
    ac: 14,
    hpMin: 116,
    hpMax: 130,
    attackBonus: 5,
    damageMin: 27,
    damageMax: 32,
    saveDC: 14
  },
  '5': {
    xp: 1800,
    profBonus: 3,
    ac: 15,
    hpMin: 131,
    hpMax: 145,
    attackBonus: 6,
    damageMin: 33,
    damageMax: 38,
    saveDC: 15
  },
  '6': {
    xp: 2300,
    profBonus: 3,
    ac: 15,
    hpMin: 146,
    hpMax: 160,
    attackBonus: 6,
    damageMin: 39,
    damageMax: 44,
    saveDC: 15
  },
  '7': {
    xp: 2900,
    profBonus: 3,
    ac: 15,
    hpMin: 161,
    hpMax: 175,
    attackBonus: 6,
    damageMin: 45,
    damageMax: 50,
    saveDC: 15
  },
  '8': {
    xp: 3900,
    profBonus: 3,
    ac: 16,
    hpMin: 176,
    hpMax: 190,
    attackBonus: 7,
    damageMin: 51,
    damageMax: 56,
    saveDC: 16
  },
  '9': {
    xp: 5000,
    profBonus: 4,
    ac: 16,
    hpMin: 191,
    hpMax: 205,
    attackBonus: 7,
    damageMin: 57,
    damageMax: 62,
    saveDC: 16
  },
  '10': {
    xp: 5900,
    profBonus: 4,
    ac: 17,
    hpMin: 206,
    hpMax: 220,
    attackBonus: 7,
    damageMin: 63,
    damageMax: 68,
    saveDC: 16
  },
  '11': {
    xp: 7200,
    profBonus: 4,
    ac: 17,
    hpMin: 221,
    hpMax: 235,
    attackBonus: 8,
    damageMin: 69,
    damageMax: 74,
    saveDC: 17
  },
  '12': {
    xp: 8400,
    profBonus: 4,
    ac: 17,
    hpMin: 236,
    hpMax: 250,
    attackBonus: 8,
    damageMin: 75,
    damageMax: 80,
    saveDC: 18
  },
  '13': {
    xp: 10000,
    profBonus: 5,
    ac: 18,
    hpMin: 251,
    hpMax: 265,
    attackBonus: 8,
    damageMin: 81,
    damageMax: 86,
    saveDC: 18
  },
  '14': {
    xp: 11500,
    profBonus: 5,
    ac: 18,
    hpMin: 266,
    hpMax: 280,
    attackBonus: 8,
    damageMin: 87,
    damageMax: 92,
    saveDC: 18
  },
  '15': {
    xp: 13000,
    profBonus: 5,
    ac: 18,
    hpMin: 281,
    hpMax: 295,
    attackBonus: 8,
    damageMin: 93,
    damageMax: 98,
    saveDC: 18
  },
  '16': {
    xp: 15000,
    profBonus: 5,
    ac: 18,
    hpMin: 296,
    hpMax: 310,
    attackBonus: 9,
    damageMin: 99,
    damageMax: 104,
    saveDC: 18
  },
  '17': {
    xp: 18000,
    profBonus: 6,
    ac: 19,
    hpMin: 311,
    hpMax: 325,
    attackBonus: 10,
    damageMin: 105,
    damageMax: 110,
    saveDC: 19
  },
  '18': {
    xp: 20000,
    profBonus: 6,
    ac: 19,
    hpMin: 326,
    hpMax: 340,
    attackBonus: 10,
    damageMin: 111,
    damageMax: 116,
    saveDC: 19
  },
  '19': {
    xp: 22000,
    profBonus: 6,
    ac: 19,
    hpMin: 341,
    hpMax: 355,
    attackBonus: 10,
    damageMin: 117,
    damageMax: 122,
    saveDC: 19
  },
  '20': {
    xp: 25000,
    profBonus: 6,
    ac: 19,
    hpMin: 356,
    hpMax: 400,
    attackBonus: 10,
    damageMin: 123,
    damageMax: 140,
    saveDC: 19
  },
  '21': {
    xp: 33000,
    profBonus: 7,
    ac: 19,
    hpMin: 401,
    hpMax: 445,
    attackBonus: 11,
    damageMin: 141,
    damageMax: 158,
    saveDC: 20
  },
  '22': {
    xp: 41000,
    profBonus: 7,
    ac: 19,
    hpMin: 446,
    hpMax: 490,
    attackBonus: 11,
    damageMin: 159,
    damageMax: 176,
    saveDC: 20
  },
  '23': {
    xp: 50000,
    profBonus: 7,
    ac: 19,
    hpMin: 491,
    hpMax: 535,
    attackBonus: 11,
    damageMin: 177,
    damageMax: 194,
    saveDC: 20
  },
  '24': {
    xp: 62000,
    profBonus: 7,
    ac: 19,
    hpMin: 536,
    hpMax: 580,
    attackBonus: 11,
    damageMin: 195,
    damageMax: 212,
    saveDC: 21
  },
  '25': {
    xp: 75000,
    profBonus: 8,
    ac: 19,
    hpMin: 581,
    hpMax: 625,
    attackBonus: 12,
    damageMin: 213,
    damageMax: 230,
    saveDC: 21
  },
  '26': {
    xp: 90000,
    profBonus: 8,
    ac: 19,
    hpMin: 626,
    hpMax: 670,
    attackBonus: 12,
    damageMin: 231,
    damageMax: 248,
    saveDC: 21
  },
  '27': {
    xp: 105000,
    profBonus: 8,
    ac: 19,
    hpMin: 671,
    hpMax: 715,
    attackBonus: 13,
    damageMin: 249,
    damageMax: 266,
    saveDC: 22
  },
  '28': {
    xp: 120000,
    profBonus: 8,
    ac: 19,
    hpMin: 716,
    hpMax: 760,
    attackBonus: 13,
    damageMin: 267,
    damageMax: 284,
    saveDC: 22
  },
  '29': {
    xp: 135000,
    profBonus: 9,
    ac: 19,
    hpMin: 761,
    hpMax: 805,
    attackBonus: 13,
    damageMin: 285,
    damageMax: 302,
    saveDC: 22
  },
  '30': {
    xp: 155000,
    profBonus: 9,
    ac: 19,
    hpMin: 806,
    hpMax: 850,
    attackBonus: 14,
    damageMin: 303,
    damageMax: 320,
    saveDC: 23
  }
};

export function parseCR(cr: string): number {
  if (cr.includes('/')) {
    const [numerator, denominator] = cr.split('/').map(Number);
    return numerator / denominator;
  }
  return parseFloat(cr);
}

export function getCRStats(cr: string): CRStats {
  const crValue = parseCR(cr);

  // Look up in official CR table
  const entry = CR_TABLE[cr] || CR_TABLE['1']; // Default to CR 1 if not found

  // Base ability scores scale with CR
  // CR 0: 10, CR 1: 12, CR 5: 14, CR 10: 16, CR 20: 18, CR 30: 20
  let baseAbilityScore: number;
  if (crValue <= 0) baseAbilityScore = 10;
  else if (crValue <= 1) baseAbilityScore = 12;
  else if (crValue <= 5) baseAbilityScore = 13 + Math.floor((crValue - 1) / 4);
  else if (crValue <= 10) baseAbilityScore = 14 + Math.floor((crValue - 5) / 2.5);
  else if (crValue <= 20) baseAbilityScore = 16 + Math.floor((crValue - 10) / 5);
  else baseAbilityScore = Math.min(20, 18 + Math.floor((crValue - 20) / 5));

  // Use midpoint of HP range for hpMultiplier
  const hpMultiplier = Math.floor((entry.hpMin + entry.hpMax) / 2);

  return {
    proficiencyBonus: entry.profBonus,
    baseAbilityScore,
    hpMultiplier,
    baseAC: entry.ac,
    attackBonus: entry.attackBonus,
    saveDC: entry.saveDC,
    xp: entry.xp
  };
}

export function crToLevel(cr: string): number {
  const crValue = parseCR(cr);

  let level = 1;
  if (crValue <= 0.5) level = 1;
  else if (crValue <= 2) level = Math.ceil(crValue * 2);
  else if (crValue <= 10) level = Math.ceil(crValue);
  else level = Math.min(20, Math.ceil(crValue * 0.8));

  return level;
}
