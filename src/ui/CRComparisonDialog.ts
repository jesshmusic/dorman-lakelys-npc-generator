/**
 * Dialog for comparing target CR vs calculated CR
 * Allows user to choose which CR to use for the generated NPC
 */

const { ApplicationV2, HandlebarsApplicationMixin } = (foundry as any).applications.api;

interface CRComparisonData {
  targetCR: number;
  calculatedCR: number;
  defensiveCR: number;
  offensiveCR: number;
  actorName: string;
  hpDiff?: string;
  acDiff?: string;
  dprDiff?: string;
}

export class CRComparisonDialog extends HandlebarsApplicationMixin(ApplicationV2) {
  private readonly targetCR: number;
  private readonly calculatedCR: number;
  private readonly defensiveCR: number;
  private readonly offensiveCR: number;
  private readonly actorName: string;
  private resolvePromise: ((value: 'calculated' | 'target' | null) => void) | null = null;

  static DEFAULT_OPTIONS = {
    id: 'cr-comparison-dialog',
    classes: ['npcgen-cr-comparison'],
    tag: 'form',
    window: {
      contentClasses: ['standard-form'],
      title: 'CR Calculation Result',
      icon: 'fas fa-calculator',
      resizable: true
    },
    position: {
      width: 520,
      height: 'auto' as const
    },
    actions: {
      useCalculated: CRComparisonDialog.#onUseCalculated,
      keepTarget: CRComparisonDialog.#onKeepTarget,
      cancel: CRComparisonDialog.#onCancel
    }
  };

  static PARTS = {
    content: {
      template: 'modules/dorman-lakelys-npc-generator/templates/cr-comparison-dialog.hbs'
    }
  };

  constructor(
    targetCR: number,
    calculatedCR: number,
    defensiveCR: number,
    offensiveCR: number,
    actorName: string,
    options = {}
  ) {
    super(options);
    this.targetCR = targetCR;
    this.calculatedCR = calculatedCR;
    this.defensiveCR = defensiveCR;
    this.offensiveCR = offensiveCR;
    this.actorName = actorName;
  }

  /**
   * Static method to show dialog and wait for user choice
   */
  static async show(
    targetCR: number,
    calculatedCR: number,
    defensiveCR: number,
    offensiveCR: number,
    actorName: string
  ): Promise<'calculated' | 'target' | null> {
    return new Promise(resolve => {
      const dialog = new CRComparisonDialog(
        targetCR,
        calculatedCR,
        defensiveCR,
        offensiveCR,
        actorName
      );
      dialog.resolvePromise = resolve;
      dialog.render(true);
    });
  }

  async _prepareContext(_options: any): Promise<CRComparisonData> {
    const context = await super._prepareContext(_options);

    // Calculate difference descriptions
    const crDiff = Math.abs(this.calculatedCR - this.targetCR);
    const isHigher = this.calculatedCR > this.targetCR;
    const direction = isHigher ? 'higher' : 'lower';

    return {
      ...context,
      targetCR: this.targetCR,
      calculatedCR: this.calculatedCR,
      defensiveCR: this.defensiveCR,
      offensiveCR: this.offensiveCR,
      actorName: this.actorName,
      crDiff,
      direction,
      isHigher,
      buttons: [
        {
          type: 'button',
          action: 'useCalculated',
          icon: 'fas fa-calculator',
          label: game.i18n?.localize('NPCGEN.UseCalculatedCR') || 'Use Calculated CR',
          css: 'primary'
        },
        {
          type: 'button',
          action: 'keepTarget',
          icon: 'fas fa-target',
          label: game.i18n?.localize('NPCGEN.KeepTargetCR') || 'Keep Target CR'
        },
        {
          type: 'button',
          action: 'cancel',
          icon: 'fas fa-times',
          label: game.i18n?.localize('NPCGEN.Cancel') || 'Cancel'
        }
      ]
    };
  }

  static async #onUseCalculated(this: CRComparisonDialog, _event: Event, _target: HTMLElement) {
    if (this.resolvePromise) {
      this.resolvePromise('calculated');
    }
    this.close();
  }

  static async #onKeepTarget(this: CRComparisonDialog, _event: Event, _target: HTMLElement) {
    if (this.resolvePromise) {
      this.resolvePromise('target');
    }
    this.close();
  }

  static async #onCancel(this: CRComparisonDialog, _event: Event, _target: HTMLElement) {
    if (this.resolvePromise) {
      this.resolvePromise(null);
    }
    this.close();
  }

  _onClose(_options: any): void {
    super._onClose(_options);
    // If dialog closed without button press, resolve with null
    if (this.resolvePromise) {
      this.resolvePromise(null);
      this.resolvePromise = null;
    }
  }
}
