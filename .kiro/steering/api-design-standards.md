---
inclusion: fileMatch
fileMatchPattern: 'src/server/index.ts'
---

# API Design Standards for Re-GenX

Quick reference for creating API endpoints.

## Endpoint Naming

**ALL endpoints MUST start with `/api/`** (Devvit requirement)

```typescript
// ✓ GOOD
app.get('/api/creature/:id', handler);
app.post('/api/mutation/vote', handler);

// ✗ BAD - Missing /api/ prefix
app.get('/creature/:id', handler);
```

Use RESTful conventions:

- GET for reading data
- POST for creating/updating
- Use nouns, not verbs
- Use kebab-case for multi-word resources

## Standard Response Format

```typescript
// Success response
{
  data: any,
  timestamp: number
}

// Error response
{
  error: string,        // User-friendly message
  code: string,         // Machine-readable code
  details?: any         // Optional debug info (dev only)
}
```

## Error Handling Pattern

```typescript
app.get('/api/creature/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate input
    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        error: 'Invalid creature ID',
        code: 'INVALID_INPUT',
      });
    }

    // Fetch data with retry logic
    const creature = await safeRedisOperation(() => redis.hgetall(`creature:${id}`), null, 3);

    if (!creature) {
      return res.status(404).json({
        error: 'Creature not found',
        code: 'NOT_FOUND',
      });
    }

    res.json({
      data: creature,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error fetching creature:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
});
```

## Rate Limiting

Apply to ALL endpoints:

```typescript
const rateLimiter = new RateLimiter();

app.use('/api/*', (req, res, next) => {
  const userId = req.context.userId;

  if (!rateLimiter.isAllowed(userId, 100, 60000)) {
    return res.status(429).json({
      error: 'Too many requests',
      code: 'RATE_LIMIT_EXCEEDED',
    });
  }

  next();
});
```

## Input Validation

Validate EVERYTHING:

```typescript
function validateVotePayload(body: any): body is VotePayload {
  if (!body || typeof body !== 'object') return false;
  if (!body.sessionId || typeof body.sessionId !== 'string') return false;
  if (!body.optionId || typeof body.optionId !== 'string') return false;
  return true;
}

app.post('/api/mutation/vote', async (req, res) => {
  if (!validateVotePayload(req.body)) {
    return res.status(400).json({
      error: 'Invalid vote payload',
      code: 'INVALID_INPUT',
    });
  }

  // Process vote...
});
```

## Authentication

User context is provided by Devvit:

```typescript
app.get('/api/group/status', async (req, res) => {
  const userId = req.context.userId;
  const subredditId = req.context.subredditId;

  // Use these for authorization checks
  const groupId = await getUserGroup(userId, subredditId);

  // ...
});
```

## Common Endpoints Pattern

```typescript
// Get resource
app.get('/api/resource/:id', async (req, res) => {
  // Validate → Fetch → Return
});

// Create resource
app.post('/api/resource', async (req, res) => {
  // Validate → Create → Return
});

// Update resource
app.post('/api/resource/:id', async (req, res) => {
  // Validate → Check exists → Update → Return
});

// List resources
app.get('/api/resources', async (req, res) => {
  // Validate query params → Fetch list → Return
});
```

## Polling Endpoints

For real-time updates (Devvit doesn't support WebSockets):

```typescript
// Client polls this every 2-5 seconds
app.get('/api/creature/:id/state', async (req, res) => {
  const { id } = req.params;

  const creature = await getCreatureState(id);

  res.json({
    data: creature,
    timestamp: Date.now(),
    // Include version/hash for client to detect changes
    version: hashCreatureState(creature),
  });
});
```

## Error Codes Reference

Use consistent error codes:

- `INVALID_INPUT` - Bad request data
- `NOT_FOUND` - Resource doesn't exist
- `UNAUTHORIZED` - User not allowed
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INSUFFICIENT_KARMA` - Not enough karma for action
- `SESSION_EXPIRED` - Voting session ended
- `INTERNAL_ERROR` - Server error

## Testing Checklist

For each endpoint:

- [ ] Starts with `/api/`
- [ ] Validates all inputs
- [ ] Handles errors gracefully
- [ ] Returns consistent response format
- [ ] Has rate limiting
- [ ] Uses safeRedisOperation for Redis calls
- [ ] Logs errors appropriately
- [ ] Returns appropriate HTTP status codes
