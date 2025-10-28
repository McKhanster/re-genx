# Requirements Document

## Introduction

Re-GenX is a personal creature companion simulator built on Reddit's Devvit platform where each player nurtures and evolves their own unique familiar. Similar to a VR Tamagotchi, the system presents a pulsating blob creature in a dramatic 3D spotlight setting with 5ft visibility radius, allowing 360° viewing. Players must actively care for their familiar through feeding, playing, and attention, or risk having it taken away. The creature evolves through controlled mutations (player-directed choices) and uncontrolled mutations (influenced by the player's Reddit activity and posting patterns). The experience combines personal responsibility, strategic evolution choices, and personality reflection to create an intimate, engaging bond between player and familiar.

## Privacy and Data Compliance

**CRITICAL: Reddit Devvit Privacy Rules**

This application MUST comply with Reddit's strict privacy and data protection requirements:

**Prohibited Actions:**

- ❌ **Never track which subreddits a user visits** - Cannot monitor browsing history or subreddit visits
- ❌ **Never profile users** - Cannot infer personal characteristics (race, religion, politics, health, sexuality, etc.)
- ❌ **Never surveil users** - Cannot gather intelligence or track users for surveillance purposes
- ❌ **Never sell or commercialize data** - Cannot sell, license, or share user data with third parties
- ❌ **Never access private information** - Cannot request passwords, credentials, or personal information

**Permitted Actions:**

- ✅ **Access public posts/comments** - Can analyze user's public Reddit posts and comments (with GetPostsByUserOptions API)
- ✅ **Track in-app interactions** - Can monitor user behavior within the Re-GenX app only
- ✅ **Store game data in Redis** - Can persist Familiar state, care history, and evolution data
- ✅ **Analyze posting patterns** - Can examine frequency, subreddit categories (public), and content types of user's posts
- ✅ **Require explicit consent** - Must get user permission before any data processing or actions on their behalf

**Implementation Requirements:**

1. All user data analysis must be limited to publicly available posts/comments
2. Activity patterns must be derived from posting behavior, NOT subreddit visits
3. User must explicitly opt-in to personality reflection features
4. All data must be stored securely in Redis with proper access controls
5. Privacy policy and terms of service required if collecting any personal information

**Data Minimization:**

- Only collect data necessary for Familiar evolution and care mechanics
- Do not store unnecessary user information
- Aggregate and anonymize data where possible
- Respect user decisions to opt-out or remove their data

## Glossary

- **System**: The Re-GenX application running on Reddit's Devvit platform
- **Familiar**: A personal pulsating blob creature displayed in spotlight with visual mutations and stat attributes that evolves based on player care and choices
- **Player**: A single Reddit user who owns and cares for one Familiar
- **Care Meter**: A value (0-100) representing the Familiar's wellbeing based on feeding, playing, and attention
- **Evolution Cycle**: A time-bounded period (30 minutes to 4 hours) representing one evolutionary phase
- **Controlled Mutation**: A genetic change where the Player chooses from 3-5 trait options (randomness factor 0.85-0.95)
- **Uncontrolled Mutation**: A random genetic change that occurs automatically, influenced by Player's Reddit posting patterns (randomness factor 0.05-0.15)
- **Randomness Factor**: A value between 0 and 1 representing how much control vs randomness applies to a mutation (0 = pure random, 1 = pure control)
- **Evolution Points**: Virtual currency earned through caring for the Familiar, used to trigger Controlled Mutations
- **Mutation Choice**: A selection interface where the Player picks traits for a Controlled Mutation
- **Trait**: A specific characteristic of a Mutation (e.g., number of legs, color, size)
- **Spotlight Effect**: The visual presentation showing the Familiar illuminated from above with 5ft visibility radius
- **HUD**: Heads-Up Display implemented as a slide-up/down drawer menu showing Familiar stats in neon futuristic styling
- **Activity Pattern**: Data about the Player's Reddit posting behavior (subreddits posted to, frequency, content type) influencing Uncontrolled Mutations - derived from public posts only, never from browsing history
- **Biome**: An environmental setting (jungle, rocky mountain, etc.) visible within the 5ft radius
- **Mutation Animation**: A 2-3 second visual transition showing the Familiar changing
- **Stat Category**: A grouping of related attributes (Mobility, Senses, Survival, Cognition, Vitals)
- **Age**: A stat representing how many Evolution Cycles the Familiar has survived
- **Neglect State**: A condition where Care Meter drops below 20, triggering warnings
- **Removal**: The consequence of prolonged neglect where the Familiar is taken away (not death)

## Requirements

### Requirement 1: Personal Familiar Creation

**User Story:** As a new player, I want to receive my own personal familiar, so that I can begin nurturing and evolving it.

#### Acceptance Criteria

1. WHEN a user opens the Re-GenX app for the first time, THE System SHALL display the 3D environment with spotlight effect immediately
2. IF the user does not have a Familiar, THEN THE System SHALL create a new Familiar with base pulsating blob appearance
3. THE System SHALL initialize the Familiar with default stats and a Care Meter at 100
4. THE System SHALL display a welcome message explaining the care mechanics
5. THE System SHALL allow only one Familiar per user account

### Requirement 2: Visual Presentation and Spotlight Effect

**User Story:** As a player, I want to see my creature in a dramatic spotlight setting, so that I feel immersed in the evolution experience.

#### Acceptance Criteria

1. THE System SHALL render the Creature as a pulsating blob at the center of the viewport
2. THE System SHALL illuminate the Creature with a directional light from directly above
3. THE System SHALL render the environment visible within a 5-foot radius around the Creature
4. BEYOND the 5-foot radius, THE System SHALL render complete darkness
5. THE System SHALL allow users to rotate the camera 360 degrees around the Creature while keeping it centered

### Requirement 3: Neon HUD Display

**User Story:** As a player, I want to see my familiar's stats in a futuristic HUD that I can show or hide, so that I can monitor its wellbeing without cluttering the view.

#### Acceptance Criteria

1. THE System SHALL implement the HUD as a slide-up drawer menu with neon styling
2. WHEN a user taps or clicks the HUD handle, THE System SHALL animate the drawer sliding up or down over 0.3 seconds
3. WHEN the HUD is expanded, THE System SHALL display the Familiar's Age, Care Meter, all stat categories, Evolution Points balance, and next care action needed
4. THE System SHALL update HUD values in real-time when stats change
5. THE System SHALL default the HUD to collapsed state on initial load, showing only essential info (Care Meter and next Evolution Cycle countdown)

### Requirement 4: Care Mechanics and Meter

**User Story:** As a player, I want to care for my familiar through feeding, playing, and attention, so that it stays healthy and happy.

#### Acceptance Criteria

1. THE System SHALL maintain a Care Meter value between 0 and 100 for each Familiar
2. THE System SHALL decrease the Care Meter by 5 points every hour automatically
3. WHEN a player feeds the Familiar, THE System SHALL increase the Care Meter by 15 points
4. WHEN a player plays with the Familiar, THE System SHALL increase the Care Meter by 10 points
5. WHEN a player gives attention to the Familiar, THE System SHALL increase the Care Meter by 5 points

### Requirement 5: Neglect Warning and Removal System

**User Story:** As a player, I want to be warned when my familiar is being neglected, so that I can prevent it from being taken away.

#### Acceptance Criteria

1. WHEN the Care Meter drops below 20, THE System SHALL display a warning notification
2. THE System SHALL change the Familiar's appearance to look sad or distressed when Care Meter is below 20
3. IF the Care Meter reaches 0 and stays at 0 for 24 hours, THEN THE System SHALL remove the Familiar
4. WHEN a Familiar is removed, THE System SHALL display a message explaining the removal and allow the player to start over with a new Familiar
5. THE System SHALL never show death animations or death messages, only removal messages

### Requirement 6: Evolution Cycle Timing

**User Story:** As a player, I want my familiar to evolve at a Tamagotchi-like pace, so that I can check in regularly without waiting too long between changes.

#### Acceptance Criteria

1. THE System SHALL trigger an Evolution Cycle at intervals between 30 minutes and 4 hours
2. WHEN an Evolution Cycle begins, THE System SHALL increment the Familiar's Age by 1
3. THE System SHALL determine randomly whether the Evolution Cycle includes an Uncontrolled Mutation with 20% probability
4. THE System SHALL display a countdown timer showing time until the next Evolution Cycle
5. THE System SHALL persist the Evolution Cycle schedule to Redis to survive server restarts

### Requirement 7: Evolution Points System

**User Story:** As a player, I want to earn points by caring for my familiar, so that I can trigger controlled mutations.

#### Acceptance Criteria

1. THE System SHALL maintain an Evolution Points balance for each player, starting at 0
2. WHEN a player feeds the Familiar, THE System SHALL award 10 Evolution Points
3. WHEN a player plays with the Familiar, THE System SHALL award 15 Evolution Points
4. WHEN a player gives attention to the Familiar, THE System SHALL award 5 Evolution Points
5. THE System SHALL display the Evolution Points balance in the HUD

### Requirement 8: Controlled Mutation Triggering

**User Story:** As a player, I want to spend Evolution Points to trigger controlled mutations, so that I can guide my familiar's evolution.

#### Acceptance Criteria

1. THE System SHALL price Controlled Mutations at 100 Evolution Points
2. WHEN a player initiates a Controlled Mutation, THE System SHALL deduct 100 points from their balance
3. IF the player has insufficient points, THEN THE System SHALL prevent the mutation and display the current balance
4. WHEN a Controlled Mutation is triggered, THE System SHALL present 3-5 trait options for the player to choose from
5. THE System SHALL apply the chosen trait immediately after selection

### Requirement 9: Controlled Mutation Trait Selection

**User Story:** As a player, I want to see clear options for each trait, so that I can make informed choices about my familiar's evolution.

#### Acceptance Criteria

1. FOR each Controlled Mutation, THE System SHALL generate 3 to 5 trait options
2. WHEN presenting leg mutations, THE System SHALL offer options for number of legs (2, 4, 6, 8)
3. WHEN presenting color mutations, THE System SHALL offer options from a predefined palette
4. WHEN presenting size mutations, THE System SHALL offer options (tiny, small, medium, large, giant)
5. THE System SHALL display each trait option with a preview showing how it would look on the Familiar

### Requirement 10: Mutation Randomness Spectrum

**User Story:** As a player, I want my familiar to be unique with some unpredictability, so that no two familiars ever look exactly the same.

#### Acceptance Criteria

1. FOR Controlled Mutations, THE System SHALL apply a randomness factor between 0.85 and 0.95 to chosen trait values
2. FOR Uncontrolled Mutations, THE System SHALL apply a randomness factor between 0.05 and 0.15 to base trait values
3. WHEN applying randomness, THE System SHALL use a seeded random generator based on user ID and Evolution Cycle number
4. THE System SHALL vary mutation size, position, and color within acceptable ranges even for identical trait selections
5. THE System SHALL ensure randomness never produces values outside valid bounds (0-100 for stats, valid geometry for visuals)

### Requirement 11: Uncontrolled Mutation System

**User Story:** As a player, I want my familiar to sometimes mutate randomly, so that evolution feels unpredictable and exciting.

#### Acceptance Criteria

1. WHEN an Evolution Cycle triggers an Uncontrolled Mutation, THE System SHALL select a random mutation type
2. THE System SHALL generate random trait values for the Uncontrolled Mutation with high randomness factor (0.05-0.15 control)
3. THE System SHALL apply the Uncontrolled Mutation immediately without player choice
4. THE System SHALL notify the player that an Uncontrolled Mutation occurred
5. THE System SHALL animate the Uncontrolled Mutation over 2 to 3 seconds

### Requirement 12: Activity Pattern Tracking (Privacy-Compliant)

**User Story:** As a player, I want my familiar to evolve based on my Reddit personality, so that it reflects who I am.

#### Acceptance Criteria

1. WHEN a player opts in to personality reflection, THE System SHALL analyze the player's public posts from the past 30 days
2. THE System SHALL categorize posts by subreddit type (gaming, nature, tech, art, etc.) based on public subreddit information
3. WHEN generating an Uncontrolled Mutation, THE System SHALL bias the mutation type toward the player's most frequent posting categories
4. IF the player frequently posts in cat-related subreddits, THEN THE System SHALL increase probability of feline traits by 30%
5. THE System SHALL update activity patterns once per day at midnight UTC

### Requirement 13: Mutation Animation and Visual Feedback

**User Story:** As a player, I want to see smooth animations when mutations occur, so that the evolution feels alive and engaging.

#### Acceptance Criteria

1. WHEN a Mutation is applied, THE System SHALL animate the transformation over 2 to 3 seconds
2. THE System SHALL use smooth interpolation for geometry changes
3. WHEN stats change due to Mutation, THE System SHALL display floating numbers showing increases and decreases
4. THE System SHALL pulse the Familiar's glow during mutation animations
5. THE System SHALL play a subtle sound effect when mutations complete

### Requirement 14: Biome Environment System

**User Story:** As a player, I want to see different environments around my familiar, so that the world feels varied and interesting.

#### Acceptance Criteria

1. THE System SHALL support multiple Biome types: jungle, rocky mountain, desert, ocean, cave
2. WHEN a Familiar is created, THE System SHALL randomly assign a starting Biome
3. THE System SHALL render Biome-appropriate textures and objects within the 5-foot visibility radius
4. EVERY 10 Evolution Cycles, THE System SHALL randomly change the Biome with 15% probability
5. THE System SHALL display the current Biome name in the HUD

### Requirement 15: Mutation Compatibility System

**User Story:** As a player, I want mutations to work together visually, so that my familiar doesn't look broken or glitchy.

#### Acceptance Criteria

1. THE System SHALL maintain a compatibility matrix defining which mutations can coexist
2. WHEN applying a Mutation, THE System SHALL check compatibility with all existing mutations
3. IF a Mutation is incompatible with existing mutations, THEN THE System SHALL prevent its application
4. THE System SHALL display a warning message explaining why a Mutation cannot be applied
5. THE System SHALL suggest alternative compatible Mutations when a conflict occurs

### Requirement 16: Stat Management System

**User Story:** As a player, I want to see how mutations affect my familiar's stats, so that I can understand the trade-offs of my choices.

#### Acceptance Criteria

1. THE System SHALL maintain five Stat Categories: Mobility, Senses, Survival, Cognition, and Vitals
2. WITHIN each Stat Category, THE System SHALL track 3 sub-stats with values ranging from 0 to 100
3. WHEN a Mutation is applied, THE System SHALL update all affected stats according to predefined trade-offs
4. THE System SHALL display stat changes with color-coded indicators (green for increase, red for decrease)
5. THE System SHALL prevent stat values from exceeding 100 or falling below 0

### Requirement 17: Mobile-First User Experience

**User Story:** As a mobile Reddit user, I want the game to work smoothly on my phone, so that I can care for my familiar anywhere.

#### Acceptance Criteria

1. THE System SHALL detect mobile devices and adjust rendering quality accordingly
2. WHEN running on mobile, THE System SHALL target a minimum frame rate of 30 FPS
3. THE System SHALL provide touch-optimized controls with minimum target sizes of 44x44 pixels
4. THE System SHALL reduce particle counts and geometry complexity by 50% on mobile devices
5. THE System SHALL ensure all UI elements are thumb-accessible in portrait orientation

### Requirement 18: Data Persistence and Recovery

**User Story:** As a player, I want my familiar's progress to be saved reliably, so that I don't lose it due to technical issues.

#### Acceptance Criteria

1. THE System SHALL persist all Familiar state data to Redis after every Mutation application
2. THE System SHALL persist the Care Meter and Evolution Points balance to Redis after every care action
3. THE System SHALL persist the last care timestamp to Redis for Care Meter decay calculations
4. WHEN a Redis operation fails, THE System SHALL retry the operation up to 3 times with exponential backoff
5. WHEN a user reloads the page, THE System SHALL restore the complete Familiar state from Redis within 2 seconds

### Requirement 19: 360-Degree Camera Control

**User Story:** As a player, I want to rotate the camera around my familiar, so that I can view it from all angles.

#### Acceptance Criteria

1. THE System SHALL allow users to drag horizontally to rotate the camera around the Familiar
2. ON mobile devices, THE System SHALL support touch-based rotation gestures
3. THE System SHALL keep the Familiar centered in the viewport during rotation
4. THE System SHALL smoothly interpolate camera position changes over 0.3 seconds
5. THE System SHALL maintain the camera at a fixed distance from the Familiar during rotation

### Requirement 20: Care Action Interactions

**User Story:** As a player, I want to interact with my familiar through feeding, playing, and giving attention, so that I can bond with it.

#### Acceptance Criteria

1. THE System SHALL provide a "Feed" button that triggers a feeding animation
2. THE System SHALL provide a "Play" button that triggers a playful interaction animation
3. THE System SHALL provide an "Attention" button that triggers an affection animation
4. WHEN a care action is performed, THE System SHALL display visual feedback showing the Care Meter increase
5. THE System SHALL prevent care actions from being spammed by enforcing a 5-minute cooldown between actions of the same type

### Requirement 21: Privacy Opt-In for Personality Reflection

**User Story:** As a player, I want to control whether my Reddit activity influences my familiar, so that I maintain my privacy.

#### Acceptance Criteria

1. WHEN a player first creates a Familiar, THE System SHALL display a privacy consent dialog
2. THE System SHALL clearly explain that personality reflection analyzes public posts only, never browsing history
3. THE System SHALL allow the player to opt-in or opt-out of personality reflection
4. IF the player opts out, THEN THE System SHALL use purely random Uncontrolled Mutations
5. THE System SHALL allow the player to change their privacy preference at any time in settings
