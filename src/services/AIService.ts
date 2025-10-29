// AI Service for NPC generation using OpenAI and Anthropic APIs

import { ImageService } from '../utils/ImageService.js';

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

  /**
   * Build a prompt based on request type
   */
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

    // Log the prompt
    console.log("Dorman Lakely's NPC Gen | AI Prompt:", prompt);
    return prompt;
  }

  private buildNamePrompt(context: any): string {
    const flavorContext = context.flavor ? `\n- Campaign Flavor: ${context.flavor}` : '';
    const genderContext = context.gender ? `\n- Gender: ${context.gender}` : '';
    return `Generate 1 creative and appropriate name for a D&D 5e NPC with these characteristics:
- Role: ${context.role || 'Fighter'}
- Alignment: ${context.alignment || 'Neutral'}${genderContext}${flavorContext}

Provide ONLY the name, nothing else. No explanation, numbering, or extra text. Just the name.`;
  }

  private buildBiographyPrompt(context: any): string {
    const flavorInfo = context.flavor ? `\n- Campaign Flavor: ${context.flavor}` : '';
    const personalityInfo = context.personality ? `\n- Personality: ${context.personality}` : '';
    const idealInfo = context.ideal ? `\n- Ideal: ${context.ideal}` : '';
    const bondInfo = context.bond ? `\n- Bond: ${context.bond}` : '';

    return `Create a brief biography for a D&D 5e NPC with these characteristics:
${context.name ? `- Name: ${context.name}` : ''}
- Role: ${context.role || 'Fighter'}
- Alignment: ${context.alignment || 'Neutral'}
- Challenge Rating: ${context.challengeRating || '1'}${flavorInfo}${personalityInfo}${idealInfo}${bondInfo}
${context.biography ? `- Existing notes: ${context.biography}` : ''}

Write ONE concise paragraph (3-5 sentences) that includes:
1. Who they are and their background
2. Physical appearance and distinguishing features
3. How their personality and ideals shape their demeanor
${context.flavor ? `4. Elements appropriate to the ${context.flavor} setting` : ''}

${context.flavor ? `IMPORTANT: Incorporate elements from the ${context.flavor} flavor/setting, but DO NOT mention specific locations that may conflict with the GM's world.` : 'IMPORTANT: DO NOT mention any specific locations, place names, cities, forests, or geographical features. Keep the description generic so it fits any campaign setting.'}

Format the output as HTML wrapped in a <p> tag. Return ONLY the HTML paragraph, no other text.`;
  }

  protected buildPortraitPrompt(context: any): string {
    // Get art style from settings, default to "fantasy realistic"
    const artStyle =
      ((game.settings as any)?.get(MODULE_ID, 'portraitArtStyle') as string) || 'fantasy realistic';

    const role = context.role || 'adventurer';
    const species = context.species || 'human';
    const personality = context.personality || '';
    const flavor = context.flavor || '';

    // Build descriptive prompt for DALL-E (excluding alignment to avoid content policy issues)
    let prompt = `A detailed character portrait of a ${species} ${role}`;

    // Add flavor-specific context
    if (flavor) {
      prompt += ` in a ${flavor} setting`;
    }

    prompt += `, ${artStyle} art style`;

    // Add more flavor context if available
    if (flavor) {
      prompt += `, inspired by ${flavor} aesthetics`;
    }

    prompt += `, head and shoulders view, detailed facial features, dramatic lighting`;

    if (personality) {
      prompt += `, ${personality} expression`;
    }

    prompt += `, professional ${artStyle} artwork`;

    return prompt;
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
        temperature: 0.8,
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
        } catch (e) {
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
   * Generate portrait image using DALL-E 3
   */
  async generatePortraitImage(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    const prompt = this.buildPrompt(request);
    const npcName = request.context.name || 'NPC';

    try {
      // DALL-E 3 API endpoint
      const dalleURL = 'https://api.openai.com/v1/images/generations';
      const url = this.corsProxy + dalleURL;

      const requestBody = {
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard'
      };

      console.log("Dorman Lakely's NPC Gen | DALL-E Request:", { prompt, size: '1024x1024' });

      // Show cost warning
      ui.notifications?.info(
        'Generating portrait... This will cost approximately $0.04 and may take 15-30 seconds.',
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
      const imageUrl = data.data[0]?.url;

      if (!imageUrl) {
        throw new Error(
          'No image was generated. This is unusual - please try again or contact support if the issue persists.'
        );
      }

      console.log("Dorman Lakely's NPC Gen | DALL-E image URL received:", imageUrl);

      // Download and save the image
      ui.notifications?.info('Downloading and saving portrait...', { permanent: false });
      const localPath = await ImageService.downloadAndSave(imageUrl, npcName);

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
        estimatedCost: 0.04 // DALL-E 3 standard 1024x1024 cost
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
   * Only works for GM users
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
}
