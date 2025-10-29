// UI components for the NPC Generator
import { NPCGenerator, NPC } from '../generator/ExistentialNPCGenerator.js';
import { AIService, AIGenerationRequest } from '../services/AIService.js';

const MODULE_ID = 'dorman-lakelys-npc-generator';

// Foundry V2 Application Dialog
class NPCGeneratorDialog extends foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.api.ApplicationV2
) {
  static DEFAULT_OPTIONS = {
    id: 'npc-generator-dialog',
    classes: ['npc-generator', 'em-puzzles'],
    tag: 'form',
    window: {
      contentClasses: ['standard-form'],
      title: 'NPC Generator',
      icon: 'fas fa-user-plus',
      resizable: true
    },
    position: {
      width: 600,
      height: 'auto' as const
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

  async _prepareContext(_options: any): Promise<any> {
    // Get all actor folders
    const folders = Array.from(game.folders?.values() || [])
      .filter((folder: any) => folder.type === 'Actor')
      .map((folder: any) => ({
        id: folder.id,
        name: folder.name
      }));

    // Check if AI is enabled
    const aiEnabled = ((game.settings as any)?.get(MODULE_ID, 'enableAI') as boolean) || false;

    return {
      flavors: NPCGenerator.FLAVORS,
      genders: NPCGenerator.GENDERS,
      roles: NPCGenerator.ROLES,
      alignments: NPCGenerator.ALIGNMENTS,
      personalities: NPCGenerator.PERSONALITIES,
      folders,
      aiEnabled
    };
  }

  _onRender(context: any, options: any): void {
    super._onRender(context, options);

    // Set up AI generation buttons
    const aiButtons = this.element.querySelectorAll('[data-ai-action]');
    aiButtons.forEach((button: Element) => {
      (button as HTMLElement).onclick = this._onAIGenerate.bind(this);
    });

    // Set up CR slider value display
    const crSlider = this.element.querySelector('#npc-cr') as HTMLInputElement;
    const crValueDisplay = this.element.querySelector('#cr-value') as HTMLElement;
    if (crSlider && crValueDisplay) {
      crSlider.addEventListener('input', () => {
        const crIndex = parseInt(crSlider.value);
        const crValue = NPCGenerator.CHALLENGE_RATINGS[crIndex];
        crValueDisplay.textContent = crValue;
      });
    }

    // Set up file picker buttons
    const filePickerButtons = this.element.querySelectorAll('.file-picker');
    filePickerButtons.forEach((button: Element) => {
      (button as HTMLElement).onclick = this._onFilePicker.bind(this);
    });

    // Set up image preview updates
    const portraitInput = this.element.querySelector('#npc-portrait') as HTMLInputElement;
    const tokenInput = this.element.querySelector('#npc-token') as HTMLInputElement;

    if (portraitInput) {
      portraitInput.addEventListener('input', () => this._updateImagePreview('portrait'));
    }
    if (tokenInput) {
      tokenInput.addEventListener('input', () => this._updateImagePreview('token'));
    }
  }

  /**
   * Handle file picker button clicks
   */
  async _onFilePicker(event: Event): Promise<void> {
    event.preventDefault();
    const button = event.currentTarget as HTMLElement;
    const target = button.dataset.target;
    const type = button.dataset.type;

    if (!target) return;

    const input = this.element.querySelector(`#npc-${target}`) as HTMLInputElement;
    if (!input) return;

    const fp = new (FilePicker as any)({
      type: type,
      current: input.value,
      callback: (path: string) => {
        input.value = path;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    return fp.browse();
  }

  /**
   * Update image preview
   */
  _updateImagePreview(type: 'portrait' | 'token'): void {
    const input = this.element.querySelector(`#npc-${type}`) as HTMLInputElement;
    const preview = this.element.querySelector(`[data-preview="${type}"] img`) as HTMLImageElement;

    if (!input || !preview) return;

    if (input.value) {
      preview.src = input.value;
      preview.style.display = 'block';
    } else {
      preview.style.display = 'none';
    }
  }

  /**
   * Handle AI generation button clicks
   */
  async _onAIGenerate(event: Event): Promise<void> {
    event.preventDefault();
    const button = event.currentTarget as HTMLElement;
    const action = button.dataset.aiAction;

    if (!action) return;

    // Gather context from form
    const context = this._getFormContext();

    // Show loading state
    button.classList.add('loading');
    const originalHTML = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    try {
      switch (action) {
        case 'generateName':
          await this._generateNames(context);
          break;
        case 'generateBio':
          await this._generateBiography(context);
          break;
        case 'generatePortrait':
          await this._generatePortrait(context);
          break;
      }
    } catch (error: any) {
      console.error("Dorman Lakely's NPC Gen | AI Generation Error:", error);
      ui.notifications?.error(`AI generation failed: ${error.message}`);
    } finally {
      // Restore button state
      button.classList.remove('loading');
      button.innerHTML = originalHTML;
    }
  }

  /**
   * Get current form context for AI generation
   */
  _getFormContext(): any {
    const flavorSelect = this.element.querySelector('#npc-flavor') as HTMLSelectElement;
    const nameInput = this.element.querySelector('#npc-name') as HTMLInputElement;
    const genderSelect = this.element.querySelector('#npc-gender') as HTMLSelectElement;
    const roleSelect = this.element.querySelector('#npc-role') as HTMLSelectElement;
    const alignmentSelect = this.element.querySelector('#npc-alignment') as HTMLSelectElement;
    const crSlider = this.element.querySelector('#npc-cr') as HTMLInputElement;
    const crIndex = parseInt(crSlider?.value || '5');
    const challengeRating = NPCGenerator.CHALLENGE_RATINGS[crIndex];
    const personalitySelect = this.element.querySelector('#npc-personality') as HTMLSelectElement;
    const idealSelect = this.element.querySelector('#npc-ideal') as HTMLSelectElement;
    const bondSelect = this.element.querySelector('#npc-bond') as HTMLSelectElement;
    const biographyTextarea = this.element.querySelector('#npc-biography') as HTMLTextAreaElement;

    return {
      flavor: flavorSelect?.value,
      name: nameInput?.value,
      gender: genderSelect?.value,
      role: roleSelect?.value,
      alignment: alignmentSelect?.value,
      challengeRating,
      personality: personalitySelect?.value,
      ideal: idealSelect?.value,
      bond: bondSelect?.value,
      biography: biographyTextarea?.value
    };
  }

  /**
   * Generate name suggestions
   */
  async _generateNames(context: any): Promise<void> {
    const request: AIGenerationRequest = {
      type: 'name',
      context
    };

    const response = await AIService.generate(request);

    if (!response.success) {
      ui.notifications?.error(`Failed to generate name: ${response.error}`);
      return;
    }

    // Use the first generated name directly
    const names = response.content as string[];
    if (names && names.length > 0) {
      const nameInput = this.element.querySelector('#npc-name') as HTMLInputElement;
      if (nameInput) {
        nameInput.value = names[0];
        ui.notifications?.info(`Generated name: ${names[0]}`);
      }
    }
  }

  /**
   * Generate biography
   */
  async _generateBiography(context: any): Promise<void> {
    const request: AIGenerationRequest = {
      type: 'biography',
      context
    };

    const response = await AIService.generate(request);

    if (!response.success) {
      ui.notifications?.error(`Failed to generate biography: ${response.error}`);
      return;
    }

    // Use the generated biography directly
    const biography = response.content as string;
    if (biography) {
      const biographyTextarea = this.element.querySelector(
        '#npc-biography'
      ) as HTMLTextAreaElement;
      if (biographyTextarea) {
        biographyTextarea.value = biography;
        ui.notifications?.info('Biography generated successfully');
      }
    }
  }

  /**
   * Generate portrait using DALL-E
   */
  async _generatePortrait(context: any): Promise<void> {
    const request: AIGenerationRequest = {
      type: 'portrait',
      context
    };

    const response = await AIService.generate(request);

    if (!response.success) {
      // Error message from AIService is already user-friendly and complete
      ui.notifications?.error(response.error || 'Failed to generate portrait. Please try again.');
      return;
    }

    // Use the generated portrait path directly
    const portraitPath = response.content as string;
    if (portraitPath) {
      const portraitInput = this.element.querySelector('#npc-portrait') as HTMLInputElement;
      if (portraitInput) {
        portraitInput.value = portraitPath;
        // Trigger preview update
        this._updateImagePreview('portrait');
      }
    }
  }

  static async onCreateNPC(event: Event, target: HTMLElement) {
    const form = target.closest('form');
    if (!form) return;

    const formData = new FormData(form);
    const name = formData.get('name') as string;
    const biography = formData.get('biography') as string;
    const role = formData.get('role') as string;
    const alignment = formData.get('alignment') as string;
    const crSlider = form.querySelector('#npc-cr') as HTMLInputElement;
    const crIndex = parseInt(crSlider?.value || '5');
    const challengeRating = NPCGenerator.CHALLENGE_RATINGS[crIndex];
    const personality = formData.get('personality') as string;
    const ideal = formData.get('ideal') as string;
    const bond = formData.get('bond') as string;
    const portrait = formData.get('portrait') as string;
    const token = formData.get('token') as string;
    const folderId = formData.get('folder') as string;

    // Validate required fields
    if (!name) {
      ui.notifications?.warn('Please enter a name');
      return;
    }

    // Create NPC data
    const inputData = {
      name,
      description: biography || '',
      alignment,
      challengeRating,
      class: role,
      species: 'humanoid', // Default to humanoid for simple NPCs
      portrait: portrait || undefined,
      token: token || undefined
    };

    // Generate NPC with CR-appropriate stats
    const npc = NPCGenerator.generateNPC(inputData);

    // Create actor in world with personality traits
    await NPCGeneratorUI.createSimpleActor(npc, personality, ideal, bond, folderId || null);

    // @ts-expect-error - close() exists at runtime but not in types
    this.close();
  }

  static async onCancel(_event: Event, _target: HTMLElement) {
    // @ts-expect-error - close() exists at runtime but not in types
    this.close();
  }
}

export class NPCGeneratorUI {
  private static generator = new NPCGenerator();

  static addGeneratorButton(): void {
    // Only show button to GM users
    if (!game.user?.isGM) return;

    // Add button to the actors directory header
    const actorsTab = document.querySelector('#actors');
    if (!actorsTab) return;

    const header = actorsTab.querySelector('.directory-header');
    if (!header) return;

    // Check if button already exists to prevent duplicates
    if (header.querySelector('.npc-generator-btn')) return;

    const button = document.createElement('button');
    button.innerHTML = '<i class="fas fa-user-plus"></i> Dorman\'s NPC Gen';
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

  /**
   * Create a simple actor in world with personality traits
   */
  static async createSimpleActor(
    npc: NPC,
    personality: string,
    ideal: string,
    bond: string,
    folderId: string | null = null
  ): Promise<void> {
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

      // Format personality traits with HTML list items
      const personalityHtml = personality ? `<li>${personality}</li>` : '';
      const idealHtml = ideal ? `<li>${ideal}</li>` : '';
      const bondHtml = bond ? `<li>${bond}</li>` : '';

      const actorData: any = {
        name: npc.name,
        type: 'npc',
        folder: folderId,
        img: npc.portrait || 'icons/svg/mystery-man.svg',
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
              calc: 'default'
            },
            movement: {
              walk: npc.speed.walk,
              fly: npc.speed.fly || 0,
              climb: npc.speed.climb || 0,
              swim: npc.speed.swim || 0,
              units: 'ft'
            }
          },
          details: {
            cr: npc.challengeRating,
            type: {
              value: npc.species.toLowerCase()
            },
            alignment: npc.alignment.toLowerCase().replace(' ', ''),
            biography: {
              value: npc.description
            },
            // Apply personality traits
            personality: personalityHtml,
            ideal: idealHtml,
            bond: bondHtml
          },
          skills,
          traits: {
            languages: {
              value: new Set(npc.languages),
              custom: ''
            }
          },
          currency: npc.currency
        },
        prototypeToken: {
          name: npc.name,
          texture: {
            src: npc.token || npc.portrait || 'icons/svg/mystery-man.svg'
          }
        }
      };

      const actor = await Actor.create(actorData);

      if (actor) {
        ui.notifications?.info(`Created NPC: ${npc.name} (CR ${npc.challengeRating})`);
        actor.sheet?.render(true);
      }
    } catch (error) {
      console.error("Dorman Lakely's NPC Gen | Error creating NPC:", error);
      ui.notifications?.error('Failed to create NPC');
    }
  }

  private static getSkillAbility(skillKey: string): string {
    const skillAbilityMap: Record<string, string> = {
      acr: 'dex',
      ani: 'wis',
      arc: 'int',
      ath: 'str',
      dec: 'cha',
      his: 'int',
      ins: 'wis',
      itm: 'cha',
      inv: 'int',
      med: 'wis',
      nat: 'int',
      prc: 'wis',
      prf: 'cha',
      per: 'cha',
      rel: 'int',
      slt: 'dex',
      ste: 'dex',
      sur: 'wis'
    };
    return skillAbilityMap[skillKey] || 'wis';
  }
}
