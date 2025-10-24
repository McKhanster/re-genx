# Re-GenX: Personal Creature Companion

> **A Tamagotchi-style creature care game for Reddit** where you nurture your own unique familiar through feeding, playing, and giving attention. Watch your lustrous, living creature evolve with player-directed mutations in a dramatic 3D spotlight environment.

**🎮 Play directly on Reddit** • **🎨 Stunning Three.js 3D graphics** • **🧬 Player-controlled evolution** • **🔒 Privacy-first design** • **🔊 Procedural sound system** • **✨ Organic blob creature**

---

## What is Re-GenX?

Re-GenX is a **personal creature companion game** built for Reddit where you care for your own unique familiar—a living, pulsating organic blob creature displayed in a dramatic spotlight setting. Like a digital Tamagotchi, you must actively nurture your familiar through feeding, playing, and giving attention, or risk having it removed due to neglect.

Your familiar exists in a **dynamic biome environment** (jungle, rocky mountain, desert, ocean, or cave) on a circular platform, surrounded by complete darkness beyond a 10-meter visibility radius. You can **rotate the camera 360°** around your familiar to view it from all angles at eye level (4 feet above ground), creating an intimate, theatrical viewing experience reminiscent of a museum exhibit or stage performance.

The game features **instant state restoration**—when you return to the game, your complete familiar state (including all mutations, stats, biome, and care level) loads in under 2 seconds with a loading indicator. Your familiar's appearance and all applied mutations are automatically restored from Redis, ensuring it looks exactly as you left it.

**Core Gameplay Loop:**
1. **Care for your familiar** - Feed, play, and give attention to earn Evolution Points and maintain Care Meter
2. **Earn Evolution Points** - Each care action rewards 5-15 EP based on the action type
3. **Trigger mutations** - Spend 100 EP to choose from 3-5 trait options (legs, color, size, appendages, patterns)
4. **Watch it evolve** - Your familiar transforms with 2-3 second elastic animations showing your chosen traits
5. **Manage stats** - Every mutation has trade-offs affecting mobility, senses, survival, cognition, and vitals
6. **Avoid neglect** - Keep Care Meter above 0 or your familiar will be removed after 24 hours

**Advanced Visual Features:**
- **Living Plasma Creature**: Voronoi cell-based geometry with custom GLSL plasma shaders creates a truly biological, pulsating organism
- **Dynamic Shader System**: Real-time color gradients, Fresnel rim lighting, and animated glow effects driven by custom vertex and fragment shaders
- **Procedural Animation**: Multi-octave Simplex noise (3 octaves) drives organic vertex motion for truly lifelike breathing and pulsating movement
- **Post-Processing Pipeline**: Atmospheric bloom effects enhance the ethereal glow of your familiar
- **Adaptive Cell Geometry**: 40-90 Voronoi cells on mobile/desktop create organic, biological surface structure
- **Dynamic Care States**: Creature appearance changes based on care level (bright cyan plasma when happy, dull gray when sad)

---

## Quick Start

**New to Re-GenX?** Here's everything you need to know in 30 seconds:

1. **Click "Play"** on a Re-GenX post to launch the game in fullscreen
2. **Your familiar appears** as a living, pulsating organic blob on a circular platform, surrounded by darkness
3. **Drag to rotate** the camera 360° around your familiar at eye level (touch and swipe on mobile)
4. **Click "▼ MENU"** at the top-center to open care actions
5. **Feed, Play, or give Attention** to earn Evolution Points and keep your familiar happy (5-minute cooldowns)
6. **Spend 100 EP** on the "⚡ Evolve" button to choose mutations and transform your familiar
7. **Keep Care Meter above 0** or your familiar will be removed after 24 hours

**That's it!** The game auto-saves and restores your complete familiar state (including all mutations) in under 2 seconds. Just remember to check in regularly to keep your familiar healthy.

**Sound:** Adjust volume or mute sounds using the speaker icon (🔊) in the top-right corner.

---

## Table of Contents

- [What is Re-GenX?](#what-is-re-genx)
- [How to Play](#how-to-play)
- [What Makes Re-GenX Unique?](#what-makes-re-genx-unique)
- [Current Features](#current-features)
- [Future Features](#future-features)
- [Development](#development)

## What Makes Re-GenX Unique?

Re-GenX stands out as an innovative creature care game with several groundbreaking features:

**🎭 Theatrical Presentation**: Your familiar is displayed like a museum exhibit or stage performance—spotlit from above (20.0 intensity from 12 units high) on a circular platform, surrounded by complete darkness. The dramatic lighting with subtle atmospheric bloom creates an intimate, focused viewing experience unlike typical 3D games.

**💎 Living Plasma Organism**: The creature is a biological, cell-based structure (1.5-unit radius) that literally breathes and pulses with life through advanced shader technology:
- **Voronoi Cell Geometry**: 40-90 organic cells create a biological surface structure with natural irregularity
- **Skeletal Frame Visualization**: Glowing cyan skeletal structure displayed next to the creature reveals its internal framework, like viewing an X-ray or anatomical diagram
- **Custom GLSL Plasma Shaders**: Real-time vertex and fragment shaders generate dynamic color gradients and animated glow effects
- **Fresnel Rim Lighting**: Edges glow brighter when viewed at angles, creating an ethereal, living appearance
- **Multi-Octave Simplex Noise**: 3 octaves at 1x, 2x, 4x frequency create truly organic, fluid motion with per-vertex animation
- **Gentle Vertex Deformation**: 6% amplitude creates refined, graceful movement across the entire surface
- **Dynamic Pulsation**: Overall scale varies by 8% using sine wave for breathing effect
- **Adaptive Color Palettes**: Shader-driven color transitions based on care state (cyan/magenta/purple when happy, gray when sad)
- **Time-Based Animation**: Plasma effects animate continuously with customizable speed and intensity

**🎮 Tamagotchi Meets 3D**: Combines the emotional attachment of classic virtual pets with stunning Three.js 3D graphics. Your familiar's appearance dynamically changes based on care level—bright cyan-white (#aaddff) with active pulsing when happy (Care Meter 50-100), light gray when neutral (20-50), dull gray when sad (0-20), with corresponding changes in glow intensity (0.8 to 0.1) and vertical position (1.2 to 1.0 units).

**🧬 Player-Directed Evolution**: Unlike random mutation systems, you choose exactly which traits to evolve. Spend 100 Evolution Points to select from 3-5 trait options in categories like legs, color, size, appendages, or patterns. Each mutation applies with 85-95% control (5-15% randomness for organic feel) and animates over 2-3 seconds with elastic ease-out effects.

**📊 Real-Time Visual Feedback**: Every action has immediate visual feedback—floating numbers show stat changes with color coding (green for increases, red for decreases), buttons pulse when clicked with glow effects, the familiar animates in response to care (eating, bouncing, happy pulse), and toast notifications slide down from the top to keep you informed of all events.

**🔒 Privacy-First Design**: Optional personality reflection system that analyzes your public Reddit posts to influence mutations, but only with explicit consent shown in a clear dialog on first play. You can opt out anytime for completely random mutations. Only public posts from the last 30 days are analyzed, never browsing history or private data.

**📱 Mobile-First Architecture**: Automatically detects your device and adjusts quality—30fps target on mobile with 48-segment geometry, 60fps on desktop with 96-segment geometry. Touch controls work seamlessly alongside mouse controls. LOD (Level of Detail) system dynamically adjusts quality multiplier (0.5 on mobile, 1.0 on desktop).

**⚡ Instant State Restoration**: When you reload the game, your complete familiar state (including all mutations, stats, biome, and care level) loads in under 2 seconds with a loading indicator. All applied mutations are automatically restored from Redis with their exact geometry and positioning.

**🔊 Procedural Sound System**: All audio generated in real-time using Web Audio API without any external files. Six distinct sound effects for actions (mutation, feed, play, attention, sad, click) plus five unique ambient biome soundscapes (jungle birds, mountain wind, desert breeze, ocean waves, cave drips). Independent volume controls for master and ambient sounds with persistent settings.

**✨ Advanced Rendering Pipeline**: Post-processing effects create a unique visual style:
- **Atmospheric Bloom**: Subtle bloom effect (strength 0.8-1.2, radius 0.4, threshold 0.5) enhances bright areas for ethereal glow
- **Adaptive Quality**: Automatically adjusts effect intensity based on device performance
- **Efficient Rendering**: Uses EffectComposer for optimized multi-pass rendering
- **Mobile Optimization**: Reduces bloom intensity and resolution on mobile devices

## How to Play

### Getting Started

1. **Launch the Game**: 
   - Find a Re-GenX post on Reddit
   - Click the "Play" button to launch the game in fullscreen mode
   - The 3D scene loads with your familiar at center stage under a dramatic spotlight (20.0 intensity from 12 units above)

2. **Meet Your Familiar**: 
   - If this is your first time, the game automatically creates your personal organic blob creature
   - Your familiar starts with a Care Meter at 100 and 0 Evolution Points
   - A random biome environment is selected (jungle, rocky mountain, desert, ocean, or cave)
   - The creature appears as a living, pulsating organic blob (1.5-unit radius) with gentle breathing animation driven by multi-octave Simplex noise

3. **Privacy Choice** (First Time Only): 
   - A dialog appears asking if you want to enable "Personality Reflection"
   - **Opt In**: Future uncontrolled mutations will be influenced by your public Reddit posting patterns from the last 30 days
   - **Opt Out**: All mutations will be completely random
   - This choice is saved to Redis and can be changed later
   - Only public posts are analyzed—never browsing history, private messages, or personal data

4. **Explore the View**: 
   - **Desktop**: Click and drag left/right to orbit 360° around your familiar (0.005 radians per pixel)
   - **Mobile**: Touch and swipe left/right to rotate the camera
   - The camera stays at eye level (1.2 units/4 feet above ground) at 8-unit radius
   - Camera looks slightly downward at point (0, 0.5, 0) to see both creature and circular ground platform (5-unit radius)

5. **Open the HUD Menu**: 
   - Click the "▼ MENU" button at the top-center of the screen (changes to "▲ CLOSE" when open)
   - This reveals the care actions, stats, and detailed information panel with smooth slide-down animation
   - Press ESC key or click "▲ CLOSE" to hide the menu

6. **Adjust Sound Settings** (Optional):
   - Click the speaker icon (🔊) in the top-right corner to open sound settings
   - Adjust master volume (overall game volume, default 70%)
   - Adjust ambient volume (biome background sounds, default 30%)
   - Toggle sounds on/off with the enable/disable checkbox
   - Settings are saved automatically to your browser's localStorage

### Core Gameplay: Care for Your Familiar

Your familiar needs regular care to stay healthy. Perform three types of care actions:

**Feed (🍖)**: +15 Care Meter, +10 Evolution Points
- Animation: Eating motion with expansion/contraction (15% scale variation) and brighter glow (emissive intensity pulses)
- Cooldown: 5 minutes (tracked server-side with Redis TTL)

**Play (🎾)**: +10 Care Meter, +15 Evolution Points  
- Animation: Bouncing (0.5 unit vertical movement) and spinning (360° rotation) with pulsing glow
- Cooldown: 5 minutes

**Attention (💚)**: +5 Care Meter, +5 Evolution Points
- Animation: Happy pulse (10% scale variation) with warm, gentle glow
- Cooldown: 5 minutes

**How to Care:**
1. Click "▼ MENU" at the top-center to open the HUD panel (button changes to "▲ CLOSE" when open)
2. In the "Care Actions" section, click any care button (Feed, Play, or Attention)
3. Button shows loading state (spinning icon, disabled, 60% opacity) while processing
4. Watch your familiar respond with a unique 1-second animation synchronized with the action
5. See floating text showing rewards gained (+15 Care, +10 EP) that floats upward and fades over 2 seconds
6. Button pulses with a 0.3-second scale animation and box-shadow glow effect
7. HUD updates instantly with new Care Meter and Evolution Points values
8. Button enters cooldown state with orange border (#ff8800) and live countdown timer (e.g., "4:32")
9. Cooldowns persist across page reloads (server-side Redis tracking with TTL expiration)
10. If you try to act during cooldown, you'll see an error message with remaining time (429 HTTP status)
11. Press ESC key to close the menu panel

### Evolve Your Familiar

Once you've earned 100 Evolution Points through care actions, you can trigger a controlled mutation:

**How to Evolve:**
1. Look for the "⚡ Evolve" button at the bottom-center of the screen
2. When you have 100+ EP, the button becomes active and glows with pulsing animation (box-shadow pulses between 0.3 and 0.5 intensity)
3. When you have less than 100 EP, button shows "X/100 EP" and has orange border (#ff8800)
4. Click "Evolve" to spend 100 EP and trigger a mutation (deducted immediately from your balance)
5. Button shows loading state while processing (spinning overlay, 60% opacity, pointer-events disabled)
6. A modal panel appears showing 3-5 trait options from one randomly selected category (legs, color, size, appendage, or pattern)
7. Each option card shows:
   - Preview icon (80x80px circular badge with neon green border) representing the trait
   - Trait name and category label (e.g., "4 Legs" / "legs")
   - Specific value (e.g., 4, "#ff0000", 1.5)
   - "Select" button (neon green styling)
8. Click "Select" on your preferred trait (or "Cancel" to abort and forfeit 100 EP, or press ESC)
9. Button shows loading state while applying mutation
10. Server applies mutation with 85-95% control (5-15% randomness for organic feel)
11. Watch your familiar transform with a 2-3 second elastic ease-out animation (easeOutElastic function)
12. See floating numbers showing stat changes (green for increases, red for decreases) stacked vertically with staggered timing
13. A confirmation message appears: "✨ Evolution Complete! [Trait Name] applied"
14. HUD updates with new stats and remaining EP balance
15. Session expires after 5 minutes if no selection is made (Redis TTL)

**Mutation Examples:**
- **Legs**: Choose 2, 4, 6, or 8 legs (affects speed and agility based on count)
- **Color**: Choose red (#ff0000), blue (#0000ff), green (#00ff00), purple (#ff00ff), or gold (#ffd700) (minimal stat effects, mostly aesthetic)
- **Size**: Choose tiny (0.5), small (0.75), medium (1.0), large (1.5), or giant (2.0) (affects attack, defense, and speed with clear trade-offs)
- **Appendage**: Choose tail, wings, horns, or tentacles (affects mobility and survival stats differently)
- **Pattern**: Choose spots, stripes, scales, or fur (affects defense and stealth)

**Important Notes:**
- Each mutation costs 100 Evolution Points (non-refundable)
- Mutations are stored in Redis and persist across sessions
- Currently mutations affect stats but visual rendering is not yet implemented (geometry generators are ready)
- Each mutation affects your familiar's stats with realistic trade-offs (e.g., larger size = +20 attack, +15 defense, -10 speed)
- Stat changes are displayed as floating numbers on screen with 1-second fade-out animation
- You can cancel the selection by clicking "Cancel" or pressing ESC (but you lose the 100 EP)

### Monitor Your Familiar's Health

**Care Meter (0-100)**: Displayed in top-right corner and in the HUD menu
- **Happy (50-100)**: Bright platinum color (#e5e4e2), active pulsing, positioned at 1.2 units, emissive intensity 0.3
- **Neutral (20-50)**: Light gray color (#cccccc), slower pulsing, positioned at 1.1 units, emissive intensity 0.2
- **Sad (0-20)**: Dull gray color (#999999), minimal pulsing, droops to 1.0 units, emissive intensity 0.1
- **Critical (<20)**: ⚠️ Warning appears in bottom-right corner with red pulsing animation and shake effect

**Evolution Points (EP)**: Displayed in bottom-left corner and in the HUD menu
- Earn through care actions (5-15 EP per action)
- Save up 100 EP to trigger controlled mutations
- Balance updates instantly in HUD after each care action
- Mutation button shows "X/100 EP" when insufficient

**Neglect Warnings**: 
- When Care Meter drops below 20, "⚠️ NEEDS ATTENTION" appears in bottom-right corner
- Toast notification appears: "⚠️ Care Meter Low! Your familiar needs attention!"
- Your familiar's appearance changes to sad/distressed state (dull gray #999999, minimal pulsing, droops to 1.0 units)
- Keep Care Meter above 20 to prevent removal!

**Removal Warning (Care Meter at 0)**:
- Full-screen overlay appears with pulsing red styling and shake animation
- Shows live countdown timer: hours, minutes, and seconds until removal (24 hours from last care)
- Large warning icon (🚨) with shake animation
- "Care Now" button opens HUD menu for immediate action
- "Dismiss" button closes warning (reopens on page reload if still at 0)
- Warning persists until Care Meter increases above 0
- Countdown updates every second in real-time

### Explore the Environment

**Camera Controls:**
- **Desktop**: Click and drag left/right to orbit around your familiar (pointer events)
- **Mobile**: Touch and swipe left/right to orbit (touch events)
- Camera maintains eye-level perspective (1.2 units/4 feet above ground, 8 units radius from creature)
- Unlimited 360° rotation with smooth, responsive controls (0.005 radians per pixel drag distance)
- Camera looks at point (0, 0.5, 0) to see both creature and ground platform
- Rotation speed: deltaX * 0.005 radians per frame

**Biome Environments** (randomly selected when familiar is created):
- **Jungle**: Dark green ground (#2d5016, shininess 5) with lush plants (stems + leaves), ground foliage (6-12 objects on mobile, 12-24 on desktop)
- **Rocky Mountain**: Gray rocky surface (#5a5a5a, shininess 5) with irregular boulders (dodecahedron geometry with randomized vertices) and pebbles (5-10 objects on mobile, 10-20 on desktop)
- **Desert**: Sandy yellow ground (#c2b280, shininess 8) with cacti (main body + arms) and sand dunes (ellipsoid shapes) (4-8 objects on mobile, 8-16 on desktop)
- **Ocean**: Deep blue water (#1a4d7a, shininess 60, specular #4488aa) with animated water surface (transparent plane), coral structures (branching cylinders), and seaweed (3-6 objects on mobile, 6-12 on desktop)
- **Cave**: Dark rocky floor (#2a2a2a, shininess 3) with stalactites (hanging cones), stalagmites (upward cones), and glowing cyan crystals (#00ffff emissive) (4-8 objects on mobile, 8-16 on desktop)

**Atmospheric Effects:**
- Single powerful spotlight from directly above (position: 0, 12, 0) with 20.0 intensity, 60° cone angle (Math.PI/3), 0.2 penumbra for sharper edges, decay 0.8 for brighter scene, distance 35
- Subtle ambient light (0x404040 at 0.2 intensity) for gentle fill without washing out shadows
- Subtle atmospheric bloom (strength 0.8-1.2, radius 0.4, threshold 0.5) enhances bright areas without overwhelming the scene
- Linear fog (THREE.Fog) creates complete darkness from 10 to 20 meters
- Pure black void background (#000000) for theatrical presentation
- Your familiar's subtle warm emissive glow (#aaaaaa) pulses between 0.1-0.5 intensity at 1.5 Hz
- Circular ground platform (5-unit radius) with biome-specific texture, positioned at y=-0.5
- Shadow mapping: 2048x2048 PCF soft shadows on desktop (disabled on mobile for performance)

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

Re-GenX stands out as an innovative creature care game with several groundbreaking features:

**🎭 Theatrical Presentation**: Your familiar is displayed like a museum exhibit or stage performance—spotlit from above (20.0 intensity from 12 units high) on a circular platform, surrounded by complete darkness. The dramatic lighting with subtle atmospheric bloom creates an intimate, focused viewing experience unlike typical 3D games.

**💎 Living Plasma Organism with Advanced Shaders**: The creature features custom GLSL plasma shaders integrated with Voronoi cell geometry that create a truly biological, living appearance. The plasma vertex shader calculates view direction and normals for Fresnel-based rim lighting, while the plasma fragment shader generates dynamic color gradients, cell edge glow, and animated plasma effects. Multi-octave Simplex noise (3 octaves at 1x, 2x, 4x frequency) drives per-vertex animation—your familiar literally breathes and pulses with life through shader-driven effects. The cell-based geometry (40-90 cells) creates an organic, biological surface structure that enhances the living appearance.

**🎮 Tamagotchi Meets 3D**: Combines the emotional attachment of classic virtual pets with stunning Three.js 3D graphics and cutting-edge shader technology. Your familiar's appearance dynamically changes based on care level—vibrant plasma colors (cyan/magenta/purple/teal) with active animation when happy (Care Meter 50-100), muted colors when neutral (20-50), dull gray with disabled plasma when sad (0-20), with corresponding changes in glow intensity (0.8 to 0.2) and vertical position (1.2 to 1.0 units).

**🧬 Player-Directed Evolution**: Unlike random mutation systems, you choose exactly which traits to evolve. Spend 100 Evolution Points to select from 3-5 trait options in categories like legs, eyes, wings, spikes, tentacles, or horns. Each mutation applies with 85-95% control (5-15% randomness for organic feel) and animates over 2-3 seconds with elastic ease-out effects.

**📊 Real-Time Visual Feedback**: Every action has immediate visual feedback—floating numbers show stat changes with color coding (green for increases, red for decreases), buttons pulse when clicked with glow effects, the familiar animates in response to care (eating, bouncing, happy pulse), and toast notifications slide down from the top to keep you informed of all events.

**🔒 Privacy-First Design**: Optional personality reflection system that analyzes your public Reddit posts to influence mutations, but only with explicit consent shown in a clear dialog on first play. You can opt out anytime for completely random mutations. Only public posts from the last 30 days are analyzed, never browsing history or private data.

**📱 Mobile-First Architecture**: Automatically detects your device and adjusts quality—30fps target on mobile with 48-segment geometry, 60fps on desktop with 96-segment geometry. Touch controls work seamlessly alongside mouse controls. LOD (Level of Detail) system dynamically adjusts quality multiplier (0.5 on mobile, 1.0 on desktop).

---

### 1. **Complete Controlled Mutation System with Player Choice**

Re-GenX features a fully implemented mutation system that puts evolution in your hands:

**Player-Directed Evolution:**
- Spend 100 Evolution Points to trigger a controlled mutation
- Choose from 3-5 trait options in categories like legs, color, size, appendage, or pattern
- Each option shows a preview icon, category label, and specific value
- Mutations apply with 85-95% control (slight randomness for organic feel)
- 2-3 second elastic animations bring mutations to life
- Stat changes displayed as floating numbers (green for +, red for -)
- **Mutations persist across sessions**—all applied mutations are stored in Redis and automatically restored when you reload the game

**Mutation Choice Interface:**
- Prominent "Evolve" button at bottom-center (⚡ icon)
- Button state updates based on Evolution Points (disabled when < 100 EP)
- Modal panel displays trait options with preview icons
- Each option card shows trait details and "Select" button
- Cancel option available (button or ESC key)
- Confirmation message after successful evolution
- 5-minute session timeout for mutation choices

**Stat Trade-offs:**
- Every mutation affects multiple stats with realistic trade-offs
- Larger size = more attack/defense but less speed/agility
- More legs = better mobility but potential speed penalties
- Wings = increased speed/agility
- Patterns = defense/stealth bonuses
- All stat changes visible as floating numbers on screen

**State Restoration:**
- When you reload the game, all mutations are automatically restored
- Each mutation's geometry is applied to the creature renderer without animation
- Complete state restoration happens in under 2 seconds
- Your familiar looks exactly as you left it, with all mutations intact

### 2. **Fully Functional Personal Care System with Real-Time Visual Feedback**

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
- **Toast Notifications**: Slide-down notifications for important events
  - Mutation notifications: "🧬 Mutation Occurred! [type] mutation applied"
  - Controlled mutation: "✨ Evolution Complete! [trait] applied"
  - Care warnings: "⚠️ Care Meter Low! Your familiar needs attention!"
  - Removal warnings: "🚨 Removal Warning! Familiar will be removed in X hours"
  - Auto-dismiss after 5-7 seconds with smooth animations
  - Stack multiple notifications vertically
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

### 3. **Ultra-Smooth Platinum Surface with Dramatic Lighting**

Re-GenX features exceptionally high-detail geometry and sophisticated lighting:

- **Living Platinum Creature**: Organic, irregularly-shaped blob (1.5-unit radius) with lustrous platinum surface (#e5e4e2)
- **Ultra-High Detail**: 48 segments on mobile, 96 segments on desktop—double typical 3D web game complexity
- **Semi-Gloss Finish**: Phong shading with bright specular highlights (shininess 80) creates wet, metallic look
- **Fluid Organic Motion**: Multi-octave Simplex noise animation with gentle 10% amplitude for graceful movement
- **Subtle Warm Glow**: Emissive glow (#aaaaaa) pulses between 0.1-0.5 intensity for ethereal presence
- **Dramatic Spotlight**: Single powerful spotlight (20.0 intensity) from above creates beautiful highlights and shadows
- **Atmospheric Bloom**: Subtle post-processing bloom enhances bright areas without overwhelming the scene
- **Enhanced Shadow Quality** (desktop): 2048x2048 shadow map with optimized bias for crisp, visible shadows
- **Atmospheric Darkness**: Linear fog creates complete darkness beyond 10 meters

### 4. **Five Immersive Biome Environments**

Each biome is fully realized with unique ground textures and environmental objects:

- **Jungle**: Dark green ground with lush plants, stems, and foliage
- **Rocky Mountain**: Gray rocky surface with boulders and pebbles
- **Desert**: Sandy yellow ground with cacti and sand dunes
- **Ocean**: Deep blue water with coral structures and seaweed
- **Cave**: Dark rocky floor with stalactites, stalagmites, and glowing cyan crystals

All biome objects adapt complexity based on device (6-12 objects on mobile, 10-24 on desktop).

### 5. **Fighter Jet-Style HUD**

Futuristic neon green HUD (#00ff88) with minimal always-visible info:

- **Corner Displays**: Age, Care Meter, Evolution Points, Neglect Warning
- **Slide-Down Menu**: Detailed panel with care actions, stats, and status
- **Care Action Buttons**: Three interactive buttons with rewards, cooldowns, and animations
- **Real-Time Updates**: HUD updates instantly when stats change
- **Mobile-Optimized**: Touch-friendly with 44px minimum target sizes

### 6. **Advanced Organic Animation System**

Multi-octave Simplex noise creates truly organic, fluid motion:

- **Three Octaves**: Frequencies at 1x, 2x, 4x combined at 50%, 30%, 20% amplitudes
- **Gentle Movement**: Reduced 10% amplitude creates graceful, refined motion
- **Per-Vertex Animation**: Each vertex moves independently based on 3D noise
- **Overall Pulsation**: 8% scale variation creates breathing effect
- **Delta Time-Based**: Device-independent animation speed

### 7. **Eye-Level Perspective with Ground View**

Camera positioned at eye level (1.2 units/4 feet) with downward angle:

- **Intimate Perspective**: Observe familiar face-to-face
- **Spatial Grounding**: See circular platform (5-unit radius) beneath familiar
- **360° Rotation**: Smooth pointer-based controls (0.005 radians per pixel)
- **Unlimited Orbit**: No boundaries or limits on rotation

### 8. **Adaptive Performance Architecture**

Automatically detects device and adjusts quality:

- **Desktop**: 60fps target, 96 segments, shadows, antialiasing, full pixel ratio
- **Mobile**: 30fps target, 48 segments, no shadows, no antialiasing, 1.5x max pixel ratio
- **FPS Throttling**: Precise frame timing maintains target frame rates
- **Quality Maintained**: Both platforms maintain smooth, glossy platinum appearance

### 9. **Complete Mutation Geometry System**

The game includes a full mutation rendering system with geometry generators for:

- **Legs**: Cylindrical limbs positioned radially around the creature
- **Eyes**: Glowing spheres with high emissive intensity
- **Wings**: Curved plane geometry with transparency
- **Spikes**: Conical protrusions at random surface positions
- **Tentacles**: Curved cylinders with tapering
- **Horns**: Pointed cones positioned on top

Each mutation type has unique materials, positioning logic, and can be animated with elastic easing functions.

### 10. **Persistent State Management**

- **Automatic Familiar Creation**: Game automatically creates a familiar for new users on first load
- **State Persistence**: All familiar data stored in Redis (mutations, stats, age, biome, care meter, evolution points)
- **Cooldown Persistence**: Cooldown timers persist across page reloads using server-side Redis TTL
- **Retry Logic**: 3 attempts with exponential backoff for all Redis operations
- **Error Recovery**: Graceful error handling with user-friendly messages

### 11. **Privacy-First Personality Reflection System**

Re-GenX includes an optional personality reflection feature with full privacy controls:

**Privacy Dialog:**
- Appears on first familiar creation
- Clear explanation of what data is analyzed (public posts only)
- Explicit opt-in required for personality reflection
- Beautiful modal design with neon green styling
- Mobile-optimized with touch-friendly buttons

**How It Works:**
- Analyzes your public Reddit posts from the last 30 days
- Identifies posting patterns (e.g., gaming, nature, tech subreddits)
- Influences uncontrolled mutations to reflect your interests
- Example: Frequent cat subreddit posts → feline traits like whiskers or cat ears

**Privacy Guarantees:**
- ✅ Only analyzes public posts with explicit consent
- ✅ Never tracks browsing history or private data
- ✅ Never shares data with anyone
- ✅ Can opt out anytime (mutations become purely random)
- ✅ All data cleared immediately on opt-out

### 12. **Advanced Shader System with Custom GLSL**

Re-GenX features a sophisticated shader system that brings the familiar to life with dynamic visual effects:

**Plasma Shader Material:**
- **Custom ShaderMaterial**: Replaces standard Phong material with custom GLSL shaders for advanced effects
- **Vertex Shader** (`plasma-vertex.glsl`):
  - Calculates view direction from vertex to camera for Fresnel effects
  - Transforms normals to world space for accurate lighting
  - Passes world position and UV coordinates to fragment shader
  - Enables dynamic rim lighting and edge glow effects
- **Fragment Shader** (`plasma-fragment.glsl`):
  - Creates living, breathing surface with animated color gradients
  - Implements Fresnel effect for rim lighting (brighter edges when viewed at angles)
  - Time-based animation for pulsating glow effects
  - Customizable colors and intensities for different familiar states

**Cell Geometry Generator:**
- **Voronoi-Based Surface**: Creates organic, biological cell structure using Voronoi tessellation
- **Fibonacci Sphere Distribution**: Evenly distributes cell centers using golden ratio for natural appearance
- **Adaptive Cell Count**: 30-50 cells on mobile, 80-100 cells on desktop for optimal performance
- **Irregular Polygons**: Each cell has 5-8 sides for natural, non-uniform appearance
- **Surface Relief**: Depth variation (0.1-0.3) creates texture and dimension
- **Solid Interior Geometry**: Triangles connect from origin to cell centers and vertices, creating a complete volumetric structure (not just a hollow shell)
- **Proper UV Mapping**: Supports texturing with correct coordinate mapping
- **Smooth Normals**: Calculates vertex normals for realistic lighting
- **Ready for Integration**: Can replace standard sphere geometry for more biological look

**Post-Processing Pipeline:**
- **Bloom Effect**: Enhances bright areas with subtle glow (strength 0.8-1.2, radius 0.4, threshold 0.5)
- **Adaptive Quality**: Automatically adjusts effect intensity based on device performance
- **Efficient Rendering**: Uses EffectComposer for optimized multi-pass rendering
- **Mobile Optimization**: Reduces bloom intensity and resolution on mobile devices

**Technical Implementation:**
- **ShaderMaterial Integration**: Custom shaders work seamlessly with Three.js lighting system
- **Uniform Variables**: Time, colors, and intensities passed as uniforms for dynamic control
- **Varying Variables**: Smooth interpolation of normals, positions, and UVs across surface
- **WebGL Optimization**: Efficient shader code minimizes GPU load
- **Fallback Support**: Gracefully degrades to standard materials if shaders fail

### 13. **Procedural Sound System with Web Audio API**

Re-GenX features a complete procedural sound system that generates all audio in real-time without external files:

**Sound Effects:**
- **Mutation Sound** (1.5s): Sweeping frequency with shimmer effect for evolution moments
- **Feed Sound** (0.4s): Quick chomping burst for feeding actions
- **Play Sound** (0.6s): Bouncy, playful tone for play interactions
- **Attention Sound** (0.5s): Gentle, warm tone for attention giving
- **Sad Sound** (1.0s): Descending, melancholic tone when care meter is low
- **Click Sound** (0.1s): Short click for UI interactions

**Ambient Biome Sounds** (10s loops):
- **Jungle**: Layered bird calls (1200Hz, 1800Hz) with rustling background noise
- **Rocky Mountain**: Wind sounds with low-frequency variations
- **Desert**: Sparse, dry wind with minimal background
- **Ocean**: Wave sounds (0.3Hz oscillation) with splash effects
- **Cave**: Dripping water with echo and reverb effects

**Features:**
- **Procedural Generation**: All sounds generated using Web Audio API oscillators and noise
- **No External Files**: Zero audio file dependencies, reducing load times and bandwidth
- **Stereo Ambient**: Biome sounds use stereo channels for immersive atmosphere
- **Volume Control**: Separate master and ambient volume controls (70% master, 30% ambient default)
- **Auto-Resume**: Handles browser autoplay policies by resuming audio context on user interaction
- **Looping Ambient**: Biome sounds loop seamlessly for continuous atmosphere
- **Memory Efficient**: Sounds preloaded once and reused throughout gameplay
- **Enable/Disable**: Full sound system can be toggled on/off

**Technical Implementation:**
- Web Audio API with AudioContext for all sound generation
- GainNode for volume control (master and ambient channels)
- AudioBufferSourceNode for playback with precise timing
- Procedural waveform generation using sine waves, noise, and envelopes
- Exponential decay envelopes for natural sound fade-outs
- Frequency modulation for organic, non-synthetic sound quality

### 14. **Sound Settings Interface**

Re-GenX includes a user-friendly sound settings interface for complete audio control:

**Settings Panel:**
- **Master Volume Slider**: Control overall game volume (0-100%)
- **Ambient Volume Slider**: Separate control for biome ambient sounds (0-100%)
- **Enable/Disable Toggle**: Quickly mute all sounds with a single button
- **Visual Feedback**: Sliders show current volume levels with smooth animations
- **Persistent Settings**: Volume preferences saved to localStorage
- **Accessible Design**: Large touch targets (44px minimum) for mobile users

**Features:**
- Real-time volume adjustment without interrupting playback
- Independent control of sound effects and ambient sounds
- Smooth fade transitions when enabling/disabling sounds
- Mobile-optimized with touch-friendly controls
- Integrates seamlessly with HUD menu system

### 15. **Robust API Client with Network Resilience**

The game features a centralized APIClient that handles all communication between client and server:

- **Exponential Backoff Retry**: Automatically retries failed requests with 1s, 2s, 4s delays
- **Smart Error Handling**: Distinguishes between client errors (4xx - no retry) and server errors (5xx - retry)
- **Network Resilience**: Handles network failures gracefully with automatic retry
- **User-Friendly Notifications**: Displays context-specific error messages as slide-down notifications
- **Type Safety**: Full TypeScript support ensures type-safe API calls
- **Centralized Logic**: Single source of truth for all API communication
- **Automatic Error Display**: Shows errors for 5 seconds with smooth animations
- **Context-Aware Messages**: Different error messages for cooldowns, insufficient EP, expired sessions, etc.

### 16. **Comprehensive Notification System**

Re-GenX includes a multi-layered notification system for all game events:

**Toast Notifications:**
- **Mutation Notifications** (🧬): Appear when uncontrolled mutations occur, showing mutation type and stat changes
- **Evolution Notifications** (✨): Appear when controlled mutations complete, showing chosen trait and effects
- **Warning Notifications** (⚠️): Appear when Care Meter drops below 20, urging immediate action
- **Error Notifications** (✗): Appear when actions fail, with clear error messages
- **Success Notifications** (✓): Appear for successful actions and confirmations

**Features:**
- Auto-dismiss after 5-7 seconds (configurable per notification)
- Stack multiple notifications vertically
- Smooth slide-down animations
- Close button (×) for manual dismissal
- Color-coded by type (green for success, red for errors, orange for warnings)
- Icon-based visual identification
- Non-intrusive positioning at top of screen
- Fully implemented in TypeScript (CSS styling pending)

### 17. **Critical Removal Warning System**

When Care Meter reaches 0, a full-screen warning system activates to prevent familiar loss:

**Full-Screen Overlay:**
- Prominent modal with pulsing red styling
- Large warning icon (🚨) with shake animation
- Clear message: "Your familiar will be removed if not cared for!"
- Live countdown timer showing hours, minutes, and seconds until removal (24 hours)
- Two action buttons:
  - "Care Now" - Opens HUD menu for immediate care actions
  - "Dismiss" - Closes warning (can be reopened)

**Countdown Timer:**
- Updates every second in real-time
- Shows time remaining in format: "23h 45m 12s"
- Stops at 0h 0m 0s when removal time is reached
- Persists across page reloads (server-side tracking)

**Smart Behavior:**
- Appears automatically when Care Meter reaches 0
- Remains visible until Care Meter increases above 0
- Can be dismissed but will reappear on next page load if still at 0
- Integrates seamlessly with care action system for immediate resolution
- Fully implemented in TypeScript (CSS styling pending)

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
  - Loading state on buttons during API calls (spinning icon, 60% opacity, disabled)
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
  - Spend 100 EP to trigger controlled mutations
- **Error Handling**: Clear error messages for cooldowns and failed actions
- **Backend Integration**: Complete API integration with retry logic and proper error handling

**Controlled Mutation System (Fully Operational):**

- **Mutation Trigger Interface**: Prominent "Evolve" button at bottom-center
  - Costs 100 Evolution Points to trigger
  - Button state updates based on EP balance (shows "X/100 EP" when insufficient)
  - Glowing animation when active
  - Disabled state when EP < 100
  - Loading state during API calls (spinning overlay, 60% opacity)
- **Trait Selection Panel**: Modal interface for choosing mutations
  - Displays 3-5 trait options from one random category
  - Categories: legs, color, size, appendage, pattern
  - Each option shows preview icon, label, category, and value
  - "Select" button for each option
  - "Cancel" button to abort (also ESC key)
  - 5-minute session timeout
- **Mutation Application**: Server-side processing with randomness
  - Deducts 100 EP from player balance
  - Applies chosen trait with 85-95% control (5-15% randomness)
  - Calculates stat effects based on trait
  - Updates familiar state in Redis
  - Returns updated stats to client
- **Visual Feedback**: Rich animations and stat displays
  - 2-3 second elastic animation for mutation appearance
  - Floating numbers show stat changes (green for +, red for -)
  - Multiple stat changes stack vertically with staggered timing
  - Confirmation message: "Evolution Applied! [Trait Name]"
  - HUD updates with new stats and EP balance
- **Stat Trade-offs**: Realistic balance for each mutation
  - Legs: Affects speed and agility based on count
  - Size: Larger = more attack/defense, less speed/agility
  - Appendages: Wings boost speed/agility, horns boost attack/defense
  - Patterns: Scales/fur boost defense, spots/stripes boost stealth
  - Color: Minimal stat effects (aesthetic)
- **Error Handling**: Clear messages for insufficient EP, expired sessions, invalid options
- **Backend Integration**: Complete API with mutation engine, session management, and stat calculation

**Creature Rendering:**

- **Living Plasma Organism**: Biological cell-based structure (1.5-unit radius) with custom GLSL plasma shaders creating a truly living appearance
- **Voronoi Cell Geometry** (Fully Integrated):
  - Fibonacci sphere algorithm distributes 40-90 cells evenly across surface
  - Each cell has 5-8 irregular sides for natural, organic appearance
  - Depth variation (0.15-0.25) creates realistic surface relief and texture
  - Solid interior geometry with complete volumetric structure (not hollow)
  - Proper UV mapping and smooth vertex normals for realistic lighting
  - Adaptive cell count: 40 cells on mobile, 90 cells on desktop
- **Skeletal Frame System** (Fully Integrated):
  - Glowing cyan lines create a biological skeletal structure visible next to the creature
  - Positioned 4 units to the right of the main creature at the same height (1.2 units)
  - Fibonacci sphere algorithm generates evenly distributed skeletal nodes
  - Connects nearby points (within 0.8 radius) to form organic frame
  - Each node connects to 6 nearest neighbors for natural web structure
  - Adaptive complexity: 40 nodes on mobile, 90 nodes on desktop
  - LineSegments geometry with glowing cyan material (0x00ffff, 90% opacity)
  - Provides visual reference for the creature's internal structure
  - Automatically disposed when creature renderer is cleaned up
- **Custom GLSL Plasma Shaders** (Fully Integrated):
  - **Plasma Vertex Shader**: Calculates view direction and normals for Fresnel rim lighting effects
  - **Plasma Fragment Shader**: Generates dynamic color gradients, cell edge glow, and animated plasma effects
  - **Plasma Shader Material**: Custom ShaderMaterial with time-based animation uniforms
  - **Fresnel Effect**: Edges glow brighter when viewed at angles for ethereal, living appearance
  - **Dynamic Color Palettes**: Shader-driven color transitions (cyan/magenta/purple/teal when happy, gray when sad)
  - **Cell Edge Glow**: Configurable edge width (0.02) and glow intensity (1.5) for biological cell appearance
  - **Time-Based Animation**: Plasma speed (0.3) creates continuous, organic color flow
  - **Adaptive Quality**: Shader complexity adjusts based on device capabilities
- **Advanced Organic Animation**: Multi-octave Simplex noise (3 octaves at 1x, 2x, 4x frequency) creates smooth, continuous vertex motion with 6% amplitude for refined, graceful movement
- **Dynamic Pulsation**: Overall scale varies by 8% using sine wave, creating breathing effect
- **Care State Visualization**: Appearance changes dramatically based on care level
  - **Happy (50-100)**: Vibrant plasma colors (cyan/magenta/purple/teal), glow intensity 0.8, plasma enabled, positioned at 1.2 units
  - **Neutral (20-50)**: Muted colors (muted cyan shades), glow intensity 0.5, plasma enabled, positioned at 1.1 units
  - **Sad (0-20)**: Dull gray colors, glow intensity 0.2, plasma disabled, droops to 1.0 units

**Biome System:**

- **Five Unique Biomes**: Jungle, rocky mountain, desert, ocean, and cave environments
- **Dynamic Ground Textures**: Each biome has unique ground color and material properties
- **Environmental Objects**: Plants, rocks, cacti, coral, stalactites, and more
- **Adaptive Object Count**: 3-12 objects on mobile, 6-24 on desktop depending on biome
- **Memory Management**: Proper disposal of geometries and materials when switching biomes
- **Random Selection**: Biome randomly selected on game load for variety

**Mutation Geometry System:**

- **Complete Geometry Generators**: Legs, eyes, wings, spikes, tentacles, horns
- **Elastic Animations**: 2-3 second ease-out-elastic animations for mutation appearance
- **Adaptive Complexity**: Mobile uses 6-16 segments, desktop uses 12-32 segments per mutation
- **Unique Materials**: Each mutation type has custom colors and emissive properties
- **Smart Positioning**: Mutations positioned relative to creature surface with randomness support
- **Stat Change Visualization**: Floating numbers display stat changes when mutations are applied
- **Visual Feedback Integration**: Mutations trigger both geometric changes and stat feedback displays
- **Ready for Rendering**: All geometry generators implemented and tested, ready to be called by mutation engine

**Privacy Dialog (Fully Operational):**

- **First-Time Experience**: Appears automatically when creating a new familiar
- **Clear Privacy Explanation**: 
  - Shows what data is analyzed (public posts from last 30 days)
  - Explains how it influences mutations (posting patterns → trait biases)
  - Lists what is NOT tracked (browsing history, private messages, etc.)
- **Two-Button Choice**:
  - "Opt In (Personality Reflection)" - Green primary button
  - "Opt Out (Random Only)" - Gray secondary button
- **Visual Design**:
  - Modal overlay with backdrop blur
  - Neon green styling matching game aesthetic
  - Smooth fade-in animation
  - Mobile-responsive with touch-friendly buttons (44px minimum)
- **Confirmation Feedback**: Shows success message after choice is made
- **Persistent Storage**: Choice saved to Redis and can be changed later

**Notification System (Fully Operational):**

- **Toast Notifications**: Slide-down notifications for all game events
  - Mutation notifications with stat changes
  - Evolution completion confirmations
  - Care meter warnings
  - Error messages with context
  - Success confirmations
- **Auto-Dismiss**: Notifications automatically disappear after 5-7 seconds
- **Manual Dismiss**: Close button (×) for immediate dismissal
- **Stacking**: Multiple notifications stack vertically
- **Color-Coded**: Green (success), red (error), orange (warning), blue (info)
- **Icon-Based**: Each notification type has a unique icon (🧬, ✨, ⚠️, ✗, ✓)

**Removal Warning System (Fully Operational):**

- **Full-Screen Overlay**: Appears when Care Meter reaches 0
- **Live Countdown**: Shows hours, minutes, seconds until removal (24 hours)
- **Action Buttons**:
  - "Care Now" - Opens HUD menu for immediate care
  - "Dismiss" - Closes warning (reopens on reload if still at 0)
- **Visual Design**:
  - Pulsing red styling with shake animation
  - Large warning icon (🚨)
  - Clear call-to-action message
  - Mobile-responsive with touch-friendly buttons
- **Persistent State**: Countdown persists across page reloads
- **Auto-Hide**: Disappears when Care Meter increases above 0

**Fighter Jet-Style HUD (Care-Focused):**

- **Always-Visible Corner Info**: Minimal displays at screen corners with neon green (#00ff88) styling
  - **Top-Left**: Age display showing evolution cycles survived (e.g., "Age: 5")
  - **Top-Right**: Next cycle countdown ("Next Cycle: 15:00") and Care Meter value (turns red with pulsing animation when < 20)
  - **Bottom-Left**: Evolution Points (EP) balance (e.g., "EP: 45")
  - **Bottom-Right**: Neglect warning (⚠️ NEEDS ATTENTION) appears only when Care Meter < 20
- **Slide-Down Menu Panel**: Detailed information panel that slides down from top with smooth cubic-bezier transition
  - Toggle with "▼ MENU" button at top-center (changes to "▲ CLOSE" when open)
  - **Care Actions** section with three interactive buttons:
    - Feed (🍖): +15 Care, +10 EP - 5 minute cooldown
    - Play (🎾): +10 Care, +15 EP - 5 minute cooldown
    - Attention (💚): +5 Care, +5 EP - 5 minute cooldown
    - Buttons show live countdown timers during cooldown (e.g., "4:32")
    - Orange border (#ff8800) and disabled state during cooldown
  - **Care Status** section showing:
    - Care Meter value (0-100)
    - Evolution Points balance
    - Next Evolution cycle countdown
  - **Familiar Stats** section with five categories:
    - Mobility (speed, agility, endurance)
    - Senses (vision, hearing, smell)
    - Survival (attack, defense, stealth)
    - Cognition (intelligence, social, adaptability)
    - Vitals (health, happiness, energy)
    - Each stat displayed with visual progress bar (0-100%)
    - Color-coded change indicators (green for increases, red for decreases)
    - Stat bars with neon green fill (#00ff88) and glow effects
- **Neon Styling**: Futuristic green (#00ff88) glow effects with semi-transparent black backgrounds (rgba(0, 0, 0, 0.95))
- **Real-Time Stat Updates**: Stats update instantly with floating number feedback showing exact changes
- **Neglect Warning Overlay**: Full-screen overlay appears when Care Meter < 20 with:
  - Large warning icon (⚠️)
  - "Your familiar needs attention!" message
  - "Care Meter is critically low" subtext
  - Pulsing animation and shake effect
- **Non-Intrusive**: Semi-transparent overlay doesn't block the creature view
- **Mobile Optimized**: 
  - Touch events on HUD don't affect 3D scene rotation (stopPropagation on touchstart/touchmove/wheel)
  - Single-column grid layout on mobile
  - All touch targets are 44x44px minimum for accessibility
- **Keyboard Support**: Press ESC to close the menu panel
- **Scrollable Content**: Menu panel scrolls if content exceeds viewport height (max-height: 70vh)

**Scene & Lighting:**

- **Dramatic Single Spotlight**: 20.0 intensity spotlight from 12 units above with 60° cone angle, 0.2 penumbra for sharper edges, 0.8 decay for brighter scene, and 35 unit distance
- **Subtle Ambient Light**: 0x404040 at 0.2 intensity for gentle fill without washing out shadows
- **Atmospheric Bloom**: Subtle post-processing bloom (strength 0.8-1.2, radius 0.4, threshold 0.5) enhances bright areas for ethereal glow
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

**Loading States & User Feedback:**

- **Loading Indicator**: Full-screen loading overlay during state restoration
  - Spinning animation with neon green border
  - Clear message: "Loading your familiar..."
  - Smooth fade-in/fade-out animations
  - Automatically dismisses when loading completes
- **Button Loading States**: Visual feedback during API calls
  - Care action buttons show spinning icon and 60% opacity
  - Mutation choice buttons show spinning overlay
  - Buttons disabled during loading (pointer-events: none)
  - Prevents double-clicks and duplicate requests
- **Connecting Messages**: Optional bottom-right notification for long operations
  - Shows spinning icon with "Connecting..." message
  - Auto-dismisses on completion

**Sound System (Fully Operational):**

- **Procedural Sound Generation**: All audio generated in real-time using Web Audio API
  - No external audio files required
  - Zero bandwidth for audio assets
  - Instant sound availability (no loading delays)
- **Sound Effects**: Six distinct procedural sound effects
  - Mutation (1.5s): Sweeping frequency with shimmer for evolution moments
  - Feed (0.4s): Quick chomping burst for feeding actions
  - Play (0.6s): Bouncy, playful tone for play interactions
  - Attention (0.5s): Gentle, warm tone for attention giving
  - Sad (1.0s): Descending, melancholic tone when care meter is low
  - Click (0.1s): Short click for UI interactions
- **Ambient Biome Sounds**: Five unique 10-second looping ambient tracks
  - Jungle: Layered bird calls with rustling background
  - Rocky Mountain: Wind sounds with low-frequency variations
  - Desert: Sparse, dry wind with minimal background
  - Ocean: Wave sounds with splash effects
  - Cave: Dripping water with echo and reverb
- **Volume Controls**: Independent volume adjustment
  - Master volume control (default 70%)
  - Ambient volume control (default 30%)
  - Enable/disable toggle for all sounds
  - Real-time volume adjustment without interrupting playback
- **Sound Settings UI**: User-friendly settings interface
  - Master volume slider (0-100%)
  - Ambient volume slider (0-100%)
  - Enable/disable toggle button
  - Visual feedback with smooth animations
  - Persistent settings saved to localStorage
  - Mobile-optimized with 44px minimum touch targets
- **Smart Audio Management**:
  - Automatic audio context resume (handles browser autoplay policies)
  - Seamless ambient sound looping
  - Stereo ambient sounds for immersive atmosphere
  - Memory-efficient preloading (sounds generated once, reused)
  - Proper cleanup and disposal of audio nodes
- **Integration with Gameplay**:
  - Care actions trigger appropriate sound effects
  - Biome changes automatically switch ambient sounds
  - Mutation events play evolution sound
  - Low care meter triggers sad sound
  - All sounds synchronized with visual feedback

**Backend Infrastructure (Fully Operational):**

- **Familiar Management System**: Personal creature creation and state management
  - FamiliarManager class with create, fetch, update, and removal methods
  - Default stats initialization (all stats at 50, vitals at 100)
  - Random biome assignment on creation (jungle, rocky_mountain, desert, ocean, cave)
  - Care Meter tracking with neglect detection
  - Privacy opt-in system for personality reflection (fully implemented)
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

- **Mutation Engine**: Complete controlled and uncontrolled mutation system
  - MutationEngine class with trait generation and application
  - **Controlled mutations**: Player-directed with 85-95% control, costs 100 EP
  - **Uncontrolled mutations**: Random with 5-15% control, influenced by activity patterns
  - **Stat calculation**: Automatic stat effects based on mutation traits
  - **Compatibility checking**: Prevents incompatible mutations (future feature)
  - **Session management**: 5-minute TTL for mutation choice sessions
  - **Randomness application**: Applies variance to trait values for organic feel

- **Redis Data Persistence**: Robust data storage with automatic recovery
  - **Familiar state**: mutations, stats, age, biome, createdAt
  - **Care state**: careMeter, lastCareTime, evolutionPoints, neglectWarning
  - **Cooldown timers**: Stored with TTL for automatic expiration
  - **Mutation sessions**: Temporary storage for active mutation choices
  - **Privacy settings**: privacyOptIn flag for future personality reflection
  - **Retry logic**: 3 attempts with exponential backoff (1s, 2s, 4s delays)

- **API Client (Client-Side)**: Centralized API communication with resilience
  - APIClient class handles all client-server communication
  - **Exponential backoff retry**: 3 attempts with 1s, 2s, 4s delays
  - **Automatic error handling**: User-friendly error notifications
  - **Network resilience**: Retries on network errors and 5xx server errors
  - **No retry on client errors**: 4xx errors fail immediately with clear messages
  - **Consistent error display**: Slide-down notifications with 5-second auto-dismiss
  - **Type-safe requests**: Full TypeScript support for all API calls

- **API Endpoints**: RESTful endpoints with proper error handling
  - `GET /api/familiar/state` - Get familiar state (returns null if not found)
  - `POST /api/familiar/create` - Create new familiar (idempotent - returns existing if present)
  - `POST /api/care/feed` - Feed action (+15 Care, +10 EP, 5min cooldown)
  - `POST /api/care/play` - Play action (+10 Care, +15 EP, 5min cooldown)
  - `POST /api/care/attention` - Attention action (+5 Care, +5 EP, 5min cooldown)
  - `POST /api/mutation/trigger` - Trigger controlled mutation (costs 100 EP)
  - `POST /api/mutation/choose` - Apply chosen mutation trait
  - `POST /api/privacy/opt-in` - Set privacy opt-in preference

- **User Authentication**: Reddit context integration via Devvit middleware
  - Automatic user identification from Reddit session
  - No custom authentication required

- **Error Handling**: Comprehensive error handling with user-friendly messages
  - **400 Bad Request**: Invalid input or missing parameters
  - **401 Unauthorized**: User not authenticated
  - **404 Not Found**: Familiar or resource doesn't exist
  - **429 Too Many Requests**: Action on cooldown (includes remaining time)
  - **500 Internal Server Error**: Server-side failures with retry logic
  - **Client-side notifications**: Automatic error display with context-specific messages

## Future Features

**High Priority (Next Sprint):**

- **Plasma Shader Integration**: Replace standard Phong material with custom plasma shader for dynamic surface effects (shaders are ready)
- **Mutation Visual Rendering**: Connect mutation engine to creature renderer to display mutations visually on familiar (geometry generators are ready)
- **Cell-Based Creature Geometry**: Integrate CellGeometryGenerator to replace standard sphere with organic cell-based surface (generator is ready)
- **Care Meter Decay Scheduler**: Implement hourly decay scheduler (5 points per hour) using Devvit scheduler
- **Evolution Cycle Scheduler**: Automatic aging and uncontrolled mutation triggers (30min - 4hr random intervals)
- **State Polling Enhancement**: Implement 5-second polling to detect server-side changes (biome switches, uncontrolled mutations)
- **Notification System CSS**: Complete styling for toast notifications (currently functional but needs polish)
- **Removal Warning CSS**: Complete styling for removal warning overlay (currently functional but needs polish)

**Medium Priority:**

- **Uncontrolled Mutations**: Random mutations influenced by Reddit activity (privacy-compliant, backend ready)
- **Activity Pattern Tracking**: Analyze public posts to influence mutations (with consent, ActivityTracker class implemented)
- **Biome Changes**: Random biome switches every 10 evolution cycles (15% chance, backend logic ready)
- **Mutation Compatibility System**: Prevent incompatible mutations from being applied together (compatibility matrix defined)
- **Mutation History**: View all past mutations and their effects in HUD
- **Settings Menu**: Allow users to change privacy preferences after initial setup

**Low Priority (Polish & Enhancement):**

- **Enhanced Stat Feedback**: Category-based stat change displays for grouped mutations
- **Achievement System**: Unlock badges for care milestones and unique mutations
- **Familiar Naming**: Allow players to name their familiar
- **Export/Share**: Share screenshots or stats of your familiar on Reddit
- **Particle Effects**: Add visual effects for mutations and care actions
- **Music Tracks**: Add background music themes for different biomes (in addition to ambient sounds)

## Tips & Tricks

**Maximize Evolution Points:**
- **Play** gives the most EP (15 points) but only increases Care Meter by 10
- **Feed** is balanced (10 EP, 15 Care Meter)
- **Attention** is quick (5 EP, 5 Care Meter) but less efficient
- **Strategy**: Alternate between Play and Feed for optimal EP gain while maintaining high Care Meter

**Avoid Removal:**
- Keep Care Meter above 20 to avoid neglect warnings
- Set a reminder to check in every few hours
- If Care Meter hits 0, you have 24 hours to recover before removal
- The removal warning shows exact time remaining

**Mutation Strategy:**
- Save up 100 EP before triggering evolution
- Read stat effects carefully—every mutation has trade-offs
- Larger size = more attack/defense but slower movement
- More legs can increase speed but may reduce agility
- Wings and appendages provide mobility boosts

**Camera Controls:**
- Drag slowly for smooth rotation
- View your familiar from all angles to appreciate mutations
- The camera always stays at eye level for the best view

**Performance Tips:**
- Game automatically adjusts quality based on your device
- Close other browser tabs if experiencing lag
- Mobile users: Game targets 30fps for smooth performance

---

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
│   ├── api/         # API client layer
│   │   └── api-client.ts      # Centralized API communication with retry logic
│   ├── scene/       # Scene management
│   │   └── scene-manager.ts   # Three.js scene, camera, lighting
│   ├── creature/    # Creature rendering
│   │   ├── creature-renderer.ts    # Base creature with mutations
│   │   └── mutation-geometry.ts    # Mutation geometry generators
│   ├── rendering/   # Advanced rendering systems
│   │   ├── cell-geometry-generator.ts      # Voronoi cell-based geometry
│   │   ├── skeletal-frame-generator.ts     # Glowing skeletal frame structure
│   │   ├── plasma-shader-material.ts       # Custom GLSL plasma shaders
│   │   └── post-processing-manager.ts      # Bloom and post-effects
│   ├── biome/       # Biome environments
│   │   └── biome-renderer.ts       # Environmental rendering
│   ├── ui/          # HUD and UI components
│   │   ├── hud-drawer.ts           # Fighter jet-style HUD
│   │   ├── care-actions.ts         # Care action buttons
│   │   ├── mutation-choice.ts      # Mutation selection interface
│   │   ├── privacy-dialog.ts       # Privacy consent dialog
│   │   ├── notification-system.ts  # Toast notification system
│   │   ├── removal-warning.ts      # Removal warning overlay
│   │   ├── stat-feedback.ts        # Floating stat change displays
│   │   └── sound-settings.ts       # Sound volume controls
│   ├── audio/       # Audio system
│   │   └── sound-manager.ts        # Procedural sound generation
│   └── utils/       # Utilities
│       └── noise.ts                # Simplex noise for organic animation
├── server/          # Backend Express server
│   ├── index.ts     # Main server with API endpoints
│   └── core/        # Business logic
│       ├── familiar-manager.ts     # Familiar CRUD operations
│       ├── care-system.ts          # Care actions and decay
│       ├── mutation-engine.ts      # Mutation generation and application
│       ├── activity-tracker.ts     # Privacy-compliant activity tracking
│       ├── evolution-scheduler.ts  # Scheduled events (future)
│       └── group-manager.ts        # Group creature management (legacy)
└── shared/          # Shared types and constants
    ├── types/       # TypeScript interfaces
    │   └── api.ts                  # API request/response types
    └── constants/   # Redis keys and constants
        └── redis-keys.ts           # Redis key schema
```

## Technical Achievements

Re-GenX showcases several technical innovations in web-based 3D gaming:

**Advanced Organic Animation:**
- Multi-octave Simplex noise (3 octaves at 1x, 2x, 4x frequency) for truly organic motion
- Per-vertex animation with 96 segments on desktop for ultra-smooth surfaces
- Delta time-based animation ensures consistent speed across all devices

**Biological Cell-Based Geometry:**
- Voronoi tessellation using Fibonacci sphere algorithm for even cell distribution
- 30-50 cells on mobile, 80-100 cells on desktop for optimal performance
- Each cell has 5-8 irregular sides for natural, organic appearance
- Depth variation (0.1-0.3) creates realistic surface relief and texture
- Proper UV mapping and smooth vertex normals for realistic lighting
- Skeletal frame system with glowing cyan lines along cell boundaries
- Ready to replace standard sphere geometry for more biological look

**Robust Network Architecture:**
- Centralized APIClient with exponential backoff retry (1s, 2s, 4s delays)
- Automatic error recovery distinguishes between client errors (no retry) and server errors (retry)
- Redis persistence with 3-attempt retry logic and exponential backoff

**Performance Optimization:**
- Automatic device detection adjusts geometry complexity (48 vs 96 segments)
- FPS throttling maintains target frame rates (30fps mobile, 60fps desktop)
- Shadow mapping disabled on mobile for performance (2048x2048 on desktop)
- Adaptive pixel ratio (1.5x max on mobile, full on desktop)

**Real-Time Visual Feedback:**
- Floating numbers for stat changes with staggered timing
- Toast notification system with auto-dismiss and stacking
- Button pulse animations with glow effects
- Dynamic creature appearance based on care state

**Privacy-First Design:**
- Optional activity tracking with explicit opt-in
- Clear data usage explanation before consent
- Immediate data deletion on opt-out
- Only analyzes public posts, never private data

**Procedural Audio Generation:**
- All sounds generated in real-time using Web Audio API
- Zero external audio files reduces bandwidth and load times
- Oscillator-based synthesis with frequency modulation
- Exponential decay envelopes for natural sound fade-outs
- Stereo ambient sounds with independent left/right channels
- Seamless looping for continuous biome atmosphere

**Serverless Architecture:**
- Express server runs on Devvit's serverless platform
- Redis for all data persistence (no local storage)
- Cooldown timers with TTL for automatic expiration
- Scheduled jobs for decay and evolution cycles (future)

---

## License

MIT License - See LICENSE file for details

## Credits

Built with:
- [Devvit](https://developers.reddit.com/) - Reddit's developer platform
- [Three.js](https://threejs.org/) - 3D graphics library
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Vite](https://vitejs.dev/) - Build tool
