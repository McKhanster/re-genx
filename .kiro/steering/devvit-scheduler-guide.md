---
inclusion: fileMatch
fileMatchPattern: 'src/server/**/*.ts'
---

# Devvit Scheduler Guide for Re-GenX

This steering file provides guidance on using Devvit's scheduler for time-based events in Re-GenX.

## When to Use Scheduler

Use Devvit scheduler for:

- **Uncontrolled mutations** - Trigger random mutations periodically
- **Creature aging** - Increment age every hour
- **Voting closure** - Automatically close voting sessions
- **Behavior analysis** - Update group behavior profiles daily
- **Cleanup tasks** - Remove expired data

## Basic Scheduler Setup

```typescript
import { Devvit } from '@devvit/public-api';

// Define job handlers
Devvit.addSchedulerJob({
  name: 'trigger-uncontrolled-mutation',
  onRun: async (event, context) => {
    const { redis } = context;
    const { creatureId } = event.data;

    try {
      // Trigger random mutation
      const mutation = await generateRandomMutation(creatureId);
      await applyMutation(creatureId, mutation);

      // Notify group
      const creature = await getCreature(creatureId);
      await notifyGroupMembers(creature.groupId, {
        type: 'uncontrolled_mutation',
        mutation,
      });
    } catch (error) {
      console.error('Failed to trigger mutation:', error);
    }
  },
});
```

## Scheduling Jobs

### One-Time Job

```typescript
// Schedule voting closure
async function scheduleVotingClosure(
  sessionId: string,
  durationMs: number,
  context: Devvit.Context
): Promise<void> {
  await context.scheduler.runJob({
    name: 'close-voting',
    data: { sessionId },
    runAt: new Date(Date.now() + durationMs),
  });
}
```

### Recurring Job

```typescript
// Schedule periodic mutations
async function schedulePeriodicMutations(
  creatureId: string,
  context: Devvit.Context
): Promise<void> {
  await context.scheduler.runJob({
    name: 'trigger-uncontrolled-mutation',
    data: { creatureId },
    cron: '0 */6 * * *', // Every 6 hours
  });
}
```

## Cron Patterns

```typescript
// Every hour
cron: '0 * * * *';

// Every 6 hours
cron: '0 */6 * * *';

// Daily at midnight
cron: '0 0 * * *';

// Every 15 minutes
cron: '*/15 * * * *';

// Twice daily (8am and 8pm)
cron: '0 8,20 * * *';
```

## Re-GenX-Specific Scheduler Jobs

### 1. Uncontrolled Mutation Trigger

```typescript
Devvit.addSchedulerJob({
  name: 'trigger-uncontrolled-mutation',
  onRun: async (event, context) => {
    const { redis } = context;
    const { creatureId } = event.data;

    // Check if creature still exists
    const creature = await redis.hgetall(`creature:${creatureId}`);
    if (!creature) {
      console.log(`Creature ${creatureId} no longer exists`);
      return;
    }

    // Check if there's an active voting session
    const activeVoting = await redis.keys(`voting:*`);
    const hasActiveVoting = activeVoting.some(
      (key) => key.includes(creatureId) && redis.hget(key, 'status') === 'active'
    );

    if (hasActiveVoting) {
      console.log('Skipping mutation - voting in progress');
      return;
    }

    // Generate and apply random mutation
    const mutationEngine = new MutationEngine(redis);
    const mutation = await mutationEngine.triggerUncontrolledMutation(creatureId);

    // Notify group
    await notifyGroupMembers(creature.groupId, {
      type: 'uncontrolled_mutation',
      mutation,
      creatureId,
    });

    // Schedule next mutation (random interval 4-8 hours)
    const nextInterval = (4 + Math.random() * 4) * 60 * 60 * 1000;
    await context.scheduler.runJob({
      name: 'trigger-uncontrolled-mutation',
      data: { creatureId },
      runAt: new Date(Date.now() + nextInterval),
    });
  },
});
```

### 2. Creature Aging

```typescript
Devvit.addSchedulerJob({
  name: 'age-creature',
  onRun: async (event, context) => {
    const { redis } = context;
    const { creatureId } = event.data;

    // Increment age
    await redis.hincrby(`creature:${creatureId}`, 'age', 1);

    // Check health degradation
    const age = parseInt(await redis.hget(`creature:${creatureId}`, 'age'));
    if (age > 100) {
      // Older creatures lose health
      await redis.hincrby(`creature:${creatureId}`, 'health', -1);
    }

    // Schedule next aging
    await context.scheduler.runJob({
      name: 'age-creature',
      data: { creatureId },
      runAt: new Date(Date.now() + 3600000), // 1 hour
    });
  },
});
```

### 3. Voting Closure

```typescript
Devvit.addSchedulerJob({
  name: 'close-voting',
  onRun: async (event, context) => {
    const { redis } = context;
    const { sessionId } = event.data;

    const session = await redis.hgetall(`voting:${sessionId}`);
    if (!session || session.status !== 'active') {
      return;
    }

    // Close voting and determine winner
    const votingManager = new VotingManager(redis);
    const winningOption = await votingManager.closeVoting(sessionId);

    // Apply mutation
    const mutationEngine = new MutationEngine(redis);
    await mutationEngine.applyMutationResult(session.creatureId, winningOption);

    // Update session status
    await redis.hset(`voting:${sessionId}`, 'status', 'applied');

    // Notify group
    await notifyGroupMembers(session.groupId, {
      type: 'voting_closed',
      winningOption,
      sessionId,
    });
  },
});
```

### 4. Behavior Analysis Update

```typescript
Devvit.addSchedulerJob({
  name: 'update-behavior-profile',
  onRun: async (event, context) => {
    const { redis, reddit } = context;
    const { groupId } = event.data;

    // Get group members
    const memberIds = await redis.smembers(`group:${groupId}:members`);

    // Analyze behavior for each member
    const behaviorAnalyzer = new BehaviorAnalyzer(redis, reddit);
    const profile = await behaviorAnalyzer.analyzeGroupBehavior(groupId);

    // Store updated profile
    await redis.hset(`behavior:${groupId}`, profile);
    await redis.set(`behavior:${groupId}:updated`, Date.now());

    // Schedule next update (daily)
    await context.scheduler.runJob({
      name: 'update-behavior-profile',
      data: { groupId },
      runAt: new Date(Date.now() + 86400000), // 24 hours
    });
  },
});
```

### 5. Cleanup Expired Data

```typescript
Devvit.addSchedulerJob({
  name: 'cleanup-expired-data',
  onRun: async (event, context) => {
    const { redis } = context;

    // Clean up old voting sessions
    const votingKeys = await redis.keys('voting:*');
    const now = Date.now();

    for (const key of votingKeys) {
      if (key.includes(':votes') || key.includes(':counts')) continue;

      const session = await redis.hgetall(key);
      if (session.endTime && parseInt(session.endTime) < now - 3600000) {
        // Delete session and related data
        await redis.del(key);
        await redis.del(`${key}:votes`);
        await redis.del(`${key}:counts`);
      }
    }

    // Clean up old notifications (keep last 50 per user)
    const userKeys = await redis.keys('user:*:notifications');
    for (const key of userKeys) {
      await redis.ltrim(key, -50, -1);
    }

    // Schedule next cleanup (daily)
    await context.scheduler.runJob({
      name: 'cleanup-expired-data',
      data: {},
      runAt: new Date(Date.now() + 86400000),
    });
  },
});
```

## Initializing Scheduler Jobs

When a creature is created, schedule its recurring jobs:

```typescript
async function initializeCreatureScheduler(
  creatureId: string,
  context: Devvit.Context
): Promise<void> {
  // Schedule first uncontrolled mutation (6-12 hours from now)
  const firstMutationDelay = (6 + Math.random() * 6) * 60 * 60 * 1000;
  await context.scheduler.runJob({
    name: 'trigger-uncontrolled-mutation',
    data: { creatureId },
    runAt: new Date(Date.now() + firstMutationDelay),
  });

  // Schedule hourly aging
  await context.scheduler.runJob({
    name: 'age-creature',
    data: { creatureId },
    runAt: new Date(Date.now() + 3600000), // 1 hour
  });
}

async function initializeGroupScheduler(groupId: string, context: Devvit.Context): Promise<void> {
  // Schedule daily behavior analysis
  await context.scheduler.runJob({
    name: 'update-behavior-profile',
    data: { groupId },
    runAt: new Date(Date.now() + 86400000), // 24 hours
  });
}
```

## Error Handling in Scheduler Jobs

```typescript
Devvit.addSchedulerJob({
  name: 'example-job',
  onRun: async (event, context) => {
    try {
      // Job logic here
    } catch (error) {
      console.error('Job failed:', error);

      // Optionally retry
      if (event.data.retryCount < 3) {
        await context.scheduler.runJob({
          name: 'example-job',
          data: {
            ...event.data,
            retryCount: (event.data.retryCount || 0) + 1,
          },
          runAt: new Date(Date.now() + 60000), // Retry in 1 minute
        });
      }
    }
  },
});
```

## Canceling Scheduled Jobs

```typescript
// Note: Devvit doesn't have built-in job cancellation
// Instead, check if the job should run at execution time

Devvit.addSchedulerJob({
  name: 'example-job',
  onRun: async (event, context) => {
    const { redis } = context;
    const { creatureId } = event.data;

    // Check if creature still exists
    const exists = await redis.exists(`creature:${creatureId}`);
    if (!exists) {
      console.log('Creature no longer exists, skipping job');
      return; // Don't reschedule
    }

    // Continue with job logic...
  },
});
```

## Testing Scheduler Jobs

```typescript
// For testing, use shorter intervals
const isDevelopment = process.env.NODE_ENV === 'development';

const mutationInterval = isDevelopment
  ? 60000 // 1 minute for testing
  : 6 * 60 * 60 * 1000; // 6 hours for production

await context.scheduler.runJob({
  name: 'trigger-uncontrolled-mutation',
  data: { creatureId },
  runAt: new Date(Date.now() + mutationInterval),
});
```

## Best Practices

1. **Always check if resources exist** - Creatures/groups may be deleted
2. **Use exponential backoff for retries** - Don't hammer Redis
3. **Keep job handlers lightweight** - They have time limits
4. **Log errors comprehensively** - Debugging scheduled jobs is hard
5. **Use random intervals** - Avoid thundering herd problems
6. **Clean up after yourself** - Don't leave orphaned scheduled jobs
7. **Test with short intervals** - Then switch to production timing
8. **Handle concurrent jobs gracefully** - Multiple jobs may run simultaneously
