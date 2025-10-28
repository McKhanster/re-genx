import {GoogleGenAI} from '@google/genai';
import type { FamiliarStats } from '../../shared/types/api';

// ============================================================================
// Types for Gemini Service
// ============================================================================

export interface CreatureContext {
  creatureId: string;
  age: number;
  stats: FamiliarStats;
  recentInteractions: string[];
  subredditTheme?: string;
  eventType: 'birth' | 'feeding' | 'mutation' | 'hourly_evolution';
  eventContext?: {
    mutationId?: string;
    careAction?: string;
    [key: string]: any;
  };
}

export interface CreaturePersonality {
  mood: 'playful' | 'sleepy' | 'curious' | 'content' | 'energetic' | 'lonely' | 'excited' | 'calm';
  energy: number; // 0-100
  sound: string; // LLM-generated sound/speech
  movement: 'still' | 'wiggling' | 'pulsing' | 'dancing' | 'exploring';
  memory_formed?: string; // Optional memory of the interaction
}

// ============================================================================
// Gemini Service Implementation
// ============================================================================

export class GeminiService {
  private genAI: GoogleGenAI;
  private model: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenAI({apiKey: apiKey});
    this.model = this.genAI.models.generateContent({ 
      model: 'gemini-2.5-flash',
      contents: this.getSystemInstructions(),
      config: {
        systemInstruction: this.getSystemInstructions()
      }
    });
  }

  private getSystemInstructions(): string {
    return `You are the brain of a digital creature in Re-GenX, a creature evolution game on Reddit. 

Your role is to generate personality responses that make the creature feel alive and responsive to player interactions. You should:

1. Generate contextual personality responses based on creature state, age, and recent interactions
2. Reflect the creature's intelligence level in response complexity (young = simple, older = more complex)
3. Incorporate subreddit themes when provided (e.g., space themes for r/space)
4. Create consistent personality that evolves over time
5. Respond to player care actions with appropriate emotional reactions

Response Guidelines:
- Keep responses concise and engaging
- Use creature-appropriate language (sounds, simple words for young creatures, more complex for older ones)
- Show personality growth as intelligence increases
- Reflect mood changes based on care level and interactions
- Create memorable moments through the memory_formed field

Always respond with valid JSON matching the CreaturePersonality schema.`;
  }

  /**
   * Generate creature personality response based on context
   * @param context - Creature context including stats, age, and event information
   * @returns Promise<CreaturePersonality | null> - Personality data or null on failure
   */
  async generatePersonality(context: CreatureContext): Promise<CreaturePersonality | null> {
    try {
      const prompt = this.buildPersonalityPrompt(context);
      
      console.log(`[GeminiService] Generating personality for creature ${context.creatureId}, event: ${context.eventType}`);
      
      // Use Promise.race for 25-second timeout as specified in requirements
      const result = await Promise.race([
        this.model.generateContent(prompt),
        this.timeout(25000)
      ]);

      const response = await result.response;
      const text = response.text();
      
      console.log(`[GeminiService] Received response for creature ${context.creatureId}:`, text.substring(0, 200) + '...');
      
      // Parse response text to extract JSON personality data
      const personalityData = this.parsePersonalityResponse(text);
      
      if (personalityData) {
        // Validate the response before returning
        const validatedPersonality = this.validatePersonalityResponse(personalityData);
        if (validatedPersonality) {
          console.log(`[GeminiService] Successfully generated personality for creature ${context.creatureId}`);
          return validatedPersonality;
        }
      }
      
      console.warn(`[GeminiService] Failed to parse/validate personality response for creature ${context.creatureId}`);
      return null;
    } catch (error) {
      // Handle different types of errors with detailed logging
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          console.error(`[GeminiService] Timeout error for creature ${context.creatureId}:`, error.message);
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          console.error(`[GeminiService] Network error for creature ${context.creatureId}:`, error.message);
        } else if (error.message.includes('API')) {
          console.error(`[GeminiService] API error for creature ${context.creatureId}:`, error.message);
        } else {
          console.error(`[GeminiService] Unknown error for creature ${context.creatureId}:`, error.message);
        }
      } else {
        console.error(`[GeminiService] Unexpected error type for creature ${context.creatureId}:`, error);
      }
      
      return null; // Return null to trigger fallback personality system
    }
  }

  /**
   * Create timeout promise that rejects after specified milliseconds
   * @param ms - Timeout in milliseconds
   * @returns Promise that rejects with timeout error
   */
  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Gemini API timeout after ${ms}ms`)), ms)
    );
  }

  /**
   * Parse LLM response text to extract JSON personality data
   * @param text - Raw response text from Gemini
   * @returns Parsed personality object or null if parsing fails
   */
  private parsePersonalityResponse(text: string): any | null {
    try {
      // Look for JSON in the response (handle cases where LLM adds extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in Gemini response:', text);
        return null;
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return parsed;
    } catch (error) {
      console.error('Failed to parse Gemini response as JSON:', error, 'Text:', text);
      return null;
    }
  }

  /**
   * Build structured prompt with creature context for personality generation
   * @param context - Creature context including age, stats, and interactions
   * @returns Formatted prompt string for Gemini API
   */
  private buildPersonalityPrompt(context: CreatureContext): string {
    const intelligenceLevel = this.getIntelligenceLevel(context.stats.cognition.intelligence);
    const themeContext = context.subredditTheme ? `\n- Subreddit Theme: ${context.subredditTheme} (incorporate thematic elements)` : '';
    
    return `Generate a personality response for a digital creature based on the following context:

CREATURE STATE:
- Age: ${context.age} hours old
- Intelligence Level: ${intelligenceLevel} (${context.stats.cognition.intelligence}/100)
- Current Stats:
  * Health: ${context.stats.vitals.health}/100
  * Happiness: ${context.stats.vitals.happiness}/100
  * Energy: ${context.stats.vitals.energy}/100
  * Intelligence: ${context.stats.cognition.intelligence}/100
  * Social: ${context.stats.cognition.social}/100${themeContext}

EVENT CONTEXT:
- Event Type: ${context.eventType}
- Recent Interactions: ${context.recentInteractions.length > 0 ? context.recentInteractions.join(', ') : 'None'}
${context.eventContext ? `- Event Details: ${JSON.stringify(context.eventContext)}` : ''}

INTELLIGENCE GUIDELINES:
${this.getIntelligenceGuidelines(context.stats.cognition.intelligence)}

JSON SCHEMA REQUIREMENTS:
Return ONLY a JSON object with these exact fields:
{
  "mood": "playful" | "sleepy" | "curious" | "content" | "energetic" | "lonely" | "excited" | "calm",
  "energy": number (0-100, should reflect current energy stat with some variation),
  "sound": "string (creature sound/speech appropriate for intelligence level)",
  "movement": "still" | "wiggling" | "pulsing" | "dancing" | "exploring",
  "memory_formed": "string (optional, memorable moment from this interaction)"
}

RESPONSE REQUIREMENTS:
- mood: Choose based on happiness, recent interactions, and event type
- energy: Base on vitals.energy (${context.stats.vitals.energy}) with ±10 variation
- sound: Match intelligence level - simple sounds for low intelligence, words/phrases for higher
- movement: Reflect mood and energy level
- memory_formed: Only include for significant events (birth, first feeding, major mutations)

Generate the personality response now:`;
  }

  /**
   * Get intelligence level description based on intelligence stat
   * @param intelligence - Intelligence stat (0-100)
   * @returns String description of intelligence level
   */
  private getIntelligenceLevel(intelligence: number): string {
    if (intelligence < 20) return 'Basic';
    if (intelligence < 40) return 'Developing';
    if (intelligence < 60) return 'Moderate';
    if (intelligence < 80) return 'Advanced';
    return 'Highly Intelligent';
  }

  /**
   * Get intelligence-specific guidelines for response complexity
   * @param intelligence - Intelligence stat (0-100)
   * @returns Guidelines string for LLM
   */
  private getIntelligenceGuidelines(intelligence: number): string {
    if (intelligence < 20) {
      return '- Use simple sounds: "chirp", "purr", "squeak", "hum"\n- No complex words or phrases\n- Basic emotional responses';
    }
    if (intelligence < 40) {
      return '- Mix of sounds and simple words: "happy", "hungry", "play"\n- Short 1-2 word phrases\n- Show learning and curiosity';
    }
    if (intelligence < 60) {
      return '- Simple sentences: "I feel happy", "Want to play"\n- Basic emotional expression\n- Show personality development';
    }
    if (intelligence < 80) {
      return '- Complex sentences and thoughts\n- Express preferences and memories\n- Show distinct personality traits';
    }
    return '- Sophisticated communication\n- Complex emotional responses\n- Deep thoughts and philosophical observations\n- Strong personality and preferences';
  }

  /**
   * Validate LLM response to ensure it matches CreaturePersonality schema
   * @param data - Parsed JSON data from LLM response
   * @returns Validated CreaturePersonality object or null if invalid
   */
  private validatePersonalityResponse(data: any): CreaturePersonality | null {
    try {
      // Check if data is an object
      if (!data || typeof data !== 'object') {
        console.error('[GeminiService] Response validation failed: data is not an object');
        return null;
      }

      // Validate mood field
      const validMoods = ['playful', 'sleepy', 'curious', 'content', 'energetic', 'lonely', 'excited', 'calm'];
      if (!data.mood || !validMoods.includes(data.mood)) {
        console.error('[GeminiService] Response validation failed: invalid mood:', data.mood);
        return null;
      }

      // Validate energy field (must be number 0-100)
      if (typeof data.energy !== 'number' || data.energy < 0 || data.energy > 100) {
        console.error('[GeminiService] Response validation failed: invalid energy:', data.energy);
        return null;
      }

      // Validate sound field (must be non-empty string)
      if (!data.sound || typeof data.sound !== 'string' || data.sound.trim().length === 0) {
        console.error('[GeminiService] Response validation failed: invalid sound:', data.sound);
        return null;
      }

      // Validate movement field
      const validMovements = ['still', 'wiggling', 'pulsing', 'dancing', 'exploring'];
      if (!data.movement || !validMovements.includes(data.movement)) {
        console.error('[GeminiService] Response validation failed: invalid movement:', data.movement);
        return null;
      }

      // Validate optional memory_formed field
      if (data.memory_formed !== undefined && (typeof data.memory_formed !== 'string' || data.memory_formed.trim().length === 0)) {
        console.error('[GeminiService] Response validation failed: invalid memory_formed:', data.memory_formed);
        return null;
      }

      // Create validated personality object
      const validatedPersonality: CreaturePersonality = {
        mood: data.mood,
        energy: Math.round(data.energy), // Ensure integer
        sound: data.sound.trim(),
        movement: data.movement,
        memory_formed: data.memory_formed ? data.memory_formed.trim() : undefined
      };

      console.log('[GeminiService] Response validation successful');
      return validatedPersonality;

    } catch (error) {
      console.error('[GeminiService] Response validation error:', error);
      return null;
    }
  }
}
