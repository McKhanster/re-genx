import { RedisClient } from '@devvit/web/server';
import { FamiliarState, FamiliarStats, BiomeType } from '../../shared/types/api';
import { safeRedisOperation } from '../utils/redis-utils';

/**
 * FamiliarManager handles personal familiar creation and management
 *
 * Responsibilities:
 * - Create new familiars for users
 * - Fetch familiar state from Redis
 * - Update care meter values
 * - Check for familiar removal due to neglect
 */
export class FamiliarManager {
  constructor(private redis: RedisClient) {}

  /**
   * Get user's familiar from Redis
   *
   * @param userId - Reddit user ID
   * @returns FamiliarState or null if not found
   */
  async getFamiliar(userId: string): Promise<FamiliarState | null> {
    try {
      const familiarId = this.getFamiliarKey(userId);
      const data = await this.safeRedisOperation(() => this.redis.hGetAll(familiarId), null);

      if (!data || Object.keys(data).length === 0) {
        return null;
      }

      return {
        id: familiarId,
        userId,
        age: parseInt(data.age || '0'),
        careMeter: parseInt(data.careMeter || '100'),
        evolutionPoints: parseInt(data.evolutionPoints || '0'),
        mutations: data.mutations ? JSON.parse(data.mutations) : [],
        stats: data.stats ? JSON.parse(data.stats) : this.getDefaultStats(),
        biome: (data.biome as BiomeType) || 'jungle',
        lastCareTime: parseInt(data.lastCareTime || Date.now().toString()),
        createdAt: parseInt(data.createdAt || Date.now().toString()),
        privacyOptIn: data.privacyOptIn === 'true',
        neglectWarning: data.neglectWarning === 'true',
      };
    } catch (error) {
      console.error('Error in getFamiliar:', error);
      throw new Error('Failed to get familiar');
    }
  }

  /**
   * Create a new familiar for a user
   * Initializes with default stats, Care Meter at 100, and random biome
   *
   * @param userId - Reddit user ID
   * @returns Newly created FamiliarState
   */
  async createFamiliar(userId: string): Promise<FamiliarState> {
    try {
      const familiarId = this.getFamiliarKey(userId);

      // Check if familiar already exists
      const existing = await this.getFamiliar(userId);
      if (existing) {
        return existing;
      }

      // Select random biome
      const biomes: BiomeType[] = ['jungle', 'rocky_mountain', 'desert', 'ocean', 'cave'];
      const randomBiome = biomes[Math.floor(Math.random() * biomes.length)] as BiomeType;

      const now = Date.now();
      const familiar: FamiliarState = {
        id: familiarId,
        userId,
        age: 0,
        careMeter: 100,
        evolutionPoints: 0,
        mutations: [],
        stats: this.getDefaultStats(),
        biome: randomBiome,
        lastCareTime: now,
        createdAt: now,
        privacyOptIn: false,
      };

      // Store in Redis
      await this.safeRedisOperation(
        () =>
          this.redis.hSet(familiarId, {
            userId,
            age: '0',
            careMeter: '100',
            evolutionPoints: '0',
            mutations: JSON.stringify([]),
            stats: JSON.stringify(familiar.stats),
            biome: randomBiome,
            lastCareTime: now.toString(),
            createdAt: now.toString(),
            privacyOptIn: 'false',
            neglectWarning: 'false',
          }),
        undefined
      );

      return familiar;
    } catch (error) {
      console.error('Error in createFamiliar:', error);
      throw new Error('Failed to create familiar');
    }
  }

  /**
   * Update care meter value (0-100)
   *
   * @param userId - Reddit user ID
   * @param careMeter - New care meter value
   */
  async updateCareMeter(userId: string, careMeter: number): Promise<void> {
    try {
      const familiarId = this.getFamiliarKey(userId);

      // Clamp value to 0-100
      const clampedValue = Math.max(0, Math.min(100, careMeter));

      await this.safeRedisOperation(
        () =>
          this.redis.hSet(familiarId, {
            careMeter: clampedValue.toString(),
          }),
        undefined
      );

      // Clear neglect warning if care meter is above 20
      if (clampedValue >= 20) {
        await this.safeRedisOperation(
          () => this.redis.hSet(familiarId, { neglectWarning: 'false' }),
          undefined
        );
      } else {
        // Set neglect warning if below 20
        await this.safeRedisOperation(
          () => this.redis.hSet(familiarId, { neglectWarning: 'true' }),
          undefined
        );
      }
    } catch (error) {
      console.error('Error in updateCareMeter:', error);
      throw new Error('Failed to update care meter');
    }
  }

  /**
   * Check if familiar should be removed (Care Meter 0 for 24 hours)
   *
   * @param userId - Reddit user ID
   * @returns true if familiar was removed, false otherwise
   */
  async checkForRemoval(userId: string): Promise<boolean> {
    try {
      const familiarId = this.getFamiliarKey(userId);
      const data = await this.safeRedisOperation(() => this.redis.hGetAll(familiarId), null);

      if (!data || Object.keys(data).length === 0) {
        return false;
      }

      const careMeter = parseInt(data.careMeter || '100');
      const lastCareTime = parseInt(data.lastCareTime || Date.now().toString());

      // Check if care meter is 0 for 24 hours
      const hoursSinceLastCare = (Date.now() - lastCareTime) / (1000 * 60 * 60);
      if (careMeter === 0 && hoursSinceLastCare >= 24) {
        await this.removeFamiliar(userId);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error in checkForRemoval:', error);
      throw new Error('Failed to check for removal');
    }
  }

  /**
   * Remove familiar and archive data
   *
   * @param userId - Reddit user ID
   */
  private async removeFamiliar(userId: string): Promise<void> {
    try {
      const familiarId = this.getFamiliarKey(userId);
      const archiveId = `familiar:archived:${userId}`;

      // Archive the familiar data before deletion
      const data = await this.safeRedisOperation(() => this.redis.hGetAll(familiarId), null);

      if (data && Object.keys(data).length > 0) {
        await this.safeRedisOperation(() => this.redis.hSet(archiveId, data), undefined);

        // Set TTL on archived data (30 days)
        await this.safeRedisOperation(
          async () => {
            await this.redis.expire(archiveId, 30 * 24 * 60 * 60);
          },
          undefined
        );
      }

      // Delete the familiar
      await this.safeRedisOperation(
        async () => {
          await this.redis.del(familiarId);
        },
        undefined
      );
    } catch (error) {
      console.error('Error in removeFamiliar:', error);
      throw new Error('Failed to remove familiar');
    }
  }

  /**
   * Get default stats for a new familiar
   * All stats start at 50 except vitals which start at 100
   */
  private getDefaultStats(): FamiliarStats {
    return {
      mobility: { speed: 50, agility: 50, endurance: 50 },
      senses: { vision: 50, hearing: 50, smell: 50 },
      survival: { attack: 50, defense: 50, stealth: 50 },
      cognition: { intelligence: 50, social: 50, adaptability: 50 },
      vitals: { health: 100, happiness: 100, energy: 100 },
    };
  }

  /**
   * Get Redis key for familiar
   *
   * @param userId - Reddit user ID
   * @returns Redis key
   */
  private getFamiliarKey(userId: string): string {
    return `familiar:${userId}`;
  }

  /**
   * Safe Redis operation wrapper with retry logic
   * Uses centralized utility from redis-utils
   *
   * @param operation - Redis operation to execute
   * @param fallback - Fallback value if all retries fail
   * @param retries - Number of retry attempts (default: 3)
   * @returns Operation result or fallback value
   */
  private async safeRedisOperation<T>(
    operation: () => Promise<T>,
    fallback: T,
    retries: number = 3
  ): Promise<T> {
    return safeRedisOperation(operation, fallback, retries);
  }
}
