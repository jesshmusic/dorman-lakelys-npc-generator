// CR-related calculations and utilities

export interface CRStats {
    proficiencyBonus: number;
    baseAbilityScore: number;
    hpMultiplier: number;
    baseAC: number;
}

export function parseCR(cr: string): number {
    if (cr.includes('/')) {
        const [numerator, denominator] = cr.split('/').map(Number);
        return numerator / denominator;
    }
    return parseFloat(cr);
}

export function getCRStats(cr: string): CRStats {
    const crValue = parseCR(cr);

    // Proficiency bonus based on CR (D&D 5e standard)
    let proficiencyBonus = 2;
    if (crValue >= 5) proficiencyBonus = 3;
    if (crValue >= 9) proficiencyBonus = 4;
    if (crValue >= 13) proficiencyBonus = 5;
    if (crValue >= 17) proficiencyBonus = 6;
    if (crValue >= 21) proficiencyBonus = 7;
    if (crValue >= 25) proficiencyBonus = 8;
    if (crValue >= 29) proficiencyBonus = 9;

    // Base ability scores scale with CR
    // CR 0: 10, CR 1: 12, CR 5: 14, CR 10: 16, CR 20: 18, CR 30: 20
    let baseAbilityScore: number;
    if (crValue <= 0) baseAbilityScore = 10;
    else if (crValue <= 1) baseAbilityScore = 12;
    else if (crValue <= 5) baseAbilityScore = 13 + Math.floor((crValue - 1) / 4);
    else if (crValue <= 10) baseAbilityScore = 14 + Math.floor((crValue - 5) / 2.5);
    else if (crValue <= 20) baseAbilityScore = 16 + Math.floor((crValue - 10) / 5);
    else baseAbilityScore = Math.min(20, 18 + Math.floor((crValue - 20) / 5));

    // HP based on DMG guidelines (CR to HP chart)
    let hpMultiplier: number;
    if (crValue === 0) hpMultiplier = 5;
    else if (crValue <= 0.125) hpMultiplier = 7;
    else if (crValue <= 0.25) hpMultiplier = 15;
    else if (crValue <= 0.5) hpMultiplier = 25;
    else if (crValue <= 1) hpMultiplier = 35;
    else if (crValue <= 2) hpMultiplier = 50;
    else if (crValue <= 3) hpMultiplier = 65;
    else if (crValue <= 4) hpMultiplier = 80;
    else if (crValue <= 5) hpMultiplier = 95;
    else if (crValue <= 6) hpMultiplier = 110;
    else if (crValue <= 7) hpMultiplier = 125;
    else if (crValue <= 8) hpMultiplier = 140;
    else if (crValue <= 9) hpMultiplier = 155;
    else if (crValue <= 10) hpMultiplier = 170;
    else if (crValue <= 11) hpMultiplier = 185;
    else if (crValue <= 12) hpMultiplier = 200;
    else if (crValue <= 13) hpMultiplier = 215;
    else if (crValue <= 14) hpMultiplier = 230;
    else if (crValue <= 15) hpMultiplier = 245;
    else if (crValue <= 16) hpMultiplier = 260;
    else if (crValue <= 17) hpMultiplier = 275;
    else if (crValue <= 18) hpMultiplier = 290;
    else if (crValue <= 19) hpMultiplier = 305;
    else if (crValue <= 20) hpMultiplier = 320;
    else if (crValue <= 21) hpMultiplier = 340;
    else if (crValue <= 22) hpMultiplier = 360;
    else if (crValue <= 23) hpMultiplier = 380;
    else if (crValue <= 24) hpMultiplier = 400;
    else if (crValue <= 25) hpMultiplier = 430;
    else if (crValue <= 26) hpMultiplier = 460;
    else if (crValue <= 27) hpMultiplier = 490;
    else if (crValue <= 28) hpMultiplier = 520;
    else if (crValue <= 29) hpMultiplier = 550;
    else hpMultiplier = 580;

    // AC based on DMG guidelines (not used directly, but for reference)
    let baseAC: number;
    if (crValue <= 3) baseAC = 13;
    else if (crValue <= 4) baseAC = 14;
    else if (crValue <= 7) baseAC = 15;
    else if (crValue <= 9) baseAC = 16;
    else if (crValue <= 12) baseAC = 17;
    else if (crValue <= 16) baseAC = 18;
    else if (crValue <= 20) baseAC = 19;
    else baseAC = 19;

    return {
        proficiencyBonus,
        baseAbilityScore,
        hpMultiplier,
        baseAC
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
