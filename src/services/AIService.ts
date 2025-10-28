// AI Service for NPC generation using OpenAI and Anthropic APIs

const MODULE_ID = 'dorman-lakelys-npc-generator';

/**
 * Request types for AI generation
 */
export interface AIGenerationRequest {
  type: 'name' | 'biography';
  context: {
    name?: string;
    species?: string;
    class?: string;
    alignment?: string;
    challengeRating?: string;
    description?: string;
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
      default:
        prompt = '';
    }

    // Log the prompt
    console.log("Dorman Lakely's NPC Gen | AI Prompt:", prompt);
    return prompt;
  }

  private buildNamePrompt(context: any): string {
    const templateActorName = context.templateActorName ? `based on the template actor "${context.templateActorName}"` : '';
    return `Generate 1 creative and appropriate name for a D&D 5e NPC ${templateActorName} with these characteristics:
- Species: ${context.species || 'Human'}
- Alignment: ${context.alignment || 'Neutral'}

Provide ONLY the name, nothing else. No explanation, numbering, or extra text. Just the name.`;
  }

  private buildBiographyPrompt(context: any): string {
    const templateActorInfo = context.templateActorName
      ? `\n- Based on template actor: ${context.templateActorName}${context.templateActorDescription ? ` (${context.templateActorDescription})` : ''}`
      : '';

    return `Create a single paragraph biography for a D&D 5e NPC with these characteristics:
${context.name ? `- Name: ${context.name}` : ''}
- Species: ${context.species || 'Human'}
- Alignment: ${context.alignment || 'Neutral'}
- Challenge Rating: ${context.challengeRating || '1'}${templateActorInfo}
${context.description ? `- Additional context: ${context.description}` : ''}

Write ONE concise paragraph (4-6 sentences) that includes:
1. A quick rundown of who they are and their background
2. What they look like (physical appearance, clothing, distinguishing features)
3. A brief sentence about their personality and demeanor

IMPORTANT: DO NOT mention any specific locations, place names, cities, forests, or geographical features. Keep the description generic so it fits any campaign setting.

Format the output as HTML wrapped in a <p> tag. Make it engaging, specific, and suitable for a D&D campaign. Return ONLY the HTML paragraph, no other text.`;
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

      console.log("Dorman Lakely's NPC Gen | OpenAI Request:", { url, model: this.model, bodyModel: requestBody.model });

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
          .map(line => line.trim())
          .filter(line => line.length > 0)
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

    const enableAI = game.settings.get(MODULE_ID, 'enableAI') as boolean;
    if (!enableAI) {
      return {
        success: false,
        content: '',
        error: 'AI features are not enabled. Check module settings.'
      };
    }

    const apiKey = game.settings.get(MODULE_ID, 'openaiApiKey') as string;
    const model = (game.settings.get(MODULE_ID, 'openaiModel') as string) || 'gpt-4o-mini';

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
