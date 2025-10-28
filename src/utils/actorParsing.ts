// Utility functions for parsing and averaging actor data

import { parseCR, getCRStats } from './crCalculations.js';

export interface ParsedActorData {
  name: string;
  description: string;
  originalBiographyHtml: string;
  species: string;
  alignment: string;
  challengeRating: string;
  abilities: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  portrait: string;
  token: string;
  class?: string;
  items: any[];
}

/**
 * Parse data from a single actor document
 */
export function parseActorData(actor: any): ParsedActorData | null {
  if (!actor || !actor.system) {
    console.warn("Dorman Lakely's NPC Gen | Invalid actor data");
    return null;
  }

  // Extract system data
  const system = actor.system;

  // Get abilities
  const abilities = {
    str: system.abilities?.str?.value || 10,
    dex: system.abilities?.dex?.value || 10,
    con: system.abilities?.con?.value || 10,
    int: system.abilities?.int?.value || 10,
    wis: system.abilities?.wis?.value || 10,
    cha: system.abilities?.cha?.value || 10
  };

  // Get CR (default to 1 if not specified)
  const cr = system.details?.cr ? String(system.details.cr) : '1';

  // Get species/type
  let species = 'Humanoid';
  if (system.details?.type?.value) {
    species = capitalizeFirst(system.details.type.value);
  } else if (system.details?.race) {
    species = system.details.race;
  }

  // Get alignment
  let alignment = 'True Neutral';
  if (system.details?.alignment) {
    alignment = formatAlignment(system.details.alignment);
  }

  // Get description from biography
  let description = '';
  let originalBiographyHtml = '';
  if (system.details?.biography?.value) {
    // Store the original HTML
    originalBiographyHtml = system.details.biography.value;

    // Strip HTML tags for a clean description
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = system.details.biography.value;
    description = tempDiv.textContent?.trim() || '';
  }

  // Get portrait and token
  const portrait = actor.img || 'icons/svg/mystery-man.svg';
  const token =
    actor.prototypeToken?.texture?.src || actor.token?.texture?.src || portrait;

  // Try to determine class from items
  let actorClass: string | undefined;
  const items = actor.items ? Array.from(actor.items) : [];
  const classItem = items.find(
    (i: any) => i.type === 'class' || i.name?.toLowerCase().includes('class')
  );
  if (classItem) {
    actorClass = classItem.name;
  }

  return {
    name: actor.name || 'Unknown',
    description: description || `A ${species.toLowerCase()} of CR ${cr}`,
    originalBiographyHtml: originalBiographyHtml || '',
    species,
    alignment,
    challengeRating: cr,
    abilities,
    portrait,
    token,
    class: actorClass,
    items
  };
}

/**
 * Average stats from multiple actors
 */
export function averageActors(actors: any[]): ParsedActorData | null {
  if (!actors || actors.length === 0) return null;
  if (actors.length === 1) return parseActorData(actors[0]);

  const parsedActors = actors.map(parseActorData).filter(a => a !== null) as ParsedActorData[];

  if (parsedActors.length === 0) return null;

  // Average ability scores
  const avgAbilities = {
    str: Math.round(
      parsedActors.reduce((sum, a) => sum + a.abilities.str, 0) / parsedActors.length
    ),
    dex: Math.round(
      parsedActors.reduce((sum, a) => sum + a.abilities.dex, 0) / parsedActors.length
    ),
    con: Math.round(
      parsedActors.reduce((sum, a) => sum + a.abilities.con, 0) / parsedActors.length
    ),
    int: Math.round(
      parsedActors.reduce((sum, a) => sum + a.abilities.int, 0) / parsedActors.length
    ),
    wis: Math.round(
      parsedActors.reduce((sum, a) => sum + a.abilities.wis, 0) / parsedActors.length
    ),
    cha: Math.round(
      parsedActors.reduce((sum, a) => sum + a.abilities.cha, 0) / parsedActors.length
    )
  };

  // Average CR (convert to numeric, average, then back to string)
  const numericCRs = parsedActors.map(a => parseCR(a.challengeRating));
  const avgCR = numericCRs.reduce((sum, cr) => sum + cr, 0) / numericCRs.length;
  const challengeRating = formatCR(avgCR);

  // Use first actor's visual data
  const first = parsedActors[0];

  // Combine descriptions
  const combinedDescription = `Merged from ${parsedActors.length} actors: ${parsedActors
    .map(a => a.name)
    .join(', ')}`;

  // Collect unique items from all actors
  const allItems = parsedActors.flatMap(a => a.items);

  return {
    name: `Merged ${first.species}`,
    description: combinedDescription,
    originalBiographyHtml: first.originalBiographyHtml,
    species: first.species,
    alignment: first.alignment,
    challengeRating,
    abilities: avgAbilities,
    portrait: first.portrait,
    token: first.token,
    class: first.class,
    items: allItems
  };
}

/**
 * Format CR number back to string (handles fractions)
 */
function formatCR(cr: number): string {
  if (cr === 0) return '0';
  if (cr < 1) {
    // Check common fractions
    if (Math.abs(cr - 0.125) < 0.01) return '1/8';
    if (Math.abs(cr - 0.25) < 0.01) return '1/4';
    if (Math.abs(cr - 0.5) < 0.01) return '1/2';
    // Round to nearest fraction
    const rounded = Math.round(cr * 8) / 8;
    if (rounded === 0.125) return '1/8';
    if (rounded === 0.25) return '1/4';
    if (rounded === 0.5) return '1/2';
    return '1/2'; // Default fallback
  }
  return String(Math.round(cr));
}

/**
 * Capitalize first letter
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format alignment from system value to display string
 */
function formatAlignment(alignment: string): string {
  const alignmentMap: Record<string, string> = {
    lg: 'Lawful Good',
    ng: 'Neutral Good',
    cg: 'Chaotic Good',
    ln: 'Lawful Neutral',
    n: 'True Neutral',
    tn: 'True Neutral',
    cn: 'Chaotic Neutral',
    le: 'Lawful Evil',
    ne: 'Neutral Evil',
    ce: 'Chaotic Evil'
  };

  const normalized = alignment.toLowerCase().replace(/\s+/g, '');
  return alignmentMap[normalized] || 'True Neutral';
}

/**
 * Scale template actor stats based on new CR
 */
export function scaleActorStats(
  templateData: ParsedActorData,
  newCR: string
): {
  abilities: ParsedActorData['abilities'];
  hp: number;
  ac: number;
  items: any[];
} {
  const originalCRValue = parseCR(templateData.challengeRating);
  const newCRValue = parseCR(newCR);

  // Get official stats for both CRs
  const originalStats = getCRStats(templateData.challengeRating);
  const newStats = getCRStats(newCR);

  // Calculate scaling ratio (capped to prevent extreme changes)
  const scalingRatio = Math.min(Math.max(newCRValue / Math.max(originalCRValue, 0.125), 0.5), 2.0);

  // Scale abilities proportionally, capping at 30
  const scaledAbilities = {
    str: Math.min(30, Math.round(templateData.abilities.str * scalingRatio)),
    dex: Math.min(30, Math.round(templateData.abilities.dex * scalingRatio)),
    con: Math.min(30, Math.round(templateData.abilities.con * scalingRatio)),
    int: Math.min(30, Math.round(templateData.abilities.int * scalingRatio)),
    wis: Math.min(30, Math.round(templateData.abilities.wis * scalingRatio)),
    cha: Math.min(30, Math.round(templateData.abilities.cha * scalingRatio))
  };

  // Use HP from the new CR's official stats, adjusted by CON modifier
  const conMod = Math.floor((scaledAbilities.con - 10) / 2);
  const hp = Math.max(1, newStats.hpMultiplier + Math.floor(conMod * 2));

  // Use AC from the new CR's official stats
  const ac = newStats.baseAC;

  // Scale attack damage in items
  const scaledItems = scaleItemDamage(templateData.items, scalingRatio);

  return {
    abilities: scaledAbilities,
    hp,
    ac,
    items: scaledItems
  };
}

/**
 * Scale damage in items based on CR ratio
 */
function scaleItemDamage(items: any[], scalingRatio: number): any[] {
  return items.map((item: any) => {
    const itemCopy = item.toObject ? item.toObject() : { ...item };

    // Check if item has damage (weapons, attacks, features with damage)
    if (itemCopy.system?.damage?.parts && Array.isArray(itemCopy.system.damage.parts)) {
      itemCopy.system.damage.parts = itemCopy.system.damage.parts.map((part: any[]) => {
        const [formula, damageType] = part;

        // Scale dice-based damage formulas
        const scaledFormula = scaleDamageFormula(formula, scalingRatio);

        return [scaledFormula, damageType];
      });
    }

    // Also handle attack formulas in system.attack
    if (itemCopy.system?.attack?.formula) {
      itemCopy.system.attack.formula = scaleDamageFormula(
        itemCopy.system.attack.formula,
        scalingRatio
      );
    }

    return itemCopy;
  });
}

/**
 * Scale a damage formula (e.g., "2d6+3" -> "3d6+4")
 */
function scaleDamageFormula(formula: string, scalingRatio: number): string {
  if (!formula || typeof formula !== 'string') return formula;

  // Match dice patterns like 1d6, 2d8, etc.
  return formula.replace(/(\d+)d(\d+)/g, (match, numDice, diceSize) => {
    const originalDice = parseInt(numDice, 10);
    const scaledDice = Math.max(1, Math.round(originalDice * scalingRatio));
    return `${scaledDice}d${diceSize}`;
  });
}
