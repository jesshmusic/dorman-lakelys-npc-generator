// UI components for the NPC Generator
import { NPCGenerator, NPC } from '../generator/ExistentialNPCGenerator.js';
import { parseCR, crToLevel } from '../utils/crCalculations.js';
import { getEquipmentForClass } from '../utils/equipmentData.js';
import { CLASS_FEATURES, SPELLCASTING_CLASSES } from '../utils/classData.js';
import { getSpellsForClass } from '../utils/spellData.js';

// Foundry V2 Application Dialog
class NPCGeneratorDialog extends foundry.applications.api.HandlebarsApplicationMixin(
    foundry.applications.api.ApplicationV2
) {
    static DEFAULT_OPTIONS = {
        id: 'npc-generator-dialog',
        classes: ['dnd5e2', 'sheet', 'npc-generator'],
        tag: 'form',
        window: {
            title: 'NPC Generator',
            icon: 'fas fa-user-plus',
            resizable: true
        },
        position: {
            width: 520,
            height: 'auto'
        },
        actions: {
            create: NPCGeneratorDialog.onCreateNPC,
            cancel: NPCGeneratorDialog.onCancel
        }
    };

    static PARTS = {
        form: {
            template: 'modules/dorman-lakelys-npc-generator/templates/npc-form.html'
        }
    };

    async _prepareContext(options: any): Promise<any> {
        // Get all actor compendiums available to the user
        const compendiums = Array.from(game.packs.values())
            .filter((pack: any) => pack.documentName === 'Actor' && !pack.locked)
            .map((pack: any) => ({
                id: pack.collection,
                title: pack.title
            }));

        return {
            species: NPCGenerator.SPECIES,
            alignments: NPCGenerator.ALIGNMENTS,
            challengeRatings: NPCGenerator.CHALLENGE_RATINGS,
            classes: NPCGenerator.CLASSES,
            compendiums
        };
    }

    _onRender(context: any, options: any): void {
        super._onRender(context, options);

        // Set up destination select change handler
        const destinationSelect = this.element.querySelector('#npc-destination') as HTMLSelectElement;
        const newCompendiumGroup = this.element.querySelector('#new-compendium-name-group') as HTMLElement;
        const newCompendiumInput = this.element.querySelector('#new-compendium-name') as HTMLInputElement;

        if (destinationSelect && newCompendiumGroup) {
            destinationSelect.addEventListener('change', () => {
                if (destinationSelect.value === 'new-compendium') {
                    newCompendiumGroup.style.display = 'block';
                    newCompendiumInput.required = true;
                } else {
                    newCompendiumGroup.style.display = 'none';
                    newCompendiumInput.required = false;
                }
            });
        }
    }

    static async onCreateNPC(event: Event, target: HTMLElement) {
        const form = target.closest('form');
        if (!form) return;

        const formData = new FormData(form);
        const inputData = {
            name: formData.get('name') as string,
            description: formData.get('description') as string,
            species: formData.get('species') as string,
            alignment: formData.get('alignment') as string,
            challengeRating: formData.get('challengeRating') as string,
            class: formData.get('class') as string
        };

        const destination = formData.get('destination') as string;
        const newCompendiumName = formData.get('newCompendiumName') as string;

        if (!inputData.name || !inputData.description) {
            ui.notifications?.warn('Please fill in all required fields');
            return;
        }

        if (destination === 'new-compendium' && !newCompendiumName) {
            ui.notifications?.warn('Please enter a compendium name');
            return;
        }

        // Generate full NPC with stats
        const npc = NPCGenerator.generateNPC(inputData);

        // Handle different destinations
        if (destination === 'world') {
            await NPCGeneratorUI.createActor(npc);
        } else if (destination === 'new-compendium') {
            await NPCGeneratorUI.createActorInNewCompendium(npc, newCompendiumName);
        } else if (destination.startsWith('compendium:')) {
            const compendiumId = destination.replace('compendium:', '');
            await NPCGeneratorUI.createActorInCompendium(npc, compendiumId);
        }

        // @ts-ignore
        this.close();
    }

    static async onCancel(event: Event, target: HTMLElement) {
        // @ts-ignore
        this.close();
    }
}

export class NPCGeneratorUI {
    private static generator = new NPCGenerator();

    static addGeneratorButton(): void {
        // Add button to the actors directory header
        const actorsTab = document.querySelector('#actors');
        if (!actorsTab) return;

        const header = actorsTab.querySelector('.directory-header');
        if (!header) return;

        // Check if button already exists to prevent duplicates
        if (header.querySelector('.npc-generator-btn')) return;

        const button = document.createElement('button');
        button.innerHTML = '<i class="fas fa-user-plus"></i> Generate NPC';
        button.className = 'npc-generator-btn';
        button.onclick = () => this.showGeneratorDialog();

        // Insert before the search/filter element
        const searchFilter = header.querySelector('.header-search, .filter');
        if (searchFilter) {
            header.insertBefore(button, searchFilter);
        } else {
            header.appendChild(button);
        }
    }

    static async showGeneratorDialog(): Promise<void> {
        new NPCGeneratorDialog().render(true);
    }

    static async createActor(npc: NPC): Promise<void> {
        try {
            // Build skills object
            const skills: any = {};
            npc.skills.forEach(skill => {
                skills[skill] = { value: 1, ability: this.getSkillAbility(skill) };
            });

            // Build saves object
            const saves: any = {
                str: { proficient: npc.saves.includes('str') ? 1 : 0 },
                dex: { proficient: npc.saves.includes('dex') ? 1 : 0 },
                con: { proficient: npc.saves.includes('con') ? 1 : 0 },
                int: { proficient: npc.saves.includes('int') ? 1 : 0 },
                wis: { proficient: npc.saves.includes('wis') ? 1 : 0 },
                cha: { proficient: npc.saves.includes('cha') ? 1 : 0 }
            };

            const actorData = {
                name: npc.name,
                type: "npc",
                system: {
                    abilities: {
                        str: { value: npc.abilities.str, proficient: saves.str.proficient },
                        dex: { value: npc.abilities.dex, proficient: saves.dex.proficient },
                        con: { value: npc.abilities.con, proficient: saves.con.proficient },
                        int: { value: npc.abilities.int, proficient: saves.int.proficient },
                        wis: { value: npc.abilities.wis, proficient: saves.wis.proficient },
                        cha: { value: npc.abilities.cha, proficient: saves.cha.proficient }
                    },
                    attributes: {
                        hp: {
                            value: npc.hp,
                            max: npc.hp
                        },
                        ac: {
                            calc: "default"  // Use equipped armor
                        },
                        movement: {
                            walk: npc.speed.walk,
                            fly: npc.speed.fly || 0,
                            climb: npc.speed.climb || 0,
                            swim: npc.speed.swim || 0,
                            units: "ft"
                        }
                    },
                    details: {
                        cr: npc.challengeRating,
                        type: {
                            value: npc.species.toLowerCase()
                        },
                        alignment: npc.alignment.toLowerCase().replace(' ', ''),
                        biography: {
                            value: this.formatBiography(npc)
                        }
                    },
                    skills,
                    traits: {
                        languages: {
                            value: new Set(npc.languages),
                            custom: ""
                        }
                    },
                    currency: npc.currency
                },
                prototypeToken: {
                    name: npc.name
                }
            };

            const actor = await Actor.create(actorData);

            if (actor) {
                // Add equipment, features, class features, and spells from compendiums
                await this.addEquipment(actor, npc);
                await this.addFeatures(actor, npc);
                await this.addClassFeatures(actor, npc);
                await this.addSpells(actor, npc);

                ui.notifications?.info(`Created NPC: ${npc.name} (CR ${npc.challengeRating})`);

                // Open the actor sheet
                actor.sheet?.render(true);
            }
        } catch (error) {
            console.error("Error creating NPC:", error);
            ui.notifications?.error("Failed to create NPC");
        }
    }

    static async createActorInNewCompendium(npc: NPC, compendiumName: string): Promise<void> {
        try {
            // Create a new compendium
            const compendium = await CompendiumCollection.createCompendium({
                label: compendiumName,
                type: 'Actor',
                name: compendiumName.toLowerCase().replace(/\s+/g, '-'),
                package: 'world'
            });

            ui.notifications?.info(`Created compendium: ${compendiumName}`);

            // Create the actor in the new compendium
            await this.createActorInCompendium(npc, compendium.collection);

        } catch (error) {
            console.error("Error creating compendium:", error);
            ui.notifications?.error("Failed to create compendium");
        }
    }

    static async createActorInCompendium(npc: NPC, compendiumId: string): Promise<void> {
        try {
            const pack = game.packs.get(compendiumId);
            if (!pack) {
                ui.notifications?.error(`Compendium ${compendiumId} not found`);
                return;
            }

            // Create the actor in the world first (with all items)
            // This uses the existing working code
            const actor = await this.createActorWithItems(npc);

            if (!actor) {
                ui.notifications?.error("Failed to create NPC");
                return;
            }

            // Import the completed actor into the compendium
            const compendiumActor = await pack.importDocument(actor);

            if (compendiumActor) {
                ui.notifications?.info(`Created NPC: ${npc.name} (CR ${npc.challengeRating}) in ${pack.title}`);

                // Delete the temporary world actor
                await actor.delete();

                // Import back to world and open sheet for viewing/editing
                const worldActor = await game.actors?.importFromCompendium(pack, compendiumActor.id);
                if (worldActor) {
                    worldActor.sheet?.render(true);
                }
            }
        } catch (error) {
            console.error("Error creating NPC in compendium:", error);
            ui.notifications?.error("Failed to create NPC in compendium");
        }
    }

    private static async createActorWithItems(npc: NPC): Promise<any> {
        try {
            // Build skills object
            const skills: any = {};
            npc.skills.forEach(skill => {
                skills[skill] = { value: 1, ability: this.getSkillAbility(skill) };
            });

            // Build saves object
            const saves: any = {
                str: { proficient: npc.saves.includes('str') ? 1 : 0 },
                dex: { proficient: npc.saves.includes('dex') ? 1 : 0 },
                con: { proficient: npc.saves.includes('con') ? 1 : 0 },
                int: { proficient: npc.saves.includes('int') ? 1 : 0 },
                wis: { proficient: npc.saves.includes('wis') ? 1 : 0 },
                cha: { proficient: npc.saves.includes('cha') ? 1 : 0 }
            };

            const actorData = {
                name: npc.name,
                type: "npc",
                system: {
                    abilities: {
                        str: { value: npc.abilities.str, proficient: saves.str.proficient },
                        dex: { value: npc.abilities.dex, proficient: saves.dex.proficient },
                        con: { value: npc.abilities.con, proficient: saves.con.proficient },
                        int: { value: npc.abilities.int, proficient: saves.int.proficient },
                        wis: { value: npc.abilities.wis, proficient: saves.wis.proficient },
                        cha: { value: npc.abilities.cha, proficient: saves.cha.proficient }
                    },
                    attributes: {
                        hp: {
                            value: npc.hp,
                            max: npc.hp
                        },
                        ac: {
                            calc: "default"
                        },
                        movement: {
                            walk: npc.speed.walk,
                            fly: npc.speed.fly || 0,
                            climb: npc.speed.climb || 0,
                            swim: npc.speed.swim || 0,
                            units: "ft"
                        }
                    },
                    details: {
                        cr: npc.challengeRating,
                        type: {
                            value: npc.species.toLowerCase()
                        },
                        alignment: npc.alignment.toLowerCase().replace(' ', ''),
                        biography: {
                            value: this.formatBiography(npc)
                        }
                    },
                    skills,
                    traits: {
                        languages: {
                            value: new Set(npc.languages),
                            custom: ""
                        }
                    },
                    currency: npc.currency
                },
                prototypeToken: {
                    name: npc.name
                }
            };

            const actor = await Actor.create(actorData);

            if (actor) {
                // Add equipment, features, class features, and spells
                await this.addEquipment(actor, npc);
                await this.addFeatures(actor, npc);
                await this.addClassFeatures(actor, npc);
                await this.addSpells(actor, npc);
            }

            return actor;
        } catch (error) {
            console.error("Error creating actor with items:", error);
            return null;
        }
    }

    private static async addEquipment(actor: any, npc: NPC): Promise<void> {
        const cr = parseCR(npc.challengeRating);
        const equipmentPool = getEquipmentForClass(npc.class, cr);
        const allEquipment = [...equipmentPool.weapons, ...equipmentPool.armor];

        if (allEquipment.length === 0) return;

        try {
            const pack = game.packs.get('dnd5e.items');
            if (!pack) return;

            const items = [];
            for (const itemName of allEquipment) {
                const item = pack.index.find((i: any) => i.name === itemName);
                if (item) {
                    const fullItem = await pack.getDocument(item._id);
                    if (fullItem) items.push(fullItem);
                }
            }

            if (items.length > 0) {
                // Mark all items as equipped
                const itemData = items.map((i: any) => {
                    const obj = i.toObject();
                    if (obj.system && 'equipped' in obj.system) {
                        obj.system.equipped = true;
                    }
                    return obj;
                });
                await actor.createEmbeddedDocuments('Item', itemData);
            }
        } catch (error) {
            console.warn('Could not add equipment:', error);
        }
    }

    private static async addFeatures(actor: any, npc: NPC): Promise<void> {
        const cr = parseCR(npc.challengeRating);

        // Common monster features by CR range
        const featureMap: Record<string, string[]> = {
            'low': ['Keen Senses', 'Pack Tactics'],
            'medium': ['Multiattack', 'Keen Senses', 'Magic Resistance'],
            'high': ['Legendary Resistance (3/Day)', 'Magic Resistance', 'Multiattack']
        };

        let pool: string[];
        if (cr < 3) pool = featureMap.low;
        else if (cr < 10) pool = featureMap.medium;
        else pool = featureMap.high;

        try {
            const pack = game.packs.get('dnd5e.monsterfeatures');
            if (!pack) return;

            const features = [];
            for (const featureName of pool) {
                const feature = pack.index.find((f: any) => f.name === featureName);
                if (feature) {
                    const fullFeature = await pack.getDocument(feature._id);
                    if (fullFeature) features.push(fullFeature);
                }
            }

            if (features.length > 0) {
                await actor.createEmbeddedDocuments('Item', features.map((f: any) => f.toObject()));
            }
        } catch (error) {
            console.warn('Could not add features:', error);
        }
    }

    private static async addClassFeatures(actor: any, npc: NPC): Promise<void> {
        const level = crToLevel(npc.challengeRating);
        const classFeatureList = CLASS_FEATURES[npc.class] || {};
        const featuresToAdd: string[] = [];

        // Add features based on level thresholds
        for (const [threshold, features] of Object.entries(classFeatureList)) {
            if (level >= parseInt(threshold)) {
                featuresToAdd.push(...features);
            }
        }

        if (featuresToAdd.length === 0) return;

        try {
            const pack = game.packs.get('dnd5e.classfeatures');
            if (!pack) {
                console.warn('Class features pack not found');
                return;
            }

            const features = [];
            for (const featureName of featuresToAdd) {
                const feature = pack.index.find((f: any) =>
                    f.name.toLowerCase().includes(featureName.toLowerCase())
                );
                if (feature) {
                    const fullFeature = await pack.getDocument(feature._id);
                    if (fullFeature) features.push(fullFeature);
                }
            }

            if (features.length > 0) {
                await actor.createEmbeddedDocuments('Item', features.map((f: any) => f.toObject()));
            }
        } catch (error) {
            console.warn('Could not add class features:', error);
        }
    }

    private static async addSpells(actor: any, npc: NPC): Promise<void> {
        // Check if class has spellcasting
        if (!SPELLCASTING_CLASSES.includes(npc.class)) {
            return;
        }

        const level = crToLevel(npc.challengeRating);
        const spellSelection = getSpellsForClass(npc.class, level);

        const allSpells = [
            ...spellSelection.cantrips,
            ...spellSelection.level1,
            ...spellSelection.level2,
            ...spellSelection.level3,
            ...spellSelection.level4,
            ...spellSelection.level5,
            ...spellSelection.level6,
            ...spellSelection.level7,
            ...spellSelection.level8,
            ...spellSelection.level9
        ];

        if (allSpells.length === 0) return;

        try {
            const pack = game.packs.get('dnd5e.spells');
            if (!pack) {
                console.warn('Spells pack not found');
                return;
            }

            const spells = [];
            for (const spellName of allSpells) {
                const spell = pack.index.find((s: any) => s.name === spellName);
                if (spell) {
                    const fullSpell = await pack.getDocument(spell._id);
                    if (fullSpell) spells.push(fullSpell);
                }
            }

            if (spells.length > 0) {
                await actor.createEmbeddedDocuments('Item', spells.map((s: any) => s.toObject()));
            }
        } catch (error) {
            console.warn('Could not add spells:', error);
        }
    }

    private static getSkillAbility(skillKey: string): string {
        const skillAbilityMap: Record<string, string> = {
            "acr": "dex", "ani": "wis", "arc": "int", "ath": "str",
            "dec": "cha", "his": "int", "ins": "wis", "itm": "cha",
            "inv": "int", "med": "wis", "nat": "int", "prc": "wis",
            "prf": "cha", "per": "cha", "rel": "int", "slt": "dex",
            "ste": "dex", "sur": "wis"
        };
        return skillAbilityMap[skillKey] || "wis";
    }

    private static formatBiography(npc: NPC): string {
        return `
            <h3>Character Profile</h3>
            <p><strong>Description:</strong> ${npc.description}</p>
            <p><strong>Species:</strong> ${npc.species}</p>
            <p><strong>Alignment:</strong> ${npc.alignment}</p>
            <p><strong>Challenge Rating:</strong> ${npc.challengeRating}</p>
            <h4>Abilities</h4>
            <p><strong>STR:</strong> ${npc.abilities.str} | <strong>DEX:</strong> ${npc.abilities.dex} | <strong>CON:</strong> ${npc.abilities.con}</p>
            <p><strong>INT:</strong> ${npc.abilities.int} | <strong>WIS:</strong> ${npc.abilities.wis} | <strong>CHA:</strong> ${npc.abilities.cha}</p>
            <h4>Combat Stats</h4>
            <p><strong>Hit Points:</strong> ${npc.hp} | <strong>Armor Class:</strong> ${npc.ac}</p>
        `;
    }
}
