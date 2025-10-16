# Implementation Plan

This document outlines the implementation tasks for Re-GenX, organized as incremental coding steps that build upon each other. Each task references specific requirements from the requirements document.

- [x] 1. Set up project structure and shared types

  - Create TypeScript interfaces for CreatureStats, MutationData, GroupStatus, and API responses in `src/shared/types/`
  - Define BiomeType, MutationTrait, StatEffects, and BehaviorPattern types
  - Set up Redis key schema constants
  - _Requirements: 1.1, 13.1, 13.2_

- [x] 2. Implement server-side group formation system

  - [x] 2.1 Create GroupManager class in `src/server/core/group-manager.ts`

    - Implement `getUserGroup()` to check user membership and add to waiting room
    - Implement `createGroup()` to form groups when 25 users join
    - Implement `createCreature()` to initialize creature with default stats and random biome
    - Add Redis operations with retry logic for group and creature creation
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 11.2_

  - [x] 2.2 Create API endpoint `/api/group/status`
    - Accept userId and subredditId as parameters
    - Return GroupStatus (waiting/in_group with counts)
    - Handle errors and return appropriate HTTP status codes
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 3. Implement creature state management

  - [x] 3.1 Create API endpoint `/api/creature/state`

    - Accept creatureId as parameter
    - Fetch creature data from Redis (age, biome, mutations, stats)
    - Return complete creature state with all mutations
    - _Requirements: 13.1, 13.2, 15.1, 15.5_

  - [x] 3.2 Implement stat update logic
    - Create function to apply stat effects from mutations
    - Ensure stats stay within bounds (0-100)
    - Update Redis atomically when stats change
    - _Requirements: 13.3, 13.4, 13.5_

- [x] 4. Build Three.js scene foundation

  - [x] 4.1 Create SceneManager class in `src/client/scene/scene-manager.ts`

    - Initialize Three.js scene, camera, and renderer
    - Set up spotlight from directly above with proper angle and intensity
    - Implement camera rotation around creature (360 degrees)
    - Add darkness beyond 5ft radius using fog or custom shader
    - Refactor src/client/main.ts to show scene
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 16.1, 16.3, 16.4_

  - [x] 4.2 Implement mobile detection and quality adjustment
    - Detect mobile devices using user agent
    - Reduce particle counts by 50% on mobile
    - Lower geometry complexity on mobile
    - Target 30fps on mobile, 60fps on desktop
    - _Requirements: 14.1, 14.2, 14.4_

- [x] 5. Implement base creature rendering

  - [x] 5.1 Implement random generator for organic fluid motion

    - Create noise-based random generator (Perlin or Simplex noise) for smooth continuous values
    - Implement function to calculate radius offset for each vertex based on position and time
    - Ensure fluid, organic motion where each point's radius changes continuously
    - Generate smooth transitions between radius values (no sudden jumps)
    - _Requirements: 2.1, 2.2_

  - [x] 5.2 Create CreatureRenderer class in `src/client/creature/creature-renderer.ts`

    - Create pulsating blob mesh with irregular organic geometry
    - Apply emissive material for glow effect
    - Implement pulsate() method using the random generator for fluid motion
    - Animate vertex positions each frame for continuous organic movement
    - Add creature to scene at center (0, 0, 0)
    - _Requirements: 2.1, 10.5_

  - [x] 5.3 Implement mutation geometry generation
    - Create functions to generate geometry for different mutation types (legs, eyes, wings, etc.)
    - Position mutations relative to base creature
    - Apply materials with appropriate colors and properties
    - _Requirements: 5.1, 5.2, 5.5, 12.1_

- [ ] 6. Build biome rendering system

  - [ ] 6.1 Create BiomeRenderer class in `src/client/biome/biome-renderer.ts`

    - Create circular ground mesh (5ft radius)
    - Implement `setBiome()` to switch between jungle, rocky_mountain, desert, ocean, cave
    - Generate biome-specific objects (plants, rocks, water, etc.) within 5ft radius
    - Clear previous biome objects when switching
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 2.3_

  - [ ] 6.2 Create biome-specific asset generation
    - Implement `createJungleBiome()` with vegetation
    - Implement `createRockyMountainBiome()` with rocks
    - Implement `createDesertBiome()` with sand and cacti
    - Implement `createOceanBiome()` with water effects
    - Implement `createCaveBiome()` with stalactites
    - _Requirements: 11.1, 11.3_

- [ ] 7. Implement slide-up HUD drawer

  - [ ] 7.1 Create HUDDrawer class in `src/client/ui/hud-drawer.ts`

    - Create HTML structure with handle and content sections
    - Implement expand/collapse animation (0.3 seconds)
    - Add click handler for handle
    - Add touch gesture support (swipe up/down)
    - Default to collapsed state showing only age and countdown
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 14.3, 14.5_

  - [ ] 7.2 Implement stat display in HUD

    - Create stat bars for all 5 categories (Mobility, Senses, Survival, Cognition, Vitals)
    - Display current values with visual bars
    - Update in real-time when stats change
    - Show color-coded indicators for stat changes (green/red)
    - _Requirements: 3.3, 3.4, 13.1, 13.2, 13.4_

  - [ ] 7.3 Add group member list and karma pool display
    - Display all 25 group members with online indicators
    - Show karma pool balance
    - Update online status in real-time
    - _Requirements: 17.1, 17.2, 17.3, 17.5_

- [ ] 8. Implement controlled mutation system

  - [ ] 8.1 Create MutationEngine class in `src/server/core/mutation-engine.ts`

    - Implement `purchaseGeneticShot()` to deduct karma and create mutation session
    - Generate 3 trait categories with 3-5 options each
    - Store session in Redis with 5-minute TTL
    - Schedule session end job
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.2_

  - [ ] 8.2 Implement voting logic

    - Create `castVote()` to record user votes in Redis
    - Allow vote changes during session
    - Implement `tallyVotes()` to count votes and determine winners
    - Apply randomness factor (0.85-0.95) to winning traits
    - _Requirements: 6.3, 6.4, 6.5, 7.1, 7.2, 8.1, 8.2, 8.5_

  - [ ] 8.3 Create mutation application logic

    - Implement `applyMutation()` to create MutationData from winning votes
    - Calculate stat effects based on traits
    - Add mutation to creature's mutation list in Redis
    - Update creature stats atomically
    - _Requirements: 5.3, 5.4, 7.3, 7.4, 7.5, 13.3_

  - [ ] 8.4 Create API endpoints for controlled mutations
    - `POST /api/mutation/purchase` - Purchase genetic shot
    - `POST /api/mutation/vote` - Cast vote on traits
    - `GET /api/mutation/session/:id` - Get current session state
    - _Requirements: 5.1, 5.2, 6.1, 6.2_

- [ ] 9. Implement uncontrolled mutation system

  - [ ] 9.1 Add uncontrolled mutation generation to MutationEngine

    - Implement `generateUncontrolledMutation()` with high randomness (0.05-0.15)
    - Select mutation type based on behavior patterns
    - Generate random trait values
    - Calculate stat effects and apply to creature
    - _Requirements: 8.1, 8.2, 8.3, 18.1, 18.2, 18.3_

  - [ ] 9.2 Implement mutation compatibility checking
    - Create compatibility matrix for mutation types
    - Check compatibility before applying mutations
    - Display warning if mutation conflicts
    - Suggest alternative compatible mutations
    - _Requirements: 5.5, 12.1, 12.2, 12.3, 12.4_

- [ ] 10. Build behavior tracking system

  - [ ] 10.1 Create BehaviorTracker class in `src/server/core/behavior-tracker.ts`

    - Implement `trackUserActivity()` to fetch user's recent subreddit visits
    - Categorize subreddits (animals, tech, gaming, nature, science, etc.)
    - Store behavior data in Redis with 7-day TTL
    - _Requirements: 9.1, 9.2, 9.4_

  - [ ] 10.2 Implement group behavior aggregation
    - Create `getGroupBehaviorPatterns()` to aggregate all 25 members' behavior
    - Calculate percentages for each category
    - Determine dominant category
    - Use patterns to influence uncontrolled mutations
    - _Requirements: 9.2, 9.3, 9.4, 9.5_

- [ ] 11. Implement evolution cycle scheduler

  - [ ] 11.1 Create EvolutionScheduler class in `src/server/core/evolution-scheduler.ts`

    - Implement `scheduleEvolutionCycle()` with random interval (15 min - 2 hours)
    - Create Devvit scheduler job for each creature
    - Implement `handleEvolutionCycle()` to increment age and trigger mutations
    - 30% chance of uncontrolled mutation per cycle
    - _Requirements: 4.1, 4.2, 4.3, 18.1_

  - [ ] 11.2 Add biome change logic to evolution cycles
    - Check every 10 cycles for biome change (20% probability)
    - Select different biome randomly
    - Update creature's biome in Redis
    - _Requirements: 11.4, 11.5_

- [ ] 12. Implement mutation animations

  - [ ] 12.1 Add animation methods to CreatureRenderer

    - Implement `animateMutation()` with 2-3 second duration
    - Use easing function (ease-out-elastic) for smooth transitions
    - Animate scale from 0 to target
    - Pulse creature glow during animation
    - _Requirements: 10.1, 10.2, 10.4, 10.5, 18.5_

  - [ ] 12.2 Add stat change visual feedback
    - Display floating numbers for stat increases/decreases
    - Color-code changes (green for +, red for -)
    - Animate numbers fading out over 1 second
    - _Requirements: 5.4, 13.4_

- [ ] 13. Implement camera controls

  - [ ] 13.1 Add mouse/touch rotation controls

    - Detect mouse drag events for desktop
    - Detect touch swipe events for mobile
    - Calculate rotation angle from drag distance
    - Call SceneManager.rotateCamera() with smooth interpolation
    - _Requirements: 16.1, 16.2, 16.4, 14.3_

  - [ ]\* 13.2 Add pinch-to-zoom support (optional)
    - Detect pinch gestures on mobile
    - Adjust camera distance within bounds
    - Smooth zoom animation
    - _Requirements: 16.5_

- [ ] 14. Implement client-side API integration

  - [ ] 14.1 Create APIClient class in `src/client/api/api-client.ts`

    - Implement `fetchWithRetry()` with exponential backoff (3 retries)
    - Add methods for all API endpoints (getGroupStatus, getCreatureState, etc.)
    - Handle errors and display user-friendly messages
    - _Requirements: 15.4, 15.5_

  - [ ] 14.2 Implement polling for state updates
    - Poll `/api/creature/state` every 5 seconds
    - Update creature rendering when mutations change
    - Update HUD when stats change
    - Update biome when it changes
    - _Requirements: 3.4, 15.5_

- [ ] 15. Build voting UI

  - [ ] 15.1 Create VotingInterface component in `src/client/ui/voting-interface.ts`

    - Display 3 trait categories with options
    - Show preview of each option
    - Allow one vote per category
    - Allow vote changes during session
    - Display countdown timer (5 minutes)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.1, 7.2_

  - [ ] 15.2 Implement vote submission
    - Call `/api/mutation/vote` when user votes
    - Show confirmation feedback
    - Update UI to reflect current vote
    - _Requirements: 6.1, 6.3_

- [ ] 16. Implement karma contribution system

  - [ ] 16.1 Create API endpoint `/api/karma/contribute`

    - Accept userId, groupId, and karma amount
    - Calculate 10% of earned Reddit karma
    - Add to group's karma pool in Redis
    - _Requirements: 5.2, 5.3_

  - [ ] 16.2 Add karma pool display and genetic shot purchase button
    - Show current karma pool balance in HUD
    - Add "Purchase Genetic Shot" button (costs 100 karma)
    - Disable button if insufficient karma
    - _Requirements: 5.4, 5.5_

- [ ] 17. Implement waiting room UI

  - [ ] 17.1 Create waiting room display
    - Show "Waiting for players: X/25" message in HUD
    - Display empty spotlight environment
    - Poll `/api/group/status` every 2 seconds
    - Transition to creature view when group forms
    - _Requirements: 1.2, 1.4_

- [ ] 18. Add mutation notifications

  - [ ] 18.1 Create notification system
    - Display toast notification when uncontrolled mutation occurs
    - Show mutation type and affected stats
    - Display notification when controlled mutation completes
    - Show winning traits and voters
    - _Requirements: 18.4, 18.5_

- [ ] 19. Implement data persistence and recovery

  - [ ] 19.1 Add Redis retry logic wrapper

    - Create `safeRedisOperation()` function with 3 retries and exponential backoff
    - Wrap all Redis operations in retry logic
    - Log failures after all retries exhausted
    - _Requirements: 15.4_

  - [ ] 19.2 Implement state restoration on page load
    - Fetch complete creature state from Redis
    - Restore all mutations and apply to creature
    - Restore stats and update HUD
    - Restore biome and render environment
    - Complete within 2 seconds
    - _Requirements: 15.1, 15.2, 15.3, 15.5_

- [ ] 20. Add rate limiting and security

  - [ ] 20.1 Implement rate limiter

    - Create RateLimiter class with in-memory request tracking
    - Limit to 100 requests per minute per user
    - Apply to all API endpoints
    - Return 429 status when limit exceeded
    - _Requirements: 15.1 (from ENHANCEMENTS.md)_

  - [ ] 20.2 Add input validation
    - Validate all mutation parameters (ranges, types)
    - Sanitize user inputs to prevent injection
    - Validate creature/group IDs before operations
    - _Requirements: 15.3 (from ENHANCEMENTS.md)_

- [ ] 21. Implement mobile optimizations

  - [ ] 21.1 Optimize rendering for mobile

    - Reduce particle counts by 50%
    - Use lower-poly geometry for mutations
    - Implement level-of-detail (LOD) system
    - Target 30fps minimum
    - _Requirements: 14.2, 14.4_

  - [ ] 21.2 Optimize touch controls
    - Ensure all touch targets are 44x44px minimum
    - Add visual feedback for touch interactions
    - Optimize HUD drawer for thumb accessibility
    - Test on various screen sizes
    - _Requirements: 14.3, 14.5_

- [ ] 22. Create Devvit post integration

  - [ ] 22.1 Implement post creation in `src/devvit/main.tsx`

    - Create splash screen with "Play" button
    - Open webview in fullscreen when clicked
    - Pass user context to webview
    - _Requirements: Product requirements from steering files_

  - [ ] 22.2 Add moderator menu action
    - Create menu action to manually create Re-GenX post
    - Verify moderator permissions
    - _Requirements: Product requirements from steering files_

- [ ] 23. Polish and final integration

  - [ ] 23.1 Add loading states

    - Show loading spinner while fetching data
    - Display progress during creature initialization
    - Show "Connecting..." message during API calls
    - _Requirements: User experience_

  - [ ] 23.2 Implement error messages

    - Display user-friendly error messages for all failure cases
    - Add retry buttons for recoverable errors
    - Show helpful hints for common issues
    - _Requirements: Error handling from design_

  - [ ] 23.3 Add sound effects (optional)
    - Subtle sound when mutation completes
    - Ambient sound for each biome
    - Click sounds for UI interactions
    - _Requirements: 10.5_

- [ ]\* 24. Testing and quality assurance

  - [ ]\* 24.1 Write unit tests for core logic

    - Test GroupManager group formation logic
    - Test MutationEngine vote tallying and randomness
    - Test BehaviorTracker categorization
    - Test stat calculation functions
    - _Requirements: All requirements_

  - [ ]\* 24.2 Perform integration testing

    - Test full user journey (join → wait → creature → vote → mutate)
    - Test concurrent voting with 25 simulated users
    - Test mutation compatibility edge cases
    - Test data persistence across page reloads
    - _Requirements: All requirements_

  - [ ]\* 24.3 Conduct mobile testing

    - Test on actual Android and iOS devices
    - Verify 30fps performance
    - Test touch controls and gestures
    - Verify HUD drawer on various screen sizes
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [ ]\* 24.4 Performance testing
    - Measure API response times (target < 200ms)
    - Test Redis operations under load
    - Measure client FPS with 20+ mutations
    - Test scheduler with multiple creatures
    - _Requirements: Performance requirements from design_
