// Portrait generation confirmation dialog
import {
  AIService,
  AIGenerationRequest,
  AIGenerationResponse,
  OpenAIProvider
} from '../services/AIService.js';

const MODULE_ID = 'dorman-lakelys-npc-generator';

export interface PortraitGenerationResult {
  success: boolean;
  portraitPath?: string;
  cancelled?: boolean;
}

/**
 * Dialog to confirm portrait generation and select options
 */
export class PortraitConfirmationDialog {
  static readonly ART_STYLES = [
    { value: 'fantasy realistic', label: 'Fantasy Realistic' },
    { value: 'fantasy painting', label: 'Fantasy Painting' },
    { value: 'anime style', label: 'Anime Style' },
    { value: 'digital art', label: 'Digital Art' },
    { value: 'watercolor painting', label: 'Watercolor Painting' },
    { value: 'oil painting', label: 'Oil Painting' },
    { value: 'pencil sketch', label: 'Pencil Sketch' }
  ];

  static readonly MODELS = [
    { value: 'dall-e-3', label: 'DALL-E 3' },
    { value: 'gpt-image-1', label: 'GPT-4o (Latest)' },
    { value: 'dall-e-2', label: 'DALL-E 2 (Budget)' }
  ];

  static readonly SIZES_DALLE3 = [
    { value: '1024x1024', label: '1024×1024 (Square)' },
    { value: '1024x1792', label: '1024×1792 (Portrait)' },
    { value: '1792x1024', label: '1792×1024 (Landscape)' }
  ];

  static readonly SIZES_GPT4O = [
    { value: '1024x1024', label: '1024×1024 (Square)' },
    { value: '1024x1536', label: '1024×1536 (Portrait)' },
    { value: '1536x1024', label: '1536×1024 (Landscape)' }
  ];

  static readonly SIZES_DALLE2 = [
    { value: '1024x1024', label: '1024×1024' },
    { value: '512x512', label: '512×512' },
    { value: '256x256', label: '256×256' }
  ];

  static readonly QUALITY_DALLE3 = [
    { value: 'standard', label: 'Standard' },
    { value: 'hd', label: 'HD' }
  ];

  static readonly QUALITY_GPT4O = [
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'auto', label: 'Auto' }
  ];

  /**
   * Calculate cost based on model, size, and quality
   */
  static calculateCost(model: string, size: string, quality: string): number {
    if (model === 'dall-e-3') {
      if (size === '1024x1024') {
        return quality === 'hd' ? 0.08 : 0.04;
      } else {
        // 1024x1792 or 1792x1024
        return quality === 'hd' ? 0.12 : 0.08;
      }
    } else if (model === 'gpt-image-1') {
      // GPT-4o pricing (similar to DALL-E 3)
      if (size === '1024x1024') {
        return quality === 'high' ? 0.08 : 0.04;
      } else {
        // 1024x1536 or 1536x1024
        return quality === 'high' ? 0.12 : 0.08;
      }
    } else {
      // DALL-E 2
      if (size === '1024x1024') return 0.02;
      if (size === '512x512') return 0.018;
      if (size === '256x256') return 0.016;
    }
    return 0.04; // Default fallback
  }

  /**
   * Show the confirmation dialog and handle portrait generation.
   *
   * Foundry v14 rewrite: this dialog previously extended the legacy `Dialog`
   * class and used jQuery selectors (`html.find()`, `.off().on()`) plus mutable
   * `dialogRef.element` access — none of which works in v14 once the legacy
   * `Dialog` shim is removed. The rewrite uses `DialogV2.wait` with a static
   * form, attaches a single render-time listener via the `render` callback to
   * keep the model→size/quality dropdowns in sync, and handles generation /
   * error states inside the confirm button callback.
   */
  static async show(context: any): Promise<PortraitGenerationResult> {
    // Get current art style setting as default
    const defaultStyle =
      ((game.settings as any)?.get(MODULE_ID, 'portraitArtStyle') as string) || 'fantasy painting';

    // Generate initial prompt
    const apiKey = ((game.settings as any)?.get(MODULE_ID, 'openaiApiKey') as string) || '';
    const settingModel =
      ((game.settings as any)?.get(MODULE_ID, 'openaiModel') as string) || 'gpt-4o-mini';
    const provider = new OpenAIProvider(apiKey, settingModel);

    let currentModel = 'gpt-image-1';
    let currentSize = '1024x1024';
    let currentQuality = 'medium';
    let currentStyle = defaultStyle;

    // Build the initial prompt
    const buildPrompt = (style: string): string => {
      const contextWithOptions = { ...context, artStyle: style };
      const request: AIGenerationRequest = { type: 'portrait', context: contextWithOptions };
      return (provider as any).buildPrompt(request);
    };
    let currentPrompt = buildPrompt(currentStyle);

    const renderContent = (): string => {
        const cost = this.calculateCost(currentModel, currentSize, currentQuality);

        // Get size options based on model
        let sizeOptions;
        if (currentModel === 'dall-e-3') {
          sizeOptions = this.SIZES_DALLE3;
        } else if (currentModel === 'gpt-image-1') {
          sizeOptions = this.SIZES_GPT4O;
        } else {
          sizeOptions = this.SIZES_DALLE2;
        }

        // Get quality options based on model
        let qualityOptions;
        let qualityDisabled = false;
        if (currentModel === 'dall-e-3') {
          qualityOptions = this.QUALITY_DALLE3;
        } else if (currentModel === 'gpt-image-1') {
          qualityOptions = this.QUALITY_GPT4O;
        } else {
          // DALL-E 2 doesn't support quality
          qualityOptions = this.QUALITY_DALLE3;
          qualityDisabled = true;
        }

        // Ensure current size is valid for selected model
        if (!sizeOptions.find(s => s.value === currentSize)) {
          currentSize = sizeOptions[0].value;
        }

        // Ensure current quality is valid for selected model
        if (!qualityOptions.find(q => q.value === currentQuality)) {
          currentQuality = qualityOptions[0].value;
        }

        return `
          <style>
            .portrait-confirmation-dialog .form-group {
              margin-bottom: 18px;
            }
            .portrait-confirmation-dialog label {
              display: block;
              margin-bottom: 6px;
              font-weight: 600;
            }
            .portrait-confirmation-dialog select,
            .portrait-confirmation-dialog textarea {
              width: 100%;
              box-sizing: border-box;
            }
            .portrait-confirmation-dialog textarea {
              resize: vertical;
              font-family: 'Signika', sans-serif;
              font-size: 13px;
              padding: 8px;
            }
            .portrait-confirmation-dialog .form-hint {
              font-size: 11px;
              color: #666;
              margin-top: 4px;
              margin-bottom: 0;
            }
            .portrait-confirmation-dialog .dialog-info {
              font-size: 14px;
              font-weight: bold;
              color: #2196f3;
              margin-bottom: 8px;
            }
            .portrait-confirmation-dialog .dialog-note {
              font-size: 12px;
              color: #666;
              margin-bottom: 16px;
            }
            .portrait-confirmation-dialog .dialog-section {
              margin-bottom: 20px;
            }
          </style>
          <div class="portrait-confirmation-dialog">
            <div class="dialog-section">
              <p class="dialog-info">
                <i class="fas fa-dollar-sign"></i>
                <strong>Estimated Cost:</strong> <span class="dlc-portrait-cost">$${cost.toFixed(3)} USD</span>
              </p>
              <p class="dialog-note">
                The image will be automatically saved to your Data folder.
              </p>
            </div>

            <div class="form-group">
              <label for="portrait-model">Model:</label>
              <select id="portrait-model" name="model">
                ${this.MODELS.map(
                  m =>
                    `<option value="${m.value}" ${m.value === currentModel ? 'selected' : ''}>${m.label}</option>`
                ).join('')}
              </select>
            </div>

            <div class="form-group">
              <label for="portrait-size">Size:</label>
              <select id="portrait-size" name="size">
                ${sizeOptions.map(s => `<option value="${s.value}" ${s.value === currentSize ? 'selected' : ''}>${s.label}</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label for="portrait-quality">Quality:</label>
              <select id="portrait-quality" name="quality" ${qualityDisabled ? 'disabled' : ''}>
                ${qualityOptions.map((q: any) => `<option value="${q.value}" ${q.value === currentQuality ? 'selected' : ''}>${q.label}</option>`).join('')}
              </select>
              ${qualityDisabled ? '<p class="form-hint">Quality selection only available for DALL-E 3 and GPT-4o</p>' : ''}
            </div>

            <div class="form-group">
              <label for="portrait-style">Art Style:</label>
              <select id="portrait-style" name="style">
                ${this.ART_STYLES.map(s => `<option value="${s.value}" ${s.value === currentStyle ? 'selected' : ''}>${s.label}</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label for="portrait-prompt">Image Prompt:</label>
              <textarea id="portrait-prompt" name="prompt" rows="6">${currentPrompt}</textarea>
              <p class="form-hint">Edit the prompt to customize the generated image. Changes will be used for generation.</p>
            </div>
          </div>
        `;
      };

      // v14 DialogV2 + manual render-time wiring. We render the form once,
      // then attach native DOM listeners that update the cost label and
      // regenerate the prompt in-place when the user changes inputs. The
      // confirm button callback runs the generation and resolves the wait
      // promise; on error we surface a UI notification and resolve with
      // `{ success: false }` so the dialog closes (the previous comment
      // claimed the error path re-threw to keep the dialog open via
      // rejectClose, but the current code does not do that).
      try {
        const result = await (foundry as any).applications.api.DialogV2.wait({
          window: { title: 'DALL-E Portrait Generation' },
          position: { width: 600 },
          content: renderContent(),
          rejectClose: false,
          render: (_event: Event, dialog: any) => {
            const root: HTMLElement | null = dialog?.element ?? null;
            if (!root) return;
            const modelSel = root.querySelector('#portrait-model') as HTMLSelectElement | null;
            const sizeSel = root.querySelector('#portrait-size') as HTMLSelectElement | null;
            const qualitySel = root.querySelector('#portrait-quality') as HTMLSelectElement | null;
            const styleSel = root.querySelector('#portrait-style') as HTMLSelectElement | null;
            const promptArea = root.querySelector('#portrait-prompt') as HTMLTextAreaElement | null;
            const costEl = root.querySelector('.dlc-portrait-cost') as HTMLElement | null;

            const updateCost = () => {
              if (!costEl) return;
              const c = PortraitConfirmationDialog.calculateCost(
                currentModel,
                currentSize,
                currentQuality
              );
              costEl.textContent = `$${c.toFixed(3)} USD`;
            };

            // Helper: rebuild the size/quality <option> lists for the
            // currently-selected model. Different models support different
            // dimensions and quality tiers, so we have to repopulate (not just
            // re-set the .value of) these selects when the model changes.
            const populateOptions = (
              select: HTMLSelectElement | null,
              opts: ReadonlyArray<{ value: string; label: string }>,
              selected: string
            ) => {
              if (!select) return;
              select.innerHTML = opts
                .map(
                  o =>
                    `<option value="${o.value}"${o.value === selected ? ' selected' : ''}>${o.label}</option>`
                )
                .join('');
              select.value = selected;
            };

            const repopulateForModel = () => {
              // Pick size + quality option lists for the current model.
              let sizeOpts: ReadonlyArray<{ value: string; label: string }>;
              let qualityOpts: ReadonlyArray<{ value: string; label: string }>;
              let qualityDisabled = false;

              if (currentModel === 'dall-e-3') {
                sizeOpts = PortraitConfirmationDialog.SIZES_DALLE3;
                qualityOpts = PortraitConfirmationDialog.QUALITY_DALLE3;
              } else if (currentModel === 'gpt-image-1') {
                sizeOpts = PortraitConfirmationDialog.SIZES_GPT4O;
                qualityOpts = PortraitConfirmationDialog.QUALITY_GPT4O;
              } else {
                sizeOpts = PortraitConfirmationDialog.SIZES_DALLE2;
                qualityOpts = PortraitConfirmationDialog.QUALITY_DALLE3; // unused
                qualityDisabled = true;
              }

              // Make sure currentSize/currentQuality are still valid for the
              // new model; if not, snap to the first option.
              if (!sizeOpts.find(s => s.value === currentSize)) {
                currentSize = sizeOpts[0].value;
              }
              if (!qualityOpts.find(q => q.value === currentQuality)) {
                currentQuality = qualityOpts[0].value;
              }

              populateOptions(sizeSel, sizeOpts, currentSize);
              populateOptions(qualitySel, qualityOpts, currentQuality);
              if (qualitySel) qualitySel.disabled = qualityDisabled;
            };

            modelSel?.addEventListener('change', e => {
              currentModel = (e.target as HTMLSelectElement).value;
              // Set sensible defaults for the new model, then repopulate the
              // dependent select option lists in-place. The previous version
              // only updated the `.value` field, which left the user with the
              // wrong option list (and could leave the select with a value
              // that wasn't in its options).
              if (currentModel === 'dall-e-3') {
                currentSize = '1024x1024';
                currentQuality = 'standard';
              } else if (currentModel === 'gpt-image-1') {
                currentSize = '1024x1024';
                currentQuality = 'medium';
              } else {
                currentSize = '1024x1024';
                currentQuality = 'standard';
              }
              repopulateForModel();
              updateCost();
            });
            sizeSel?.addEventListener('change', e => {
              currentSize = (e.target as HTMLSelectElement).value;
              updateCost();
            });
            qualitySel?.addEventListener('change', e => {
              currentQuality = (e.target as HTMLSelectElement).value;
              updateCost();
            });
            styleSel?.addEventListener('change', e => {
              currentStyle = (e.target as HTMLSelectElement).value;
              currentPrompt = buildPrompt(currentStyle);
              if (promptArea) promptArea.value = currentPrompt;
            });
            promptArea?.addEventListener('input', e => {
              currentPrompt = (e.target as HTMLTextAreaElement).value;
            });
          },
          buttons: [
            {
              action: 'confirm',
              label: '<i class="fas fa-check"></i> Confirm',
              default: true,
              callback: async (
                _event: Event,
                _button: HTMLButtonElement,
                _dialog: any
              ): Promise<PortraitGenerationResult> => {
                const cost = PortraitConfirmationDialog.calculateCost(
                  currentModel,
                  currentSize,
                  currentQuality
                );
                ui.notifications?.info(
                  `Generating portrait... This will cost approximately $${cost.toFixed(3)} and may take 15-30 seconds.`,
                  { permanent: false }
                );

                const contextWithOptions = {
                  ...context,
                  artStyle: currentStyle,
                  dalleModel: currentModel,
                  dalleSize: currentSize,
                  dalleQuality: currentQuality,
                  customPrompt: currentPrompt
                };

                const request: AIGenerationRequest = {
                  type: 'portrait',
                  context: contextWithOptions
                };

                const response: AIGenerationResponse = await AIService.generate(request);

                if (!response.success) {
                  ui.notifications?.error(
                    response.error || 'Failed to generate portrait. Please try again.',
                    { permanent: true }
                  );
                  return { success: false };
                }

                return { success: true, portraitPath: response.content as string };
              }
            },
            {
              action: 'cancel',
              label: '<i class="fas fa-times"></i> Cancel',
              callback: async (): Promise<PortraitGenerationResult> => ({
                success: false,
                cancelled: true
              })
            }
          ]
        });

        // DialogV2.wait resolves with the callback's return value, or with the
        // dialog instance itself if it was dismissed (rejectClose: false).
        if (result && typeof result === 'object' && 'success' in result) {
          return result as PortraitGenerationResult;
        }
        return { success: false, cancelled: true };
      } catch (error: any) {
        ui.notifications?.error(
          error?.message || 'An unexpected error occurred. Please try again.',
          { permanent: true }
        );
        return { success: false };
      }
  }
}
