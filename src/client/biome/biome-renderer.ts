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
    this.groundMesh = this.createGroundMesh();
    this.scene.add(this.groundMesh);
  }

  /**
   * Create the circular ground mesh with 5ft (1.524m) radius
   * Using 5ft = 1.524 meters in scene units
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
   */
  private createJungleBiome(): void {
    // Update ground texture to vibrant green
    (this.groundMesh.material as THREE.MeshPhongMaterial).color.setHex(0x3a7d23);
    (this.groundMesh.material as THREE.MeshPhongMaterial).shininess = 15;
    (this.groundMesh.material as THREE.MeshPhongMaterial).emissive.setHex(0x1a3d11);
    (this.groundMesh.material as THREE.MeshPhongMaterial).emissiveIntensity = 0.2;

    const objectCount = this.isMobile ? 6 : 12;

    // Add vegetation within 5ft radius
    for (let i = 0; i < objectCount; i++) {
      const angle = (i / objectCount) * Math.PI * 2;
      const distance = 2.5 + Math.random() * 2; // 2.5-4.5ft from center
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;

      const plant = this.createPlant();
      plant.position.set(x, -0.5, z);
      plant.rotation.y = Math.random() * Math.PI * 2;
      this.scene.add(plant);
      this.environmentObjects.push(plant);
    }

    // Add some ground foliage
    for (let i = 0; i < objectCount / 2; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 4;
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;

      const foliage = this.createFoliage();
      foliage.position.set(x, -0.45, z);
      this.scene.add(foliage);
      this.environmentObjects.push(foliage);
    }
  }

  /**
   * Create rocky mountain biome with rocks and boulders
   */
  private createRockyMountainBiome(): void {
    // Update ground texture to cool gray rocky surface
    (this.groundMesh.material as THREE.MeshPhongMaterial).color.setHex(0x7788aa);
    (this.groundMesh.material as THREE.MeshPhongMaterial).shininess = 20;
    (this.groundMesh.material as THREE.MeshPhongMaterial).emissive.setHex(0x334455);
    (this.groundMesh.material as THREE.MeshPhongMaterial).emissiveIntensity = 0.15;

    const objectCount = this.isMobile ? 5 : 10;

    // Add rocks and boulders
    for (let i = 0; i < objectCount; i++) {
      const angle = (i / objectCount) * Math.PI * 2 + Math.random() * 0.5;
      const distance = 2 + Math.random() * 2.5;
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;

      const rock = this.createRock();
      rock.position.set(x, -0.3, z);
      rock.rotation.set(
        Math.random() * 0.3,
        Math.random() * Math.PI * 2,
        Math.random() * 0.3
      );
      this.scene.add(rock);
      this.environmentObjects.push(rock);
    }

    // Add smaller pebbles
    for (let i = 0; i < objectCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 4;
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;

      const pebble = this.createPebble();
      pebble.position.set(x, -0.45, z);
      this.scene.add(pebble);
      this.environmentObjects.push(pebble);
    }
  }

  /**
   * Create desert biome with sand and cacti
   */
  private createDesertBiome(): void {
    // Update ground texture to warm golden sand
    (this.groundMesh.material as THREE.MeshPhongMaterial).color.setHex(0xf4d03f);
    (this.groundMesh.material as THREE.MeshPhongMaterial).shininess = 25;
    (this.groundMesh.material as THREE.MeshPhongMaterial).emissive.setHex(0xaa8833);
    (this.groundMesh.material as THREE.MeshPhongMaterial).emissiveIntensity = 0.2;

    const objectCount = this.isMobile ? 4 : 8;

    // Add cacti
    for (let i = 0; i < objectCount; i++) {
      const angle = (i / objectCount) * Math.PI * 2 + Math.random() * 0.8;
      const distance = 2.5 + Math.random() * 2;
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;

      const cactus = this.createCactus();
      cactus.position.set(x, -0.5, z);
      this.scene.add(cactus);
      this.environmentObjects.push(cactus);
    }

    // Add sand dunes (small mounds)
    for (let i = 0; i < objectCount / 2; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 3.5;
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;

      const dune = this.createSandDune();
      dune.position.set(x, -0.5, z);
      this.scene.add(dune);
      this.environmentObjects.push(dune);
    }
  }

  /**
   * Create ocean biome with water effects
   */
  private createOceanBiome(): void {
    // Update ground texture to vibrant turquoise water
    (this.groundMesh.material as THREE.MeshPhongMaterial).color.setHex(0x2a8fbd);
    (this.groundMesh.material as THREE.MeshPhongMaterial).shininess = 100;
    (this.groundMesh.material as THREE.MeshPhongMaterial).specular.setHex(0x88ddff);
    (this.groundMesh.material as THREE.MeshPhongMaterial).emissive.setHex(0x1a5577);
    (this.groundMesh.material as THREE.MeshPhongMaterial).emissiveIntensity = 0.3;

    // Add water surface with animated waves
    const waterSurface = this.createWaterSurface();
    waterSurface.position.y = -0.45;
    this.scene.add(waterSurface);
    this.environmentObjects.push(waterSurface);

    const objectCount = this.isMobile ? 3 : 6;

    // Add coral-like structures
    for (let i = 0; i < objectCount; i++) {
      const angle = (i / objectCount) * Math.PI * 2;
      const distance = 2 + Math.random() * 2.5;
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;

      const coral = this.createCoral();
      coral.position.set(x, -0.4, z);
      this.scene.add(coral);
      this.environmentObjects.push(coral);
    }

    // Add seaweed
    for (let i = 0; i < objectCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 4;
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;

      const seaweed = this.createSeaweed();
      seaweed.position.set(x, -0.5, z);
      this.scene.add(seaweed);
      this.environmentObjects.push(seaweed);
    }
  }

  /**
   * Create cave biome with stalactites and dark atmosphere
   */
  private createCaveBiome(): void {
    // Update ground texture to mysterious purple-tinted cave floor
    (this.groundMesh.material as THREE.MeshPhongMaterial).color.setHex(0x443355);
    (this.groundMesh.material as THREE.MeshPhongMaterial).shininess = 10;
    (this.groundMesh.material as THREE.MeshPhongMaterial).emissive.setHex(0x221133);
    (this.groundMesh.material as THREE.MeshPhongMaterial).emissiveIntensity = 0.25;

    const objectCount = this.isMobile ? 4 : 8;

    // Add stalactites hanging from above
    for (let i = 0; i < objectCount; i++) {
      const angle = (i / objectCount) * Math.PI * 2 + Math.random() * 0.5;
      const distance = 2 + Math.random() * 2.5;
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;

      const stalactite = this.createStalactite();
      stalactite.position.set(x, 3 + Math.random() * 2, z);
      this.scene.add(stalactite);
      this.environmentObjects.push(stalactite);
    }

    // Add stalagmites on ground
    for (let i = 0; i < objectCount / 2; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 4;
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;

      const stalagmite = this.createStalagmite();
      stalagmite.position.set(x, -0.5, z);
      this.scene.add(stalagmite);
      this.environmentObjects.push(stalagmite);
    }

    // Add glowing crystals for ambient light
    for (let i = 0; i < objectCount / 2; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 1.5 + Math.random() * 2.5;
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;

      const crystal = this.createGlowingCrystal();
      crystal.position.set(x, -0.3, z);
      this.scene.add(crystal);
      this.environmentObjects.push(crystal);
    }
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
    this.scene.remove(this.groundMesh);
  }
}
