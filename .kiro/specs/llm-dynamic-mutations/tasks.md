# Implementation Plan

- [x] 1. Create API endpoints for LLM integration

  - Create POST `/api/mutation/generate` endpoint in `src/server/index.ts`
  - Create POST `/api/mutation/apply` endpoint for applying mutations
  - Create GET `/api/creature/state` endpoint for context building
  - Add proper request validation and error handling
  - _Requirements: 1.4, 8.1, 8.2_

- [x] 1.1 Set up Gemini API configuration

  - Add `generativeai.googleapis.com` to allowed domains in `devvit.json`
  - Configure HTTP fetch permissions for Gemini API
  - Add GEMINI_API_KEY environment variable handling
  - Test API connectivity with basic request
  - _Requirements: 1.2, 1.4_

- [ ] 1.2 Implement mutation generation endpoint

  - Accept POST requests with creature ID and user context
  - Build mutation context using ContextBuilder
  - Call GeminiProcessor to generate mutations
  - Return JSON array of mutation options
  - Add caching with 5-minute TTL
  - _Requirements: 1.2, 1.5, 6.1_

- [ ] 1.3 Implement mutation application endpoint

  - Accept POST requests with mutation data and creature ID
  - Validate mutation parameters and stat effects
  - Apply mutation to creature in Redis
  - Broadcast update via Devvit realtime channels
  - Return updated creature state
  - _Requirements: 8.2, 8.3, 9.1_

- [ ] 1.4 Add realtime broadcasting

  - Use `@devvit/web/server` realtime.send() for live updates
  - Create creature-specific channels: `creature:${creatureId}`
  - Broadcast mutation events, stat changes, and biome updates
  - Handle connection management and error recovery
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 2. Create Gemini LLM Processor file

  - Create `src/server/llm/gemini-processor.ts` with GeminiProcessor class
  - Install Google Generative AI SDK: `npm install @google/generative-ai`
  - Add environment variable GEMINI_API_KEY to .env.template
  - Import GoogleGenerativeAI from '@google/generative-ai'
  - _Requirements: 1.2_

- [x] 2.1 Initialize Gemini API client

  - In constructor, accept apiKey parameter
  - Create `this.genAI = new GoogleGenerativeAI(apiKey)`
  - Create `this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' })`
  - _Requirements: 1.2_

- [x] 2.2 Implement generateMutationOptions method

  - Create `async generateMutationOptions(context: MutationContext): Promise<MutationOption[]>`
  - Call `buildMutationPrompt(context)` to construct prompt
  - Use `Promise.race([this.model.generateContent(prompt), this.timeout(25000)])` for 25s timeout
  - Parse response text with regex `/\[[\s\S]*\]/` to extract JSON array
  - Return parsed MutationOption[] array
  - _Requirements: 1.2, 1.5, 4.1_

- [x] 2.3 Build mutation prompt with full context

  - Create `private buildMutationPrompt(context: MutationContext): string`
  - Include creature stats: `JSON.stringify(context.stats)`
  - Include last 3 mutations: `context.mutations.map(m => m.category).join(', ')`
  - Include biome: `context.biome`
  - Include activity category if privacy opt-in: `context.activityCategory`
  - Add Three.js geometry guidelines (primitives, dimensions, materials)
  - Add stat balance rules (total delta ≤ 0)
  - Request JSON output with complete AddMutationParams structure
  - _Requirements: 3.1, 3.2, 5.1_

- [x] 2.4 Implement timeout helper

  - Create `private timeout(ms: number): Promise<never>`
  - Return `new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))`
  - _Requirements: 4.1_

- [x] 2.5 Add error handling and validation

  - Wrap generateContent call in try-catch
  - Check if response contains valid JSON with regex
  - Validate each mutation option has required fields: id, category, label, geometry, material, transform
  - Throw error if validation fails
  - _Requirements: 4.2, 4.3_

- [ ] 3. Create Context Builder file

  - Create `src/server/llm/context-builder.ts` with ContextBuilder class
  - Import RedisClient from '@devvit/web/server'
  - Import FamiliarStats, MutationData, BiomeType from shared types
  - Add constructor accepting RedisClient
  - _Requirements: 1.1_

- [ ] 3.1 Implement buildMutationContext method

  - Create `async buildMutationContext(userId: string, creatureId: string): Promise<MutationContext>`
  - Call `redis.hGetAll(\`creature:\${creatureId}\`)` to get creature data
  - Parse stats: `JSON.parse(creatureData.stats || '{}')`
  - Parse mutations: `JSON.parse(creatureData.mutations || '[]')`
  - Get biome: `creatureData.biome as BiomeType`
  - Get last 3 mutations: `mutations.slice(-3)`
  - _Requirements: 1.1, 3.1, 3.2_

- [ ] 3.2 Add privacy opt-in logic

  - Check `creatureData.privacyOptIn === 'true'`
  - If true, call `getActivityPattern(userId)`
  - Get dominant category from pattern
  - Include in context as `activityCategory`
  - If false, set `activityCategory` to undefined
  - _Requirements: 5.1, 5.4_

- [ ] 3.3 Implement getActivityPattern helper

  - Create `private async getActivityPattern(userId: string): Promise<ActivityPattern>`
  - Call `redis.hGetAll(\`activity:\${userId}\`)`
  - Parse categories: `JSON.parse(patternData.categories || '{}')`
  - Return object with categories, dominantCategory, lastUpdated
  - _Requirements: 5.1_

- [ ] 4. Implement Mutation Cache with Redis

  - Create cache key generation using creature ID and context hash
  - Implement 5-minute TTL for cached mutations
  - Add cache hit/miss tracking
  - _Requirements: 1.6, 6.1, 6.2, 6.3_

- [ ] 5. Create Fallback System

  - Implement fallback to hardcoded mutations on LLM failure
  - Add Redis flag for 5-minute LLM skip period
  - Integrate with existing mutation-engine.ts
  - _Requirements: 1.7, 4.1, 4.2, 4.4, 4.5_

- [ ] 6. Build Realtime Client Integration

  - Use `@devvit/web/client` connectRealtime for live updates
  - Subscribe to creature-specific channels in Three.js client
  - Handle mutation events and update scene in real-time
  - Add reconnection logic and error handling
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 7. Implement Mutation Geometry Builder

  - Create geometry builder for ALL Three.js primitives (box, sphere, cylinder, cone, torus, torusKnot, plane, circle, ring, polyhedrons, lathe, tube)
  - Implement custom buffer geometry support (positions, normals, UVs, colors, indices, tangents, morph targets, groups)
  - Add material creation (basic, phong, standard, physical)
  - Implement transform application (position, rotation, scale)
  - _Requirements: 8.4, 10.2_

- [ ] 8. Create Animation System

  - Implement keyframe animation with TWEEN.js
  - Add easing functions (linear, easeIn, easeOut, easeInOut, elastic)
  - Support loop and yoyo animations
  - Integrate with on-demand rendering
  - _Requirements: 8.3, 8.4_

- [ ] 9. Build On-Demand Rendering Manager

  - Create RenderManager with requestRender pattern
  - Implement dirty flag system for scene changes
  - Add continuous rendering mode for animations
  - Optimize for mobile (reduce update frequency)
  - _Requirements: 8.4, 9.5_

- [ ] 10. Implement Camera Controller

  - Create camera control handler with position, lookAt, fov, zoom
  - Add camera animation with TWEEN.js
  - Implement preset camera views (cinematic, close-up, top-down)
  - Integrate with mutation application
  - _Requirements: 10.2_

- [ ] 11. Create Scene Generator for biome modifications

  - Implement LLM-driven biome variation requests
  - Parse color schemes and object types from LLM responses
  - Apply ground material color adjustments
  - Generate/modify environmental objects within 5ft radius
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 12. Build Atmospheric Description System

  - Request 2-3 sentence descriptions from LLM
  - Display descriptions in HUD with 5-second fade
  - Implement smooth fade in/out animations
  - Add fallback generic descriptions
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 13. Integrate with existing mutation system

  - Connect LLM Processor to mutation request flow
  - Update mutation-engine.ts to use LLM-generated options
  - Maintain compatibility with existing mutation application
  - Ensure stat effects are validated and applied correctly
  - _Requirements: 1.5, 3.3, 3.4_

- [ ] 14. Add client-side realtime subscription

  - Import `connectRealtime` from `@devvit/web/client` in Three.js client
  - Subscribe to creature channels on scene initialization
  - Handle incoming mutation events and apply to scene
  - Update HUD and stats display in real-time
  - _Requirements: 9.1, 9.2, 9.3_

- [ ] 15. Implement LOD and instancing support

  - Add Level of Detail system for complex mutations
  - Implement instanced rendering for repeated geometries (e.g., legs)
  - Add mobile simplification hints
  - Optimize geometry complexity based on device
  - _Requirements: 8.4, 9.5_

- [ ] 16. Add monitoring and logging

  - Track LLM API latency and error rate
  - Monitor cache hit rate
  - Log fallback activations
  - Track realtime connection stability
  - Monitor render calls and geometry complexity
  - _Requirements: 4.2, 6.4_

- [ ]* 17. Write integration tests

  - Test end-to-end mutation flow with mock Gemini API
  - Test realtime communication between server and client
  - Test fallback system activation
  - Test camera control integration
  - _Requirements: All_

- [ ]* 18. Optimize for production
  - Add rate limiting on LLM calls
  - Implement request queuing for high traffic
  - Optimize token usage (target 150-300 tokens per response)
  - Pre-generate mutations for waiting room creatures
  - _Requirements: 6.4, 6.5_
