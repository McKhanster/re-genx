# Visual Enhancement Design Document

## Overview

This design document outlines the technical approach for transforming Re-GenX's creature rendering into a bioluminescent plasma ball aesthetic with glowing neon edges, organic cell patterns, animated plasma colors, and a cosmic atmosphere. The implementation will leverage Three.js post-processing effects, custom shaders, and procedural geometry generation while maintaining 30fps on mobile devices.

## Research Findings

### Three.js Post-Processing Stack

**EffectComposer** (three/examples/jsm/postprocessing/EffectComposer)
- Manages rendering pipeline with multiple post-processing passes
- Required for bloom, glow, and other screen-space effects
- Mobile optimization: Reduce render target resolution by 50%

**UnrealBloomPass** (three/examples/jsm/postprocessing/UnrealBloomPass)
- Industry-standard bloom effect for glowing edges
- Parameters: strength (1.5-2.5), radius (0.4-0.8), threshold (0.1-0.3)
- Mobile: Reduce bloom resolution and sample count

**RenderPass** (three/examples/jsm/postprocessing/RenderPass)
- Base scene render before post-processing
- No performance impact, required for EffectComposer

### Shader Techniques

**Fresnel Effect for Edge Glow**
```glsl
// Vertex shader calculates view direction
vViewDirection = normalize(cameraPosition - worldPosition);
vNormal = normalize(normalMatrix * normal);

// Fragment shader creates edge glow
float fresnel = pow(1.0 - dot(vViewDirection, vNormal), 3.0);
gl_FragColor.rgb += emissiveColor * fresnel * glowIntensity;
```

**Voronoi Noise for Cell Patterns**
- Use 3D Voronoi noise to generate organic cell boundaries
- Calculate distance to nearest cell center for edge detection
- Animate cell centers over time for subtle movement
- Library: Can implement custom or use noise functions from `three/examples/jsm/math/SimplexNoise`

**Plasma Color Animation**
```glsl
// Multi-frequency sine waves for plasma effect
vec3 plasma = vec3(
  sin(uv.x * 3.0 + time * 0.5) * 0.5 + 0.5,
  sin(uv.y * 4.0 + time * 0.3) * 0.5 + 0.5,
  sin((uv.x + uv.y) * 2.0 + time * 0.7) * 0.5 + 0.5
);
// Map to cyan-magenta-purple palette
vec3 color = mix(cyan, magenta, plasma.r) * plasma.g + purple * plasma.b;
```

### Geometry Generation

**Voronoi Sphere for Cell Pattern**
- Generate random points on sphere surface (50-100 points)
- Use Voronoi tessellation to create cell polygons
- Extrude cell boundaries inward for depth
- Library: Custom implementation or adapt from computational geometry libraries

**Subsurface Scattering Approximation**
- Use `MeshPhysicalMaterial` with `transmission` and `thickness` properties
- Alternative: Custom shader with back-face lighting calculation
- Mobile: Use simpler translucency approximation with opacity

### Performance Optimization Strategies

**Adaptive Quality System**
- Monitor frame time using `performance.now()`
- Disable effects in priority order when FPS drops below 30
- Re-enable effects when performance recovers above 35 FPS for 5 seconds
- Priority order: foreground parallax → plasma animation → bloom intensity → star count

**Mobile-Specific Optimizations**
- Reduce post-processing render target resolution to 50%
- Limit bloom samples to 3-5 (vs 8-10 on desktop)
- Use lower-poly cell geometry (30-50 cells vs 80-100)
- Disable subsurface scattering, use simple opacity instead
- Reduce star particle count to 500 (vs 1500 on desktop)

## Architecture

### Component Structure

```
SceneManager (existing)
├── Post-Processing Pipeline (new)
│   ├── EffectComposer
│   ├── RenderPass
│   └── UnrealBloomPass
├── CreatureRenderer (enhanced)
│   ├── Cell Geometry Generator
│   ├── Plasma Shader Material
│   └── Performance Monitor
└── BiomeRenderer (enhanced)
    ├── Background Gradient
    └── Foreground Silhouettes
```

### Data Flow

1. **Initialization**: SceneManager creates EffectComposer with RenderPass and UnrealBloomPass
2. **Geometry Generation**: CreatureRenderer generates Voronoi cell geometry on startup
3. **Material Setup**: Custom ShaderMaterial with Fresnel, Voronoi, and plasma effects
4. **Background Setup**: BackgroundGradientRenderer and ForegroundRenderer initialize
5. **Animation Loop**: 
   - Update shader uniforms (time, colors)
   - Update foreground parallax
   - Render scene through EffectComposer
   - Monitor performance and adjust quality
6. **Quality Adaptation**: Performance monitor adjusts effect complexity based on frame time

## Components and Interfaces

### 1. PostProcessingManager

**Purpose**: Manages the post-processing pipeline with bloom and other effects

**Interface**:
```typescript
class PostProcessingManager {
  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    isMobile: boolean
  );
  
  // Render scene with post-processing
  render(): void;
  
  // Adjust bloom intensity (0-3)
  setBloomIntensity(intensity: number): void;
  
  // Enable/disable bloom effect
  setBloomEnabled(enabled: boolean): void;
  
  // Handle window resize
  resize(width: number, height: number): void;
  
  // Cleanup
  dispose(): void;
}
```

**Properties**:
- `composer: EffectComposer` - Main post-processing composer
- `bloomPass: UnrealBloomPass` - Bloom effect pass
- `renderPass: RenderPass` - Base scene render
- `isMobile: boolean` - Device type flag

**Implementation Details**:
- Desktop: Full resolution render targets, bloom strength 2.0
- Mobile: Half resolution render targets, bloom strength 1.5
- Bloom parameters: radius 0.6, threshold 0.2

### 2. CellGeometryGenerator

**Purpose**: Generates Voronoi-based cell pattern geometry for creature surface

**Interface**:
```typescript
class CellGeometryGenerator {
  // Generate cell geometry with specified detail level
  static generateCellGeometry(
    baseRadius: number,
    cellCount: number,
    depthVariation: number
  ): THREE.BufferGeometry;
  
  // Generate Voronoi points on sphere
  private static generateVoronoiPoints(
    count: number,
    radius: number
  ): THREE.Vector3[];
  
  // Create cell polygons from Voronoi tessellation
  private static createCellPolygons(
    points: THREE.Vector3[],
    radius: number
  ): CellPolygon[];
  
  // Convert cell polygons to Three.js geometry
  private static polygonsToGeometry(
    polygons: CellPolygon[],
    depthVariation: number
  ): THREE.BufferGeometry;
}

interface CellPolygon {
  center: THREE.Vector3;
  vertices: THREE.Vector3[];
  edges: [THREE.Vector3, THREE.Vector3][];
}
```

**Implementation Details**:
- Desktop: 80-100 cells, depth variation 0.2-0.3
- Mobile: 30-50 cells, depth variation 0.15-0.25
- Use spherical Voronoi algorithm for even distribution
- Store cell edge information for glow rendering

### 3. PlasmaShaderMaterial

**Purpose**: Custom shader material with Fresnel glow, cell edges, and animated plasma colors

**Interface**:
```typescript
class PlasmaShaderMaterial extends THREE.ShaderMaterial {
  constructor(options: PlasmaShaderOptions);
  
  // Update animation time
  updateTime(deltaTime: number): void;
  
  // Set plasma color palette
  setColorPalette(colors: THREE.Color[]): void;
  
  // Set glow intensity
  setGlowIntensity(intensity: number): void;
  
  // Enable/disable plasma animation
  setPlasmaEnabled(enabled: boolean): void;
}

interface PlasmaShaderOptions {
  baseColor: THREE.Color;
  glowColor: THREE.Color;
  glowIntensity: number;
  plasmaSpeed: number;
  cellEdgeWidth: number;
  cellEdgeGlow: number;
  opacity: number;
}
```

**Shader Uniforms**:
```glsl
uniform float uTime;
uniform vec3 uBaseColor;
uniform vec3 uGlowColor;
uniform float uGlowIntensity;
uniform float uPlasmaSpeed;
uniform float uCellEdgeWidth;
uniform float uCellEdgeGlow;
uniform float uOpacity;
uniform vec3 uColorPalette[4]; // Cyan, magenta, purple, teal
```

**Shader Features**:
- Fresnel effect for edge glow
- Voronoi noise for cell pattern detection
- Multi-frequency plasma color animation
- Subsurface scattering approximation (desktop only)
- Emissive cell edges with bloom



### 4. BackgroundGradientRenderer

**Purpose**: Renders atmospheric gradient background

**Interface**:
```typescript
class BackgroundGradientRenderer {
  constructor(scene: THREE.Scene);
  
  // Update gradient colors
  setGradientColors(topColor: THREE.Color, bottomColor: THREE.Color): void;
  
  // Cleanup
  dispose(): void;
}
```

**Implementation Details**:
- Use large sphere mesh with inverted normals
- Custom shader with vertical gradient
- Top color: RGB(10, 15, 30) - dark blue
- Bottom color: RGB(60, 20, 40) - dark purple-red
- Radius: 300 units (far behind everything)
- Disable depth write to render behind all objects

### 5. ForegroundRenderer

**Purpose**: Renders silhouette elements in foreground with parallax

**Interface**:
```typescript
class ForegroundRenderer {
  constructor(scene: THREE.Scene, camera: THREE.Camera, isMobile: boolean);
  
  // Update parallax based on camera rotation
  updateParallax(cameraAngle: number): void;
  
  // Enable/disable foreground (for performance)
  setEnabled(enabled: boolean): void;
  
  // Cleanup
  dispose(): void;
}
```

**Implementation Details**:
- Create abstract organic shapes at bottom of viewport
- Use dark base color with cyan-magenta edge highlights
- Position at camera near plane (z = -0.5)
- Apply parallax: rotate opposite to camera at 0.4x speed
- Opacity: 0.4 to maintain creature visibility
- Desktop only feature (disabled on mobile by default)

### 6. PerformanceMonitor

**Purpose**: Monitors frame rate and adaptively adjusts quality

**Interface**:
```typescript
class PerformanceMonitor {
  constructor(targetFPS: number);
  
  // Update with current frame time
  update(deltaTime: number): void;
  
  // Get current quality level (0-1)
  getQualityLevel(): number;
  
  // Check if specific effect should be enabled
  shouldEnableEffect(effectName: EffectName): boolean;
  
  // Get recommended effect settings
  getEffectSettings(): EffectSettings;
}

type EffectName = 
  | 'foregroundParallax'
  | 'plasmaAnimation'
  | 'bloomIntensity';

interface EffectSettings {
  bloomIntensity: number;
  plasmaSpeed: number;
  foregroundEnabled: boolean;
}
```

**Implementation Details**:
- Measure frame time every 60 frames (1 second at 60fps)
- Calculate rolling average over last 5 measurements
- Disable effects when FPS < 30 in priority order
- Re-enable effects when FPS > 35 for 5 consecutive seconds
- Priority order (first to disable):
  1. Foreground parallax
  2. Plasma animation
  3. Bloom intensity (reduce by 50%)

## Data Models

### CellGeometry

```typescript
interface CellGeometry {
  geometry: THREE.BufferGeometry;
  cellCenters: THREE.Vector3[];
  cellEdges: CellEdge[];
  cellCount: number;
}

interface CellEdge {
  start: THREE.Vector3;
  end: THREE.Vector3;
  normal: THREE.Vector3;
}
```

### PerformanceMetrics

```typescript
interface PerformanceMetrics {
  currentFPS: number;
  averageFPS: number;
  frameTime: number;
  qualityLevel: number; // 0-1
  enabledEffects: Set<EffectName>;
  lastAdjustmentTime: number;
}
```

### ShaderUniforms

```typescript
interface PlasmaUniforms {
  uTime: { value: number };
  uBaseColor: { value: THREE.Color };
  uGlowColor: { value: THREE.Color };
  uGlowIntensity: { value: number };
  uPlasmaSpeed: { value: number };
  uCellEdgeWidth: { value: number };
  uCellEdgeGlow: { value: number };
  uOpacity: { value: number };
  uColorPalette: { value: THREE.Color[] };
}
```

## Integration with Existing System

### CreatureRenderer Enhancements

**Current State**:
- Uses `THREE.SphereGeometry` with noise-based deformation
- `MeshPhongMaterial` with emissive properties
- Vertex animation for pulsation

**Enhancements**:
1. Replace sphere geometry with Voronoi cell geometry
2. Replace `MeshPhongMaterial` with `PlasmaShaderMaterial`
3. Keep existing pulsation animation (compatible with new geometry)
4. Keep existing mutation system (mutations attach to cell geometry)
5. Add performance monitoring integration

**Modified Methods**:
```typescript
// In CreatureRenderer
private createBaseMesh(): {
  geometry: THREE.BufferGeometry; // Changed from SphereGeometry
  material: PlasmaShaderMaterial; // Changed from MeshPhongMaterial
  mesh: THREE.Mesh;
}

public pulsate(deltaTime: number): void {
  // Existing vertex animation code
  // Add: Update shader time uniform
  this.baseMaterial.updateTime(deltaTime);
}
```

### SceneManager Enhancements

**Current State**:
- Direct rendering with `renderer.render(scene, camera)`
- Spotlight and ambient lighting
- Fog for darkness effect

**Enhancements**:
1. Add `PostProcessingManager` for bloom effects
2. Replace direct render with `postProcessing.render()`
3. Add `BackgroundGradientRenderer` for atmosphere
4. Add `ForegroundRenderer` for composition
5. Add `PerformanceMonitor` for adaptive quality
6. Keep existing lighting (spotlight creates nice highlights on cells)
7. Keep fog (creates depth and atmosphere)

**Modified Methods**:
```typescript
// In SceneManager
constructor(canvas: HTMLCanvasElement) {
  // Existing initialization
  // Add:
  this.postProcessing = new PostProcessingManager(
    this.renderer,
    this.scene,
    this.camera,
    this.mobile
  );
  this.backgroundGradient = new BackgroundGradientRenderer(this.scene);
  this.foreground = new ForegroundRenderer(
    this.scene,
    this.camera,
    this.mobile
  );
  this.performanceMonitor = new PerformanceMonitor(this.targetFPS);
}

public render(): void {
  // Replace: this.renderer.render(this.scene, this.camera);
  // With: this.postProcessing.render();
}

public update(deltaTime: number): void {
  // New method for animation updates
  this.foreground.updateParallax(this.cameraAngle);
  this.performanceMonitor.update(deltaTime);
  
  // Apply performance-based adjustments
  const settings = this.performanceMonitor.getEffectSettings();
  this.postProcessing.setBloomIntensity(settings.bloomIntensity);
  this.foreground.setEnabled(settings.foregroundEnabled);
}
```

### BiomeRenderer Integration

**Current State**:
- Renders ground plane and environment

**Enhancements**:
1. Integrate `BackgroundGradientRenderer` for atmosphere
2. Keep existing ground plane (provides depth reference)
3. Adjust ground plane material to complement new aesthetic

**Modified Approach**:
```typescript
// In BiomeRenderer
constructor(scene: THREE.Scene, isMobile: boolean) {
  // Existing ground plane code
  // Add:
  this.backgroundGradient = new BackgroundGradientRenderer(scene);
}
```

## Error Handling

### Shader Compilation Errors

**Detection**:
```typescript
const material = new PlasmaShaderMaterial(options);
if (!material.program || material.program.diagnostics?.fragmentShader?.log) {
  console.error('Shader compilation failed:', material.program.diagnostics);
  // Fallback to MeshPhongMaterial
}
```

**Fallback Strategy**:
- If custom shader fails, use enhanced `MeshPhongMaterial` with high emissive
- Log error to console for debugging
- Disable plasma effects but keep bloom

### Post-Processing Initialization Errors

**Detection**:
```typescript
try {
  this.composer = new EffectComposer(renderer);
  this.composer.addPass(renderPass);
  this.composer.addPass(bloomPass);
} catch (error) {
  console.error('Post-processing initialization failed:', error);
  this.fallbackToDirectRender = true;
}
```

**Fallback Strategy**:
- If EffectComposer fails, fall back to direct rendering
- Increase material emissive intensity to compensate for missing bloom
- Log warning to user about reduced visual quality

### Performance Degradation

**Detection**:
```typescript
if (this.performanceMonitor.getQualityLevel() < 0.3) {
  console.warn('Performance critically low, disabling advanced effects');
}
```

**Mitigation**:
- Automatically disable effects in priority order
- Show optional notification to user about reduced quality
- Provide manual quality settings in UI (future enhancement)

### WebGL Context Loss

**Detection**:
```typescript
renderer.domElement.addEventListener('webglcontextlost', (event) => {
  event.preventDefault();
  console.error('WebGL context lost');
});

renderer.domElement.addEventListener('webglcontextrestored', () => {
  console.log('WebGL context restored, reinitializing');
  this.reinitialize();
});
```

**Recovery**:
- Prevent default context loss behavior
- Reinitialize all renderers and materials on context restore
- Reload creature state from last known good state

## Testing Strategy

### Visual Regression Testing

**Approach**: Manual visual inspection with reference images

**Test Cases**:
1. Creature appearance matches reference aesthetic
   - Glowing neon edges visible from all angles
   - Cell patterns clearly defined
   - Plasma colors animate smoothly
   - Inner glow creates translucent effect

2. Background and atmosphere
   - Gradient transitions smoothly from dark blue to purple-red
   - Foreground elements frame composition

3. Lighting and effects
   - Spotlight creates dramatic highlights on cells
   - Bloom effect enhances glow without washing out details
   - Fog creates atmospheric depth

**Validation Method**:
- Side-by-side comparison with reference image
- Test on multiple devices (desktop, mobile)
- Verify at different camera angles

### Performance Testing

**Metrics to Measure**:
- Frame rate (target: 60fps desktop, 30fps mobile)
- Frame time (target: <16.67ms desktop, <33.33ms mobile)
- Memory usage (monitor for leaks)
- GPU utilization

**Test Scenarios**:
1. Idle creature (no mutations)
2. Creature with 5 mutations
3. Creature with 10 mutations
4. During mutation animation
5. During care action animation
6. Camera rotation at various speeds

**Performance Targets**:
- Desktop: Maintain 60fps with all effects enabled
- Mobile: Maintain 30fps with adaptive quality
- No frame drops during animations
- Memory stable over 5 minutes

**Testing Tools**:
- Chrome DevTools Performance tab
- Three.js Stats.js for real-time FPS monitoring
- Manual frame time logging

### Shader Testing

**Unit Tests**: Not applicable (visual shaders)

**Integration Tests**:
1. Shader compiles without errors
2. Uniforms update correctly
3. Material responds to lighting
4. Transparency renders correctly
5. Bloom effect highlights emissive areas

**Test Method**:
- Console log shader compilation status
- Visual inspection of each shader feature
- Test with different uniform values
- Verify depth sorting with transparency

### Cross-Device Testing

**Devices to Test**:
- Desktop: Chrome, Firefox, Safari (macOS/Windows)
- Mobile: iOS Safari, Chrome Android
- Tablets: iPad, Android tablet

**Test Cases**:
1. Visual quality matches expectations for device class
2. Performance meets targets (60fps desktop, 30fps mobile)
3. Touch controls work properly (existing functionality)
4. No rendering artifacts or glitches
5. Adaptive quality system functions correctly

**Known Limitations**:
- Mobile: Reduced cell count, no foreground, lower bloom quality
- Older devices: May require manual quality reduction
- Safari: May have shader compatibility issues (test thoroughly)

### Mutation Compatibility Testing

**Test Cases**:
1. Mutations attach correctly to cell geometry
2. Mutation animations work with new material
3. Multiple mutations render without z-fighting
4. Mutation removal doesn't break cell geometry
5. Stat feedback displays correctly with new visuals

**Validation**:
- Apply each mutation type individually
- Apply multiple mutations simultaneously
- Remove mutations in various orders
- Verify visual consistency

## Implementation Notes

### Shader Development Workflow

1. Start with simple shader (Fresnel glow only)
2. Test compilation and rendering
3. Add cell pattern detection
4. Add plasma color animation
5. Add subsurface scattering (desktop)
6. Optimize for mobile

### Performance Optimization Priority

1. **First**: Ensure 30fps on mobile with basic effects
2. **Second**: Add advanced effects for desktop
3. **Third**: Implement adaptive quality system
4. **Fourth**: Fine-tune visual quality

### Incremental Development

**Phase 1**: Post-processing and bloom
- Add EffectComposer and UnrealBloomPass
- Test performance impact
- Adjust bloom parameters

**Phase 2**: Cell geometry
- Implement Voronoi sphere generation
- Replace existing sphere geometry
- Verify mutation compatibility

**Phase 3**: Plasma shader
- Implement custom ShaderMaterial
- Add Fresnel glow
- Add cell edge detection
- Add plasma color animation

**Phase 4**: Background enhancements
- Add starfield renderer
- Add gradient background
- Add foreground elements

**Phase 5**: Performance optimization
- Implement performance monitor
- Add adaptive quality system
- Test on mobile devices
- Fine-tune thresholds

### Code Organization

```
src/client/
├── rendering/
│   ├── post-processing-manager.ts
│   ├── plasma-shader-material.ts
│   └── cell-geometry-generator.ts
├── effects/
│   ├── background-gradient-renderer.ts
│   └── foreground-renderer.ts
├── utils/
│   └── performance-monitor.ts
└── shaders/
    ├── plasma-vertex.glsl
    ├── plasma-fragment.glsl
    ├── gradient-vertex.glsl
    └── gradient-fragment.glsl
```

## Dependencies

### Required Three.js Modules

```typescript
// Post-processing
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

// Utilities
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise';
```

### No Additional npm Packages Required

All functionality can be implemented using Three.js core and examples modules, which are already included in the project.

## Mobile Optimization Summary

| Feature | Desktop | Mobile |
|---------|---------|--------|
| Cell Count | 80-100 | 30-50 |
| Bloom Resolution | Full | Half |
| Bloom Samples | 8-10 | 3-5 |
| Subsurface Scattering | Yes | No (opacity only) |
| Foreground Parallax | Yes | No |
| Plasma Animation | Full speed | Half speed |
| Shadow Quality | High (2048) | Disabled |
| Antialiasing | Yes | No |

## Success Criteria

1. **Visual Quality**: Creature appearance closely matches reference image aesthetic
2. **Performance**: Maintains target FPS on both desktop (60) and mobile (30)
3. **Compatibility**: Works on all major browsers and devices
4. **Stability**: No crashes, memory leaks, or rendering artifacts
5. **Integration**: Existing features (mutations, care actions) work seamlessly
6. **Adaptability**: Quality system responds appropriately to performance changes
