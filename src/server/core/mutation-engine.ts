import { RedisClient } from '@devvit/web/server';
import { MutationData, MutationTrait, StatEffects, FamiliarStats } from '../../shared/types/api';
import { ActivityTracker, ActivityPattern } from './activity-tracker';
import { safeRedisOperation } from '../utils/redis-utils';

/**
 * TraitOption represents a single trait choice for controlled mutations
 */
export interface TraitOption {
  id: string;
  category: string;
  label: string;
  value: string | number | boolean | object;
}

/**
 * MutationChoice represents a mutation choice session
 */
export interface MutationChoice {
  sessionId: string;
  options: TraitOption[];
}

/**
 * Compatibility result for mutation checking
 */
export interface CompatibilityResult {
  compatible: boolean;
  conflicts: string[];
  suggestions: string[];
}

/**
 * MutationEngine handles controlled and uncontrolled mutations
 *
 * Responsibilities:
 * - Trigger controlled mutations (costs 100 Evolution Points)
 * - Generate trait options for player choice
 * - Apply chosen mutations with randomness factor (0.85-0.95)
 * - Calculate stat effects based on traits
 * - Update familiar mutations and stats in Redis
 * - Check mutation compatibility to prevent conflicts
 */
export class MutationEngine {
  // Compatibility matrix: defines which mutation categories can coexist
  private readonly compatibilityMatrix: Record<string, string[]> = {
    legs: ['color', 'size', 'pattern', 'appendage'], // Legs compatible with most
    color: ['legs', 'size', 'pattern', 'appendage'], // Color compatible with all
    size: ['legs', 'color', 'pattern', 'appendage'], // Size compatible with all
    appendage: ['legs', 'color', 'size', 'pattern'], // Appendages compatible with all
    pattern: ['legs', 'color', 'size', 'appendage'], // Pattern compatible with all
  };

  // Maximum instances of each mutation category
  private readonly maxInstancesPerCategory: Record<string, number> = {
    legs: 1, // Only one leg configuration
    color: 3, // Up to 3 color variations
    size: 1, // Only one size
    appendage: 4, // Up to 4 different appendages
    pattern: 2, // Up to 2 patterns
  };

  constructor(
    private redis: RedisClient,
    private activityTracker?: ActivityTracker
  ) {}

  /**
   * Trigger a controlled mutation
   * Deducts 100 Evolution Points and creates a mutation choice session
   *
   * @param userId - Reddit user ID
   * @returns MutationChoice with session ID and trait options
   * @throws Error if insufficient evolution points
   */
  async triggerControlledMutation(userId: string): Promise<MutationChoice> {
    try {
      const familiarId = this.getFamiliarKey(userId);

      // Check evolution points
      const data = await this.safeRedisOperation(() => this.redis.hGetAll(familiarId), null);

      if (!data || Object.keys(data).length === 0) {
        throw new Error('Familiar not found');
      }

      const evolutionPoints = parseInt(data.evolutionPoints || '0');

      if (evolutionPoints < 100) {
        throw new Error(
          `Insufficient evolution points. You have ${evolutionPoints} EP, but need 100 EP.`
        );
      }

      // Deduct 100 evolution points
      await this.safeRedisOperation(
        () =>
          this.redis.hSet(familiarId, {
            evolutionPoints: (evolutionPoints - 100).toString(),
          }),
        undefined
      );

      // Generate 3-5 trait options for one category
      const traitOptions = this.generateTraitOptions();

      // Create choice session with 5-minute TTL
      const sessionId = `mutation:choice:${familiarId}:${Date.now()}`;
      await this.safeRedisOperation(
        () =>
          this.redis.hSet(sessionId, {
            familiarId,
            options: JSON.stringify(traitOptions),
            createdAt: Date.now().toString(),
          }),
        undefined
      );

      // Set 5-minute expiry (300 seconds)
      await this.safeRedisOperation(
        async () => {
          await this.redis.expire(sessionId, 300);
        },
        undefined
      );

      return {
        sessionId,
        options: traitOptions,
      };
    } catch (error) {
      console.error('Error in triggerControlledMutation:', error);
      throw error;
    }
  }

  /**
   * Check if a mutation is compatible with existing mutations
   *
   * @param familiarId - Familiar Redis key
   * @param newMutationCategory - Category of the new mutation to check
   * @returns CompatibilityResult with compatibility status, conflicts, and suggestions
   */
  async checkMutationCompatibility(
    familiarId: string,
    newMutationCategory: string
  ): Promise<CompatibilityResult> {
    try {
      // Get existing mutations
      const data = await this.safeRedisOperation(() => this.redis.hGetAll(familiarId), null);

      if (!data || Object.keys(data).length === 0) {
        // No existing mutations, all compatible
        return {
          compatible: true,
          conflicts: [],
          suggestions: [],
        };
      }

      const mutations: MutationData[] = data.mutations ? JSON.parse(data.mutations) : [];

      // Count existing mutations by category
      const categoryCounts: Record<string, number> = {};
      const existingCategories = new Set<string>();

      for (const mutation of mutations) {
        for (const trait of mutation.traits) {
          existingCategories.add(trait.category);
          categoryCounts[trait.category] = (categoryCounts[trait.category] || 0) + 1;
        }
      }

      const conflicts: string[] = [];
      const suggestions: string[] = [];

      // Check if category is in compatibility matrix
      if (!this.compatibilityMatrix[newMutationCategory]) {
        conflicts.push(`Unknown mutation category: ${newMutationCategory}`);
        return {
          compatible: false,
          conflicts,
          suggestions: this.getAlternativeMutations(existingCategories),
        };
      }

      // Check compatibility with existing mutations
      const compatibleWith = this.compatibilityMatrix[newMutationCategory];

      if (compatibleWith) {
        for (const existingCategory of existingCategories) {
          if (!compatibleWith.includes(existingCategory)) {
            conflicts.push(
              `${newMutationCategory} is not compatible with existing ${existingCategory} mutation`
            );
          }
        }
      }

      // Check if we've reached the maximum instances for this category
      const currentCount = categoryCounts[newMutationCategory] || 0;
      const maxInstances = this.maxInstancesPerCategory[newMutationCategory] || 1;

      if (currentCount >= maxInstances) {
        conflicts.push(
          `Maximum ${maxInstances} ${newMutationCategory} mutation(s) already applied`
        );
      }

      // If there are conflicts, suggest alternatives
      if (conflicts.length > 0) {
        suggestions.push(...this.getAlternativeMutations(existingCategories));
      }

      return {
        compatible: conflicts.length === 0,
        conflicts,
        suggestions,
      };
    } catch (error) {
      console.error('Error checking mutation compatibility:', error);
      return {
        compatible: false,
        conflicts: ['Error checking compatibility'],
        suggestions: [],
      };
    }
  }

  /**
   * Get alternative mutation suggestions based on existing mutations
   *
   * @param existingCategories - Set of existing mutation categories
   * @returns Array of suggested mutation categories
   */
  private getAlternativeMutations(existingCategories: Set<string>): string[] {
    const allCategories = Object.keys(this.compatibilityMatrix);
    const suggestions: string[] = [];

    for (const category of allCategories) {
      // Check if this category is compatible with all existing mutations
      const compatibleWith = this.compatibilityMatrix[category];
      
      if (!compatibleWith) {
        continue;
      }
      
      let isCompatible = true;

      for (const existing of existingCategories) {
        if (!compatibleWith.includes(existing)) {
          isCompatible = false;
          break;
        }
      }

      if (isCompatible && !existingCategories.has(category)) {
        suggestions.push(category);
      }
    }

    return suggestions;
  }

  /**
   * Apply chosen mutation from a mutation choice session
   * Applies randomness factor (0.85-0.95) to chosen trait value
   * Checks compatibility before applying
   *
   * @param sessionId - Mutation choice session ID
   * @param chosenOptionId - ID of the chosen trait option
   * @returns Applied MutationData
   * @throws Error if session is invalid or expired or mutation is incompatible
   */
  async applyChosenMutation(sessionId: string, chosenOptionId: string): Promise<MutationData> {
    try {
      // Get session data
      const sessionData = await this.safeRedisOperation(
        () => this.redis.hGetAll(sessionId),
        null
      );

      if (!sessionData || Object.keys(sessionData).length === 0) {
        throw new Error('Invalid or expired mutation session');
      }

      const familiarId = sessionData.familiarId;
      const optionsJson = sessionData.options;

      if (!familiarId || !optionsJson) {
        throw new Error('Invalid mutation session data');
      }

      const options: TraitOption[] = JSON.parse(optionsJson);

      // Find chosen option
      const chosenOption = options.find((opt) => opt.id === chosenOptionId);

      if (!chosenOption) {
        throw new Error('Invalid option selected');
      }

      // Check compatibility before applying
      const compatibility = await this.checkMutationCompatibility(familiarId, chosenOption.category);

      if (!compatibility.compatible) {
        const conflictMessage = compatibility.conflicts.join('; ');
        const suggestionMessage =
          compatibility.suggestions.length > 0
            ? ` Try these instead: ${compatibility.suggestions.join(', ')}`
            : '';
        throw new Error(`Mutation incompatible: ${conflictMessage}.${suggestionMessage}`);
      }

      // Apply randomness factor (0.85-0.95 for controlled mutations)
      const randomnessFactor = 0.85 + Math.random() * 0.1;

      // Create mutation trait
      const trait: MutationTrait = {
        category: chosenOption.category,
        value: this.applyRandomness(chosenOption.value, randomnessFactor),
        randomnessFactor,
      };

      // Calculate stat effects
      const statEffects = this.calculateStatEffects(trait);

      // Create mutation data
      const mutation: MutationData = {
        id: `mut:${Date.now()}`,
        type: 'controlled',
        traits: [trait],
        statEffects,
        timestamp: Date.now(),
      };

      // Add mutation to familiar
      await this.addMutationToFamiliar(familiarId, mutation);

      // Clean up session
      await this.safeRedisOperation(
        async () => {
          await this.redis.del(sessionId);
        },
        undefined
      );

      return mutation;
    } catch (error) {
      console.error('Error in applyChosenMutation:', error);
      throw error;
    }
  }

  /**
   * Generate 3-5 trait options for one random category
   *
   * @returns Array of TraitOption
   */
  private generateTraitOptions(): TraitOption[] {
    const categories = ['legs', 'color', 'size', 'appendage', 'pattern'];
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];

    switch (randomCategory) {
      case 'legs':
        return [
          { id: 'legs_2', category: 'legs', label: '2 Legs', value: 2 },
          { id: 'legs_4', category: 'legs', label: '4 Legs', value: 4 },
          { id: 'legs_6', category: 'legs', label: '6 Legs', value: 6 },
          { id: 'legs_8', category: 'legs', label: '8 Legs', value: 8 },
        ];

      case 'color':
        return [
          { id: 'color_red', category: 'color', label: 'Red', value: '#ff0000' },
          { id: 'color_blue', category: 'color', label: 'Blue', value: '#0000ff' },
          { id: 'color_green', category: 'color', label: 'Green', value: '#00ff00' },
          { id: 'color_purple', category: 'color', label: 'Purple', value: '#ff00ff' },
          { id: 'color_gold', category: 'color', label: 'Gold', value: '#ffd700' },
        ];

      case 'size':
        return [
          { id: 'size_tiny', category: 'size', label: 'Tiny', value: 0.5 },
          { id: 'size_small', category: 'size', label: 'Small', value: 0.75 },
          { id: 'size_medium', category: 'size', label: 'Medium', value: 1.0 },
          { id: 'size_large', category: 'size', label: 'Large', value: 1.5 },
          { id: 'size_giant', category: 'size', label: 'Giant', value: 2.0 },
        ];

      case 'appendage':
        return [
          { id: 'appendage_tail', category: 'appendage', label: 'Tail', value: 'tail' },
          { id: 'appendage_wings', category: 'appendage', label: 'Wings', value: 'wings' },
          { id: 'appendage_horns', category: 'appendage', label: 'Horns', value: 'horns' },
          { id: 'appendage_tentacles', category: 'appendage', label: 'Tentacles', value: 'tentacles' },
        ];

      case 'pattern':
        return [
          { id: 'pattern_spots', category: 'pattern', label: 'Spots', value: 'spots' },
          { id: 'pattern_stripes', category: 'pattern', label: 'Stripes', value: 'stripes' },
          { id: 'pattern_scales', category: 'pattern', label: 'Scales', value: 'scales' },
          { id: 'pattern_fur', category: 'pattern', label: 'Fur', value: 'fur' },
        ];

      default:
        return [];
    }
  }

  /**
   * Apply randomness to a trait value
   * For controlled mutations, randomness factor is 0.85-0.95 (high control)
   *
   * @param value - Original trait value
   * @param factor - Randomness factor (0 = pure random, 1 = pure control)
   * @returns Modified value with randomness applied
   */
  private applyRandomness(
    value: string | number | boolean | object,
    factor: number
  ): string | number | boolean | object {
    if (typeof value === 'number') {
      // Apply variance based on randomness factor
      const variance = value * (1 - factor);
      const randomOffset = (Math.random() - 0.5) * variance * 2;
      return value + randomOffset;
    }

    // For non-numeric values, return as-is
    return value;
  }

  /**
   * Calculate stat effects based on mutation trait
   *
   * @param trait - Mutation trait
   * @returns StatEffects object with stat changes
   */
  private calculateStatEffects(trait: MutationTrait): StatEffects {
    const effects: StatEffects = {};

    switch (trait.category) {
      case 'legs': {
        const legCount = trait.value as number;
        effects.mobility = {};

        if (legCount <= 4) {
          effects.mobility.speed = 10;
          effects.mobility.agility = legCount === 2 ? 15 : 10;
        } else {
          effects.mobility.speed = -5;
          effects.mobility.agility = 5;
        }
        break;
      }

      case 'size': {
        const size = trait.value as number;
        effects.survival = {};
        effects.mobility = {};

        if (size > 1) {
          // Larger size
          effects.survival.attack = 20;
          effects.survival.defense = 15;
          effects.mobility.speed = -10;
        } else {
          // Smaller size
          effects.survival.attack = -10;
          effects.survival.defense = -5;
          effects.mobility.speed = 15;
          effects.mobility.agility = 10;
        }
        break;
      }

      case 'appendage': {
        const appendageType = trait.value as string;
        effects.mobility = {};
        effects.survival = {};

        switch (appendageType) {
          case 'wings':
            effects.mobility.speed = 20;
            effects.mobility.agility = 15;
            break;
          case 'tail':
            effects.mobility.agility = 10;
            effects.survival.defense = 5;
            break;
          case 'horns':
            effects.survival.attack = 15;
            effects.survival.defense = 10;
            break;
          case 'tentacles':
            effects.mobility.agility = 12;
            effects.survival.attack = 8;
            break;
        }
        break;
      }

      case 'pattern': {
        const patternType = trait.value as string;
        effects.survival = {};
        effects.senses = {};

        switch (patternType) {
          case 'scales':
            effects.survival.defense = 15;
            break;
          case 'fur':
            effects.survival.defense = 10;
            effects.vitals = { energy: 5 };
            break;
          case 'spots':
            effects.survival.stealth = 10;
            break;
          case 'stripes':
            effects.survival.stealth = 12;
            effects.senses.vision = 5;
            break;
        }
        break;
      }

      case 'color': {
        // Color has minimal stat effects, mostly aesthetic
        effects.vitals = { happiness: 5 };
        break;
      }
    }

    return effects;
  }

  /**
   * Add mutation to familiar's mutation list and update stats
   *
   * @param familiarId - Familiar Redis key
   * @param mutation - MutationData to add
   */
  private async addMutationToFamiliar(familiarId: string, mutation: MutationData): Promise<void> {
    try {
      // Get current mutations
      const data = await this.safeRedisOperation(() => this.redis.hGetAll(familiarId), null);

      if (!data || Object.keys(data).length === 0) {
        throw new Error('Familiar not found');
      }

      const mutations: MutationData[] = data.mutations ? JSON.parse(data.mutations) : [];
      mutations.push(mutation);

      // Update mutations in Redis
      await this.safeRedisOperation(
        () =>
          this.redis.hSet(familiarId, {
            mutations: JSON.stringify(mutations),
          }),
        undefined
      );

      // Update stats atomically
      await this.updateFamiliarStats(familiarId, mutation.statEffects);
    } catch (error) {
      console.error('Error in addMutationToFamiliar:', error);
      throw new Error('Failed to add mutation to familiar');
    }
  }

  /**
   * Update familiar stats based on mutation stat effects
   * Ensures stats stay within bounds (0-100)
   *
   * @param familiarId - Familiar Redis key
   * @param effects - StatEffects to apply
   */
  private async updateFamiliarStats(familiarId: string, effects: StatEffects): Promise<void> {
    try {
      const data = await this.safeRedisOperation(() => this.redis.hGetAll(familiarId), null);

      if (!data || Object.keys(data).length === 0) {
        throw new Error('Familiar not found');
      }

      const stats: FamiliarStats = data.stats ? JSON.parse(data.stats) : this.getDefaultStats();

      // Apply stat effects
      for (const [category, changes] of Object.entries(effects)) {
        if (stats[category as keyof FamiliarStats]) {
          for (const [stat, delta] of Object.entries(changes)) {
            const categoryStats = stats[category as keyof FamiliarStats] as Record<string, number>;
            if (categoryStats[stat] !== undefined) {
              // Apply delta and clamp to 0-100
              categoryStats[stat] = Math.max(0, Math.min(100, categoryStats[stat] + delta));
            }
          }
        }
      }

      // Update stats in Redis
      await this.safeRedisOperation(
        () =>
          this.redis.hSet(familiarId, {
            stats: JSON.stringify(stats),
          }),
        undefined
      );
    } catch (error) {
      console.error('Error in updateFamiliarStats:', error);
      throw new Error('Failed to update familiar stats');
    }
  }

  /**
   * Get default stats for a new familiar
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
   * Generate an uncontrolled mutation
   * Uses high randomness (0.05-0.15 control) and optionally influences based on activity patterns
   *
   * @param userId - Reddit user ID
   * @returns Applied MutationData
   */
  async generateUncontrolledMutation(userId: string): Promise<MutationData> {
    try {
      const familiarId = this.getFamiliarKey(userId);

      // Get familiar data
      const data = await this.safeRedisOperation(() => this.redis.hGetAll(familiarId), null);

      if (!data || Object.keys(data).length === 0) {
        throw new Error('Familiar not found');
      }

      const privacyOptIn = data.privacyOptIn === 'true';

      let mutationType: string = '';
      let attempts = 0;
      const maxAttempts = 5;

      // Try to find a compatible mutation type
      while (attempts < maxAttempts) {
        if (privacyOptIn) {
          // Get activity pattern and bias mutation type
          const activityPattern = await this.getActivityPattern(userId);
          mutationType = this.selectMutationFromActivity(activityPattern);
        } else {
          // Pure random mutation type
          mutationType = this.selectRandomMutationType();
        }

        // Check compatibility
        const compatibility = await this.checkMutationCompatibility(familiarId, mutationType);

        if (compatibility.compatible) {
          break;
        }

        attempts++;

        // If we've tried multiple times and still no compatible mutation, try suggestions
        if (attempts >= 3 && compatibility.suggestions.length > 0) {
          const suggestion = compatibility.suggestions[Math.floor(Math.random() * compatibility.suggestions.length)];
          if (suggestion) {
            mutationType = suggestion;
            break;
          }
        }
      }

      // If we couldn't find a compatible mutation after max attempts, skip this mutation
      if (attempts >= maxAttempts || !mutationType) {
        console.log(`Could not find compatible mutation for familiar ${familiarId} after ${maxAttempts} attempts`);
        throw new Error('No compatible mutations available');
      }

      // Apply high randomness (0.05-0.15 control)
      const randomnessFactor = 0.05 + Math.random() * 0.1;

      // Generate random trait for the mutation type
      const trait = this.generateRandomTrait(mutationType, randomnessFactor);

      // Calculate stat effects
      const statEffects = this.calculateStatEffects(trait);

      // Create mutation data
      const mutation: MutationData = {
        id: `mut:${Date.now()}`,
        type: 'uncontrolled',
        traits: [trait],
        statEffects,
        timestamp: Date.now(),
      };

      // Add mutation to familiar
      await this.addMutationToFamiliar(familiarId, mutation);

      return mutation;
    } catch (error) {
      console.error('Error in generateUncontrolledMutation:', error);
      throw error;
    }
  }

  /**
   * Get activity pattern for a user
   * Returns activity pattern if available, otherwise returns default pattern
   *
   * @param userId - Reddit user ID
   * @returns Activity pattern with categories and dominant category
   */
  private async getActivityPattern(userId: string): Promise<ActivityPattern> {
    try {
      if (this.activityTracker) {
        return await this.activityTracker.getActivityPattern(userId);
      }

      // Fallback if no activity tracker
      return {
        categories: {},
        dominantCategory: 'general',
        lastUpdated: 0,
      };
    } catch (error) {
      console.error('Error getting activity pattern:', error);
      return {
        categories: {},
        dominantCategory: 'general',
        lastUpdated: 0,
      };
    }
  }

  /**
   * Select mutation type based on activity pattern
   * Biases mutation toward user's dominant posting category
   *
   * @param pattern - Activity pattern with dominant category
   * @returns Mutation type string
   */
  private selectMutationFromActivity(pattern: ActivityPattern): string {
    // Map activity categories to mutation types
    const categoryMutations: Record<string, string[]> = {
      gaming: ['appendage', 'pattern', 'color'],
      nature: ['pattern', 'color', 'appendage'],
      tech: ['pattern', 'appendage', 'size'],
      art: ['color', 'pattern', 'size'],
      animals: ['pattern', 'appendage', 'legs'],
      science: ['size', 'appendage', 'pattern'],
      general: ['legs', 'color', 'size', 'appendage', 'pattern'],
    };

    const mutations = categoryMutations[pattern.dominantCategory] || categoryMutations.general || [];

    // 30% bias toward category-specific mutations
    if (Math.random() < 0.3 && mutations.length > 0) {
      const selectedMutation = mutations[Math.floor(Math.random() * mutations.length)];
      return selectedMutation || this.selectRandomMutationType();
    }

    // Otherwise, use random mutation type
    return this.selectRandomMutationType();
  }

  /**
   * Select a random mutation type
   *
   * @returns Random mutation type string
   */
  private selectRandomMutationType(): string {
    const types = ['legs', 'color', 'size', 'appendage', 'pattern'];
    const selectedType = types[Math.floor(Math.random() * types.length)];
    return selectedType || 'legs'; // Fallback to 'legs' if undefined
  }

  /**
   * Generate a random trait for a given mutation type
   * Applies high randomness factor for uncontrolled mutations
   *
   * @param type - Mutation type
   * @param randomnessFactor - Randomness factor (0.05-0.15 for uncontrolled)
   * @returns MutationTrait
   */
  private generateRandomTrait(type: string, randomnessFactor: number): MutationTrait {
    let value: string | number | boolean | object;

    switch (type) {
      case 'legs': {
        // Random number of legs (2, 4, 6, 8)
        const legOptions = [2, 4, 6, 8];
        const baseValue = legOptions[Math.floor(Math.random() * legOptions.length)] || 4;
        const randomizedValue = this.applyRandomness(baseValue, randomnessFactor);
        value = typeof randomizedValue === 'number' ? randomizedValue : baseValue;
        break;
      }

      case 'color': {
        // Random color from palette
        const colors = ['#ff0000', '#0000ff', '#00ff00', '#ff00ff', '#ffd700', '#ff8800', '#00ffff'];
        value = colors[Math.floor(Math.random() * colors.length)] || '#00ff00';
        break;
      }

      case 'size': {
        // Random size (0.5 to 2.0)
        const sizeOptions = [0.5, 0.75, 1.0, 1.5, 2.0];
        const baseValue = sizeOptions[Math.floor(Math.random() * sizeOptions.length)] || 1.0;
        const randomizedValue = this.applyRandomness(baseValue, randomnessFactor);
        value = typeof randomizedValue === 'number' ? randomizedValue : baseValue;
        break;
      }

      case 'appendage': {
        // Random appendage type
        const appendages = ['tail', 'wings', 'horns', 'tentacles'];
        value = appendages[Math.floor(Math.random() * appendages.length)] || 'tail';
        break;
      }

      case 'pattern': {
        // Random pattern type
        const patterns = ['spots', 'stripes', 'scales', 'fur'];
        value = patterns[Math.floor(Math.random() * patterns.length)] || 'spots';
        break;
      }

      default: {
        // Fallback to random value
        value = Math.random();
        break;
      }
    }

    return {
      category: type,
      value,
      randomnessFactor,
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
