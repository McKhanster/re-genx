# Graphics File Formats for Re-GenX

## Recommended Formats

### Textures (2D Images)

**JPG/JPEG** - Best for:

- Earth textures (currently used)
- Photo-realistic biome backgrounds
- Color maps without transparency
- File size: Small (good compression)
- Current usage: `earth_atmos_2048.jpg`, `earth_normal_2048.jpg`, `earth_specular_2048.jpg`

**PNG** - Best for:

- UI elements with transparency
- Icons and badges
- Alpha masks
- Particle textures
- File size: Larger than JPG but supports transparency

**WebP** - Best for:

- Modern alternative to JPG/PNG
- Better compression than both
- Supports transparency
- File size: Smallest
- Browser support: Excellent (all modern browsers)

### 3D Models

**GLTF/GLB** - Best for:

- Pre-made 3D mutation parts
- Complex creature components
- Animated models
- File size: Efficient binary format (GLB) or JSON (GLTF)
- Three.js support: Excellent with GLTFLoader

**OBJ** - Best for:

- Simple static models
- Legacy 3D assets
- File size: Larger (text-based)
- Three.js support: Good with OBJLoader

### Procedural Geometry (Current Approach)

**BufferGeometry (Code-based)** - Best for:

- Organic blob creature (current implementation)
- Procedurally generated mutations
- Dynamic geometry that changes
- File size: None (generated at runtime)
- Performance: Excellent (no loading time)

## Current Re-GenX Implementation

```
src/client/public/
├── earth_atmos_2048.jpg    (2048x2048 JPG - atmosphere texture)
├── earth_normal_2048.jpg   (2048x2048 JPG - normal map)
└── earth_specular_2048.jpg (2048x2048 JPG - specular map)
```

## Recommendations for Re-GenX

### For Creature Mutations

- **Use procedural geometry** (current approach) - Best performance
- **Alternative**: GLTF models for complex pre-designed mutations

### For Biome Environments

- **Use JPG** for background textures (current approach)
- **Use PNG** for particle textures with alpha
- **Consider WebP** for smaller file sizes

### For UI Elements

- **Use PNG** for icons, badges, achievement graphics
- **Use SVG** for scalable UI elements (can be inlined in HTML)

### For Particle Effects

- **Use PNG** with alpha channel
- Size: 64x64 or 128x128 (small is better)
- Example: Dust particles, sparkles, mutation effects

## File Size Guidelines

### Desktop Targets

- Textures: 2048x2048 or 4096x4096
- Total asset size: < 10MB

### Mobile Targets

- Textures: 1024x1024 or 512x512
- Total asset size: < 5MB
- Use texture compression (basis universal)

## Loading Strategy

```typescript
// Lazy load textures
const textureLoader = new THREE.TextureLoader();

// Load with progress tracking
textureLoader.load(
  'texture.jpg',
  (texture) => {
    // Success
    material.map = texture;
  },
  (progress) => {
    // Show loading bar
    const percent = (progress.loaded / progress.total) * 100;
  },
  (error) => {
    // Handle error
    console.error('Texture load failed:', error);
  }
);
```

## Optimization Tips

1. **Use texture atlases** - Combine multiple small textures into one large texture
2. **Enable mipmaps** - Improves performance and quality
3. **Compress textures** - Use basis universal for WebGL texture compression
4. **Lazy load** - Only load assets when needed
5. **Cache textures** - Reuse loaded textures across meshes

## Not Recommended

- **BMP** - Too large, no compression
- **TIFF** - Not web-friendly
- **FBX** - Proprietary, use GLTF instead
- **Video files** - Too large for Devvit's 10MB limit
- **GIF** - Use PNG or WebP instead
