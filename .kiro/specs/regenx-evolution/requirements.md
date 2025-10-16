# Requirements Document

## Introduction

Re-GenX is a community-driven creature evolution simulator built on Reddit's Devvit platform where groups of 25 players collectively nurture and evolve a shared creature. Similar to a collaborative Tamagotchi, the system presents a pulsating blob creature in a dramatic spotlight setting with 5ft visibility radius, allowing 360° viewing. Players guide evolution through democratic voting on mutations while the creature naturally evolves based on the group's collective behavior patterns across Reddit. The experience combines controlled mutations (triggered by group-funded genetic shots with voting on traits) and uncontrolled mutations (random changes influenced by group behavior) to create an engaging, unpredictable evolutionary journey.

## Glossary

- **System**: The Re-GenX application running on Reddit's Devvit platform
- **Creature**: A pulsating blob organism displayed in spotlight with visual mutations and stat attributes that evolves based on group decisions
- **Group**: A fixed collection of 25 Reddit users who share ownership of one Creature
- **Waiting Room**: An abstract queue system where users wait for 25 members to join and form a Group (not a physical virtual space)
- **Evolution Cycle**: A time-bounded period (15 minutes to 2 hours) representing one evolutionary phase
- **Controlled Mutation**: A genetic change triggered by Genetic Shot where the Group votes on specific traits (randomness factor 0.85-0.95)
- **Uncontrolled Mutation**: A random genetic change that occurs automatically, influenced by Group behavior patterns (randomness factor 0.05-0.15)
- **Randomness Factor**: A value between 0 and 1 representing how much control vs randomness applies to a mutation (0 = pure random, 1 = pure control)
- **Genetic Shot**: A purchasable item that triggers a Controlled Mutation, funded by Group member contributions
- **Karma Pool**: Shared virtual currency accumulated by the Group, used to purchase Genetic Shots
- **Mutation Session**: A voting period where Group members select up to 3 traits for a Controlled Mutation
- **Trait**: A specific characteristic of a Mutation (e.g., number of legs, color, size)
- **Spotlight Effect**: The visual presentation showing the Creature illuminated from above with 5ft visibility radius
- **HUD**: Heads-Up Display implemented as a slide-up/down drawer menu showing Creature stats in neon futuristic styling
- **Behavior Pattern**: Aggregate data about which subreddits Group members visit, influencing Uncontrolled Mutations
- **Biome**: An environmental setting (jungle, rocky mountain, etc.) visible within the 5ft radius
- **Mutation Animation**: A 2-3 second visual transition showing the Creature changing
- **Stat Category**: A grouping of related attributes (Mobility, Senses, Survival, Cognition, Vitals)
- **Age**: A stat representing how many Evolution Cycles the Creature has survived

## Requirements

### Requirement 1: Group Formation and Waiting Room

**User Story:** As a new player, I want to join a group of 25 players to share a creature, so that I can participate in collaborative evolution.

#### Acceptance Criteria

1. WHEN a user opens the Re-GenX app for the first time, THE System SHALL display the environment with spotlight effect immediately
2. IF the user does not belong to a Group, THEN THE System SHALL add the user to an abstract Waiting Room queue and display "Waiting for players: X/25" in the HUD
3. WHEN the Waiting Room reaches exactly 25 users, THE System SHALL create a new Group and initialize a Creature with base pulsating blob appearance
4. WHILE waiting for Group formation, THE System SHALL display the empty spotlight environment with a message indicating creature creation is pending
5. THE System SHALL prevent users from joining multiple Waiting Rooms or Groups simultaneously

### Requirement 2: Visual Presentation and Spotlight Effect

**User Story:** As a player, I want to see my creature in a dramatic spotlight setting, so that I feel immersed in the evolution experience.

#### Acceptance Criteria

1. THE System SHALL render the Creature as a pulsating blob at the center of the viewport
2. THE System SHALL illuminate the Creature with a directional light from directly above
3. THE System SHALL render the environment visible within a 5-foot radius around the Creature
4. BEYOND the 5-foot radius, THE System SHALL render complete darkness
5. THE System SHALL allow users to rotate the camera 360 degrees around the Creature while keeping it centered

### Requirement 3: Neon HUD Display

**User Story:** As a player, I want to see creature stats in a futuristic HUD that I can show or hide, so that I can monitor progress without cluttering the view.

#### Acceptance Criteria

1. THE System SHALL implement the HUD as a slide-up drawer menu with neon styling
2. WHEN a user taps or clicks the HUD handle, THE System SHALL animate the drawer sliding up or down over 0.3 seconds
3. WHEN the HUD is expanded, THE System SHALL display the Creature's Age, all stat categories, Karma Pool balance, and Group member list
4. THE System SHALL update HUD values in real-time when stats change
5. THE System SHALL default the HUD to collapsed state on initial load, showing only essential info (Age and next Evolution Cycle countdown)

### Requirement 4: Evolution Cycle Timing

**User Story:** As a player, I want the creature to evolve at a Tamagotchi-like pace, so that I can check in regularly without waiting too long between changes.

#### Acceptance Criteria

1. THE System SHALL trigger an Evolution Cycle at intervals between 15 minutes and 2 hours
2. WHEN an Evolution Cycle begins, THE System SHALL increment the Creature's Age by 1
3. THE System SHALL determine randomly whether the Evolution Cycle includes an Uncontrolled Mutation with 30% probability
4. THE System SHALL display a countdown timer showing time until the next Evolution Cycle
5. THE System SHALL persist the Evolution Cycle schedule to Redis to survive server restarts

### Requirement 5: Karma Pool and Genetic Shot Funding

**User Story:** As a group member, I want to contribute karma to buy genetic shots, so that we can trigger controlled mutations together.

#### Acceptance Criteria

1. THE System SHALL maintain a shared Karma Pool for each Group, starting at 0
2. WHEN a Group member earns Reddit karma in the subreddit, THE System SHALL add 10% of earned karma to the Group's Karma Pool
3. THE System SHALL price Genetic Shots at 100 Karma Pool points
4. WHEN a Group member initiates a Genetic Shot purchase, THE System SHALL deduct 100 points from the Karma Pool
5. IF the Karma Pool has insufficient points, THEN THE System SHALL prevent the purchase and display the current balance

### Requirement 6: Controlled Mutation Voting

**User Story:** As a group member, I want to vote on mutation traits when we use a genetic shot, so that we can shape the creature's evolution together.

#### Acceptance Criteria

1. WHEN a Genetic Shot is purchased, THE System SHALL initiate a Mutation Session lasting 5 minutes
2. DURING the Mutation Session, THE System SHALL present 3 trait categories for the Group to vote on
3. WHEN a user votes, THE System SHALL allow one vote per trait category
4. THE System SHALL allow users to change their votes during the Mutation Session
5. WHEN the Mutation Session ends, THE System SHALL apply the winning trait from each category to create the Controlled Mutation

### Requirement 7: Controlled Mutation Trait Selection

**User Story:** As a player voting on traits, I want to see clear options for each trait category, so that I can make informed choices about the mutation.

#### Acceptance Criteria

1. FOR each trait category, THE System SHALL generate 3 to 5 options
2. WHEN presenting leg mutations, THE System SHALL offer options for number of legs (2, 4, 6, 8)
3. WHEN presenting color mutations, THE System SHALL offer options from a predefined palette
4. WHEN presenting size mutations, THE System SHALL offer options (tiny, small, medium, large, giant)
5. THE System SHALL display each trait option with a preview showing how it would look on the Creature

### Requirement 8: Mutation Randomness Spectrum

**User Story:** As a player, I want every creature to be unique with some unpredictability, so that no two creatures ever look exactly the same.

#### Acceptance Criteria

1. FOR Controlled Mutations, THE System SHALL apply a randomness factor between 0.85 and 0.95 to voted trait values
2. FOR Uncontrolled Mutations, THE System SHALL apply a randomness factor between 0.05 and 0.15 to base trait values
3. WHEN applying randomness, THE System SHALL use a seeded random generator based on Group ID and Evolution Cycle number
4. THE System SHALL vary mutation size, position, and color within acceptable ranges even for identical trait selections
5. THE System SHALL ensure randomness never produces values outside valid bounds (0-100 for stats, valid geometry for visuals)

### Requirement 18: Uncontrolled Mutation System

**User Story:** As a player, I want the creature to sometimes mutate randomly, so that evolution feels unpredictable and exciting.

#### Acceptance Criteria

1. WHEN an Evolution Cycle triggers an Uncontrolled Mutation, THE System SHALL select a random mutation type
2. THE System SHALL generate random trait values for the Uncontrolled Mutation with high randomness factor (0.05-0.15 control)
3. THE System SHALL apply the Uncontrolled Mutation immediately without voting
4. THE System SHALL notify all Group members that an Uncontrolled Mutation occurred
5. THE System SHALL animate the Uncontrolled Mutation over 2 to 3 seconds

### Requirement 9: Behavior Pattern Tracking

**User Story:** As a player, I want the creature to evolve based on our group's interests, so that it reflects our collective personality.

#### Acceptance Criteria

1. THE System SHALL track which subreddits each Group member visits during the past 7 days
2. THE System SHALL aggregate subreddit visit data across all 25 Group members
3. WHEN generating an Uncontrolled Mutation, THE System SHALL bias the mutation type toward the Group's most-visited subreddit categories
4. IF the Group frequently visits cat subreddits, THEN THE System SHALL increase probability of feline traits by 40%
5. THE System SHALL update behavior patterns daily at midnight UTC

### Requirement 10: Mutation Animation and Visual Feedback

**User Story:** As a player, I want to see smooth animations when mutations occur, so that the evolution feels alive and engaging.

#### Acceptance Criteria

1. WHEN a Mutation is applied, THE System SHALL animate the transformation over 2 to 3 seconds
2. THE System SHALL use smooth interpolation for geometry changes
3. WHEN stats change due to Mutation, THE System SHALL display floating numbers showing increases and decreases
4. THE System SHALL pulse the Creature's glow during mutation animations
5. THE System SHALL play a subtle sound effect when mutations complete

### Requirement 11: Biome Environment System

**User Story:** As a player, I want to see different environments around the creature, so that the world feels varied and interesting.

#### Acceptance Criteria

1. THE System SHALL support multiple Biome types: jungle, rocky mountain, desert, ocean, cave
2. WHEN a Group is created, THE System SHALL randomly assign a starting Biome
3. THE System SHALL render Biome-appropriate textures and objects within the 5-foot visibility radius
4. EVERY 10 Evolution Cycles, THE System SHALL randomly change the Biome with 20% probability
5. THE System SHALL display the current Biome name in the HUD

### Requirement 12: Mutation Compatibility System

**User Story:** As a player, I want mutations to work together visually, so that the creature doesn't look broken or glitchy.

#### Acceptance Criteria

1. THE System SHALL maintain a compatibility matrix defining which mutations can coexist
2. WHEN applying a Mutation, THE System SHALL check compatibility with all existing mutations
3. IF a Mutation is incompatible with existing mutations, THEN THE System SHALL prevent its application
4. THE System SHALL display a warning message explaining why a Mutation cannot be applied
5. THE System SHALL suggest alternative compatible Mutations when a conflict occurs

### Requirement 13: Stat Management System

**User Story:** As a player, I want to see how mutations affect creature stats, so that I can understand the trade-offs of our choices.

#### Acceptance Criteria

1. THE System SHALL maintain five Stat Categories: Mobility, Senses, Survival, Cognition, and Vitals
2. WITHIN each Stat Category, THE System SHALL track 3 sub-stats with values ranging from 0 to 100
3. WHEN a Mutation is applied, THE System SHALL update all affected stats according to predefined trade-offs
4. THE System SHALL display stat changes with color-coded indicators (green for increase, red for decrease)
5. THE System SHALL prevent stat values from exceeding 100 or falling below 0

### Requirement 14: Mobile-First User Experience

**User Story:** As a mobile Reddit user, I want the game to work smoothly on my phone, so that I can participate without needing a desktop computer.

#### Acceptance Criteria

1. THE System SHALL detect mobile devices and adjust rendering quality accordingly
2. WHEN running on mobile, THE System SHALL target a minimum frame rate of 30 FPS
3. THE System SHALL provide touch-optimized controls with minimum target sizes of 44x44 pixels
4. THE System SHALL reduce particle counts and geometry complexity by 50% on mobile devices
5. THE System SHALL ensure all UI elements are thumb-accessible in portrait orientation

### Requirement 15: Data Persistence and Recovery

**User Story:** As a player, I want my group's progress to be saved reliably, so that we don't lose our creature due to technical issues.

#### Acceptance Criteria

1. THE System SHALL persist all Creature state data to Redis after every Mutation application
2. THE System SHALL persist the Karma Pool balance to Redis after every transaction
3. THE System SHALL persist all voting data to Redis as votes are cast
4. WHEN a Redis operation fails, THE System SHALL retry the operation up to 3 times with exponential backoff
5. WHEN a user reloads the page, THE System SHALL restore the complete Creature state from Redis within 2 seconds

### Requirement 16: 360-Degree Camera Control

**User Story:** As a player, I want to rotate the camera around the creature, so that I can view it from all angles.

#### Acceptance Criteria

1. THE System SHALL allow users to drag horizontally to rotate the camera around the Creature
2. ON mobile devices, THE System SHALL support touch-based rotation gestures
3. THE System SHALL keep the Creature centered in the viewport during rotation
4. THE System SHALL smoothly interpolate camera position changes over 0.3 seconds
5. THE System SHALL maintain the camera at a fixed distance from the Creature during rotation

### Requirement 17: Group Member Visibility

**User Story:** As a group member, I want to see who else is in my group, so that I feel connected to my fellow players.

#### Acceptance Criteria

1. THE System SHALL display a list of all 25 Group members in the HUD
2. THE System SHALL show which Group members are currently online with a green indicator
3. THE System SHALL display each member's Reddit username
4. THE System SHALL show how much each member has contributed to the Karma Pool
5. THE System SHALL update online status in real-time as members join and leave
