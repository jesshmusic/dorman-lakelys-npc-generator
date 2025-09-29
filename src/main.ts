// Main entry point for the Existential NPC Generator module
import { ExistentialNPCGenerator } from './generator/ExistentialNPCGenerator.js';
import { registerSettings } from './settings/ModuleSettings.js';
import { ExistentialNPCGeneratorUI } from './ui/ExistentialNPCGeneratorUI.js';

// Module constants
const MODULE_ID = 'existential-npc-generator';

// Initialize the module when Foundry is ready
Hooks.once('init', async () => {
    console.log(`${MODULE_ID} | Initializing Existential NPC Generator`);

    // Register module settings
    registerSettings();

    // Register the generator in the global scope for API access
    (globalThis as any).ExistentialNPCGenerator = {
        generator: new ExistentialNPCGenerator(),
        ui: ExistentialNPCGeneratorUI
    };
});

// Add UI elements when ready
Hooks.once('ready', async () => {
    console.log(`${MODULE_ID} | Existential NPC Generator ready`);

    // Add button to actor directory
    ExistentialNPCGeneratorUI.addGeneratorButton();
});

// Handle canvas ready for any canvas-specific functionality
Hooks.once('canvasReady', async () => {
    console.log(`${MODULE_ID} | Canvas ready`);
});