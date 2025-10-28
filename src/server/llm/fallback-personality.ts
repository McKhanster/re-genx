import type { FamiliarStats, BiomeType } from '../../shared/types/api';

// ============================================================================
// Fallback Personality Interfaces
// ============================================================================

export interface FallbackPersonalityContext {
  creatureId: string;
  age: number;
  stats: FamiliarStats;
  biome: BiomeType;
  lastEvent?: string;
  fallbackReason: 'timeout' | 'api_error' | 'no_consent' | 'service_unavailable';
}

export interface FallbackPersonalityResponse {
  mood: 'dormant' | 'sleepy' | 'neutral' | 'confused';
  energy: number;
  sound: string;
  movement: 'still' | 'gentle swaying' | 'hesitant movements';
  timestamp: number;
}

// ============================================================================
// Fallback Personality System
// ============================================================================

export class FallbackPersonalitySystem {
  /**
   * Generate fallback personality response when Gemini API is unavailable
   * @param context - Context information for fallback personality generation
   * @returns FallbackPersonalityResponse - Basic personality response
   */
  generateFallback(context: FallbackPersonalityContext): FallbackPersonalityResponse {
    console.log(`[FallbackPersonality] Generating fallback for creature ${context.creatureId}, reason: ${context.fallbackReason}`);

    const basePersonality = this.getBasePersonalityForReason(context.fallbackReason);
    const statAdjustedPersonality = this.adjustForCreatureStats(basePersonality, context.stats);
    const ageAdjustedPersonality = this.adjustForCreatureAge(statAdjustedPersonality, context.age);

    const response: FallbackPersonalityResponse = {
      ...ageAdjustedPersonality,
      timestamp: Date.now()
    };

    console.log(`[FallbackPersonality] Generated fallback personality:`, {
      mood: response.mood,
      energy: response.energy,
      sound: response.sound.substring(0, 30) + '...'
    });

    return response;
  }

  /**
   * Get base personality response based on the reason for fallback
   * @param reason - Reason why Gemini API failed/unavailable
   * @returns Partial personality object
   */
  private getBasePersonalityForReason(reason: FallbackPersonalityContext['fallbackReason']): Omit<FallbackPersonalityResponse, 'timestamp'> {
    switch (reason) {
      case 'timeout':
        return {
          mood: 'sleepy',
          energy: 30,
          sound: '*yawns and sleeps* ...AI thinking too long...',
          movement: 'gentle swaying'
        };

      case 'api_error':
        return {
          mood: 'confused',
          energy: 40,
          sound: '*confused sounds* ...AI had trouble thinking...',
          movement: 'hesitant movements'
        };

      case 'no_consent':
        return {
          mood: 'neutral',
          energy: 50,
          sound: '*quiet sounds* (privacy mode enabled)',
          movement: 'gentle swaying'
        };

      case 'service_unavailable':
        return {
          mood: 'dormant',
          energy: 20,
          sound: '*sleeping* ...resting while AI sleeps...',
          movement: 'still'
        };

      default:
        return {
          mood: 'neutral',
          energy: 45,
          sound: '*soft sounds*',
          movement: 'gentle swaying'
        };
    }
  }

  /**
   * Adjust personality based on creature's current stats
   * @param personality - Base personality to adjust
   * @param stats - Current creature stats
   * @returns Modified personality
   */
  private adjustForCreatureStats(
    personality: Omit<FallbackPersonalityResponse, 'timestamp'>,
    stats: FamiliarStats
  ): Omit<FallbackPersonalityResponse, 'timestamp'> {

    const adjusted = { ...personality };

    // Adjust energy based on vitals energy stat
    const statEnergyFactor = stats.vitals.energy / 100; // 0-1 scale
    adjusted.energy = Math.round(adjusted.energy * (0.7 + (statEnergyFactor * 0.6))); // Adjust by ±30%

    // Adjust mood based on health and happiness
    const healthFactor = stats.vitals.health / 100;
    const happinessFactor = stats.vitals.happiness / 100;

    if (healthFactor < 0.3) {
      adjusted.mood = (adjusted.mood === 'dormant') ? 'dormant' : 'sleepy';
      adjusted.energy = Math.min(adjusted.energy, 25);
    } else if (happinessFactor > 0.8) {
      adjusted.mood = 'neutral'; // Can't go to positive moods in fallback
    }

    // Adjust sounds based on intelligence level (more complex sounds for higher intelligence)
    const intelligence = stats.cognition.intelligence;
    if (intelligence > 60 && adjusted.sound.includes('*')) {
      // Replace simple sounds with slightly more complex ones
      if (adjusted.mood === 'sleepy') {
        adjusted.sound = '*yawns deeply* ...needs rest...';
      } else if (adjusted.mood === 'confused') {
        adjusted.sound = '*puzzled sounds* ...thinking hard...';
      }
    }

    return adjusted;
  }

  /**
   * Adjust personality based on creature age
   * @param personality - Personality to adjust
   * @param age - Creature age in hours
   * @returns Age-adjusted personality
   */
  private adjustForCreatureAge(
    personality: Omit<FallbackPersonalityResponse, 'timestamp'>,
    age: number
  ): Omit<FallbackPersonalityResponse, 'timestamp'> {

    const adjusted = { ...personality };

    // Very young creatures are simpler
    if (age < 12) { // Less than 12 hours old
      adjusted.energy = Math.min(adjusted.energy, 60); // Younger creatures have less energy

      if (adjusted.sound.includes('AI') || adjusted.sound.includes('thinking')) {
        adjusted.sound = this.simplifySounds(adjusted.sound);
      }
    }

    // Older creatures might be more complex
    else if (age > 168) { // More than a week old
      if (adjusted.mood === 'sleepy') {
        adjusted.sound = '*deep restful sleep* ...accumulating wisdom...';
      }
    }

    return adjusted;
  }

  /**
   * Simplify complex sounds for younger creatures
   * @param sound - Current sound text
   * @returns Simplified sound text
   */
  private simplifySounds(sound: string): string {
    // Replace complex explanations with simpler sounds
    return sound
      .replace(/\.\.\..*?\.\.\./g, '...') // Remove explanatory text
      .replace(/\([^)]*\)/g, '') // Remove parenthetical comments
      .replace(/AI.*thinking/g, 'soft thinking sounds')
      .trim();
  }

  /**
   * Get fallback personality variants for testing
   * @returns Array of different fallback personality examples
   */
  getFallbackVariants(): Array<{ reason: FallbackPersonalityContext['fallbackReason'], personality: Omit<FallbackPersonalityResponse, 'timestamp'> }> {
    return [
      {
        reason: 'timeout',
        personality: {
          mood: 'sleepy',
          energy: 30,
          sound: '*yawns* ...AI timeout...',
          movement: 'gentle swaying'
        }
      },
      {
        reason: 'api_error',
        personality: {
          mood: 'confused',
          energy: 40,
          sound: '*confused* ...AI error...',
          movement: 'hesitant movements'
        }
      },
      {
        reason: 'no_consent',
        personality: {
          mood: 'neutral',
          energy: 50,
          sound: '*quiet* (privacy)',
          movement: 'gentle swaying'
        }
      },
      {
        reason: 'service_unavailable',
        personality: {
          mood: 'dormant',
          energy: 20,
          sound: '*sleeping* ...AI offline...',
          movement: 'still'
        }
      }
    ];
  }

  /**
   * Check if fallback mode should be used
   * @param geminiAvailable - Whether Gemini service is available
   * @param userConsent - Whether user has consented to AI features
   * @returns boolean - True if fallback should be used
   */
  static shouldUseFallback(geminiAvailable: boolean, userConsent: boolean): boolean {
    return !geminiAvailable || !userConsent;
  }

  /**
   * Log fallback usage for monitoring
   * @param context - Fallback context
   * @param personality - Generated fallback personality
   */
  logFallbackUsage(context: FallbackPersonalityContext, personality: FallbackPersonalityResponse): void {
    console.log(`[FallbackPersonality] Used fallback for creature ${context.creatureId}:`, {
      reason: context.fallbackReason,
      mood: personality.mood,
      energy: personality.energy,
      age: context.age,
      biome: context.biome
    });
  }

  /**
   * Generate emergency fallback when everything else fails
   * @returns Minimal fallback personality
   */
  static getEmergencyFallback(): FallbackPersonalityResponse {
    return {
      mood: 'dormant',
      energy: 10,
      sound: '*system pause*',
      movement: 'still',
      timestamp: Date.now()
    };
  }

  /**
   * Convert fallback personality to standard CreaturePersonality format
   * @param fallback - Fallback personality response
   * @returns CreaturePersonality compatible object
   */
  static toCreaturePersonality(fallback: FallbackPersonalityResponse) {
    return {
      mood: this.mapFallbackMoodToCreatureMood(fallback.mood),
      energy: fallback.energy,
      sound: fallback.sound,
      movement: fallback.movement
      // No memory_formed in fallback responses
    };
  }

  /**
   * Map fallback mood to standard creature mood
   * @param fallbackMood - Fallback mood
   * @returns Standard creature mood
   */
  private static mapFallbackMoodToCreatureMood(
    fallbackMood: FallbackPersonalityResponse['mood']
  ): 'playful' | 'sleepy' | 'curious' | 'content' | 'energetic' | 'lonely' | 'excited' | 'calm' {

    switch (fallbackMood) {
      case 'dormant':
        return 'sleepy';
      case 'sleepy':
        return 'sleepy';
      case 'neutral':
        return 'calm';
      case 'confused':
        return 'curious';
      default:
        return 'calm';
    }
  }
}
