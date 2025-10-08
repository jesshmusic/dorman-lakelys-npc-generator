// Equipment selection logic

export interface EquipmentPool {
    weapons: string[];
    armor: string[];
}

export function getEquipmentForClass(classType: string, cr: number): EquipmentPool {
    const pool: EquipmentPool = {
        weapons: [],
        armor: []
    };

    // Weapon selection based on class
    switch (classType) {
        case "Barbarian":
            pool.weapons = cr < 3 ? ["Greataxe", "Handaxe"] : ["Greataxe", "Javelin"];
            break;
        case "Bard":
            pool.weapons = cr < 3 ? ["Rapier", "Dagger"] : ["Rapier", "Shortbow"];
            break;
        case "Cleric":
            pool.weapons = cr < 3 ? ["Mace", "Shield"] : ["Mace", "Shield", "Light Crossbow"];
            break;
        case "Druid":
            pool.weapons = cr < 3 ? ["Quarterstaff", "Dagger"] : ["Scimitar", "Shield"];
            break;
        case "Fighter":
            if (cr < 3) pool.weapons = ["Longsword", "Shield"];
            else if (cr < 10) pool.weapons = ["Longsword", "Shield", "Longbow"];
            else pool.weapons = ["Greatsword", "Longbow"];
            break;
        case "Monk":
            pool.weapons = cr < 3 ? ["Quarterstaff", "Dart"] : ["Shortsword", "Dart"];
            break;
        case "Paladin":
            if (cr < 3) pool.weapons = ["Longsword", "Shield"];
            else if (cr < 10) pool.weapons = ["Longsword", "Shield", "Javelin"];
            else pool.weapons = ["Greatsword", "Javelin"];
            break;
        case "Ranger":
            if (cr < 3) pool.weapons = ["Shortsword", "Longbow"];
            else pool.weapons = ["Shortsword", "Longbow", "Dagger"];
            break;
        case "Rogue":
            pool.weapons = cr < 3 ? ["Rapier", "Shortbow"] : ["Rapier", "Shortbow", "Dagger"];
            break;
        case "Sorcerer":
            pool.weapons = cr < 3 ? ["Dagger", "Light Crossbow"] : ["Quarterstaff", "Dagger"];
            break;
        case "Warlock":
            pool.weapons = cr < 3 ? ["Dagger", "Light Crossbow"] : ["Dagger"];
            break;
        case "Wizard":
            pool.weapons = cr < 3 ? ["Quarterstaff", "Dagger"] : ["Quarterstaff", "Dagger"];
            break;
    }

    // Armor selection based on class
    switch (classType) {
        case "Barbarian":
            if (cr < 3) pool.armor = [];
            else if (cr < 10) pool.armor = ["Hide Armor"];
            else pool.armor = ["Half Plate Armor"];
            break;
        case "Bard":
            if (cr < 3) pool.armor = ["Leather Armor"];
            else pool.armor = ["Studded Leather Armor"];
            break;
        case "Cleric":
            if (cr < 3) pool.armor = ["Scale Mail", "Shield"];
            else if (cr < 10) pool.armor = ["Chain Mail", "Shield"];
            else pool.armor = ["Plate Armor", "Shield"];
            break;
        case "Druid":
            if (cr < 3) pool.armor = ["Hide Armor", "Shield"];
            else pool.armor = ["Hide Armor", "Shield"];
            break;
        case "Fighter":
            if (cr < 3) pool.armor = ["Chain Mail", "Shield"];
            else if (cr < 10) pool.armor = ["Plate Armor", "Shield"];
            else pool.armor = ["Plate Armor"];
            break;
        case "Monk":
            pool.armor = []; // Unarmored Defense
            break;
        case "Paladin":
            if (cr < 3) pool.armor = ["Chain Mail", "Shield"];
            else if (cr < 10) pool.armor = ["Plate Armor", "Shield"];
            else pool.armor = ["Plate Armor"];
            break;
        case "Ranger":
            if (cr < 3) pool.armor = ["Leather Armor"];
            else if (cr < 10) pool.armor = ["Studded Leather Armor"];
            else pool.armor = ["Half Plate Armor"];
            break;
        case "Rogue":
            if (cr < 3) pool.armor = ["Leather Armor"];
            else pool.armor = ["Studded Leather Armor"];
            break;
        case "Sorcerer":
            pool.armor = []; // No armor proficiency
            break;
        case "Warlock":
            if (cr < 3) pool.armor = ["Leather Armor"];
            else pool.armor = ["Leather Armor"];
            break;
        case "Wizard":
            pool.armor = []; // No armor proficiency
            break;
    }

    return pool;
}
