import * as THREE from 'three';
import gradientVertexShader from '../shaders/gradient-vertex.glsl?raw';
import gradientFragmentShader from '../shaders/gradient-fragment.glsl?raw';

/**
 * Renders an atmospheric gradient background using a large inverted sphere
 * Creates a vertical gradient from dark blue (top) to dark purple-red (bottom)
 */
export class BackgroundGradientRenderer {
  private mesh: THREE.Mesh;
  private material: THREE.ShaderMaterial;

  constructor(scene: THREE.Scene) {
    // Create shader material with gradient colors
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTopColor: { value: new THREE.Color(10 / 255, 15 / 255, 30 / 255) }, // Dark blue
        uBottomColor: { value: new THREE.Color(60 / 255, 20 / 255, 40 / 255) }, // Dark purple-red
      },
      vertexShader: gradientVertexShader,
      fragmentShader: gradientFragmentShader,
      side: THREE.BackSide, // Render inside of sphere
      depthWrite: false, // Don't write to depth buffer (render behind everything)
      depthTest: true, // Still test depth to avoid rendering over objects
    });

    // Create large inverted sphere (radius 300 units)
    const geometry = new THREE.SphereGeometry(300, 32, 32);
    this.mesh = new THREE.Mesh(geometry, this.material);

    // Set render order to ensure it renders first (behind everything)
    this.mesh.renderOrder = -1;

    // Add to scene
    scene.add(this.mesh);
  }

  /**
   * Update gradient colors
   * @param topColor - Color at the top of the gradient (dark blue)
   * @param bottomColor - Color at the bottom of the gradient (dark purple-red)
   */
  setGradientColors(topColor: THREE.Color, bottomColor: THREE.Color): void {
    this.material.uniforms.uTopColor.value.copy(topColor);
    this.material.uniforms.uBottomColor.value.copy(bottomColor);
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}
