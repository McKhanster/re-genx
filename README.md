# Re-GenX: Personal Creature Companion

A personal creature care game built on Reddit's Devvit platform where you nurture your own unique familiar through feeding, playing, and giving attention. Watch your lustrous platinum-surfaced creature respond to your care with unique animations and visual state changes in a dramatic 3D spotlight environment.

## What is Re-GenX?

Re-GenX is a personal creature companion game where you care for your own unique familiar—a living, pulsating platinum blob creature displayed in a dramatic spotlight setting. Like a digital Tamagotchi, you must actively feed, play with, and give attention to your familiar to keep it healthy and happy, or risk having it taken away due to neglect.

Your familiar exists in a dynamic biome environment (jungle, rocky mountain, desert, ocean, or cave) on a circular platform, surrounded by complete darkness beyond a 10-meter visibility radius. You can rotate the camera 360° around your familiar to view it from all angles at eye level (4 feet above ground), creating an intimate, theatrical viewing experience.

The game features a fully functional care system with three interactive actions (Feed, Play, Attention), each with distinct rewards, 5-minute cooldown timers, and unique animations. Your familiar's appearance dynamically changes based on its care level, transitioning between happy, neutral, and sad states with corresponding visual feedback. Stat changes are displayed as floating numbers that appear on screen when your familiar evolves or receives care.

## How to Play

### Getting Started

1. **Launch the Game**: Open a Re-GenX post on Reddit and click the "Play" button to launch in fullscreen
2. **Meet Your Familiar**: The 3D scene loads instantly, automatically creating your personal platinum blob creature if you don't have one yet
3. **Explore the View**: Click and drag (desktop) or swipe (mobile) to rotate 360° around your familiar
4. **Open the HUD Menu**: Click the "▼ MENU" button at the top-center to access care actions and stats

### Core Gameplay: Care for Your Familiar

Your familiar needs regular care to stay healthy. Perform three types of care actions:

**Feed (🍖)**: +15 Care Meter, +10 Evolution Points
- Animation: Eating motion with expansion/contraction and brighter glow
- Cooldown: 5 minutes

**Play (🎾)**: +10 Care Meter, +15 Evolution Points  
- Animation: Bouncing and spinning with pulsing glow
- Cooldown: 5 minutes

**Attention (💚)**: +5 Care Meter, +5 Evolution Points
- Animation: Happy pulse with warm, gentle glow
- Cooldown: 5 minutes

**How to Care:**
1. Click "▼ MENU" at the top-center to open the HUD panel
2. In the "Care Actions" section, click any care button (Feed, Play, or Attention)
3. Watch your familiar respond with a unique 1-second animation
4. See floating text showing rewards gained (+15 Care, +10 EP)
5. Button pulses and HUD updates instantly with new values
6. Wait 5 minutes before using the same action again (cooldown timer shows countdown on the button)

### Monitor Your Familiar's Health

**Care Meter (0-100)**: Displayed in top-right corner and in the HUD menu
- **Happy (50-100)**: Bright platinum color (#e5e4e2), active pulsing, positioned at 1.2 units
- **Neutral (20-50)**: Light gray color (#cccccc), slower pulsing, positioned at 1.1 units
- **Sad (0-20)**: Dull gray color (#999999), minimal pulsing, droops to 1.0 units
- **Critical (<20)**: ⚠️ Warning appears in bottom-right corner, prominent red overlay displays with pulsing animation

**Evolution Points (EP)**: Displayed in bottom-left corner and in the HUD menu
- Earn through care actions (5-15 EP per action)
- Save up 100 EP to trigger controlled mutations (coming soon)

**Neglect Warnings**: 
- When Care Meter drops below 20, "⚠️ NEEDS ATTENTION" appears in bottom-right corner
- A prominent overlay displays: "Your familiar needs attention! Care Meter is critically low"
- Your familiar's appearance changes to sad/distressed state (dull colors, minimal pulsing)
- Keep Care Meter above 20 to prevent removal!

### Explore the Environment

**Camera Controls:**
- **Desktop**: Click and drag left/right to orbit around your familiar
- **Mobile**: Touch and swipe left/right to orbit
- Camera maintains eye-level perspective (1.2 units/4 feet above ground, 8 units from creature)
- Unlimited 360° rotation with smooth, responsive controls (0.005 radians per pixel)
- Camera looks slightly downward to see both creature and ground platform

**Biome Environments** (randomly selected when familiar is created):
- **Jungle**: Dark green ground (#2d5016) with lush plants, stems, and foliage (6-12 objects)
- **Rocky Mountain**: Gray rocky surface (#5a5a5a) with irregular boulders and pebbles (10-20 objects)
- **Desert**: Sandy yellow ground (#c2b280) with cacti and sand dunes (6-12 objects)
- **Ocean**: Deep blue water (#1a4d7a) with animated water surface, coral structures, and seaweed (7-13 objects)
- **Cave**: Dark rocky floor (#2a2a2a) with stalactites, stalagmites, and glowing cyan crystals (8-16 objects)

**Atmospheric Effects:**
- Single powerful spotlight from directly above (position: 0, 12, 0) with 8.0 intensity
- Linear fog creates complete darkness from 10 to 20 meters
- Pure black void background (#000000) for theatrical presentation
- Your familiar's subtle warm emissive glow (#aaaaaa) pulses between 0.1-0.5 intensity
- Circular ground platform (5-unit radius) visible beneath the creature

### Fighter Jet-Style HUD

**Always-Visible Corner Info:**
- **Top-Left**: Age (evolution cycles survived)
- **Top-Right**: Next cycle countdown and Care Meter value (turns red and pulses when < 20)
- **Bottom-Left**: Evolution Points (EP) balance
- **Bottom-Right**: Neglect warning (⚠️ NEEDS ATTENTION when Care Meter < 20)

**Menu Panel** (click "▼ MENU" to open, changes to "▲ CLOSE" when open):
- **Care Actions Section**: Three interactive buttons with icons, labels, and reward displays
  - Feed (🍖): +15 Care, +10 EP
  - Play (🎾): +10 Care, +15 EP
  - Attention (💚): +5 Care, +5 EP
  - Buttons show live countdown timers during 5-minute cooldowns
- **Care Status Section**: Detailed care information
  - Care Meter value (0-100)
  - Evolution Points balance
  - Next Evolution cycle countdown
- **Familiar Stats Section**: Five categories with visual progress bars
  - Mobility (speed, agility, endurance)
  - Senses (vision, hearing, smell)
  - Survival (attack, defense, stealth)
  - Cognition (intelligence, social, adaptability)
  - Vitals (health, population, mutationRate)
  - Color-coded change indicators (green for increases, red for decreases)

**Keyboard Shortcut**: Press ESC to close the menu panel

**Mobile Optimizations**: 
- Touch events on HUD don't affect 3D scene rotation
- Menu panel scrolls if content exceeds viewport height
- All touch targets are 44x44px minimum for accessibility

## What Makes Re-GenX Unique?

### 1. **Fully Functional Personal Care System with Real-Time Visual Feedback**

Re-GenX is a complete creature care game with real-time feedback, persistent state, and rich visual feedback systems:

**Three Care Actions** (Located in HUD Menu):
- **Feed** (+15 Care Meter, +10 Evolution Points) - Triggers eating animation with expansion/contraction (scale varies by 15%) and brighter glow
- **Play** (+10 Care Meter, +15 Evolution Points) - Triggers bouncing (0.5 unit vertical movement) and spinning (360° rotation) with pulsing glow
- **Attention** (+5 Care Meter, +5 Evolution Points) - Triggers gentle happy pulse (10% scale variation) with warm glow

**Smart Cooldown System:**
- Each action has a 5-minute cooldown to encourage regular check-ins
- Buttons display live countdown timers (e.g., "4:32") during cooldown
- Cooldowns persist across page reloads (server-side Redis tracking with TTL)
- Orange border and disabled state during cooldown
- Clear error messages if you try to act during cooldown (429 HTTP status)

**Rich Visual Feedback:**
- Floating text shows rewards gained (+15 Care, +10 EP) that floats upward and fades out over 2 seconds
- Button pulse animation on successful action (0.3 second scale effect with box-shadow glow)
- Familiar responds with unique 1-second animation for each action type
- HUD updates instantly with new Care Meter and Evolution Points values
- Error notifications appear at top of screen for 3 seconds with red background
- **Stat change feedback**: Floating numbers appear on screen showing stat increases/decreases with color coding (green for +, red for -)
- Multiple stat changes stack vertically with staggered timing for clear visibility
- Category headers appear when showing grouped stat changes

**Dynamic Care States:**
- **Happy (50-100)**: Bright platinum color (#e5e4e2), active pulsing, positioned at 1.2 units, emissive intensity 0.3
- **Neutral (20-50)**: Light gray color (#cccccc), slower pulsing, positioned at 1.1 units, emissive intensity 0.2
- **Sad (0-20)**: Dull gray color (#999999), minimal pulsing, droops to 1.0 units, emissive intensity 0.1
- **Critical (<20)**: Warning icon appears in HUD, prominent red overlay displays with pulsing animation and shake effect

**Backend Integration**: Complete API integration with Redis persistence and retry logic

**Visual Stat Feedback System**: 
- StatFeedback class displays floating numbers for stat changes
- Color-coded changes (green for increases, red for decreases)
- Stacked display for multiple simultaneous stat changes
- Category headers for grouped stat changes
- 1-second fade-out animation with upward float effect

### 2. **Ultra-Smooth Platinum Surface with Dramatic Lighting**

Re-GenX features exceptionally high-detail geometry and sophisticated lighting:

- **Living Platinum Creature**: Organic, irregularly-shaped blob (1.5-unit radius) with lustrous platinum surface (#e5e4e2)
- **Ultra-High Detail**: 48 segments on mobile, 96 segments on desktop—double typical 3D web game complexity
- **Semi-Gloss Finish**: Phong shading with bright specular highlights (shininess 80) creates wet, metallic look
- **Fluid Organic Motion**: Multi-octave Simplex noise animation with gentle 10% amplitude for graceful movement
- **Subtle Warm Glow**: Emissive glow (#aaaaaa) pulses between 0.1-0.5 intensity for ethereal presence
- **Dramatic Spotlight**: Single powerful spotlight (8.0 intensity) from above creates beautiful highlights and shadows
- **Enhanced Shadow Quality** (desktop): 2048x2048 shadow map with optimized bias for crisp, visible shadows
- **Atmospheric Darkness**: Linear fog creates complete darkness beyond 10 meters

### 3. **Five Immersive Biome Environments**

Each biome is fully realized with unique ground textures and environmental objects:

- **Jungle**: Dark green ground with lush plants, stems, and foliage
- **Rocky Mountain**: Gray rocky surface with boulders and pebbles
- **Desert**: Sandy yellow ground with cacti and sand dunes
- **Ocean**: Deep blue water with coral structures and seaweed
- **Cave**: Dark rocky floor with stalactites, stalagmites, and glowing cyan crystals

All biome objects adapt complexity based on device (6-12 objects on mobile, 10-24 on desktop).

### 4. **Fighter Jet-Style HUD**

Futuristic neon green HUD (#00ff88) with minimal always-visible info:

- **Corner Displays**: Age, Care Meter, Evolution Points, Neglect Warning
- **Slide-Down Menu**: Detailed panel with care actions, stats, and status
- **Care Action Buttons**: Three interactive buttons with rewards, cooldowns, and animations
- **Real-Time Updates**: HUD updates instantly when stats change
- **Mobile-Optimized**: Touch-friendly with 44px minimum target sizes

### 5. **Advanced Organic Animation System**

Multi-octave Simplex noise creates truly organic, fluid motion:

- **Three Octaves**: Frequencies at 1x, 2x, 4x combined at 50%, 30%, 20% amplitudes
- **Gentle Movement**: Reduced 10% amplitude creates graceful, refined motion
- **Per-Vertex Animation**: Each vertex moves independently based on 3D noise
- **Overall Pulsation**: 8% scale variation creates breathing effect
- **Delta Time-Based**: Device-independent animation speed

### 6. **Eye-Level Perspective with Ground View**

Camera positioned at eye level (1.2 units/4 feet) with downward angle:

- **Intimate Perspective**: Observe familiar face-to-face
- **Spatial Grounding**: See circular platform (5-unit radius) beneath familiar
- **360° Rotation**: Smooth pointer-based controls (0.005 radians per pixel)
- **Unlimited Orbit**: No boundaries or limits on rotation

### 7. **Adaptive Performance Architecture**

Automatically detects device and adjusts quality:

- **Desktop**: 60fps target, 96 segments, shadows, antialiasing, full pixel ratio
- **Mobile**: 30fps target, 48 segments, no shadows, no antialiasing, 1.5x max pixel ratio
- **FPS Throttling**: Precise frame timing maintains target frame rates
- **Quality Maintained**: Both platforms maintain smooth, glossy platinum appearance

### 8. **Complete Mutation Geometry System**

The game includes a full mutation rendering system with geometry generators for:

- **Legs**: Cylindrical limbs positioned radially around the creature
- **Eyes**: Glowing spheres with high emissive intensity
- **Wings**: Curved plane geometry with transparency
- **Spikes**: Conical protrusions at random surface positions
- **Tentacles**: Curved cylinders with tapering
- **Horns**: Pointed cones positioned on top

Each mutation type has unique materials, positioning logic, and can be animated with elastic easing functions.

### 9. **Persistent State Management**

- **Automatic Familiar Creation**: Game automatically creates a familiar for new users on first load
- **State Persistence**: All familiar data stored in Redis (mutations, stats, age, biome, care meter, evolution points)
- **Cooldown Persistence**: Cooldown timers persist across page reloads using server-side Redis TTL
- **Retry Logic**: 3 attempts with exponential backoff for all Redis operations
- **Error Recovery**: Graceful error handling with user-friendly messages

## Current Features

The current implementation includes a **fully functional personal familiar care system** with complete backend integration:

**Care System (Fully Operational):**

- **Three Care Actions**: Feed, Play, and Attention buttons with distinct rewards
  - Feed: +15 Care Meter, +10 Evolution Points
  - Play: +10 Care Meter, +15 Evolution Points
  - Attention: +5 Care Meter, +5 Evolution Points
- **Smart Cooldown Management**: 5-minute cooldowns per action type
  - Live countdown timers on buttons (e.g., "4:32")
  - Server-side cooldown tracking with Redis TTL
  - Cooldowns persist across page reloads
  - 429 HTTP status for cooldown violations
- **Rich Visual Feedback**: 
  - Floating text showing Care Meter increases and Evolution Points gained
  - Button pulse animation on successful action
  - Instant HUD updates with new values
- **Care Animations**: Familiar responds with unique animations for each action type
  - Feed: Eating motion with expansion/contraction and brighter glow
  - Play: Bouncing and spinning with pulsing glow
  - Attention: Happy pulse with warm, gentle glow
- **Care Meter Tracking**: 
  - Values range from 0-100
  - Visual state changes based on care level (happy/neutral/sad)
  - Automatic decay (5 points per hour - coming soon)
- **Neglect Warning System**:
  - Warning icon appears when Care Meter drops below 20
  - Prominent overlay displays: "Your familiar needs attention!"
  - Familiar appearance changes to sad/distressed state
- **Evolution Points System**: 
  - Earn points through care actions
  - Balance displayed in HUD (top-right and bottom-left)
  - Will be used to trigger controlled mutations (100 EP cost)
- **Error Handling**: Clear error messages for cooldowns and failed actions
- **Backend Integration**: Complete API integration with retry logic and proper error handling

**Creature Rendering:**

- **Living Platinum Blob**: Subtly-shaped 1.5-unit radius sphere with gentle noise-based vertex deformation (12% amplitude, 0.6 frequency)
- **Ultra-High Detail Geometry**: 48 segments on mobile, 96 segments on desktop for exceptionally smooth surface
- **Advanced Organic Animation**: Multi-octave Simplex noise (3 octaves at 1x, 2x, 4x frequency) creates smooth, continuous vertex motion with 10% amplitude
- **Dynamic Pulsation**: Overall scale varies by 8% using sine wave, creating breathing effect
- **Subtle Warm Glow**: Emissive intensity oscillates between 0.1 and 0.5 at 1.5 Hz for gentle living appearance
- **Semi-Gloss Platinum Material**: Platinum (0xe5e4e2) Phong material with shininess 80 and bright white specular highlights for lustrous, metallic appearance

**Biome System:**

- **Five Unique Biomes**: Jungle, rocky mountain, desert, ocean, and cave environments
- **Dynamic Ground Textures**: Each biome has unique ground color and material properties
- **Environmental Objects**: Plants, rocks, cacti, coral, stalactites, and more
- **Adaptive Object Count**: 3-12 objects on mobile, 6-24 on desktop depending on biome
- **Memory Management**: Proper disposal of geometries and materials when switching biomes
- **Random Selection**: Biome randomly selected on game load for variety

**Mutation System:**

- **Complete Geometry Generators**: Legs, eyes, wings, spikes, tentacles, horns
- **Elastic Animations**: 2.5-second ease-out-elastic animations for mutation appearance
- **Adaptive Complexity**: Mobile uses 6-16 segments, desktop uses 12-32 segments per mutation
- **Unique Materials**: Each mutation type has custom colors and emissive properties
- **Smart Positioning**: Mutations positioned relative to creature surface with randomness support
- **Stat Change Visualization**: Floating numbers display stat changes when mutations are applied
- **Visual Feedback Integration**: Mutations trigger both geometric changes and stat feedback displays

**Fighter Jet-Style HUD (Care-Focused):**

- **Always-Visible Corner Info**: Minimal displays at screen corners
  - **Top-Left**: Age display (evolution cycles survived)
  - **Top-Right**: Next cycle countdown and Care Meter value
  - **Bottom-Left**: Evolution Points (EP) balance
  - **Bottom-Right**: Neglect warning (⚠️ NEEDS ATTENTION) when Care Meter < 20
- **Slide-Down Menu Panel**: Detailed information panel that slides down from top
  - Toggle with "▼ MENU" button (changes to "▲ CLOSE" when open)
  - **Care Actions** section with three interactive buttons
  - **Care Status** section showing Care Meter, Evolution Points, and Next Evolution countdown
  - **Familiar Stats** section with five categories (Mobility, Senses, Survival, Cognition, Vitals)
- **Neon Styling**: Futuristic green (#00ff88) glow effects with semi-transparent black backgrounds
- **Stat Visualization**: Visual bars for each stat with color-coded change indicators (green for increases, red for decreases)
- **Real-Time Stat Updates**: Stats update instantly with floating number feedback showing exact changes
- **Care Meter Warning**: Red pulsing animation when Care Meter drops below 20
- **Non-Intrusive**: Semi-transparent overlay doesn't block the creature view
- **Mobile Optimized**: Touch events on HUD don't affect 3D scene rotation
- **Keyboard Support**: Press ESC to close the menu panel
- **Scrollable Content**: Menu panel scrolls if content exceeds viewport height

**Scene & Lighting:**

- **Dramatic Single Spotlight**: 8.0 intensity spotlight from 12 units above with 60° cone angle and 0.3 penumbra
- **Subtle Ambient Light**: 0x404040 at 0.2 intensity for gentle fill without washing out shadows
- **Atmospheric Fog**: Linear fog starting at 10 units, complete darkness by 20 units
- **Shadow Mapping**: 2048x2048 PCF soft shadows on desktop (disabled on mobile)

**Camera & Controls:**

- **Eye-Level Positioning**: Camera at height 1.2 (4 feet) orbiting at 8-unit radius
- **Downward Viewing Angle**: Looks at point (0, 0.5, 0) to see both creature and ground
- **360° Rotation**: Smooth pointer-based controls (0.005 radians per pixel)
- **Touch Support**: Full mobile gesture support for rotation

**Environment:**

- **Circular Ground Plane**: 5-unit radius platform with biome-specific textures
- **Biome-Specific Objects**: Vegetation, rocks, water effects, cave formations
- **Black Void Background**: Pure black (0x000000) for dramatic contrast

**Performance Optimization:**

- **Desktop**: 60fps target, 96-segment creature, 32-segment mutations, shadows, antialiasing, full pixel ratio
- **Mobile**: 30fps target, 48-segment creature, 16-segment mutations, no shadows, no antialiasing, 1.5x max pixel ratio
- **FPS Throttling**: Precise frame timing to maintain target frame rates
- **Delta Time Animation**: All animations use delta time for device-independent speed

**Backend Infrastructure (Fully Operational):**

- **Familiar Management System**: Personal creature creation and state management
  - FamiliarManager class with create, fetch, update, and removal methods
  - Default stats initialization (all stats at 50, vitals at 100)
  - Random biome assignment on creation (jungle, rocky_mountain, desert, ocean, cave)
  - Care Meter tracking with neglect detection
  - Privacy opt-in system for personality reflection (future feature)
  - Familiar archival before removal (30-day retention)

- **Care System Backend**: Complete care action processing with real-time updates
  - CareSystem class with action handlers for feed, play, attention
  - **Cooldown enforcement**: 5 minutes per action type with Redis TTL
  - **Care Meter updates**: Increases by 5-15 points per action, clamped to 0-100
  - **Evolution Points awarding**: 5-15 points per action, tracked in Redis
  - **Neglect warning system**: Automatic detection when Care Meter < 20
  - **Familiar removal**: Automatic removal after 24 hours at Care Meter 0
  - **Last care timestamp**: Tracks time of last care action for decay calculations
  - **Retry logic**: 3 attempts with exponential backoff for all Redis operations
  - **Visual feedback integration**: Care actions trigger stat updates with floating number displays

- **Redis Data Persistence**: Robust data storage with automatic recovery
  - **Familiar state**: mutations, stats, age, biome, createdAt
  - **Care state**: careMeter, lastCareTime, evolutionPoints, neglectWarning
  - **Cooldown timers**: Stored with TTL for automatic expiration
  - **Privacy settings**: privacyOptIn flag for future personality reflection
  - **Retry logic**: 3 attempts with exponential backoff (1s, 2s, 4s delays)

- **API Endpoints**: RESTful endpoints with proper error handling
  - `GET /api/familiar/state` - Get familiar state (returns null if not found)
  - `POST /api/familiar/create` - Create new familiar (idempotent - returns existing if present)
  - `POST /api/care/feed` - Feed action (+15 Care, +10 EP, 5min cooldown)
  - `POST /api/care/play` - Play action (+10 Care, +15 EP, 5min cooldown)
  - `POST /api/care/attention` - Attention action (+5 Care, +5 EP, 5min cooldown)

- **User Authentication**: Reddit context integration via Devvit middleware
  - Automatic user identification from Reddit session
  - No custom authentication required

- **Error Handling**: Comprehensive error handling with user-friendly messages
  - **400 Bad Request**: Invalid input or missing parameters
  - **401 Unauthorized**: User not authenticated
  - **404 Not Found**: Familiar or resource doesn't exist
  - **429 Too Many Requests**: Action on cooldown (includes remaining time)
  - **500 Internal Server Error**: Server-side failures with retry logic

## Future Features

**Next Priority Features:**

- **Care Meter Decay Scheduler**: Implement hourly decay scheduler (5 points per hour)
- **Familiar Removal Scheduler**: Check for removal after 24 hours at Care Meter 0
- **State Polling**: Poll `/api/familiar/state` every 5 seconds to sync with server

**Upcoming Features:**

- **Controlled Mutations**: Spend 100 Evolution Points to choose mutations
- **Uncontrolled Mutations**: Random mutations influenced by Reddit activity (privacy-compliant)
- **Evolution Cycle Scheduler**: Automatic aging and mutation triggers (30min - 4hr intervals)
- **Privacy Opt-In Dialog**: Allow users to enable personality reflection
- **Activity Pattern Tracking**: Analyze public posts to influence mutations (with consent)
- **Mutation Animations**: 2-3 second elastic animations for new mutations with stat feedback
- **Biome Changes**: Random biome switches every 10 evolution cycles (15% chance)
- **Stat Effects**: Mutations affect familiar stats with trade-offs (already visualized with floating numbers)
- **Mutation Compatibility**: Prevent incompatible mutations from being applied
- **Enhanced Stat Feedback**: Category-based stat change displays for grouped mutations

## Development

### Prerequisites

- Node.js 22.2.0 or higher
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Deploy to Reddit
npm run deploy
```

### Project Structure

```
src/
├── client/          # Frontend Three.js application
│   ├── main.ts      # Entry point with scene setup
│   ├── index.html   # HTML template
│   ├── index.css    # Styling
│   ├── scene/       # Scene management
│   ├── creature/    # Creature rendering
│   ├── biome/       # Biome environments
│   ├── ui/          # HUD and UI components
│   │   ├── hud-drawer.ts      # Fighter jet-style HUD
│   │   ├── care-actions.ts    # Care action buttons
│   │   └── stat-feedback.ts   # Floating stat change displays
│   └── utils/       # Utilities (noise generation)
├── server/          # Backend Express server
│   ├── index.ts     # Main server with API endpoints
│   └── core/        # Business logic
│       ├── familiar-manager.ts
│       ├── care-system.ts
│       ├── mutation-engine.ts
│       ├── activity-tracker.ts
│       └── evolution-scheduler.ts
└── shared/          # Shared types and constants
    ├── types/       # TypeScript interfaces
    └── constants/   # Redis keys and constants
```

## License

MIT License - See LICENSE file for details

## Credits

Built with:
- [Devvit](https://developers.reddit.com/) - Reddit's developer platform
- [Three.js](https://threejs.org/) - 3D graphics library
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Vite](https://vitejs.dev/) - Build tool
