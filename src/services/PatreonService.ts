// Patreon authentication and tier validation service
const MODULE_ID = 'dorman-lakelys-npc-generator';

/**
 * Patreon membership tiers
 */
export enum PatreonTier {
  FREE = 'free',
  APPRENTICE = 'apprentice', // $3/month - AI names & bios
  WIZARD = 'wizard' // $5/month - AI portraits & premium models
}

/**
 * Patreon authentication data stored in settings
 */
export interface PatreonAuthData {
  authenticated: boolean;
  tier: PatreonTier;
  state: string; // UUID token
  timestamp: number;
}

/**
 * OAuth configuration
 * NOTE: Client ID is public and safe to expose
 * Client Secret stays on n8n backend only
 */
const PATREON_CONFIG = {
  // TODO: Replace with your actual Patreon OAuth client ID
  clientId: 'YOUR_PATREON_CLIENT_ID_HERE',

  // TODO: Replace with your actual n8n webhook URL
  n8nWebhookBase: 'https://n8n.yourdomain.com/webhook',

  // OAuth scopes needed
  scopes: 'identity identity.memberships',

  // Polling configuration
  pollInterval: 3000, // 3 seconds
  maxPollAttempts: 20, // 1 minute total
  graceAttempts: 5 // Extra attempts for "invalid state" errors
};

/**
 * Service for managing Patreon authentication and tier validation
 */
export class PatreonService {
  private static _pendingState: string | null = null;
  private static _pollInterval: number | null = null;

  /**
   * Get current authentication data from settings
   */
  static getAuthData(): PatreonAuthData | null {
    try {
      return (game.settings as any).get(MODULE_ID, 'patreonAuthData') as PatreonAuthData | null;
    } catch (error) {
      console.warn("Dorman Lakely's NPC Gen | Failed to get Patreon auth data:", error);
      return null;
    }
  }

  /**
   * Save authentication data to settings
   */
  static async setAuthData(data: PatreonAuthData | null): Promise<void> {
    try {
      await (game.settings as any).set(MODULE_ID, 'patreonAuthData', data);
    } catch (error) {
      console.error("Dorman Lakely's NPC Gen | Failed to save Patreon auth data:", error);
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    const authData = this.getAuthData();
    return authData?.authenticated === true && !!authData?.state;
  }

  /**
   * Get current user's tier
   */
  static getCurrentTier(): PatreonTier {
    const authData = this.getAuthData();
    return authData?.tier || PatreonTier.FREE;
  }

  /**
   * Check if user has access to a specific feature
   */
  static hasFeatureAccess(requiredTier: PatreonTier): boolean {
    const currentTier = this.getCurrentTier();

    // Tier hierarchy: FREE < APPRENTICE < WIZARD
    const tierHierarchy: Record<PatreonTier, number> = {
      [PatreonTier.FREE]: 0,
      [PatreonTier.APPRENTICE]: 1,
      [PatreonTier.WIZARD]: 2
    };

    return tierHierarchy[currentTier] >= tierHierarchy[requiredTier];
  }

  /**
   * Generate a secure random UUID for state parameter
   */
  private static generateStateUUID(): string {
    // Use native crypto.randomUUID if available (modern browsers)
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }

    // Fallback to Foundry's random ID
    return foundry.utils.randomID();
  }

  /**
   * Start Patreon OAuth authentication flow
   */
  static async startAuthentication(): Promise<void> {
    // Generate state token for CSRF protection
    this._pendingState = this.generateStateUUID();

    const oauthUrl =
      `https://www.patreon.com/oauth2/authorize?` +
      `response_type=code&` +
      `client_id=${PATREON_CONFIG.clientId}&` +
      `redirect_uri=${encodeURIComponent(`${PATREON_CONFIG.n8nWebhookBase}/npc-generator-oauth`)}&` +
      `scope=${encodeURIComponent(PATREON_CONFIG.scopes)}&` +
      `state=${this._pendingState}`;

    console.log("Dorman Lakely's NPC Gen | Starting Patreon authentication...");
    console.log("Dorman Lakely's NPC Gen | State token:", this._pendingState);

    // Open OAuth page in new window
    window.open(oauthUrl, '_blank', 'width=600,height=800');

    // Start polling for completion
    await this.pollForAuthentication();
  }

  /**
   * Poll n8n backend to check if authentication is complete
   */
  private static async pollForAuthentication(): Promise<void> {
    if (!this._pendingState) {
      throw new Error('No pending authentication state');
    }

    const state = this._pendingState;
    let attempts = 0;
    let graceAttemptsRemaining = PATREON_CONFIG.graceAttempts;

    return new Promise((resolve, reject) => {
      this._pollInterval = window.setInterval(async () => {
        attempts++;

        try {
          const response = await fetch(
            `${PATREON_CONFIG.n8nWebhookBase}/npc-check-auth?state=${state}`
          );

          if (!response.ok) {
            // Handle auth errors (expired, invalid, etc.)
            if (response.status === 401 || response.status === 403) {
              this.clearPendingAuth();
              reject(new Error('Authentication failed or expired'));
              return;
            }

            // Give grace period for "invalid state" errors (DB insertion delay)
            if (response.status === 400 && graceAttemptsRemaining > 0) {
              graceAttemptsRemaining--;
              console.log(
                `Dorman Lakely's NPC Gen | Invalid state, ${graceAttemptsRemaining} grace attempts remaining`
              );

              if (attempts < PATREON_CONFIG.maxPollAttempts + PATREON_CONFIG.graceAttempts) {
                return; // Continue polling
              }
            }

            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();

          if (data.authenticated) {
            // Success!
            console.log("Dorman Lakely's NPC Gen | Authentication successful!");
            console.log("Dorman Lakely's NPC Gen | Tier:", data.tier);

            const authData: PatreonAuthData = {
              authenticated: true,
              tier: data.tier || PatreonTier.FREE,
              state: state,
              timestamp: Date.now()
            };

            await this.setAuthData(authData);
            this.clearPendingAuth();
            resolve();
            return;
          }
        } catch (error: any) {
          console.error("Dorman Lakely's NPC Gen | Polling error:", error);

          // Don't fail immediately on network errors - keep trying
          if (attempts < PATREON_CONFIG.maxPollAttempts) {
            return;
          }
        }

        // Timeout reached
        if (attempts >= PATREON_CONFIG.maxPollAttempts + PATREON_CONFIG.graceAttempts) {
          this.clearPendingAuth();
          reject(new Error('Authentication timeout - please try again'));
        }
      }, PATREON_CONFIG.pollInterval);
    });
  }

  /**
   * Clear pending authentication state
   */
  private static clearPendingAuth(): void {
    this._pendingState = null;

    if (this._pollInterval !== null) {
      window.clearInterval(this._pollInterval);
      this._pollInterval = null;
    }
  }

  /**
   * Disconnect from Patreon (clear auth data)
   */
  static async disconnect(): Promise<void> {
    console.log("Dorman Lakely's NPC Gen | Disconnecting Patreon...");
    await this.setAuthData(null);
    this.clearPendingAuth();
  }

  /**
   * Handle authentication errors (401/403 from API)
   * Automatically disconnects user
   */
  static async handleAuthError(error: any): Promise<void> {
    console.error("Dorman Lakely's NPC Gen | Authentication error:", error);

    // Clear auth data
    await this.disconnect();

    // Notify user
    ui.notifications?.error(
      'Patreon authentication expired. Please reconnect to continue using AI features.',
      { permanent: false }
    );
  }

  /**
   * Get user-friendly tier name
   */
  static getTierDisplayName(tier: PatreonTier): string {
    const names: Record<PatreonTier, string> = {
      [PatreonTier.FREE]: 'Free',
      [PatreonTier.APPRENTICE]: 'Apprentice Supporter',
      [PatreonTier.WIZARD]: 'Wizard Supporter'
    };

    return names[tier] || 'Unknown';
  }

  /**
   * Get features available for a tier
   */
  static getTierFeatures(tier: PatreonTier): string[] {
    const features: Record<PatreonTier, string[]> = {
      [PatreonTier.FREE]: ['Basic NPC generation', 'Manual name & biography entry'],
      [PatreonTier.APPRENTICE]: [
        'Everything in Free',
        'AI name generation',
        'AI biography generation'
      ],
      [PatreonTier.WIZARD]: [
        'Everything in Apprentice',
        'AI portrait generation (DALL-E)',
        'Premium AI models (GPT-4o)'
      ]
    };

    return features[tier] || [];
  }

  /**
   * Validate configuration (check if n8n URLs are set)
   */
  static isConfigured(): boolean {
    return (
      PATREON_CONFIG.clientId !== 'YOUR_PATREON_CLIENT_ID_HERE' &&
      PATREON_CONFIG.n8nWebhookBase !== 'https://n8n.yourdomain.com/webhook'
    );
  }
}
