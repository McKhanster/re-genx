# Requirements Document

## Introduction

This feature introduces LLM-powered creature personality and dynamic evolution to Re-GenX using Google Gemini API within Devvit's serverless architecture. The LLM acts as the creature's "brain," generating contextual personality responses, behaviors, and evolution based on creature state, subreddit themes, and player interactions. The system consists of: (1) server-side Gemini integration via API endpoints, (2) creature personality state management in Redis, and (3) privacy-compliant subreddit theme detection for environmental influence.

## Glossary

- **Creature Brain**: LLM-powered personality system that generates creature responses, moods, and behaviors based on current state and interactions
- **Gemini Service**: Server-side component that sends structured prompts to Google Gemini API and processes JSON responses for creature personality
- **Personality State**: Redis-stored creature personality data including mood, energy, sounds, movement patterns, and memory
- **Subreddit Analyzer**: Privacy-compliant system that detects themes from subreddit names to influence creature personality (e.g., r/space → space-themed behaviors)
- **Trigger Manager**: Determines when to call the LLM based on events (birth, feeding, mutations, hourly evolution)
- **Response Validator**: Ensures LLM responses match expected JSON schema for creature personality data
- **Fallback Personality**: Hardcoded creature responses used when Gemini API is unavailable
- **Privacy Compliance**: System ensures no individual user profiling, only aggregated subreddit-level theme detection
- **Cost Optimizer**: Redis-based caching and rate limiting to minimize LLM API costs while maintaining responsive creature behavior

## Requirements

### Requirement 1

**User Story:** As a player, I want my creature to have a unique personality that evolves over time, so that it feels like a living being with its own character

#### Acceptance Criteria

1. WHEN THE creature is born, THE Gemini Service SHALL call `/api/creature/interact` with birth context to generate initial personality
2. WHEN THE Gemini Service receives creature context, THE Gemini Service SHALL send a structured prompt to Google Gemini API requesting personality response in JSON format
3. WHEN THE Gemini API returns personality data, THE Response Validator SHALL verify the JSON matches the expected schema (mood, energy, sound, movement)
4. WHEN THE personality data is validated, THE Personality State SHALL store it in Redis with creature ID as key
5. WHEN THE client requests creature state, THE API SHALL return current personality data for display in the Three.js scene
6. IF THE Gemini API fails or exceeds 25 seconds, THEN THE Fallback Personality SHALL return basic hardcoded responses
7. WHEN THE creature ages, THE personality SHALL evolve from simple sounds to more complex expressions based on intelligence level

### Requirement 2

**User Story:** As a player, I want my creature's personality to be influenced by the subreddit theme, so that it feels connected to the community environment

#### Acceptance Criteria

1. WHEN THE creature is created, THE Subreddit Analyzer SHALL detect the theme from the subreddit name using keyword matching
2. WHEN THE Subreddit Analyzer identifies a theme, THE theme SHALL be included in Gemini prompts to influence creature personality
3. WHEN THE Gemini Service generates personality responses, THE responses SHALL incorporate thematic elements (e.g., space themes for r/space, ocean themes for r/ocean)
4. WHEN THE creature interacts over time, THE personality SHALL maintain thematic consistency while still evolving naturally
5. WHERE THE subreddit has no detectable theme, THE creature SHALL develop a general personality without specific thematic influence
6. WHILE THE creature ages, THE thematic influence SHALL remain consistent but allow for personality growth and change

### Requirement 3

**User Story:** As a player, I want my creature to respond to my interactions, so that feeding and caring for it feels meaningful

#### Acceptance Criteria

1. WHEN THE player feeds the creature, THE Trigger Manager SHALL call the Gemini Service with feeding context
2. WHEN THE Gemini Service receives feeding context, THE creature's personality SHALL reflect increased energy and positive mood
3. WHEN THE creature receives a mutation, THE Trigger Manager SHALL call the Gemini Service to generate personality response to the change
4. WHEN THE creature experiences events, THE Personality State SHALL store memory of recent interactions for context in future responses
5. WHERE THE player has not interacted recently, THE creature SHALL show signs of loneliness or boredom in its personality responses

### Requirement 4

**User Story:** As a developer, I want the LLM integration to handle failures gracefully, so that creatures remain responsive even when Gemini API is unavailable

#### Acceptance Criteria

1. WHEN THE Gemini Service request exceeds 25 seconds, THE Fallback Personality SHALL cancel the request and return basic responses
2. WHEN THE Gemini Service returns an error, THE Fallback Personality SHALL log the error and provide hardcoded personality responses
3. WHEN THE Gemini Service returns invalid JSON, THE Response Validator SHALL use fallback responses and log the parsing error
4. WHEN THE Fallback Personality activates, THE system SHALL set a Redis flag to skip Gemini calls for 5 minutes to prevent repeated failures
5. WHILE THE fallback mode is active, THE creature SHALL display "sleeping" or "dormant" personality states until service is restored

### Requirement 5

**User Story:** As a player, I want to understand how my data is used and give consent for AI features, so that I can make informed privacy choices

#### Acceptance Criteria

1. WHEN THE player first loads the game, THE system SHALL display Privacy Policy and Terms of Service with clear consent options
2. WHEN THE player consents to AI features, THE system SHALL store their consent status in Redis for future reference
3. WHEN THE player opts out of AI features, THE creature SHALL use only hardcoded personality responses without Gemini integration
4. WHERE THE player has not given consent, THE system SHALL not send any data to external LLM services
5. WHEN THE Privacy Policy is updated, THE system SHALL request renewed consent from all players before using AI features

### Requirement 6

**User Story:** As a developer, I want to minimize Gemini API costs while maintaining responsive creature personalities, so that the feature is sustainable at scale

#### Acceptance Criteria

1. WHEN THE Cost Optimizer caches personality responses, THE system SHALL use creature ID and context hash as the cache key
2. WHEN THE Gemini Service checks cache, THE system SHALL reuse cached responses for identical contexts within 10 minutes
3. WHEN THE Trigger Manager evaluates events, THE system SHALL limit Gemini calls to essential triggers (birth, feeding, mutations, hourly evolution)
4. WHEN THE Gemini Service makes API calls, THE system SHALL use concise prompts targeting 100-200 tokens per response
5. WHILE THE creature is inactive, THE system SHALL reduce call frequency to hourly background evolution updates only

### Requirement 7

**User Story:** As a player, I want to see my creature's personality expressed visually in the game, so that its AI-generated traits feel real and engaging

#### Acceptance Criteria

1. WHEN THE creature has a "playful" mood, THE Three.js Client SHALL display bouncing or dancing movement animations
2. WHEN THE creature makes sounds, THE HUD SHALL display the LLM-generated sound text with appropriate styling and timing
3. WHEN THE creature's energy is low, THE visual representation SHALL show slower, more subdued movements and dimmer colors
4. WHEN THE creature evolves intelligence, THE visual complexity SHALL increase with more sophisticated movement patterns
5. WHERE THE creature is in fallback mode, THE visual representation SHALL show a "sleeping" or "dormant" state with minimal animation

### Requirement 8

**User Story:** As a developer, I want the system to comply with Reddit's privacy and data protection rules, so that the app can be approved and published

#### Acceptance Criteria

1. WHEN THE system processes subreddit data, THE Subreddit Analyzer SHALL only use publicly available subreddit names and descriptions
2. WHEN THE system detects themes, THE analysis SHALL be aggregated at subreddit level without individual user profiling
3. WHEN THE Gemini Service sends data, THE system SHALL never include personal user information or individual behavior patterns
4. WHEN THE system stores data, THE Privacy Compliance SHALL ensure no data is used for surveillance, profiling, or commercialization
5. WHERE THE system uses external APIs, THE Privacy Policy SHALL clearly disclose data sharing with Google Gemini for creature personality generation

### Requirement 9

**User Story:** As a developer, I want structured and predictable responses from Gemini, so that the creature personality system is reliable and maintainable

#### Acceptance Criteria

1. WHEN THE Gemini Service constructs prompts, THE prompts SHALL include clear JSON schema requirements for creature personality responses
2. WHEN THE Gemini API returns responses, THE Response Validator SHALL verify all required fields are present (mood, energy, sound, movement)
3. WHEN THE response validation fails, THE system SHALL log the error and use the most recent valid personality state from Redis
4. WHEN THE personality data is valid, THE system SHALL update the creature's state in Redis with timestamp for cache management
5. WHERE THE response contains unexpected fields, THE system SHALL ignore them and use only the defined schema fields

### Requirement 10

**User Story:** As a developer, I want the creature personality system to integrate seamlessly with the existing Re-GenX game mechanics, so that AI features enhance rather than replace current gameplay

#### Acceptance Criteria

1. WHEN THE creature receives mutations through existing game mechanics, THE Trigger Manager SHALL call Gemini Service to generate personality responses to the changes
2. WHEN THE creature's stats change, THE personality responses SHALL reflect the stat changes in mood and behavior patterns
3. WHEN THE existing mutation system applies changes, THE Personality State SHALL incorporate the mutation context into future LLM prompts
4. WHEN THE creature ages through existing game mechanics, THE intelligence level SHALL increase and affect the complexity of Gemini-generated responses
5. WHERE THE existing game systems conflict with AI responses, THE existing game mechanics SHALL take precedence to maintain gameplay balance
