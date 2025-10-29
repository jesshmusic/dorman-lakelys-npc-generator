// Core NPC generation logic
import { getCRStats, parseCR } from '../utils/crCalculations.js';
import { CLASS_SKILLS } from '../utils/classData.js';

export interface NPC {
  name: string;
  description: string;
  species: string;
  alignment: string;
  challengeRating: string;
  class: string;
  abilities: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  hp: number;
  ac: number;
  speed: {
    walk: number;
    fly?: number;
    climb?: number;
    swim?: number;
  };
  skills: string[];
  saves: string[];
  languages: string[];
  currency: {
    cp: number;
    sp: number;
    ep: number;
    gp: number;
    pp: number;
  };
  portrait?: string;
  token?: string;
}

export class NPCGenerator {
  static readonly SPECIES = [
    // Common PC Races
    'Human',
    'Elf',
    'Dwarf',
    'Halfling',
    'Gnome',
    'Half-Elf',
    'Half-Orc',
    'Tiefling',
    'Dragonborn',
    // Exotic PC Races
    'Aarakocra',
    'Firbolg',
    'Genasi',
    'Goliath',
    'Kenku',
    'Tabaxi',
    'Triton',
    'Tortle',
    'Yuan-ti Pureblood',
    // Monstrous Humanoids
    'Goblin',
    'Hobgoblin',
    'Bugbear',
    'Orc',
    'Kobold',
    'Gnoll',
    'Lizardfolk',
    'Bullywug',
    'Grung',
    'Troglodyte',
    // Large Humanoids
    'Ogre',
    'Troll',
    'Minotaur',
    'Centaur',
    // Fey Humanoids
    'Satyr',
    'Changeling'
  ];

  static readonly FLAVORS = [
    // Campaign Settings
    'Forgotten Realms',
    'Greyhawk',
    'Eberron',
    'Dragonlance',
    'Dark Sun',
    'Ravenloft',
    'Curse of Strahd',
    'Icewind Dale',
    'Waterdeep',
    "Baldur's Gate",
    'Spelljammer',
    'Planescape',
    // Generic/Historical Flavors
    'Viking',
    'Celtic',
    'Medieval European',
    'Arabian Nights',
    'Ancient Greek',
    'Ancient Roman',
    'Egyptian',
    'Asian (Wuxia)',
    'Samurai',
    'Wild West',
    'Pirate',
    'Post-Apocalyptic',
    'Steampunk',
    'Gothic Horror',
    'Cosmic Horror',
    'Fairy Tale',
    'Arthurian',
    'Nordic/Norse',
    'Polynesian',
    'Aztec/Mayan',
    'Swashbuckler',
    'Noir Detective'
  ];

  static readonly GENDERS = [
    'Male',
    'Female',
    'Non-binary',
    'Androgynous',
    'Genderfluid',
    'Agender',
    'Other'
  ];

  static readonly ALIGNMENTS = [
    'Lawful Good',
    'Neutral Good',
    'Chaotic Good',
    'Lawful Neutral',
    'True Neutral',
    'Chaotic Neutral',
    'Lawful Evil',
    'Neutral Evil',
    'Chaotic Evil'
  ];

  static readonly CHALLENGE_RATINGS = [
    '0',
    '1/8',
    '1/4',
    '1/2',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    '11',
    '12',
    '13',
    '14',
    '15',
    '16',
    '17',
    '18',
    '19',
    '20',
    '21',
    '22',
    '23',
    '24',
    '25',
    '26',
    '27',
    '28',
    '29',
    '30'
  ];

  static readonly ROLES = [
    // Adventurer Classes
    'Fighter',
    'Barbarian',
    'Wizard',
    'Sorcerer',
    'Cleric',
    'Druid',
    'Rogue',
    'Ranger',
    'Paladin',
    'Monk',
    'Bard',
    'Warlock',
    // Adventure NPCs
    'Spy',
    'Assassin',
    'Bounty Hunter',
    'Smuggler',
    'Pirate',
    'Bandit',
    'Mercenary',
    'Explorer',
    'Sailor',
    'Criminal Contact',
    // Authority & Leadership
    'Noble',
    'Guildmaster',
    'Diplomat',
    'Politician',
    'City Guard',
    'Guard Captain',
    'Town Crier',
    'Tax Collector',
    // Religion & Magic
    'Priest',
    'Acolyte',
    'Healer',
    'Alchemist',
    'Herbalist',
    'Fortune Teller',
    // Merchants & Traders
    'Merchant',
    'Pawnbroker',
    'Jeweler',
    'Fence',
    'Caravan Master',
    // Artisans & Crafters
    'Blacksmith',
    'Armorer',
    'Weaponsmith',
    'Fletcher',
    'Leatherworker',
    'Jeweler (Artisan)',
    // Service & Hospitality
    'Innkeeper',
    'Tavern Keeper',
    'Cook',
    'Barkeep',
    'Stable Master',
    'Guide',
    // Scholars & Artists
    'Scholar',
    'Scribe',
    'Cartographer',
    'Librarian',
    'Sage',
    'Minstrel',
    'Entertainer',
    'Artist',
    // Common Folk
    'Farmer',
    'Fisherman',
    'Miner',
    'Beggar',
    'Street Urchin',
    'Servant',
    'Laborer',
    // Outcasts & Criminals
    'Thief',
    'Cultist',
    'Witch',
    'Hermit',
    'Exile'
  ];

  static readonly PERSONALITIES = [
    'Argumentative and stubborn',
    'Arrogant and condescending',
    'Blustering and boastful',
    'Curious and inquisitive',
    'Friendly and helpful',
    'Honest and straightforward',
    'Hot-tempered and quick to anger',
    'Irritable and impatient',
    'Ponderous and slow to act',
    'Quiet and reserved',
    'Rude and insulting',
    'Suspicious and paranoid'
  ];

  static readonly IDEALS = [
    '<b>Beauty</b>. Life is meant to be beautiful. (Good)',
    '<b>Charity</b>. I always help those in need. (Good)',
    '<b>Community</b>. We must take care of each other. (Good)',
    '<b>Fairness</b>. No one should be treated unfairly. (Good)',
    '<b>Freedom</b>. Everyone should be free. (Chaotic)',
    '<b>Glory</b>. I must earn glory in battle. (Any)',
    '<b>Greater Good</b>. My gifts are meant to help others. (Good)',
    '<b>Greed</b>. I will do anything to become wealthy. (Evil)',
    '<b>Honor</b>. I keep my word. (Lawful)',
    '<b>Independence</b>. I am a free spirit. (Chaotic)',
    '<b>Knowledge</b>. The path to power is through knowledge. (Neutral)',
    '<b>Power</b>. I will become the greatest. (Evil)',
    '<b>Redemption</b>. There is a spark of good in everyone. (Good)',
    '<b>Tradition</b>. The old ways must be preserved. (Lawful)'
  ];

  static readonly BONDS = [
    'I would die to recover an ancient artifact that was stolen from me.',
    'I will face any challenge to win the approval of my family.',
    "My house's alliance with another house must be sustained.",
    'Nothing is more important than the other members of my family.',
    'I am in love with the heir of a family that my family despises.',
    'I owe my life to someone who saved me from a terrible fate.',
    'Someone I loved died because of a mistake I made.',
    'My loyalty to my sovereign is unwavering.',
    'The common folk must see me as a hero.',
    'I have a family, but I have no idea where they are.',
    'I worked the land, I love the land, and I will protect the land.',
    'A proud noble once gave me a horrible beating, and I will take revenge.'
  ];

  private static getSpeed(species: string): NPC['speed'] {
    const speedMap: Record<string, NPC['speed']> = {
      // Common PC Races
      Human: { walk: 30 },
      Elf: { walk: 30 },
      Dwarf: { walk: 25 },
      Halfling: { walk: 25 },
      Gnome: { walk: 25 },
      'Half-Elf': { walk: 30 },
      'Half-Orc': { walk: 30 },
      Tiefling: { walk: 30 },
      Dragonborn: { walk: 30 },
      // Exotic PC Races
      Aarakocra: { walk: 25, fly: 50 },
      Firbolg: { walk: 30 },
      Genasi: { walk: 30 },
      Goliath: { walk: 30 },
      Kenku: { walk: 30 },
      Tabaxi: { walk: 30, climb: 20 },
      Triton: { walk: 30, swim: 30 },
      Tortle: { walk: 30 },
      'Yuan-ti Pureblood': { walk: 30 },
      // Monstrous Humanoids
      Goblin: { walk: 30 },
      Hobgoblin: { walk: 30 },
      Bugbear: { walk: 30 },
      Orc: { walk: 30 },
      Kobold: { walk: 30 },
      Gnoll: { walk: 30 },
      Lizardfolk: { walk: 30, swim: 30 },
      Bullywug: { walk: 20, swim: 40 },
      Grung: { walk: 25, climb: 25 },
      Troglodyte: { walk: 30 },
      // Large Humanoids
      Ogre: { walk: 40 },
      Troll: { walk: 30 },
      Minotaur: { walk: 40 },
      Centaur: { walk: 40 },
      // Fey Humanoids
      Satyr: { walk: 35 },
      Changeling: { walk: 30 }
    };
    return speedMap[species] || { walk: 30 };
  }

  private static getLanguages(species: string): string[] {
    const languageMap: Record<string, string[]> = {
      // Common PC Races
      Human: ['Common'],
      Elf: ['Common', 'Elvish'],
      Dwarf: ['Common', 'Dwarvish'],
      Halfling: ['Common', 'Halfling'],
      Gnome: ['Common', 'Gnomish'],
      'Half-Elf': ['Common', 'Elvish'],
      'Half-Orc': ['Common', 'Orc'],
      Tiefling: ['Common', 'Infernal'],
      Dragonborn: ['Common', 'Draconic'],
      // Exotic PC Races
      Aarakocra: ['Common', 'Aarakocra', 'Auran'],
      Firbolg: ['Common', 'Elvish', 'Giant'],
      Genasi: ['Common', 'Primordial'],
      Goliath: ['Common', 'Giant'],
      Kenku: ['Common', 'Auran'],
      Tabaxi: ['Common'],
      Triton: ['Common', 'Primordial'],
      Tortle: ['Common', 'Aquan'],
      'Yuan-ti Pureblood': ['Common', 'Abyssal', 'Draconic'],
      // Monstrous Humanoids
      Goblin: ['Common', 'Goblin'],
      Hobgoblin: ['Common', 'Goblin'],
      Bugbear: ['Common', 'Goblin'],
      Orc: ['Common', 'Orc'],
      Kobold: ['Common', 'Draconic'],
      Gnoll: ['Gnoll'],
      Lizardfolk: ['Draconic'],
      Bullywug: ['Bullywug'],
      Grung: ['Grung'],
      Troglodyte: ['Troglodyte'],
      // Large Humanoids
      Ogre: ['Common', 'Giant'],
      Troll: ['Giant'],
      Minotaur: ['Abyssal'],
      Centaur: ['Elvish', 'Sylvan'],
      // Fey Humanoids
      Satyr: ['Common', 'Elvish', 'Sylvan'],
      Changeling: ['Common']
    };
    return languageMap[species] || ['Common'];
  }

  private static generateSkills(cr: string, classType: string): string[] {
    const crValue = parseCR(cr);

    // Number of skill proficiencies based on CR
    let numSkills = 2;
    if (crValue >= 5) numSkills = 3;
    if (crValue >= 10) numSkills = 4;
    if (crValue >= 15) numSkills = 5;
    if (crValue >= 20) numSkills = 6;

    const preferredSkills = CLASS_SKILLS[classType] || [];

    // Select from preferred skills first, then fill with random skills if needed
    const allSkills = [
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

    const skills: string[] = [];

    // Add preferred skills first
    for (const skill of preferredSkills) {
      if (skills.length >= numSkills) break;
      if (!skills.includes(skill)) {
        skills.push(skill);
      }
    }

    // Fill remaining with random skills if needed
    const remainingSkills = allSkills.filter(s => !skills.includes(s));
    const shuffled = [...remainingSkills].sort(() => Math.random() - 0.5);
    for (const skill of shuffled) {
      if (skills.length >= numSkills) break;
      skills.push(skill);
    }

    return skills;
  }

  private static generateSaves(cr: string, abilities: NPC['abilities']): string[] {
    const crValue = parseCR(cr);

    // Number of save proficiencies based on CR
    let numSaves = 1;
    if (crValue >= 5) numSaves = 2;
    if (crValue >= 10) numSaves = 3;
    if (crValue >= 20) numSaves = 4;

    // Pick saves based on highest ability scores
    const abilityEntries = Object.entries(abilities).sort((a, b) => b[1] - a[1]);

    return abilityEntries.slice(0, numSaves).map(([ability]) => ability);
  }

  private static generateAbilities(cr: string, species: string, role: string): NPC['abilities'] {
    const stats = getCRStats(cr);
    const base = stats.baseAbilityScore;
    const variance = 3; // Increased from 2 for more variety

    // Apply species modifiers (based on D&D 5e racial traits)
    const speciesModifiers: Record<string, Partial<NPC['abilities']>> = {
      // Common PC Races
      Human: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 },
      Elf: { dex: 2, int: 1 },
      Dwarf: { con: 2, wis: 1 },
      Halfling: { dex: 2, cha: 1 },
      Gnome: { int: 2, dex: 1 },
      'Half-Elf': { cha: 2, dex: 1, con: 1 },
      'Half-Orc': { str: 2, con: 1 },
      Tiefling: { cha: 2, int: 1 },
      Dragonborn: { str: 2, cha: 1 },
      // Exotic PC Races
      Aarakocra: { dex: 2, wis: 1 },
      Firbolg: { wis: 2, str: 1 },
      Genasi: { con: 2 }, // Varies by type, using generic
      Goliath: { str: 2, con: 1 },
      Kenku: { dex: 2, wis: 1 },
      Tabaxi: { dex: 2, cha: 1 },
      Triton: { str: 1, con: 1, cha: 1 },
      Tortle: { str: 2, wis: 1 },
      'Yuan-ti Pureblood': { cha: 2, int: 1 },
      // Monstrous Humanoids (Small/Medium)
      Goblin: { dex: 2, con: 1 },
      Hobgoblin: { con: 2, int: 1 },
      Bugbear: { str: 2, dex: 1 },
      Orc: { str: 2, con: 1, int: -1 },
      Kobold: { dex: 2, str: -2 },
      Gnoll: { str: 2, con: 1 },
      Lizardfolk: { con: 2, wis: 1 },
      Bullywug: { str: 1, dex: 1 },
      Grung: { dex: 2, con: 1 },
      Troglodyte: { str: 1, con: 2, int: -2 },
      // Large Humanoids
      Ogre: { str: 4, con: 2, int: -2, cha: -1 },
      Troll: { str: 3, con: 3, int: -2, wis: -1 },
      Minotaur: { str: 2, con: 1 },
      Centaur: { str: 2, wis: 1 },
      // Fey Humanoids
      Satyr: { cha: 2, dex: 1 },
      Changeling: { cha: 2, dex: 1 }
    };

    // Role-based ability priorities (primary stats get +2-4, secondary +1-2)
    const roleModifiers: Record<string, Partial<NPC['abilities']>> = {
      // Martial Classes - STR/DEX focused
      Fighter: { str: 3, con: 2, dex: 1 },
      Barbarian: { str: 4, con: 3, dex: 1 },
      Paladin: { str: 3, cha: 2, con: 1 },
      Ranger: { dex: 3, wis: 2, con: 1 },
      Monk: { dex: 3, wis: 2, str: 1 },

      // Dexterity-based
      Rogue: { dex: 4, int: 2, cha: 1 },

      // Spellcasters - Mental stats
      Wizard: { int: 4, con: 1, dex: 1 },
      Sorcerer: { cha: 4, con: 2, dex: 1 },
      Warlock: { cha: 4, con: 2, dex: 1 },
      Bard: { cha: 4, dex: 2, con: 1 },
      Cleric: { wis: 4, con: 2, str: 1 },
      Druid: { wis: 4, con: 2, int: 1 },

      // Non-adventurer roles - varied stats
      Noble: { cha: 3, int: 2, wis: 1 },
      Merchant: { cha: 3, int: 2, wis: 1 },
      Guard: { str: 2, con: 2, dex: 1 },
      Priest: { wis: 3, cha: 2, con: 1 },
      Scholar: { int: 4, wis: 2 },
      Thief: { dex: 4, cha: 1, int: 1 },
      Blacksmith: { str: 3, con: 3 },
      Innkeeper: { cha: 2, wis: 2, con: 1 },
      Healer: { wis: 3, int: 2, cha: 1 },
      Entertainer: { cha: 4, dex: 2 },
      Sailor: { str: 2, dex: 2, con: 2 },
      Explorer: { con: 2, wis: 2, dex: 2 },

      // Add defaults for other roles
      Spy: { dex: 3, cha: 2, int: 2 },
      Assassin: { dex: 4, int: 2 },
      'Bounty Hunter': { str: 2, dex: 2, wis: 2 },
      Smuggler: { dex: 3, cha: 2, int: 1 },
      Pirate: { str: 2, dex: 2, con: 2 },
      Bandit: { dex: 3, str: 2 },
      Mercenary: { str: 3, con: 2 },
      Guildmaster: { cha: 3, int: 2, wis: 2 },
      Diplomat: { cha: 4, wis: 2, int: 1 },
      Alchemist: { int: 4, dex: 2 },
      'Fortune Teller': { wis: 3, cha: 3 },
      Cultist: { cha: 2, wis: 2, int: 1 },
      Witch: { int: 3, wis: 3 },
      Hermit: { wis: 4, con: 2 }
    };

    const speciesMods = speciesModifiers[species] || {};
    const roleMods = roleModifiers[role] || { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 };

    // Random variance for each ability
    const rand = () => Math.floor(Math.random() * variance * 2) - variance;

    return {
      str: Math.max(1, base + rand() + (speciesMods.str || 0) + (roleMods.str || 0)),
      dex: Math.max(1, base + rand() + (speciesMods.dex || 0) + (roleMods.dex || 0)),
      con: Math.max(1, base + rand() + (speciesMods.con || 0) + (roleMods.con || 0)),
      int: Math.max(1, base + rand() + (speciesMods.int || 0) + (roleMods.int || 0)),
      wis: Math.max(1, base + rand() + (speciesMods.wis || 0) + (roleMods.wis || 0)),
      cha: Math.max(1, base + rand() + (speciesMods.cha || 0) + (roleMods.cha || 0))
    };
  }

  private static generateCurrency(cr: string): NPC['currency'] {
    const crValue = parseCR(cr);

    // Currency based on CR (using DMG individual treasure tables as rough guide)
    let gp: number;
    if (crValue <= 0.5) {
      gp = Math.floor(Math.random() * 10) + 1; // 1-10 gp
    } else if (crValue <= 4) {
      gp = Math.floor(Math.random() * 50) + 10; // 10-60 gp
    } else if (crValue <= 10) {
      gp = Math.floor(Math.random() * 200) + 50; // 50-250 gp
    } else if (crValue <= 16) {
      gp = Math.floor(Math.random() * 500) + 200; // 200-700 gp
    } else {
      gp = Math.floor(Math.random() * 1000) + 500; // 500-1500 gp
    }

    return {
      cp: 0,
      sp: 0,
      ep: 0,
      gp,
      pp: 0
    };
  }

  static generateNPC(data: Partial<NPC>): NPC {
    const species = data.species || NPCGenerator.SPECIES[0];
    const cr = data.challengeRating || NPCGenerator.CHALLENGE_RATINGS[0];
    const classType = data.class || NPCGenerator.ROLES[0];
    const abilities = this.generateAbilities(cr, species, classType);
    const stats = getCRStats(cr);

    // HP is directly from DMG chart, with small CON modifier adjustment
    const conMod = Math.floor((abilities.con - 10) / 2);
    const hp = Math.max(1, stats.hpMultiplier + Math.floor(conMod * 2));

    // AC comes from equipped armor (set in UI)
    const ac = stats.baseAC;

    // Generate saves, then skills and other attributes
    const saves = this.generateSaves(cr, abilities);
    const skills = this.generateSkills(cr, classType);
    const speed = this.getSpeed(species);
    const languages = this.getLanguages(species);
    const currency = this.generateCurrency(cr);

    return {
      name: data.name || '',
      description: data.description || '',
      species,
      alignment: data.alignment || NPCGenerator.ALIGNMENTS[0],
      challengeRating: cr,
      class: classType,
      abilities,
      hp,
      ac,
      speed,
      skills,
      saves,
      languages,
      currency,
      portrait: data.portrait || undefined,
      token: data.token || undefined
    };
  }
}
