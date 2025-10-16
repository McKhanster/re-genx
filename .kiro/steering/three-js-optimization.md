---
inclusion: fileMatch
fileMatchPattern: 'src/client/**/*.ts'
---

# Three.js Optimization for Re-GenX

This steering file provides Three.js-specific optimization guidance for the Re-GenX creature evolution game.

## Performance Targets

- **Desktop**: 60fps minimum
- **Mobile**: 30fps minimum
- **Max draw calls**: Keep under 50
- **Max triangles**: 100k on desktop, 50k on mobile

## Geometry Optimization

### Use Geometry Pooling

```typescript
// Reuse geometries instead of creating new ones
class GeometryPool {
  private pools: Map<string, THREE.BufferGeometry[]> = new Map();

  acquire(type: string): THREE.BufferGeometry {
    const pool = this.pools.get(type) || [];
    return pool.pop() || this.createGeometry(type);
  }

  release(type: string, geometry: THREE.BufferGeometry): void {
    const pool = this.pools.get(type) || [];
    pool.push(geometry);
    this.pools.set(type, pool);
  }
}
```

### Merge Geometries When Possible

```typescript
// Combine multiple mutation geometries into one mesh
const mergedGeometry = BufferGeometryUtils.mergeGeometries([
  legGeometry,
  spikeGeometry,
  wingGeometry,
]);
```

### Use LOD (Level of Detail)

```typescript
// Reduce complexity on mobile
const highDetail = new THREE.SphereGeometry(1, 64, 64);
const lowDetail = new THREE.SphereGeometry(1, 32, 32);

const geometry = isMobile() ? lowDetail : highDetail;
```

## Material Optimization

### Share Materials

```typescript
// Create materials once, reuse across meshes
const sharedMaterial = new THREE.MeshStandardMaterial({
  color: 0x00ff00,
  metalness: 0.5,
  roughness: 0.5,
});

// Use for multiple meshes
mesh1.material = sharedMaterial;
mesh2.material = sharedMaterial;
```

### Limit Material Complexity

```typescript
// Avoid expensive materials on mobile
const material = isMobile()
  ? new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  : new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      metalness: 0.5,
      roughness: 0.5,
      envMap: envTexture,
    });
```

## Lighting Optimization

### Minimize Light Count

```typescript
// Re-GenX uses ONE spotlight - keep it that way
const spotlight = new THREE.SpotLight(0xffffff, 1);
spotlight.position.set(0, 10, 0);
spotlight.target = creature;

// Add ambient for fill, not additional spotlights
const ambient = new THREE.AmbientLight(0x404040, 0.2);
```

### Disable Shadows on Mobile

```typescript
if (!isMobile()) {
  spotlight.castShadow = true;
  spotlight.shadow.mapSize.width = 1024;
  spotlight.shadow.mapSize.height = 1024;
}
```

## Particle System Optimization

### Reduce Particle Count on Mobile

```typescript
const particleCount = isMobile() ? 500 : 2000;

const particles = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);
// ... populate positions
```

### Use Point Sprites

```typescript
// More efficient than individual meshes
const particleMaterial = new THREE.PointsMaterial({
  size: 0.05,
  map: particleTexture,
  transparent: true,
  alphaTest: 0.5,
  depthWrite: false,
});

const particleSystem = new THREE.Points(particles, particleMaterial);
```

## Animation Optimization

### Use RequestAnimationFrame Properly

```typescript
class SceneManager {
  private lastTime = 0;

  animate(currentTime: number): void {
    requestAnimationFrame((t) => this.animate(t));

    const delta = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // Update with delta time
    this.updateCreature(delta);
    this.renderer.render(this.scene, this.camera);
  }
}
```

### Throttle Non-Critical Updates

```typescript
// Don't update HUD every frame
let hudUpdateTimer = 0;
const HUD_UPDATE_INTERVAL = 0.1; // 100ms

function update(delta: number): void {
  hudUpdateTimer += delta;

  if (hudUpdateTimer >= HUD_UPDATE_INTERVAL) {
    hud.updateStats(creature.stats);
    hudUpdateTimer = 0;
  }
}
```

## Memory Management

### Dispose Unused Resources

```typescript
function removeMutation(mutationId: string): void {
  const object = this.mutationLayers.get(mutationId);
  if (object) {
    // Dispose geometry and materials
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
      if (Array.isArray(object.material)) {
        object.material.forEach((m) => m.dispose());
      } else {
        object.material.dispose();
      }
    }

    // Remove from scene
    this.scene.remove(object);
    this.mutationLayers.delete(mutationId);
  }
}
```

### Clean Up on Unmount

```typescript
function cleanup(): void {
  // Dispose all geometries
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
      if (Array.isArray(object.material)) {
        object.material.forEach((m) => m.dispose());
      } else {
        object.material.dispose();
      }
    }
  });

  // Dispose renderer
  renderer.dispose();
}
```

## Texture Optimization

### Use Appropriate Texture Sizes

```typescript
// Mobile: 512x512 or 1024x1024
// Desktop: 2048x2048 or 4096x4096
const textureSize = isMobile() ? 1024 : 2048;
```

### Enable Mipmaps

```typescript
texture.generateMipmaps = true;
texture.minFilter = THREE.LinearMipmapLinearFilter;
texture.magFilter = THREE.LinearFilter;
```

## Fog Optimization

### Use Exponential Fog for Performance

```typescript
// Exponential fog is cheaper than linear
scene.fog = new THREE.FogExp2(0x000000, 0.2);

// Adjust density based on environment
function setEnvironment(type: EnvironmentType): void {
  const fogDensity = {
    jungle: 0.15,
    ocean: 0.1,
    desert: 0.25,
    mountain: 0.2,
    void: 0.3,
  }[type];

  scene.fog = new THREE.FogExp2(environmentColor, fogDensity);
}
```

## Debugging Performance

### Monitor FPS

```typescript
class PerformanceMonitor {
  private frames = 0;
  private lastTime = performance.now();

  update(): void {
    this.frames++;
    const currentTime = performance.now();

    if (currentTime >= this.lastTime + 1000) {
      const fps = Math.round((this.frames * 1000) / (currentTime - this.lastTime));
      console.log(`FPS: ${fps}`);

      if (fps < 30) {
        console.warn('Performance below target!');
      }

      this.frames = 0;
      this.lastTime = currentTime;
    }
  }
}
```

### Use Stats.js in Development

```typescript
// Add stats panel for development
import Stats from 'three/examples/jsm/libs/stats.module';

const stats = new Stats();
document.body.appendChild(stats.dom);

function animate(): void {
  stats.begin();
  // ... render
  stats.end();
}
```
