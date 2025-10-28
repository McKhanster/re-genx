import * as THREE from 'three';

/**
 * HaloEffect creates an outer glow effect around a mesh
 * Based on the halo shader from the alien orb
 */
export class HaloEffect {
  private haloMesh: THREE.Mesh;
  private haloMaterial: THREE.ShaderMaterial;
  private targetMesh: THREE.Mesh;

  constructor(targetMesh: THREE.Mesh, options: {
    color?: THREE.Color;
    intensity?: number;
    scale?: number;
    opacity?: number;
  } = {}) {
    this.targetMesh = targetMesh;

    // Halo vertex shader
    const haloVertexShader = `
      varying vec3 vertexNormal;
      void main() {
        vertexNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    // Halo fragment shader
    const haloFragmentShader = `
      uniform vec3 u_color;
      uniform float u_intensity;
      uniform float u_opacity;
      varying vec3 vertexNormal;
      
      void main() {
        float intensity = pow(0.7 - dot(vertexNormal, vec3(0.0, 0.0, 1.0)), 4.0);
        intensity *= u_intensity;
        gl_FragColor = vec4(u_color, u_opacity) * intensity;
      }
    `;

    // Create halo material
    this.haloMaterial = new THREE.ShaderMaterial({
      uniforms: {
        u_color: { value: options.color ?? new THREE.Color(0x3366ff) },
        u_intensity: { value: options.intensity ?? 1.0 },
        u_opacity: { value: options.opacity ?? 1.0 },
      },
      vertexShader: haloVertexShader,
      fragmentShader: haloFragmentShader,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });

    // Create halo mesh using the same geometry as target
    this.haloMesh = new THREE.Mesh(targetMesh.geometry, this.haloMaterial);
    
    // Scale up slightly for halo effect
    const scale = options.scale ?? 1.2;
    this.haloMesh.scale.set(scale, scale, scale);

    // Add to the target mesh so it follows it
    targetMesh.add(this.haloMesh);
  }

  /**
   * Update halo color
   * @param color - New halo color
   */
  public setColor(color: THREE.Color): void {
    const colorUniform = this.haloMaterial.uniforms.u_color;
    if (colorUniform && colorUniform.value) {
      (colorUniform.value as THREE.Color).copy(color);
    }
  }

  /**
   * Update halo intensity
   * @param intensity - Intensity multiplier
   */
  public setIntensity(intensity: number): void {
    const intensityUniform = this.haloMaterial.uniforms.u_intensity;
    if (intensityUniform) {
      intensityUniform.value = intensity;
    }
  }

  /**
   * Update halo opacity
   * @param opacity - Opacity value (0-1)
   */
  public setOpacity(opacity: number): void {
    const opacityUniform = this.haloMaterial.uniforms.u_opacity;
    if (opacityUniform) {
      opacityUniform.value = opacity;
    }
  }

  /**
   * Update halo scale
   * @param scale - Scale multiplier relative to target mesh
   */
  public setScale(scale: number): void {
    this.haloMesh.scale.set(scale, scale, scale);
  }

  /**
   * Get the halo mesh for direct manipulation
   */
  public getMesh(): THREE.Mesh {
    return this.haloMesh;
  }

  /**
   * Remove halo from target mesh and dispose resources
   */
  public dispose(): void {
    this.targetMesh.remove(this.haloMesh);
    this.haloMaterial.dispose();
  }
}
