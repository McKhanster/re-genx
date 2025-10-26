import { RedisClient } from '@devvit/web/server';
import { FamiliarStats, MutationData, BiomeType } from '../../shared/types/api.js';
import { MutationContext } from './gemini-processor.js';

// ============================================================================
// Activity Pattern Types
// ============================================================================

export interface ActivityPattern {
  categories: Record<string, number>;
  dominantCategory: string;
  lastUpdated: number;
}

// ============================================================================
// Context Builder for LLM Prompts
// ============================================================================

export class ContextBuilder {
  constructor(private redis: RedisClient) {}

  async buildMutationContext(userId: string, creatureId: string): Promise<MutationContext> {
    // Get creature data from Redis
    const creatureData = await this.redis.hGetAll(`creature:${creatureId}`);
    
    if (!creatureData || Object.keys(creatureData).length === 0) {
      throw new Error(`Creature ${creatureId} not found`);
    }

    // Parse creature data
    const stats: FamiliarStats = JSON.parse(creatureData.stats || '{}');
    const mutations: MutationData[] = JSON.parse(creatureData.mutations || '[]');
    const biome = creatureData.biome as BiomeType;

    // Get privacy setting
    const privacyOptIn = creatureData.privacyOptIn === 'true';

    // Get activity pattern if opted in
    let activityCategory: string | undefined;
    if (privacyOptIn) {
      try {
        const pattern = await this.getActivityPattern(userId);
        activityCategory = pattern.dominantCategory;
      } catch (error) {
        console.warn('Failed to get activity pattern:', error);
        // Continue without activity category if it fails
      }
    }

    return {
      stats,
      mutations: mutations.slice(-3), // Last 3 mutations for context
      biome,
      activityCategory,
      creatureId
    };
  }

  private async getActivityPattern(userId: string): Promise<ActivityPattern> {
    const patternData = await this.redis.hGetAll(`activity:${userId}`);
    
    if (!patternData || Object.keys(patternData).length === 0) {
      // Return default pattern if no activity data exists
      return {
        categories: {},
        dominantCategory: 'general',
        lastUpdated: Date.now()
      };
    }

    return {
      categories: JSON.parse(patternData.categories || '{}'),
      dominantCategory: patternData.dominantCategory || 'general',
      lastUpdated: parseInt(patternData.lastUpdated || '0')
    };
  }
}
