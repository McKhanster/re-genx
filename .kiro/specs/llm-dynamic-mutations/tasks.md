# Implementation Plan

- [ ] 1. Create core API endpoints for creature personality

  - Create POST `/api/creature/interact` endpoint in `src/server/index.ts`
  - Create GET `/api/creature/personality` endpoint for current state
  - Create POST `/api/privacy/consent` endpoint for privacy compliance
  - Add proper request validation and error handling
  - _Requirements: 1.1, 1.5, 5.1, 5.4_

- [ ] 1.1 Set up Gemini API configuration

  - Add `generativelanguage.googleapis.com` to allowed domains in `devvit.json`
  - Configure HTTP fetch permissions for Gemini API
  - Add GEMINI_API_KEY environment variable handling
  - Test API connectivity with basic structured response request
  - _Requirements: 1.2, 1.6_

- [ ] 1.2 Implement creature interaction endpoint

  - Accept POST requests with creature ID, event type (birth, feeding, mutation), and context
  - Build creature context including age, current personality, and subreddit theme
  - Call Gemini Service to generate personality response
  - Validate response JSON schema and store in Redis
  - Return personality data to client for display
  - _Requirements: 1.1, 1.3, 3.1, 3.2_

- [ ] 1.3 Implement personality state endpoint

  - Accept GET requests with creature ID
  - Retrieve current personality state from Redis
  - Return cached personality data or fallback responses if unavailable
  - Include timestamp for client-side caching
  - Add error handling for missing creature data
  - _Requirements: 1.5, 4.3, 9.4_

- [ ] 1.4 Add privacy consent management

  - Create consent storage in Redis with user ID as key
  - Implement consent validation before any Gemini API calls
  - Add consent revocation functionality
  - Return appropriate responses for users without consent
  - Log consent status for compliance auditing
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 2. Create Gemini Service for creature personality

  - Create `src/server/llm/gemini-service.ts` with GeminiService class
  - Install Google Generative AI SDK: `npm install @google/generative-ai`
  - Add environment variable GEMINI_API_KEY to .env.template
  - Import GoogleGenerativeAI from '@google/generative-ai'
  - _Requirements: 1.2, 9.1_

- [ ] 2.1 Initialize Gemini API client

  - In constructor, accept apiKey parameter
  - Create `this.genAI = new GoogleGenerativeAI(apiKey)`
  - Create `this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' })`
  - Add system instructions for creature personality generation
  - _Requirements: 1.2, 9.1_

- [ ] 2.2 Implement generatePersonality method

  - Create `async generatePersonality(context: CreatureContext): Promise<CreaturePersonality>`
  - Call `buildPersonalityPrompt(context)` to construct structured prompt
  - Use `Promise.race([this.model.generateContent(prompt), this.timeout(25000)])` for 25s timeout
  - Parse response text to extract JSON personality data
  - Return validated CreaturePersonality object
  - _Requirements: 1.2, 1.3, 4.1_

- [ ] 2.3 Build personality prompt with creature context

  - Create `private buildPersonalityPrompt(context: CreatureContext): string`
  - Include creature age, current stats, and recent interactions
  - Include subreddit theme if detected: `context.subredditTheme`
  - Add JSON schema requirements for structured response
  - Include intelligence level guidelines for response complexity
  - Request specific fields: mood, energy, sound, movement, memory_formed
  - _Requirements: 1.3, 2.2, 9.1, 9.2_

- [ ] 2.4 Implement timeout and error handling

  - Create `private timeout(ms: number): Promise<never>` helper
  - Wrap generateContent call in try-catch with detailed error logging
  - Handle network errors, API errors, and timeout scenarios
  - Return null on failure to trigger fallback personality system
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 2.5 Add response validation

  - Create response validator to check required JSON fields
  - Validate mood is one of allowed values
  - Validate energy is 0-100 number
  - Validate sound and movement are non-empty strings
  - Log validation errors and return null for invalid responses
  - _Requirements: 9.2, 9.3, 9.5_

- [ ] 3. Create Subreddit Analyzer for theme detection

  - Create `src/server/llm/subreddit-analyzer.ts` with SubredditAnalyzer class
  - Import Devvit Reddit API types for subreddit data access
  - Add theme detection logic using keyword matching
  - Create theme mapping for common subreddit patterns
  - _Requirements: 2.1, 2.2_

- [ ] 3.1 Implement theme detection method

  - Create `detectTheme(subredditName: string): string` method
  - Define theme categories: space, ocean, tech, nature, art, gaming, general
  - Use keyword matching against subreddit name
  - Return detected theme or 'general' as fallback
  - Cache theme detection results in Redis for performance
  - _Requirements: 2.1, 2.2, 2.5_

- [ ] 3.2 Add privacy-compliant subreddit analysis

  - Only analyze publicly available subreddit names and descriptions
  - Never process individual user data or behavior patterns
  - Focus on subreddit-level themes without user profiling
  - Ensure compliance with Reddit's privacy and data protection rules
  - _Requirements: 2.3, 8.1, 8.2, 8.3_

- [ ] 3.3 Implement theme caching and optimization

  - Cache theme detection results in Redis with 24-hour TTL
  - Use subreddit name as cache key for theme lookup
  - Add fallback to 'general' theme if detection fails
  - Log theme detection for monitoring and debugging
  - _Requirements: 2.4, 6.2_

- [ ] 4. Implement Personality State Manager

  - Create `src/server/llm/personality-state.ts` for Redis state management
  - Define CreaturePersonality interface with mood, energy, sound, movement fields
  - Implement state persistence and retrieval methods
  - Add timestamp tracking for cache invalidation
  - _Requirements: 1.4, 9.4, 6.1_

- [ ] 4.1 Create personality state storage

  - Implement `savePersonality(creatureId: string, personality: CreaturePersonality)` method
  - Use Redis hash storage with creature ID as key
  - Include timestamp for cache management and TTL
  - Add error handling for Redis connection failures
  - _Requirements: 1.4, 9.4_

- [ ] 4.2 Implement personality state retrieval

  - Create `getPersonality(creatureId: string): Promise<CreaturePersonality | null>` method
  - Retrieve personality data from Redis hash
  - Parse JSON fields and validate data integrity
  - Return null if data is missing or corrupted
  - _Requirements: 1.5, 4.3_

- [ ] 5. Create Fallback Personality System

  - Create `src/server/llm/fallback-personality.ts` for hardcoded responses
  - Implement basic personality responses for when Gemini API fails
  - Add "sleeping" or "dormant" states for system failures
  - Integrate with existing game mechanics for consistency
  - _Requirements: 4.1, 4.2, 4.4, 4.5, 7.5_

- [ ] 6. Create Trigger Manager for LLM calls

  - Create `src/server/llm/trigger-manager.ts` to control when Gemini is called
  - Define trigger events: birth, feeding, mutation, hourly evolution
  - Implement cost-conscious trigger logic to minimize API calls
  - Add rate limiting per creature to prevent excessive costs
  - _Requirements: 3.1, 3.2, 6.3, 6.4, 6.5_

- [ ] 6.1 Implement trigger event detection

  - Create methods for each trigger type: `onBirth()`, `onFeeding()`, `onMutation()`, `onHourlyUpdate()`
  - Add context gathering for each trigger type
  - Implement trigger cooldowns to prevent spam
  - Log trigger events for cost monitoring
  - _Requirements: 3.1, 3.2, 6.4_

- [ ] 6.2 Add cost optimization logic

  - Implement caching with 10-minute TTL for identical contexts
  - Add daily API call limits per creature
  - Use Redis to track API usage and costs
  - Implement graceful degradation when limits are reached
  - _Requirements: 6.1, 6.2, 6.3, 6.5_

- [ ] 7. Implement Client-Side Personality Display

  - Create `src/client/personality/personality-display.ts` for visual personality expression
  - Add mood-based animations (playful bouncing, sleepy slow movement)
  - Implement sound text display in HUD with appropriate styling
  - Add energy-based visual effects (brightness, movement speed)
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 7.1 Create personality animation system

  - Map personality moods to Three.js animations
  - Implement movement patterns: still, wiggling, pulsing, dancing, exploring
  - Add energy-based animation speed and intensity
  - Integrate with existing creature rendering system
  - _Requirements: 7.1, 7.4_

- [ ] 7.2 Add personality HUD display

  - Display LLM-generated sounds and speech in game HUD
  - Add mood indicators and energy bars
  - Implement text animations for creature communications
  - Show fallback "sleeping" state when AI is unavailable
  - _Requirements: 7.2, 7.5_

- [ ] 8. Create Privacy Policy and Terms of Service

  - Create `docs/privacy-policy.md` with Reddit-compliant privacy policy
  - Create `docs/terms-of-service.md` with clear AI usage terms
  - Add privacy consent UI in client for first-time users
  - Implement consent storage and validation in server
  - _Requirements: 5.1, 5.2, 5.5_

- [ ] 8.1 Implement privacy consent UI

  - Create consent modal for first-time users
  - Display clear privacy policy and terms of service
  - Add opt-in/opt-out toggles for AI features
  - Store consent decisions in Redis
  - _Requirements: 5.1, 5.2_

- [ ] 8.2 Add consent validation middleware

  - Check user consent before any Gemini API calls
  - Return appropriate responses for users without consent
  - Log consent status for compliance auditing
  - Implement consent revocation functionality
  - _Requirements: 5.3, 5.4_

- [ ] 9. Integrate with existing Re-GenX systems

  - Connect personality system to existing mutation triggers
  - Integrate with creature stat changes and aging system
  - Ensure personality responses reflect game state changes
  - Maintain compatibility with existing game mechanics
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 10. Add monitoring and cost tracking

  - Track Gemini API usage and costs per creature
  - Monitor personality generation latency and success rates
  - Log fallback system activations
  - Add cost alerts and usage dashboards
  - _Requirements: 4.2, 6.4, 6.5_

- [ ]\* 11. Write integration tests

  - Test end-to-end personality generation with mock Gemini API
  - Test privacy consent flow and validation
  - Test fallback system activation
  - Test subreddit theme detection
  - Test integration with existing game systems
  - _Requirements: All_

- [ ]\* 12. Optimize for production
  - Add rate limiting on Gemini calls per user/creature
  - Implement request queuing for high traffic periods
  - Optimize token usage (target 100-200 tokens per response)
  - Add performance monitoring and alerting
  - Implement graceful degradation strategies
  - _Requirements: 6.4, 6.5_
