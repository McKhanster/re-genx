import * as THREE from 'three';

/**
 * Detects if the current device is mobile based on user agent
 */
export function isMobile(): boolean {
  const userAgent =
    navigator.userAgent ||
    navigator.vendor ||
    (window as unknown as { opera?: string }).opera ||
    '';
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
    userAgent.toLowerCase()
  );
}

/**
 * SceneManager handles the Three.js scene, camera, lighting, and rendering
 * for the Re-GenX creature evolution game.
 */
export class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private spotlight!: THREE.SpotLight;
  private fog!: THREE.Fog;
  private cameraAngle: number = 0;
  private cameraRadius: number = 8;
  private cameraHeight: number = 1.2; // 4 feet above ground (parallel view)
  private mobile: boolean;
  private targetFPS: number;

  constructor(canvas: HTMLCanvasElement) {
    this.mobile = isMobile();
    this.targetFPS = this.mobile ? 30 : 60;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !this.mobile, // Disable antialiasing on mobile for performance
      powerPreference: this.mobile ? 'low-power' : 'high-performance',
    });

    this.initScene();
    this.initCamera();
    this.initLighting();
    this.initRenderer();
    this.setupResizeHandler();
  }

  /**
   * Initialize the scene with background and fog for darkness beyond 10ft radius
   */
  private initScene(): void {
    this.scene.background = new THREE.Color(0x000000);

    // Add fog to create darkness beyond 10ft radius
    // 10ft ≈ 3 meters in our scene units
    // Fog starts at 10 meters and fully dark at 20 meters for better visibility
    this.fog = new THREE.Fog(0x000000, 10, 20);
    this.scene.fog = this.fog;

    console.log('Scene initialized with background and fog');
  }

  /**
   * Initialize camera position and orientation
   */
  private initCamera(): void {
    // Position camera at initial angle
    this.updateCameraPosition();
    this.camera.lookAt(0, 0, 0);
  }

  /**
   * Set up spotlight from directly above with proper angle and intensity
   */
  private initLighting(): void {
    // Single spotlight from directly above - the only light source
    this.spotlight = new THREE.SpotLight(0xffffff, 15.0); // Reduced intensity for better shadow contrast
    this.spotlight.position.set(0, 12, 0);
    this.spotlight.angle = Math.PI / 3; // Narrower cone for more focused light
    this.spotlight.penumbra = 0.3; // Softer edge for more natural shadows
    this.spotlight.decay = 1.0; // More natural decay
    this.spotlight.distance = 30;
    this.spotlight.castShadow = !this.mobile; // Disable shadows on mobile

    if (!this.mobile) {
      // Higher resolution shadow map for better quality
      this.spotlight.shadow.mapSize.width = 2048;
      this.spotlight.shadow.mapSize.height = 2048;
      // Shadow camera settings - must capture from light (y=12) to ground (y=-0.5)
      this.spotlight.shadow.camera.near = 0.5;
      this.spotlight.shadow.camera.far = 25;
      // Adjust shadow bias - negative values can help with shadow acne
      this.spotlight.shadow.bias = -0.001;
      // Normalize bias helps with peter-panning
      this.spotlight.shadow.normalBias = 0.02;
    }

    // Add subtle ambient light - too much washes out shadows
    const ambientLight = new THREE.AmbientLight(0x404040, 0.2);
    this.scene.add(ambientLight);

    // Add spotlight and target to scene first
    this.scene.add(this.spotlight);
    this.scene.add(this.spotlight.target);
    
    // Then set target position - points at origin (0, 0, 0) - directly downward
    this.spotlight.target.position.set(0, 0, 0);
    this.spotlight.target.updateMatrixWorld();

    console.log('Lighting initialized - bright spotlight with ambient fill');
    if (!this.mobile) {
      console.log('Shadow settings:', {
        castShadow: this.spotlight.castShadow,
        mapSize: this.spotlight.shadow.mapSize,
        bias: this.spotlight.shadow.bias,
        normalBias: this.spotlight.shadow.normalBias,
      });
    }
  }

  /**
   * Initialize renderer with appropriate settings
   */
  private initRenderer(): void {
    const pixelRatio = this.mobile
      ? Math.min(window.devicePixelRatio, 1.5) // Limit pixel ratio on mobile
      : window.devicePixelRatio;

    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.shadowMap.enabled = !this.mobile;
    if (!this.mobile) {
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
  }

  /**
   * Set up window resize handler
   */
  private setupResizeHandler(): void {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  /**
   * Update camera position based on current angle
   */
  private updateCameraPosition(): void {
    this.camera.position.x = Math.sin(this.cameraAngle) * this.cameraRadius;
    this.camera.position.z = Math.cos(this.cameraAngle) * this.cameraRadius;
    this.camera.position.y = this.cameraHeight;
    // Look slightly below blob center to see ground plane
    this.camera.lookAt(0, 0.5, 0);
  }

  /**
   * Rotate camera around the creature (360 degrees)
   * @param angle - Angle in radians
   */
  public rotateCamera(angle: number): void {
    this.cameraAngle = angle;
    this.updateCameraPosition();
  }

  /**
   * Get current camera angle
   */
  public getCameraAngle(): number {
    return this.cameraAngle;
  }

  /**
   * Render the scene
   */
  public render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Get the Three.js scene for adding objects
   */
  public getScene(): THREE.Scene {
    return this.scene;
  }

  /**
   * Get the camera
   */
  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  /**
   * Get the renderer
   */
  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  /**
   * Check if running on mobile device
   */
  public isMobile(): boolean {
    return this.mobile;
  }

  /**
   * Get target FPS for this device
   */
  public getTargetFPS(): number {
    return this.targetFPS;
  }

  /**
   * Get quality multiplier for particle counts and geometry complexity
   * Returns 1.0 for desktop, 0.5 for mobile
   */
  public getQualityMultiplier(): number {
    return this.mobile ? 0.5 : 1.0;
  }

  /**
   * Get the spotlight for debugging
   */
  public getSpotlight(): THREE.SpotLight {
    return this.spotlight;
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    this.renderer.dispose();
  }
}
