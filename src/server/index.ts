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
      await redis.hset(familiarId, {
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
 * Costs 100 Evolution Points and returns trait options for player to choose
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

app.use(router);

const server = createServer(app);
server.on('error', (err) => console.error(`server error; ${err.stack}`));
server.listen(getServerPort());
