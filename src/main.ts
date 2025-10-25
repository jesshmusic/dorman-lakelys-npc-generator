// Main entry point for the NPC Generator module
import { NPCGenerator } from './generator/ExistentialNPCGenerator.js';
import { registerSettings } from './settings/ModuleSettings.js';
import { NPCGeneratorUI } from './ui/ExistentialNPCGeneratorUI.js';

// Module constants
const MODULE_ID = 'dorman-lakelys-npc-generator';

// Initialize the module when Foundry is ready
Hooks.once('init', async () => {
  console.log(`${MODULE_ID} | Initializing NPC Generator`);

  // Register module settings
  registerSettings();

  // Register the generator in the global scope for API access
  (globalThis as any).NPCGenerator = {
    generator: new NPCGenerator(),
    ui: NPCGeneratorUI
  };
});

// Add UI elements when ready
Hooks.once('ready', async () => {
  console.log(`${MODULE_ID} | NPC Generator ready`);
});

// Re-add button every time the actors directory renders
Hooks.on('renderActorDirectory', async (_app: any, _html: any) => {
  NPCGeneratorUI.addGeneratorButton();
});

// Handle canvas ready for any canvas-specific functionality
Hooks.once('canvasReady', async () => {
  console.log(`${MODULE_ID} | Canvas ready`);
});
