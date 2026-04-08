// Module settings configuration
const MODULE_ID = 'dorman-lakelys-npc-generator';

/**
 * Small ApplicationV2 subclasses whose only job is to immediately open a
 * DialogV2 prompt pointing at Patreon / Dungeon Master Guru. Registered via
 * `game.settings.registerMenu` so they show up as "Configure" entries in the
 * standard Foundry Module Settings panel.
 */
const { ApplicationV2 } = (foundry as any).applications.api;
const DialogV2 = (foundry as any).applications.api.DialogV2;

class PatreonLink extends ApplicationV2 {
  static DEFAULT_OPTIONS = {
    id: 'npc-generator-patreon-link',
    tag: 'div',
    window: {
      title: 'Support on Patreon',
      icon: 'fab fa-patreon'
    },
    position: { width: 1, height: 1 }
  } as const;

  async _renderHTML(): Promise<HTMLElement> {
    return document.createElement('div');
  }

  _replaceHTML(result: HTMLElement, content: HTMLElement): void {
    content.replaceChildren(result);
  }

  async _onFirstRender(_context: unknown, _options: unknown): Promise<void> {
    (this as any).element?.style?.setProperty('display', 'none');
    await DialogV2.prompt({
      window: { title: 'Support on Patreon' },
      content: '<p>Open the Patreon page in a new tab.</p>',
      ok: {
        label: '<i class="fab fa-patreon"></i> Visit Patreon',
        callback: () =>
          window.open('https://www.patreon.com/c/DormanLakely', '_blank', 'noopener,noreferrer')
      }
    });
    (this as any).close();
  }
}

class DmGuruLink extends ApplicationV2 {
  static DEFAULT_OPTIONS = {
    id: 'npc-generator-dmguru-link',
    tag: 'div',
    window: {
      title: 'Dungeon Master Guru',
      icon: 'fas fa-dragon'
    },
    position: { width: 1, height: 1 }
  } as const;

  async _renderHTML(): Promise<HTMLElement> {
    return document.createElement('div');
  }

  _replaceHTML(result: HTMLElement, content: HTMLElement): void {
    content.replaceChildren(result);
  }

  async _onFirstRender(_context: unknown, _options: unknown): Promise<void> {
    (this as any).element?.style?.setProperty('display', 'none');
    await DialogV2.prompt({
      window: { title: 'Dungeon Master Guru' },
      content: '<p>Open the Dungeon Master Guru site in a new tab.</p>',
      ok: {
        label: '<i class="fas fa-dragon"></i> Visit Dungeon Master Guru',
        callback: () => window.open('https://dungeonmaster.guru', '_blank', 'noopener,noreferrer')
      }
    });
    (this as any).close();
  }
}

export function registerSettings(): void {
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
    hint: 'Controls creativity/variety for name generation (0.0 = consistent, 2.0 = very random). Default 1.0 provides good variety. Increase to 1.3-1.5 if you notice repeated names.',
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

  // Portrait Storage Source (for Forge VTT / S3 users)
  (game.settings as any)?.register(MODULE_ID, 'portraitStorageSource', {
    name: 'Portrait Storage Source',
    hint: 'Where to save generated portrait images. Use "User Data" for local/self-hosted Foundry. Forge VTT users should select "Forge VTT Assets".',
    scope: 'world',
    config: true,
    type: String,
    choices: {
      data: 'User Data (Default - local/self-hosted)',
      forgevtt: 'Forge VTT Assets',
      s3: 'S3 Storage'
    },
    default: 'data'
  });

  // Debug Mode
  (game.settings as any)?.register(MODULE_ID, 'debugMode', {
    name: 'Debug Mode',
    hint: 'Enable debug mode to show a "Random Fill" button in the NPC generator for testing purposes.',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
    requiresReload: true
  });

  // Support / cross-promotion settings menu entries
  (game.settings as any)?.registerMenu(MODULE_ID, 'patreonLink', {
    name: 'Support on Patreon',
    label: 'Visit Patreon',
    hint: 'Support the development of this module on Patreon! Your contributions help fund new features and updates.',
    icon: 'fab fa-patreon',
    type: PatreonLink,
    restricted: true
  });

  (game.settings as any)?.registerMenu(MODULE_ID, 'dmGuruLink', {
    name: 'Dungeon Master Guru',
    label: 'Visit Dungeon Master Guru',
    hint: 'SRD rules and DM tools. Free resources for Dungeon Masters at dungeonmaster.guru.',
    icon: 'fas fa-dragon',
    type: DmGuruLink,
    restricted: true
  });
}
