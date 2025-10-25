import * as THREE from 'three';
import { BiomeType } from '../../shared/types/api';

/**
 * BiomeRenderer manages the environmental rendering within the 5ft visibility radius.
 * It creates biome-specific ground textures and environmental objects (plants, rocks, water, etc.)
 * and handles switching between different biomes.
 */
export class BiomeRenderer {
  private groundMesh: THREE.Mesh;
  private environmentObjects: THREE.Object3D[] = [];
  private currentBiome: BiomeType | null = null;
  private scene: THREE.Scene;
  private isMobile: boolean;

  constructor(scene: THREE.Scene, isMobile: boolean = false) {
    this.scene = scene;
    this.isMobile = isMobile;
    // Create a dummy ground mesh for compatibility but don't add it to scene
    // The procedural terrain will serve as the ground
    this.groundMesh = this.createGroundMesh();
  }

  /**
   * Create a dummy ground mesh for compatibility
   * The actual ground is now handled by procedural terrain
   */
  private createGroundMesh(): THREE.Mesh {
    const radius = 5; // 5ft radius
    const segments = this.isMobile ? 32 : 64;
    const geometry = new THREE.CircleGeometry(radius, segments);
    // Use MeshPhongMaterial to match creature material and work better with SpotLight shadows
    const material = new THREE.MeshPhongMaterial({
      color: 0x333333,
      shininess: 10,
      specular: 0x111111,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    mesh.position.y = -0.5; // Position below creature (raised from -1)
    mesh.receiveShadow = !this.isMobile;

    return mesh;
  }

  /**
   * Switch to a new biome, clearing previous biome objects
   */
  public setBiome(biome: BiomeType): void {
    if (this.currentBiome === biome) return;

    this.clearEnvironment();
    this.currentBiome = biome;

    switch (biome) {
      case 'jungle':
        this.createJungleBiome();
        break;
      case 'rocky_mountain':
        this.createRockyMountainBiome();
        break;
      case 'desert':
        this.createDesertBiome();
        break;
      case 'ocean':
        this.createOceanBiome();
        break;
      case 'cave':
        this.createCaveBiome();
        break;
    }

    console.log(`Biome set to: ${biome}`);
  }

  /**
   * Get the current biome
   */
  public getCurrentBiome(): BiomeType | null {
    return this.currentBiome;
  }

  /**
   * Clear all environment objects from the scene
   */
  private clearEnvironment(): void {
    this.environmentObjects.forEach((obj) => {
      this.scene.remove(obj);
      // Dispose of geometries and materials to free memory
      obj.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    });
    this.environmentObjects = [];
  }

  /**
   * Create jungle biome with lush vegetation
   * Vegetation is now handled by procedural terrain
   */
  private createJungleBiome(): void {
    // All vegetation is now handled by procedural terrain
    // BiomeRenderer no longer creates environment objects
  }

  /**
   * Create rocky mountain biome with rocks and boulders
   * Rocks are now handled by procedural terrain
   */
  private createRockyMountainBiome(): void {
    // All rocks and environment objects are now handled by procedural terrain
    // BiomeRenderer no longer creates environment objects
  }

  /**
   * Create desert biome with sand and cacti
   * Cacti and dunes are now handled by procedural terrain
   */
  private createDesertBiome(): void {
    // All cacti and environment objects are now handled by procedural terrain
    // BiomeRenderer no longer creates environment objects
  }

  /**
   * Create ocean biome with water effects
   * Water and coral are now handled by procedural terrain
   */
  private createOceanBiome(): void {
    // All water, coral, and environment objects are now handled by procedural terrain
    // BiomeRenderer no longer creates environment objects
  }

  /**
   * Create cave biome with stalactites and dark atmosphere
   * Cave elements are now handled by procedural terrain
   */
  private createCaveBiome(): void {
    // All stalactites, crystals, and environment objects are now handled by procedural terrain
    // BiomeRenderer no longer creates environment objects
  }

  // ============================================================================
  // Asset Creation Methods
  // ============================================================================

  /**
   * Create a plant for jungle biome
   */
  private createPlant(): THREE.Group {
    const plant = new THREE.Group();

    // Stem
    const stemGeometry = new THREE.CylinderGeometry(0.05, 0.08, 0.8, 8);
    const stemMaterial = new THREE.MeshPhongMaterial({ color: 0x3d5c2f, shininess: 10 });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = 0.4;
    plant.add(stem);

    // Leaves
    const leafCount = 4;
    for (let i = 0; i < leafCount; i++) {
      const leafGeometry = new THREE.SphereGeometry(0.3, 8, 8);
      leafGeometry.scale(1, 0.3, 2);
      const leafMaterial = new THREE.MeshPhongMaterial({ color: 0x4a7c3f, shininess: 15 });
      const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
      const angle = (i / leafCount) * Math.PI * 2;
      leaf.position.set(Math.cos(angle) * 0.2, 0.6 + i * 0.1, Math.sin(angle) * 0.2);
      leaf.rotation.z = angle;
      plant.add(leaf);
    }

    return plant;
  }

  /**
   * Create ground foliage for jungle biome
   */
  private createFoliage(): THREE.Mesh {
    const geometry = new THREE.ConeGeometry(0.15, 0.2, 6);
    const material = new THREE.MeshPhongMaterial({ color: 0x3d5c2f, shininess: 10 });
    return new THREE.Mesh(geometry, material);
  }

  /**
   * Create a rock for rocky mountain biome
   */
  private createRock(): THREE.Mesh {
    const size = 0.3 + Math.random() * 0.4;
    const geometry = new THREE.DodecahedronGeometry(size, 0);
    // Randomize vertices for irregular shape
    const positions = geometry.attributes.position;
    if (positions) {
      for (let i = 0; i < positions.count; i++) {
        positions.setXYZ(
          i,
          positions.getX(i) * (0.8 + Math.random() * 0.4),
          positions.getY(i) * (0.8 + Math.random() * 0.4),
          positions.getZ(i) * (0.8 + Math.random() * 0.4)
        );
      }
      geometry.computeVertexNormals();
    }

    const material = new THREE.MeshPhongMaterial({
      color: 0x6b6b6b,
      shininess: 5,
    });
    return new THREE.Mesh(geometry, material);
  }

  /**
   * Create a small pebble for rocky mountain biome
   */
  private createPebble(): THREE.Mesh {
    const size = 0.08 + Math.random() * 0.12;
    const geometry = new THREE.SphereGeometry(size, 6, 6);
    const material = new THREE.MeshPhongMaterial({
      color: 0x7a7a7a,
      shininess: 8,
    });
    return new THREE.Mesh(geometry, material);
  }

  /**
   * Create a cactus for desert biome
   */
  private createCactus(): THREE.Group {
    const cactus = new THREE.Group();

    // Main body
    const bodyGeometry = new THREE.CylinderGeometry(0.15, 0.18, 0.8, 8);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x4a7c3f, shininess: 10 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.4;
    cactus.add(body);

    // Arms
    const armCount = Math.random() > 0.5 ? 2 : 1;
    for (let i = 0; i < armCount; i++) {
      const armGeometry = new THREE.CylinderGeometry(0.08, 0.1, 0.4, 8);
      const arm = new THREE.Mesh(armGeometry, bodyMaterial);
      const side = i === 0 ? 1 : -1;
      arm.position.set(side * 0.2, 0.3, 0);
      arm.rotation.z = side * Math.PI / 4;
      cactus.add(arm);
    }

    return cactus;
  }

  /**
   * Create a sand dune for desert biome
   */
  private createSandDune(): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(0.5, 8, 8);
    geometry.scale(1.5, 0.3, 1);
    const material = new THREE.MeshPhongMaterial({
      color: 0xd4b896,
      shininess: 5,
    });
    return new THREE.Mesh(geometry, material);
  }

  /**
   * Create water surface for ocean biome
   */
  private createWaterSurface(): THREE.Mesh {
    const geometry = new THREE.CircleGeometry(5, this.isMobile ? 32 : 64);
    const material = new THREE.MeshPhongMaterial({
      color: 0x2a6fa8,
      shininess: 80,
      specular: 0x6699cc,
      transparent: true,
      opacity: 0.8,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    return mesh;
  }

  /**
   * Create coral for ocean biome
   */
  private createCoral(): THREE.Group {
    const coral = new THREE.Group();
    const branchCount = 3 + Math.floor(Math.random() * 3);

    for (let i = 0; i < branchCount; i++) {
      const branchGeometry = new THREE.CylinderGeometry(0.05, 0.08, 0.4, 6);
      const branchMaterial = new THREE.MeshPhongMaterial({
        color: Math.random() > 0.5 ? 0xff6b6b : 0xffa500,
        shininess: 20,
      });
      const branch = new THREE.Mesh(branchGeometry, branchMaterial);
      const angle = (i / branchCount) * Math.PI * 2;
      branch.position.set(Math.cos(angle) * 0.1, 0.2, Math.sin(angle) * 0.1);
      branch.rotation.z = Math.random() * 0.3;
      coral.add(branch);
    }

    return coral;
  }

  /**
   * Create seaweed for ocean biome
   */
  private createSeaweed(): THREE.Mesh {
    const geometry = new THREE.CylinderGeometry(0.03, 0.05, 0.6, 6);
    const material = new THREE.MeshPhongMaterial({ color: 0x2d5c3f, shininess: 10 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 0.3;
    return mesh;
  }

  /**
   * Create stalactite for cave biome
   */
  private createStalactite(): THREE.Mesh {
    const height = 0.5 + Math.random() * 0.8;
    const geometry = new THREE.ConeGeometry(0.1, height, 8);
    const material = new THREE.MeshPhongMaterial({
      color: 0x4a4a4a,
      shininess: 5,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = Math.PI; // Point downward
    return mesh;
  }

  /**
   * Create stalagmite for cave biome
   */
  private createStalagmite(): THREE.Mesh {
    const height = 0.3 + Math.random() * 0.5;
    const geometry = new THREE.ConeGeometry(0.12, height, 8);
    const material = new THREE.MeshPhongMaterial({
      color: 0x3a3a3a,
      shininess: 5,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = height / 2;
    return mesh;
  }

  /**
   * Create glowing crystal for cave biome
   */
  private createGlowingCrystal(): THREE.Mesh {
    const geometry = new THREE.OctahedronGeometry(0.15, 0);
    const material = new THREE.MeshPhongMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 0.5,
      shininess: 100,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 0.15;
    return mesh;
  }

  /**
   * Get the ground mesh for debugging
   */
  public getGroundMesh(): THREE.Mesh {
    return this.groundMesh;
  }

  /**
   * Dispose of all resources
   */
  public dispose(): void {
    this.clearEnvironment();
    this.groundMesh.geometry.dispose();
    (this.groundMesh.material as THREE.Material).dispose();
    // Ground mesh is no longer added to scene, so no need to remove it
  }
}
