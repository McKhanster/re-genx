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

const app = express();

// Middleware for JSON body parsing
app.use(express.json());
// Middleware for URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));
// Middleware for plain text body parsing
app.use(express.text());

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
      // Get userId from Reddit context
      const username = await reddit.getCurrentUsername();
      if (!username) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

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

    // Fetch creature data from Redis
    const creatureData = await groupManager.getCreatureState(creatureId);

    if (!creatureData) {
      res.status(404).json({ error: 'Creature not found' });
      return;
    }

    res.json(creatureData);
  } catch (error) {
    console.error('Error in /api/creature/state:', error);
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
      // Get userId from Reddit context
      const username = await reddit.getCurrentUsername();
      if (!username) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Get familiar state
      const familiar = await familiarManager.getFamiliar(username);

      res.json({ familiar });
    } catch (error) {
      console.error('Error in /api/familiar/state:', error);
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
      // Get userId from Reddit context
      const username = await reddit.getCurrentUsername();
      if (!username) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Create familiar
      const familiar = await familiarManager.createFamiliar(username);

      // Schedule first evolution cycle and care decay
      try {
        await evolutionScheduler.scheduleEvolutionCycle(username);
        await evolutionScheduler.scheduleCareDecay(username);
      } catch (scheduleError) {
        console.error('Error scheduling evolution cycle or care decay:', scheduleError);
        // Don't fail the request if scheduling fails
      }

      res.json({ familiar });
    } catch (error) {
      console.error('Error in /api/familiar/create:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to create familiar',
      });
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
      // Get userId from Reddit context
      const username = await reddit.getCurrentUsername();
      if (!username) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Perform care action
      const result = await careSystem.performCareAction(username, 'feed');

      res.json(result);
    } catch (error) {
      console.error('Error in /api/care/feed:', error);
      
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
      // Get userId from Reddit context
      const username = await reddit.getCurrentUsername();
      if (!username) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Perform care action
      const result = await careSystem.performCareAction(username, 'play');

      res.json(result);
    } catch (error) {
      console.error('Error in /api/care/play:', error);
      
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
      // Get userId from Reddit context
      const username = await reddit.getCurrentUsername();
      if (!username) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Perform care action
      const result = await careSystem.performCareAction(username, 'attention');

      res.json(result);
    } catch (error) {
      console.error('Error in /api/care/attention:', error);
      
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
      // Get userId from Reddit context
      const username = await reddit.getCurrentUsername();
      if (!username) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Trigger controlled mutation
      const mutationChoice = await mutationEngine.triggerControlledMutation(username);

      res.json({
        sessionId: mutationChoice.sessionId,
        options: mutationChoice.options,
      });
    } catch (error) {
      console.error('Error in /api/mutation/trigger:', error);
      
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
      // Get userId from Reddit context
      const username = await reddit.getCurrentUsername();
      if (!username) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { sessionId, optionId } = req.body;

      if (!sessionId || !optionId) {
        res.status(400).json({ error: 'sessionId and optionId are required' });
        return;
      }

      // Apply chosen mutation
      const mutation = await mutationEngine.applyChosenMutation(sessionId, optionId);

      // Get updated familiar state to return updated stats
      const familiar = await familiarManager.getFamiliar(username);

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
      // Get userId from Reddit context
      const username = await reddit.getCurrentUsername();
      if (!username) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { optIn } = req.body;

      if (typeof optIn !== 'boolean') {
        res.status(400).json({ error: 'optIn must be a boolean value' });
        return;
      }

      // Set privacy preference
      await activityTracker.setPrivacyOptIn(username, optIn);

      res.json({
        success: true,
        privacyOptIn: optIn,
      });
    } catch (error) {
      console.error('Error in /api/privacy/opt-in:', error);
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

    console.log(`Evolution cycle triggered for user ${userId}`);

    // Handle evolution cycle
    await evolutionScheduler.handleEvolutionCycle(userId);

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Error in evolution cycle handler:', error);
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

    console.log(`Care decay triggered for user ${userId}`);

    // Handle care decay
    await evolutionScheduler.handleCareDecay(userId);

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Error in care decay handler:', error);
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
