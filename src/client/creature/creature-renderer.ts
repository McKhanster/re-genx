import * as THREE from 'three';
import { calculateRadiusOffset, generatePulsation } from '../utils/noise';
import { MutationData } from '../../shared/types/api';
import { generateMutationGeometry } from './mutation-geometry';

/**
 * CreatureRenderer handles rendering the base creature blob and all applied mutations
 */
export class CreatureRenderer {
  private baseMesh: THREE.Mesh;
  private baseGeometry: THREE.SphereGeometry;
  private baseMaterial: THREE.MeshPhongMaterial;
  private mutationMeshes: Map<string, THREE.Mesh>;
  private scene: THREE.Scene;
  private isMobile: boolean;
  private originalPositions: Float32Array;
  private time: number = 0;

  constructor(scene: THREE.Scene, isMobile: boolean = false) {
    this.scene = scene;
    this.isMobile = isMobile;
    this.mutationMeshes = new Map();

    // Initialize base mesh
    const { geometry, material, mesh } = this.createBaseMesh();
    this.baseGeometry = geometry;
    this.baseMaterial = material;
    this.baseMesh = mesh;

    // Store original vertex positions for animation
    const positionAttribute = this.baseGeometry.getAttribute('position');
    this.originalPositions = new Float32Array(positionAttribute.array);

    // Add creature to scene at center
    this.baseMesh.position.set(0, 1.2, 0); // 4 feet above ground
    this.scene.add(this.baseMesh);
  }

  /**
   * Create the base pulsating blob mesh with irregular organic geometry
   */
  private createBaseMesh(): {
    geometry: THREE.SphereGeometry;
    material: THREE.MeshPhongMaterial;
    mesh: THREE.Mesh;
  } {
    // Adjust geometry complexity based on device
    const segments = this.isMobile ? 24 : 48;

    // Create sphere geometry
    const geometry = new THREE.SphereGeometry(1.5, segments, segments);

    // Deform the sphere to create irregular blob shape
    const positionAttribute = geometry.getAttribute('position');
    for (let i = 0; i < positionAttribute.count; i++) {
      const x = positionAttribute.getX(i);
      const y = positionAttribute.getY(i);
      const z = positionAttribute.getZ(i);

      // Add initial noise to create irregular blob shape
      const offset = calculateRadiusOffset(x, y, z, 0, 0.8, 0.2);

      const length = Math.sqrt(x * x + y * y + z * z);
      const scale = 1 + offset;

      positionAttribute.setXYZ(i, (x / length) * scale, (y / length) * scale, (z / length) * scale);
    }

    positionAttribute.needsUpdate = true;
    geometry.computeVertexNormals();

    // Create emissive material for glow effect
    const material = new THREE.MeshPhongMaterial({
      color: 0x00ff88,
      emissive: 0x00ff88,
      emissiveIntensity: 0.5,
      shininess: 100,
      flatShading: false,
    });

    const mesh = new THREE.Mesh(geometry, material);

    // Enable shadows if not on mobile
    if (!this.isMobile) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }

    return { geometry, material, mesh };
  }

  /**
   * Animate the creature with fluid organic motion
   * Should be called every frame
   * @param deltaTime - Time since last frame in seconds
   */
  public pulsate(deltaTime: number): void {
    this.time += deltaTime;

    // Get position attribute
    const positionAttribute = this.baseGeometry.getAttribute('position');

    // Animate each vertex with fluid motion
    for (let i = 0; i < positionAttribute.count; i++) {
      // Get original position (guaranteed to exist since we created it)
      const origX = this.originalPositions[i * 3] ?? 0;
      const origY = this.originalPositions[i * 3 + 1] ?? 0;
      const origZ = this.originalPositions[i * 3 + 2] ?? 0;

      // Calculate radius offset using noise for smooth continuous motion
      const offset = calculateRadiusOffset(origX, origY, origZ, this.time, 1.0, 0.15);

      const length = Math.sqrt(origX * origX + origY * origY + origZ * origZ);
      const scale = 1 + offset;

      // Update vertex position
      positionAttribute.setXYZ(
        i,
        (origX / length) * scale,
        (origY / length) * scale,
        (origZ / length) * scale
      );
    }

    positionAttribute.needsUpdate = true;
    this.baseGeometry.computeVertexNormals();

    // Apply overall pulsation to the mesh scale
    const pulsation = generatePulsation(this.time, 1.0, 0.08);
    this.baseMesh.scale.set(pulsation, pulsation, pulsation);

    // Pulse the glow intensity
    const glowPulse = 0.5 + Math.sin(this.time * 1.5) * 0.2;
    this.baseMaterial.emissiveIntensity = glowPulse;
  }

  /**
   * Get the base mesh for external manipulation
   */
  public getBaseMesh(): THREE.Mesh {
    return this.baseMesh;
  }

  /**
   * Get the scene
   */
  public getScene(): THREE.Scene {
    return this.scene;
  }

  /**
   * Apply a mutation to the creature
   * @param mutation - Mutation data to apply
   * @param randomnessFactor - Factor for randomness (0-1)
   */
  public applyMutation(mutation: MutationData, randomnessFactor: number): void {
    // Generate mutation geometry
    const mutationGeometry = generateMutationGeometry(mutation, randomnessFactor, this.isMobile);

    // Create mesh from geometry
    const mesh = new THREE.Mesh(mutationGeometry.geometry, mutationGeometry.material);

    // Apply position, scale, and rotation
    mesh.position.copy(mutationGeometry.position);
    mesh.scale.copy(mutationGeometry.scale);
    mesh.rotation.copy(mutationGeometry.rotation);

    // Enable shadows if not on mobile
    if (!this.isMobile) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }

    // Add to base mesh (so it moves with the creature)
    this.baseMesh.add(mesh);

    // Store reference
    this.mutationMeshes.set(mutation.id, mesh);
  }

  /**
   * Animate a mutation appearing on the creature
   * @param mutationId - ID of the mutation to animate
   * @param duration - Duration of animation in milliseconds
   * @returns Promise that resolves when animation completes
   */
  public async animateMutation(mutationId: string, duration: number = 2500): Promise<void> {
    const mesh = this.mutationMeshes.get(mutationId);
    if (!mesh) {
      console.warn(`Mutation ${mutationId} not found`);
      return;
    }

    // Store target scale
    const targetScale = mesh.scale.clone();
    mesh.scale.set(0, 0, 0);

    // Animate scale from 0 to target with ease-out-elastic
    const startTime = Date.now();

    return new Promise((resolve) => {
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease-out-elastic function
        const eased = this.easeOutElastic(progress);

        mesh.scale.lerpVectors(new THREE.Vector3(0, 0, 0), targetScale, eased);

        // Pulse creature glow during animation
        const glowBoost = Math.sin(progress * Math.PI) * 0.3;
        this.baseMaterial.emissiveIntensity = 0.5 + glowBoost;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Reset glow to normal
          this.baseMaterial.emissiveIntensity = 0.5;
          resolve();
        }
      };
      animate();
    });
  }

  /**
   * Ease-out-elastic easing function for smooth bouncy animations
   */
  private easeOutElastic(x: number): number {
    const c4 = (2 * Math.PI) / 3;

    if (x === 0) return 0;
    if (x === 1) return 1;

    return Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
  }

  /**
   * Remove a mutation from the creature
   * @param mutationId - ID of the mutation to remove
   */
  public removeMutation(mutationId: string): void {
    const mutationMesh = this.mutationMeshes.get(mutationId);
    if (mutationMesh) {
      this.baseMesh.remove(mutationMesh);
      mutationMesh.geometry.dispose();
      if (Array.isArray(mutationMesh.material)) {
        mutationMesh.material.forEach((m) => m.dispose());
      } else {
        mutationMesh.material.dispose();
      }
      this.mutationMeshes.delete(mutationId);
    }
  }

  /**
   * Clear all mutations from the creature
   */
  public clearMutations(): void {
    this.mutationMeshes.forEach((_mesh, id) => {
      this.removeMutation(id);
    });
  }

  /**
   * Dispose of all resources
   */
  public dispose(): void {
    this.clearMutations();
    this.baseGeometry.dispose();
    this.baseMaterial.dispose();
    this.scene.remove(this.baseMesh);
  }
}
