// Portrait generation confirmation dialog
import { AIService, AIGenerationRequest, AIGenerationResponse } from '../services/AIService.js';

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
   * Show the confirmation dialog and handle portrait generation
   */
  static async show(context: any): Promise<PortraitGenerationResult> {
    // Get current art style setting as default
    const defaultStyle =
      ((game.settings as any)?.get(MODULE_ID, 'portraitArtStyle') as string) || 'fantasy painting';

    return new Promise(resolve => {
      let dialogRef: Dialog;
      let isGenerating = false;
      let currentModel = 'gpt-image-1';
      let currentSize = '1024x1024';
      let currentQuality = 'medium';

      const renderContent = (errorMsg?: string): string => {
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
            .portrait-confirmation-dialog select {
              width: 100%;
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
                <strong>Estimated Cost:</strong> $${cost.toFixed(3)} USD
              </p>
              <p class="dialog-note">
                The image will be automatically saved to your Data folder.
              </p>
            </div>

            ${
              errorMsg
                ? `
              <div class="dialog-error" style="
                background: #ffebee;
                border-left: 4px solid #f44336;
                padding: 12px;
                margin-bottom: 16px;
                color: #c62828;
              ">
                <i class="fas fa-exclamation-triangle"></i>
                <strong>Error:</strong> ${errorMsg}
              </div>
            `
                : ''
            }

            ${
              isGenerating
                ? `
              <div class="dialog-loading" style="
                background: #e3f2fd;
                border-left: 4px solid #2196f3;
                padding: 16px;
                margin-bottom: 16px;
                text-align: center;
              ">
                <i class="fas fa-spinner fa-spin" style="font-size: 20px; color: #2196f3;"></i>
                <p style="margin: 10px 0 0 0; font-weight: bold; color: #1565c0;">
                  Generating portrait... This may take 15-30 seconds.
                </p>
                <p style="margin: 5px 0 0 0; font-size: 12px; color: #1976d2;">
                  Please do not close this window.
                </p>
              </div>
            `
                : `
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
                  ${this.ART_STYLES.map(s => `<option value="${s.value}" ${s.value === defaultStyle ? 'selected' : ''}>${s.label}</option>`).join('')}
                </select>
              </div>
            `
            }
          </div>
        `;
      };

      const updateDialog = (errorMsg?: string) => {
        if (dialogRef) {
          dialogRef.data.content = renderContent(errorMsg);
          dialogRef.render(true);

          // Re-attach event listeners after render completes
          if (!isGenerating) {
            setTimeout(() => {
              const html = dialogRef.element;
              const modelSelect = html.find('#portrait-model');
              const sizeSelect = html.find('#portrait-size');
              const qualitySelect = html.find('#portrait-quality');

              modelSelect.off('change').on('change', (e: any) => {
                currentModel = e.target.value;

                // Reset size to first valid option for new model
                if (currentModel === 'dall-e-3') {
                  currentSize = '1024x1024';
                  currentQuality = 'standard';
                } else if (currentModel === 'gpt-image-1') {
                  currentSize = '1024x1024';
                  currentQuality = 'medium';
                } else if (currentModel === 'dall-e-2') {
                  currentSize = '1024x1024';
                  currentQuality = 'standard';
                }
                updateDialog();
              });

              sizeSelect.off('change').on('change', (e: any) => {
                currentSize = e.target.value;
                updateDialog();
              });

              qualitySelect.off('change').on('change', (e: any) => {
                currentQuality = e.target.value;
                updateDialog();
              });
            }, 50); // Increased timeout to ensure render completes
          }
        }
      };

      const handleConfirm = async (html: JQuery) => {
        if (isGenerating) return;

        const styleSelect = html.find('#portrait-style')[0] as HTMLSelectElement;
        const selectedStyle = styleSelect?.value || defaultStyle;

        isGenerating = true;
        updateDialog();

        // Disable buttons
        html.closest('.dialog').find('button').prop('disabled', true);

        try {
          const contextWithOptions = {
            ...context,
            artStyle: selectedStyle,
            dalleModel: currentModel,
            dalleSize: currentSize,
            dalleQuality: currentQuality
          };

          const request: AIGenerationRequest = {
            type: 'portrait',
            context: contextWithOptions
          };

          const response: AIGenerationResponse = await AIService.generate(request);

          if (!response.success) {
            isGenerating = false;
            updateDialog(response.error || 'Failed to generate portrait. Please try again.');
            html.closest('.dialog').find('button').prop('disabled', false);
            return;
          }

          const portraitPath = response.content as string;
          dialogRef.close();
          resolve({
            success: true,
            portraitPath
          });
        } catch (error: any) {
          isGenerating = false;
          updateDialog(error?.message || 'An unexpected error occurred. Please try again.');
          html.closest('.dialog').find('button').prop('disabled', false);
        }
      };

      dialogRef = new Dialog({
        title: 'DALL-E Portrait Generation',
        content: renderContent(),
        buttons: {
          confirm: {
            icon: '<i class="fas fa-check"></i>',
            label: 'Confirm',
            callback: handleConfirm
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: 'Cancel',
            callback: () => {
              if (!isGenerating) {
                resolve({ success: false, cancelled: true });
              }
            }
          }
        },
        default: 'confirm',
        close: () => {
          if (!isGenerating) {
            resolve({ success: false, cancelled: true });
          }
        }
      });

      dialogRef.render(true);
    });
  }
}
