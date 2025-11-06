// Template actor scaling utilities for CR-based NPC generation
import { getCRStats, parseCR } from './crCalculations.js';
import { scaleDamageParts } from './damageScaling.js';
import { shouldPreserveFeature } from './templateData.js';
import type { NPC } from '../generator/ExistentialNPCGenerator.js';

// Get ability modifier from ability score
export function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

// Scale template actor data to target CR and NPC specifications
export function scaleTemplateActorToCR(templateData: any, npc: NPC, role: string): any {
  const crStats = getCRStats(npc.challengeRating);
  const crValue = parseCR(npc.challengeRating);

  // Clone template data to avoid mutation
  const scaled = foundry.utils.duplicate(templateData);

  // 1. Update basic info
  scaled.name = npc.name;
  scaled.img = npc.portrait || templateData.img;

  // 2. Scale ability scores (use NPC generation logic for consistency)
  scaled.system.abilities = {
    str: { value: npc.abilities.str, proficient: 0 },
    dex: { value: npc.abilities.dex, proficient: 0 },
    con: { value: npc.abilities.con, proficient: 0 },
    int: { value: npc.abilities.int, proficient: 0 },
    wis: { value: npc.abilities.wis, proficient: 0 },
    cha: { value: npc.abilities.cha, proficient: 0 }
  };

  // 3. Scale HP to CR table value
  const conMod = getAbilityModifier(npc.abilities.con);
  const hp = Math.max(1, crStats.hpMultiplier + Math.floor(conMod * 2));
  scaled.system.attributes.hp = {
    value: hp,
    max: hp,
    temp: 0,
    tempmax: 0,
    formula: `${Math.floor(hp / 8)}d8+${conMod * Math.floor(hp / 8)}`
  };

  // 4. Scale AC to CR table value
  scaled.system.attributes.ac = {
    calc: 'natural',
    flat: crStats.baseAC,
    formula: ''
  };

  // 5. Update movement from NPC species
  scaled.system.attributes.movement = {
    walk: npc.speed.walk,
    fly: npc.speed.fly || 0,
    climb: npc.speed.climb || 0,
    swim: npc.speed.swim || 0,
    units: 'ft',
    hover: false
  };

  // 6. Update CR
  scaled.system.details.cr = crValue;

  // 7. Update alignment
  scaled.system.details.alignment = npc.alignment.toLowerCase();

  // 8. Update biography
  if (npc.description) {
    scaled.system.details.biography = {
      value: `<p>${npc.description}</p>`,
      public: ''
    };
  }

  // 9. Scale skills to use new proficiency bonus
  if (scaled.system.skills) {
    for (const [_skillKey, skillData] of Object.entries(scaled.system.skills) as Array<
      [string, any]
    >) {
      if (skillData.value > 0) {
        // Skill is proficient, update proficiency to match CR
        skillData.value = 1; // Standard proficiency
        skillData.prof = crStats.proficiencyBonus;
      }
    }
  }

  // 10. Update saving throws proficiency
  if (npc.saves && npc.saves.length > 0) {
    for (const save of npc.saves) {
      if (scaled.system.abilities[save]) {
        scaled.system.abilities[save].proficient = 1;
      }
    }
  }

  // 11. Update token
  if (scaled.prototypeToken) {
    scaled.prototypeToken.name = npc.name;
    if (npc.token || npc.portrait) {
      scaled.prototypeToken.texture = {
        src: npc.token || npc.portrait
      };
    }
  }

  // 12. Scale embedded items (weapons, features, actions)
  if (scaled.items) {
    scaled.items = scaleEmbeddedItems(scaled.items, npc.challengeRating, npc.abilities, role);
  }

  return scaled;
}

// Scale embedded items (weapons, features, spells)
function scaleEmbeddedItems(
  items: any[],
  targetCR: string,
  abilities: NPC['abilities'],
  role: string
): any[] {
  const crStats = getCRStats(targetCR);

  return items.map(item => {
    const scaledItem = foundry.utils.duplicate(item);

    // Scale weapons
    if (scaledItem.type === 'weapon') {
      // Update attack bonus
      if (scaledItem.system.attack) {
        scaledItem.system.attack.bonus = crStats.attackBonus.toString();
      }

      // Scale damage dice
      if (scaledItem.system.damage && scaledItem.system.damage.parts) {
        // Determine which ability modifier to use
        const weaponProps = scaledItem.system.properties || {};
        const isFinesseOrRanged = weaponProps.fin || weaponProps.ran;
        const abilityMod = isFinesseOrRanged
          ? getAbilityModifier(abilities.dex)
          : getAbilityModifier(abilities.str);

        scaledItem.system.damage.parts = scaleDamageParts(
          scaledItem.system.damage.parts,
          targetCR,
          abilityMod
        );
      }

      // Update proficiency
      scaledItem.system.proficient = 1;
    }

    // Scale features and actions
    if (scaledItem.type === 'feat') {
      // Check if this feature should be preserved
      const shouldPreserve = shouldPreserveFeature(role, scaledItem.name);

      if (!shouldPreserve) {
        // Scale any damage or save DCs in the feature
        if (scaledItem.system.damage && scaledItem.system.damage.parts) {
          scaledItem.system.damage.parts = scaleDamageParts(
            scaledItem.system.damage.parts,
            targetCR,
            0
          );
        }

        if (scaledItem.system.save && scaledItem.system.save.dc) {
          scaledItem.system.save.dc = crStats.saveDC;
        }
      }
    }

    // Scale spells (save DC)
    if (scaledItem.type === 'spell') {
      if (scaledItem.system.save && scaledItem.system.save.dc) {
        scaledItem.system.save.dc = crStats.saveDC;
      }
    }

    return scaledItem;
  });
}

// Add languages from NPC specification
export function addLanguagesToTemplate(templateData: any, languages: string[]): void {
  if (!templateData.system.traits) {
    templateData.system.traits = {};
  }

  templateData.system.traits.languages = {
    value: new Set(languages.map(lang => lang.toLowerCase())),
    custom: ''
  };
}

// Add currency from NPC specification
export function addCurrencyToTemplate(templateData: any, currency: NPC['currency']): void {
  if (!templateData.system.currency) {
    templateData.system.currency = {};
  }

  templateData.system.currency = {
    cp: currency.cp || 0,
    sp: currency.sp || 0,
    ep: currency.ep || 0,
    gp: currency.gp || 0,
    pp: currency.pp || 0
  };
}
