---
inclusion: fileMatch
fileMatchPattern: 'src/server/**/*.ts'
---

# Redis Patterns for Re-GenX

This steering file provides Redis-specific patterns and best practices for the Re-GenX game backend.

## Re-GenX Redis Schema Reference

Always follow the schema defined in `.kiro/specs/regenx-mvp/design.md`. Here's a quick reference:

```
# Waiting Rooms
waitingroom:{subredditId}:current -> Set<userId>
waitingroom:{subredditId}:count -> Integer

# Creatures
creature:{creatureId} -> Hash
creature:{creatureId}:mutations -> List<CreatureMutation>

# Groups
group:{groupId} -> Hash
group:{groupId}:members -> Set<userId>
user:{userId}:group -> String (groupId)

# Voting Sessions
voting:{sessionId} -> Hash
voting:{sessionId}:votes -> Hash (userId -> optionId)
voting:{sessionId}:counts -> Hash (optionId -> count)

# Behavior Profiles
behavior:{groupId} -> Hash
behavior:{groupId}:updated -> Timestamp

# Subreddit Capacity
subreddit:{subredditId}:capacity -> Integer
subreddit:{subredditId}:creatures -> Set<creatureId>
```

## Error Handling Pattern

Always use retry logic for Redis operations:

```typescript
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

// Usage
const creature = await safeRedisOperation(() => redis.hgetall(`creature:${creatureId}`), null, 3);
```

## Atomic Operations

Use transactions for operations that must be atomic:

```typescript
// Example: Creating a creature when waiting room fills
async function checkAndCreateCreature(roomId: string): Promise<Creature | null> {
  const subredditId = roomId.split(':')[1];
  const key = `waitingroom:${subredditId}:current`;

  // Use WATCH for optimistic locking
  await redis.watch(key);

  const members = await redis.smembers(key);

  if (members.length === 25) {
    const multi = redis.multi();

    // Create group
    const groupId = generateId();
    multi.hset(`group:${groupId}`, {
      id: groupId,
      karmaPool: 0,
      geneticShots: 0,
      createdAt: Date.now(),
    });

    // Add members
    members.forEach((userId) => {
      multi.sadd(`group:${groupId}:members`, userId);
      multi.set(`user:${userId}:group`, groupId);
    });

    // Create creature
    const creatureId = generateId();
    multi.hset(`creature:${creatureId}`, {
      id: creatureId,
      groupId,
      generation: 1,
      age: 0,
      health: 100,
      environment: 'void',
      createdAt: Date.now(),
    });

    // Clear waiting room
    multi.del(key);
    multi.set(`waitingroom:${subredditId}:count`, 0);

    // Execute transaction
    await multi.exec();

    return { id: creatureId, groupId /* ... */ };
  }

  await redis.unwatch();
  return null;
}
```

## Batch Operations

Use pipelines for multiple independent operations:

```typescript
async function updateCreatureStats(
  creatureId: string,
  stats: Partial<CreatureStats>
): Promise<void> {
  const pipeline = redis.pipeline();

  Object.entries(stats).forEach(([key, value]) => {
    pipeline.hset(`creature:${creatureId}`, key, value);
  });

  await pipeline.exec();
}
```

## List Operations for Mutations

Mutations are stored as a list (ordered):

```typescript
// Add mutation
async function addMutation(creatureId: string, mutation: CreatureMutation): Promise<void> {
  await redis.rpush(`creature:${creatureId}:mutations`, JSON.stringify(mutation));
}

// Get all mutations
async function getMutations(creatureId: string): Promise<CreatureMutation[]> {
  const mutations = await redis.lrange(`creature:${creatureId}:mutations`, 0, -1);
  return mutations.map((m) => JSON.parse(m));
}

// Get recent mutations (last 10)
async function getRecentMutations(creatureId: string): Promise<CreatureMutation[]> {
  const mutations = await redis.lrange(`creature:${creatureId}:mutations`, -10, -1);
  return mutations.map((m) => JSON.parse(m));
}
```

## Set Operations for Groups

Use sets for group membership (efficient lookups):

```typescript
// Check if user is in a group
async function isGroupMember(groupId: string, userId: string): Promise<boolean> {
  return await redis.sismember(`group:${groupId}:members`, userId);
}

// Get all group members
async function getGroupMembers(groupId: string): Promise<string[]> {
  return await redis.smembers(`group:${groupId}:members`);
}

// Count group members
async function getGroupSize(groupId: string): Promise<number> {
  return await redis.scard(`group:${groupId}:members`);
}
```

## Voting with Hash Operations

Efficient vote counting using hashes:

```typescript
async function castVote(sessionId: string, userId: string, optionId: string): Promise<void> {
  // Check if user already voted
  const existingVote = await redis.hget(`voting:${sessionId}:votes`, userId);

  const multi = redis.multi();

  if (existingVote) {
    // Decrement old option count
    multi.hincrby(`voting:${sessionId}:counts`, existingVote, -1);
  }

  // Set new vote
  multi.hset(`voting:${sessionId}:votes`, userId, optionId);

  // Increment new option count
  multi.hincrby(`voting:${sessionId}:counts`, optionId, 1);

  await multi.exec();
}

// Get vote counts
async function getVoteCounts(sessionId: string): Promise<Record<string, number>> {
  return await redis.hgetall(`voting:${sessionId}:counts`);
}

// Get winning option
async function getWinningOption(sessionId: string): Promise<string> {
  const counts = await redis.hgetall(`voting:${sessionId}:counts`);

  let maxVotes = 0;
  let winner = '';

  Object.entries(counts).forEach(([optionId, count]) => {
    const voteCount = parseInt(count as string);
    if (voteCount > maxVotes) {
      maxVotes = voteCount;
      winner = optionId;
    }
  });

  return winner;
}
```

## TTL for Temporary Data

Use expiration for voting sessions and temporary data:

```typescript
async function createVotingSession(
  creatureId: string,
  options: MutationOption[],
  durationMs: number
): Promise<VotingSession> {
  const sessionId = generateId();
  const session = {
    id: sessionId,
    creatureId,
    optionsJson: JSON.stringify(options),
    startTime: Date.now(),
    endTime: Date.now() + durationMs,
    status: 'active',
  };

  const multi = redis.multi();

  // Store session with TTL
  multi.hset(`voting:${sessionId}`, session);
  multi.expire(`voting:${sessionId}`, Math.ceil(durationMs / 1000) + 60); // +60s buffer

  // Initialize vote counts
  options.forEach((option) => {
    multi.hset(`voting:${sessionId}:counts`, option.id, 0);
  });
  multi.expire(`voting:${sessionId}:counts`, Math.ceil(durationMs / 1000) + 60);

  // Initialize votes hash
  multi.hset(`voting:${sessionId}:votes`, '_init', '1');
  multi.expire(`voting:${sessionId}:votes`, Math.ceil(durationMs / 1000) + 60);

  await multi.exec();

  return session;
}
```

## Caching Pattern

Implement simple caching for frequently accessed data:

```typescript
class RedisCache {
  private cache = new Map<string, { data: any; expires: number }>();

  async get<T>(key: string, fetcher: () => Promise<T>, ttlMs = 5000): Promise<T> {
    const cached = this.cache.get(key);

    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    const data = await fetcher();

    this.cache.set(key, {
      data,
      expires: Date.now() + ttlMs,
    });

    return data;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }
}

// Usage
const cache = new RedisCache();

const creature = await cache.get(
  `creature:${creatureId}`,
  () => redis.hgetall(`creature:${creatureId}`),
  5000 // 5 second cache
);
```

## Cleanup Patterns

Periodically clean up old data:

```typescript
// Clean up expired voting sessions (run via Devvit scheduler)
async function cleanupExpiredVotingSessions(): Promise<void> {
  const pattern = 'voting:*';
  const keys = await redis.keys(pattern);

  const now = Date.now();
  const toDelete: string[] = [];

  for (const key of keys) {
    if (key.includes(':votes') || key.includes(':counts')) continue;

    const session = await redis.hgetall(key);
    if (session.endTime && parseInt(session.endTime) < now - 3600000) {
      // 1 hour buffer
      toDelete.push(key);
      toDelete.push(`${key}:votes`);
      toDelete.push(`${key}:counts`);
    }
  }

  if (toDelete.length > 0) {
    await redis.del(...toDelete);
  }
}
```

## Common Mistakes to Avoid

1. **Don't use colons inconsistently** - Always use `:` as separator
2. **Don't forget to handle null/undefined** - Redis returns null for missing keys
3. **Don't skip error handling** - Always use safeRedisOperation or try/catch
4. **Don't use KEYS in production** - Use SCAN for pattern matching
5. **Don't store large objects in hashes** - Use separate keys if needed
6. **Don't forget TTL for temporary data** - Prevent memory leaks
7. **Don't use transactions unnecessarily** - They have overhead
8. **Don't forget to unwatch** - After WATCH, always UNWATCH if not executing
