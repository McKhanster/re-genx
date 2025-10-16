// ============================================================================
// Redis Key Schema Constants
// ============================================================================

/**
 * Redis key schema for Re-GenX
 *
 * This file defines all Redis key patterns used throughout the application
 * to ensure consistency and prevent key collisions.
 */

// ============================================================================
// User Keys
// ============================================================================

/**
 * Maps a user to their group
 * Pattern: user:{userId}:group
 * Type: String
 * Value: groupId
 */
export const getUserGroupKey = (userId: string): string => `user:${userId}:group`;

// ============================================================================
// Waiting Room Keys
// ============================================================================

/**
 * Current waiting room for a subreddit
 * Pattern: waitingroom:{subredditId}:current
 * Type: Set
 * Value: Set of userIds
 */
export const getWaitingRoomKey = (subredditId: string): string =>
  `waitingroom:${subredditId}:current`;

// ============================================================================
// Group Keys
// ============================================================================

/**
 * Group data
 * Pattern: group:{subredditId}:{timestamp}
 * Type: Hash
 * Fields: members (JSON), karmaPool (number), creatureId (string), createdAt (number)
 */
export const getGroupKey = (subredditId: string, timestamp: number): string =>
  `group:${subredditId}:${timestamp}`;

/**
 * Generate a new group key with current timestamp
 */
export const generateGroupKey = (subredditId: string): string =>
  getGroupKey(subredditId, Date.now());

// ============================================================================
// Creature Keys
// ============================================================================

/**
 * Creature data
 * Pattern: creature:{groupId}
 * Type: Hash
 * Fields: groupId, age, biome, mutations (JSON), stats (JSON), createdAt
 */
export const getCreatureKey = (groupId: string): string => `creature:${groupId}`;

// ============================================================================
// Mutation Session Keys
// ============================================================================

/**
 * Mutation session data (temporary, 5 min TTL)
 * Pattern: mutation:{groupId}:{timestamp}
 * Type: Hash
 * Fields: groupId, type, traitCategories (JSON), votes (JSON), expiresAt
 */
export const getMutationSessionKey = (groupId: string, timestamp: number): string =>
  `mutation:${groupId}:${timestamp}`;

/**
 * Generate a new mutation session key with current timestamp
 */
export const generateMutationSessionKey = (groupId: string): string =>
  getMutationSessionKey(groupId, Date.now());

// ============================================================================
// Behavior Tracking Keys
// ============================================================================

/**
 * User behavior data (7 day TTL)
 * Pattern: behavior:{groupId}:{userId}
 * Type: Hash
 * Fields: subreddits (JSON), lastUpdated
 */
export const getBehaviorKey = (groupId: string, userId: string): string =>
  `behavior:${groupId}:${userId}`;

// ============================================================================
// Constants
// ============================================================================

/**
 * Group size constraint - ALWAYS 25 players per creature
 */
export const GROUP_SIZE = 25;

/**
 * Mutation session duration in milliseconds (5 minutes)
 */
export const MUTATION_SESSION_DURATION = 5 * 60 * 1000;

/**
 * Behavior tracking TTL in seconds (7 days)
 */
export const BEHAVIOR_TTL = 7 * 24 * 60 * 60;

/**
 * Evolution cycle timing (in milliseconds)
 */
export const EVOLUTION_CYCLE_MIN = 15 * 60 * 1000; // 15 minutes
export const EVOLUTION_CYCLE_MAX = 2 * 60 * 60 * 1000; // 2 hours

/**
 * Karma system constants
 */
export const GENETIC_SHOT_COST = 100;
export const KARMA_CONTRIBUTION_RATE = 0.1; // 10% of earned karma

/**
 * Mutation probabilities
 */
export const UNCONTROLLED_MUTATION_CHANCE = 0.3; // 30% per evolution cycle
export const BIOME_CHANGE_CHANCE = 0.2; // 20% every 10 cycles
export const BIOME_CHANGE_INTERVAL = 10; // Check every 10 cycles

/**
 * Randomness factors
 */
export const CONTROLLED_MUTATION_RANDOMNESS_MIN = 0.85;
export const CONTROLLED_MUTATION_RANDOMNESS_MAX = 0.95;
export const UNCONTROLLED_MUTATION_RANDOMNESS_MIN = 0.05;
export const UNCONTROLLED_MUTATION_RANDOMNESS_MAX = 0.15;

/**
 * Behavior influence
 */
export const BEHAVIOR_INFLUENCE_MULTIPLIER = 0.4; // 40% increase for dominant category
