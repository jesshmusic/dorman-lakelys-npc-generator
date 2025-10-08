// Core NPC generation logic
import { getCRStats, parseCR, CRStats } from '../utils/crCalculations.js';
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
}

export class NPCGenerator {
    static readonly SPECIES = [
        "Human", "Elf", "Dwarf", "Halfling", "Gnome", "Half-Elf", "Half-Orc",
        "Tiefling", "Dragonborn", "Goblin", "Orc", "Kobold"
    ];

    static readonly ALIGNMENTS = [
        "Lawful Good", "Neutral Good", "Chaotic Good",
        "Lawful Neutral", "True Neutral", "Chaotic Neutral",
        "Lawful Evil", "Neutral Evil", "Chaotic Evil"
    ];

    static readonly CHALLENGE_RATINGS = [
        "0", "1/8", "1/4", "1/2", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
        "11", "12", "13", "14", "15", "16", "17", "18", "19", "20",
        "21", "22", "23", "24", "25", "26", "27", "28", "29", "30"
    ];

    static readonly CLASSES = [
        "Barbarian", "Bard", "Cleric", "Druid", "Fighter", "Monk",
        "Paladin", "Ranger", "Rogue", "Sorcerer", "Warlock", "Wizard"
    ];

    private static getSpeed(species: string): NPC['speed'] {
        const speedMap: Record<string, NPC['speed']> = {
            "Human": { walk: 30 },
            "Elf": { walk: 30 },
            "Dwarf": { walk: 25 },
            "Halfling": { walk: 25 },
            "Gnome": { walk: 25 },
            "Half-Elf": { walk: 30 },
            "Half-Orc": { walk: 30 },
            "Tiefling": { walk: 30 },
            "Dragonborn": { walk: 30 },
            "Goblin": { walk: 30 },
            "Orc": { walk: 30 },
            "Kobold": { walk: 30 }
        };
        return speedMap[species] || { walk: 30 };
    }

    private static getLanguages(species: string): string[] {
        const languageMap: Record<string, string[]> = {
            "Human": ["Common"],
            "Elf": ["Common", "Elvish"],
            "Dwarf": ["Common", "Dwarvish"],
            "Halfling": ["Common", "Halfling"],
            "Gnome": ["Common", "Gnomish"],
            "Half-Elf": ["Common", "Elvish"],
            "Half-Orc": ["Common", "Orc"],
            "Tiefling": ["Common", "Infernal"],
            "Dragonborn": ["Common", "Draconic"],
            "Goblin": ["Common", "Goblin"],
            "Orc": ["Common", "Orc"],
            "Kobold": ["Common", "Draconic"]
        };
        return languageMap[species] || ["Common"];
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
            "acr", "ani", "arc", "ath", "dec", "his", "ins", "itm",
            "inv", "med", "nat", "prc", "prf", "per", "rel", "slt", "ste", "sur"
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
        const abilityEntries = Object.entries(abilities)
            .sort((a, b) => b[1] - a[1]);

        return abilityEntries.slice(0, numSaves).map(([ability]) => ability);
    }

    private static generateAbilities(cr: string, species: string): NPC['abilities'] {
        const stats = getCRStats(cr);
        const base = stats.baseAbilityScore;
        const variance = 2;

        // Apply species modifiers
        const speciesModifiers: Record<string, Partial<NPC['abilities']>> = {
            "Human": { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 },
            "Elf": { dex: 2 },
            "Dwarf": { con: 2 },
            "Halfling": { dex: 2 },
            "Gnome": { int: 2 },
            "Half-Elf": { cha: 2 },
            "Half-Orc": { str: 2, con: 1 },
            "Tiefling": { cha: 2, int: 1 },
            "Dragonborn": { str: 2, cha: 1 },
            "Goblin": { dex: 2, con: 1 },
            "Orc": { str: 2, con: 1, int: -2 },
            "Kobold": { dex: 2, str: -2 }
        };

        const mods = speciesModifiers[species] || {};
        const rand = () => Math.floor(Math.random() * variance * 2) - variance;

        return {
            str: Math.max(1, base + rand() + (mods.str || 0)),
            dex: Math.max(1, base + rand() + (mods.dex || 0)),
            con: Math.max(1, base + rand() + (mods.con || 0)),
            int: Math.max(1, base + rand() + (mods.int || 0)),
            wis: Math.max(1, base + rand() + (mods.wis || 0)),
            cha: Math.max(1, base + rand() + (mods.cha || 0))
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
        const classType = data.class || NPCGenerator.CLASSES[0];
        const abilities = this.generateAbilities(cr, species);
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
            name: data.name || "",
            description: data.description || "",
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
            currency
        };
    }
}