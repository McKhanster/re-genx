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

- [x] 6. Build biome rendering system

  - [x] 6.1 Create BiomeRenderer class in `src/client/biome/biome-renderer.ts`

    - Create circular ground mesh (5ft radius)
    - Implement `setBiome()` to switch between jungle, rocky_mountain, desert, ocean, cave
    - Generate biome-specific objects (plants, rocks, water, etc.) within 5ft radius
    - Clear previous biome objects when switching
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 2.3_

  - [x] 6.2 Create biome-specific asset generation
    - Implement `createJungleBiome()` with vegetation
    - Implement `createRockyMountainBiome()` with rocks
    - Implement `createDesertBiome()` with sand and cacti
    - Implement `createOceanBiome()` with water effects
    - Implement `createCaveBiome()` with stalactites
    - _Requirements: 11.1, 11.3_

- [x] 7. Implement slide-up HUD drawer

  - [x] 7.1 Create HUDDrawer class in `src/client/ui/hud-drawer.ts`

    - Create HTML structure with handle and content sections
    - Implement expand/collapse animation (0.3 seconds)
    - Add click handler for handle
    - Add touch gesture support (swipe up/down)
    - Default to collapsed state showing only age and countdown
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 14.3, 14.5_

  - [x] 7.2 Implement stat display in HUD

    - Create stat bars for all 5 categories (Mobility, Senses, Survival, Cognition, Vitals)
    - Display current values with visual bars
    - Update in real-time when stats change
    - Show color-coded indicators for stat changes (green/red)
    - _Requirements: 3.3, 3.4, 13.1, 13.2, 13.4_

  - [x] 7.3 Add group member list and karma pool display
    - Display all 25 group members with online indicators
    - Show karma pool balance
    - Update online status in real-time
    - _Requirements: 17.1, 17.2, 17.3, 17.5_

- [x] 8. Implement personal familiar management

  - [x] 8.1 Create FamiliarManager class in `src/server/core/familiar-manager.ts`

    - Implement `getFamiliar()` to fetch user's familiar from Redis
    - Implement `createFamiliar()` to initialize new familiar with default stats, Care Meter at 100, and random biome
    - Implement `updateCareMeter()` to update care meter value (0-100)
    - Implement `checkForRemoval()` to check if familiar should be removed (Care Meter 0 for 24 hours)
    - Add Redis operations with retry logic
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 5.1, 5.2, 5.3, 5.4_

  - [x] 8.2 Create API endpoints for familiar management
    - `GET /api/familiar/state` - Get current familiar state
    - `POST /api/familiar/create` - Create new familiar for user
    - Return familiar data with Care Meter, Evolution Points, mutations, stats, and biome
    - _Requirements: 1.1, 1.2, 1.3, 18.1, 18.2_

- [x] 9. Implement care system

  - [x] 9.1 Create CareSystem class in `src/server/core/care-system.ts`

    - Implement `performCareAction()` for feed, play, and attention actions
    - Check cooldown timers (5 minutes per action type)
    - Update Care Meter: feed +15, play +10, attention +5
    - Award Evolution Points: feed +10, play +15, attention +5
    - Store cooldown in Redis with TTL
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 20.1, 20.2, 20.3, 20.4, 20.5_

  - [x] 9.2 Implement care meter decay logic

    - Implement `decayCareMeter()` to decrease Care Meter by 5 points per hour
    - Calculate decay based on time since last care action
    - Implement `checkNeglectWarning()` to detect Care Meter below 20
    - Store neglect warning flag in Redis
    - _Requirements: 4.2, 5.1, 5.2, 5.3_

  - [x] 9.3 Create API endpoints for care actions
    - `POST /api/care/feed` - Feed familiar
    - `POST /api/care/play` - Play with familiar
    - `POST /api/care/attention` - Give attention to familiar
    - Return updated Care Meter and Evolution Points
    - _Requirements: 4.3, 4.4, 4.5, 20.1, 20.2, 20.3_

- [x] 10. Build care action UI

  - [x] 10.1 Create CareActionUI class in `src/client/ui/care-actions.ts`

    - Create three care action buttons (Feed, Play, Attention)
    - Display rewards for each action (+Care, +EP)
    - Implement cooldown timers (5 minutes per action)
    - Show countdown on buttons during cooldown
    - Disable buttons during cooldown
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_

  - [x] 10.2 Add care action feedback animations
    - Display floating text showing Care Meter increase
    - Display floating text showing Evolution Points gained
    - Trigger familiar animation for each care action type
    - Show visual feedback on button click
    - _Requirements: 20.4_

- [x] 11. Update HUD for familiar care

  - [x] 11.1 Update HUDDrawer to show Care Meter

    - Replace Karma Pool with Care Meter display (0-100)
    - Add Evolution Points balance display
    - Show visual warning when Care Meter below 20
    - Display time until next Evolution Cycle
    - Remove group member list
    - _Requirements: 3.3, 3.4, 3.5, 7.3, 7.4, 7.5_

  - [x] 11.2 Add neglect warning display
    - Show warning icon when Care Meter below 20
    - Display message: "Your familiar needs attention!"
    - Change familiar appearance to look sad/distressed
    - _Requirements: 5.2, 5.3_

- [x] 12. Update familiar renderer for care states

  - [x] 12.1 Add care meter visual feedback to FamiliarRenderer

    - Implement `updateCareMeterVisuals()` to change appearance based on care level
    - Happy appearance (Care Meter 50-100): bright colors, active pulsing
    - Neutral appearance (Care Meter 20-50): normal colors, slower pulsing
    - Sad appearance (Care Meter 0-20): dull colors, minimal pulsing
    - _Requirements: 5.2_

  - [x] 12.2 Add care action animations
    - Implement feeding animation (eating motion)
    - Implement playing animation (bouncing, spinning)
    - Implement attention animation (glowing, happy pulse)
    - _Requirements: 20.1, 20.2, 20.3_

- [x] 13. Implement controlled mutation system

  - [x] 13.1 Create MutationEngine class in `src/server/core/mutation-engine.ts`

    - Implement `triggerControlledMutation()` to deduct 100 Evolution Points and create mutation choice session
    - Generate 3-5 trait options for one category (legs, color, size, etc.)
    - Store choice session in Redis with 5-minute TTL
    - Return trait options to client
    - _Requirements: 7.1, 7.2, 7.3, 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 13.2 Implement mutation choice application

    - Implement `applyChosenMutation()` to apply selected trait
    - Apply randomness factor (0.85-0.95) to chosen trait value
    - Calculate stat effects based on trait
    - Add mutation to familiar's mutation list in Redis
    - Update familiar stats atomically
    - _Requirements: 8.4, 8.5, 9.1, 9.2, 9.3, 9.4, 9.5, 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 13.3 Create API endpoints for controlled mutations
    - `POST /api/mutation/trigger` - Trigger controlled mutation (costs 100 EP)
    - `POST /api/mutation/choose` - Apply chosen trait option
    - Return mutation data and updated stats
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 14. Implement uncontrolled mutation system

  - [x] 14.1 Add uncontrolled mutation generation to MutationEngine

    - Implement `generateUncontrolledMutation()` with high randomness (0.05-0.15)
    - Check if user has opted in to personality reflection
    - If opted in: Select mutation type based on activity patterns
    - If opted out: Use pure random mutation type
    - Generate random trait values and apply to familiar
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 11.1, 11.2, 11.3, 11.4, 11.5_

  - [x] 14.2 Implement mutation compatibility checking
    - Create compatibility matrix for mutation types
    - Check compatibility before applying mutations
    - Display warning if mutation conflicts
    - Suggest alternative compatible mutations
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [x] 15. Build privacy-compliant activity tracking

  - [x] 15.1 Create ActivityTracker class in `src/server/core/activity-tracker.ts`

    - Implement `updateActivityPattern()` to fetch user's public posts from last 30 days
    - Categorize posts by subreddit type (animals, tech, gaming, nature, art, science)
    - Store activity pattern in Redis with 30-day TTL
    - Only track if user has opted in to privacy setting
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [x] 15.2 Implement activity pattern analysis

    - Create `getActivityPattern()` to retrieve user's posting patterns
    - Calculate dominant category from post frequency
    - Return pattern for mutation influence
    - Return empty pattern if user opted out
    - _Requirements: 12.3, 12.4_

  - [x] 15.3 Create privacy opt-in system
    - Implement `setPrivacyOptIn()` to store user's privacy preference
    - Clear activity data if user opts out
    - Display privacy consent dialog on first familiar creation
    - Create API endpoint `POST /api/privacy/opt-in`
    - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5_

- [x] 16. Implement evolution cycle scheduler

  - [x] 16.1 Create EvolutionScheduler class in `src/server/core/evolution-scheduler.ts`

    - Implement `scheduleEvolutionCycle()` with random interval (30 min - 4 hours)
    - Create Devvit scheduler job for each familiar
    - Implement `handleEvolutionCycle()` to increment age and trigger mutations
    - 20% chance of uncontrolled mutation per cycle
    - Decay care meter during evolution cycle
    - Check for neglect/removal
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 11.1, 11.2, 11.3, 11.4, 11.5_

  - [x] 16.2 Implement care meter decay scheduler

    - Create hourly scheduler job for care meter decay
    - Implement `handleCareDecay()` to decrease Care Meter by 5 points
    - Check if neglect warning needed (Care Meter < 20)
    - Store warning flag in Redis
    - _Requirements: 4.2, 5.1, 5.2_

  - [x] 16.3 Add biome change logic to evolution cycles
    - Check every 10 cycles for biome change (15% probability)
    - Select different biome randomly
    - Update familiar's biome in Redis
    - _Requirements: 14.4, 14.5_

- [x] 17. Implement mutation animations

  - [x] 17.1 Add animation methods to FamiliarRenderer

    - Implement `animateMutation()` with 2-3 second duration
    - Use easing function (ease-out-elastic) for smooth transitions
    - Animate scale from 0 to target
    - Pulse familiar glow during animation
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

  - [x] 17.2 Add stat change visual feedback
    - Display floating numbers for stat increases/decreases
    - Color-code changes (green for +, red for -)
    - Animate numbers fading out over 1 second
    - _Requirements: 16.4_

- [x] 18. Build mutation choice UI

  - [x] 18.1 Create MutationChoiceUI component in `src/client/ui/mutation-choice.ts`

    - Display "Evolve" button (costs 100 EP)
    - Show trait options when mutation triggered (3-5 options)
    - Display preview of each option
    - Allow player to select one option
    - Show confirmation after selection
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 18.2 Implement mutation choice submission
    - Call `/api/mutation/trigger` when "Evolve" clicked
    - Display trait options returned from server
    - Call `/api/mutation/choose` when option selected
    - Show mutation animation
    - Update HUD with new stats
    - _Requirements: 8.4, 8.5_

- [x] 19. Implement client-side API integration

  - [x] 19.1 Create APIClient class in `src/client/api/api-client.ts`

    - Implement `fetchWithRetry()` with exponential backoff (3 retries)
    - Add methods for all API endpoints (getFamiliarState, performCareAction, triggerMutation, etc.)
    - Handle errors and display user-friendly messages
    - _Requirements: 18.4, 18.5_

  - [x] 19.2 Implement polling for state updates
    - Poll `/api/familiar/state` every 5 seconds
    - Update familiar rendering when mutations change
    - Update HUD when stats or Care Meter change
    - Update biome when it changes
    - Show neglect warning if Care Meter below 20
    - _Requirements: 3.4, 18.5_

- [x] 20. Add privacy consent dialog

  - [x] 20.1 Create PrivacyDialog component in `src/client/ui/privacy-dialog.ts`

    - Display dialog on first familiar creation
    - Explain personality reflection feature clearly
    - Emphasize that only public posts are analyzed, never browsing history
    - Provide "Opt In" and "Opt Out" buttons
    - Allow changing preference later in settings
    - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5_

  - [x] 20.2 Implement privacy preference submission
    - Call `/api/privacy/opt-in` with user's choice
    - Store preference locally for UI display
    - Show confirmation message
    - _Requirements: 21.4, 21.5_

- [x] 21. Add mutation notifications

  - [x] 21.1 Create notification system

    - Display toast notification when uncontrolled mutation occurs
    - Show mutation type and affected stats
    - Display notification when controlled mutation completes
    - Show chosen trait and stat changes
    - Display notification when Care Meter drops below 20
    - _Requirements: 11.4, 11.5_

  - [x] 21.2 Add removal warning system
    - Display prominent warning when Care Meter reaches 0
    - Show countdown: "Familiar will be removed in X hours"
    - Provide clear call-to-action to care for familiar
    - _Requirements: 5.3, 5.4_

- [-] 22. Implement data persistence and recovery

  - [x] 22.1 Add Redis retry logic wrapper

    - Create `safeRedisOperation()` function with 3 retries and exponential backoff
    - Wrap all Redis operations in retry logic
    - Log failures after all retries exhausted
    - _Requirements: 18.4_

  - [x] 22.2 Implement state restoration on page load
    - Fetch complete familiar state from Redis
    - Restore all mutations and apply to familiar
    - Restore Care Meter, Evolution Points, and stats
    - Restore biome and render environment
    - Complete within 2 seconds
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

- [x] 23. Add rate limiting and security

  - [x] 23.1 Implement rate limiter

    - Create RateLimiter class with in-memory request tracking
    - Limit to 100 requests per minute per user
    - Apply to all API endpoints
    - Return 429 status when limit exceeded
    - Enforce 5-minute cooldown on care actions
    - _Requirements: 20.5_

  - [x] 23.2 Add input validation
    - Validate all mutation parameters (ranges, types)
    - Validate care action types (feed, play, attention)
    - Sanitize user inputs to prevent injection
    - Validate familiar IDs before operations
    - _Requirements: Privacy and security from design_

- [x] 24. Implement mobile optimizations

  - [x] 24.1 Optimize rendering for mobile

    - Reduce particle counts by 50%
    - Use lower-poly geometry for mutations
    - Implement level-of-detail (LOD) system
    - Target 30fps minimum
    - _Requirements: 17.2, 17.4_

  - [x] 24.2 Optimize touch controls
    - Ensure all touch targets are 44x44px minimum (care buttons, HUD handle, mutation options)
    - Add visual feedback for touch interactions
    - Optimize HUD drawer for thumb accessibility
    - Test care action buttons on various screen sizes
    - _Requirements: 17.3, 17.5_

- [x] 25. Create Devvit post integration

  - [x] 25.1 Implement post creation in `src/devvit/main.tsx`

    - Create splash screen with "Play" button
    - Open webview in fullscreen when clicked
    - Pass user context to webview
    - _Requirements: Product requirements from steering files_

  - [x] 25.2 Add moderator menu action
    - Create menu action to manually create Re-GenX post
    - Verify moderator permissions
    - _Requirements: Product requirements from steering files_

- [-] 26. Polish and final integration

  - [x] 26.1 Add loading states

    - Show loading spinner while fetching familiar data
    - Display progress during familiar initialization
    - Show "Connecting..." message during API calls
    - Show loading state during care actions
    - _Requirements: User experience_

  - [x] 26.2 Implement error messages

    - Display user-friendly error messages for all failure cases
    - Add retry buttons for recoverable errors
    - Show helpful hints for common issues (e.g., "Care action on cooldown")
    - Display clear message when familiar is removed
    - _Requirements: Error handling from design_

  - [x] 26.3 Add sound effects (optional)
    - Subtle sound when mutation completes
    - Happy sound for care actions
    - Sad sound when Care Meter drops below 20
    - Ambient sound for each biome
    - Click sounds for UI interactions
    - _Requirements: 13.5_

- [ ]\* 27. Testing and quality assurance

  - [ ]\* 27.1 Write unit tests for core logic

    - Test FamiliarManager familiar creation and care meter updates
    - Test CareSystem care actions, cooldowns, and decay calculations
    - Test MutationEngine controlled/uncontrolled mutations and randomness
    - Test ActivityTracker privacy opt-in and post categorization
    - Test stat calculation functions
    - _Requirements: All requirements_

  - [ ]\* 27.2 Perform integration testing

    - Test full user journey (create familiar → care → evolve → mutate)
    - Test care meter decay and neglect warnings
    - Test familiar removal after 24 hours at Care Meter 0
    - Test privacy opt-in/opt-out flow
    - Test mutation compatibility edge cases
    - Test data persistence across page reloads
    - _Requirements: All requirements_

  - [ ]\* 27.3 Conduct mobile testing

    - Test on actual Android and iOS devices
    - Verify 30fps performance
    - Test touch controls for care actions
    - Test HUD drawer on various screen sizes
    - Test mutation choice UI on small screens
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

  - [ ]\* 27.4 Performance testing
    - Measure API response times (target < 200ms)
    - Test Redis operations under load
    - Measure client FPS with 20+ mutations
    - Test scheduler with multiple familiars
    - Test care action cooldown enforcement
    - _Requirements: Performance requirements from design_
