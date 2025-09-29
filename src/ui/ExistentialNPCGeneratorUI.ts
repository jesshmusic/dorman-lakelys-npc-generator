// UI components for the Existential NPC Generator
import { ExistentialNPCGenerator, ExistentialNPC } from '../generator/ExistentialNPCGenerator.js';

export class ExistentialNPCGeneratorUI {
    private static generator = new ExistentialNPCGenerator();

    static addGeneratorButton(): void {
        // Add button to the actors directory header
        const actorsTab = document.querySelector('#actors');
        if (!actorsTab) return;

        const header = actorsTab.querySelector('.directory-header');
        if (!header) return;

        const button = document.createElement('button');
        button.innerHTML = '<i class="fas fa-user-plus"></i> Generate Existential NPC';
        button.className = 'existential-npc-btn';
        button.onclick = () => this.showGeneratorDialog();

        header.appendChild(button);
    }

    static async showGeneratorDialog(): Promise<void> {
        const npc = this.generator.generateNPC();

        const content = `
            <div class="existential-npc-generator">
                <h2>${npc.name}</h2>
                <div class="npc-details">
                    <p><strong>Age:</strong> ${npc.age}</p>
                    <p><strong>Occupation:</strong> ${npc.occupation}</p>
                    <p><strong>Existential Crisis:</strong> ${npc.existentialCrisis}</p>
                    <p><strong>Philosophy:</strong> ${npc.philosophy}</p>
                    <p><strong>Motivation:</strong> ${npc.motivation}</p>
                    <p><strong>Fear:</strong> ${npc.fear}</p>
                    <p><strong>Hope:</strong> ${npc.hope}</p>
                    <p><strong>Contradiction:</strong> ${npc.contradiction}</p>
                    <p><strong>Backstory:</strong> ${npc.backstory}</p>
                </div>
            </div>
        `;

        const dialog = new Dialog({
            title: "Existential NPC Generator",
            content: content,
            buttons: {
                create: {
                    label: "Create Actor",
                    callback: () => this.createActor(npc)
                },
                regenerate: {
                    label: "Regenerate",
                    callback: () => this.showGeneratorDialog()
                },
                close: {
                    label: "Close"
                }
            },
            default: "create"
        });

        dialog.render(true);
    }

    static async createActor(npc: ExistentialNPC): Promise<void> {
        try {
            const actorData = {
                name: npc.name,
                type: "npc",
                system: {
                    details: {
                        biography: {
                            value: this.formatBiography(npc)
                        }
                    }
                },
                prototypeToken: {
                    name: npc.name
                }
            };

            const actor = await Actor.create(actorData);

            ui.notifications?.info(`Created existential NPC: ${npc.name}`);

            // Open the actor sheet
            actor?.sheet?.render(true);
        } catch (error) {
            console.error("Error creating NPC:", error);
            ui.notifications?.error("Failed to create NPC");
        }
    }

    private static formatBiography(npc: ExistentialNPC): string {
        return `
            <h3>Existential Profile</h3>
            <p><strong>Age:</strong> ${npc.age}</p>
            <p><strong>Occupation:</strong> ${npc.occupation}</p>

            <h4>Inner Life</h4>
            <p><strong>Existential Crisis:</strong> ${npc.existentialCrisis}</p>
            <p><strong>Philosophy:</strong> ${npc.philosophy}</p>
            <p><strong>Motivation:</strong> ${npc.motivation}</p>
            <p><strong>Fear:</strong> ${npc.fear}</p>
            <p><strong>Hope:</strong> ${npc.hope}</p>
            <p><strong>Contradiction:</strong> ${npc.contradiction}</p>

            <h4>Background</h4>
            <p>${npc.backstory}</p>
        `;
    }
}