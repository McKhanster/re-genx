import express from 'express';
import {
  InitResponse,
  IncrementResponse,
  DecrementResponse,
  GroupStatusResponse,
  ErrorResponse,
} from '../shared/types/api';
import { redis, reddit, createServer, context, getServerPort } from '@devvit/web/server';
import { createPost } from './core/post';
import { GroupManager } from './core/group-manager';

const app = express();

// Middleware for JSON body parsing
app.use(express.json());
// Middleware for URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));
// Middleware for plain text body parsing
app.use(express.text());

const router = express.Router();

// Initialize GroupManager
const groupManager = new GroupManager(redis);

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
