import * as THREE from 'three';

/**
 * ForegroundRenderer creates abstract organic silhouette shapes
 * at the bottom of the viewport with parallax effect
 */
export class ForegroundRenderer {
  private scene: THREE.Scene;
  private foregroundGroup: THREE.Group;
  private shapes: THREE.Mesh[] = [];
  private enabled: boolean;
  private isMobile: boolean;

  constructor(scene: THREE.Scene, _camera: THREE.Camera, isMobile: boolean) {
    this.scene = scene;
    // _camera parameter kept for API consistency but not stored
    this.isMobile = isMobile;
    this.foregroundGroup = new THREE.Group();
    
    // Disable by default on mobile for performance
    this.enabled = !isMobile;

    this.createForegroundShapes();
    
    if (this.enabled) {
      this.scene.add(this.foregroundGroup);
    }
  }

  /**
   * Create abstract organic shapes for the foreground
   */
  private createForegroundShapes(): void {
    // Position foreground at camera near plane
    this.foregroundGroup.position.z = -0.5;

    // Create multiple organic shapes at bottom of viewport
    const shapeCount = this.isMobile ? 3 : 5;
    const baseY = -2; // Bottom 20% of viewport

    for (let i = 0; i < shapeCount; i++) {
      const shape = this.createOrganicShape(i, shapeCount);
      shape.position.y = baseY + Math.random() * 0.5;
      shape.position.x = (i / (shapeCount - 1)) * 6 - 3; // Spread across viewport
      
      this.shapes.push(shape);
      this.foregroundGroup.add(shape);
    }
  }

  /**
   * Create a single organic shape with edge highlights
   */
  private createOrganicShape(_index: number, _total: number): THREE.Mesh {
    // Create irregular organic geometry
    const geometry = this.generateOrganicGeometry();
    
    // Create material with dark base and edge highlights
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uBaseColor: { value: new THREE.Color(0x0a0a15) }, // Very dark blue
        uEdgeColor1: { value: new THREE.Color(0x00ffff) }, // Cyan
        uEdgeColor2: { value: new THREE.Color(0xff00ff) }, // Magenta
        uOpacity: { value: 0.4 },
        uEdgeWidth: { value: 0.15 }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewDirection;
        varying vec2 vUv;

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vViewDirection = normalize(cameraPosition - worldPosition.xyz);
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uBaseColor;
        uniform vec3 uEdgeColor1;
        uniform vec3 uEdgeColor2;
        uniform float uOpacity;
        uniform float uEdgeWidth;

        varying vec3 vNormal;
        varying vec3 vViewDirection;
        varying vec2 vUv;

        void main() {
          // Calculate edge intensity using Fresnel effect
          float fresnel = pow(1.0 - abs(dot(vViewDirection, vNormal)), 2.0);
          
          // Mix cyan and magenta based on position
          vec3 edgeColor = mix(uEdgeColor1, uEdgeColor2, vUv.x);
          
          // Apply edge highlight
          vec3 color = mix(uBaseColor, edgeColor, fresnel * uEdgeWidth);
          
          gl_FragColor = vec4(color, uOpacity);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geometry, material);
    
    // Random rotation for variety
    mesh.rotation.z = (Math.random() - 0.5) * 0.3;
    
    // Random scale for variety
    const scale = 0.8 + Math.random() * 0.4;
    mesh.scale.set(scale, scale, scale);

    return mesh;
  }

  /**
   * Generate organic, irregular geometry
   */
  private generateOrganicGeometry(): THREE.BufferGeometry {
    const shape = new THREE.Shape();
    
    // Create irregular organic outline
    const points = 8;
    const radius = 0.5;
    
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const r = radius * (0.7 + Math.random() * 0.6);
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      
      if (i === 0) {
        shape.moveTo(x, y);
      } else {
        // Use bezier curves for smooth organic shapes
        const prevAngle = ((i - 1) / points) * Math.PI * 2;
        const prevR = radius * (0.7 + Math.random() * 0.6);
        const cpx = Math.cos((angle + prevAngle) / 2) * prevR * 1.2;
        const cpy = Math.sin((angle + prevAngle) / 2) * prevR * 1.2;
        shape.quadraticCurveTo(cpx, cpy, x, y);
      }
    }

    const geometry = new THREE.ShapeGeometry(shape, 32);
    return geometry;
  }

  /**
   * Update parallax effect based on camera rotation
   * @param cameraAngle - Current camera rotation angle in radians
   */
  public updateParallax(cameraAngle: number): void {
    if (!this.enabled) return;

    // Apply parallax at 0.4x camera rotation (opposite direction)
    this.foregroundGroup.rotation.y = -cameraAngle * 0.4;
  }

  /**
   * Enable or disable foreground rendering
   * @param enabled - Whether to show foreground
   */
  public setEnabled(enabled: boolean): void {
    if (this.enabled === enabled) return;

    this.enabled = enabled;

    if (enabled) {
      this.scene.add(this.foregroundGroup);
    } else {
      this.scene.remove(this.foregroundGroup);
    }
  }

  /**
   * Check if foreground is currently enabled
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Cleanup resources
   */
  public dispose(): void {
    this.shapes.forEach(shape => {
      shape.geometry.dispose();
      if (shape.material instanceof THREE.Material) {
        shape.material.dispose();
      }
    });
    
    this.scene.remove(this.foregroundGroup);
    this.shapes = [];
  }
}
