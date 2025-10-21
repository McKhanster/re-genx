import { RedisClient } from '@devvit/web/server';
import { FamiliarManager } from './familiar-manager';
import { safeRedisOperation } from '../utils/redis-utils';

/**
 * CareActionResult represents the result of a care action
 */
export interface CareActionResult {
  careMeter: number;
  evolutionPoints: number;
  careMeterIncrease: number;
  evolutionPointsGained: number;
}

/**
 * CareSystem handles care actions and care meter decay
 *
 * Responsibilities:
 * - Perform care actions (feed, play, attention)
 * - Manage cooldown timers for care actions
 * - Calculate and apply care meter decay
 * - Check for neglect warnings
 */
export class CareSystem {
  constructor(
    private redis: RedisClient,
    private familiarManager: FamiliarManager
  ) {}

  /**
   * Perform a care action on the familiar
   *
   * @param userId - Reddit user ID
   * @param action - Care action type ('feed', 'play', 'attention')
   * @returns CareActionResult with updated values
   * @throws Error if action is on cooldown or invalid
   */
  async performCareAction(
    userId: string,
    action: 'feed' | 'play' | 'attention'
  ): Promise<CareActionResult> {
    try {
      const familiarId = this.getFamiliarKey(userId);

      // Check cooldown
      const cooldownKey = `cooldown:${familiarId}:${action}`;
      const cooldownEnd = await this.safeRedisOperation(
        () => this.redis.get(cooldownKey),
        null
      );

      if (cooldownEnd && Date.now() < parseInt(cooldownEnd)) {
        const remainingSeconds = Math.ceil((parseInt(cooldownEnd) - Date.now()) / 1000);
        throw new Error(`Action on cooldown. ${remainingSeconds} seconds remaining.`);
      }

      // Get current state
      const data = await this.safeRedisOperation(() => this.redis.hGetAll(familiarId), null);

      if (!data || Object.keys(data).length === 0) {
        throw new Error('Familiar not found');
      }

      let careMeter = parseInt(data.careMeter || '100');
      let evolutionPoints = parseInt(data.evolutionPoints || '0');

      // Apply care action effects
      const effects = this.getCareActionEffects(action);
      careMeter = Math.min(100, careMeter + effects.careMeterIncrease);
      evolutionPoints += effects.evolutionPointsGained;

      // Update Redis
      await this.safeRedisOperation(
        () =>
          this.redis.hSet(familiarId, {
            careMeter: careMeter.toString(),
            evolutionPoints: evolutionPoints.toString(),
            lastCareTime: Date.now().toString(),
          }),
        undefined
      );

      // Update neglect warning status
      await this.familiarManager.updateCareMeter(userId, careMeter);

      // Set cooldown (5 seconds for testing - change to 5 * 60 * 1000 for production)
      const cooldownMs = 5 * 1000;
      await this.safeRedisOperation(
        () => this.redis.set(cooldownKey, (Date.now() + cooldownMs).toString(), { expiration: new Date(Date.now() + cooldownMs) }),
        undefined
      );

      return {
        careMeter,
        evolutionPoints,
        careMeterIncrease: effects.careMeterIncrease,
        evolutionPointsGained: effects.evolutionPointsGained,
      };
    } catch (error) {
      console.error('Error in performCareAction:', error);
      throw error;
    }
  }

  /**
   * Decay care meter based on time since last care action
   * Decreases by 5 points per hour
   *
   * @param userId - Reddit user ID
   * @returns New care meter value
   */
  async decayCareMeter(userId: string): Promise<number> {
    try {
      const familiarId = this.getFamiliarKey(userId);
      const data = await this.safeRedisOperation(() => this.redis.hGetAll(familiarId), null);

      if (!data || Object.keys(data).length === 0) {
        throw new Error('Familiar not found');
      }

      const lastCareTime = parseInt(data.lastCareTime || Date.now().toString());
      const currentMeter = parseInt(data.careMeter || '100');

      // Calculate hours since last care
      const hoursSinceLastCare = (Date.now() - lastCareTime) / (1000 * 60 * 60);
      const decayAmount = Math.floor(hoursSinceLastCare * 5); // 5 points per hour

      const newMeter = Math.max(0, currentMeter - decayAmount);

      // Update care meter
      await this.familiarManager.updateCareMeter(userId, newMeter);

      return newMeter;
    } catch (error) {
      console.error('Error in decayCareMeter:', error);
      throw new Error('Failed to decay care meter');
    }
  }

  /**
   * Check if familiar needs neglect warning (Care Meter below 20)
   *
   * @param userId - Reddit user ID
   * @returns true if care meter is below 20, false otherwise
   */
  async checkNeglectWarning(userId: string): Promise<boolean> {
    try {
      const familiarId = this.getFamiliarKey(userId);
      const data = await this.safeRedisOperation(() => this.redis.hGetAll(familiarId), null);

      if (!data || Object.keys(data).length === 0) {
        return false;
      }

      const careMeter = parseInt(data.careMeter || '100');
      const needsWarning = careMeter < 20;

      // Store warning flag in Redis
      if (needsWarning) {
        await this.safeRedisOperation(
          () => this.redis.hSet(familiarId, { neglectWarning: 'true' }),
          undefined
        );
      }

      return needsWarning;
    } catch (error) {
      console.error('Error in checkNeglectWarning:', error);
      throw new Error('Failed to check neglect warning');
    }
  }

  /**
   * Get care action effects based on action type
   *
   * @param action - Care action type
   * @returns Object with careMeterIncrease and evolutionPointsGained
   */
  private getCareActionEffects(action: string): {
    careMeterIncrease: number;
    evolutionPointsGained: number;
  } {
    switch (action) {
      case 'feed':
        return { careMeterIncrease: 15, evolutionPointsGained: 10 };
      case 'play':
        return { careMeterIncrease: 10, evolutionPointsGained: 15 };
      case 'attention':
        return { careMeterIncrease: 5, evolutionPointsGained: 5 };
      default:
        return { careMeterIncrease: 0, evolutionPointsGained: 0 };
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
