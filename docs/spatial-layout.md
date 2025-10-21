# Re-GenX Spatial Layout Guide

This document provides precise positioning information for all visual components in the Re-GenX application, including the 3D scene elements and UI overlays.

## 3D Scene Coordinate System

Re-GenX uses Three.js with a standard right-handed coordinate system:
- **X-axis**: Left (-) to Right (+)
- **Y-axis**: Down (-) to Up (+)
- **Z-axis**: Back (-) to Front (+)

**Units**: 1 unit ≈ 1 foot in the game world

---

## Core 3D Elements

### 1. Creature (Familiar)

**Position**: `(0, 1.2, 0)`
- **X**: 0 (centered)
- **Y**: 1.2 (4 feet above ground)
- **Z**: 0 (centered)

**Size**: Base radius of 1.5 units (4.5 feet diameter)

**Height Above Ground**: 
- **Happy state** (Care Meter > 50): 1.2 units (4 feet)
- **Neutral state** (Care Meter 20-50): 1.1 units (3.67 feet)
- **Sad state** (Care Meter < 20): 1.0 units (3.33 feet)

**Visual Characteristics**:
- Pulsating organic blob with procedural animation
- Semi-gloss platinum material (color: `0xe5e4e2`)
- Subtle warm glow (emissive: `0xaaaaaa`)
- Casts and receives shadows (desktop only)

**Mutations**: Attached as child objects to the base mesh, positioned relative to creature center

---

### 2. Ground Plane

**Position**: `(0, -0.5, 0)`
- **X**: 0 (centered)
- **Y**: -0.5 (1.5 feet below creature center, 2.7 feet below creature bottom)
- **Z**: 0 (centered)

**Size**: Circular, 5-unit radius (15-foot diameter)

**Rotation**: Horizontal (rotated -90° on X-axis)

**Material**: MeshPhongMaterial with biome-specific colors:
- **Jungle**: `0x2d5016` (dark green)
- **Rocky Mountain**: `0x5a5a5a` (gray)
- **Desert**: `0xc2b280` (sandy yellow)
- **Ocean**: `0x1a4d7a` (deep blue)
- **Cave**: `0x2a2a2a` (dark gray)

**Shadows**: Receives shadows (desktop only)

---

### 3. Environment Objects

All environment objects are positioned within the 5-foot radius visibility circle.

**Typical Placement**:
- **Distance from center**: 2.0 to 4.5 units (6-13.5 feet)
- **Y-position**: -0.5 to -0.3 units (ground level to slightly above)
- **Rotation**: Random Y-axis rotation for variety

**Object Counts** (LOD-based):
- **Desktop**: 8-12 objects per biome
- **Mobile**: 4-6 objects per biome

**Examples**:
- **Jungle plants**: Height 0.8 units, positioned at ground level (-0.5)
- **Rocks**: Height 0.3-0.7 units, positioned at -0.3
- **Cacti**: Height 0.8 units, positioned at -0.5
- **Stalactites**: Hang from above at Y: 3-5 units
- **Stalagmites**: Rise from ground, positioned at -0.5

---

### 4. Lighting

#### Spotlight (Primary Light Source)

**Position**: `(0, 12, 0)`
- **X**: 0 (directly above creature)
- **Y**: 12 (40 feet above ground)
- **Z**: 0 (centered)

**Target**: `(0, 0, 0)` (points straight down at origin)

**Properties**:
- **Intensity**: 15.0
- **Angle**: π/3 radians (60°)
- **Penumbra**: 0.3 (soft edge)
- **Decay**: 1.0
- **Distance**: 30 units
- **Color**: White (`0xffffff`)

**Shadow Settings** (desktop only):
- **Map size**: 2048x2048
- **Camera near**: 0.5
- **Camera far**: 25
- **Bias**: -0.001
- **Normal bias**: 0.02

#### Ambient Light (Fill Light)

**Properties**:
- **Intensity**: 0.2
- **Color**: Dark gray (`0x404040`)
- **Purpose**: Subtle fill to prevent complete darkness in shadows

---

### 5. Fog (Darkness Effect)

**Type**: THREE.Fog (linear fog)

**Settings**:
- **Color**: Black (`0x000000`)
- **Near**: 10 units (30 feet) - fog starts
- **Far**: 20 units (60 feet) - complete darkness

**Purpose**: Creates the "5ft visibility radius" effect by gradually darkening objects beyond the spotlight range

---

### 6. Camera

**Type**: PerspectiveCamera

**Position**: Orbits around creature at fixed radius
- **Radius**: 8 units (24 feet from center)
- **Height**: 1.2 units (4 feet above ground, level with creature)
- **Angle**: Variable (0 to 2π radians, user-controlled)

**Calculation**:
```
X = sin(angle) × 8
Y = 1.2
Z = cos(angle) × 8
```

**Look-at Target**: `(0, 0.5, 0)` (slightly below creature center to see ground)

**Properties**:
- **FOV**: 75°
- **Aspect**: window.innerWidth / window.innerHeight
- **Near**: 0.1
- **Far**: 100

**Interaction**: User can rotate 360° around creature by dragging/swiping

---

## UI Overlay Elements

All UI elements use CSS positioning and are overlaid on top of the 3D canvas.

### 7. HUD Overlay (Always Visible)

#### Top-Left Corner
**Position**: `top: 20px, left: 20px`

**Content**:
- **Age display**: Shows creature age in cycles
- **Font**: Orbitron, 14px
- **Color**: Neon green (`#00ff88`)

#### Top-Right Corner
**Position**: `top: 20px, right: 20px`

**Content**:
- **Next Cycle countdown**: Time until next evolution cycle
- **Care Meter**: Current care level (0-100)
- **Warning styling**: Red glow when < 20

#### Bottom-Left Corner
**Position**: `bottom: 20px, left: 20px`

**Content**:
- **Evolution Points (EP)**: Current EP balance
- **Updates**: Real-time after care actions

#### Bottom-Right Corner
**Position**: `bottom: 20px, right: 20px`

**Content**:
- **Neglect Warning**: "⚠️ NEEDS ATTENTION" (only visible when Care Meter < 20)
- **Animation**: Pulsing red glow

---

### 8. HUD Menu Toggle Button

**Position**: `top: 50%, left: 50%` (centered horizontally at top)
- **Transform**: `translateX(-50%)` to center
- **Margin-top**: 20px

**Size**: 
- **Width**: Auto (fits content)
- **Height**: 40px
- **Padding**: 12px 24px

**Appearance**:
- **Background**: Semi-transparent dark (`rgba(20, 20, 30, 0.9)`)
- **Border**: 2px neon green (`rgba(0, 255, 136, 0.5)`)
- **Text**: "▼ MENU" or "▲ CLOSE"
- **Font**: Orbitron, 14px

**States**:
- **Closed**: Shows "▼ MENU"
- **Open**: Shows "▲ CLOSE"

---

### 9. HUD Menu Panel (Dropdown)

**Position**: Slides down from top when opened
- **Top**: 0 (when visible)
- **Left**: 0
- **Right**: 0
- **Transform**: `translateY(-100%)` when hidden, `translateY(0)` when visible

**Size**:
- **Width**: 100% of viewport
- **Max-width**: 800px (centered on large screens)
- **Height**: Auto (fits content, max 70vh with scroll)

**Layout** (vertical sections):

1. **Care Actions Section** (top)
   - Contains 3 care action buttons (Feed, Play, Attention)
   - Buttons arranged horizontally on desktop, vertically on mobile

2. **Care Status Section** (middle)
   - Care Meter detail
   - Evolution Points detail
   - Next Evolution countdown

3. **Familiar Stats Section** (bottom)
   - 5 stat categories (Mobility, Senses, Survival, Cognition, Vitals)
   - Each with 3 stats displayed as horizontal bars
   - Color-coded stat changes (green +, red -)

**Appearance**:
- **Background**: Semi-transparent dark (`rgba(20, 20, 30, 0.95)`)
- **Border**: 2px neon green at bottom
- **Padding**: 30px
- **Backdrop-filter**: Blur(10px) for glassmorphism effect

---

### 10. Care Action Buttons

**Location**: Inside HUD Menu Panel, Care Actions Section

**Layout**: 3 buttons in a row (desktop) or column (mobile)

**Individual Button Size**:
- **Width**: 180px (desktop), 100% (mobile)
- **Height**: 100px
- **Margin**: 10px between buttons

**Position within container**: Centered, flex layout

**Button Structure**:
```
┌─────────────────┐
│      🍖         │  Icon (32px)
│     Feed        │  Label (16px)
│ +15 Care, +10EP │  Reward (12px)
└─────────────────┘
```

**States**:
- **Normal**: Neon green border, semi-transparent background
- **Hover**: Brighter glow, scale 1.05
- **Cooldown**: Disabled, shows countdown timer
- **Loading**: Spinning animation

**Cooldown Display**: Timer replaces label text (e.g., "4:32")

---

### 11. Mutation Choice UI

**Position**: Fixed, centered on screen
- **Top**: 50%
- **Left**: 50%
- **Transform**: `translate(-50%, -50%)`

**Size**:
- **Width**: 90vw (max 600px)
- **Height**: Auto

**Components**:

#### Evolve Button (when panel closed)
**Position**: `bottom: 30px, right: 30px`
- **Size**: 180px × 60px
- **Appearance**: Prominent neon green with pulsing glow
- **Text**: "⚡ Evolve" + "100 EP" cost

#### Trait Options Panel (when open)
**Layout**: 3-5 option cards in a grid
- **Card size**: 150px × 200px
- **Grid**: 2-3 columns depending on screen size
- **Spacing**: 20px gap between cards

**Card Structure**:
```
┌──────────────┐
│   Preview    │  Icon/visual
│   Category   │  Trait type
│    Value     │  Trait value
│   [Select]   │  Button
└──────────────┘
```

---

### 12. Notification System

**Position**: `top: 80px, left: 50%`
- **Transform**: `translateX(-50%)` to center
- **Z-index**: 9999 (always on top)

**Size**:
- **Width**: Auto (fits content, max 400px)
- **Height**: Auto
- **Padding**: 20px

**Animation**: Slides down from top, auto-dismisses after 5 seconds

**Types**:
- **Mutation notification**: Shows new trait + stat changes
- **Care meter warning**: Red alert when < 20
- **Error notification**: Red border, error icon

---

### 13. Removal Warning Dialog

**Position**: Fixed, centered on screen
- **Top**: 50%
- **Left**: 50%
- **Transform**: `translate(-50%, -50%)`

**Size**:
- **Width**: 90vw (max 500px)
- **Height**: Auto
- **Padding**: 40px

**Appearance**:
- **Background**: Dark with red border (danger theme)
- **Icon**: 💔 (large, 64px)
- **Countdown**: Large red text showing hours remaining
- **Buttons**: "Care Now" (green) and "Dismiss" (gray)

**Backdrop**: Semi-transparent black overlay (`rgba(0, 0, 0, 0.8)`)

---

### 14. Privacy Dialog

**Position**: Fixed, centered on screen
- **Top**: 50%
- **Left**: 50%
- **Transform**: `translate(-50%, -50%)`

**Size**:
- **Width**: 90vw (max 600px)
- **Height**: Auto
- **Padding**: 40px

**Appearance**:
- **Background**: Dark with neon green border
- **Title**: "Privacy & Personality Reflection"
- **Content**: Explanation text + two buttons
- **Buttons**: "Opt In" (green) and "No Thanks" (gray)

**Backdrop**: Semi-transparent black overlay

---

### 15. Sound Settings Panel

**Position**: `top: 20px, right: 20px`

**Toggle Button**:
- **Size**: 50px × 50px (circular)
- **Icon**: 🔊 or 🔇
- **Appearance**: Neon green border, semi-transparent background

**Settings Panel** (when open):
- **Position**: `top: 70px, right: 20px` (below toggle)
- **Size**: 300px × auto
- **Padding**: 20px

**Controls**:
1. **Master Volume slider**: 0-100%
2. **Ambient Volume slider**: 0-100%
3. **Enable checkbox**: On/off toggle

**Animation**: Slides down from toggle button

---

## Mobile Adjustments

### Screen Size Breakpoint: 768px

**Changes for mobile devices**:

1. **HUD corners**: Reduced padding (10px instead of 20px)
2. **Font sizes**: Slightly smaller (12px instead of 14px)
3. **Care action buttons**: Stacked vertically instead of horizontal
4. **Menu panel**: Full width, no max-width constraint
5. **Mutation cards**: Single column layout
6. **Touch targets**: Minimum 44px × 44px for accessibility
7. **Sound settings**: Smaller toggle (44px × 44px)

---

## Z-Index Hierarchy

Layering order from back to front:

1. **3D Canvas**: z-index: 0 (base layer)
2. **HUD Overlay**: z-index: 1000
3. **HUD Menu Panel**: z-index: 1001
4. **Care Action Buttons**: z-index: 1002
5. **Mutation Choice UI**: z-index: 5000
6. **Notifications**: z-index: 9999
7. **Dialogs** (Privacy, Removal): z-index: 10000
8. **Sound Settings**: z-index: 9999

---

## Visibility Radius Visualization

The "5ft visibility radius" is achieved through multiple techniques:

1. **Spotlight**: Illuminates 5-unit radius circle
2. **Fog**: Gradually darkens beyond 10 units (30 feet)
3. **Ground plane**: Only 5-unit radius is visible
4. **Environment objects**: Placed within 4.5-unit radius

**Visual Effect**: 
- **0-5 units**: Fully lit and visible
- **5-10 units**: Gradual fade to darkness (fog transition)
- **10+ units**: Complete darkness

---

## Performance Considerations

### LOD (Level of Detail) System

**Desktop** (High Quality):
- Creature geometry: 96 segments
- Environment objects: 8-12 per biome
- Shadows: Enabled (2048×2048 shadow map)
- Antialiasing: Enabled

**Mobile** (Low Quality):
- Creature geometry: 48 segments
- Environment objects: 4-6 per biome
- Shadows: Disabled
- Antialiasing: Disabled
- Pixel ratio: Capped at 1.5

---

## Coordinate Reference Examples

### Common Positions

```typescript
// Creature center
const creatureCenter = new THREE.Vector3(0, 1.2, 0);

// Ground center
const groundCenter = new THREE.Vector3(0, -0.5, 0);

// Spotlight position
const lightPosition = new THREE.Vector3(0, 12, 0);

// Camera orbit (example at 0° angle)
const cameraPosition = new THREE.Vector3(0, 1.2, 8);

// Environment object (example)
const plantPosition = new THREE.Vector3(3, -0.5, 2);
```

### Distance Calculations

```typescript
// Distance from creature to camera
const cameraDistance = 8; // units (24 feet)

// Creature height above ground
const creatureHeight = 1.2 - (-0.5) = 1.7; // units (5.1 feet)

// Visibility radius
const visibilityRadius = 5; // units (15 feet)

// Fog start distance
const fogStart = 10; // units (30 feet)
```

---

## Summary Diagram

```
                    Spotlight (0, 12, 0)
                         ↓
                         ●
                         |
                         |
    Camera ●────────────●────────────● Camera
    (-8, 1.2, 0)   Creature      (8, 1.2, 0)
                   (0, 1.2, 0)
                         |
                         |
    ═══════════════════════════════════
         Ground Plane (0, -0.5, 0)
              5-unit radius circle
```

**Vertical Stack** (Y-axis):
- Spotlight: 12.0
- Stalactites: 3.0 - 5.0
- Creature: 1.2
- Camera: 1.2
- Environment objects: -0.5 to -0.3
- Ground: -0.5

**Horizontal Spread** (X/Z plane):
- Creature: Origin (0, 0)
- Camera: 8-unit radius orbit
- Environment: 2.0 - 4.5 unit radius
- Ground: 5-unit radius
- Visibility: ~5-unit effective radius (fog effect)

---

## Notes for Adjustments

When making spatial adjustments, consider:

1. **Creature visibility**: Keep creature centered and at eye level
2. **Shadow alignment**: Ensure spotlight is directly above for proper shadows
3. **Camera distance**: 8 units provides good view without distortion
4. **Ground clearance**: Maintain 1.7-unit gap between creature and ground
5. **UI overlap**: Ensure 3D elements don't clip through UI overlays
6. **Mobile spacing**: Increase touch target sizes and reduce density
7. **Fog balance**: Adjust fog near/far to maintain visibility radius feel

---

## File References

- **Scene setup**: `src/client/scene/scene-manager.ts`
- **Creature positioning**: `src/client/creature/creature-renderer.ts`
- **Ground/environment**: `src/client/biome/biome-renderer.ts`
- **HUD layout**: `src/client/ui/hud-drawer.ts`
- **Care buttons**: `src/client/ui/care-actions.ts`
- **CSS styling**: `src/client/index.css`
