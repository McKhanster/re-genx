import * as THREE from 'three';

/**
 * VoronoiShaderMaterial creates a cellular/organic material using Voronoi patterns
 * Based on the alien orb shader with customizable colors and animation
 */
export class VoronoiShaderMaterial extends THREE.ShaderMaterial {
  private timeUniform: { value: number };
  private bFactorUniform: { value: number };
  private pcurveHandleUniform: { value: number };
  private baseColorUniform: { value: THREE.Color };
  private edgeColorUniform: { value: THREE.Color };
  private scaleUniform: { value: number };
  private speedUniform: { value: number };

  constructor(options: {
    baseColor?: THREE.Color;
    edgeColor?: THREE.Color;
    bFactor?: number;
    pcurveHandle?: number;
    scale?: number;
    speed?: number;
    transparent?: boolean;
    opacity?: number;
  } = {}) {
    // Initialize uniforms
    const uniforms = {
      u_time: { value: 0.0 },
      u_bFactor: { value: options.bFactor ?? 2.0 },
      u_pcurveHandle: { value: options.pcurveHandle ?? 0.5 },
      u_baseColor: { value: options.baseColor ?? new THREE.Color(0x0066ff) },
      u_edgeColor: { value: options.edgeColor ?? new THREE.Color(0xff3388) },
      u_scale: { value: options.scale ?? 4.0 },
      u_speed: { value: options.speed ?? 0.5 },
    };

    // Vertex shader - simple pass-through with world position
    const vertexShader = `
      varying vec3 vPosition;
      varying vec3 vWorldPosition;
      void main() {
        vPosition = position;
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    // Fragment shader with Voronoi cellular pattern
    const fragmentShader = `
      uniform float u_time;
      uniform float u_bFactor;
      uniform float u_pcurveHandle;
      uniform vec3 u_baseColor;
      uniform vec3 u_edgeColor;
      uniform float u_scale;
      uniform float u_speed;
      varying vec3 vPosition;
      varying vec3 vWorldPosition;

      // Hash function for pseudo-random values
      vec3 hash3d(vec3 p) {
        p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
                 dot(p, vec3(269.5, 183.3, 246.1)),
                 dot(p, vec3(113.5, 271.9, 124.6)));
        return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
      }

      // Power curve function for color adjustment
      float pcurve(float x, float a, float b) {
        float k = pow(a + b, a + b) / (pow(a, a) * pow(b, b));
        return k * pow(x, a) * pow(1.0 - x, b);
      }

      // Voronoi function that creates cellular patterns
      vec2 voronoi(in vec3 x, in float time) {
        vec3 n = floor(x);
        vec3 f = fract(x);
        vec4 m = vec4(8.0);
        
        // Check neighboring cells
        for (int k = -1; k <= 1; k++) {
          for (int j = -1; j <= 1; j++) {
            for (int i = -1; i <= 1; i++) {
              vec3 g = vec3(float(i), float(j), float(k));
              vec3 o = hash3d(n + g);
              // Animate the cell centers with time
              vec3 r = g + (0.5 + 0.5 * sin(vec3(time) + 6.2831 * o)) - f;
              float d = dot(r, r);
              if (d < m.x) {
                m = vec4(d, o);
              }
            }
          }
        }
        return vec2(m.x, m.y + m.z + m.w);
      }

      void main() {
        // Use world position for consistent pattern across deformed geometry
        vec3 samplePos = vWorldPosition * u_scale;
        
        // Get Voronoi cell information
        vec2 res = voronoi(samplePos, u_time * u_speed);
        float dist = sqrt(res.x);
        
        // Create base pattern
        vec3 mycolor = vec3(pow(dist, 1.5));

        // Apply blue factor enhancement
        float blue = mycolor.b * u_bFactor;
        mycolor.b = blue * (1.0 - smoothstep(0.8, 1.0, dist));

        // Apply power curve to red and green channels
        mycolor.r = pcurve(mycolor.r, 4.0, u_pcurveHandle);
        mycolor.g = pcurve(mycolor.g, 4.0, u_pcurveHandle);

        // Mix between base color (cell centers) and edge color (cell boundaries)
        float mixFactor = smoothstep(0.1, 0.4, dist);
        vec3 color = mix(u_baseColor, u_edgeColor, mixFactor);
        
        // Apply the Voronoi pattern as a modulation
        color *= (0.8 + 0.4 * mycolor);
        
        // Add subtle global pulse
        color *= (1.0 + 0.2 * sin(u_time * 2.0));

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    super({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: options.transparent ?? true,
      opacity: options.opacity ?? 0.85,
      side: THREE.DoubleSide,
    });

    // Store uniform references for easy updates
    this.timeUniform = uniforms.u_time;
    this.bFactorUniform = uniforms.u_bFactor;
    this.pcurveHandleUniform = uniforms.u_pcurveHandle;
    this.baseColorUniform = uniforms.u_baseColor;
    this.edgeColorUniform = uniforms.u_edgeColor;
    this.scaleUniform = uniforms.u_scale;
    this.speedUniform = uniforms.u_speed;
  }

  /**
   * Update the time uniform for animation
   * @param deltaTime - Time since last frame in seconds
   */
  public updateTime(deltaTime: number): void {
    this.timeUniform.value += deltaTime;
  }

  /**
   * Set the time directly
   * @param time - Time value in seconds
   */
  public setTime(time: number): void {
    this.timeUniform.value = time;
  }

  /**
   * Set the base color (cell centers)
   * @param color - THREE.Color for cell centers
   */
  public setBaseColor(color: THREE.Color): void {
    this.baseColorUniform.value.copy(color);
  }

  /**
   * Set the edge color (cell boundaries)
   * @param color - THREE.Color for cell boundaries
   */
  public setEdgeColor(color: THREE.Color): void {
    this.edgeColorUniform.value.copy(color);
  }

  /**
   * Set the blue factor for blue channel enhancement
   * @param factor - Multiplier for blue channel (default: 2.0)
   */
  public setBlueFactor(factor: number): void {
    this.bFactorUniform.value = factor;
  }

  /**
   * Set the power curve handle for color adjustment
   * @param handle - Power curve parameter (default: 0.5)
   */
  public setPCurveHandle(handle: number): void {
    this.pcurveHandleUniform.value = handle;
  }

  /**
   * Set the pattern scale
   * @param scale - Scale multiplier for the Voronoi pattern (default: 4.0)
   */
  public setScale(scale: number): void {
    this.scaleUniform.value = scale;
  }

  /**
   * Set the animation speed
   * @param speed - Speed multiplier for time-based animation (default: 0.5)
   */
  public setSpeed(speed: number): void {
    this.speedUniform.value = speed;
  }

  /**
   * Get current time value
   */
  public getTime(): number {
    return this.timeUniform.value;
  }

  /**
   * Reset time to zero
   */
  public resetTime(): void {
    this.timeUniform.value = 0;
  }
}
