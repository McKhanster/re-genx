import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

/**
 * PostProcessingManager handles the post-processing pipeline with bloom and other effects
 * Implements mobile-specific optimizations for performance
 */
export class PostProcessingManager {
  private composer: EffectComposer;
  private bloomPass: UnrealBloomPass;
  private renderPass: RenderPass;
  private isMobile: boolean;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    isMobile: boolean
  ) {
    this.isMobile = isMobile;

    // Create render target with appropriate resolution
    const renderTarget = this.createRenderTarget();

    // Initialize EffectComposer with custom render target
    this.composer = new EffectComposer(renderer, renderTarget);

    // Add base scene render pass
    this.renderPass = new RenderPass(scene, camera);
    this.composer.addPass(this.renderPass);

    // Add bloom pass with device-appropriate settings
    this.bloomPass = this.createBloomPass();
    this.composer.addPass(this.bloomPass);

    console.log('PostProcessingManager initialized', {
      isMobile,
      bloomStrength: this.bloomPass.strength,
      bloomRadius: this.bloomPass.radius,
      bloomThreshold: this.bloomPass.threshold,
      renderTargetSize: renderTarget.width + 'x' + renderTarget.height,
    });
  }

  /**
   * Create render target with appropriate resolution for device
   */
  private createRenderTarget(): THREE.WebGLRenderTarget {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Mobile: Use half resolution for better performance
    const scale = this.isMobile ? 0.5 : 1.0;

    return new THREE.WebGLRenderTarget(width * scale, height * scale, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.HalfFloatType,
    });
  }

  /**
   * Create bloom pass with device-appropriate settings
   */
  private createBloomPass(): UnrealBloomPass {
    const resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);

    // Subtle bloom for atmospheric glow without overwhelming brightness
    // Desktop: Moderate bloom strength
    // Mobile: Reduced strength for performance and subtlety
    const strength = this.isMobile ? 0.8 : 1.2;
    const radius = 0.4;
    const threshold = 0.5; // Higher threshold = only bright areas bloom

    const bloomPass = new UnrealBloomPass(resolution, strength, radius, threshold);

    // Mobile: Reduce bloom samples for better performance
    if (this.isMobile) {
      // UnrealBloomPass uses mipmaps internally, reducing resolution helps
      bloomPass.resolution.multiplyScalar(0.5);
    }

    return bloomPass;
  }

  /**
   * Render scene with post-processing
   */
  public render(): void {
    this.composer.render();
  }

  /**
   * Adjust bloom intensity (0-3)
   */
  public setBloomIntensity(intensity: number): void {
    this.bloomPass.strength = Math.max(0, Math.min(3, intensity));
  }

  /**
   * Enable/disable bloom effect
   */
  public setBloomEnabled(enabled: boolean): void {
    this.bloomPass.enabled = enabled;
  }

  /**
   * Get current bloom intensity
   */
  public getBloomIntensity(): number {
    return this.bloomPass.strength;
  }

  /**
   * Handle window resize
   */
  public resize(width: number, height: number): void {
    // Update composer size
    const scale = this.isMobile ? 0.5 : 1.0;
    this.composer.setSize(width * scale, height * scale);

    // Update bloom resolution
    this.bloomPass.resolution.set(width, height);
  }

  /**
   * Cleanup resources
   */
  public dispose(): void {
    this.composer.renderTarget1.dispose();
    this.composer.renderTarget2.dispose();
  }
}
