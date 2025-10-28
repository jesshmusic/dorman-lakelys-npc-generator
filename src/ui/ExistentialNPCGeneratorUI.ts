// UI components for the NPC Generator
import { NPCGenerator, NPC } from '../generator/ExistentialNPCGenerator.js';
import { parseCR, crToLevel } from '../utils/crCalculations.js';
import { getEquipmentForClass } from '../utils/equipmentData.js';
import { CLASS_FEATURES, SPELLCASTING_CLASSES } from '../utils/classData.js';
import { getSpellsForClass } from '../utils/spellData.js';
import { parseActorData, averageActors, ParsedActorData, scaleActorStats } from '../utils/actorParsing.js';
import { AIService, AIGenerationRequest } from '../services/AIService.js';

const MODULE_ID = 'dorman-lakelys-npc-generator';

// Foundry V2 Application Dialog
class NPCGeneratorDialog extends foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.api.ApplicationV2
) {
  // Store dropped actors and species
  private droppedActors: any[] = [];
  private parsedActorData: ParsedActorData | null = null;
  private droppedSpecies: any | null = null;

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
      removeActor: NPCGeneratorDialog.onRemoveActor
    },
    dragDrop: [
      { dragSelector: null, dropSelector: '[data-drop="actor"]' },
      { dragSelector: null, dropSelector: '[data-drop="species"]' }
    ]
  };

  static PARTS = {
    form: {
      template: 'modules/dorman-lakelys-npc-generator/templates/npc-form.html'
    }
  };

  async _prepareContext(_options: any): Promise<any> {
    // Get all actor compendiums available to the user (exclude locked/read-only)
    const compendiums = game.packs
      ? Array.from(game.packs.values())
          .filter((pack: any) => pack.documentName === 'Actor' && !pack.locked)
          .map((pack: any) => ({
            id: pack.collection,
            title: pack.title
          }))
      : [];

    // Get all actor folders
    const folders = Array.from(game.folders?.values() || [])
      .filter((folder: any) => folder.type === 'Actor')
      .map((folder: any) => ({
        id: folder.id,
        name: folder.name
      }));

    // Check if AI is enabled
    const aiEnabled = game.settings.get(MODULE_ID, 'enableAI') as boolean;

    return {
      species: NPCGenerator.SPECIES,
      alignments: NPCGenerator.ALIGNMENTS,
      challengeRatings: NPCGenerator.CHALLENGE_RATINGS,
      compendiums,
      folders,
      aiEnabled
    };
  }

  _onRender(context: any, options: any): void {
    super._onRender(context, options);

    // Set up destination select change handler
    const destinationSelect = this.element.querySelector('#npc-destination') as HTMLSelectElement;
    const newCompendiumGroup = this.element.querySelector(
      '#new-compendium-name-group'
    ) as HTMLElement;
    const newCompendiumInput = this.element.querySelector(
      '#new-compendium-name'
    ) as HTMLInputElement;
    const folderSelectGroup = this.element.querySelector('#folder-select-group') as HTMLElement;

    if (destinationSelect && newCompendiumGroup && folderSelectGroup) {
      destinationSelect.addEventListener('change', () => {
        if (destinationSelect.value === 'new-compendium') {
          newCompendiumGroup.style.display = 'block';
          newCompendiumInput.required = true;
          folderSelectGroup.style.display = 'none';
        } else if (destinationSelect.value === 'world') {
          newCompendiumGroup.style.display = 'none';
          newCompendiumInput.required = false;
          folderSelectGroup.style.display = 'block';
        } else {
          // Compendium destination
          newCompendiumGroup.style.display = 'none';
          newCompendiumInput.required = false;
          folderSelectGroup.style.display = 'none';
        }
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

    // Set up drag-drop event listeners for actor drop zone
    const actorDropZone = this.element.querySelector('[data-drop="actor"]');
    if (actorDropZone) {
      actorDropZone.addEventListener('drop', this._onDrop.bind(this));
      actorDropZone.addEventListener('dragover', this._onDragOver.bind(this));
      actorDropZone.addEventListener('dragleave', this._onDragLeave.bind(this));
    }

    // Set up drag-drop event listeners for species drop zone
    const speciesDropZone = this.element.querySelector('[data-drop="species"]');
    if (speciesDropZone) {
      speciesDropZone.addEventListener('drop', this._onDrop.bind(this));
      speciesDropZone.addEventListener('dragover', this._onDragOver.bind(this));
      speciesDropZone.addEventListener('dragleave', this._onDragLeave.bind(this));
    }

    // Set up AI generation buttons
    const aiButtons = this.element.querySelectorAll('[data-ai-action]');
    aiButtons.forEach((button: Element) => {
      (button as HTMLElement).onclick = this._onAIGenerate.bind(this);
    });

    // Set up CR change listener
    const crSelect = this.element.querySelector('#npc-cr') as HTMLSelectElement;
    if (crSelect) {
      crSelect.addEventListener('change', this._updateCRChangeIndicator.bind(this));
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
   * Handle actor and species drop
   */
  async _onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();

    const dropZone = event.currentTarget as HTMLElement;
    dropZone.classList.remove('drag-over');

    const dropType = dropZone.getAttribute('data-drop');

    // Get dropped data
    const data = TextEditor.getDragEventData(event);

    if (!data) return;

    if (dropType === 'actor') {
      // Validate it's an actor
      if (data.type !== 'Actor') {
        ui.notifications?.warn('Please drop an Actor document');
        return;
      }

      // Get the actor document
      let actor: any;
      if (data.uuid) {
        actor = await fromUuid(data.uuid);
      }

      if (!actor) {
        ui.notifications?.warn('Could not load actor');
        return;
      }

      // Only allow 1 actor - replace if already exists
      this.droppedActors = [actor];

      // Parse the single actor
      this.parsedActorData = parseActorData(actor);

      // Update UI
      this._updateDroppedActorsDisplay();
      this._populateFormFromActorData();

      ui.notifications?.info(`Using ${actor.name} as template`);
    } else if (dropType === 'species') {
      // Validate it's an item
      if (data.type !== 'Item') {
        ui.notifications?.warn('Please drop an Item document');
        return;
      }

      // Get the item document
      let item: any;
      if (data.uuid) {
        item = await fromUuid(data.uuid);
      }

      if (!item) {
        ui.notifications?.warn('Could not load item');
        return;
      }

      // Check if it's a race/species item
      if (item.type !== 'race') {
        ui.notifications?.warn('Please drop a Species/Race item');
        return;
      }

      this.droppedSpecies = item;
      this._updateDroppedSpeciesDisplay();
      this._hideActorTypeDropdown();

      ui.notifications?.info(`Using ${item.name} species`);
    }
  }

  /**
   * Update dropped species display
   */
  _updateDroppedSpeciesDisplay(): void {
    const dropZone = this.element.querySelector('[data-drop="species"]');
    if (!dropZone) return;

    const content = dropZone.querySelector('.drop-zone-content') as HTMLElement;
    const display = dropZone.querySelector('.dropped-species') as HTMLElement;

    if (this.droppedSpecies) {
      content.style.display = 'none';
      display.style.display = 'flex';
      display.innerHTML = `
        <div class="dropped-actor">
          <img src="${this.droppedSpecies.img || 'icons/svg/mystery-man.svg'}" alt="${this.droppedSpecies.name}" />
          <div class="dropped-actor-info">
            <span class="dropped-actor-name">${this.droppedSpecies.name}</span>
            <span class="dropped-actor-cr">${this.droppedSpecies.system.type?.value || 'Unknown'}</span>
          </div>
          <button type="button" class="dropped-actor-remove" data-action="removeSpecies" title="Remove Species">
            <i class="fas fa-times"></i>
          </button>
        </div>
      `;

      // Add remove button listener
      const removeBtn = display.querySelector('[data-action="removeSpecies"]');
      removeBtn?.addEventListener('click', () => this._removeSpecies());
    } else {
      content.style.display = 'block';
      display.style.display = 'none';
      display.innerHTML = '';
    }
  }

  /**
   * Remove species
   */
  _removeSpecies(): void {
    this.droppedSpecies = null;
    this._updateDroppedSpeciesDisplay();
    this._showActorTypeDropdown();
    ui.notifications?.info('Species removed');
  }

  /**
   * Hide actor type dropdown when species is dropped
   */
  _hideActorTypeDropdown(): void {
    const typeGroup = this.element.querySelector('#actor-type-group') as HTMLElement;
    if (typeGroup) {
      typeGroup.style.display = 'none';
    }
  }

  /**
   * Show actor type dropdown when species is removed
   */
  _showActorTypeDropdown(): void {
    const typeGroup = this.element.querySelector('#actor-type-group') as HTMLElement;
    if (typeGroup) {
      typeGroup.style.display = 'block';
    }
  }

  /**
   * Update CR change indicator based on original and new CR
   */
  _updateCRChangeIndicator(): void {
    if (!this.parsedActorData) {
      // No template actor, hide indicator
      const indicator = this.element.querySelector('#cr-change-indicator') as HTMLElement;
      if (indicator) {
        indicator.style.display = 'none';
      }
      return;
    }

    const crSelect = this.element.querySelector('#npc-cr') as HTMLSelectElement;
    if (!crSelect) return;

    const originalCR = parseCR(this.parsedActorData.challengeRating);
    const newCR = parseCR(crSelect.value);
    const crDifference = newCR - originalCR;

    const indicator = this.element.querySelector('#cr-change-indicator') as HTMLElement;
    if (!indicator) return;

    if (Math.abs(crDifference) < 0.01) {
      // No change
      indicator.style.display = 'none';
    } else {
      indicator.style.display = 'inline-block';
      indicator.className = 'cr-change-indicator';

      if (crDifference > 0) {
        indicator.classList.add('positive');
        indicator.textContent = `+${crDifference.toFixed(crDifference < 1 ? 2 : 0)}`;
      } else {
        indicator.classList.add('negative');
        indicator.textContent = crDifference.toFixed(crDifference > -1 ? 2 : 0);
      }
    }
  }

  /**
   * Handle drag over event
   */
  _onDragOver(event: DragEvent): void {
    event.preventDefault();
    const dropZone = event.currentTarget as HTMLElement;
    dropZone?.classList.add('drag-over');
  }

  /**
   * Handle drag leave event
   */
  _onDragLeave(event: DragEvent): void {
    const dropZone = this.element.querySelector('.drop-zone');
    dropZone?.classList.remove('drag-over');
  }

  /**
   * Update the displayed dropped actors
   */
  _updateDroppedActorsDisplay(): void {
    const dropZoneContent = this.element.querySelector('.drop-zone-content') as HTMLElement;
    const droppedActorsDiv = this.element.querySelector('.dropped-actors') as HTMLElement;

    if (!dropZoneContent || !droppedActorsDiv) return;

    // Hide initial content, show actor list
    if (this.droppedActors.length > 0) {
      dropZoneContent.style.display = 'none';
      droppedActorsDiv.style.display = 'flex';

      // Clear existing content
      droppedActorsDiv.innerHTML = '';

      // Add each actor
      this.droppedActors.forEach((actor, index) => {
        const actorDiv = document.createElement('div');
        actorDiv.className = 'dropped-actor';
        actorDiv.innerHTML = `
          <img src="${actor.img || 'icons/svg/mystery-man.svg'}" alt="${actor.name}" />
          <div class="dropped-actor-info">
            <div class="dropped-actor-name">${actor.name}</div>
            <div class="dropped-actor-cr">CR ${actor.system?.details?.cr || '?'}</div>
          </div>
          <button type="button" class="dropped-actor-remove" data-action="removeActor" data-index="${index}" title="Remove">
            <i class="fas fa-times"></i>
          </button>
        `;
        droppedActorsDiv.appendChild(actorDiv);
      });
    } else {
      dropZoneContent.style.display = 'block';
      droppedActorsDiv.style.display = 'none';
    }
  }

  /**
   * Populate form fields from parsed actor data (hybrid approach)
   */
  _populateFormFromActorData(): void {
    if (!this.parsedActorData) return;

    const data = this.parsedActorData;

    // Auto-fill: CR and alignment
    const crSelect = this.element.querySelector('#npc-cr') as HTMLSelectElement;
    const alignmentSelect = this.element.querySelector('#npc-alignment') as HTMLSelectElement;
    const actorTypeSelect = this.element.querySelector('#npc-actor-type') as HTMLSelectElement;

    if (crSelect) crSelect.value = data.challengeRating;
    if (alignmentSelect) alignmentSelect.value = data.alignment;

    // Set actor type dropdown to template actor's type (only if no species is dropped)
    if (actorTypeSelect && !this.droppedSpecies) {
      // Get the actor's type from the dropped actor
      const actorType = this.droppedActors[0]?.system?.details?.type?.value;
      if (actorType) {
        actorTypeSelect.value = actorType.toLowerCase();
      }
    }

    // Auto-fill: Portrait and token
    const portraitInput = this.element.querySelector('#npc-portrait') as HTMLInputElement;
    const tokenInput = this.element.querySelector('#npc-token') as HTMLInputElement;

    if (portraitInput) {
      portraitInput.value = data.portrait;
      this._updateImagePreview('portrait');
    }
    if (tokenInput) {
      tokenInput.value = data.token;
      this._updateImagePreview('token');
    }

    // Update CR change indicator
    this._updateCRChangeIndicator();

    // Leave blank: name, description (for AI generation or manual entry)
    // These fields remain empty for user input
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
    const nameInput = this.element.querySelector('#npc-name') as HTMLInputElement;
    const speciesInput = this.element.querySelector('#npc-species') as HTMLInputElement;
    const alignmentSelect = this.element.querySelector('#npc-alignment') as HTMLSelectElement;
    const crSelect = this.element.querySelector('#npc-cr') as HTMLSelectElement;
    const descriptionTextarea = this.element.querySelector(
      '#npc-description'
    ) as HTMLTextAreaElement;

    return {
      name: nameInput?.value,
      species: speciesInput?.value,
      alignment: alignmentSelect?.value,
      challengeRating: crSelect?.value,
      description: descriptionTextarea?.value,
      templateActorName: this.droppedActors?.[0]?.name,
      templateActorDescription: this.parsedActorData?.description
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
      const descriptionTextarea = this.element.querySelector(
        '#npc-description'
      ) as HTMLTextAreaElement;
      if (descriptionTextarea) {
        descriptionTextarea.value = biography;
        ui.notifications?.info('Biography generated successfully');
      }
    }
  }

  /**
   * Remove an actor from the dropped actors list
   */
  static async onRemoveActor(event: Event, target: HTMLElement) {
    // Clear the single actor
    // @ts-expect-error - 'this' context is the dialog instance
    this.droppedActors = [];
    // @ts-expect-error - 'this' context is the dialog instance
    this.parsedActorData = null;

    // Update UI
    // @ts-expect-error - 'this' context is the dialog instance
    this._updateDroppedActorsDisplay();
    // @ts-expect-error - 'this' context is the dialog instance
    this._populateFormFromActorData();
  }

  static async onCreateNPC(event: Event, target: HTMLElement) {
    const form = target.closest('form');
    if (!form) return;

    // @ts-expect-error - 'this' context is the dialog instance
    if (!this.droppedActors || this.droppedActors.length === 0) {
      ui.notifications?.warn('Please drop a template actor first');
      return;
    }

    const formData = new FormData(form);
    const inputData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      species: formData.get('species') as string,
      alignment: formData.get('alignment') as string,
      challengeRating: formData.get('challengeRating') as string,
      // @ts-expect-error - 'this' context is the dialog instance
      class: this.parsedActorData?.class || 'Fighter',
      portrait: formData.get('portrait') as string,
      token: formData.get('token') as string
    };

    const destination = formData.get('destination') as string;
    const newCompendiumName = formData.get('newCompendiumName') as string;
    const folderId = formData.get('folder') as string;

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

    // @ts-expect-error - 'this' context is the dialog instance
    const templateActor = this.droppedActors?.[0];
    // @ts-expect-error - 'this' context is the dialog instance
    const parsedTemplateData = this.parsedActorData;

    // Handle different destinations
    if (destination === 'world') {
      await NPCGeneratorUI.createActor(npc, folderId || null, templateActor, parsedTemplateData);
    } else if (destination === 'new-compendium') {
      await NPCGeneratorUI.createActorInNewCompendium(npc, newCompendiumName, templateActor, parsedTemplateData);
    } else if (destination.startsWith('compendium:')) {
      const compendiumId = destination.replace('compendium:', '');
      await NPCGeneratorUI.createActorInCompendium(npc, compendiumId, templateActor, parsedTemplateData);
    }

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

  static async createActor(
    npc: NPC,
    folderId: string | null = null,
    templateActor?: any,
    parsedTemplateData?: ParsedActorData
  ): Promise<void> {
    try {
      // If we have a template actor, scale its stats and use its items
      let scaledStats = null;
      if (parsedTemplateData) {
        scaledStats = scaleActorStats(parsedTemplateData, npc.challengeRating);
      }

      // Use scaled abilities if available, otherwise use generated ones
      const abilities = scaledStats ? scaledStats.abilities : npc.abilities;
      const hp = scaledStats ? scaledStats.hp : npc.hp;
      const ac = scaledStats ? scaledStats.ac : npc.ac;

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

      const actorData: any = {
        name: npc.name,
        type: 'npc',
        folder: folderId,
        img: npc.portrait || 'icons/svg/mystery-man.svg',
        system: {
          abilities: {
            str: { value: abilities.str, proficient: saves.str.proficient },
            dex: { value: abilities.dex, proficient: saves.dex.proficient },
            con: { value: abilities.con, proficient: saves.con.proficient },
            int: { value: abilities.int, proficient: saves.int.proficient },
            wis: { value: abilities.wis, proficient: saves.wis.proficient },
            cha: { value: abilities.cha, proficient: saves.cha.proficient }
          },
          attributes: {
            hp: {
              value: hp,
              max: hp
            },
            ac: {
              calc: 'default' // Use equipped armor
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
              value: this.formatBiography(npc, parsedTemplateData)
            }
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
        // If we have a template actor, use its items (scaled if CR changed)
        if (parsedTemplateData && parsedTemplateData.items && parsedTemplateData.items.length > 0) {
          // Use scaled items if available, otherwise use original items
          const itemsToUse = scaledStats && scaledStats.items ? scaledStats.items : parsedTemplateData.items;

          const itemsData = itemsToUse.map((item: any) => {
            const obj = item.toObject ? item.toObject() : item;
            // Mark equipment as equipped
            if (obj.system && 'equipped' in obj.system) {
              obj.system.equipped = true;
            }
            return obj;
          });
          await actor.createEmbeddedDocuments('Item', itemsData);
        } else {
          // Fallback to generated equipment/features if no template
          await this.addEquipment(actor, npc);
          await this.addFeatures(actor, npc);
          await this.addClassFeatures(actor, npc);
          await this.addSpells(actor, npc);
        }

        ui.notifications?.info(`Created NPC: ${npc.name} (CR ${npc.challengeRating})`);

        // Open the actor sheet
        actor.sheet?.render(true);
      }
    } catch (error) {
      console.error("Dorman Lakely's NPC Gen | Error creating NPC:", error);
      ui.notifications?.error('Failed to create NPC');
    }
  }

  static async createActorInNewCompendium(
    npc: NPC,
    compendiumName: string,
    templateActor?: any,
    parsedTemplateData?: ParsedActorData
  ): Promise<void> {
    try {
      // Create a new compendium
      const compendium = await CompendiumCollection.createCompendium({
        label: compendiumName,
        type: 'Actor',
        name: compendiumName.toLowerCase().replace(/\s+/g, '-')
      } as any);

      ui.notifications?.info(`Created compendium: ${compendiumName}`);

      // Create the actor in the new compendium
      await this.createActorInCompendium(npc, compendium.collection, templateActor, parsedTemplateData);
    } catch (error) {
      console.error("Dorman Lakely's NPC Gen | Error creating compendium:", error);
      ui.notifications?.error('Failed to create compendium');
    }
  }

  static async createActorInCompendium(
    npc: NPC,
    compendiumId: string,
    templateActor?: any,
    parsedTemplateData?: ParsedActorData
  ): Promise<void> {
    try {
      if (!game.packs) {
        ui.notifications?.error('Game packs not available');
        return;
      }
      const pack = game.packs.get(compendiumId);
      if (!pack) {
        ui.notifications?.error(`Compendium ${compendiumId} not found`);
        return;
      }

      // Create the actor in the world first (with all items)
      // This uses the existing working code
      const actor = await this.createActorWithItems(npc, null, templateActor, parsedTemplateData);

      if (!actor) {
        ui.notifications?.error('Failed to create NPC');
        return;
      }

      // Import the completed actor into the compendium
      const compendiumActor = await pack.importDocument(actor);

      if (compendiumActor) {
        ui.notifications?.info(
          `Created NPC: ${npc.name} (CR ${npc.challengeRating}) in ${pack.title}`
        );

        // Delete the temporary world actor
        await actor.delete();

        // Import back to world and open sheet for viewing/editing
        const worldActor = await game.actors?.importFromCompendium(pack as any, compendiumActor.id);
        if (worldActor) {
          worldActor.sheet?.render(true);
        }
      }
    } catch (error) {
      console.error("Dorman Lakely's NPC Gen | Error creating NPC in compendium:", error);
      ui.notifications?.error('Failed to create NPC in compendium');
    }
  }

  private static async createActorWithItems(
    npc: NPC,
    folderId: string | null = null,
    templateActor?: any,
    parsedTemplateData?: ParsedActorData
  ): Promise<any> {
    try {
      // If we have a template actor, scale its stats and use its items
      let scaledStats = null;
      if (parsedTemplateData) {
        scaledStats = scaleActorStats(parsedTemplateData, npc.challengeRating);
      }

      // Use scaled abilities if available, otherwise use generated ones
      const abilities = scaledStats ? scaledStats.abilities : npc.abilities;
      const hp = scaledStats ? scaledStats.hp : npc.hp;
      const ac = scaledStats ? scaledStats.ac : npc.ac;

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

      const actorData: any = {
        name: npc.name,
        type: 'npc',
        folder: folderId,
        img: npc.portrait || 'icons/svg/mystery-man.svg',
        system: {
          abilities: {
            str: { value: abilities.str, proficient: saves.str.proficient },
            dex: { value: abilities.dex, proficient: saves.dex.proficient },
            con: { value: abilities.con, proficient: saves.con.proficient },
            int: { value: abilities.int, proficient: saves.int.proficient },
            wis: { value: abilities.wis, proficient: saves.wis.proficient },
            cha: { value: abilities.cha, proficient: saves.cha.proficient }
          },
          attributes: {
            hp: {
              value: hp,
              max: hp
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
              value: this.formatBiography(npc, parsedTemplateData)
            }
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
        // If we have a template actor, use its items (scaled if CR changed)
        if (parsedTemplateData && parsedTemplateData.items && parsedTemplateData.items.length > 0) {
          // Use scaled items if available, otherwise use original items
          const itemsToUse = scaledStats && scaledStats.items ? scaledStats.items : parsedTemplateData.items;

          const itemsData = itemsToUse.map((item: any) => {
            const obj = item.toObject ? item.toObject() : item;
            // Mark equipment as equipped
            if (obj.system && 'equipped' in obj.system) {
              obj.system.equipped = true;
            }
            return obj;
          });
          await actor.createEmbeddedDocuments('Item', itemsData);
        } else {
          // Fallback to generated equipment/features if no template
          await this.addEquipment(actor, npc);
          await this.addFeatures(actor, npc);
          await this.addClassFeatures(actor, npc);
          await this.addSpells(actor, npc);
        }
      }

      return actor;
    } catch (error) {
      console.error("Dorman Lakely's NPC Gen | Error creating actor with items:", error);
      return null;
    }
  }

  private static async addEquipment(actor: any, npc: NPC): Promise<void> {
    const cr = parseCR(npc.challengeRating);
    const equipmentPool = getEquipmentForClass(npc.class, cr);
    const allEquipment = [...equipmentPool.weapons, ...equipmentPool.armor];

    if (allEquipment.length === 0) return;

    try {
      if (!game.packs) return;
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
      console.warn("Dorman Lakely's NPC Gen | Could not add equipment:", error);
    }
  }

  private static async addFeatures(actor: any, npc: NPC): Promise<void> {
    const cr = parseCR(npc.challengeRating);

    // Common monster features by CR range
    const featureMap: Record<string, string[]> = {
      low: ['Keen Senses', 'Pack Tactics'],
      medium: ['Multiattack', 'Keen Senses', 'Magic Resistance'],
      high: ['Legendary Resistance (3/Day)', 'Magic Resistance', 'Multiattack']
    };

    let pool: string[];
    if (cr < 3) pool = featureMap.low;
    else if (cr < 10) pool = featureMap.medium;
    else pool = featureMap.high;

    try {
      if (!game.packs) return;
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
        await actor.createEmbeddedDocuments(
          'Item',
          features.map((f: any) => f.toObject())
        );
      }
    } catch (error) {
      console.warn("Dorman Lakely's NPC Gen | Could not add features:", error);
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
      if (!game.packs) {
        console.warn("Dorman Lakely's NPC Gen | Game packs not available");
        return;
      }
      const pack = game.packs.get('dnd5e.classfeatures');
      if (!pack) {
        console.warn("Dorman Lakely's NPC Gen | Class features pack not found");
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
        await actor.createEmbeddedDocuments(
          'Item',
          features.map((f: any) => f.toObject())
        );
      }
    } catch (error) {
      console.warn("Dorman Lakely's NPC Gen | Could not add class features:", error);
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
      if (!game.packs) {
        console.warn("Dorman Lakely's NPC Gen | Game packs not available");
        return;
      }
      const pack = game.packs.get('dnd5e.spells');
      if (!pack) {
        console.warn("Dorman Lakely's NPC Gen | Spells pack not found");
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
        await actor.createEmbeddedDocuments(
          'Item',
          spells.map((s: any) => s.toObject())
        );
      }
    } catch (error) {
      console.warn("Dorman Lakely's NPC Gen | Could not add spells:", error);
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

  private static formatBiography(npc: NPC, parsedTemplateData?: ParsedActorData): string {
    // Start with just the description (no stats)
    let biography = npc.description;

    // Append original template biography if it exists
    if (parsedTemplateData?.originalBiographyHtml) {
      biography += `
            <hr>
            ${parsedTemplateData.originalBiographyHtml}
        `;
    }

    return biography;
  }
}

/**
 * Name Selection Dialog using ApplicationV2
 */
class NameSelectionDialog extends foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.api.ApplicationV2
) {
  private names: string[];
  private cost?: number;
  private callback: (name: string) => void;

  constructor(names: string[], cost: number | undefined, callback: (name: string) => void) {
    super({});
    this.names = names;
    this.cost = cost;
    this.callback = callback;
  }

  static DEFAULT_OPTIONS = {
    id: 'name-selection-dialog',
    classes: ['dnd5e2', 'dialog', 'name-selection'],
    tag: 'div',
    window: {
      title: 'Select Name',
      icon: 'fas fa-user',
      resizable: false
    },
    position: {
      width: 400,
      height: 'auto' as const
    },
    actions: {
      selectName: NameSelectionDialog.onSelectName
    }
  };

  static PARTS = {
    form: {
      template: 'modules/dorman-lakelys-npc-generator/templates/name-selection.html'
    }
  };

  async _prepareContext(_options: any): Promise<any> {
    return {
      names: this.names,
      cost: this.cost ? this.cost.toFixed(6) : null
    };
  }

  static async onSelectName(event: Event, target: HTMLElement) {
    const name = target.dataset.name;
    if (name) {
      // @ts-expect-error - 'this' context is the dialog instance
      this.callback(name);
    }
  }
}

/**
 * Biography Preview Dialog using ApplicationV2
 */
class BiographyPreviewDialog extends foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.api.ApplicationV2
) {
  private biography: string;
  private cost?: number;
  private callback: (biography: string) => void;

  constructor(biography: string, cost: number | undefined, callback: (biography: string) => void) {
    super({});
    this.biography = biography;
    this.cost = cost;
    this.callback = callback;
  }

  static DEFAULT_OPTIONS = {
    id: 'biography-preview-dialog',
    classes: ['dnd5e2', 'dialog', 'biography-preview'],
    tag: 'div',
    window: {
      title: 'Biography Preview',
      icon: 'fas fa-book',
      resizable: false
    },
    position: {
      width: 600,
      height: 'auto' as const
    },
    actions: {
      accept: BiographyPreviewDialog.onAccept,
      cancel: BiographyPreviewDialog.onCancel
    }
  };

  static PARTS = {
    form: {
      template: 'modules/dorman-lakelys-npc-generator/templates/biography-preview.html'
    }
  };

  async _prepareContext(_options: any): Promise<any> {
    return {
      biography: this.biography,
      cost: this.cost ? this.cost.toFixed(6) : null
    };
  }

  static async onAccept(_event: Event, _target: HTMLElement) {
    // @ts-expect-error - 'this' context is the dialog instance
    this.callback(this.biography);
  }

  static async onCancel(_event: Event, _target: HTMLElement) {
    // @ts-expect-error - 'this' context is the dialog instance
    this.close();
  }
}

