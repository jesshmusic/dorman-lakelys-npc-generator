// UI components for the NPC Generator
import { NPCGenerator, NPC } from '../generator/ExistentialNPCGenerator.js';
import { AIService, AIGenerationRequest } from '../services/AIService.js';
import { PortraitConfirmationDialog } from './PortraitConfirmationDialog.js';
import { CRComparisonDialog } from './CRComparisonDialog.js';
import { parseCR, getCRStats } from '../utils/crCalculations.js';
import { getEquipmentForClass } from '../utils/equipmentData.js';
import { getTemplateActorName } from '../utils/templateData.js';
import {
  scaleTemplateActorToCR,
  addLanguagesToTemplate,
  addCurrencyToTemplate
} from '../utils/templateScaling.js';

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
      cancel: NPCGeneratorDialog.onCancel,
      debugFill: NPCGeneratorDialog.onDebugFill
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

    // Check if debug mode is enabled
    const debugMode = ((game.settings as any)?.get(MODULE_ID, 'debugMode') as boolean) || false;

    return {
      species: NPCGenerator.SPECIES,
      flavors: NPCGenerator.FLAVORS,
      genders: NPCGenerator.GENDERS,
      roles: NPCGenerator.ROLES,
      alignments: NPCGenerator.ALIGNMENTS,
      personalities: NPCGenerator.PERSONALITIES,
      folders,
      aiEnabled,
      debugMode
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

    // Set up personality multi-select dropdown
    this._setupPersonalityDropdown();
  }

  /**
   * Set up personality multi-select dropdown
   */
  private _setupPersonalityDropdown(): void {
    const dropdownSelect = this.element.querySelector('.multiple-dropdown-select');
    const dropdownToggle = this.element.querySelector('.multiple-dropdown');
    const dropdownList = this.element.querySelector('.dropdown-list');
    const personalityInput = this.element.querySelector('#npc-personality') as HTMLInputElement;
    const contentArea = this.element.querySelector('#personality-selected') as HTMLElement;

    if (!dropdownSelect || !dropdownToggle || !dropdownList || !personalityInput) return;

    // Toggle dropdown on click
    (dropdownToggle as HTMLElement).onclick = (event: Event) => {
      event.stopPropagation();
      dropdownList.classList.toggle('open');
    };

    // Close dropdown when clicking outside
    document.addEventListener('click', (event: Event) => {
      if (!dropdownSelect.contains(event.target as Node)) {
        dropdownList.classList.remove('open');
      }
    });

    // Handle item selection
    const items = dropdownList.querySelectorAll('.multiple-dropdown-item');
    items.forEach((item: Element) => {
      (item as HTMLElement).onclick = (event: Event) => {
        event.stopPropagation();
        const value = (item as HTMLElement).dataset.value;
        if (!value) return;

        const currentValues = personalityInput.value
          .split(',')
          .map(v => v.trim())
          .filter(v => v);

        if (currentValues.includes(value)) {
          // Remove trait
          const newValues = currentValues.filter(v => v !== value);
          personalityInput.value = newValues.join(', ');
          item.classList.remove('selected');
          this._removePersonalityPill(value);
        } else {
          // Add trait
          currentValues.push(value);
          personalityInput.value = currentValues.join(', ');
          item.classList.add('selected');
          this._addPersonalityPill(value);
        }

        dropdownList.classList.remove('open');
      };
    });
  }

  /**
   * Add a personality pill to the display
   */
  private _addPersonalityPill(value: string): void {
    const contentArea = this.element.querySelector('#personality-selected') as HTMLElement;
    if (!contentArea) return;

    const pill = document.createElement('div');
    pill.className = 'multiple-dropdown-option flexrow';
    pill.dataset.value = value;

    const span = document.createElement('span');
    span.textContent = value;
    pill.appendChild(span);

    const removeBtn = document.createElement('div');
    removeBtn.className = 'remove-option';
    removeBtn.innerHTML = '&times;';
    removeBtn.onclick = (event: Event) => {
      event.stopPropagation();
      this._removePersonalityTrait(value);
    };
    pill.appendChild(removeBtn);

    contentArea.appendChild(pill);
  }

  /**
   * Remove a personality pill from the display
   */
  private _removePersonalityPill(value: string): void {
    const pill = this.element.querySelector(`.multiple-dropdown-option[data-value="${value}"]`);
    if (pill) pill.remove();
  }

  /**
   * Remove a personality trait (from pill remove button)
   */
  private _removePersonalityTrait(value: string): void {
    const personalityInput = this.element.querySelector('#npc-personality') as HTMLInputElement;
    if (!personalityInput) return;

    const currentValues = personalityInput.value
      .split(',')
      .map(v => v.trim())
      .filter(v => v && v !== value);

    personalityInput.value = currentValues.join(', ');

    // Remove pill from display
    this._removePersonalityPill(value);

    // Remove selected state from dropdown item
    const item = this.element.querySelector(`.multiple-dropdown-item[data-value="${value}"]`);
    if (item) item.classList.remove('selected');
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
    const speciesSelect = this.element.querySelector('#npc-species') as HTMLSelectElement;
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
      species: speciesSelect?.value,
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
      const biographyTextarea = this.element.querySelector('#npc-biography') as HTMLTextAreaElement;
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
    // Show confirmation dialog which handles the entire generation flow
    const result = await PortraitConfirmationDialog.show(context);

    // User cancelled or generation failed
    if (!result.success) {
      return;
    }

    // Success! Update the portrait field
    if (result.portraitPath) {
      const portraitInput = this.element.querySelector('#npc-portrait') as HTMLInputElement;
      if (portraitInput) {
        portraitInput.value = result.portraitPath;
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

    // Create actor from template with personality traits
    await NPCGeneratorUI.createActorFromTemplate(npc, personality, ideal, bond, folderId || null);

    // @ts-expect-error - close() exists at runtime but not in types
    this.close();
  }

  static async onCancel(_event: Event, _target: HTMLElement) {
    // @ts-expect-error - close() exists at runtime but not in types
    this.close();
  }

  static async onDebugFill(_event: Event, target: HTMLElement) {
    const form = target.closest('form');
    if (!form) return;

    // Helper function to get random item from array
    const randomItem = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

    // Helper function to get random items (1-3) from array
    const randomItems = (arr: string[], min = 1, max = 3) => {
      const count = Math.floor(Math.random() * (max - min + 1)) + min;
      const shuffled = [...arr].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
    };

    // Fill Species
    const speciesSelect = form.querySelector('#npc-species') as HTMLSelectElement;
    if (speciesSelect) {
      speciesSelect.value = randomItem(NPCGenerator.SPECIES);
    }

    // Fill Gender (optional field)
    const genderSelect = form.querySelector('#npc-gender') as HTMLSelectElement;
    if (genderSelect) {
      // 80% chance to fill, 20% chance to leave empty
      if (Math.random() > 0.2) {
        genderSelect.value = randomItem(NPCGenerator.GENDERS);
      }
    }

    // Fill Flavor (optional field)
    const flavorSelect = form.querySelector('#npc-flavor') as HTMLSelectElement;
    if (flavorSelect) {
      // 60% chance to fill, 40% chance to leave empty
      if (Math.random() > 0.4) {
        flavorSelect.value = randomItem(NPCGenerator.FLAVORS);
      }
    }

    // Fill Role
    const roleSelect = form.querySelector('#npc-role') as HTMLSelectElement;
    if (roleSelect) {
      roleSelect.value = randomItem(NPCGenerator.ROLES);
    }

    // Fill Name
    const nameInput = form.querySelector('#npc-name') as HTMLInputElement;
    if (nameInput) {
      // Generate a simple random name
      const firstNames = [
        'Aldric',
        'Brenna',
        'Cedric',
        'Diana',
        'Erik',
        'Fiona',
        'Gareth',
        'Helena',
        'Iris',
        'Jonas'
      ];
      const lastNames = [
        'Stoneheart',
        'Brightwood',
        'Shadowbane',
        'Ironforge',
        'Swiftwind',
        'Goldleaf',
        'Ravencrest',
        'Moonwhisper'
      ];
      nameInput.value = `${randomItem(firstNames)} ${randomItem(lastNames)}`;
    }

    // Fill Alignment
    const alignmentSelect = form.querySelector('#npc-alignment') as HTMLSelectElement;
    if (alignmentSelect) {
      alignmentSelect.value = randomItem(NPCGenerator.ALIGNMENTS);
    }

    // Fill CR (random between 0-30)
    const crSlider = form.querySelector('#npc-cr') as HTMLInputElement;
    const crValue = form.querySelector('#cr-value') as HTMLElement;
    if (crSlider && crValue) {
      const randomCR = Math.floor(Math.random() * 31);
      crSlider.value = randomCR.toString();
      crValue.textContent = NPCGenerator.CHALLENGE_RATINGS[randomCR];
    }

    // Fill Personality Traits (select 1-3 random traits)
    const selectedPersonalities = randomItems(NPCGenerator.PERSONALITIES, 1, 3);
    const personalityHidden = form.querySelector('#npc-personality') as HTMLInputElement;
    const personalityContainer = form.querySelector('#personality-selected');
    if (personalityHidden && personalityContainer) {
      personalityHidden.value = selectedPersonalities.join(',');
      personalityContainer.innerHTML = '';
      selectedPersonalities.forEach(trait => {
        const pill = document.createElement('span');
        pill.className = 'selected-pill';
        pill.dataset.value = trait;
        pill.innerHTML = `${trait} <i class="fas fa-times"></i>`;
        personalityContainer.appendChild(pill);
      });
    }

    // Fill Biography with placeholder text
    const bioTextarea = form.querySelector('#npc-biography') as HTMLTextAreaElement;
    if (bioTextarea) {
      const bios = [
        'A wandering soul seeking purpose in a chaotic world.',
        'Once a noble, now fallen from grace and seeking redemption.',
        'A skilled artisan who left their past behind to forge a new destiny.',
        'Haunted by memories of a war long past.',
        'Driven by an insatiable curiosity about the arcane.'
      ];
      bioTextarea.value = randomItem(bios);
    }

    ui.notifications?.info('Debug: Form randomly filled!');
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
   * Detect available actor compendiums for template loading
   */
  private static async detectAvailableCompendiums(): Promise<string[]> {
    if (!game.packs) return [];

    const available: string[] = [];

    // Check for dnd5e.monsters (core SRD)
    if (game.packs.get('dnd5e.monsters')) {
      available.push('dnd5e.monsters');
    }

    // Check for D&D Modern Content or other actor compendiums
    for (const pack of game.packs.values()) {
      if (pack.documentName === 'Actor' && pack.collection !== 'dnd5e.monsters') {
        available.push(pack.collection);
      }
    }

    return available;
  }

  /**
   * Find template actor in compendiums with fallback logic
   */
  private static async findTemplateActor(
    templateName: string,
    compendiums: string[]
  ): Promise<any | null> {
    if (!game.packs) return null;

    for (const compendiumId of compendiums) {
      const pack = game.packs.get(compendiumId);
      if (!pack) continue;

      try {
        // Search for actor by name (case-insensitive)
        const indexEntry = pack.index.find(
          (entry: any) => entry.name.toLowerCase() === templateName.toLowerCase()
        );

        if (indexEntry) {
          const actor = await pack.getDocument(indexEntry._id);
          if (actor) {
            console.log(`Found template actor "${templateName}" in ${compendiumId}`);
            return actor;
          }
        }
      } catch (error) {
        console.warn(`Error searching ${compendiumId} for ${templateName}:`, error);
      }
    }

    return null;
  }

  /**
   * Load template actor for role with fallback logic
   */
  private static async loadTemplateForRole(
    role: string,
    compendiums: string[]
  ): Promise<any | null> {
    // Try primary template first
    const primaryTemplate = getTemplateActorName(role, true);
    let template = await this.findTemplateActor(primaryTemplate, compendiums);

    if (template) {
      return template;
    }

    // Try fallback template
    const fallbackTemplate = getTemplateActorName(role, false);
    if (fallbackTemplate !== primaryTemplate) {
      template = await this.findTemplateActor(fallbackTemplate, compendiums);
      if (template) {
        console.log(`Using fallback template "${fallbackTemplate}" for role "${role}"`);
        return template;
      }
    }

    // Last resort: try Commoner
    if (primaryTemplate !== 'Commoner' && fallbackTemplate !== 'Commoner') {
      template = await this.findTemplateActor('Commoner', compendiums);
      if (template) {
        console.warn(`Using Commoner template as last resort for role "${role}"`);
        return template;
      }
    }

    return null;
  }

  /**
   * Create actor from template with CR scaling
   */
  static async createActorFromTemplate(
    npc: NPC,
    personality: string,
    ideal: string,
    bond: string,
    folderId: string | null = null
  ): Promise<void> {
    try {
      // 1. Detect available compendiums
      const compendiums = await this.detectAvailableCompendiums();

      if (compendiums.length === 0) {
        ui.notifications?.warn('No actor compendiums found. Cannot create NPC from template.');
        return;
      }

      // 2. Load template actor for role
      const template = await this.loadTemplateForRole(npc.class, compendiums);

      if (!template) {
        ui.notifications?.error(
          `Could not find template actor for role "${npc.class}". Please ensure dnd5e.monsters compendium is available.`
        );
        return;
      }

      // 3. Convert template to plain object for modification
      const templateData = template.toObject();

      // 4. Scale template to target CR and NPC specifications
      const scaledData = scaleTemplateActorToCR(templateData, npc, npc.class);

      // 5. Add NPC-specific data
      scaledData.folder = folderId;
      addLanguagesToTemplate(scaledData, npc.languages);
      addCurrencyToTemplate(scaledData, npc.currency);

      // 6. Add personality traits
      const personalityHtml = personality ? `<li>${personality}</li>` : '';
      const idealHtml = ideal ? `<li>${ideal}</li>` : '';
      const bondHtml = bond ? `<li>${bond}</li>` : '';

      if (!scaledData.system.details) {
        scaledData.system.details = {};
      }
      scaledData.system.details.personality = personalityHtml;
      scaledData.system.details.ideal = idealHtml;
      scaledData.system.details.bond = bondHtml;

      // 7. Add role-appropriate equipment
      try {
        const crValue = parseCR(npc.challengeRating);
        const crStats = getCRStats(npc.challengeRating);
        const equipment = getEquipmentForClass(npc.class, crValue);

        // Load weapons
        if (equipment.weapons.length > 0) {
          const weaponItems = await this.loadEquipmentItems(equipment.weapons, crStats.attackBonus);
          if (weaponItems.length > 0) {
            scaledData.items = scaledData.items || [];
            scaledData.items.push(...weaponItems);
          }
        }

        // Load armor
        if (equipment.armor.length > 0) {
          const armorItems = await this.loadEquipmentItems(equipment.armor, 0);
          if (armorItems.length > 0) {
            scaledData.items = scaledData.items || [];
            scaledData.items.push(...armorItems);
          }
        }
      } catch (error) {
        console.error('Error adding equipment:', error);
      }

      // 8. Create the actor
      const actor = await Actor.create(scaledData);

      if (actor) {
        // Check if CR Calculator is available for validation
        const crCalcModule = game.modules?.get('fvtt-challenge-calculator');
        const crCalcAPI = crCalcModule?.active ? crCalcModule.api : null;

        if (crCalcAPI) {
          try {
            // Calculate actual CR using CR Calculator
            const result = await crCalcAPI.calculateCRForActor(actor, false);
            const targetCR = parseCR(npc.challengeRating);
            const crDifference = Math.abs(result.calculatedCR - targetCR);

            // If difference is significant (>1 CR), show comparison dialog
            if (crDifference > 1) {
              const choice = await CRComparisonDialog.show(
                targetCR,
                result.calculatedCR,
                result.defensiveCR,
                result.offensiveCR,
                npc.name
              );

              if (choice === 'calculated') {
                // Update actor with calculated CR
                await actor.update({
                  'system.details.cr': result.calculatedCR
                });
                ui.notifications?.info(
                  `Created ${npc.name} with calculated CR ${result.calculatedCR} (was ${targetCR})`
                );
              } else if (choice === 'target') {
                // Keep target CR
                ui.notifications?.info(
                  `Created ${npc.name} with target CR ${targetCR} (calculated CR was ${result.calculatedCR})`
                );
              } else {
                // User cancelled, keep target CR
                ui.notifications?.info(`Created NPC: ${npc.name} (CR ${npc.challengeRating})`);
              }
            } else if (crDifference > 0) {
              // Small difference, auto-update with notification
              await actor.update({
                'system.details.cr': result.calculatedCR
              });
              ui.notifications?.info(
                `Created ${npc.name}: CR adjusted ${targetCR} → ${result.calculatedCR}`
              );
            } else {
              // CRs match
              ui.notifications?.info(`Created NPC: ${npc.name} (CR ${npc.challengeRating})`);
            }
          } catch (error) {
            console.warn('Failed to validate CR with CR Calculator:', error);
            ui.notifications?.info(`Created NPC: ${npc.name} (CR ${npc.challengeRating})`);
          }
        } else {
          // CR Calculator not available
          ui.notifications?.info(`Created NPC: ${npc.name} (CR ${npc.challengeRating})`);
        }

        actor.sheet?.render(true);
      }
    } catch (error) {
      console.error("Dorman Lakely's NPC Gen | Error creating NPC:", error);
      ui.notifications?.error('Failed to create NPC');
    }
  }

  /**
   * DEPRECATED: Create a simple actor in world with personality traits
   * Kept for backward compatibility but no longer used
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
            cr: parseCR(npc.challengeRating),
            type: {
              value: npc.species.toLowerCase()
            },
            alignment: npc.alignment,
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
        // Add equipment to the actor
        try {
          const crValue = parseCR(npc.challengeRating);
          const crStats = getCRStats(npc.challengeRating);
          const equipment = getEquipmentForClass(npc.class, crValue);

          // Load and add weapons
          if (equipment.weapons.length > 0) {
            const weaponItems = await this.loadEquipmentItems(
              equipment.weapons,
              crStats.attackBonus
            );
            if (weaponItems.length > 0) {
              await actor.createEmbeddedDocuments('Item', weaponItems);
            }
          }

          // Load and add armor
          if (equipment.armor.length > 0) {
            const armorItems = await this.loadEquipmentItems(equipment.armor, 0);
            if (armorItems.length > 0) {
              await actor.createEmbeddedDocuments('Item', armorItems);
            }
          }
        } catch (error) {
          console.error("Dorman Lakely's NPC Gen | Error adding equipment:", error);
        }

        // Check if CR Calculator is available for validation
        const crCalcModule = game.modules?.get('fvtt-challenge-calculator');
        const crCalcAPI = crCalcModule?.active ? crCalcModule.api : null;

        if (crCalcAPI) {
          try {
            // Calculate actual CR using CR Calculator
            const result = await crCalcAPI.calculateCRForActor(actor, false);
            const targetCR = parseCR(npc.challengeRating);
            const crDifference = Math.abs(result.calculatedCR - targetCR);

            // If difference is significant (>1 CR), show comparison dialog
            if (crDifference > 1) {
              const choice = await CRComparisonDialog.show(
                targetCR,
                result.calculatedCR,
                result.defensiveCR,
                result.offensiveCR,
                npc.name
              );

              if (choice === 'calculated') {
                // Update actor with calculated CR
                await actor.update({
                  'system.details.cr': result.calculatedCR
                });
                ui.notifications?.info(
                  `Created ${npc.name} with calculated CR ${result.calculatedCR} (was ${targetCR})`
                );
              } else if (choice === 'target') {
                // Keep target CR
                ui.notifications?.info(
                  `Created ${npc.name} with target CR ${targetCR} (calculated CR was ${result.calculatedCR})`
                );
              } else {
                // User cancelled, keep target CR
                ui.notifications?.info(`Created NPC: ${npc.name} (CR ${npc.challengeRating})`);
              }
            } else if (crDifference > 0) {
              // Small difference, auto-update with notification
              await actor.update({
                'system.details.cr': result.calculatedCR
              });
              ui.notifications?.info(
                `Created ${npc.name}: CR adjusted ${targetCR} → ${result.calculatedCR}`
              );
            } else {
              // CRs match
              ui.notifications?.info(`Created NPC: ${npc.name} (CR ${npc.challengeRating})`);
            }
          } catch (error) {
            console.warn('Failed to validate CR with CR Calculator:', error);
            ui.notifications?.info(`Created NPC: ${npc.name} (CR ${npc.challengeRating})`);
          }
        } else {
          // CR Calculator not available
          ui.notifications?.info(`Created NPC: ${npc.name} (CR ${npc.challengeRating})`);
        }

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

  /**
   * Load items from the dnd5e.items compendium and configure attack bonuses
   */
  private static async loadEquipmentItems(
    itemNames: string[],
    attackBonus: number
  ): Promise<any[]> {
    if (!game.packs) {
      console.warn('Game packs not available');
      return [];
    }

    const pack = game.packs.get('dnd5e.items');
    if (!pack) {
      console.warn('dnd5e.items compendium not found');
      return [];
    }

    const items: any[] = [];

    for (const itemName of itemNames) {
      try {
        // Search for item in compendium index
        const indexEntry = pack.index.find((i: any) => i.name === itemName);
        if (!indexEntry) {
          console.warn(`Item "${itemName}" not found in dnd5e.items`);
          continue;
        }

        // Load the full item document
        const item = await pack.getDocument(indexEntry._id);
        if (!item) {
          console.warn(`Failed to load item "${itemName}"`);
          continue;
        }

        // Convert to plain object for modification
        const itemData = item.toObject();

        // Configure item as equipped
        if (itemData.system && 'equipped' in itemData.system) {
          itemData.system.equipped = true;
        }

        // Configure attack bonus for weapons
        if (itemData.type === 'weapon' && itemData.system) {
          // Set attack bonus override
          if ('attack' in itemData.system && itemData.system.attack) {
            itemData.system.attack.bonus = attackBonus.toString();
          }

          // Enable proficiency for the weapon
          if ('proficient' in itemData.system) {
            itemData.system.proficient = 1;
          }
        }

        items.push(itemData);
      } catch (error) {
        console.error(`Error loading item "${itemName}":`, error);
      }
    }

    return items;
  }
}
