import express from 'express';
import {
  InitResponse,
  IncrementResponse,
  DecrementResponse,
  GroupStatusResponse,
  ErrorResponse,
  FamiliarStateResponse,
  FamiliarCreateResponse,
  CareActionResponse,
  MutationTriggerResponse,
  MutationChooseRequest,
  MutationChooseResponse,
  PrivacyOptInRequest,
  PrivacyOptInResponse,
  CreatureInteractRequest,
  CreaturePersonalityResponse,
  CreaturePersonalityStateResponse,
  PrivacyConsentRequest,
  PrivacyConsentResponse,
} from '../shared/types/api';
import { redis, reddit, createServer, context, getServerPort } from '@devvit/web/server';
import { createPost } from './core/post';
import { GroupManager } from './core/group-manager';
import { FamiliarManager } from './core/familiar-manager';
import { CareSystem } from './core/care-system';
import { MutationEngine } from './core/mutation-engine';
import { ActivityTracker } from './core/activity-tracker';
import { EvolutionScheduler } from './core/evolution-scheduler';
import { RateLimitMiddleware } from './middleware/rate-limit-middleware';
import {
  validateCareAction,
  validateMutationOptionId,
  validateSessionId,
  validateCreatureId,
  validateBoolean,
  validateUsername,
  ValidationError,
} from './utils/input-validator';
import { GeminiProcessor } from './llm/gemini-processor';
import { GeminiService } from './llm/gemini-service';
import { ContextBuilder } from './llm/context-builder';
import { MutationCache } from './llm/mutation-cache';
import { settings } from '@devvit/web/server';

(async () => {
  const app = express();

  // Middleware for JSON body parsing
  app.use(express.json());
  // Middleware for URL-encoded body parsing
  app.use(express.urlencoded({ extended: true }));
  // Middleware for plain text body parsing
  app.use(express.text());

  // Rate limiting middleware (100 requests per minute per user)
  const rateLimitMiddleware = new RateLimitMiddleware(100, 60000);
  app.use('/api/', rateLimitMiddleware.middleware);

  const router = express.Router();

  // Initialize managers
  const groupManager = new GroupManager(redis);
  const familiarManager = new FamiliarManager(redis);
  const careSystem = new CareSystem(redis, familiarManager);
  const activityTracker = new ActivityTracker(redis, reddit);
  const mutationEngine = new MutationEngine(redis, activityTracker);
  const evolutionScheduler = new EvolutionScheduler(
    redis,
    mutationEngine,
    careSystem,
    familiarManager
  );

  // Initialize LLM components
  const contextBuilder = new ContextBuilder(redis);
  const mutationCache = new MutationCache(redis);

  // Helper function to get recent interactions for personality context
  async function getRecentInteractions(_creatureId: string, _limit = 5): Promise<string[]> {
    try {
      // For now, return empty array until we implement proper interaction tracking
      // TODO: Implement Redis list operations for interaction history
      return [];
    } catch (error) {
      console.warn('Failed to get recent interactions:', error);
      return [];
    }
  }

  // Helper function to record an interaction for future personality context
  async function recordInteraction(creatureId: string, interaction: string): Promise<void> {
    try {
      // For now, just log the interaction
      // TODO: Implement Redis list operations for interaction history
      console.log(`[Interaction] ${creatureId}: ${interaction}`);
    } catch (error) {
      console.warn('Failed to record interaction:', error);
    }
  }

  // Initialize Gemini services at startup
  let geminiProcessor: GeminiProcessor | null = null;
  let geminiService: GeminiService | null = null;

  // Helper function to initialize Gemini services if not already done
  async function initializeGeminiServices(): Promise<{
    processor: GeminiProcessor | null;
    service: GeminiService | null;
  }> {
    if (geminiProcessor && geminiService) {
      return { processor: geminiProcessor, service: geminiService };
    }

    try {
      const genAIKey: any = await settings.get('genAIKey');
      console.log(
        '[Server] Checking for genAIKey...=============================================================',
        genAIKey
      );
      if (genAIKey && typeof genAIKey === 'string') {
        console.log(
          '[Server] Initializing Gemini services.------------------------------------------------------..'
        );
        geminiProcessor = new GeminiProcessor(genAIKey);
        geminiService = new GeminiService(genAIKey);
        console.log('[Server] Gemini services initialized successfully');
        return { processor: geminiProcessor, service: geminiService };
      } else {
        console.warn(
          '[Server] GEMINI_API_KEY not found or invalid - LLM features will use fallback responses'
        );
        return { processor: null, service: null };
      }
    } catch (error) {
      console.error('[Server] Failed to initialize Gemini services:', error);
      return { processor: null, service: null };
    }
  }

  /**
   * Safe Redis operation with retry logic
   */
  async function safeRedisOperation<T>(
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

  /**
   * Helper function to get username with dev fallback
   * Returns authenticated username or generates a dev username for testing
   */
  async function getUsernameWithFallback(): Promise<string> {
    let username = await reddit.getCurrentUsername();

    // Fallback for development/testing when not authenticated
    if (!username) {
      username = 'dev_user_test';
      console.log('No authenticated user, using dev username:', username);
    }

    return username;
  }

  // ============================================================================
  // Re-GenX API Endpoints
  // ============================================================================

  /**
   * Get group status for a user
   * Returns whether user is waiting or in a group
   */
  router.get<unknown, GroupStatusResponse | ErrorResponse>(
    '/api/group/status',
    async (_req, res): Promise<void> => {
      try {
        // Get userId from Reddit context with dev fallback
        const username = await getUsernameWithFallback();

        // Get subredditId from context
        const subredditId = context.subredditId;
        if (!subredditId) {
          res.status(400).json({ error: 'Subreddit ID not found in context' });
          return;
        }

        // Get group status
        const groupStatus = await groupManager.getUserGroup(username, subredditId);

        res.json(groupStatus);
      } catch (error) {
        console.error('Error in /api/group/status:', error);
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Failed to get group status',
        });
      }
    }
  );

  /**
   * Get creature state by ID
   * Returns complete creature data including age, biome, mutations, and stats
   */
  router.get<
    { creatureId: string },
    import('../shared/types/api').CreatureStateResponse | ErrorResponse
  >('/api/creature/state/:creatureId', async (req, res): Promise<void> => {
    try {
      const { creatureId } = req.params;

      if (!creatureId) {
        res.status(400).json({ error: 'Creature ID is required' });
        return;
      }

      // Validate creature ID
      const validatedCreatureId = validateCreatureId(creatureId);

      // Fetch creature data from Redis
      const creatureData = await groupManager.getCreatureState(validatedCreatureId);

      if (!creatureData) {
        res.status(404).json({ error: 'Creature not found' });
        return;
      }

      res.json(creatureData);
    } catch (error) {
      console.error('Error in /api/creature/state:', error);

      if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message });
        return;
      }

      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to get creature state',
      });
    }
  });

  // ============================================================================
  // Familiar API Endpoints (Personal Creature Management)
  // ============================================================================

  /**
   * Get current familiar state for authenticated user
   * Returns familiar data with Care Meter, Evolution Points, mutations, stats, and biome
   */
  router.get<unknown, FamiliarStateResponse | ErrorResponse>(
    '/api/familiar/state',
    async (_req, res): Promise<void> => {
      try {
        // Get userId from Reddit context with dev fallback
        const username = await getUsernameWithFallback();

        // Validate username
        const validatedUsername = validateUsername(username);

        // Get familiar state
        const familiar = await familiarManager.getFamiliar(validatedUsername);

        res.json({ familiar });
      } catch (error) {
        console.error('Error in /api/familiar/state:', error);

        if (error instanceof ValidationError) {
          res.status(400).json({ error: error.message });
          return;
        }

        res.status(500).json({
          error: error instanceof Error ? error.message : 'Failed to get familiar state',
        });
      }
    }
  );

  /**
   * Create new familiar for authenticated user
   * Initializes with default stats, Care Meter at 100, and random biome
   */
  router.post<unknown, FamiliarCreateResponse | ErrorResponse>(
    '/api/familiar/create',
    async (_req, res): Promise<void> => {
      try {
        // Get userId from Reddit context with dev fallback
        const username = await getUsernameWithFallback();

        // Validate username
        const validatedUsername = validateUsername(username);

        // Create familiar
        const familiar = await familiarManager.createFamiliar(validatedUsername);

        // Schedule first evolution cycle and care decay
        try {
          await evolutionScheduler.scheduleEvolutionCycle(validatedUsername);
          await evolutionScheduler.scheduleCareDecay(validatedUsername);
        } catch (scheduleError) {
          console.error('Error scheduling evolution cycle or care decay:', scheduleError);
          // Don't fail the request if scheduling fails
        }

        res.json({ familiar });
      } catch (error) {
        console.error('Error in /api/familiar/create:', error);

        if (error instanceof ValidationError) {
          res.status(400).json({ error: error.message });
          return;
        }

        res.status(500).json({
          error: error instanceof Error ? error.message : 'Failed to create familiar',
        });
      }
    }
  );

  /**
   * Debug endpoint: Reset familiar mutations
   * Clears all mutations and resets evolution points
   */
  router.post<unknown, { success: boolean; message: string } | ErrorResponse>(
    '/api/familiar/reset',
    async (_req, res): Promise<void> => {
      try {
        const username = await getUsernameWithFallback();
        const validatedUsername = validateUsername(username);
        const familiarId = `familiar:${validatedUsername}`;

        // Clear mutations only, keep other data
        await redis.hSet(familiarId, {
          mutations: JSON.stringify([]),
          evolutionPoints: '0',
        });

        res.json({ success: true, message: 'Familiar reset successfully' });
      } catch (error) {
        console.error('Error resetting familiar:', error);
        res.status(500).json({ error: 'Failed to reset familiar' });
      }
    }
  );

  // ============================================================================
  // Care Action API Endpoints
  // ============================================================================

  /**
   * Feed familiar
   * Increases Care Meter by 15 points and awards 10 Evolution Points
   * 5-minute cooldown per action type
   */
  router.post<unknown, CareActionResponse | ErrorResponse>(
    '/api/care/feed',
    async (_req, res): Promise<void> => {
      try {
        // Get userId from Reddit context with dev fallback
        const username = await getUsernameWithFallback();

        // Validate username
        const validatedUsername = validateUsername(username);

        // Validate care action
        const validatedAction = validateCareAction('feed');

        // Perform care action
        const result = await careSystem.performCareAction(validatedUsername, validatedAction);

        res.json(result);
      } catch (error) {
        console.error('Error in /api/care/feed:', error);

        if (error instanceof ValidationError) {
          res.status(400).json({ error: error.message });
          return;
        }

        // Handle cooldown errors with 429 status
        if (error instanceof Error && error.message.includes('cooldown')) {
          res.status(429).json({ error: error.message });
          return;
        }

        res.status(500).json({
          error: error instanceof Error ? error.message : 'Failed to feed familiar',
        });
      }
    }
  );

  /**
   * Play with familiar
   * Increases Care Meter by 10 points and awards 15 Evolution Points
   * 5-minute cooldown per action type
   */
  router.post<unknown, CareActionResponse | ErrorResponse>(
    '/api/care/play',
    async (_req, res): Promise<void> => {
      try {
        // Get userId from Reddit context with dev fallback
        const username = await getUsernameWithFallback();

        // Validate username
        const validatedUsername = validateUsername(username);

        // Validate care action
        const validatedAction = validateCareAction('play');

        // Perform care action
        const result = await careSystem.performCareAction(validatedUsername, validatedAction);

        res.json(result);
      } catch (error) {
        console.error('Error in /api/care/play:', error);

        if (error instanceof ValidationError) {
          res.status(400).json({ error: error.message });
          return;
        }

        // Handle cooldown errors with 429 status
        if (error instanceof Error && error.message.includes('cooldown')) {
          res.status(429).json({ error: error.message });
          return;
        }

        res.status(500).json({
          error: error instanceof Error ? error.message : 'Failed to play with familiar',
        });
      }
    }
  );

  /**
   * Give attention to familiar
   * Increases Care Meter by 5 points and awards 5 Evolution Points
   * 5-minute cooldown per action type
   */
  router.post<unknown, CareActionResponse | ErrorResponse>(
    '/api/care/attention',
    async (_req, res): Promise<void> => {
      try {
        // Get userId from Reddit context with dev fallback
        const username = await getUsernameWithFallback();

        // Validate username
        const validatedUsername = validateUsername(username);

        // Validate care action
        const validatedAction = validateCareAction('attention');

        // Perform care action
        const result = await careSystem.performCareAction(validatedUsername, validatedAction);

        res.json(result);
      } catch (error) {
        console.error('Error in /api/care/attention:', error);

        if (error instanceof ValidationError) {
          res.status(400).json({ error: error.message });
          return;
        }

        // Handle cooldown errors with 429 status
        if (error instanceof Error && error.message.includes('cooldown')) {
          res.status(429).json({ error: error.message });
          return;
        }

        res.status(500).json({
          error: error instanceof Error ? error.message : 'Failed to give attention to familiar',
        });
      }
    }
  );

  // ============================================================================
  // Controlled Mutation API Endpoints
  // ============================================================================

  /**
   * Trigger controlled mutation
   * Costs 5 Evolution Points and returns trait options for player to choose
   */
  router.post<unknown, MutationTriggerResponse | ErrorResponse>(
    '/api/mutation/trigger',
    async (_req, res): Promise<void> => {
      try {
        // Get userId from Reddit context with dev fallback
        const username = await getUsernameWithFallback();

        // Validate username
        const validatedUsername = validateUsername(username);

        // Trigger controlled mutation
        const mutationChoice = await mutationEngine.triggerControlledMutation(validatedUsername);

        res.json({
          sessionId: mutationChoice.sessionId,
          options: mutationChoice.options,
        });
      } catch (error) {
        console.error('Error in /api/mutation/trigger:', error);

        if (error instanceof ValidationError) {
          res.status(400).json({ error: error.message });
          return;
        }

        // Handle insufficient evolution points with 400 status
        if (error instanceof Error && error.message.includes('Insufficient evolution points')) {
          res.status(400).json({ error: error.message });
          return;
        }

        res.status(500).json({
          error: error instanceof Error ? error.message : 'Failed to trigger mutation',
        });
      }
    }
  );

  /**
   * Apply chosen mutation trait
   * Applies the selected trait option from a mutation choice session
   */
  router.post<unknown, MutationChooseResponse | ErrorResponse, MutationChooseRequest>(
    '/api/mutation/choose',
    async (req, res): Promise<void> => {
      try {
        // Get userId from Reddit context with dev fallback
        const username = await getUsernameWithFallback();

        // Validate username
        const validatedUsername = validateUsername(username);

        const { sessionId, optionId } = req.body;

        if (!sessionId || !optionId) {
          res.status(400).json({ error: 'sessionId and optionId are required' });
          return;
        }

        // Validate inputs
        const validatedSessionId = validateSessionId(sessionId);
        const validatedOptionId = validateMutationOptionId(optionId);

        // Apply chosen mutation
        const mutation = await mutationEngine.applyChosenMutation(
          validatedSessionId,
          validatedOptionId
        );

        // Get updated familiar state to return updated stats
        const familiar = await familiarManager.getFamiliar(validatedUsername);

        if (!familiar) {
          res.status(404).json({ error: 'Familiar not found' });
          return;
        }

        res.json({
          mutation,
          updatedStats: familiar.stats,
        });
      } catch (error) {
        console.error('Error in /api/mutation/choose:', error);

        if (error instanceof ValidationError) {
          res.status(400).json({ error: error.message });
          return;
        }

        // Handle invalid session with 400 status
        if (error instanceof Error && error.message.includes('Invalid or expired')) {
          res.status(400).json({ error: error.message });
          return;
        }

        res.status(500).json({
          error: error instanceof Error ? error.message : 'Failed to apply mutation',
        });
      }
    }
  );

  // ============================================================================
  // LLM Mutation Generation API Endpoints
  // ============================================================================

  /**
   * Generate mutation options using LLM
   * Accepts POST requests with creature ID and user context
   * Returns JSON array of mutation options with 5-minute caching
   */
  router.post<
    unknown,
    { options: import('./llm/gemini-processor').MutationOption[] } | ErrorResponse
  >('/api/mutation/generate', async (req, res): Promise<void> => {
    try {
      // Get userId from Reddit context with dev fallback
      const username = await getUsernameWithFallback();
      const validatedUsername = validateUsername(username);

      // Get creatureId from request body
      const { creatureId } = req.body as { creatureId?: string };

      if (!creatureId) {
        res.status(400).json({ error: 'creatureId is required' });
        return;
      }

      const validatedCreatureId = validateCreatureId(creatureId);

      // Initialize Gemini services if needed
      const { processor } = await initializeGeminiServices();
      if (!processor) {
        res
          .status(503)
          .json({ error: 'LLM service not available - GEMINI_API_KEY not configured' });
        return;
      }

      // Build mutation context using ContextBuilder
      const context = await contextBuilder.buildMutationContext(
        validatedUsername,
        validatedCreatureId
      );

      // Check cache first
      const cachedOptions = await mutationCache.get(context);
      if (cachedOptions) {
        await mutationCache.trackCacheHit(validatedCreatureId);
        res.json({ options: cachedOptions });
        return;
      }

      // Generate mutations using Gemini
      await mutationCache.trackCacheMiss(validatedCreatureId);
      const options = await processor.generateMutationOptions(context);

      // Cache the results with 5-minute TTL
      await mutationCache.set(context, options);

      res.json({ options });
    } catch (error) {
      console.error('Error in /api/mutation/generate:', error);

      if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message });
        return;
      }

      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({ error: error.message });
          return;
        }

        if (error.message.includes('Timeout')) {
          res.status(408).json({ error: 'LLM request timed out - please try again' });
          return;
        }
      }

      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to generate mutations',
      });
    }
  });

  // ============================================================================
  // Creature Personality API Endpoints
  // ============================================================================

  /**
   * Creature interaction endpoint
   * Accepts POST requests with creature ID, event type, and context
   * Calls Gemini Service to generate personality response
   */
  router.post<unknown, CreaturePersonalityResponse | ErrorResponse, CreatureInteractRequest>(
    '/api/creature/interact',
    async (req, res): Promise<void> => {
      try {
        // Get userId from Reddit context with dev fallback
        const username = await getUsernameWithFallback();
        const validatedUsername = validateUsername(username);

        const { creatureId, eventType, context: eventContext } = req.body;

        if (!creatureId || !eventType) {
          res.status(400).json({ error: 'creatureId and eventType are required' });
          return;
        }

        // Validate creature ID
        const validatedCreatureId = validateCreatureId(creatureId);

        // Initialize Gemini services if needed
        const { service } = await initializeGeminiServices();
        if (!service) {
          // Return fallback personality response
          const fallbackPersonality = {
            mood: 'dormant',
            energy: 50,
            sound: '*sleepy chirp*',
            movement: 'slow breathing',
            memory: 'resting peacefully',
          };

          res.json({
            personality: fallbackPersonality,
            timestamp: Date.now(),
            cached: false,
          });
          return;
        }

        // Check privacy consent
        const consentKey = `privacy:consent:${validatedUsername}`;
        const hasConsent = await safeRedisOperation(() => redis.get(consentKey), null, 3);

        if (!hasConsent || hasConsent !== 'true') {
          // Return fallback personality without LLM
          const fallbackPersonality = {
            mood: 'neutral',
            energy: 60,
            sound: '*quiet sounds*',
            movement: 'gentle swaying',
          };

          res.json({
            personality: fallbackPersonality,
            timestamp: Date.now(),
            cached: false,
          });
          return;
        }

        // Build context for LLM
        const mutationContext = await contextBuilder.buildMutationContext(
          validatedUsername,
          validatedCreatureId
        );

        // Check cache first
        const cacheKey = `personality:${validatedCreatureId}:${eventType}:${Date.now() - (Date.now() % 600000)}`; // 10-minute cache buckets
        const cachedPersonality = await safeRedisOperation(() => redis.get(cacheKey), null, 3);

        if (cachedPersonality) {
          res.json({
            personality: JSON.parse(cachedPersonality),
            timestamp: Date.now(),
            cached: true,
          });
          return;
        }

        // Get recent interactions for better context
        const recentInteractions = await getRecentInteractions(validatedCreatureId);

        // Convert MutationContext to CreatureContext for our new GeminiService
        const creatureContext = {
          creatureId: mutationContext.creatureId,
          age: mutationContext.mutations.length * 10, // Rough age estimate based on mutations
          stats: mutationContext.stats,
          recentInteractions,
          ...(mutationContext.activityCategory
            ? { subredditTheme: mutationContext.activityCategory }
            : {}),
          eventType,
          ...(eventContext ? { eventContext } : {}),
        };

        // Generate personality using our new GeminiService
        const personality = await service.generatePersonality(creatureContext);

        // Handle null response (fallback to default personality)
        if (!personality) {
          console.warn(
            `[PersonalityAPI] Gemini service returned null for creature ${validatedCreatureId}, using fallback`
          );
          const fallbackPersonality = {
            mood: 'neutral',
            energy: Math.max(20, Math.min(80, mutationContext.stats.vitals.energy || 50)),
            sound: '*soft chirp*',
            movement: 'gentle swaying',
          };

          res.json({
            personality: fallbackPersonality,
            timestamp: Date.now(),
            cached: false,
          });
          return;
        }

        // Store in Redis with creature ID and TTL
        const personalityKey = `creature:${validatedCreatureId}:personality`;
        await safeRedisOperation(
          () =>
            redis.hSet(personalityKey, {
              mood: personality.mood,
              energy: personality.energy.toString(),
              sound: personality.sound,
              movement: personality.movement,
              memory: personality.memory_formed || '',
              timestamp: Date.now().toString(),
            }),
          undefined,
          3
        );

        // Set 1-hour TTL for personality data
        await safeRedisOperation(() => redis.expire(personalityKey, 3600), undefined, 3);

        // Cache the response for 10 minutes
        await safeRedisOperation(
          () => redis.set(cacheKey, JSON.stringify(personality)),
          undefined,
          3
        );
        await safeRedisOperation(() => redis.expire(cacheKey, 600), undefined, 3);

        // Record this interaction for future context
        const interactionDescription = `${eventType}${eventContext?.careAction ? ` (${eventContext.careAction})` : ''}`;
        await recordInteraction(validatedCreatureId, interactionDescription);

        // Convert our CreaturePersonality to the expected API response format
        const personalityResponse = {
          mood: personality.mood,
          energy: personality.energy,
          sound: personality.sound,
          movement: personality.movement,
          ...(personality.memory_formed ? { memory: personality.memory_formed } : {}),
        };

        res.json({
          personality: personalityResponse,
          timestamp: Date.now(),
          cached: false,
        });
      } catch (error) {
        console.error('Error in /api/creature/interact:', error);

        if (error instanceof ValidationError) {
          res.status(400).json({ error: error.message });
          return;
        }

        // Return fallback personality on any error
        const fallbackPersonality = {
          mood: 'confused',
          energy: 40,
          sound: '*uncertain chirp*',
          movement: 'hesitant movements',
        };

        res.status(200).json({
          personality: fallbackPersonality,
          timestamp: Date.now(),
          cached: false,
        });
      }
    }
  );

  /**
   * Test endpoint for LLM integration
   * Allows testing the Gemini service with sample data
   */
  router.post('/api/test/personality', async (req, res): Promise<void> => {
    try {
      const { service } = await initializeGeminiServices();
      if (!service) {
        res.status(503).json({ error: 'Gemini service not available' });
        return;
      }

      // Create test creature context
      const testContext = {
        creatureId: 'test_creature_001',
        age: 25,
        stats: {
          mobility: { speed: 60, agility: 70, endurance: 50 },
          senses: { vision: 80, hearing: 60, smell: 40 },
          survival: { attack: 30, defense: 70, stealth: 50 },
          cognition: { intelligence: 65, social: 80, adaptability: 75 },
          vitals: { health: 85, happiness: 90, energy: 75 },
        },
        recentInteractions: ['feeding', 'playing'],
        subredditTheme: 'space exploration',
        eventType: 'feeding' as const,
        eventContext: { careAction: 'feed' },
      };

      console.log('[Test] Testing Gemini service with sample data...');
      const personality = await service.generatePersonality(testContext);

      if (personality) {
        res.json({
          success: true,
          personality,
          testContext,
        });
      } else {
        res.json({
          success: false,
          error: 'Gemini service returned null',
          testContext,
        });
      }
    } catch (error) {
      console.error('Test endpoint error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * Get creature personality state
   * Returns current personality data from Redis
   */
  router.get<{ creatureId: string }, CreaturePersonalityStateResponse | ErrorResponse>(
    '/api/creature/personality/:creatureId',
    async (req, res): Promise<void> => {
      try {
        const { creatureId } = req.params;

        if (!creatureId) {
          res.status(400).json({ error: 'Creature ID is required' });
          return;
        }

        // Validate creature ID
        const validatedCreatureId = validateCreatureId(creatureId);

        // Get personality data from Redis
        const personalityKey = `creature:${validatedCreatureId}:personality`;
        const personalityData = await safeRedisOperation(
          () => redis.hGetAll(personalityKey),
          {},
          3
        );

        let personality = null;
        if (personalityData && personalityData.mood) {
          personality = {
            mood: personalityData.mood,
            energy: parseInt(personalityData.energy || '50'),
            sound: personalityData.sound || '*quiet sounds*',
            movement: personalityData.movement || 'gentle swaying',
            ...(personalityData.memory && personalityData.memory !== ''
              ? { memory: personalityData.memory }
              : {}),
          };
        }

        res.json({
          personality,
          timestamp: Date.now(),
          creatureId: validatedCreatureId,
        });
      } catch (error) {
        console.error('Error in /api/creature/personality:', error);

        if (error instanceof ValidationError) {
          res.status(400).json({ error: error.message });
          return;
        }

        res.status(500).json({
          error: error instanceof Error ? error.message : 'Failed to get creature personality',
        });
      }
    }
  );

  /**
   * Privacy consent endpoint
   * Stores user consent for AI features
   */
  router.post<unknown, PrivacyConsentResponse | ErrorResponse, PrivacyConsentRequest>(
    '/api/privacy/consent',
    async (req, res): Promise<void> => {
      try {
        // Get userId from Reddit context with dev fallback
        const username = await getUsernameWithFallback();
        const validatedUsername = validateUsername(username);

        const { consent } = req.body;

        if (typeof consent !== 'boolean') {
          res.status(400).json({ error: 'consent must be a boolean value' });
          return;
        }

        // Store consent in Redis
        const consentKey = `privacy:consent:${validatedUsername}`;
        await safeRedisOperation(() => redis.set(consentKey, consent.toString()), undefined, 3);

        // Log consent for compliance auditing
        console.log(`Privacy consent updated for user ${validatedUsername}: ${consent}`);

        res.json({
          success: true,
          consentStatus: consent,
        });
      } catch (error) {
        console.error('Error in /api/privacy/consent:', error);

        if (error instanceof ValidationError) {
          res.status(400).json({ error: error.message });
          return;
        }

        res.status(500).json({
          error: error instanceof Error ? error.message : 'Failed to update privacy consent',
        });
      }
    }
  );

  // ============================================================================
  // Privacy API Endpoints
  // ============================================================================

  /**
   * Set privacy opt-in preference
   * Controls whether user's Reddit activity influences familiar mutations
   */
  router.post<unknown, PrivacyOptInResponse | ErrorResponse, PrivacyOptInRequest>(
    '/api/privacy/opt-in',
    async (req, res): Promise<void> => {
      try {
        // Get userId from Reddit context with dev fallback
        const username = await getUsernameWithFallback();

        // Validate username
        const validatedUsername = validateUsername(username);

        const { optIn } = req.body;

        if (typeof optIn !== 'boolean') {
          res.status(400).json({ error: 'optIn must be a boolean value' });
          return;
        }

        // Validate boolean
        const validatedOptIn = validateBoolean(optIn);

        // Set privacy preference
        await activityTracker.setPrivacyOptIn(validatedUsername, validatedOptIn);

        res.json({
          success: true,
          privacyOptIn: validatedOptIn,
        });
      } catch (error) {
        console.error('Error in /api/privacy/opt-in:', error);

        if (error instanceof ValidationError) {
          res.status(400).json({ error: error.message });
          return;
        }

        res.status(500).json({
          error: error instanceof Error ? error.message : 'Failed to set privacy preference',
        });
      }
    }
  );

  // ============================================================================
  // Scheduler Endpoints
  // ============================================================================

  /**
   * Handle evolution cycle event
   * Triggered by Devvit scheduler at random intervals (30 min - 4 hours)
   */
  router.post('/internal/scheduler/evolution-cycle', async (req, res): Promise<void> => {
    try {
      const { userId } = req.body as { userId?: string };

      if (!userId) {
        console.error('Evolution cycle handler: userId missing from request body');
        res.status(400).json({ status: 'error', message: 'userId is required' });
        return;
      }

      // Validate userId
      const validatedUserId = validateUsername(userId);

      console.log(`Evolution cycle triggered for user ${validatedUserId}`);

      // Handle evolution cycle
      await evolutionScheduler.handleEvolutionCycle(validatedUserId);

      res.status(200).json({ status: 'ok' });
    } catch (error) {
      console.error('Error in evolution cycle handler:', error);

      if (error instanceof ValidationError) {
        res.status(400).json({ status: 'error', message: error.message });
        return;
      }

      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to handle evolution cycle',
      });
    }
  });

  /**
   * Handle care meter decay event
   * Triggered by Devvit scheduler every hour
   */
  router.post('/internal/scheduler/care-decay', async (req, res): Promise<void> => {
    try {
      const { userId } = req.body as { userId?: string };

      if (!userId) {
        console.error('Care decay handler: userId missing from request body');
        res.status(400).json({ status: 'error', message: 'userId is required' });
        return;
      }

      // Validate userId
      const validatedUserId = validateUsername(userId);

      console.log(`Care decay triggered for user ${validatedUserId}`);

      // Handle care decay
      await evolutionScheduler.handleCareDecay(validatedUserId);

      res.status(200).json({ status: 'ok' });
    } catch (error) {
      console.error('Error in care decay handler:', error);

      if (error instanceof ValidationError) {
        res.status(400).json({ status: 'error', message: error.message });
        return;
      }

      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to handle care decay',
      });
    }
  });

  // ============================================================================
  // Debug/Test Endpoints
  // ============================================================================

  /**
   * Test Gemini API integration
   * Remove this endpoint before production deployment
   */
  router.get('/api/test/gemini', async (_req, res): Promise<void> => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
        return;
      }

      const processor = new (await import('./llm/gemini-processor')).GeminiProcessor(apiKey);

      // Create proper MutationData objects for test endpoint
      const mockMutations = [
        {
          id: 'mut_test_legacy_1',
          type: 'controlled' as const,
          traits: [{ category: 'legs', value: 4, randomnessFactor: 0.9 }],
          statEffects: { mobility: { speed: 10 } },
          timestamp: 1234567890,
        },
        {
          id: 'mut_test_legacy_2',
          type: 'controlled' as const,
          traits: [{ category: 'color', value: '#ff0000', randomnessFactor: 0.9 }],
          statEffects: { vitals: { happiness: 5 } },
          timestamp: 1234567891,
        },
      ];

      const mockContext = {
        stats: {
          mobility: { speed: 65, agility: 70, endurance: 50 },
          senses: { vision: 55, hearing: 50, smell: 45 },
          survival: { attack: 60, defense: 55, stealth: 50 },
          cognition: { intelligence: 50, social: 50, adaptability: 50 },
          vitals: { health: 100, happiness: 85, energy: 90 },
        },
        mutations: mockMutations,
        biome: 'jungle' as const,
        activityCategory: 'gaming',
        creatureId: 'familiar:test123',
      };

      const options = await processor.generateMutationOptions(mockContext);

      res.json({
        success: true,
        options,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Gemini test failed:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Gemini test failed',
      });
    }
  });

  // ============================================================================
  // Legacy API Endpoints (from template)
  // ============================================================================

  router.get<{ postId: string }, InitResponse | { status: string; message: string }>(
    '/api/init',
    async (_req, res): Promise<void> => {
      const { postId } = context;

      if (!postId) {
        console.error('API Init Error: postId not found in devvit context');
        res.status(400).json({
          status: 'error',
          message: 'postId is required but missing from context',
        });
        return;
      }

      try {
        const [count, username] = await Promise.all([
          redis.get('count'),
          reddit.getCurrentUsername(),
        ]);

        res.json({
          type: 'init',
          postId: postId,
          count: count ? parseInt(count) : 0,
          username: username ?? 'anonymous',
        });
      } catch (error) {
        console.error(`API Init Error for post ${postId}:`, error);
        let errorMessage = 'Unknown error during initialization';
        if (error instanceof Error) {
          errorMessage = `Initialization failed: ${error.message}`;
        }
        res.status(400).json({ status: 'error', message: errorMessage });
      }
    }
  );

  router.post<{ postId: string }, IncrementResponse | { status: string; message: string }, unknown>(
    '/api/increment',
    async (_req, res): Promise<void> => {
      const { postId } = context;
      if (!postId) {
        res.status(400).json({
          status: 'error',
          message: 'postId is required',
        });
        return;
      }

      res.json({
        count: await redis.incrBy('count', 1),
        postId,
        type: 'increment',
      });
    }
  );

  router.post<{ postId: string }, DecrementResponse | { status: string; message: string }, unknown>(
    '/api/decrement',
    async (_req, res): Promise<void> => {
      const { postId } = context;
      if (!postId) {
        res.status(400).json({
          status: 'error',
          message: 'postId is required',
        });
        return;
      }

      res.json({
        count: await redis.incrBy('count', -1),
        postId,
        type: 'decrement',
      });
    }
  );

  router.post('/internal/on-app-install', async (_req, res): Promise<void> => {
    try {
      const post = await createPost();

      res.json({
        status: 'success',
        message: `Post created in subreddit ${context.subredditName} with id ${post.id}`,
      });
    } catch (error) {
      console.error(`Error creating post: ${error}`);
      res.status(400).json({
        status: 'error',
        message: 'Failed to create post',
      });
    }
  });

  router.post('/internal/menu/post-create', async (_req, res): Promise<void> => {
    try {
      const post = await createPost();

      res.json({
        navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
      });
    } catch (error) {
      console.error(`Error creating post: ${error}`);
      res.status(400).json({
        status: 'error',
        message: 'Failed to create post',
      });
    }
  });

  // Test endpoint to manually create a post
  router.post('/api/test/create-post', async (_req, res): Promise<void> => {
    try {
      console.log('[TEST] Manually creating post...');
      const post = await createPost();

      res.json({
        success: true,
        postId: post.id,
        url: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
      });
    } catch (error) {
      console.error(`Error in test post creation: ${error}`);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create post',
      });
    }
  });

  // Test endpoint to clear Redis data
  router.post('/api/test/clear-redis', async (_req, res): Promise<void> => {
    try {
      console.log('[TEST] Clearing Redis data...');
      
      // Get username for user-specific data
      const username = await getUsernameWithFallback();
      
      // Clear familiar data
      const familiarKey = `familiar:${username}`;
      await redis.del(familiarKey);
      
      // Clear privacy consent
      const consentKey = `privacy:consent:${username}`;
      await redis.del(consentKey);
      
      // Clear other common keys (without using keys() method)
      const keysToTry = [
        `mutation:cache:${username}`,
        `creature:${username}:personality`,
        `activity:${username}`,
        `behavior:${username}`,
        `cooldown:${username}:feed`,
        `cooldown:${username}:play`,
        `cooldown:${username}:attention`
      ];
      
      for (const key of keysToTry) {
        try {
          await redis.del(key);
        } catch (error) {
          // Ignore errors for keys that don't exist
        }
      }
      
      console.log('[TEST] Redis data cleared successfully');
      
      res.json({
        success: true,
        message: 'Redis data cleared successfully',
        clearedKeys: {
          familiar: familiarKey,
          consent: consentKey,
          attempted: keysToTry.length
        }
      });
    } catch (error) {
      console.error(`Error clearing Redis: ${error}`);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear Redis',
      });
    }
  });

  app.use(router);

  const server = createServer(app);
  server.on('error', (err) => console.error(`server error; ${err.stack}`));
  server.listen(getServerPort());
})();
