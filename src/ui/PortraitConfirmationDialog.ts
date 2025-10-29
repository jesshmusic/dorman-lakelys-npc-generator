// Portrait generation confirmation dialog
const MODULE_ID = 'dorman-lakelys-npc-generator';

export interface PortraitGenerationOptions {
  style: string;
  confirmed: boolean;
}

/**
 * Dialog to confirm portrait generation and select art style
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

  /**
   * Show the confirmation dialog and return user choices
   */
  static async show(): Promise<PortraitGenerationOptions | null> {
    // Get current art style setting as default
    const defaultStyle =
      ((game.settings as any)?.get(MODULE_ID, 'portraitArtStyle') as string) || 'fantasy realistic';

    return new Promise(resolve => {
      const content = `
        <div class="portrait-confirmation-dialog">
          <div class="dialog-section">
            <p class="dialog-info">
              <i class="fas fa-info-circle"></i>
              <strong>Estimated Cost:</strong> $0.04 USD per portrait
            </p>
            <p class="dialog-note">
              This will generate a 1024×1024 portrait using DALL-E 3.
              The image will be automatically saved to your Data folder.
            </p>
          </div>

          <div class="form-group">
            <label for="portrait-style">Art Style:</label>
            <select id="portrait-style" name="style">
              ${this.ART_STYLES.map(
                style =>
                  `<option value="${style.value}" ${style.value === defaultStyle ? 'selected' : ''}>
                    ${style.label}
                  </option>`
              ).join('')}
            </select>
            <p class="form-hint">Choose the visual style for the generated portrait</p>
          </div>
        </div>
      `;

      new Dialog({
        title: 'DALL-E Portrait Generation',
        content,
        buttons: {
          confirm: {
            icon: '<i class="fas fa-check"></i>',
            label: 'Confirm',
            callback: (html: JQuery) => {
              const styleSelect = html.find('#portrait-style')[0] as HTMLSelectElement;
              resolve({
                style: styleSelect?.value || defaultStyle,
                confirmed: true
              });
            }
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: 'Cancel',
            callback: () => resolve(null)
          }
        },
        default: 'confirm',
        close: () => resolve(null)
      }).render(true);
    });
  }
}
