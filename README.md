# Re-GenX: Collaborative Creature Evolution

A community-driven creature evolution simulator built on Reddit's Devvit platform where groups of 25 players collectively nurture and evolve a shared creature through democratic voting and behavior-influenced mutations.

## What is Re-GenX?

Re-GenX is an immersive 3D creature visualization experience built on Reddit's Devvit platform. The game presents a mysterious, pulsating blob creature in a dramatic spotlight setting, surrounded by complete darkness. The creature exists in a void-like environment on a circular platform, creating an intimate and focused viewing experience where you observe it from eye level.

The current demo showcases the core 3D rendering foundation with:

- **Living Creature**: An organic, irregularly-shaped blob that continuously pulses and wobbles with lifelike movement
- **Dramatic Lighting**: A powerful spotlight from directly above illuminates the creature in a 60° cone
- **Atmospheric Darkness**: Fog creates complete darkness beyond 10 units from the creature
- **Interactive Camera**: Full 360° rotation around the creature at eye level with a view that includes the ground plane
- **Adaptive Performance**: Automatically adjusts quality based on device (mobile vs desktop)

This is the foundation for a future collaborative evolution game where groups of 25 players will collectively nurture and evolve shared creatures through democratic voting and behavior-influenced mutations.

## What Makes Re-GenX Unique?

### 1. **Eye-Level Perspective with Ground View**

Re-GenX positions the camera at eye level (1.2 units/4 feet) orbiting 8 units from the creature, but with a viewing angle that looks slightly downward. This creates an intimate perspective where you observe the creature face-to-face while also seeing the circular platform it rests on, giving a sense of spatial grounding in the void.

### 2. **Organic Creature Design**

The creature isn't a perfect sphere—it's an irregularly deformed blob with a unique surface created through mathematical noise functions. Combined with multi-axis wobbling (8% pulsation with 3-4% wobble on each axis), the creature feels genuinely alive and organic, not mechanical.

### 3. **Theatrical Lighting**

A single powerful spotlight from directly above (60° cone angle, 2.5 intensity) creates dramatic shadows and highlights, while subtle ambient lighting prevents complete darkness. This theatrical presentation focuses attention entirely on the creature while reducing rendering complexity.

### 4. **Atmospheric Fog System**

Linear fog creates a natural darkness gradient that starts at 10 units and becomes complete by 20 units, making the creature feel like it exists in an infinite void. This is more visually interesting than a simple black background.

### 5. **Adaptive Performance Architecture**

The game automatically detects mobile devices and adjusts:

- **Geometry**: 16 segments on mobile vs 32 on desktop
- **Shadows**: Disabled on mobile, enabled on desktop
- **Antialiasing**: Disabled on mobile for performance
- **Pixel Ratio**: Capped at 1.5x on mobile
- **Frame Rate**: 30fps target on mobile, 60fps on desktop

This ensures smooth performance across all devices without manual settings.

## Current Demo Features

The current implementation showcases the core 3D rendering foundation:

- **Living Blob Creature**: Irregularly-shaped 1.5-unit radius sphere with mathematical noise deformation
- **Organic Animation**: Multi-axis pulsation (8% scale variation) with independent wobble on X, Y, Z axes (3-4% each)
- **Dramatic Spotlight**: 2.5 intensity spotlight from 12 units above with 60° cone angle and soft penumbra (0.4)
- **Atmospheric Fog**: Linear fog starting at 10 units, complete darkness by 20 units
- **Eye-Level Camera with Ground View**: Positioned at height 1.2 (4 feet) orbiting at 8-unit radius, looking slightly downward to see both creature and platform
- **360° Rotation**: Smooth pointer-based controls (mouse drag on desktop, touch swipe on mobile)
- **Circular Ground Plane**: 15-unit radius dark platform positioned 0.3 units below creature with grid overlay
- **Adaptive Quality System**:
  - **Desktop**: 60fps, 32-segment geometry, shadows, antialiasing, full pixel ratio
  - **Mobile**: 30fps, 16-segment geometry, no shadows, no antialiasing, 1.5x max pixel ratio
- **FPS Throttling**: Precise frame timing to maintain target frame rates
- **Emissive Materials**: Creature glows with 0.5 emissive intensity in cyan-green (0x00ff88)

## Implementation Status

### ✅ Completed Features

**3D Rendering Engine:**

- Three.js scene with WebGL rendering and black background
- Irregularly-shaped blob creature (1.5-unit radius) with noise-based surface deformation
- Emissive cyan-green material (0x00ff88) with Phong shading and 0.5 emissive intensity
- Spotlight from 12 units above with 2.5 intensity, 60° cone angle, and 0.4 penumbra
- Subtle ambient light (0x404040, 0.4 intensity) for fill lighting
- Linear fog creating darkness from 10 to 20 units
- Circular ground plane (15-unit radius) positioned 0.3 units below creature
- Shadow mapping on desktop (1024x1024 resolution, PCF soft shadows)

**Organic Animation System:**

- Multi-axis pulsation with 8% scale variation (sine wave at 0.002 frequency)
- Independent wobble on X-axis (3% at 0.0015 frequency)
- Independent wobble on Y-axis (4% at 0.0018 frequency)
- Independent wobble on Z-axis (3% at 0.0013 frequency)
- Smooth, continuous animation creating lifelike organic movement

**Camera System:**

- Parallel eye-level positioning (height 1.2/4 feet) for face-to-face perspective
- 8-unit orbital radius around creature
- Pointer-based rotation (mouse drag on desktop, touch swipe on mobile)
- Rotation speed: 0.005 radians per pixel
- Smooth angle-based rotation around Y-axis
- Creature always centered in viewport at same height as camera

**Performance Optimization:**

- Automatic mobile device detection via user agent
- Desktop: 60fps target, 32-segment geometry, shadows enabled, antialiasing enabled
- Mobile: 30fps target, 16-segment geometry, shadows disabled, antialiasing disabled
- Pixel ratio capping on mobile (max 1.5x)
- Quality multiplier system (0.5x mobile, 1.0x desktop)
- Precise FPS throttling in animation loop
- Conditional rendering features based on device type

**Backend Infrastructure:**

- Group formation system with waiting room (25-player groups)
- Creature initialization with random biome assignment
- Redis-based data persistence with retry logic (3 attempts, exponential backoff)
- Stat management system (Mobility, Senses, Survival, Cognition, Vitals)
- API endpoints: `/api/group/status` and `/api/creature/state/:creatureId`
- User authentication via Reddit context
- Error handling with user-friendly messages

### 🚧 In Development

- Biome rendering system (jungle, desert, ocean, rocky mountain, cave)
- Mutation geometry generation and application
- Voting system for controlled mutations
- Behavior tracking and analysis
- Evolution cycle scheduler
- Neon HUD drawer with stats display
- Mutation animations with easing functions
- Karma contribution system
- Group member visibility and online status

## How to Play

### Getting Started

1. **Launch the Game**

   - Open a Re-GenX post on Reddit
   - Click the "Play" button to launch the game in fullscreen
   - The 3D scene loads instantly with the creature at ground level

2. **Explore the Creature**

   - **Desktop**: Click and drag horizontally with your mouse to rotate the camera around the creature
   - **Mobile**: Touch and swipe horizontally to rotate the camera 360°
   - The camera orbits at eye level (height 1.2/4 feet) in a circle 8 units from the creature
   - The viewing angle looks slightly downward, letting you see both the creature and the platform

3. **Observe the Living Creature**

   - Watch the creature continuously pulse and wobble with organic, lifelike movement
   - The creature scales between 92% and 108% of its base size with a breathing rhythm
   - Independent wobble on each axis (X, Y, Z) creates natural, asymmetric movement
   - The irregular surface (created with noise functions) makes each angle look unique

4. **Experience the Atmosphere**
   - The creature rests above a large circular platform (15-unit radius) with a visible grid pattern
   - A powerful spotlight from directly above illuminates the creature in a 60° cone
   - Fog gradually obscures everything beyond 10 units, creating complete darkness by 20 units
   - The creature's emissive cyan-green glow (0x00ff88) stands out dramatically against the void
   - The camera angle provides spatial context by showing the ground plane beneath the creature

### Interactive Controls

**Camera Rotation**

- **Desktop**: Click and hold left mouse button, then drag left/right to orbit
- **Mobile**: Touch and swipe left/right to orbit
- Rotation speed: 0.005 radians per pixel of movement
- Camera maintains constant 8-unit distance from creature at parallel eye level (1.2 units/4 feet)
- Smooth, continuous rotation with no limits—orbit as many times as you want

**Visual Feedback**

- The creature remains fixed at the center of your view
- As you rotate, you'll see different angles of the irregular blob surface
- The spotlight creates dynamic shadows and highlights as you move
- The circular ground plane with grid pattern provides spatial reference
- The viewing angle lets you appreciate both the creature and its environment

### Performance Features

**Automatic Device Detection**

- The game detects your device on load and optimizes accordingly
- Check the browser console to see: "Mobile: true/false" and "Quality multiplier: 0.5/1.0"

**Desktop Experience (60fps target)**

- 32-segment sphere geometry for smooth curves
- Real-time shadow mapping enabled
- Full antialiasing for crisp edges
- Native device pixel ratio for maximum clarity

**Mobile Experience (30fps target)**

- 16-segment sphere geometry for better performance
- Shadows disabled to reduce GPU load
- Antialiasing disabled to improve frame rate
- Pixel ratio capped at 1.5x to prevent excessive rendering

**Frame Rate Management**

- Precise FPS throttling ensures consistent performance
- Desktop targets 60fps (16.67ms per frame)
- Mobile targets 30fps (33.33ms per frame)
- Animation timing uses delta time for smooth, device-independent movement

### What You'll See

**On-Screen Elements**

- **Title**: "Re-GenX Evolution" at the top
- **Counter**: Placeholder showing "0" (for future karma system)
- **Footer Links**: Quick access to Devvit Docs, r/Devvit, and Discord community

**3D Scene**

- **Creature**: Glowing cyan-green blob (1.5-unit radius) with irregular surface at eye level
- **Ground**: Dark circular platform (15-unit radius) with grid overlay, positioned 0.3 units below creature
- **Lighting**: Bright spotlight from above + subtle ambient fill light
- **Atmosphere**: Black void with fog creating gradual darkness
- **Camera**: Eye-level orbit with downward angle to see both creature and platform

### Tips for Best Experience

1. **Try Different Angles**: The irregular surface looks different from every angle—explore!
2. **Watch the Movement**: Notice how the pulsation and wobble create organic, lifelike motion
3. **Observe the Lighting**: See how the spotlight creates dramatic shadows and highlights
4. **Appreciate the Perspective**: The eye-level camera with downward angle creates an intimate yet grounded viewing experience
5. **Notice the Grid**: The platform's grid pattern helps you perceive depth and spatial relationships
6. **Check Performance**: Open browser console to see FPS and quality settings

### Coming Soon

The current demo is the foundation for a full collaborative evolution game:

- **Group Formation**: Join waiting rooms and form 25-player groups
- **Neon HUD Drawer**: Slide-up menu with creature stats and group info
- **Controlled Mutations**: Vote on genetic traits with your group
- **Uncontrolled Mutations**: Random changes influenced by group behavior
- **Multiple Biomes**: Jungle, desert, ocean, rocky mountain, and cave environments
- **Evolution Cycles**: Creatures age and evolve over time
- **Mutation Animations**: Smooth 2-3 second visual transformations
- **Karma System**: Earn and spend karma to trigger mutations

## Technology Stack

- **[Devvit](https://developers.reddit.com/)**: Reddit's developer platform for immersive games
- **[Three.js](https://threejs.org/)**: 3D graphics library for WebGL rendering
- **[Vite](https://vite.dev/)**: Build tool for client and server compilation
- **[Express](https://expressjs.com/)**: Server-side HTTP framework
- **[TypeScript](https://www.typescriptlang.org/)**: Type-safe development
- **[Redis](https://redis.io/)**: Data persistence via Devvit

## Development Commands

> **Requirement**: Node.js 22.2.0 or higher

- `npm run dev`: Start development server with live Reddit integration
- `npm run build`: Build client and server for production
- `npm run deploy`: Upload new version to Reddit
- `npm run launch`: Publish app for review
- `npm run login`: Authenticate with Reddit
- `npm run check`: Run type checking, linting, and formatting

## Project Structure

```
src/
├── client/              # Three.js frontend (runs in browser)
│   ├── main.ts         # Entry point with scene setup
│   ├── scene/          # Scene management
│   │   └── scene-manager.ts  # Camera, lighting, rendering
│   └── index.html      # HTML template
├── server/             # Express backend (serverless)
│   ├── index.ts        # API endpoints
│   └── core/           # Business logic
│       ├── group-manager.ts   # Group formation
│       └── post.ts            # Post creation
└── shared/             # Shared types
    ├── types/api.ts    # API interfaces
    └── constants/      # Redis keys, constants
```

## Getting Started

1. Clone this repository
2. Run `npm install`
3. Run `npm run dev`
4. Open the playtest URL provided in your browser
5. The app will appear in a Reddit post with a "Play" button

## Contributing

This project follows the Re-GenX specification located in `.kiro/specs/regenx-evolution/`. See `tasks.md` for the implementation roadmap.

## License

BSD-3-Clause
