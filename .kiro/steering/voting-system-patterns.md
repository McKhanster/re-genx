---
inclusion: fileMatch
fileMatchPattern: 'src/server/**/*voting*.ts'
---

# Voting System Patterns for Re-GenX

This steering file provides specific patterns for implementing the Re-GenX voting system for controlled mutations.

## Voting Flow Overview

```
1. Genetic Shot Used
   ↓
2. Generate 3-5 Mutation Options
   ↓
3. Create Voting Session (with TTL)
   ↓
4. Notify All 25 Group Members
   ↓
5. Collect Votes (one per user)
   ↓
6. Close Voting (after time limit)
   ↓
7. Tally Votes & Determine Winner
   ↓
8. Apply Winning Mutation
   ↓
9. Notify Group of Result
```

## Creating a Voting Session

```typescript
interface VotingSession {
  id: string;
  creatureId: string;
  groupId: string;
  options: MutationOption[];
  startTime: number;
  endTime: number;
  status: 'active' | 'closed' | 'applied';
}

async function createVotingSession(
  creatureId: string,
  options: MutationOption[],
  durationMs: number = 300000 // 5 minutes default
): Promise<VotingSession> {
  const sessionId = generateId();
  const creature = await getCreature(creatureId);

  const session: VotingSession = {
    id: sessionId,
    creatureId,
    groupId: creature.groupId,
    options,
    startTime: Date.now(),
    endTime: Date.now() + durationMs,
    status: 'active',
  };

  // Store in Redis with TTL
  const multi = redis.multi();

  multi.hset(`voting:${sessionId}`, {
    ...session,
    optionsJson: JSON.stringify(options),
  });
  multi.expire(`voting:${sessionId}`, Math.ceil(durationMs / 1000) + 3600); // +1hr buffer

  // Initialize vote counts
  options.forEach((option) => {
    multi.hset(`voting:${sessionId}:counts`, option.id, 0);
  });
  multi.expire(`voting:${sessionId}:counts`, Math.ceil(durationMs / 1000) + 3600);

  // Initialize votes hash
  multi.hset(`voting:${sessionId}:votes`, '_placeholder', '0');
  multi.expire(`voting:${sessionId}:votes`, Math.ceil(durationMs / 1000) + 3600);

  await multi.exec();

  // Notify group members
  await notifyGroupMembers(creature.groupId, {
    type: 'voting_started',
    sessionId,
    options,
    endTime: session.endTime,
  });

  return session;
}
```

## Casting Votes

```typescript
async function castVote(
  sessionId: string,
  userId: string,
  optionId: string
): Promise<{ success: boolean; counts: Record<string, number> }> {
  // Validate session is active
  const session = await redis.hgetall(`voting:${sessionId}`);
  if (!session || session.status !== 'active') {
    throw new Error('Voting session not active');
  }

  if (Date.now() > parseInt(session.endTime)) {
    throw new Error('Voting has ended');
  }

  // Validate user is group member
  const groupId = session.groupId;
  const isMember = await redis.sismember(`group:${groupId}:members`, userId);
  if (!isMember) {
    throw new Error('User not in group');
  }

  // Validate option exists
  const options = JSON.parse(session.optionsJson);
  if (!options.find((o: MutationOption) => o.id === optionId)) {
    throw new Error('Invalid option');
  }

  // Check for existing vote
  const existingVote = await redis.hget(`voting:${sessionId}:votes`, userId);

  const multi = redis.multi();

  if (existingVote && existingVote !== '_placeholder') {
    // Decrement old option
    multi.hincrby(`voting:${sessionId}:counts`, existingVote, -1);
  }

  // Set new vote
  multi.hset(`voting:${sessionId}:votes`, userId, optionId);

  // Increment new option
  multi.hincrby(`voting:${sessionId}:counts`, optionId, 1);

  await multi.exec();

  // Get updated counts
  const counts = await redis.hgetall(`voting:${sessionId}:counts`);

  return {
    success: true,
    counts: Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, parseInt(v as string)])),
  };
}
```

## Closing Voting and Determining Winner

```typescript
async function closeVoting(sessionId: string): Promise<MutationOption> {
  const session = await redis.hgetall(`voting:${sessionId}`);
  if (!session) {
    throw new Error('Session not found');
  }

  // Get vote counts
  const counts = await redis.hgetall(`voting:${sessionId}:counts`);

  // Find winner (most votes)
  let maxVotes = 0;
  let winnerId = '';

  Object.entries(counts).forEach(([optionId, count]) => {
    const voteCount = parseInt(count as string);
    if (voteCount > maxVotes) {
      maxVotes = voteCount;
      winnerId = optionId;
    }
  });

  // Handle tie - pick randomly among tied options
  const tiedOptions = Object.entries(counts)
    .filter(([_, count]) => parseInt(count as string) === maxVotes)
    .map(([id]) => id);

  if (tiedOptions.length > 1) {
    winnerId = tiedOptions[Math.floor(Math.random() * tiedOptions.length)];
  }

  // Get winning option
  const options = JSON.parse(session.optionsJson);
  const winningOption = options.find((o: MutationOption) => o.id === winnerId);

  if (!winningOption) {
    throw new Error('No valid winner found');
  }

  // Update session status
  await redis.hset(`voting:${sessionId}`, 'status', 'closed');

  return winningOption;
}
```

## Applying Mutation Result

```typescript
async function applyVotingResult(sessionId: string, winningOption: MutationOption): Promise<void> {
  const session = await redis.hgetall(`voting:${sessionId}`);
  const creatureId = session.creatureId;
  const groupId = session.groupId;

  // Create mutation record
  const mutation: CreatureMutation = {
    id: generateId(),
    type: winningOption.type,
    params: winningOption.params,
    statEffects: winningOption.statEffects,
    timestamp: Date.now(),
    controlled: true, // This was a voted mutation
  };

  // Apply mutation to creature
  await applyMutation(creatureId, mutation);

  // Update session status
  await redis.hset(`voting:${sessionId}`, 'status', 'applied');

  // Notify group members
  await notifyGroupMembers(groupId, {
    type: 'mutation_applied',
    mutation,
    optionName: winningOption.name,
    voteCount: await redis.hget(`voting:${sessionId}:counts`, winningOption.id),
  });
}
```

## Real-Time Vote Updates

For the client to get real-time updates, use polling:

```typescript
// Client-side polling
async function pollVoteCounts(sessionId: string): Promise<void> {
  const interval = setInterval(async () => {
    try {
      const response = await fetch(`/api/voting/${sessionId}/counts`);
      const data = await response.json();

      if (data.status !== 'active') {
        clearInterval(interval);
        // Show results
        showVotingResults(data);
      } else {
        // Update UI with current counts
        updateVoteCounts(data.counts);
      }
    } catch (error) {
      console.error('Failed to poll votes:', error);
    }
  }, 2000); // Poll every 2 seconds
}

// Server endpoint
app.get('/api/voting/:sessionId/counts', async (req, res) => {
  const { sessionId } = req.params;

  const session = await redis.hgetall(`voting:${sessionId}`);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const counts = await redis.hgetall(`voting:${sessionId}:counts`);

  res.json({
    status: session.status,
    counts: Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, parseInt(v as string)])),
    endTime: parseInt(session.endTime),
  });
});
```

## Scheduled Voting Closure

Use Devvit scheduler to automatically close voting:

```typescript
// When creating voting session, schedule closure
async function scheduleVotingClosure(sessionId: string, durationMs: number): Promise<void> {
  // Use Devvit scheduler
  await scheduler.runJob({
    name: 'close-voting',
    data: { sessionId },
    runAt: new Date(Date.now() + durationMs),
  });
}

// Job handler
scheduler.addJob({
  name: 'close-voting',
  handler: async (data: { sessionId: string }) => {
    const { sessionId } = data;

    try {
      const winningOption = await closeVoting(sessionId);
      await applyVotingResult(sessionId, winningOption);
    } catch (error) {
      console.error('Failed to close voting:', error);
    }
  },
});
```

## Notification Patterns

```typescript
async function notifyGroupMembers(groupId: string, notification: any): Promise<void> {
  const memberIds = await redis.smembers(`group:${groupId}:members`);

  // Store notification for each member
  const multi = redis.multi();

  memberIds.forEach((userId) => {
    const notificationId = generateId();
    multi.rpush(
      `user:${userId}:notifications`,
      JSON.stringify({
        id: notificationId,
        ...notification,
        timestamp: Date.now(),
        read: false,
      })
    );

    // Keep only last 50 notifications
    multi.ltrim(`user:${userId}:notifications`, -50, -1);
  });

  await multi.exec();
}

// Client polls for notifications
app.get('/api/notifications', async (req, res) => {
  const userId = req.context.userId;

  const notifications = await redis.lrange(
    `user:${userId}:notifications`,
    -10, // Last 10
    -1
  );

  res.json({
    notifications: notifications.map((n) => JSON.parse(n)),
  });
});
```

## Error Handling

```typescript
// Wrap voting operations with error handling
async function safeVotingOperation<T>(
  operation: () => Promise<T>,
  errorMessage: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error(`Voting error: ${errorMessage}`, error);
    throw new Error(errorMessage);
  }
}

// Usage
const result = await safeVotingOperation(
  () => castVote(sessionId, userId, optionId),
  'Failed to cast vote'
);
```

## Testing Checklist

When implementing voting:

- [ ] Session creation stores all required data
- [ ] TTL is set to prevent memory leaks
- [ ] Users can only vote once (or change their vote)
- [ ] Vote counts update atomically
- [ ] Only group members can vote
- [ ] Voting closes automatically after time limit
- [ ] Ties are handled (random selection)
- [ ] Winning mutation is applied correctly
- [ ] All group members are notified
- [ ] Client can poll for real-time updates
- [ ] Expired sessions are cleaned up
