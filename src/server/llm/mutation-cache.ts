import crypto from 'crypto';
import { RedisClient } from '@devvit/web/server';
import { MutationContext, MutationOption } from './gemini-processor.js';

// ============================================================================
// Mutation Cache for LLM-Generated Options
// ============================================================================

export class MutationCache {
  constructor(private redis: RedisClient) {}

  async get(context: MutationContext): Promise<MutationOption[] | null> {
    const key = this.getCacheKey(context);
    
    try {
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error getting cached mutations:', error);
      return null;
    }
  }

  async set(context: MutationContext, options: MutationOption[]): Promise<void> {
    const key = this.getCacheKey(context);
    
    try {
      // Set with 5-minute TTL (300 seconds)
      await this.redis.setEx(key, 300, JSON.stringify(options));
    } catch (error) {
      console.error('Error caching mutations:', error);
      // Don't throw - caching failure shouldn't break the flow
    }
  }

  private getCacheKey(context: MutationContext): string {
    // Create a hash of the context to use as cache key
    const contextForHash = {
      stats: context.stats,
      mutations: context.mutations.map(m => ({
        category: m.traits[0]?.category || 'unknown',
        type: m.type
      })),
      biome: context.biome,
      activity: context.activityCategory
    };

    const hash = crypto
      .createHash('md5')
      .update(JSON.stringify(contextForHash))
      .digest('hex');
    
    return `mutation:cache:${context.creatureId}:${hash}`;
  }

  async trackCacheHit(creatureId: string): Promise<void> {
    try {
      await this.redis.incr(`mutation:cache:hits:${creatureId}`);
    } catch (error) {
      console.error('Error tracking cache hit:', error);
    }
  }

  async trackCacheMiss(creatureId: string): Promise<void> {
    try {
      await this.redis.incr(`mutation:cache:misses:${creatureId}`);
    } catch (error) {
      console.error('Error tracking cache miss:', error);
    }
  }
}
