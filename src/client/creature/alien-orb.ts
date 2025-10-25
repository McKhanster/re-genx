/*
Alien Orb Generator for Re-GenX
Integrated orb that can be placed next to the creature in the main scene
*/

import * as THREE from 'three';

const vertexShader = `
  varying vec3 vNormal;
  varying vec3 vPos;
  uniform float time;

  float noise(vec3 p) {
    return fract(sin(dot(p, vec3(12.9898, 78.233, 54.53))) * 43758.5453);
  }

  void main() {
    vNormal = normal;
    vPos = position;

    float n = noise(normal * 3.0 + time * 0.6);
    float breathing = sin(time * 0.8) * 0.05; // smooth breathing motion

    vec3 displaced = position * (1.0 + breathing) + normal * n * 0.25;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

const fragmentShader = `
  varying vec3 vNormal;
  varying vec3 vPos;
  uniform float time;

  void main() {
    vec3 n = normalize(vNormal);
    float intensity = pow(abs(dot(n, vec3(0.0, 0.0, 1.0))), 2.0);

    float glow = sin(vPos.x * 3.0 + time) * 0.5 + 0.5;
    vec3 color = mix(vec3(0.0, 0.4, 1.0), vec3(1.0, 0.2, 1.0), glow);

    float rim = pow(1.0 - max(dot(n, vec3(0.0, 0.0, 1.0)), 0.0), 3.0);

    vec3 finalColor = color * (0.4 + 0.6 * intensity) + vec3(1.0, 0.8, 1.0) * rim * 0.8;
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

/**
 * AlienOrb class for integration into Re-GenX scene
 * Creates a breathing, glowing orb that can be positioned next to the creature
 */
export class AlienOrb {
  private orb: THREE.Mesh;
  private startTime: number;
  private isMobile: boolean;

  constructor(scene: THREE.Scene, isMobile: boolean = false) {
    this.isMobile = isMobile;
    this.startTime = performance.now();

    // Create shader material with breathing animation
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        time: { value: 0.0 }
      },
      side: THREE.DoubleSide,
      transparent: true,
    });

    // Create geometry with appropriate detail level for device
    const detail = isMobile ? 3 : 5;
    const size = isMobile ? 0.8 : 1.2;
    const geometry = new THREE.IcosahedronGeometry(size, detail);
    
    this.orb = new THREE.Mesh(geometry, material);
    
    // Position orb next to creature (3 units to the right, same height)
    this.orb.position.set(4, 1.2, 0);
    
    // Enable shadows if not on mobile
    if (!isMobile) {
      this.orb.castShadow = true;
      this.orb.receiveShadow = true;
    }

    scene.add(this.orb);
  }

  /**
   * Update the orb animation
   * @param deltaTime - Time elapsed since last frame in seconds
   */
  public update(deltaTime: number): void {
    const elapsed = (performance.now() - this.startTime) / 1000;
    const material = this.orb.material as THREE.ShaderMaterial;
    
    if (material.uniforms.time) {
      material.uniforms.time.value = elapsed;
    }
    
    // Slow rotation
    this.orb.rotation.y += deltaTime * 0.5;
    
    // Subtle floating motion
    this.orb.position.y = 1.2 + Math.sin(elapsed * 0.8) * 0.1;
  }

  /**
   * Get the orb mesh for external manipulation
   */
  public getMesh(): THREE.Mesh {
    return this.orb;
  }

  /**
   * Set orb position
   */
  public setPosition(x: number, y: number, z: number): void {
    this.orb.position.set(x, y, z);
  }

  /**
   * Set orb visibility
   */
  public setVisible(visible: boolean): void {
    this.orb.visible = visible;
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    this.orb.geometry.dispose();
    if (this.orb.material instanceof THREE.Material) {
      this.orb.material.dispose();
    }
    if (this.orb.parent) {
      this.orb.parent.remove(this.orb);
    }
  }
}

/**
 * Legacy function for standalone orb scene (kept for compatibility)
 */
export function createAlienOrb(containerId = 'app') {
  const el = document.getElementById(containerId);
  if (!el) throw new Error('Container not found');
  
  // Create a simple scene for standalone use
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, el.clientWidth / el.clientHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  
  renderer.setSize(el.clientWidth, el.clientHeight);
  el.appendChild(renderer.domElement);
  
  camera.position.set(0, 0, 4);
  
  // Add lighting
  const ambient = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambient);
  const pointLight = new THREE.PointLight(0xffffff, 1.2);
  pointLight.position.set(3, 3, 3);
  scene.add(pointLight);
  
  // Create orb
  const orb = new AlienOrb(scene, false);
  orb.setPosition(0, 0, 0); // Center it for standalone view
  
  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    orb.update(0.016); // ~60fps
    renderer.render(scene, camera);
  }
  
  animate();
  
  return { scene, camera, renderer, orb };
}
