// Spell selection logic

export interface SpellSelection {
    cantrips: string[];
    level1: string[];
    level2: string[];
    level3: string[];
    level4: string[];
    level5: string[];
    level6: string[];
    level7: string[];
    level8: string[];
    level9: string[];
}

const BARD_SPELLS = {
    cantrips: ["Vicious Mockery", "Minor Illusion", "Prestidigitation"],
    level1: ["Healing Word", "Thunderwave", "Charm Person", "Disguise Self"],
    level2: ["Hold Person", "Invisibility", "Suggestion"],
    level3: ["Hypnotic Pattern", "Dispel Magic", "Major Image"],
    level4: ["Greater Invisibility", "Dimension Door"],
    level5: ["Mass Cure Wounds", "Hold Monster"],
    level6: ["Mass Suggestion", "True Seeing"],
    level7: ["Forcecage", "Teleport"],
    level8: ["Dominate Monster", "Feeblemind"],
    level9: ["True Polymorph", "Mass Heal"]
};

const CLERIC_SPELLS = {
    cantrips: ["Sacred Flame", "Guidance", "Spare the Dying"],
    level1: ["Cure Wounds", "Bless", "Guiding Bolt", "Shield of Faith"],
    level2: ["Spiritual Weapon", "Hold Person", "Lesser Restoration"],
    level3: ["Spirit Guardians", "Revivify", "Dispel Magic"],
    level4: ["Guardian of Faith", "Banishment"],
    level5: ["Flame Strike", "Mass Cure Wounds"],
    level6: ["Blade Barrier", "Heal"],
    level7: ["Divine Word", "Regenerate"],
    level8: ["Holy Aura", "Earthquake"],
    level9: ["Mass Heal", "Gate"]
};

const DRUID_SPELLS = {
    cantrips: ["Produce Flame", "Guidance", "Shillelagh"],
    level1: ["Cure Wounds", "Entangle", "Thunderwave", "Healing Word"],
    level2: ["Moonbeam", "Barkskin", "Hold Person"],
    level3: ["Call Lightning", "Conjure Animals", "Dispel Magic"],
    level4: ["Polymorph", "Ice Storm"],
    level5: ["Conjure Elemental", "Mass Cure Wounds"],
    level6: ["Sunbeam", "Transport via Plants"],
    level7: ["Fire Storm", "Regenerate"],
    level8: ["Sunburst", "Tsunami"],
    level9: ["Shapechange", "Storm of Vengeance"]
};

const PALADIN_SPELLS = {
    cantrips: [],
    level1: ["Divine Favor", "Shield of Faith", "Bless"],
    level2: ["Aid", "Find Steed", "Lesser Restoration"],
    level3: ["Dispel Magic", "Revivify", "Crusader's Mantle"],
    level4: ["Death Ward", "Find Greater Steed"],
    level5: ["Destructive Wave", "Holy Weapon"],
    level6: [],
    level7: [],
    level8: [],
    level9: []
};

const RANGER_SPELLS = {
    cantrips: [],
    level1: ["Hunter's Mark", "Cure Wounds", "Goodberry"],
    level2: ["Pass without Trace", "Spike Growth", "Lesser Restoration"],
    level3: ["Conjure Animals", "Lightning Arrow", "Plant Growth"],
    level4: ["Conjure Woodland Beings", "Freedom of Movement"],
    level5: ["Conjure Volley", "Swift Quiver"],
    level6: [],
    level7: [],
    level8: [],
    level9: []
};

const SORCERER_SPELLS = {
    cantrips: ["Fire Bolt", "Mage Hand", "Prestidigitation", "Ray of Frost"],
    level1: ["Magic Missile", "Shield", "Mage Armor", "Chromatic Orb"],
    level2: ["Scorching Ray", "Mirror Image", "Misty Step"],
    level3: ["Fireball", "Counterspell", "Haste"],
    level4: ["Greater Invisibility", "Polymorph"],
    level5: ["Cone of Cold", "Hold Monster"],
    level6: ["Chain Lightning", "Disintegrate"],
    level7: ["Finger of Death", "Teleport"],
    level8: ["Sunburst", "Earthquake"],
    level9: ["Meteor Swarm", "Time Stop"]
};

const WARLOCK_SPELLS = {
    cantrips: ["Eldritch Blast", "Mage Hand", "Prestidigitation"],
    level1: ["Hex", "Armor of Agathys", "Witch Bolt"],
    level2: ["Hold Person", "Invisibility", "Shatter"],
    level3: ["Counterspell", "Hypnotic Pattern", "Fly"],
    level4: ["Dimension Door", "Banishment"],
    level5: ["Hold Monster", "Synaptic Static"],
    level6: ["Circle of Death", "True Seeing"],
    level7: ["Forcecage", "Finger of Death"],
    level8: ["Dominate Monster", "Feeblemind"],
    level9: ["Foresight", "True Polymorph"]
};

const WIZARD_SPELLS = {
    cantrips: ["Fire Bolt", "Mage Hand", "Prestidigitation", "Ray of Frost"],
    level1: ["Magic Missile", "Shield", "Mage Armor", "Detect Magic"],
    level2: ["Misty Step", "Mirror Image", "Web"],
    level3: ["Fireball", "Counterspell", "Fly"],
    level4: ["Greater Invisibility", "Polymorph", "Wall of Fire"],
    level5: ["Cone of Cold", "Wall of Force"],
    level6: ["Chain Lightning", "Disintegrate"],
    level7: ["Teleport", "Plane Shift"],
    level8: ["Maze", "Mind Blank"],
    level9: ["Wish", "Time Stop"]
};

const CLASS_SPELL_LISTS: Record<string, typeof BARD_SPELLS> = {
    "Bard": BARD_SPELLS,
    "Cleric": CLERIC_SPELLS,
    "Druid": DRUID_SPELLS,
    "Paladin": PALADIN_SPELLS,
    "Ranger": RANGER_SPELLS,
    "Sorcerer": SORCERER_SPELLS,
    "Warlock": WARLOCK_SPELLS,
    "Wizard": WIZARD_SPELLS
};

export function getSpellsForClass(classType: string, level: number): SpellSelection {
    const spellList = CLASS_SPELL_LISTS[classType];
    const selection: SpellSelection = {
        cantrips: [],
        level1: [],
        level2: [],
        level3: [],
        level4: [],
        level5: [],
        level6: [],
        level7: [],
        level8: [],
        level9: []
    };

    if (!spellList) return selection;

    // Number of cantrips based on level
    let numCantrips = 0;
    if (level >= 1 && classType !== "Paladin" && classType !== "Ranger") {
        numCantrips = level >= 10 ? 4 : level >= 4 ? 3 : 2;
    }

    // Select cantrips
    if (spellList.cantrips.length > 0) {
        const shuffled = [...spellList.cantrips].sort(() => Math.random() - 0.5);
        selection.cantrips = shuffled.slice(0, Math.min(numCantrips, spellList.cantrips.length));
    }

    // Spell slots per level based on character level
    const spellsPerLevel: Record<number, number> = {
        1: level >= 1 ? 2 : 0,
        2: level >= 3 ? 2 : 0,
        3: level >= 5 ? 2 : 0,
        4: level >= 7 ? 1 : 0,
        5: level >= 9 ? 1 : 0,
        6: level >= 11 ? 1 : 0,
        7: level >= 13 ? 1 : 0,
        8: level >= 15 ? 1 : 0,
        9: level >= 17 ? 1 : 0
    };

    // Paladins and Rangers start at level 2
    if (classType === "Paladin" || classType === "Ranger") {
        spellsPerLevel[1] = level >= 2 ? 2 : 0;
        spellsPerLevel[2] = level >= 5 ? 2 : 0;
        spellsPerLevel[3] = level >= 9 ? 2 : 0;
        spellsPerLevel[4] = level >= 13 ? 1 : 0;
        spellsPerLevel[5] = level >= 17 ? 1 : 0;
    }

    // Select spells for each level
    const selectSpells = (spellArray: string[], count: number) => {
        const shuffled = [...spellArray].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(count, spellArray.length));
    };

    if (spellsPerLevel[1] > 0) selection.level1 = selectSpells(spellList.level1, spellsPerLevel[1]);
    if (spellsPerLevel[2] > 0) selection.level2 = selectSpells(spellList.level2, spellsPerLevel[2]);
    if (spellsPerLevel[3] > 0) selection.level3 = selectSpells(spellList.level3, spellsPerLevel[3]);
    if (spellsPerLevel[4] > 0) selection.level4 = selectSpells(spellList.level4, spellsPerLevel[4]);
    if (spellsPerLevel[5] > 0) selection.level5 = selectSpells(spellList.level5, spellsPerLevel[5]);
    if (spellsPerLevel[6] > 0) selection.level6 = selectSpells(spellList.level6 || [], spellsPerLevel[6]);
    if (spellsPerLevel[7] > 0) selection.level7 = selectSpells(spellList.level7 || [], spellsPerLevel[7]);
    if (spellsPerLevel[8] > 0) selection.level8 = selectSpells(spellList.level8 || [], spellsPerLevel[8]);
    if (spellsPerLevel[9] > 0) selection.level9 = selectSpells(spellList.level9 || [], spellsPerLevel[9]);

    return selection;
}
