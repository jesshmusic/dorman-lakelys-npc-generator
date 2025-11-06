// Template actor mapping for role-based NPC generation
// Maps roles to template actors from D&D 5e compendiums

export type TemplateCategory =
  | 'MARTIAL_COMBATANT'
  | 'SKIRMISHER'
  | 'ARCANE_CASTER'
  | 'DIVINE_CASTER'
  | 'SUPPORT_PERFORMER'
  | 'NOBLE_AUTHORITY'
  | 'SKILLED_ARTISAN'
  | 'MERCHANT_SERVICE'
  | 'SCHOLARLY'
  | 'COMMON_FOLK'
  | 'ADVENTURER_SPECIALIST';

export interface TemplateMapping {
  category: TemplateCategory;
  primaryTemplate: string;
  fallbackTemplate: string;
  preserveFeatures: string[];
  roles: string[];
}

// Template mappings with primary and fallback options
export const TEMPLATE_CATEGORIES: TemplateMapping[] = [
  {
    category: 'MARTIAL_COMBATANT',
    primaryTemplate: 'Veteran',
    fallbackTemplate: 'Guard',
    preserveFeatures: ['Multiattack', 'Parry'],
    roles: ['Fighter', 'Guard Captain', 'City Guard', 'Mercenary', 'Bounty Hunter']
  },
  {
    category: 'SKIRMISHER',
    primaryTemplate: 'Assassin',
    fallbackTemplate: 'Bandit',
    preserveFeatures: ['Assassinate', 'Sneak Attack', 'Cunning Action', 'Evasion'],
    roles: ['Rogue', 'Assassin', 'Spy', 'Thief', 'Smuggler', 'Street Urchin', 'Criminal Contact']
  },
  {
    category: 'ARCANE_CASTER',
    primaryTemplate: 'Mage',
    fallbackTemplate: 'Acolyte',
    preserveFeatures: ['Spellcasting'],
    roles: ['Wizard', 'Sorcerer', 'Warlock', 'Witch', 'Alchemist']
  },
  {
    category: 'DIVINE_CASTER',
    primaryTemplate: 'Priest',
    fallbackTemplate: 'Acolyte',
    preserveFeatures: ['Spellcasting', 'Divine Eminence'],
    roles: ['Cleric', 'Druid', 'Healer', 'Priest', 'Acolyte', 'Herbalist']
  },
  {
    category: 'SUPPORT_PERFORMER',
    primaryTemplate: 'Noble',
    fallbackTemplate: 'Commoner',
    preserveFeatures: [],
    roles: ['Bard', 'Entertainer', 'Minstrel', 'Artist', 'Fortune Teller', 'Barkeep']
  },
  {
    category: 'NOBLE_AUTHORITY',
    primaryTemplate: 'Noble',
    fallbackTemplate: 'Knight',
    preserveFeatures: ['Parry', 'Leadership'],
    roles: ['Noble', 'Diplomat', 'Politician', 'Guildmaster', 'Tax Collector', 'Town Crier']
  },
  {
    category: 'SKILLED_ARTISAN',
    primaryTemplate: 'Commoner',
    fallbackTemplate: 'Commoner',
    preserveFeatures: [],
    roles: [
      'Blacksmith',
      'Armorer',
      'Weaponsmith',
      'Fletcher',
      'Leatherworker',
      'Jeweler',
      'Jeweler (Artisan)',
      'Cartographer'
    ]
  },
  {
    category: 'MERCHANT_SERVICE',
    primaryTemplate: 'Commoner',
    fallbackTemplate: 'Noble',
    preserveFeatures: [],
    roles: [
      'Merchant',
      'Innkeeper',
      'Tavern Keeper',
      'Cook',
      'Pawnbroker',
      'Fence',
      'Caravan Master',
      'Stable Master',
      'Guide'
    ]
  },
  {
    category: 'SCHOLARLY',
    primaryTemplate: 'Acolyte',
    fallbackTemplate: 'Mage',
    preserveFeatures: [],
    roles: ['Scholar', 'Sage', 'Scribe', 'Librarian']
  },
  {
    category: 'COMMON_FOLK',
    primaryTemplate: 'Commoner',
    fallbackTemplate: 'Commoner',
    preserveFeatures: [],
    roles: ['Farmer', 'Fisherman', 'Miner', 'Beggar', 'Servant', 'Laborer', 'Hermit', 'Exile']
  },
  {
    category: 'ADVENTURER_SPECIALIST',
    primaryTemplate: 'Bandit Captain',
    fallbackTemplate: 'Veteran',
    preserveFeatures: ['Multiattack'],
    roles: [
      'Pirate',
      'Bandit',
      'Sailor',
      'Explorer',
      'Cultist',
      'Barbarian',
      'Paladin',
      'Ranger',
      'Monk'
    ]
  }
];

// Quick lookup: role name → template mapping
export function getTemplateMappingForRole(role: string): TemplateMapping | null {
  for (const mapping of TEMPLATE_CATEGORIES) {
    if (mapping.roles.includes(role)) {
      return mapping;
    }
  }
  return null;
}

// Get template name for a role with fallback logic
export function getTemplateActorName(role: string, preferPrimary: boolean = true): string {
  const mapping = getTemplateMappingForRole(role);
  if (!mapping) {
    // Ultimate fallback
    return 'Commoner';
  }

  return preferPrimary ? mapping.primaryTemplate : mapping.fallbackTemplate;
}

// Check if a feature should be preserved from template
export function shouldPreserveFeature(role: string, featureName: string): boolean {
  const mapping = getTemplateMappingForRole(role);
  if (!mapping) return false;

  return mapping.preserveFeatures.some(preserved =>
    featureName.toLowerCase().includes(preserved.toLowerCase())
  );
}
