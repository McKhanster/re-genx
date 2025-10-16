---
inclusion: always
---

# Re-GenX Game Rules

This steering file contains core game rules and constraints that must be followed throughout the Re-GenX implementation.

## Core Constraints

### Group Size

- **ALWAYS 25 players per creature** - This is non-negotiable
- Waiting rooms must fill to exactly 25 before creating a creature
- Subreddit capacity = floor(member_count / 25)
- All group operations must validate 25-member constraint

### Mutation System

- **Controlled mutations**: Require group voting, triggered by genetic shots
- **Uncontrolled mutations**: Random, no voting, happen automatically
- All mutations must be compatible with existing mutations (no clipping)
- Mutation animations must be 2-3 seconds
- Mutations affect both visuals AND stats

### Visual Presentation

- **Spotlight effect**: Creature at center, lit from above
- **5ft visibility radius**: Darkness beyond this point
- **360° camera rotation**: Always keep creature centered
- **Pulsating blob**: Base creature state before mutations
- **Neon HUD**: Futuristic styling, semi-transparent

### Data Persistence

- **Everything goes to Redis** - No local storage
- Retry failed operations 3 times before showing error
- Save on every mutation and stat change
- Load full state on game init

### Mobile-First

- Most Reddit users are on mobile
- Always implement touch controls for new features
- Reduce particle counts and geometry complexity on mobile
- HUD must be thumb-friendly
- Target 30fps minimum on mobile (60fps on desktop)

## Implementation Patterns

### API Endpoints

```typescript
// ALWAYS start with /api/
app.get('/api/creature/:id', handler); // ✓ Correct
app.get('/creature/:id', handler); // ✗ Wrong - Devvit requires /api/
```

### Redis Keys

```typescript
// Follow the schema exactly
`creature:${creatureId}` // ✓ Correct
`creature_${creatureId}` // ✗ Wrong - use colons
`waitingroom:${subredditId}:current`; // ✓ Correct
```

### Error Handling

```typescript
// Always use retry logic for Redis
await safeRedisOperation(
  () => redis.hset(key, value),
  fallbackValue,
  3 // retries
);
```

### Mobile Detection

```typescript
// Check for mobile and adjust quality
if (isMobile()) {
  particleCount = Math.floor(particleCount / 2);
  creature.geometry = lowPolyGeometry;
}
```

## Common Pitfalls to Avoid

1. **Don't hardcode group size** - Use a constant (GROUP_SIZE = 25)
2. **Don't skip mobile optimization** - Most users are on mobile
3. **Don't forget /api/ prefix** - Devvit requirement
4. **Don't use local storage** - Use Redis for everything
5. **Don't make mutations instant** - Always animate (2-3s)
6. **Don't allow incompatible mutations** - Validate before applying
7. **Don't forget error handling** - Network and Redis can fail
8. **Don't skip the spotlight effect** - Core to the visual identity

## Testing Checklist

When implementing features, always verify:

- [ ] Works on mobile (touch controls, performance)
- [ ] Follows Redis schema exactly
- [ ] API endpoints start with /api/
- [ ] Group size constraint enforced
- [ ] Mutations animate smoothly
- [ ] Data persists across reloads
- [ ] Error handling with retries
- [ ] HUD updates in real-time
