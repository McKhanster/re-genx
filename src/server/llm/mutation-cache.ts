import crypto from 'crypto';
import { RedisClient } from '@devvit/web/server';
import { MutationContext, MutationOption } from './gemini-processor.js';

// ============================================================================
// Mutation Cache for LLM-Generated Options
// ============================================================================

export class MutationCache {
  constructor(private redis: RedisClient) {}

  /**
   * Safe Redis operation with retry logic
   */
  private async safeRedisOperation<T>(
    operation: () => Promise<T>,
    fallback: T,
    retries = 3
  ): Promise<T> {
    for (let i = 0; i < retries; i++) {
      try {
        return await operation();
      } catch (error) {
        if (i === retries - 1) {
          console.error('Redis operation failed after retries:', error);
          return fallback;
        }
        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, 100 * (i + 1)));
      }
    }
    return fallback;
  }

  async get(context: MutationContext): Promise<MutationOption[] | null> {
    const key = this.getCacheKey(context);
    
    return await this.safeRedisOperation(
      async () => {
        const cached = await this.redis.get(key);
        return cached ? JSON.parse(cached) : null;
      },
      null,
      3
    );
  }

  async set(context: MutationContext, options: MutationOption[]): Promise<void> {
    const key = this.getCacheKey(context);
    
    await this.safeRedisOperation(
      () => this.redis.setEx(key, 300, JSON.stringify(options)),
      undefined,
      3
    );
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
    await this.safeRedisOperation(
      () => this.redis.incr(`mutation:cache:hits:${creatureId}`),
      0,
      3
    );
  }

  async trackCacheMiss(creatureId: string): Promise<void> {
    await this.safeRedisOperation(
      () => this.redis.incr(`mutation:cache:misses:${creatureId}`),
      0,
      3
    );
  }
}
