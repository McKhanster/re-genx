import * as THREE from 'three';
import { PostProcessingManager } from '../rendering/post-processing-manager';
import { BackgroundGradientRenderer } from '../effects/background-gradient-renderer';
import { ForegroundRenderer } from '../effects/foreground-renderer';
import { PerformanceMonitor } from '../utils/performance-monitor';
import { ProceduralElements } from './pc-scene';

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
  private postProcessing: PostProcessingManager;
  private backgroundGradient: BackgroundGradientRenderer;
  private foreground: ForegroundRenderer;
  private performanceMonitor: PerformanceMonitor;
  private proceduralElements: ProceduralElements;
  private proceduralTerrain: THREE.Mesh | null = null;
  private proceduralRocks: THREE.InstancedMesh | null = null;
  private proceduralVegetation: THREE.Group | null = null;
  private spotlight!: THREE.SpotLight;
  private fog!: THREE.Fog;
  private cameraAngle: number = Math.PI / 4; // Horizontal rotation (azimuth) - start at 45 degrees
  private cameraElevation: number = Math.PI / 3; // Vertical angle (elevation) - 60 degrees, looking up slightly
  private cameraRadius: number = 5;
  private mobile: boolean;
  private targetFPS: number;
  private lastPlasmaSpeed: number = 1.0;

  constructor(canvas: HTMLCanvasElement) {
    this.mobile = isMobile();
    this.targetFPS = this.mobile ? 30 : 60;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);

    console.log(
      'SceneManager: Camera created at:',
      this.camera.position.x,
      this.camera.position.y,
      this.camera.position.z
    );
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !this.mobile, // Disable antialiasing on mobile for performance
      powerPreference: this.mobile ? 'low-power' : 'high-performance',
    });

    this.initScene();
    this.initCamera();
    this.initLighting();
    this.initRenderer();

    // Initialize post-processing after renderer is ready
    this.postProcessing = new PostProcessingManager(
      this.renderer,
      this.scene,
      this.camera,
      this.mobile
    );

    // Initialize background gradient renderer (disabled for daylight)
    // this.backgroundGradient = new BackgroundGradientRenderer(this.scene);
    // Create a dummy background gradient for compatibility
    this.backgroundGradient = {
      dispose: () => {},
    } as any;

    // Initialize foreground renderer (disabled for daylight)
    // this.foreground = new ForegroundRenderer(this.scene, this.camera, this.mobile);
    // Create a dummy foreground renderer for compatibility
    this.foreground = {
      updateParallax: () => {},
      setEnabled: () => {},
      dispose: () => {},
    } as any;

    // Initialize performance monitor
    this.performanceMonitor = new PerformanceMonitor(this.targetFPS);

    // Initialize procedural elements
    this.proceduralElements = new ProceduralElements();
    this.addProceduralTerrain('alien'); // Default to alien theme

    this.setupResizeHandler();
  }

  /**
   * Initialize the scene with daylight background and natural fog
   */
  private initScene(): void {
    // Natural daylight sky color
    this.scene.background = new THREE.Color(0x87ceeb); // Sky blue

    // Light fog for atmospheric depth
    this.fog = new THREE.Fog(0xb0c4de, 50, 200); // Light steel blue fog, much further out
    this.scene.fog = this.fog;

    console.log('Scene initialized with daylight background and natural fog');
  }

  /**
   * Initialize camera position and orientation
   */
  private initCamera(): void {
    // Position camera at initial angle - updateCameraPosition handles lookAt too
    console.log('SceneManager: initCamera called');
    this.updateCameraPosition();
    console.log(
      'SceneManager: Camera positioned at:',
      this.camera.position.x,
      this.camera.position.y,
      this.camera.position.z
    );
  }

  /**
   * Set up natural daylight lighting
   */
  private initLighting(): void {
    // Directional light simulating the sun
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunLight.position.set(50, 100, 50); // Sun position (high and angled)
    sunLight.castShadow = !this.mobile; // Enable shadows on desktop

    if (!this.mobile) {
      // Shadow settings for directional light
      sunLight.shadow.mapSize.width = 2048;
      sunLight.shadow.mapSize.height = 2048;
      sunLight.shadow.camera.near = 0.5;
      sunLight.shadow.camera.far = 200;
      // Larger shadow camera for terrain coverage
      sunLight.shadow.camera.left = -50;
      sunLight.shadow.camera.right = 50;
      sunLight.shadow.camera.top = 50;
      sunLight.shadow.camera.bottom = -50;
      sunLight.shadow.bias = -0.0005;
      sunLight.shadow.normalBias = 0.02;
    }

    this.scene.add(sunLight);

    // Ambient light for natural fill lighting
    // const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Bright white ambient
    // this.scene.add(ambientLight);

    // Hemisphere light for sky/ground color variation
    const hemisphereLight = new THREE.HemisphereLight(
      0x87ceeb, // Sky color (light blue)
      0x8b7355, // Ground color (earth brown)
      0.4
    );
    this.scene.add(hemisphereLight);

    // Store sun light reference for compatibility (some code expects spotlight)
    this.spotlight = sunLight as any; // Type assertion for compatibility

    console.log('Natural daylight lighting initialized');
    if (!this.mobile) {
      console.log('Shadow settings:', {
        castShadow: sunLight.castShadow,
        mapSize: sunLight.shadow.mapSize,
        bias: sunLight.shadow.bias,
        normalBias: sunLight.shadow.normalBias,
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
    this.renderer.setClearColor(0x87ceeb, 1); // Sky blue clear color
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
      this.postProcessing.resize(window.innerWidth, window.innerHeight);
    });
  }

  /**
   * Update camera position based on current angle and elevation (spherical coordinates)
   */
  private updateCameraPosition(): void {
    // Camera orbits around creature at (0, 4.7, 0) using spherical coordinates
    const creatureY = 4.7; // 10 units above terrain (-5.5 + 10 = 4.5, using happy position as default)
    const cameraDistance = 5;

    // Convert spherical coordinates to cartesian
    const horizontalRadius = Math.sin(this.cameraElevation) * cameraDistance;

    this.camera.position.x = Math.sin(this.cameraAngle) * horizontalRadius;
    this.camera.position.y = creatureY + Math.cos(this.cameraElevation) * cameraDistance;
    this.camera.position.z = Math.cos(this.cameraAngle) * horizontalRadius;

    // Debug logging
    console.log(
      'Camera position:',
      this.camera.position.x.toFixed(2),
      this.camera.position.y.toFixed(2),
      this.camera.position.z.toFixed(2)
    );
    console.log(
      'Camera angle:',
      this.cameraAngle.toFixed(2),
      'elevation:',
      this.cameraElevation.toFixed(2)
    );

    // Always look at the creature center
    this.camera.lookAt(0, creatureY, 0);
  }

  /**
   * Rotate camera around the creature horizontally (360 degrees)
   * @param angle - Horizontal angle in radians (azimuth)
   */
  public rotateCamera(angle: number): void {
    this.cameraAngle = angle;
    this.updateCameraPosition();
  }

  /**
   * Set camera elevation (vertical angle)
   * @param elevation - Elevation angle in radians (0 = top, PI/2 = horizon, PI = bottom)
   */
  public setCameraElevation(elevation: number): void {
    // Clamp elevation to upper hemisphere (0 to PI/2)
    this.cameraElevation = Math.max(0.1, Math.min(Math.PI / 2, elevation));
    this.updateCameraPosition();
  }

  /**
   * Set camera position using spherical coordinates
   * @param azimuth - Horizontal angle in radians
   * @param elevation - Vertical angle in radians (0 = top, PI/2 = horizon)
   */
  public setCameraSpherical(azimuth: number, elevation: number): void {
    this.cameraAngle = azimuth;
    this.setCameraElevation(elevation);
  }

  /**
   * Get current camera horizontal angle
   */
  public getCameraAngle(): number {
    return this.cameraAngle;
  }

  /**
   * Get current camera elevation
   */
  public getCameraElevation(): number {
    return this.cameraElevation;
  }

  /**
   * Update all renderers with delta time and apply performance-based quality adjustments
   * @param deltaTime - Time elapsed since last frame in seconds
   */
  public update(deltaTime: number): void {
    // Update foreground parallax based on camera rotation
    this.foreground.updateParallax(this.cameraAngle);

    // Update performance monitor
    this.performanceMonitor.update(deltaTime);

    // Apply performance-based adjustments each frame
    const settings = this.performanceMonitor.getEffectSettings();

    // Connect PerformanceMonitor to PostProcessingManager for bloom intensity adjustment
    this.postProcessing.setBloomIntensity(settings.bloomIntensity);

    // Connect PerformanceMonitor to ForegroundRenderer for enable/disable
    this.foreground.setEnabled(settings.foregroundEnabled);

    // Store plasma speed setting for CreatureRenderer to use
    // (CreatureRenderer will need to call getPlasmaSpeed() to get this value)
    this.lastPlasmaSpeed = settings.plasmaSpeed;
  }

  /**
   * Render the scene with post-processing
   */
  public render(): void {
    this.postProcessing.render();
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
   * Get the sun light (stored as spotlight for compatibility)
   */
  public getSpotlight(): THREE.DirectionalLight {
    return this.spotlight as any;
  }

  /**
   * Set the sun light intensity
   */
  public setSunLightIntensity(intensity: number): void {
    const sunLight = this.spotlight as any as THREE.DirectionalLight;
    if (sunLight) {
      sunLight.intensity = intensity;
    }
  }

  /**
   * Set creature brightness by adjusting emissive intensity
   */
  public setCreatureBrightness(brightness: number): void {
    // This will need to be called on the creature renderer
    // For now, we'll store it and apply it when the creature is available
    (this as any).creatureBrightness = brightness;
  }

  /**
   * Get stored creature brightness
   */
  public getCreatureBrightness(): number {
    return (this as any).creatureBrightness || 1.0;
  }

  /**
   * Get the post-processing manager
   */
  public getPostProcessing(): PostProcessingManager {
    return this.postProcessing;
  }

  /**
   * Get the background gradient renderer
   */
  public getBackgroundGradient(): BackgroundGradientRenderer {
    return this.backgroundGradient;
  }

  /**
   * Get the foreground renderer
   */
  public getForeground(): ForegroundRenderer {
    return this.foreground;
  }

  /**
   * Get the performance monitor
   */
  public getPerformanceMonitor(): PerformanceMonitor {
    return this.performanceMonitor;
  }

  /**
   * Get current plasma animation speed based on performance
   */
  public getPlasmaSpeed(): number {
    return this.lastPlasmaSpeed;
  }

  /**
   * Add procedural terrain elements to the scene
   * @param theme - Theme for the procedural elements ('jungle', 'desert', 'alien')
   */
  public addProceduralTerrain(theme: 'jungle' | 'desert' | 'alien'): void {
    // Remove existing procedural elements
    this.removeProceduralTerrain();

    // Create new terrain
    this.proceduralTerrain = this.proceduralElements.createTerrain(theme, 40, 40, 64, this.mobile);
    this.scene.add(this.proceduralTerrain);

    // Create rocks
    this.proceduralRocks = this.proceduralElements.createRocks(
      theme,
      this.proceduralTerrain,
      this.mobile
    );
    this.scene.add(this.proceduralRocks);

    // Create vegetation
    this.proceduralVegetation = this.proceduralElements.createVegetation(
      theme,
      this.proceduralTerrain,
      this.mobile
    );
    this.scene.add(this.proceduralVegetation);

    console.log(`Procedural terrain added with theme: ${theme}`);
  }

  /**
   * Remove procedural terrain elements from the scene
   */
  public removeProceduralTerrain(): void {
    if (this.proceduralTerrain) {
      this.scene.remove(this.proceduralTerrain);
      this.proceduralTerrain.geometry.dispose();
      if (this.proceduralTerrain.material instanceof THREE.Material) {
        this.proceduralTerrain.material.dispose();
      }
      this.proceduralTerrain = null;
    }

    if (this.proceduralRocks) {
      this.scene.remove(this.proceduralRocks);
      this.proceduralRocks.geometry.dispose();
      if (this.proceduralRocks.material instanceof THREE.Material) {
        this.proceduralRocks.material.dispose();
      }
      this.proceduralRocks = null;
    }

    if (this.proceduralVegetation) {
      this.scene.remove(this.proceduralVegetation);
      this.proceduralVegetation.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (child.material instanceof THREE.Material) {
            child.material.dispose();
          }
        }
      });
      this.proceduralVegetation = null;
    }
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    this.postProcessing.dispose();
    this.backgroundGradient.dispose();
    this.foreground.dispose();
    this.removeProceduralTerrain();
    this.renderer.dispose();
  }
}
