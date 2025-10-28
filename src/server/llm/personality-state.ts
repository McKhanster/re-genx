import type { CreaturePersonality } from './gemini-service';

// ============================================================================
// Personality State Interface
// ============================================================================

export interface PersonalityState extends CreaturePersonality {
  timestamp: number; // Unix timestamp when personality was last updated
  interactionCount: number; // Number of interactions recorded
  lastInteraction?: string; // Description of last interaction
  memory?: string; // Stored memory formed from interactions
  ttl: number; // Time to live in seconds for Redis
}

// ============================================================================
// Personality State Manager Class
// ============================================================================

export class PersonalityStateManager {
  private redis: any; // Redis client injected via constructor
  private defaultTTL = 3600; // 1 hour default TTL

  constructor(redis: any) {
    this.redis = redis;
  }

  /**
   * Save creature personality state to Redis
   * @param creatureId - Unique identifier for the creature
   * @param personality - Personality data from Gemini service
   * @param ttlSeconds - Optional TTL override (defaults to 1 hour)
   * @returns Promise<void>
   */
  async savePersonality(
    creatureId: string,
    personality: CreaturePersonality,
    ttlSeconds?: number
  ): Promise<void> {
    try {
      const personalityKey = `creature:personality:${creatureId}`;
      const timestamp = Date.now();

      // Create personality state object
      const personalityState: PersonalityState = {
        ...personality,
        timestamp,
        interactionCount: await this.getInteractionCount(creatureId) + 1,
        ttl: ttlSeconds || this.defaultTTL
      };

      // Handle optional memory field
      if (personality.memory_formed) {
        personalityState.memory = personality.memory_formed;
        delete (personalityState as any).memory_formed; // Remove the original field
      }

      // Save to Redis hash
      const hashData = {
        mood: personalityState.mood,
        energy: personalityState.energy.toString(),
        sound: personalityState.sound,
        movement: personalityState.movement,
        timestamp: personalityState.timestamp.toString(),
        interactionCount: personalityState.interactionCount.toString(),
        lastInteraction: personalityState.lastInteraction || '',
        memory: personalityState.memory || '',
        ttl: personalityState.ttl.toString()
      };

      await this.redis.hSet(personalityKey, hashData);

      // Set expiration on the hash key
      await this.redis.expire(personalityKey, ttlSeconds || this.defaultTTL);

      console.log(`[PersonalityState] Saved personality for creature ${creatureId}:`, {
        mood: personalityState.mood,
        energy: personalityState.energy,
        interactionCount: personalityState.interactionCount
      });

    } catch (error) {
      console.error(`[PersonalityState] Failed to save personality for creature ${creatureId}:`, error);
      throw error;
    }
  }

  /**
   * Retrieve creature personality state from Redis
   * @param creatureId - Unique identifier for the creature
   * @returns Promise<PersonalityState | null> - Complete personality state or null if not found
   */
  async getPersonality(creatureId: string): Promise<PersonalityState | null> {
    try {
      const personalityKey = `creature:personality:${creatureId}`;

      // Get all personality data from Redis
      const personalityData = await this.redis.hGetAll(personalityKey);

      // Check if personality data exists
      if (!personalityData || !personalityData.mood) {
        console.log(`[PersonalityState] No personality data found for creature ${creatureId}`);
        return null;
      }

      // Parse and validate the personality state
      const personalityState: PersonalityState = {
        mood: personalityData.mood,
        energy: parseInt(personalityData.energy || '50'),
        sound: personalityData.sound || '*quiet sounds*',
        movement: personalityData.movement || 'gentle swaying',
        timestamp: parseInt(personalityData.timestamp || '0'),
        interactionCount: parseInt(personalityData.interactionCount || '0'),
        lastInteraction: personalityData.lastInteraction || undefined,
        memory: personalityData.memory || undefined,
        ttl: parseInt(personalityData.ttl || this.defaultTTL.toString())
      };

      console.log(`[PersonalityState] Retrieved personality for creature ${creatureId}:`, {
        mood: personalityState.mood,
        energy: personalityState.energy,
        timestamp: personalityState.timestamp
      });

      return personalityState;

    } catch (error) {
      console.error(`[PersonalityState] Failed to get personality for creature ${creatureId}:`, error);
      return null;
    }
  }

  /**
   * Get only the current personality values (without metadata)
   * @param creatureId - Unique identifier for the creature
   * @returns Promise<CreaturePersonality | null> - Just the personality fields or null
   */
  async getCurrentPersonality(creatureId: string): Promise<CreaturePersonality | null> {
    const personalityState = await this.getPersonality(creatureId);

    if (!personalityState) {
      return null;
    }

    // Return only the personality fields, excluding metadata
    const personality: CreaturePersonality = {
      mood: personalityState.mood,
      energy: personalityState.energy,
      sound: personalityState.sound,
      movement: personalityState.movement
    };

    // Only add memory_formed if it exists
    if (personalityState.memory) {
      personality.memory_formed = personalityState.memory;
    }

    return personality;
  }

  /**
   * Update last interaction for a creature
   * @param creatureId - Unique identifier for the creature
   * @param interaction - Description of the interaction
   * @returns Promise<void>
   */
  async recordInteraction(creatureId: string, interaction: string): Promise<void> {
    try {
      const personalityKey = `creature:personality:${creatureId}`;

      // Get current interaction count
      const interactionCount = await this.getInteractionCount(creatureId);

      // Update interaction data
      await this.redis.hSet(personalityKey, {
        lastInteraction: interaction,
        interactionCount: (interactionCount + 1).toString()
      });

      console.log(`[PersonalityState] Recorded interaction for creature ${creatureId}: ${interaction}`);

    } catch (error) {
      console.error(`[PersonalityState] Failed to record interaction for creature ${creatureId}:`, error);
      throw error;
    }
  }

  /**
   * Update memory formed from interactions
   * @param creatureId - Unique identifier for the creature
   * @param memory - New memory to store
   * @returns Promise<void>
   */
  async updateMemory(creatureId: string, memory: string): Promise<void> {
    try {
      const personalityKey = `creature:personality:${creatureId}`;

      await this.redis.hSet(personalityKey, {
        memory: memory,
        timestamp: Date.now().toString()
      });

      console.log(`[PersonalityState] Updated memory for creature ${creatureId}: ${memory.substring(0, 50)}...`);

    } catch (error) {
      console.error(`[PersonalityState] Failed to update memory for creature ${creatureId}:`, error);
      throw error;
    }
  }

  /**
   * Check if personality state has expired
   * @param creatureId - Unique identifier for the creature
   * @returns Promise<boolean> - True if expired or missing
   */
  async isExpired(creatureId: string): Promise<boolean> {
    try {
      const personalityKey = `creature:personality:${creatureId}`;
      const exists = await this.redis.exists(personalityKey);

      if (!exists) {
        return true;
      }

      // Check TTL
      const ttl = await this.redis.ttl(personalityKey);
      return ttl <= 0;

    } catch (error) {
      console.error(`[PersonalityState] Failed to check expiration for creature ${creatureId}:`, error);
      return true; // Consider expired on error
    }
  }

  /**
   * Delete personality state (for cleanup or reset)
   * @param creatureId - Unique identifier for the creature
   * @returns Promise<boolean> - True if deleted successfully
   */
  async deletePersonality(creatureId: string): Promise<boolean> {
    try {
      const personalityKey = `creature:personality:${creatureId}`;
      const deletedCount = await this.redis.del(personalityKey);

      console.log(`[PersonalityState] Deleted personality for creature ${creatureId}: ${deletedCount > 0}`);
      return deletedCount > 0;

    } catch (error) {
      console.error(`[PersonalityState] Failed to delete personality for creature ${creatureId}:`, error);
      return false;
    }
  }

  /**
   * Get the current interaction count for a creature
   * @param creatureId - Unique identifier for the creature
   * @returns Promise<number> - Current interaction count
   */
  private async getInteractionCount(creatureId: string): Promise<number> {
    try {
      const personalityKey = `creature:personality:${creatureId}`;
      const count = await this.redis.hGet(personalityKey, 'interactionCount');
      return parseInt(count || '0');
    } catch (error) {
      console.error(`[PersonalityState] Failed to get interaction count for creature ${creatureId}:`, error);
      return 0;
    }
  }

  /**
   * Clear all personality states (admin utility)
   * @returns Promise<number> - Number of personalities deleted
   */
  async clearAllPersonalities(): Promise<number> {
    try {
      // In Redis, we can't efficiently delete all keys matching a pattern without SCAN
      // For production, this would need a different approach or should be avoided
      console.warn('[PersonalityState] clearAllPersonalities called - this is a dangerous operation');

      // Get all keys matching the personality pattern (simplified approach)
      // NOTE: This is not efficient for production use
      const keys = await this.redis.keys('creature:personality:*');
      if (keys.length === 0) {
        return 0;
      }

      const deletedCount = await this.redis.del(...keys);
      console.log(`[PersonalityState] Cleared ${deletedCount} personality states`);
      return deletedCount;

    } catch (error) {
      console.error('[PersonalityState] Failed to clear all personalities:', error);
      return 0;
    }
  }

  /**
   * Get personality state statistics
   * @returns Promise<{totalPersonalities: number, expiredCount: number}> - Statistics object
   */
  async getStatistics(): Promise<{totalPersonalities: number, expiredCount: number}> {
    try {
      // Get all personality keys (simplified - not efficient for large datasets)
      const keys = await this.redis.keys('creature:personality:*');

      let totalPersonalities = 0;
      let expiredCount = 0;

      for (const key of keys) {
        totalPersonalities++;

        const ttl = await this.redis.ttl(key);
        if (ttl <= 0) {
          expiredCount++;
        }
      }

      return { totalPersonalities, expiredCount };

    } catch (error) {
      console.error('[PersonalityState] Failed to get statistics:', error);
      return { totalPersonalities: 0, expiredCount: 0 };
    }
  }
}
