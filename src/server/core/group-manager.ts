import { RedisClient } from '@devvit/web/server';
import {
  getUserGroupKey,
  getWaitingRoomKey,
  generateGroupKey,
  getCreatureKey,
  GROUP_SIZE,
} from '../../shared/constants/redis-keys';
import { GroupStatus, CreatureStats, BiomeType } from '../../shared/types/api';
import { safeRedisOperation } from '../utils/redis-utils';

/**
 * GroupManager handles group formation and waiting room logic
 *
 * Responsibilities:
 * - Check user group membership
 * - Add users to waiting room
 * - Form groups when 25 users join
 * - Initialize creatures with default stats
 */
export class GroupManager {
  constructor(private redis: RedisClient) {}

  /**
   * Get user's group status or add them to waiting room
   *
   * @param userId - Reddit user ID
   * @param subredditId - Subreddit ID
   * @returns GroupStatus indicating waiting or in_group
   */
  async getUserGroup(userId: string, subredditId: string): Promise<GroupStatus> {
    try {
      // Check if user already in a group
      const groupId = await this.safeRedisOperation(
        () => this.redis.get(getUserGroupKey(userId)),
        null
      );

      if (groupId) {
        // User is in a group, get creature ID
        const creatureId = await this.redis.hGet(groupId, 'creatureId');
        return {
          status: 'in_group',
          groupId,
          ...(creatureId && { creatureId }),
        };
      }

      // Add to waiting room using zSet with timestamp as score
      const waitingRoomKey = getWaitingRoomKey(subredditId);
      const timestamp = Date.now();
      await this.safeRedisOperation(
        () => this.redis.zAdd(waitingRoomKey, { member: userId, score: timestamp }),
        undefined
      );

      // Get current count
      const count = await this.safeRedisOperation(() => this.redis.zCard(waitingRoomKey), 0);

      // Check if we have 25 members
      if (count >= GROUP_SIZE) {
        return await this.createGroup(subredditId);
      }

      return {
        status: 'waiting',
        count,
        total: GROUP_SIZE,
      };
    } catch (error) {
      console.error('Error in getUserGroup:', error);
      throw new Error('Failed to get user group status');
    }
  }

  /**
   * Create a new group when 25 users have joined the waiting room
   *
   * @param subredditId - Subreddit ID
   * @returns GroupStatus with new group and creature IDs
   */
  private async createGroup(subredditId: string): Promise<GroupStatus> {
    try {
      const waitingRoomKey = getWaitingRoomKey(subredditId);

      // Get 25 members from waiting room (sorted by timestamp)
      const members = await this.safeRedisOperation(async () => {
        const allMembers = await this.redis.zRange(waitingRoomKey, 0, GROUP_SIZE - 1);

        // Extract member strings from ZMember objects
        const memberIds = allMembers.map((m) => (typeof m === 'string' ? m : m.member));

        // Remove selected members from waiting room
        for (const memberId of memberIds) {
          await this.redis.zRem(waitingRoomKey, [memberId]);
        }

        return memberIds;
      }, []);

      if (members.length < GROUP_SIZE) {
        // Not enough members, return waiting status
        const count = await this.safeRedisOperation(() => this.redis.zCard(waitingRoomKey), 0);
        return {
          status: 'waiting',
          count,
          total: GROUP_SIZE,
        };
      }

      // Create group
      const groupId = generateGroupKey(subredditId);

      await this.safeRedisOperation(
        () =>
          this.redis.hSet(groupId, {
            members: JSON.stringify(members),
            karmaPool: '0',
            createdAt: Date.now().toString(),
          }),
        undefined
      );

      // Map users to group
      for (const userId of members) {
        await this.safeRedisOperation(
          () => this.redis.set(getUserGroupKey(userId), groupId),
          undefined
        );
      }

      // Create creature
      const creatureId = await this.createCreature(groupId);

      // Store creature ID in group
      await this.safeRedisOperation(() => this.redis.hSet(groupId, { creatureId }), undefined);

      return {
        status: 'in_group',
        groupId,
        creatureId,
      };
    } catch (error) {
      console.error('Error in createGroup:', error);
      throw new Error('Failed to create group');
    }
  }

  /**
   * Initialize a new creature with default stats and random biome
   *
   * @param groupId - Group ID that owns this creature
   * @returns Creature ID
   */
  private async createCreature(groupId: string): Promise<string> {
    const creatureId = getCreatureKey(groupId);
    const biomes: BiomeType[] = ['jungle', 'rocky_mountain', 'desert', 'ocean', 'cave'];
    const randomBiome: BiomeType = biomes[Math.floor(Math.random() * biomes.length)] as BiomeType;

    await this.safeRedisOperation(
      () =>
        this.redis.hSet(creatureId, {
          groupId,
          age: '0',
          biome: randomBiome,
          mutations: JSON.stringify([]),
          stats: JSON.stringify(this.getDefaultStats()),
          createdAt: Date.now().toString(),
        }),
      undefined
    );

    return creatureId;
  }

  /**
   * Get default stats for a new creature
   * All stats start at 50 except health and population which start at 100
   */
  private getDefaultStats(): CreatureStats {
    return {
      mobility: { speed: 50, agility: 50, endurance: 50 },
      senses: { vision: 50, hearing: 50, smell: 50 },
      survival: { attack: 50, defense: 50, stealth: 50 },
      cognition: { intelligence: 50, social: 50, adaptability: 50 },
      vitals: { health: 100, population: 100, mutationRate: 50 },
    };
  }

  /**
   * Get complete creature state from Redis
   *
   * @param creatureId - Creature ID
   * @returns Complete creature state or null if not found
   */
  async getCreatureState(
    creatureId: string
  ): Promise<import('../../shared/types/api').CreatureStateResponse | null> {
    try {
      const creatureData = await this.safeRedisOperation(
        () => this.redis.hGetAll(creatureId),
        null
      );

      if (!creatureData || Object.keys(creatureData).length === 0) {
        return null;
      }

      // Parse JSON fields
      const mutations = creatureData.mutations ? JSON.parse(creatureData.mutations) : [];
      const stats = creatureData.stats ? JSON.parse(creatureData.stats) : this.getDefaultStats();

      return {
        creatureId,
        groupId: creatureData.groupId || '',
        age: parseInt(creatureData.age || '0'),
        biome: creatureData.biome as BiomeType,
        mutations,
        stats,
        createdAt: parseInt(creatureData.createdAt || '0'),
      };
    } catch (error) {
      console.error('Error in getCreatureState:', error);
      throw new Error('Failed to get creature state');
    }
  }

  /**
   * Apply stat effects from mutations to creature stats
   * Ensures all stats stay within bounds (0-100)
   * Updates Redis atomically
   *
   * @param creatureId - Creature ID
   * @param statEffects - Stat effects to apply
   */
  async applyStatEffects(
    creatureId: string,
    statEffects: import('../../shared/types/api').StatEffects
  ): Promise<CreatureStats> {
    try {
      // Get current stats
      const statsJson = await this.safeRedisOperation(
        () => this.redis.hGet(creatureId, 'stats'),
        null
      );

      if (!statsJson) {
        throw new Error('Creature stats not found');
      }

      const stats: CreatureStats = JSON.parse(statsJson);

      // Apply stat effects
      for (const [category, changes] of Object.entries(statEffects)) {
        if (stats[category as keyof CreatureStats]) {
          for (const [stat, delta] of Object.entries(changes)) {
            const currentCategory = stats[category as keyof CreatureStats] as Record<
              string,
              number
            >;
            if (currentCategory[stat] !== undefined) {
              // Apply delta and clamp to bounds
              currentCategory[stat] = this.clampStat(currentCategory[stat] + delta);
            }
          }
        }
      }

      // Update Redis atomically
      await this.safeRedisOperation(
        () => this.redis.hSet(creatureId, { stats: JSON.stringify(stats) }),
        undefined
      );

      return stats;
    } catch (error) {
      console.error('Error in applyStatEffects:', error);
      throw new Error('Failed to apply stat effects');
    }
  }

  /**
   * Update creature stats directly
   * Ensures all stats stay within bounds (0-100)
   * Updates Redis atomically
   *
   * @param creatureId - Creature ID
   * @param newStats - New stats to set
   */
  async updateCreatureStats(creatureId: string, newStats: CreatureStats): Promise<void> {
    try {
      // Clamp all stats to valid bounds
      const clampedStats = this.clampAllStats(newStats);

      // Update Redis atomically
      await this.safeRedisOperation(
        () => this.redis.hSet(creatureId, { stats: JSON.stringify(clampedStats) }),
        undefined
      );
    } catch (error) {
      console.error('Error in updateCreatureStats:', error);
      throw new Error('Failed to update creature stats');
    }
  }

  /**
   * Clamp a single stat value to valid bounds (0-100)
   * Special handling for population which can go up to 10000
   *
   * @param value - Stat value to clamp
   * @param isPopulation - Whether this is the population stat
   * @returns Clamped value
   */
  private clampStat(value: number, isPopulation: boolean = false): number {
    const max = isPopulation ? 10000 : 100;
    return Math.max(0, Math.min(max, value));
  }

  /**
   * Clamp all stats in a CreatureStats object to valid bounds
   *
   * @param stats - Stats to clamp
   * @returns Clamped stats
   */
  private clampAllStats(stats: CreatureStats): CreatureStats {
    return {
      mobility: {
        speed: this.clampStat(stats.mobility.speed),
        agility: this.clampStat(stats.mobility.agility),
        endurance: this.clampStat(stats.mobility.endurance),
      },
      senses: {
        vision: this.clampStat(stats.senses.vision),
        hearing: this.clampStat(stats.senses.hearing),
        smell: this.clampStat(stats.senses.smell),
      },
      survival: {
        attack: this.clampStat(stats.survival.attack),
        defense: this.clampStat(stats.survival.defense),
        stealth: this.clampStat(stats.survival.stealth),
      },
      cognition: {
        intelligence: this.clampStat(stats.cognition.intelligence),
        social: this.clampStat(stats.cognition.social),
        adaptability: this.clampStat(stats.cognition.adaptability),
      },
      vitals: {
        health: this.clampStat(stats.vitals.health),
        population: this.clampStat(stats.vitals.population, true),
        mutationRate: this.clampStat(stats.vitals.mutationRate),
      },
    };
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
