// AI Service for NPC generation using OpenAI and Anthropic APIs

import { ImageService } from '../utils/ImageService.js';
import { PatreonService, PatreonTier } from './PatreonService.js';

const MODULE_ID = 'dorman-lakelys-npc-generator';

/**
 * Request types for AI generation
 */
export interface AIGenerationRequest {
  type: 'name' | 'biography' | 'portrait';
  context: {
    name?: string;
    species?: string;
    class?: string;
    role?: string;
    gender?: string;
    alignment?: string;
    challengeRating?: string;
    description?: string;
    personality?: string;
    flavor?: string;
    artStyle?: string; // Optional art style override for portrait generation
    dalleModel?: string; // 'dall-e-3', 'gpt-image-1', 'dall-e-2'
    dalleSize?: string; // '1024x1024', '1024x1792', etc.
    dalleQuality?: string; // 'standard', 'hd', 'medium', 'high', 'auto'
    biography?: string; // For physical description in portrait prompts
    customPrompt?: string; // User-edited custom prompt for portrait generation
  };
}

/**
 * Response from AI generation
 */
export interface AIGenerationResponse {
  success: boolean;
  content: string | string[]; // String for single, array for name suggestions
  error?: string;
  tokensUsed?: number;
  estimatedCost?: number;
}

/**
 * Abstract AI Provider interface
 */
export abstract class AIProvider {
  abstract generateContent(request: AIGenerationRequest): Promise<AIGenerationResponse>;

  protected buildPrompt(request: AIGenerationRequest): string {
    const { type, context } = request;
    let prompt = '';
    switch (type) {
      case 'name':
        prompt = this.buildNamePrompt(context);
        break;
      case 'biography':
        prompt = this.buildBiographyPrompt(context);
        break;
      case 'portrait':
        prompt = this.buildPortraitPrompt(context);
        break;
      default:
        prompt = '';
    }
    // Final safety pass
    prompt = this.sanitizeForPolicy(prompt);
    console.log("Dorman Lakely's NPC Gen | AI Prompt:", prompt);
    return prompt;
  }

  /** Remove/replace risky IP terms that can trigger refusals */
  private sanitizeForPolicy(text: string): string {
    const banned = [
      /d&d/gi,
      /dnd/gi,
      /dungeons\s*&\s*dragons/gi,
      /wizards of the coast/gi,
      /wotc/gi,
      /forgotten realms/gi,
      /greyhawk/gi,
      /eberron/gi,
      /faer[uú]n/gi,
      /monster manual/gi,
      /player'?s? handbook/gi,
      /dungeon master'?s? guide/gi,
      /baldur'?s? gate/gi
    ];
    let out = text;
    for (const re of banned) out = out.replace(re, 'tabletop fantasy role-playing');
    return out;
  }

  private buildNamePrompt(context: any): string {
    const flavorContext = context.flavor ? `\n- Campaign Flavor: ${context.flavor}` : '';
    const genderContext = context.gender ? `\n- Gender: ${context.gender}` : '';
    return `Generate 1 evocative, setting-agnostic name for a tabletop fantasy role-playing NPC with these characteristics:
- Role: ${context.role || 'Fighter'}
- Alignment: ${context.alignment || 'Neutral'}${genderContext}${flavorContext}

Provide ONLY the name—no extra text.`;
  }

  private buildBiographyPrompt(context: any): string {
    const flavorInfo = context.flavor ? `\n- Campaign Flavor: ${context.flavor}` : '';
    const personalityInfo = context.personality ? `\n- Personality: ${context.personality}` : '';
    const idealInfo = context.ideal ? `\n- Ideal: ${context.ideal}` : '';
    const bondInfo = context.bond ? `\n- Bond: ${context.bond}` : '';
    const genderInfo = context.gender ? `\n- Gender: ${context.gender}` : '';
    const speciesInfo = context.species ? `\n- Species: ${context.species}` : '';

    return `Create a brief biography for a tabletop fantasy role-playing NPC with these characteristics:
${context.name ? `- Name: ${context.name}` : ''}
- Role: ${context.role || 'Fighter'}
- Alignment: ${context.alignment || 'Neutral'}
- Challenge Rating: ${context.challengeRating || '1'}${speciesInfo}${genderInfo}${flavorInfo}${personalityInfo}${idealInfo}${bondInfo}
${context.biography ? `- Existing notes: ${context.biography}` : ''}

Write TWO paragraphs in HTML:

<p> (EXACTLY 2 sentences)
• Who they are and background • How personality/ideals shape demeanor ${context.flavor ? `• Elements appropriate to the ${context.flavor} tone` : ''}</p>

<p> (EXACTLY 1 sentence)
• Physical appearance & distinguishing features${speciesInfo ? ` • Include ${context.species}-specific traits` : ''} • Portrait-visible details • Clothing/equipment that define the silhouette</p>

IMPORTANT: Do NOT use named IP (no brands, books, places). Keep it generic to fit any campaign. Return ONLY the two <p> tags. Be concise - stick to the exact sentence counts.`;
  }

  /** Build simple portrait prompt for user editing */
  protected buildPortraitPrompt(context: any): string {
    const artStyle =
      context.artStyle ||
      ((game.settings as any)?.get(MODULE_ID, 'portraitArtStyle') as string) ||
      'fantasy painting';

    const name = context.name || '';
    const gender = context.gender || '';
    const role = context.role || 'adventurer';
    const species = context.species || 'human';
    const biography = context.biography || '';

    // Build simple, editable prompt
    let prompt = `A portrait of a ${species} ${role}`;

    if (gender) prompt += `, ${gender.toLowerCase()}`;
    if (name) prompt += `, named ${name}`;

    // Pull physical details from second <p> of the biography
    if (biography) {
      const matches = biography.match(/<p[^>]*>([\s\S]*?)<\/p>/g);
      const toText = (s: string) => s.replace(/<[^>]*>/g, '').trim();
      let physical = '';
      if (matches?.length >= 2) physical = toText(matches[1]);
      else if (matches?.length === 1) physical = toText(matches[0]);
      if (physical) {
        const excerpt = physical.substring(0, 300);
        prompt += `. ${excerpt}`;
      }
    }

    prompt += `. Art style: ${artStyle}`;

    return this.sanitizeForPolicy(prompt);
  }
}

/**
 * OpenAI Provider (GPT-4, GPT-4o)
 */
export class OpenAIProvider extends AIProvider {
  private apiKey: string;
  private model: string;
  private readonly baseURL = 'https://api.openai.com/v1/chat/completions';
  private readonly corsProxy = 'https://corsproxy.io/?';

  constructor(apiKey: string, model: string = 'gpt-4o-mini') {
    super();
    this.apiKey = apiKey;
    this.model = model;
  }

  /**
   * Get temperature setting based on request type
   */
  private getTemperatureForType(type: 'name' | 'biography' | 'portrait'): number {
    const settingMap = {
      name: 'nameTemperature',
      biography: 'bioTemperature',
      portrait: 'portraitTemperature'
    };

    const settingKey = settingMap[type];
    const temperature = ((game.settings as any)?.get(MODULE_ID, settingKey) as number) || 0.8;

    console.log(
      `Dorman Lakely's NPC Gen | Using temperature ${temperature} for ${type} generation`
    );
    return temperature;
  }

  async generateContent(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    if (!this.apiKey) {
      return {
        success: false,
        content: '',
        error: 'OpenAI API key not configured'
      };
    }

    // Route portrait requests to DALL-E image generation
    if (request.type === 'portrait') {
      return await this.generatePortraitImage(request);
    }

    const prompt = this.buildPrompt(request);
    const temperature = this.getTemperatureForType(request.type);

    try {
      // Use CORS proxy for browser access
      const url = this.corsProxy + this.baseURL;

      const requestBody = {
        model: this.model,
        messages: [
          {
            role: 'system',
            content:
              'You are a creative D&D dungeon master helping to generate NPCs for a campaign.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: temperature,
        max_tokens: 500
      };

      console.log("Dorman Lakely's NPC Gen | OpenAI Request:", {
        url,
        model: this.model,
        bodyModel: requestBody.model
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Dorman Lakely's NPC Gen | OpenAI Error Response:", errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error?.message || `HTTP ${response.status}`);
        } catch {
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content?.trim() || '';
      const tokensUsed = data.usage?.total_tokens || 0;

      // Parse content based on type
      let parsedContent: string | string[];
      if (request.type === 'name') {
        // Split names into array
        parsedContent = content
          .split('\n')
          .map((line: string) => line.trim())
          .filter((line: string) => line.length > 0)
          .slice(0, 5);
      } else {
        parsedContent = content;
      }

      // Estimate cost based on model
      const estimatedCost = this.estimateCost(tokensUsed);

      return {
        success: true,
        content: parsedContent,
        tokensUsed,
        estimatedCost
      };
    } catch (error: any) {
      console.error("Dorman Lakely's NPC Gen | OpenAI API Error:", error);
      return {
        success: false,
        content: '',
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  /**
   * Truncate prompt to fit model's character limits
   */
  private truncatePromptForModel(prompt: string, model: string): string {
    // Character limits for different models
    const limits: Record<string, number> = {
      'dall-e-3': 4000,
      'gpt-image-1': 4000,
      'dall-e-2': 1000
    };

    const maxLength = limits[model] || 4000;

    if (prompt.length <= maxLength) {
      return prompt;
    }

    // Truncate intelligently - keep the core description and remove the physical details
    console.warn(
      `Dorman Lakely's NPC Gen | Prompt too long (${prompt.length} chars), truncating to ${maxLength} chars for ${model}`
    );

    // Try to find the physical appearance section and truncate it first
    const physicalMarker = '. Physical appearance details:';
    if (prompt.includes(physicalMarker)) {
      const beforePhysical = prompt.split(physicalMarker)[0];
      const afterPhysical = prompt.split(physicalMarker)[1] || '';

      // If we can fit everything except physical details, do that
      if (beforePhysical.length <= maxLength - 50) {
        // Keep some physical details but truncate them
        const remainingSpace = maxLength - beforePhysical.length - physicalMarker.length;
        return beforePhysical + physicalMarker + afterPhysical.substring(0, remainingSpace);
      }
    }

    // Otherwise, just hard truncate with ellipsis
    return prompt.substring(0, maxLength - 3) + '...';
  }

  /**
   * Generate portrait image using DALL-E
   */
  async generatePortraitImage(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    // Use custom prompt if provided, otherwise build one
    let prompt = request.context.customPrompt || this.buildPrompt(request);
    const npcName = request.context.name || 'NPC';
    const model = request.context.dalleModel || 'dall-e-3';
    const size = request.context.dalleSize || '1024x1024';
    const quality = request.context.dalleQuality || 'standard';

    // Apply model-specific prompt length limits
    prompt = this.truncatePromptForModel(prompt, model);

    try {
      // DALL-E API endpoint
      const dalleURL = 'https://api.openai.com/v1/images/generations';
      const url = this.corsProxy + dalleURL;

      const requestBody: any = {
        model: model,
        prompt: prompt,
        n: 1,
        size: size
      };

      // Add quality parameter based on model
      if (model === 'dall-e-3') {
        requestBody.quality = quality; // 'standard' or 'hd'
      } else if (model === 'gpt-image-1') {
        requestBody.quality = quality; // 'medium', 'high', or 'auto'
        // Note: gpt-image-1 does not support the 'style' parameter
      }
      // DALL-E 2 doesn't support quality parameter

      console.log("Dorman Lakely's NPC Gen | Image Generation Request:", {
        model,
        prompt,
        size,
        quality: model !== 'dall-e-2' ? quality : 'N/A (DALL-E 2)'
      });

      // Calculate and show cost warning
      let estimatedCost = 0.04;
      if (model === 'dall-e-3') {
        if (size === '1024x1024') {
          estimatedCost = quality === 'hd' ? 0.08 : 0.04;
        } else {
          estimatedCost = quality === 'hd' ? 0.12 : 0.08;
        }
      } else if (model === 'gpt-image-1') {
        // GPT-4o pricing (similar to DALL-E 3)
        if (size === '1024x1024') {
          estimatedCost = quality === 'high' ? 0.08 : 0.04;
        } else {
          estimatedCost = quality === 'high' ? 0.12 : 0.08;
        }
      } else {
        // DALL-E 2
        if (size === '1024x1024') estimatedCost = 0.02;
        else if (size === '512x512') estimatedCost = 0.018;
        else if (size === '256x256') estimatedCost = 0.016;
      }

      ui.notifications?.info(
        `Generating portrait... This will cost approximately $${estimatedCost.toFixed(3)} and may take 15-30 seconds.`,
        { permanent: false }
      );

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Dorman Lakely's NPC Gen | DALL-E Error Response:", errorText);

        let userFriendlyMessage = 'Failed to generate portrait. ';

        try {
          const errorData = JSON.parse(errorText);
          const apiError = errorData.error;

          // Provide user-friendly messages based on error type
          if (response.status === 429) {
            userFriendlyMessage += 'Rate limit exceeded. Please wait a moment and try again.';
          } else if (response.status === 401) {
            userFriendlyMessage +=
              'Invalid API key. Please check your OpenAI API key in module settings.';
          } else if (response.status === 500 || apiError?.type === 'server_error') {
            userFriendlyMessage +=
              "OpenAI's servers encountered an error. This sometimes happens with complex prompts. Try again in a few moments.";
          } else if (apiError?.code === 'content_policy_violation') {
            userFriendlyMessage +=
              'The portrait request was blocked by content policy. Try changing the NPC details or personality.';
          } else if (apiError?.message) {
            userFriendlyMessage += apiError.message;
          } else {
            userFriendlyMessage += `Server returned error ${response.status}. Please try again.`;
          }

          throw new Error(userFriendlyMessage);
        } catch (e: any) {
          // If error parsing fails, throw generic message
          if (e.message.startsWith('Failed to generate portrait')) {
            throw e;
          }
          throw new Error(
            `Failed to generate portrait. Server returned error ${response.status}. Please try again.`
          );
        }
      }

      const data = await response.json();
      console.log("Dorman Lakely's NPC Gen | API Response Data:", data);

      const imageUrl = data.data?.[0]?.url;
      const base64Data = data.data?.[0]?.b64_json;

      if (!imageUrl && !base64Data) {
        console.error("Dorman Lakely's NPC Gen | No image URL or base64 data in response:", data);
        throw new Error(
          'No image was generated. This is unusual - please try again or contact support if the issue persists.'
        );
      }

      let localPath: string | null = null;

      if (base64Data) {
        // Handle base64 response
        console.log("Dorman Lakely's NPC Gen | Base64 image data received");
        ui.notifications?.info('Saving portrait...', { permanent: false });
        localPath = await ImageService.saveBase64Image(base64Data, npcName);
      } else if (imageUrl) {
        // Handle URL response
        console.log("Dorman Lakely's NPC Gen | Image URL received:", imageUrl);
        ui.notifications?.info('Downloading and saving portrait...', { permanent: false });
        localPath = await ImageService.downloadAndSave(imageUrl, npcName);
      }

      if (!localPath) {
        throw new Error(
          'Portrait was generated but could not be saved. Check that Foundry has permission to write to the Data folder.'
        );
      }

      (ui.notifications as any)?.success(`Portrait generated and saved to: ${localPath}`, {
        permanent: false
      });

      return {
        success: true,
        content: localPath,
        estimatedCost: estimatedCost
      };
    } catch (error: any) {
      console.error("Dorman Lakely's NPC Gen | DALL-E API Error:", error);
      // Don't show notification here - let the UI handler do it to avoid duplicate notifications
      return {
        success: false,
        content: '',
        error: error.message || 'Unknown error occurred while generating portrait.'
      };
    }
  }

  private estimateCost(tokens: number): number {
    // Pricing per 1M tokens (input + output averaged)
    const pricing: Record<string, number> = {
      'gpt-4o': 5.0, // $2.50 input + $10 output = ~$5 avg per 1M tokens
      'gpt-4o-mini': 0.3, // $0.15 input + $0.60 output = ~$0.30 avg
      'gpt-4-turbo': 15.0 // $10 input + $30 output = ~$15 avg
    };

    const pricePerMillion = pricing[this.model] || 5.0;
    return (tokens / 1_000_000) * pricePerMillion;
  }
}

/**
 * AIService - Handles AI generation using OpenAI (GM only)
 */
export class AIService {
  /**
   * Generate content using OpenAI
   * Only works for GM users with appropriate Patreon tier
   */
  static async generate(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    // Only GMs can use AI features
    if (!game.user?.isGM) {
      return {
        success: false,
        content: '',
        error: 'AI features are only available to GM users'
      };
    }

    // Validate Patreon tier for the requested feature
    const tierCheck = this.validateTierAccess(request.type);
    if (!tierCheck.hasAccess) {
      return {
        success: false,
        content: '',
        error: tierCheck.error || 'Insufficient access level'
      };
    }

    const enableAI = (game.settings as any).get(MODULE_ID, 'enableAI') as boolean;
    if (!enableAI) {
      return {
        success: false,
        content: '',
        error: 'AI features are not enabled. Check module settings.'
      };
    }

    const apiKey = (game.settings as any).get(MODULE_ID, 'openaiApiKey') as string;
    const model = ((game.settings as any).get(MODULE_ID, 'openaiModel') as string) || 'gpt-4o-mini';

    if (!apiKey) {
      ui.notifications?.warn('OpenAI API key not configured. Check module settings.');
      return {
        success: false,
        content: '',
        error: 'OpenAI API key not configured'
      };
    }

    console.log(`Dorman Lakely's NPC Gen | Using OpenAI model: ${model}`);
    const provider = new OpenAIProvider(apiKey, model);
    return await provider.generateContent(request);
  }

  /**
   * Validate user has appropriate Patreon tier for feature
   */
  private static validateTierAccess(requestType: 'name' | 'biography' | 'portrait'): {
    hasAccess: boolean;
    error?: string;
  } {
    // Determine required tier based on feature
    let requiredTier: PatreonTier;
    let featureName: string;

    switch (requestType) {
      case 'name':
        requiredTier = PatreonTier.APPRENTICE;
        featureName = 'AI Name Generation';
        break;
      case 'biography':
        requiredTier = PatreonTier.APPRENTICE;
        featureName = 'AI Biography Generation';
        break;
      case 'portrait':
        requiredTier = PatreonTier.WIZARD;
        featureName = 'AI Portrait Generation';
        break;
      default:
        return { hasAccess: true }; // Unknown type, allow
    }

    // Check if user has required tier
    if (!PatreonService.hasFeatureAccess(requiredTier)) {
      const currentTier = PatreonService.getCurrentTier();
      const requiredTierName = PatreonService.getTierDisplayName(requiredTier);

      if (currentTier === PatreonTier.FREE) {
        return {
          hasAccess: false,
          error: `${featureName} requires a Patreon membership (${requiredTierName} or higher). Please connect your Patreon account.`
        };
      } else {
        return {
          hasAccess: false,
          error: `${featureName} requires ${requiredTierName} tier or higher. Please upgrade your Patreon membership.`
        };
      }
    }

    return { hasAccess: true };
  }
}
