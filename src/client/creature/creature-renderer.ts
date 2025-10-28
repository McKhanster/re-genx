// import * as THREE from 'three';
// import { calculateRadiusOffset, generatePulsation } from '../utils/noise';
// import { MutationData } from '../../shared/types/api';
// import { generateMutationGeometry } from './mutation-geometry';
// import { StatFeedback } from '../ui/stat-feedback';
// import { CellGeometryGenerator } from '../rendering/cell-geometry-generator';
// import { PlasmaShaderMaterial } from '../rendering/plasma-shader-material';

// /**
//  * CreatureRenderer handles rendering the base creature blob and all applied mutations
//  * Implements LOD (Level of Detail) system for mobile optimization
//  */
// export class CreatureRenderer {
//   private baseMesh: THREE.Mesh;
//   private baseGeometry: THREE.BufferGeometry;
//   private baseMaterial: PlasmaShaderMaterial;
//   private mutationMeshes: Map<string, THREE.Mesh>;
//   private scene: THREE.Scene;
//   private isMobile: boolean;
//   private originalPositions: Float32Array;
//   private time: number = 0;
//   private lodLevel: 'high' | 'medium' | 'low';
//   private qualityMultiplier: number;

//   constructor(scene: THREE.Scene, isMobile: boolean = false) {
//     this.scene = scene;
//     this.isMobile = isMobile;
//     this.mutationMeshes = new Map();

//     // Set LOD level based on device
//     this.lodLevel = isMobile ? 'low' : 'high';
//     this.qualityMultiplier = isMobile ? 0.5 : 1.0;

//     // Initialize base mesh
//     const { geometry, material, mesh } = this.createBaseMesh();
//     this.baseGeometry = geometry;
//     this.baseMaterial = material;
//     this.baseMesh = mesh;

//     // Store original vertex positions for animation
//     const positionAttribute = this.baseGeometry.getAttribute('position');
//     if (positionAttribute && positionAttribute.array) {
//       this.originalPositions = new Float32Array(positionAttribute.array);
//     } else {
//       // Fallback if no position attribute
//       this.originalPositions = new Float32Array(0);
//     }

//     // Add creature to scene at center
//     this.baseMesh.position.set(0, 1.2, 0); // 4 feet above ground
//     this.scene.add(this.baseMesh);
//   }

//   /**
//    * Create the base pulsating blob mesh with Voronoi cell geometry and plasma shader
//    * Uses LOD-based cell count for optimal performance
//    */
//   private createBaseMesh(): {
//     geometry: THREE.BufferGeometry;
//     material: PlasmaShaderMaterial;
//     mesh: THREE.Mesh;
//   } {
//     // Generate Voronoi cell geometry based on device capabilities
//     // const cellCount = this.getCellCount();
//     // const depthVariation = this.isMobile ? 0.15 : 0.25;

//     // const geometry = CellGeometryGenerator.generateCellGeometry(
//     //   1.5, // Base radius
//     //   cellCount,
//     //   depthVariation
//     // );
// //     // Initialize base mesh
//     const { geometry } = this.createBaseMesh();
//     this.baseGeometry = geometry;

//     // Create plasma shader material with device-appropriate settings
//     const material = new PlasmaShaderMaterial({
//       baseColor: new THREE.Color(0x4444ff), // Deep blue base
//       glowColor: new THREE.Color(0x00ffff), // Cyan glow
//       glowIntensity: this.isMobile ? 0.4 : 0.6,
//       plasmaSpeed: 0.3,
//       cellEdgeWidth: 0.05,
//       cellEdgeGlow: this.isMobile ? 0.3 : 0.4,
//       opacity: 0.85,
//       colorPalette: [
//         new THREE.Color(0x00ffff), // Cyan
//         new THREE.Color(0xff00ff), // Magenta
//         new THREE.Color(0x9d00ff), // Purple
//         new THREE.Color(0x00ffaa), // Teal
//       ],
//     });

//     const mesh = new THREE.Mesh(geometry, material);

//     // Enable shadows if not on mobile
//     if (!this.isMobile) {
//       mesh.castShadow = true;
//       mesh.receiveShadow = true;
//     }

//     return { geometry, material, mesh };
//   }

//   /**
//    * Animate the creature with fluid organic motion and update plasma shader
//    * Should be called every frame
//    * @param deltaTime - Time since last frame in seconds
//    * @param plasmaSpeed - Current plasma animation speed from performance monitor
//    */
//   public pulsate(deltaTime: number, plasmaSpeed: number = 1.0): void {
//     this.time += deltaTime;

//     // Update plasma shader time with performance-adjusted speed
//     this.baseMaterial.updateTime(deltaTime);
//     this.baseMaterial.setPlasmaSpeed(0.3 * plasmaSpeed);

//     // Get position attribute
//     const positionAttribute = this.baseGeometry.getAttribute('position');

//     // Animate each vertex with fluid motion (if we have original positions)
//     if (this.originalPositions && positionAttribute.count * 3 <= this.originalPositions.length) {
//       for (let i = 0; i < positionAttribute.count; i++) {
//         // Get original position
//         const origX = this.originalPositions[i * 3] ?? 0;
//         const origY = this.originalPositions[i * 3 + 1] ?? 0;
//         const origZ = this.originalPositions[i * 3 + 2] ?? 0;

//         // Calculate radius offset using noise for smooth continuous motion
//         const offset = calculateRadiusOffset(origX, origY, origZ, this.time, 0.6, 0.06);

//         const length = Math.sqrt(origX * origX + origY * origY + origZ * origZ);
//         const scale = 1 + offset;

//         // Update vertex position
//         positionAttribute.setXYZ(
//           i,
//           (origX / length) * scale,
//           (origY / length) * scale,
//           (origZ / length) * scale
//         );
//       }

//       positionAttribute.needsUpdate = true;
//       this.baseGeometry.computeVertexNormals();
//     }

//     // Apply overall pulsation to the mesh scale
//     const pulsation = generatePulsation(this.time, 1.0, 0.08);
//     this.baseMesh.scale.set(pulsation, pulsation, pulsation);

//     // Pulse the glow intensity based on time (reduced intensity)
//     const glowPulse = 0.4 + Math.sin(this.time * 1.5) * 0.2;
//     this.baseMaterial.setGlowIntensity(glowPulse);
//   }

//   /**
//    * Get cell count based on LOD level and device capabilities
//    * High: 80-100 cells, Medium: 60-80 cells, Low: 30-50 cells
//    */
//   private getCellCount(): number {
//     if (this.isMobile) {
//       // Mobile: Reduced cell count for performance
//       switch (this.lodLevel) {
//         case 'high':
//           return 50;
//         case 'medium':
//           return 40;
//         case 'low':
//           return 30;
//         default:
//           return 40;
//       }
//     } else {
//       // Desktop: Higher cell count for quality
//       switch (this.lodLevel) {
//         case 'high':
//           return 100;
//         case 'medium':
//           return 80;
//         case 'low':
//           return 60;
//         default:
//           return 80;
//       }
//     }
//   }

//   /**
//    * Get the current LOD level
//    */
//   public getLODLevel(): 'high' | 'medium' | 'low' {
//     return this.lodLevel;
//   }

//   /**
//    * Set the LOD level dynamically
//    * Useful for adaptive quality based on performance
//    */
//   public setLODLevel(level: 'high' | 'medium' | 'low'): void {
//     if (this.lodLevel === level) return;

//     this.lodLevel = level;
//     this.qualityMultiplier = level === 'low' ? 0.5 : level === 'medium' ? 0.75 : 1.0;

//     console.log(`LOD level changed to: ${level} (quality: ${this.qualityMultiplier})`);
//   }

//   /**
//    * Get the quality multiplier for particle counts and effects
//    */
//   public getQualityMultiplier(): number {
//     return this.qualityMultiplier;
//   }

//   /**
//    * Get the base mesh for external manipulation
//    */
//   public getBaseMesh(): THREE.Mesh {
//     return this.baseMesh;
//   }

//   /**
//    * Get the scene
//    */
//   public getScene(): THREE.Scene {
//     return this.scene;
//   }

//   /**
//    * Apply a mutation to the creature
//    * @param mutation - Mutation data to apply
//    * @param randomnessFactor - Factor for randomness (0-1)
//    */
//   public applyMutation(mutation: MutationData, randomnessFactor: number): void {
//     // Generate mutation geometry
//     const mutationGeometry = generateMutationGeometry(mutation, randomnessFactor, this.isMobile);

//     // Create mesh from geometry
//     const mesh = new THREE.Mesh(mutationGeometry.geometry, mutationGeometry.material);

//     // Apply position, scale, and rotation
//     mesh.position.copy(mutationGeometry.position);
//     mesh.scale.copy(mutationGeometry.scale);
//     mesh.rotation.copy(mutationGeometry.rotation);

//     // Enable shadows if not on mobile
//     if (!this.isMobile) {
//       mesh.castShadow = true;
//       mesh.receiveShadow = true;
//     }

//     // Add to base mesh (so it moves with the creature)
//     this.baseMesh.add(mesh);

//     // Store reference
//     this.mutationMeshes.set(mutation.id, mesh);
//   }

//   /**
//    * Animate a mutation appearing on the creature
//    * @param mutationId - ID of the mutation to animate
//    * @param duration - Duration of animation in milliseconds
//    * @param showStatChanges - Whether to display stat change feedback
//    * @returns Promise that resolves when animation completes
//    */
//   public async animateMutation(
//     mutationId: string,
//     duration: number = 2500,
//     showStatChanges: boolean = true
//   ): Promise<void> {
//     const mesh = this.mutationMeshes.get(mutationId);
//     if (!mesh) {
//       console.warn(`Mutation ${mutationId} not found`);
//       return;
//     }

//     // Store target scale
//     const targetScale = mesh.scale.clone();
//     mesh.scale.set(0, 0, 0);

//     // Animate scale from 0 to target with ease-out-elastic
//     const startTime = Date.now();

//     return new Promise((resolve) => {
//       const animate = () => {
//         const elapsed = Date.now() - startTime;
//         const progress = Math.min(elapsed / duration, 1);

//         // Ease-out-elastic function
//         const eased = this.easeOutElastic(progress);

//         mesh.scale.lerpVectors(new THREE.Vector3(0, 0, 0), targetScale, eased);

//         // Pulse creature glow during animation
//         const glowBoost = Math.sin(progress * Math.PI) * 0.1;
//         this.baseMaterial.setGlowIntensity(1.0 + glowBoost);

//         if (progress < 1) {
//           requestAnimationFrame(animate);
//         } else {
//           // Reset glow to normal
//           this.baseMaterial.setGlowIntensity(1.0);
//           resolve();
//         }
//       };
//       animate();
//     });
//   }

//   /**
//    * Display stat changes as floating numbers
//    * @param statEffects - Object containing stat changes by category
//    */
//   public showStatChanges(statEffects: Record<string, Record<string, number>>): void {
//     // Flatten all stat changes into a single object
//     const allChanges: Record<string, number> = {};

//     for (const [category, stats] of Object.entries(statEffects)) {
//       for (const [statName, change] of Object.entries(stats)) {
//         // Use category.statName as key for clarity
//         const displayName = `${category}.${statName}`;
//         allChanges[displayName] = change;
//       }
//     }

//     // Display all stat changes
//     StatFeedback.showMultipleStatChanges(allChanges);
//   }

//   /**
//    * Apply a mutation and show stat changes
//    * @param mutation - Mutation data to apply
//    * @param randomnessFactor - Factor for randomness (0-1)
//    * @param animate - Whether to animate the mutation appearance
//    * @param showStats - Whether to show stat change feedback
//    */
//   public async applyMutationWithFeedback(
//     mutation: MutationData,
//     randomnessFactor: number,
//     animate: boolean = true,
//     showStats: boolean = true
//   ): Promise<void> {
//     // Apply the mutation geometry
//     this.applyMutation(mutation, randomnessFactor);

//     // Show stat changes if requested
//     if (showStats && mutation.statEffects) {
//       // Delay stat feedback slightly so it appears during animation
//       setTimeout(() => {
//         this.showStatChanges(mutation.statEffects);
//       }, 500);
//     }

//     // Animate if requested
//     if (animate) {
//       await this.animateMutation(mutation.id);
//     }
//   }

//   /**
//    * Ease-out-elastic easing function for smooth bouncy animations
//    */
//   private easeOutElastic(x: number): number {
//     const c4 = (2 * Math.PI) / 3;

//     if (x === 0) return 0;
//     if (x === 1) return 1;

//     return Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
//   }

//   /**
//    * Remove a mutation from the creature
//    * @param mutationId - ID of the mutation to remove
//    */
//   public removeMutation(mutationId: string): void {
//     const mutationMesh = this.mutationMeshes.get(mutationId);
//     if (mutationMesh) {
//       this.baseMesh.remove(mutationMesh);
//       mutationMesh.geometry.dispose();
//       if (Array.isArray(mutationMesh.material)) {
//         mutationMesh.material.forEach((m) => m.dispose());
//       } else {
//         mutationMesh.material.dispose();
//       }
//       this.mutationMeshes.delete(mutationId);
//     }
//   }

//   /**
//    * Clear all mutations from the creature
//    */
//   public clearMutations(): void {
//     this.mutationMeshes.forEach((_mesh, id) => {
//       this.removeMutation(id);
//     });
//   }

//   /**
//    * Update the creature's appearance based on care meter level
//    * @param careMeter - Care meter value (0-100)
//    */
//   public updateCareMeterVisuals(careMeter: number): void {
//     if (careMeter < 20) {
//       // Sad/distressed appearance - dull colors, minimal pulsing
//       this.baseMaterial.setBaseColor(new THREE.Color(0x666699)); // Dull blue
//       this.baseMaterial.setGlowColor(new THREE.Color(0x444466)); // Very dim glow
//       this.baseMaterial.setGlowIntensity(0.3);
//       this.baseMaterial.setOpacity(0.7);
//       // Creature appears to droop slightly
//       this.baseMesh.position.y = 1.0;
//     } else if (careMeter < 50) {
//       // Neutral appearance - normal colors, slower pulsing
//       this.baseMaterial.setBaseColor(new THREE.Color(0x4444aa)); // Medium blue
//       this.baseMaterial.setGlowColor(new THREE.Color(0x6666cc)); // Dim glow
//       this.baseMaterial.setGlowIntensity(0.6);
//       this.baseMaterial.setOpacity(0.8);
//       this.baseMesh.position.y = 1.1;
//     } else {
//       // Happy appearance - bright colors, active pulsing
//       this.baseMaterial.setBaseColor(new THREE.Color(0x4444ff)); // Bright blue
//       this.baseMaterial.setGlowColor(new THREE.Color(0x00ffff)); // Cyan glow
//       this.baseMaterial.setGlowIntensity(0.6);
//       this.baseMaterial.setOpacity(0.85);
//       this.baseMesh.position.y = 1.2;
//     }
//   }

//   /**
//    * Trigger a care action animation on the creature
//    * @param action - Type of care action (feed, play, attention)
//    */
//   public triggerCareAnimation(action: 'feed' | 'play' | 'attention'): void {
//     const duration = 1000; // 1 second animation
//     const startTime = Date.now();

//     const animate = () => {
//       const elapsed = Date.now() - startTime;
//       const progress = Math.min(elapsed / duration, 1);

//       switch (action) {
//         case 'feed':
//           // Eating motion - expand and contract
//           const eatScale = 1 + Math.sin(progress * Math.PI * 4) * 0.15;
//           this.baseMesh.scale.set(eatScale, eatScale * 0.9, eatScale);
//           // Glow brighter
//           this.baseMaterial.setGlowIntensity(1.0 + Math.sin(progress * Math.PI) * 0.8);
//           break;

//         case 'play':
//           // Bouncing/spinning motion
//           const bounceHeight = Math.sin(progress * Math.PI * 3) * 0.5;
//           this.baseMesh.position.y = 1.2 + bounceHeight;
//           this.baseMesh.rotation.y = progress * Math.PI * 2;
//           // Pulse glow with color changes
//           this.baseMaterial.setGlowIntensity(1.0 + Math.sin(progress * Math.PI * 6) * 0.6);
//           // Cycle through colors during play
//           const playColor = new THREE.Color().setHSL((progress * 2) % 1, 1.0, 0.5);
//           this.baseMaterial.setGlowColor(playColor);
//           break;

//         case 'attention':
//           // Happy pulse - gentle expansion
//           const happyScale = 1 + Math.sin(progress * Math.PI * 2) * 0.1;
//           this.baseMesh.scale.set(happyScale, happyScale, happyScale);
//           // Warm glow
//           this.baseMaterial.setGlowIntensity(1.0 + Math.sin(progress * Math.PI) * 1.0);
//           break;
//       }

//       if (progress < 1) {
//         requestAnimationFrame(animate);
//       } else {
//         // Reset to normal state
//         this.baseMesh.scale.set(1, 1, 1);
//         this.baseMesh.position.y = 1.2;
//         this.baseMesh.rotation.y = 0;
//         this.baseMaterial.setGlowIntensity(1.0);
//         this.baseMaterial.setGlowColor(new THREE.Color(0x00ffff)); // Reset to cyan
//       }
//     };

//     animate();
//   }

//   /**
//    * Dispose of all resources
//    */
//   public dispose(): void {
//     this.clearMutations();
//     this.baseGeometry.dispose();
//     this.baseMaterial.dispose();
//     this.scene.remove(this.baseMesh);
//   }
// }

//=====================================================

import * as THREE from 'three';
import { calculateRadiusOffset, generatePulsation } from '../utils/noise';
import { MutationData } from '../../shared/types/api';
import { generateMutationGeometry } from './mutation-geometry';
import { StatFeedback } from '../ui/stat-feedback';

/**
 * CreatureRenderer handles rendering the base creature blob and all applied mutations
 * Implements LOD (Level of Detail) system for mobile optimization
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
  private lodLevel: 'high' | 'medium' | 'low';
  private qualityMultiplier: number;

  constructor(scene: THREE.Scene, isMobile: boolean = false) {
    this.scene = scene;
    this.isMobile = isMobile;
    this.mutationMeshes = new Map();

    // Set LOD level based on device
    this.lodLevel = isMobile ? 'low' : 'high';
    this.qualityMultiplier = isMobile ? 0.5 : 1.0;

    // Initialize base mesh
    const { geometry, material, mesh } = this.createBaseMesh();
    this.baseGeometry = geometry;
    this.baseMaterial = material;
    this.baseMesh = mesh;

    // Store original vertex positions for animation
    const positionAttribute = this.baseGeometry.getAttribute('position');
    this.originalPositions = new Float32Array(positionAttribute.array);

    // Add creature to scene at center
    this.baseMesh.position.set(0, 5, 0); // At reasonable elevation
    this.scene.add(this.baseMesh);
  }

  /**
   * Create the base pulsating blob mesh with irregular organic geometry
   * Uses LOD-based segment count for optimal performance
   */
  private createBaseMesh(): {
    geometry: THREE.SphereGeometry;
    material: THREE.MeshPhongMaterial;
    mesh: THREE.Mesh;
  } {
    // LOD-based geometry complexity
    const segments = this.getSegmentCount();

    // Create sphere geometry with LOD-appropriate detail
    const geometry = new THREE.SphereGeometry(1, segments, segments);

    // Deform the sphere to create irregular blob shape with gentler noise
    const positionAttribute = geometry.getAttribute('position');
    for (let i = 0; i < positionAttribute.count; i++) {
      const x = positionAttribute.getX(i);
      const y = positionAttribute.getY(i);
      const z = positionAttribute.getZ(i);

      // Add initial noise with reduced amplitude for smoother surface
      const offset = calculateRadiusOffset(x, y, z, 0, 0.5, 0.08);

      const length = Math.sqrt(x * x + y * y + z * z);
      const scale = 1 + offset;

      positionAttribute.setXYZ(i, (x / length) * scale, (y / length) * scale, (z / length) * scale);
    }

    positionAttribute.needsUpdate = true;
    geometry.computeVertexNormals();

    // Create semi-gloss platinum material with subtle glow
    const material = new THREE.MeshPhongMaterial({
      color: 0xe5e4e2, // Platinum color
      emissive: 0xaaaaaa, // Subtle warm glow
      emissiveIntensity: 0.3,
      shininess: 80, // Semi-gloss finish
      specular: 0xffffff, // Bright specular highlights for metallic look
      flatShading: false, // Smooth shading for glossy look
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

      // Calculate radius offset using noise for smooth continuous motion with reduced amplitude
      const offset = calculateRadiusOffset(origX, origY, origZ, this.time, 0.6, 0.06);

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
   * Get segment count based on LOD level
   * High: 96 segments, Medium: 64 segments, Low: 48 segments
   */
  private getSegmentCount(): number {
    switch (this.lodLevel) {
      case 'high':
        return 96;
      case 'medium':
        return 64;
      case 'low':
        return 48;
      default:
        return 64;
    }
  }

  /**
   * Get the current LOD level
   */
  public getLODLevel(): 'high' | 'medium' | 'low' {
    return this.lodLevel;
  }

  /**
   * Set the LOD level dynamically
   * Useful for adaptive quality based on performance
   */
  public setLODLevel(level: 'high' | 'medium' | 'low'): void {
    if (this.lodLevel === level) return;

    this.lodLevel = level;
    this.qualityMultiplier = level === 'low' ? 0.5 : level === 'medium' ? 0.75 : 1.0;

    console.log(`LOD level changed to: ${level} (quality: ${this.qualityMultiplier})`);
  }

  /**
   * Get the quality multiplier for particle counts and effects
   */
  public getQualityMultiplier(): number {
    return this.qualityMultiplier;
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
    console.log('CreatureRenderer: Applying mutation:', mutation.id, mutation.traits);
    
    // Generate mutation geometry
    const mutationGeometry = generateMutationGeometry(mutation, randomnessFactor, this.isMobile);

    // Create mesh from geometry
    const mesh = new THREE.Mesh(mutationGeometry.geometry, mutationGeometry.material);

    // Apply position, scale, and rotation
    mesh.position.copy(mutationGeometry.position);
    mesh.scale.copy(mutationGeometry.scale);
    mesh.rotation.copy(mutationGeometry.rotation);

    console.log('CreatureRenderer: Mutation mesh created at position:', mesh.position);
    console.log('CreatureRenderer: Mutation mesh scale:', mesh.scale);

    // Enable shadows if not on mobile
    if (!this.isMobile) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }

    // Add to base mesh (so it moves with the creature)
    this.baseMesh.add(mesh);

    // Store reference
    this.mutationMeshes.set(mutation.id, mesh);
    
    console.log('CreatureRenderer: Total mutations now:', this.mutationMeshes.size);
  }

  /**
   * Animate a mutation appearing on the creature
   * @param mutationId - ID of the mutation to animate
   * @param duration - Duration of animation in milliseconds
   * @param showStatChanges - Whether to display stat change feedback
   * @returns Promise that resolves when animation completes
   */
  public async animateMutation(
    mutationId: string,
    duration: number = 2500,
    showStatChanges: boolean = true
  ): Promise<void> {
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
   * Display stat changes as floating numbers
   * @param statEffects - Object containing stat changes by category
   */
  public showStatChanges(statEffects: Record<string, Record<string, number>>): void {
    // Flatten all stat changes into a single object
    const allChanges: Record<string, number> = {};

    for (const [category, stats] of Object.entries(statEffects)) {
      for (const [statName, change] of Object.entries(stats)) {
        // Use category.statName as key for clarity
        const displayName = `${category}.${statName}`;
        allChanges[displayName] = change;
      }
    }

    // Display all stat changes
    StatFeedback.showMultipleStatChanges(allChanges);
  }

  /**
   * Apply a mutation and show stat changes
   * @param mutation - Mutation data to apply
   * @param randomnessFactor - Factor for randomness (0-1)
   * @param animate - Whether to animate the mutation appearance
   * @param showStats - Whether to show stat change feedback
   */
  public async applyMutationWithFeedback(
    mutation: MutationData,
    randomnessFactor: number,
    animate: boolean = true,
    showStats: boolean = true
  ): Promise<void> {
    // Apply the mutation geometry
    this.applyMutation(mutation, randomnessFactor);

    // Show stat changes if requested
    if (showStats && mutation.statEffects) {
      // Delay stat feedback slightly so it appears during animation
      setTimeout(() => {
        this.showStatChanges(mutation.statEffects);
      }, 500);
    }

    // Animate if requested
    if (animate) {
      await this.animateMutation(mutation.id);
    }
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
   * Update the creature's appearance based on care meter level
   * @param careMeter - Care meter value (0-100)
   */
  public updateCareMeterVisuals(careMeter: number): void {
    if (careMeter < 20) {
      // Sad/distressed appearance - dull colors, minimal pulsing
      this.baseMaterial.color.setHex(0x999999); // Dull gray
      this.baseMaterial.emissive.setHex(0x666666); // Very dim glow
      this.baseMaterial.emissiveIntensity = 0.1;
      // Creature appears to droop slightly
      this.baseMesh.position.y = 4.5; // 10 units above terrain (-5.5 + 10 = 4.5)
    } else if (careMeter < 50) {
      // Neutral appearance - normal colors, slower pulsing
      this.baseMaterial.color.setHex(0xcccccc); // Light gray
      this.baseMaterial.emissive.setHex(0x888888); // Dim glow
      this.baseMaterial.emissiveIntensity = 0.2;
      this.baseMesh.position.y = 4.6; // 10 units above terrain (-5.5 + 10 = 4.5, slight elevation for neutral)
    } else {
      // Happy appearance - bright colors, active pulsing
      this.baseMaterial.color.setHex(0xe5e4e2); // Platinum
      this.baseMaterial.emissive.setHex(0xaaaaaa); // Warm glow
      this.baseMaterial.emissiveIntensity = 0.3;
      this.baseMesh.position.y = 4.7; // 10 units above terrain (-5.5 + 10 = 4.5, slight elevation for happy)
    }
  }

  /**
   * Trigger a care action animation on the creature
   * @param action - Type of care action (feed, play, attention)
   */
  public triggerCareAnimation(action: 'feed' | 'play' | 'attention'): void {
    const duration = 1000; // 1 second animation
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      switch (action) {
        case 'feed':
          // Eating motion - expand and contract
          const eatScale = 1 + Math.sin(progress * Math.PI * 4) * 0.15;
          this.baseMesh.scale.set(eatScale, eatScale * 0.9, eatScale);
          // Glow brighter
          this.baseMaterial.emissiveIntensity = 0.5 + Math.sin(progress * Math.PI) * 0.4;
          break;

        case 'play':
          // Bouncing/spinning motion
          const bounceHeight = Math.sin(progress * Math.PI * 3) * 0.5;
          this.baseMesh.position.y = 4.7 + bounceHeight; // 10 units above terrain + bounce
          this.baseMesh.rotation.y = progress * Math.PI * 2;
          // Pulse glow
          this.baseMaterial.emissiveIntensity = 0.5 + Math.sin(progress * Math.PI * 6) * 0.3;
          break;

        case 'attention':
          // Happy pulse - gentle expansion
          const happyScale = 1 + Math.sin(progress * Math.PI * 2) * 0.1;
          this.baseMesh.scale.set(happyScale, happyScale, happyScale);
          // Warm glow
          this.baseMaterial.emissiveIntensity = 0.5 + Math.sin(progress * Math.PI) * 0.5;
          break;
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Reset to normal state
        this.baseMesh.scale.set(1, 1, 1);
        this.baseMesh.position.y = 4.7; // 10 units above terrain
        this.baseMesh.rotation.y = 0;
        this.baseMaterial.emissiveIntensity = 0.5;
      }
    };

    animate();
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
