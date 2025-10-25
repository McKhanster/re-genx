/*
Procedural Scene Elements for Re-GenX
Generates procedural terrain and vegetation that can be integrated into the main scene
*/

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// -----------------------------
// Simple Perlin-like noise (value noise) implementation
// Small, fast, good-enough for terrain displacement
// -----------------------------
class ValueNoise {
  private perm: number[];
  constructor(seed = 0) {
    const rnd = mulberry32(seed);
    this.perm = new Array(512);
    const p = new Array(256).fill(0).map((_, i) => i);
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      const temp = p[i];
      p[i] = p[j] ?? 0;
      p[j] = temp ?? 0;
    }
    for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255] ?? 0;
  }

  noise2(x: number, y: number) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const topRight = this.perm[(this.perm[X + 1] ?? 0) + Y + 1] ?? 0;
    const topLeft = this.perm[(this.perm[X] ?? 0) + Y + 1] ?? 0;
    const bottomRight = this.perm[(this.perm[X + 1] ?? 0) + Y] ?? 0;
    const bottomLeft = this.perm[(this.perm[X] ?? 0) + Y] ?? 0;
    const valueTop = lerp(hash(topLeft), hash(topRight), fade(xf));
    const valueBottom = lerp(hash(bottomLeft), hash(bottomRight), fade(xf));
    return lerp(valueBottom, valueTop, fade(yf));
  }
}

function hash(i: number) {
  // map to [-1,1]
  return ((i % 256) / 255) * 2 - 1;
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function fade(t: number) {
  // 6t^5 - 15t^4 + 10t^3
  return t * t * t * (t * (t * 6 - 15) + 10);
}
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// -----------------------------
// Theme definitions
// -----------------------------
type Theme = 'jungle' | 'desert' | 'alien';

interface ThemeConfig {
  groundColor: number;
  skyColorTop: number;
  skyColorBottom: number;
  fogColor: number;
  vegetationColor: number;
  rockColor: number;
  displacementScale: number;
  vegetationDensity: number; // number of instances per 1000 units
  lightIntensity: number;
}

const THEME_TABLE: Record<Theme, ThemeConfig> = {
  jungle: {
    groundColor: 0x2b6e2b,
    skyColorTop: 0x88c0ff,
    skyColorBottom: 0xb6e7a9,
    fogColor: 0x90c090,
    vegetationColor: 0x1a7a1a,
    rockColor: 0x5a5a5a,
    displacementScale: 12,
    vegetationDensity: 18,
    lightIntensity: 1.0,
  },
  desert: {
    groundColor: 0xe8c57f,
    skyColorTop: 0xffe9a8,
    skyColorBottom: 0xffc27a,
    fogColor: 0xffdba3,
    vegetationColor: 0x6aa84f,
    rockColor: 0x8a6b4e,
    displacementScale: 4,
    vegetationDensity: 4,
    lightIntensity: 1.2,
  },
  alien: {
    groundColor: 0x341b5a,
    skyColorTop: 0x2bd7ff,
    skyColorBottom: 0xff6fe9,
    fogColor: 0x6b2b9b,
    vegetationColor: 0xff9a00,
    rockColor: 0x9bffb0,
    displacementScale: 20,
    vegetationDensity: 12,
    lightIntensity: 1.4,
  },
};

// -----------------------------
// Procedural Elements Generator for Re-GenX Integration
// -----------------------------
export class ProceduralElements {
  private noise: ValueNoise;
  private seed: number;

  constructor(seed?: number) {
    this.seed = seed ?? Math.floor(Math.random() * 999999);
    this.noise = new ValueNoise(this.seed);
  }

  /**
   * Create procedural terrain mesh for a specific theme
   */
  public createTerrain(
    theme: Theme,
    width: number = 400,
    height: number = 400,
    segments: number = 64,
    isMobile: boolean = false
  ): THREE.Mesh {
    const config = THEME_TABLE[theme];

    // Reduce segments on mobile for performance
    const actualSegments = isMobile ? Math.floor(segments * 0.5) : segments;

    const geom = new THREE.PlaneGeometry(width, height, actualSegments, actualSegments);
    geom.rotateX(-Math.PI / 2);

    const freq = 0.01;
    const octaves = isMobile ? 3 : 4; // Fewer octaves on mobile
    const amp = config.displacementScale;

    const positionAttribute = geom.attributes.position;
    if (positionAttribute) {
      for (let i = 0; i < positionAttribute.count; i++) {
        const vx = positionAttribute.getX(i);
        const vz = positionAttribute.getZ(i);
        let y = 0;
        let frequency = freq;
        let amplitude = amp;

        for (let o = 0; o < octaves; o++) {
          y += this.noise.noise2(vx * frequency, vz * frequency) * amplitude;
          frequency *= 2;
          amplitude *= 0.5;
        }

        // Theme-specific adjustments
        if (theme === 'desert') y *= 0.35;
        if (theme === 'alien') y *= 1.25;

        positionAttribute.setY(i, y);
      }
    }

    geom.computeVertexNormals();

    // Create vertex colors based on height
    if (positionAttribute) {
      const colors = new Float32Array(positionAttribute.count * 3);
      for (let i = 0; i < positionAttribute.count; i++) {
        const y = positionAttribute.getY(i);
        const t = THREE.MathUtils.clamp((y + amp) / (amp * 2), 0, 1);
        const base = new THREE.Color(config.groundColor);
        const rock = new THREE.Color(config.rockColor);
        const mixed = base.clone().lerp(rock, t * 0.6);
        colors[i * 3 + 0] = mixed.r;
        colors[i * 3 + 1] = mixed.g;
        colors[i * 3 + 2] = mixed.b;
      }
      geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    }

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 1,
      metalness: 0,
    });

    const mesh = new THREE.Mesh(geom, material);
    mesh.receiveShadow = true;
    mesh.position.y = -0.5; // Same level as original BiomeRenderer ground

    return mesh;
  }

  /**
   * Create scattered rocks for the terrain
   */
  public createRocks(
    theme: Theme,
    terrain: THREE.Mesh,
    isMobile: boolean = false
  ): THREE.InstancedMesh {
    const config = THEME_TABLE[theme];
    const rockGeo = new THREE.IcosahedronGeometry(1, 0);
    const rockMat = new THREE.MeshStandardMaterial({
      color: config.rockColor,
      roughness: 1,
    });

    // Reduce count on mobile
    const baseCount = isMobile ? 20 : 50;
    const inst = new THREE.InstancedMesh(rockGeo, rockMat, baseCount);

    if (!isMobile) {
      inst.castShadow = true;
      inst.receiveShadow = true;
    }

    const dummy = new THREE.Object3D();
    let placed = 0;

    for (let i = 0; i < baseCount; i++) {
      const x = (Math.random() - 0.5) * 300; // Smaller area than original
      const z = (Math.random() - 0.5) * 300;
      const y = sampleHeightAt(terrain.geometry as THREE.BufferGeometry, x, z);

      if (y === null) continue;

      dummy.position.set(x, y + Math.random() * 0.8 - 0.5, z); // Adjust for terrain position
      const s = 0.5 + Math.random() * 1.5; // Smaller rocks
      dummy.scale.setScalar(s);
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      dummy.updateMatrix();
      inst.setMatrixAt(placed++, dummy.matrix);
    }

    inst.count = placed;
    return inst;
  }

  /**
   * Create vegetation for the terrain (trees removed)
   */
  public createVegetation(
    theme: Theme,
    terrain: THREE.Mesh,
    isMobile: boolean = false
  ): THREE.Group {
    // Return empty group - no trees/vegetation
    return new THREE.Group();
  }
}

// -----------------------------
// Legacy Main Scene Builder (kept for standalone use)
// -----------------------------
class ProceduralWorld {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private noise: ValueNoise;
  private seed: number;
  private theme: Theme;
  private config: ThemeConfig;

  constructor(container: HTMLElement, seed?: number) {
    this.container = container;
    this.seed = seed ?? Math.floor(Math.random() * 999999);
    this.noise = new ValueNoise(this.seed);
    this.theme = this.pickTheme();
    this.config = THEME_TABLE[this.theme];

    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      2000
    );
    this.camera.position.set(0, 60, 120);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 6, 0);
    this.controls.maxPolarAngle = Math.PI * 0.48;

    window.addEventListener('resize', this.onResize);

    this.setupScene();
    this.animate();
  }

  private pickTheme(): Theme {
    const roll = Math.random();
    if (roll < 0.33) return 'jungle';
    if (roll < 0.66) return 'desert';
    return 'alien';
  }

  private setupScene() {
    // Background & fog
    this.scene.background = new THREE.Color(this.config.skyColorTop);
    this.scene.fog = new THREE.FogExp2(this.config.fogColor, 0.0025);

    // Lights
    const hemi = new THREE.HemisphereLight(this.config.skyColorBottom, this.config.rockColor, 0.6);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xffffff, this.config.lightIntensity);
    sun.position.set(100, 200, 100);
    sun.castShadow = true;
    sun.shadow.camera.left = -150;
    sun.shadow.camera.right = 150;
    sun.shadow.camera.top = 150;
    sun.shadow.camera.bottom = -150;
    sun.shadow.mapSize.set(2048, 2048);
    this.scene.add(sun);

    // Terrain
    const terrain = this.createTerrain(800, 800, 128, 128);
    terrain.receiveShadow = true;
    this.scene.add(terrain);

    // Rocks & scatter
    this.scatterRocks(terrain);

    // Vegetation
    this.createVegetation(terrain);

    // Subtle ambient
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.15));

    // Small UI helper text in console
    console.log(`Procedural world generated. Theme: ${this.theme}. Seed: ${this.seed}`);
  }

  private createTerrain(width: number, height: number, wSegs: number, hSegs: number) {
    const geom = new THREE.PlaneGeometry(width, height, wSegs, hSegs);
    geom.rotateX(-Math.PI / 2);

    const freq = 0.01; // base frequency
    const octaves = 4;
    const amp = this.config.displacementScale;

    const positionAttribute = geom.attributes.position;
    if (positionAttribute) {
      for (let i = 0; i < positionAttribute.count; i++) {
        const vx = positionAttribute.getX(i);
        const vz = positionAttribute.getZ(i);
        let y = 0;
        let frequency = freq;
        let amplitude = amp;
        for (let o = 0; o < octaves; o++) {
          y += this.noise.noise2(vx * frequency, vz * frequency) * amplitude;
          frequency *= 2;
          amplitude *= 0.5;
        }
        // Flatten more in desert
        if (this.theme === 'desert') y *= 0.35;
        // more dramatic in alien
        if (this.theme === 'alien') y *= 1.25;

        positionAttribute.setY(i, y);
      }
    }
    geom.computeVertexNormals();

    // Ground material: a simple lambert with slight vertex color based on slope/height
    const colors = new Float32Array((wSegs + 1) * (hSegs + 1) * 3);
    const positionAttr = geom.attributes.position;
    if (positionAttr) {
      for (let i = 0; i < positionAttr.count; i++) {
        const y = positionAttr.getY(i);
        const t = THREE.MathUtils.clamp((y + amp) / (amp * 2), 0, 1);
        const base = new THREE.Color(this.config.groundColor);
        const rock = new THREE.Color(this.config.rockColor);
        const mixed = base.clone().lerp(rock, t * 0.6);
        colors[i * 3 + 0] = mixed.r;
        colors[i * 3 + 1] = mixed.g;
        colors[i * 3 + 2] = mixed.b;
      }
    }
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 1,
      metalness: 0,
    });

    const mesh = new THREE.Mesh(geom, mat);
    mesh.receiveShadow = true;
    return mesh;
  }

  private scatterRocks(terrain: THREE.Mesh) {
    // Simple random rock placement using InstancedMesh
    const rockGeo = new THREE.IcosahedronGeometry(1, 0);
    const rockMat = new THREE.MeshStandardMaterial({ color: this.config.rockColor, roughness: 1 });

    const area = 800 * 800;
    const count = Math.floor((area / 1000) * 2.5); // base
    const inst = new THREE.InstancedMesh(rockGeo, rockMat, count);
    inst.castShadow = true;
    inst.receiveShadow = true;

    const dummy = new THREE.Object3D();
    let placed = 0;
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 800;
      const z = (Math.random() - 0.5) * 800;
      const y = sampleHeightAt(terrain.geometry as THREE.BufferGeometry, x, z);
      if (y === null) continue;
      dummy.position.set(x, y + Math.random() * 0.8, z);
      const s = 1 + Math.random() * 2.5;
      dummy.scale.setScalar(s);
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      dummy.updateMatrix();
      inst.setMatrixAt(placed++, dummy.matrix);
    }
    inst.count = placed;
    this.scene.add(inst);
  }

  private createVegetation(terrain: THREE.Mesh) {
    const density = this.config.vegetationDensity; // instances per 1000 sq units
    const area = 800 * 800;
    const count = Math.floor((area / 1000) * density);

    // We'll create two types: foliage (planes/cones) and trunks (cylinders)
    // Use InstancedMesh for performance

    // Foliage geometry depends on theme
    let foliageGeo: THREE.BufferGeometry;
    let foliageMat: THREE.MeshStandardMaterial;

    if (this.theme === 'jungle') {
      // Cone foliage (palm-ish)
      foliageGeo = new THREE.ConeGeometry(1.6, 4, 6);
      foliageMat = new THREE.MeshStandardMaterial({
        color: this.config.vegetationColor,
        roughness: 0.9,
        flatShading: true,
      });
    } else if (this.theme === 'desert') {
      // small succulent-like sphere
      foliageGeo = new THREE.SphereGeometry(0.8, 6, 6);
      foliageMat = new THREE.MeshStandardMaterial({
        color: this.config.vegetationColor,
        roughness: 1,
      });
    } else {
      // alien: spiky extruded shape -> use Octahedron
      foliageGeo = new THREE.OctahedronGeometry(1.6, 0);
      foliageMat = new THREE.MeshStandardMaterial({
        color: this.config.vegetationColor,
        emissive: 0x220000,
        emissiveIntensity: 0.15,
        roughness: 0.6,
      });
    }

    const foliageInst = new THREE.InstancedMesh(foliageGeo, foliageMat, count);
    foliageInst.castShadow = true;
    foliageInst.receiveShadow = true;

    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.6, 4, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2e, roughness: 1 });
    const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
    trunkInst.castShadow = true;
    trunkInst.receiveShadow = true;

    const dummy = new THREE.Object3D();
    let placed = 0;
    for (let i = 0; i < count; i++) {
      // less vegetation near steep cliffs / high slopes
      const x = (Math.random() - 0.5) * 800;
      const z = (Math.random() - 0.5) * 800;
      const y = sampleHeightAt(terrain.geometry as THREE.BufferGeometry, x, z);
      if (y === null) continue;

      // Avoid placing in too steep slope: approximate via nearby heights
      const slope = estimateSlope(terrain.geometry as THREE.BufferGeometry, x, z);
      if (slope > 0.45 && Math.random() > 0.15) continue; // skip steep

      const scale = 0.6 + Math.random() * 1.8;

      // Trunk
      dummy.position.set(x, y + 2 * scale * 0.5, z);
      dummy.scale.setScalar(0.6 * scale);
      dummy.rotation.y = Math.random() * Math.PI;
      dummy.updateMatrix();
      trunkInst.setMatrixAt(placed, dummy.matrix);

      // Foliage above trunk depending on theme
      if (this.theme === 'desert') {
        // succulents sit on the ground, not on a trunk
        dummy.position.set(x, y + 0.6 * scale, z);
        dummy.scale.setScalar(0.6 * scale);
        dummy.rotation.y = Math.random() * Math.PI;
        dummy.updateMatrix();
        foliageInst.setMatrixAt(placed, dummy.matrix);
      } else {
        dummy.position.set(x, y + 3.2 * scale, z);
        dummy.scale.setScalar(1.2 * scale);
        dummy.rotation.set(Math.random() * Math.PI * 0.15, Math.random() * Math.PI, 0);
        dummy.updateMatrix();
        foliageInst.setMatrixAt(placed, dummy.matrix);
      }

      placed++;
    }

    trunkInst.count = placed;
    foliageInst.count = placed;

    this.scene.add(trunkInst);
    this.scene.add(foliageInst);

    // If alien theme, add some glowing pods
    if (this.theme === 'alien') {
      const podGeo = new THREE.SphereGeometry(0.5, 8, 8);
      const podMat = new THREE.MeshStandardMaterial({
        color: 0xff66ff,
        emissive: 0xff00ff,
        emissiveIntensity: 0.6,
        roughness: 0.3,
      });
      const pods = new THREE.InstancedMesh(podGeo, podMat, Math.floor(placed * 0.6));
      const d = new THREE.Object3D();
      let p = 0;
      for (let i = 0; i < placed; i++) {
        if (Math.random() > 0.6) continue;
        d.position.set(
          (Math.random() - 0.5) * 800,
          Math.random() * 10 + 2,
          (Math.random() - 0.5) * 800
        );
        d.scale.setScalar(0.5 + Math.random());
        d.updateMatrix();
        pods.setMatrixAt(p++, d.matrix);
      }
      pods.count = p;
      this.scene.add(pods);
    }
  }

  private animate = () => {
    requestAnimationFrame(this.animate);
    // optional subtle animation for alien pods / plants
    // rotate the scene slowly for better view
    this.scene.rotation.y += 0.0005;
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  private onResize = () => {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };
}

// -----------------------------
// Helper: sample height from plane geometry (approx nearest vertex)
// -----------------------------
function sampleHeightAt(geom: THREE.BufferGeometry, x: number, z: number): number | null {
  if (!geom.attributes.position) return null;
  const positions = geom.attributes.position.array as Float32Array;
  let bestDist = Infinity;
  let bestY = 0;
  for (let i = 0; i < positions.length; i += 3) {
    const px = positions[i];
    const py = positions[i + 1];
    const pz = positions[i + 2];
    if (px !== undefined && py !== undefined && pz !== undefined) {
      const d = (px - x) * (px - x) + (pz - z) * (pz - z);
      if (d < bestDist) {
        bestDist = d;
        bestY = py;
      }
    }
  }
  return bestY;
}

function estimateSlope(geom: THREE.BufferGeometry, x: number, z: number) {
  // sample heights in a small neighborhood and compute gradient
  const h = sampleHeightAt(geom, x, z);
  if (h === null) return 0;
  const hX = sampleHeightAt(geom, x + 2, z) ?? h;
  const hZ = sampleHeightAt(geom, x, z + 2) ?? h;
  const dx = Math.abs(hX - h);
  const dz = Math.abs(hZ - h);
  return Math.sqrt(dx * dx + dz * dz) / 2.0; // normalized-ish
}

// -----------------------------
// Bootstrapping convenience: create the app in a given DOM element
// -----------------------------
export function createProceduralWorld(containerId = 'app', seed?: number) {
  const el = document.getElementById(containerId);
  if (!el) throw new Error(`Container element #${containerId} not found.`);
  return new ProceduralWorld(el, seed);
}

// -----------------------------
// Auto-start if run directly in a page with #app
// -----------------------------
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('app');
    if (el) {
      // @ts-ignore - ignore if multiple runs
      (window as any).__proceduralWorld = createProceduralWorld('app');
    }
  });
}

/*
Notes & Extensions you might try:
- Replace instanced simple geometry with glTF models loaded via GLTFLoader for higher fidelity.
- Add custom shaders for animated alien plants (vertex displacement, emissive pulsing).
- Add water planes for jungle or alien (reflective shader).
- Add particle systems for fog, insects, or dust.
*/
