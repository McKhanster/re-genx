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
    // Spotlight from directly above with 10ft radius coverage
    this.spotlight = new THREE.SpotLight(0xffffff, 2.5);
    this.spotlight.position.set(0, 12, 0);
    this.spotlight.angle = Math.PI / 3; // 60 degree cone for wider coverage
    this.spotlight.penumbra = 0.4; // Soft edge
    this.spotlight.decay = 1.5;
    this.spotlight.distance = 25;
    this.spotlight.castShadow = !this.mobile; // Disable shadows on mobile

    if (!this.mobile) {
      this.spotlight.shadow.mapSize.width = 1024;
      this.spotlight.shadow.mapSize.height = 1024;
      this.spotlight.shadow.camera.near = 1;
      this.spotlight.shadow.camera.far = 25;
    }

    this.scene.add(this.spotlight);
    this.scene.add(this.spotlight.target);

    // Add subtle ambient light so creature isn't completely black in shadows
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    this.scene.add(ambientLight);

    console.log('Lighting initialized - spotlight and ambient');
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
   * Dispose of resources
   */
  public dispose(): void {
    this.renderer.dispose();
  }
}
