// Class-related data and configurations

export const CLASS_SKILLS: Record<string, string[]> = {
  Barbarian: ['ath', 'itm', 'nat', 'prc', 'sur', 'ani'],
  Bard: ['prf', 'per', 'dec', 'his', 'arc', 'inv', 'prc', 'slt', 'ste', 'acr'],
  Cleric: ['his', 'ins', 'med', 'per', 'rel'],
  Druid: ['arc', 'ani', 'ins', 'med', 'nat', 'prc', 'rel', 'sur'],
  Fighter: ['ath', 'acr', 'ani', 'his', 'ins', 'itm', 'prc', 'sur'],
  Monk: ['acr', 'ath', 'his', 'ins', 'rel', 'ste'],
  Paladin: ['ath', 'ins', 'itm', 'med', 'per', 'rel'],
  Ranger: ['ani', 'ath', 'ins', 'inv', 'nat', 'prc', 'ste', 'sur'],
  Rogue: ['acr', 'ath', 'dec', 'ins', 'itm', 'inv', 'prc', 'per', 'slt', 'ste'],
  Sorcerer: ['arc', 'dec', 'ins', 'itm', 'per', 'rel'],
  Warlock: ['arc', 'dec', 'his', 'itm', 'inv', 'nat', 'rel'],
  Wizard: ['arc', 'his', 'ins', 'inv', 'med', 'rel']
};

export const CLASS_FEATURES: Record<string, Record<number, string[]>> = {
  Barbarian: {
    1: ['Rage', 'Unarmored Defense'],
    2: ['Reckless Attack', 'Danger Sense'],
    5: ['Extra Attack', 'Fast Movement']
  },
  Bard: {
    1: ['Bardic Inspiration', 'Spellcasting'],
    2: ['Jack of All Trades'],
    5: ['Font of Inspiration']
  },
  Cleric: {
    1: ['Spellcasting', 'Divine Domain'],
    2: ['Channel Divinity'],
    5: ['Destroy Undead']
  },
  Druid: {
    1: ['Spellcasting', 'Druidic'],
    2: ['Wild Shape', 'Druid Circle'],
    5: ['Wild Shape Improvement']
  },
  Fighter: {
    1: ['Fighting Style', 'Second Wind'],
    2: ['Action Surge'],
    5: ['Extra Attack']
  },
  Monk: {
    1: ['Unarmored Defense', 'Martial Arts'],
    2: ['Ki', 'Unarmored Movement'],
    5: ['Extra Attack', 'Stunning Strike']
  },
  Paladin: {
    1: ['Divine Sense', 'Lay on Hands'],
    2: ['Fighting Style', 'Spellcasting', 'Divine Smite'],
    5: ['Extra Attack']
  },
  Ranger: {
    1: ['Favored Enemy', 'Natural Explorer'],
    2: ['Fighting Style', 'Spellcasting'],
    5: ['Extra Attack']
  },
  Rogue: {
    1: ['Sneak Attack', 'Expertise'],
    2: ['Cunning Action'],
    5: ['Uncanny Dodge']
  },
  Sorcerer: {
    1: ['Spellcasting', 'Sorcerous Origin'],
    2: ['Font of Magic'],
    5: ['Metamagic']
  },
  Warlock: {
    1: ['Otherworldly Patron', 'Pact Magic'],
    2: ['Eldritch Invocations'],
    5: ['Pact Boon']
  },
  Wizard: {
    1: ['Spellcasting', 'Arcane Recovery'],
    2: ['Arcane Tradition'],
    5: ['Arcane Tradition Feature']
  }
};

export const SPELLCASTING_CLASSES = [
  'Bard',
  'Cleric',
  'Druid',
  'Paladin',
  'Ranger',
  'Sorcerer',
  'Warlock',
  'Wizard'
];

export const CLASS_ARMOR_PROFICIENCIES: Record<string, string[]> = {
  Barbarian: ['light', 'medium', 'shield'],
  Bard: ['light'],
  Cleric: ['light', 'medium', 'shield'],
  Druid: ['light', 'medium', 'shield'],
  Fighter: ['light', 'medium', 'heavy', 'shield'],
  Monk: [], // Unarmored
  Paladin: ['light', 'medium', 'heavy', 'shield'],
  Ranger: ['light', 'medium', 'shield'],
  Rogue: ['light'],
  Sorcerer: [],
  Warlock: ['light'],
  Wizard: []
};

export const CLASS_WEAPON_PROFICIENCIES: Record<string, string[]> = {
  Barbarian: ['simple', 'martial'],
  Bard: ['simple', 'hand crossbow', 'longsword', 'rapier', 'shortsword'],
  Cleric: ['simple'],
  Druid: [
    'club',
    'dagger',
    'dart',
    'javelin',
    'mace',
    'quarterstaff',
    'scimitar',
    'sickle',
    'sling',
    'spear'
  ],
  Fighter: ['simple', 'martial'],
  Monk: ['simple', 'shortsword'],
  Paladin: ['simple', 'martial'],
  Ranger: ['simple', 'martial'],
  Rogue: ['simple', 'hand crossbow', 'longsword', 'rapier', 'shortsword'],
  Sorcerer: ['dagger', 'dart', 'sling', 'quarterstaff', 'light crossbow'],
  Warlock: ['simple'],
  Wizard: ['dagger', 'dart', 'sling', 'quarterstaff', 'light crossbow']
};
