import * as THREE from 'three';

// Import shader source files
import plasmaVertexShader from '../shaders/plasma-vertex.glsl?raw';
import plasmaFragmentShader from '../shaders/plasma-fragment.glsl?raw';

export interface PlasmaShaderOptions {
  baseColor?: THREE.Color;
  glowColor?: THREE.Color;
  glowIntensity?: number;
  plasmaSpeed?: number;
  cellEdgeWidth?: number;
  cellEdgeGlow?: number;
  opacity?: number;
  colorPalette?: THREE.Color[];
}

export class PlasmaShaderMaterial extends THREE.ShaderMaterial {
  private time: number = 0;
  private plasmaEnabled: boolean = true;

  constructor(options: PlasmaShaderOptions = {}) {
    // Default color palette: Cyan, Magenta, Purple, Teal
    const defaultPalette = [
      new THREE.Color(0x00ffff), // Cyan
      new THREE.Color(0xff00ff), // Magenta
      new THREE.Color(0x9d00ff), // Purple
      new THREE.Color(0x00ffaa), // Teal
    ];

    const uniforms = {
      uTime: { value: 0.0 },
      uBaseColor: { value: options.baseColor || new THREE.Color(0x4444ff) },
      uGlowColor: { value: options.glowColor || new THREE.Color(0x00ffff) },
      uGlowIntensity: { value: options.glowIntensity ?? 1.0 },
      uPlasmaSpeed: { value: options.plasmaSpeed ?? 0.3 },
      uCellEdgeWidth: { value: options.cellEdgeWidth ?? 0.05 },
      uCellEdgeGlow: { value: options.cellEdgeGlow ?? 0.8 },
      uOpacity: { value: options.opacity ?? 0.85 },
      uColorPalette: { value: options.colorPalette || defaultPalette },
    };

    super({
      uniforms,
      vertexShader: plasmaVertexShader,
      fragmentShader: plasmaFragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: true,
      depthTest: true,
    });

    // Check for shader compilation errors
    this.onBeforeCompile = (shader) => {
      // Store reference for error checking
      this.userData.shader = shader;
    };
  }

  /**
   * Update animation time
   * @param deltaTime Time elapsed since last frame in seconds
   */
  updateTime(deltaTime: number): void {
    if (this.plasmaEnabled && this.uniforms.uTime) {
      this.time += deltaTime;
      this.uniforms.uTime.value = this.time;
    }
  }

  /**
   * Set plasma color palette
   * @param colors Array of 4 colors [cyan, magenta, purple, teal]
   */
  setColorPalette(colors: THREE.Color[]): void {
    if (colors.length >= 4 && this.uniforms.uColorPalette) {
      this.uniforms.uColorPalette.value = colors.slice(0, 4);
    }
  }

  /**
   * Set glow intensity
   * @param intensity Glow intensity (0-3, typically 0.5-1.5)
   */
  setGlowIntensity(intensity: number): void {
    if (this.uniforms.uGlowIntensity) {
      this.uniforms.uGlowIntensity.value = Math.max(0, intensity);
    }
  }

  /**
   * Get current glow intensity
   * @returns Current glow intensity value
   */
  getGlowIntensity(): number {
    return this.uniforms.uGlowIntensity?.value ?? 1.0;
  }

  /**
   * Set cell edge glow intensity
   * @param intensity Edge glow intensity (0-2, typically 0.5-1.0)
   */
  setCellEdgeGlow(intensity: number): void {
    if (this.uniforms.uCellEdgeGlow) {
      this.uniforms.uCellEdgeGlow.value = Math.max(0, intensity);
    }
  }

  /**
   * Set plasma animation speed
   * @param speed Animation speed multiplier (0-1, typically 0.2-0.5)
   */
  setPlasmaSpeed(speed: number): void {
    if (this.uniforms.uPlasmaSpeed) {
      this.uniforms.uPlasmaSpeed.value = Math.max(0, speed);
    }
  }

  /**
   * Enable or disable plasma animation
   * @param enabled Whether plasma animation should be active
   */
  setPlasmaEnabled(enabled: boolean): void {
    this.plasmaEnabled = enabled;
    if (!enabled && this.uniforms.uPlasmaSpeed) {
      // Freeze time when disabled
      this.uniforms.uPlasmaSpeed.value = 0;
    }
  }

  /**
   * Set material opacity
   * @param opacity Opacity value (0-1, typically 0.7-0.9)
   */
  setOpacity(opacity: number): void {
    if (this.uniforms.uOpacity) {
      this.uniforms.uOpacity.value = Math.max(0, Math.min(1, opacity));
    }
  }

  /**
   * Set base color
   * @param color Base color for the material
   */
  setBaseColor(color: THREE.Color): void {
    if (this.uniforms.uBaseColor) {
      this.uniforms.uBaseColor.value = color;
    }
  }

  /**
   * Set glow color
   * @param color Glow color for edges and Fresnel effect
   */
  setGlowColor(color: THREE.Color): void {
    if (this.uniforms.uGlowColor) {
      this.uniforms.uGlowColor.value = color;
    }
  }

  /**
   * Get current animation time
   */
  getTime(): number {
    return this.time;
  }

  /**
   * Reset animation time to zero
   */
  resetTime(): void {
    this.time = 0;
    if (this.uniforms.uTime) {
      this.uniforms.uTime.value = 0;
    }
  }

  /**
   * Check if shader compiled successfully
   */
  hasCompilationErrors(): boolean {
    const shader = this.userData.shader;
    if (!shader) return false;

    // Check for compilation errors in diagnostics
    return !!(
      shader.diagnostics?.fragmentShader?.log ||
      shader.diagnostics?.vertexShader?.log
    );
  }

  /**
   * Get shader compilation error messages
   */
  getCompilationErrors(): string {
    const shader = this.userData.shader;
    if (!shader || !shader.diagnostics) return '';

    const errors: string[] = [];
    if (shader.diagnostics.fragmentShader?.log) {
      errors.push('Fragment Shader: ' + shader.diagnostics.fragmentShader.log);
    }
    if (shader.diagnostics.vertexShader?.log) {
      errors.push('Vertex Shader: ' + shader.diagnostics.vertexShader.log);
    }

    return errors.join('\n');
  }
}
