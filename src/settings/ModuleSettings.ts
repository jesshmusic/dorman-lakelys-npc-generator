// Module settings configuration
const MODULE_ID = 'dorman-lakelys-npc-generator';

export function registerSettings(): void {
  // Patreon Authentication (client-scoped, per-user)
  (game.settings as any)?.register(MODULE_ID, 'patreonAuthData', {
    name: 'Patreon Authentication Data',
    hint: 'Stores Patreon authentication state (internal use)',
    scope: 'client', // Per-user, not per-world
    config: false, // Hidden from settings UI
    type: Object,
    default: null
  });

  // AI Integration Settings
  (game.settings as any)?.register(MODULE_ID, 'enableAI', {
    name: 'Enable AI Features',
    hint: 'Enable AI-powered generation using OpenAI. Requires API key.',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
    requiresReload: true
  });

  (game.settings as any)?.register(MODULE_ID, 'openaiApiKey', {
    name: 'OpenAI API Key',
    hint: 'Your OpenAI API key. Get one at https://platform.openai.com/api-keys (WARNING: Visible to all GMs)',
    scope: 'world',
    config: true,
    type: String,
    default: ''
  });

  (game.settings as any)?.register(MODULE_ID, 'openaiModel', {
    name: 'OpenAI Model',
    hint: 'Which OpenAI model to use. GPT-4o Mini is the default.',
    scope: 'world',
    config: true,
    type: String,
    choices: {
      'gpt-4o-mini': 'GPT-4o Mini (Default, $0.0001-0.0006 per NPC)',
      'gpt-4o': 'GPT-4o (Better quality, $0.0025-0.01 per NPC)',
      'gpt-4-turbo': 'GPT-4 Turbo (Legacy, $0.01-0.03 per NPC)'
    },
    default: 'gpt-4o-mini'
  });

  (game.settings as any)?.register(MODULE_ID, 'portraitArtStyle', {
    name: 'Portrait Art Style',
    hint: 'Default art style for AI-generated character portraits. Affects the visual appearance of generated images.',
    scope: 'world',
    config: true,
    type: String,
    choices: {
      'fantasy painting': 'Fantasy Painting (Default)',
      'fantasy realistic': 'Fantasy Realistic',
      'fantasy painterly': 'Fantasy Painterly',
      'digital art': 'Digital Art',
      'anime style': 'Anime Style',
      'pencil sketch': 'Pencil Sketch'
    },
    default: 'fantasy painting'
  });

  // Temperature/Randomness Settings
  (game.settings as any)?.register(MODULE_ID, 'nameTemperature', {
    name: 'Name Generation Randomness',
    hint: 'Controls creativity for name generation (0.0 = consistent, 2.0 = very random). Higher values produce more varied and creative names.',
    scope: 'world',
    config: true,
    type: Number,
    range: {
      min: 0.0,
      max: 2.0,
      step: 0.1
    },
    default: 1.0
  });

  (game.settings as any)?.register(MODULE_ID, 'bioTemperature', {
    name: 'Biography Generation Randomness',
    hint: 'Controls creativity for biography generation (0.0 = consistent, 2.0 = very random). Higher values produce more varied and creative biographies.',
    scope: 'world',
    config: true,
    type: Number,
    range: {
      min: 0.0,
      max: 2.0,
      step: 0.1
    },
    default: 0.8
  });

  (game.settings as any)?.register(MODULE_ID, 'portraitTemperature', {
    name: 'Portrait Prompt Randomness',
    hint: 'Controls creativity for portrait prompt generation (0.0 = consistent, 2.0 = very random). Note: This affects the prompt text, not the image model itself.',
    scope: 'world',
    config: true,
    type: Number,
    range: {
      min: 0.0,
      max: 2.0,
      step: 0.1
    },
    default: 0.9
  });
}
