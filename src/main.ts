// Main entry point for the NPC Generator module
import { NPCGenerator } from './generator/ExistentialNPCGenerator.js';
import { registerSettings } from './settings/ModuleSettings.js';
import { NPCGeneratorUI } from './ui/ExistentialNPCGeneratorUI.js';
import packageInfo from '../package.json';

// Module constants
const MODULE_ID = 'dorman-lakelys-npc-generator';

// Initialize the module when Foundry is ready
Hooks.once('init', async () => {
  // Module initialization banner
  console.log(
    "%c⚔️ Dorman Lakely's NPC Generator %cv" + packageInfo.version,
    'color: #d32f2f; font-weight: bold; font-size: 20px;',
    'color: #f44336; font-weight: normal; font-size: 14px;'
  );

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
  console.log(
    "%c⚔️ Dorman Lakely's NPC Generator %c✓ Ready!",
    'color: #d32f2f; font-weight: bold; font-size: 20px;',
    'color: #4caf50; font-weight: bold; font-size: 14px;'
  );
});

// Re-add button every time the actors directory renders
Hooks.on('renderActorDirectory', async (_app: any, _html: any) => {
  NPCGeneratorUI.addGeneratorButton();
});

// Handle canvas ready for any canvas-specific functionality
Hooks.once('canvasReady', async () => {
  console.log(`Dorman Lakely's NPC Gen | Canvas ready`);
});
