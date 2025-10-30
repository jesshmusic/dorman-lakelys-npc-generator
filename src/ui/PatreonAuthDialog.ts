// Patreon authentication dialog
import { PatreonService, PatreonTier } from '../services/PatreonService.js';

const MODULE_ID = 'dorman-lakelys-npc-generator';

/**
 * ApplicationV2 dialog for Patreon authentication
 */
export class PatreonAuthDialog extends foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.api.ApplicationV2
) {
  private isAuthenticating = false;

  static DEFAULT_OPTIONS = {
    id: 'patreon-auth-dialog',
    classes: ['patreon-auth', 'dnd5e2', 'sheet'],
    tag: 'form',
    window: {
      contentClasses: ['standard-form'],
      title: 'Patreon Authentication',
      icon: 'fab fa-patreon',
      resizable: false
    },
    position: {
      width: 500,
      height: 'auto' as const
    },
    actions: {
      connect: PatreonAuthDialog.onConnect,
      disconnect: PatreonAuthDialog.onDisconnect,
      close: PatreonAuthDialog.onClose
    }
  };

  static PARTS = {
    form: {
      template: 'modules/dorman-lakelys-npc-generator/templates/patreon-auth.html'
    }
  };

  async _prepareContext(_options: any): Promise<any> {
    const authData = PatreonService.getAuthData();
    const isAuthenticated = PatreonService.isAuthenticated();
    const currentTier = PatreonService.getCurrentTier();

    return {
      isAuthenticated,
      isAuthenticating: this.isAuthenticating,
      tier: currentTier,
      tierDisplayName: PatreonService.getTierDisplayName(currentTier),
      tierFeatures: PatreonService.getTierFeatures(currentTier),
      isConfigured: PatreonService.isConfigured(),
      allTiers: [
        {
          name: PatreonTier.APPRENTICE,
          displayName: 'Apprentice ($3/month)',
          features: PatreonService.getTierFeatures(PatreonTier.APPRENTICE)
        },
        {
          name: PatreonTier.WIZARD,
          displayName: 'Wizard ($5/month)',
          features: PatreonService.getTierFeatures(PatreonTier.WIZARD)
        }
      ]
    };
  }

  /**
   * Handle connect button click
   */
  static async onConnect(
    this: PatreonAuthDialog,
    _event: Event,
    _target: HTMLElement
  ): Promise<void> {
    if (this.isAuthenticating) return;

    // Check if configured
    if (!PatreonService.isConfigured()) {
      ui.notifications?.error(
        'Patreon integration is not configured. Please contact the module developer.',
        { permanent: false }
      );
      return;
    }

    this.isAuthenticating = true;
    this.render();

    try {
      ui.notifications?.info('Opening Patreon authentication...', { permanent: false });

      await PatreonService.startAuthentication();

      // Success!
      ui.notifications?.success('Successfully connected to Patreon!', { permanent: false });

      this.isAuthenticating = false;
      this.render();

      // Close dialog after a short delay
      setTimeout(() => {
        this.close();
      }, 2000);
    } catch (error: any) {
      console.error("Dorman Lakely's NPC Gen | Auth error:", error);

      ui.notifications?.error(
        error?.message || 'Failed to authenticate with Patreon. Please try again.',
        { permanent: false }
      );

      this.isAuthenticating = false;
      this.render();
    }
  }

  /**
   * Handle disconnect button click
   */
  static async onDisconnect(
    this: PatreonAuthDialog,
    _event: Event,
    _target: HTMLElement
  ): Promise<void> {
    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: { title: 'Disconnect Patreon' },
      content:
        '<p>Are you sure you want to disconnect from Patreon? You will lose access to AI features.</p>',
      rejectClose: false,
      modal: true
    });

    if (confirmed) {
      await PatreonService.disconnect();
      ui.notifications?.info('Disconnected from Patreon', { permanent: false });
      this.render();
    }
  }

  /**
   * Handle close button click
   */
  static async onClose(
    this: PatreonAuthDialog,
    _event: Event,
    _target: HTMLElement
  ): Promise<void> {
    await this.close();
  }

  /**
   * Show the authentication dialog
   */
  static async show(): Promise<void> {
    const dialog = new PatreonAuthDialog();
    dialog.render(true);
  }
}
