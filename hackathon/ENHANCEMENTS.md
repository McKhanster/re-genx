# Re-GenX MVP Enhancements

This document contains additional considerations and enhancements that complement the main requirements, design, and tasks documents.

## Additional Requirements Considerations

### Security & Privacy

**User Privacy**

- Behavior analysis should be aggregated and anonymized
- Individual user activity should not be exposed to other group members
- Only show aggregate group behavior patterns

**Rate Limiting**

- Limit API calls per user (e.g., 100 requests per minute)
- Prevent spam voting (one vote per session)
- Throttle genetic shot purchases

**Input Validation**

- Validate all mutation parameters (ranges, types)
- Sanitize user inputs to prevent injection
- Validate creature/group IDs before operations

### Edge Cases to Handle

**Waiting Room Edge Cases**

- User joins multiple waiting rooms (prevent)
- User leaves subreddit while in waiting room
- Subreddit member count drops below capacity
- Multiple users join simultaneously (race condition)

**Voting Edge Cases**

- All group members vote for different options (tie)
- No one votes (default to random option)
- User votes after session expires
- Session expires while user is voting

**Mutation Edge Cases**

- Incompatible mutations (e.g., wings + spikes in same location)
- Too many mutations (creature becomes unrecognizable)
- Mutation fails to apply (geometry error)
- Stat effects make creature unviable (health <= 0)

**Group Edge Cases**

- Group member deletes account
- Group member is banned from subreddit
- All group members become inactive
- Karma pool goes negative (prevent)

## Performance Optimizations

### Client-Side Caching

```typescript
class ClientCache {
  private cache = new Map<string, { data: any; expires: number }>();

  async get<T>(key: string, fetcher: () => Promise<T>, ttlMs = 5000): Promise<T> {
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    const data = await fetcher();
    this.cache.set(key, { data, expires: Date.now() + ttlMs });
    return data;
  }
}

// Cache creature state for 5 seconds
const creature = await cache.get(
  `creature:${creatureId}`,
  () => fetch(`/api/creature/${creatureId}`).then((r) => r.json()),
  5000
);
```

### Lazy Loading

```typescript
// Load mutations on demand
async function loadMutationGeometry(type: string): Promise<THREE.BufferGeometry> {
  if (!geometryCache.has(type)) {
    const geometry = await createMutationGeometry(type);
    geometryCache.set(type, geometry);
  }
  return geometryCache.get(type);
}
```

### Debouncing

```typescript
// Debounce HUD updates
const debouncedUpdateHUD = debounce((stats: CreatureStats) => {
  hud.updateStats(stats);
}, 100);
```

## Monitoring & Analytics

### Key Metrics to Track

**User Engagement**

- Daily active users per creature
- Average session duration
- Voting participation rate
- Genetic shot purchase rate

**System Health**

- API response times
- Redis operation latency
- Client FPS (average, p95, p99)
- Error rates by endpoint

**Game Metrics**

- Average creature age
- Most popular mutations
- Voting patterns
- Behavior influence effectiveness

### Logging Strategy

```typescript
// Structured logging
function logEvent(event: string, data: any): void {
  console.log(
    JSON.stringify({
      timestamp: Date.now(),
      event,
      data,
      environment: process.env.NODE_ENV,
    })
  );
}

// Usage
logEvent('mutation_applied', {
  creatureId,
  mutationType: mutation.type,
  controlled: mutation.controlled,
  groupSize: 25,
});
```

## Accessibility Considerations

### Visual Accessibility

- Ensure HUD text has sufficient contrast (WCAG AA minimum)
- Provide text alternatives for visual mutations
- Support screen readers for UI elements
- Allow font size adjustments

### Motor Accessibility

- Large touch targets (minimum 44x44px)
- Support keyboard navigation where applicable
- Avoid requiring precise timing for interactions
- Provide alternative input methods

### Cognitive Accessibility

- Clear, simple instructions
- Consistent UI patterns
- Visual feedback for all actions
- Avoid overwhelming users with information

## Internationalization (Future)

While not in MVP, consider:

- Text externalization for translations
- Number/date formatting
- RTL language support
- Cultural considerations for creature designs

## Testing Strategy Enhancements

### Load Testing

```typescript
// Simulate 25 concurrent users voting
async function loadTestVoting(sessionId: string): Promise<void> {
  const users = Array.from({ length: 25 }, (_, i) => `user_${i}`);
  const options = ['option1', 'option2', 'option3'];

  const promises = users.map((userId) =>
    fetch(`/api/voting/${sessionId}/vote`, {
      method: 'POST',
      body: JSON.stringify({
        optionId: options[Math.floor(Math.random() * options.length)],
      }),
    })
  );

  await Promise.all(promises);
}
```

### Integration Test Scenarios

1. **Full User Journey**: Join waiting room → creature created → vote on mutation → see result
2. **Concurrent Voting**: 25 users vote simultaneously
3. **Mutation Compatibility**: Apply multiple mutations and verify no clipping
4. **Data Persistence**: Create creature → reload page → verify state restored
5. **Mobile Experience**: Test on actual mobile devices

### Chaos Testing

- Simulate Redis failures
- Simulate network latency
- Simulate concurrent mutations
- Simulate user disconnections during voting

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] Performance benchmarks met (60fps desktop, 30fps mobile)
- [ ] Error handling tested
- [ ] Mobile testing complete
- [ ] Accessibility audit passed
- [ ] Security review complete
- [ ] Redis schema documented
- [ ] API documentation complete

### Deployment

- [ ] Build production bundle (`npm run build`)
- [ ] Test in Devvit playtest environment
- [ ] Deploy to test subreddit
- [ ] Verify all features work
- [ ] Monitor error logs
- [ ] Check performance metrics

### Post-Deployment

- [ ] Monitor user feedback
- [ ] Track error rates
- [ ] Monitor performance metrics
- [ ] Check Redis memory usage
- [ ] Verify scheduler jobs running
- [ ] Test with real users

## Future Feature Ideas (Post-MVP)

### Creature Battles

- Groups can challenge each other
- Battle mechanics based on mutations
- Winner gets karma rewards

### Evolution Tree

- Visualize mutation history
- Show branching paths
- Compare with other creatures

### Achievements

- Unlock special mutations
- Reward active participation
- Display badges on profile

### Creature Marketplace

- Trade genetic material
- Auction rare mutations
- Cross-pollinate creatures

### Environmental Disasters

- Random events require adaptation
- Group must vote on survival strategy
- Adds urgency and drama

### Creature Reproduction

- Two groups can breed creatures
- Offspring inherits traits from both
- Creates new generation

### Time-Lapse Replay

- Watch creature evolution from start
- Share evolution videos
- Compare evolution paths

## Known Limitations

### Technical Limitations

- **No real-time updates**: Must use polling (Devvit limitation)
- **30-second request timeout**: Long operations must be chunked
- **4MB request limit**: Large payloads must be split
- **No WebSockets**: Can't push updates to clients
- **No file system**: All data must be in Redis

### Design Limitations

- **Fixed group size**: Always 25 players (by design)
- **Single creature per group**: No multi-creature management
- **Limited mutation types**: Predefined set only
- **No creature deletion**: Creatures persist indefinitely
- **No group dissolution**: Groups are permanent

### Scalability Considerations

- **Redis memory**: Each creature + mutations + voting data
- **Scheduler load**: One job per creature for aging/mutations
- **API load**: Polling creates constant traffic
- **Subreddit capacity**: Large subreddits = many creatures

## Troubleshooting Guide

### Common Issues

**Creature not loading**

- Check Redis connection
- Verify creature ID exists
- Check for Redis key expiration
- Verify user has access

**Voting not working**

- Verify session is active
- Check user is group member
- Verify option ID is valid
- Check for expired session

**Mutations not appearing**

- Check geometry generation
- Verify mutation compatibility
- Check for rendering errors
- Verify mutation was saved to Redis

**Performance issues**

- Check FPS counter
- Reduce particle count
- Lower geometry complexity
- Check for memory leaks

**Mobile not working**

- Verify touch controls enabled
- Check mobile detection
- Reduce quality settings
- Test on actual device

## Support & Maintenance

### Regular Maintenance Tasks

- Monitor Redis memory usage
- Clean up expired data
- Review error logs
- Update behavior categories
- Optimize slow queries

### User Support

- Provide clear error messages
- Document common issues
- Create FAQ
- Monitor feedback channels

### Version Updates

- Maintain changelog
- Test migrations
- Backup Redis data
- Communicate changes to users

## Conclusion

This document provides additional context and considerations for the Re-GenX MVP. Use it alongside the main requirements, design, and tasks documents to ensure a comprehensive implementation.

Remember:

- **Mobile-first**: Most users are on mobile
- **25-player groups**: Non-negotiable constraint
- **Data persistence**: Everything in Redis
- **Error handling**: Network and Redis can fail
- **Performance**: 60fps desktop, 30fps mobile minimum
