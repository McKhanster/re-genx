import { RedisClient, scheduler } from '@devvit/web/server';
import { MutationEngine } from './mutation-engine';
import { CareSystem } from './care-system';
import { FamiliarManager } from './familiar-manager';
import { BiomeType } from '../../shared/types/api';

/**
 * EvolutionScheduler manages evolution cycles and care meter decay
 *
 * Responsibilities:
 * - Schedule evolution cycles with random intervals (30 min - 4 hours)
 * - Handle evolution cycle events (increment age, trigger mutations, decay care meter)
 * - Schedule care meter decay (hourly)
 * - Handle biome changes every 10 cycles (15% probability)
 * - Check for familiar removal due to neglect
 */
export class EvolutionScheduler {
  constructor(
    private redis: RedisClient,
    private mutationEngine: MutationEngine,
    private careSystem: CareSystem,
    private familiarManager: FamiliarManager
  ) {}

  /**
   * Schedule an evolution cycle for a familiar
   * Random interval between 30 minutes and 4 hours
   *
   * @param userId - Reddit user ID
   */
  async scheduleEvolutionCycle(userId: string): Promise<void> {
    try {
      // Random interval between 30 minutes and 4 hours
      const minMs = 30 * 60 * 1000; // 30 minutes
      const maxMs = 4 * 60 * 60 * 1000; // 4 hours
      const intervalMs = minMs + Math.random() * (maxMs - minMs);

      const runAt = new Date(Date.now() + intervalMs);

      // Schedule the job
      await scheduler.runJob({
        name: 'evolution-cycle',
        data: { userId },
        runAt,
      });

      console.log(
        `Scheduled evolution cycle for user ${userId} at ${runAt.toISOString()} (in ${Math.round(intervalMs / 1000 / 60)} minutes)`
      );
    } catch (error) {
      console.error('Error scheduling evolution cycle:', error);
      throw new Error('Failed to schedule evolution cycle');
    }
  }

  /**
   * Handle evolution cycle event
   * - Increment age
   * - Decay care meter
   * - Check for neglect/removal
   * - 20% chance of uncontrolled mutation
   * - Check for biome change every 10 cycles (15% probability)
   * - Schedule next cycle
   *
   * @param userId - Reddit user ID
   */
  async handleEvolutionCycle(userId: string): Promise<void> {
    try {
      const familiarId = this.getFamiliarKey(userId);

      // Check if familiar exists
      const familiar = await this.familiarManager.getFamiliar(userId);
      if (!familiar) {
        console.log(`Familiar not found for user ${userId}, skipping evolution cycle`);
        return;
      }

      // Increment age
      await this.safeRedisOperation(
        async () => {
          await this.redis.hIncrBy(familiarId, 'age', 1);
        },
        undefined
      );

      const newAge = familiar.age + 1;
      console.log(`Familiar ${familiarId} aged to ${newAge}`);

      // Decay care meter
      await this.careSystem.decayCareMeter(userId);

      // Check for neglect/removal
      const shouldRemove = await this.familiarManager.checkForRemoval(userId);
      if (shouldRemove) {
        console.log(`Familiar ${familiarId} removed due to neglect`);
        // Don't schedule next cycle - familiar has been removed
        return;
      }

      // 20% chance of uncontrolled mutation
      if (Math.random() < 0.2) {
        try {
          const mutation = await this.mutationEngine.generateUncontrolledMutation(userId);
          console.log(
            `Uncontrolled mutation applied to familiar ${familiarId}: ${mutation.id}`
          );
        } catch (error) {
          console.error('Error generating uncontrolled mutation:', error);
          // Continue with evolution cycle even if mutation fails
        }
      }

      // Check for biome change every 10 cycles (15% probability)
      if (newAge % 10 === 0 && Math.random() < 0.15) {
        await this.changeBiome(userId);
      }

      // Schedule next evolution cycle
      await this.scheduleEvolutionCycle(userId);
    } catch (error) {
      console.error('Error handling evolution cycle:', error);
      // Try to schedule next cycle anyway to prevent getting stuck
      try {
        await this.scheduleEvolutionCycle(userId);
      } catch (scheduleError) {
        console.error('Failed to schedule next evolution cycle:', scheduleError);
      }
    }
  }

  /**
   * Schedule care meter decay for a familiar
   * Runs every hour
   *
   * @param userId - Reddit user ID
   */
  async scheduleCareDecay(userId: string): Promise<void> {
    try {
      // Schedule hourly care decay
      await scheduler.runJob({
        name: 'care-decay',
        data: { userId },
        runAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      });

      console.log(`Scheduled care decay for user ${userId}`);
    } catch (error) {
      console.error('Error scheduling care decay:', error);
      throw new Error('Failed to schedule care decay');
    }
  }

  /**
   * Handle care meter decay event
   * - Decrease Care Meter by 5 points
   * - Check if neglect warning needed (Care Meter < 20)
   * - Store warning flag in Redis
   * - Schedule next decay
   *
   * @param userId - Reddit user ID
   */
  async handleCareDecay(userId: string): Promise<void> {
    try {
      // Check if familiar exists
      const familiar = await this.familiarManager.getFamiliar(userId);
      if (!familiar) {
        console.log(`Familiar not found for user ${userId}, skipping care decay`);
        return;
      }

      // Decay care meter by 5 points
      const newCareMeter = Math.max(0, familiar.careMeter - 5);
      await this.familiarManager.updateCareMeter(userId, newCareMeter);

      console.log(
        `Care meter decayed for familiar ${this.getFamiliarKey(userId)}: ${familiar.careMeter} -> ${newCareMeter}`
      );

      // Check if neglect warning needed
      const needsWarning = await this.careSystem.checkNeglectWarning(userId);
      if (needsWarning) {
        console.log(`Neglect warning set for familiar ${this.getFamiliarKey(userId)}`);
      }

      // Schedule next decay (1 hour from now)
      await this.scheduleCareDecay(userId);
    } catch (error) {
      console.error('Error handling care decay:', error);
      // Try to schedule next decay anyway to prevent getting stuck
      try {
        await this.scheduleCareDecay(userId);
      } catch (scheduleError) {
        console.error('Failed to schedule next care decay:', scheduleError);
      }
    }
  }

  /**
   * Change familiar's biome to a different random biome
   *
   * @param userId - Reddit user ID
   */
  private async changeBiome(userId: string): Promise<void> {
    try {
      const familiarId = this.getFamiliarKey(userId);
      const biomes: BiomeType[] = ['jungle', 'rocky_mountain', 'desert', 'ocean', 'cave'];

      // Get current biome
      const data = await this.safeRedisOperation(() => this.redis.hGetAll(familiarId), null);

      if (!data || Object.keys(data).length === 0) {
        console.error(`Familiar ${familiarId} not found for biome change`);
        return;
      }

      const currentBiome = data.biome as BiomeType;

      // Select different biome
      const availableBiomes = biomes.filter((b) => b !== currentBiome);
      const newBiome = availableBiomes[Math.floor(Math.random() * availableBiomes.length)];

      if (!newBiome) {
        console.error('Failed to select new biome');
        return;
      }

      // Update biome in Redis
      await this.safeRedisOperation(
        () =>
          this.redis.hSet(familiarId, {
            biome: newBiome,
          }),
        undefined
      );

      console.log(`Biome changed for familiar ${familiarId}: ${currentBiome} -> ${newBiome}`);
    } catch (error) {
      console.error('Error changing biome:', error);
    }
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
    for (let i = 0; i < retries; i++) {
      try {
        return await operation();
      } catch (error) {
        console.error(`Redis operation failed (attempt ${i + 1}/${retries}):`, error);
        if (i === retries - 1) {
          return fallback;
        }
        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
    return fallback;
  }
}
