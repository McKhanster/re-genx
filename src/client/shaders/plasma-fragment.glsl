// Plasma Fragment Shader
// Implements Fresnel glow, Voronoi cell boundaries, and animated plasma colors

varying vec3 vNormal;
varying vec3 vViewDirection;
varying vec3 vWorldPosition;
varying vec2 vUv;

uniform float uTime;
uniform vec3 uBaseColor;
uniform vec3 uGlowColor;
uniform float uGlowIntensity;
uniform float uPlasmaSpeed;
uniform float uCellEdgeWidth;
uniform float uCellEdgeGlow;
uniform float uOpacity;
uniform vec3 uColorPalette[4]; // Cyan, magenta, purple, teal

// 3D Voronoi noise function for cell pattern detection
vec2 voronoi3D(vec3 p) {
  vec3 n = floor(p);
  vec3 f = fract(p);
  
  float minDist = 1.0;
  float secondMinDist = 1.0;
  
  // Search neighboring cells
  for(int k = -1; k <= 1; k++) {
    for(int j = -1; j <= 1; j++) {
      for(int i = -1; i <= 1; i++) {
        vec3 g = vec3(float(i), float(j), float(k));
        
        // Random point in cell
        vec3 o = vec3(
          fract(sin(dot(n + g, vec3(12.9898, 78.233, 45.164))) * 43758.5453),
          fract(sin(dot(n + g, vec3(39.346, 11.135, 83.155))) * 43758.5453),
          fract(sin(dot(n + g, vec3(73.156, 52.235, 09.151))) * 43758.5453)
        );
        
        vec3 r = g + o - f;
        float d = length(r);
        
        if(d < minDist) {
          secondMinDist = minDist;
          minDist = d;
        } else if(d < secondMinDist) {
          secondMinDist = d;
        }
      }
    }
  }
  
  return vec2(minDist, secondMinDist);
}

void main() {
  // Fresnel effect for edge glow
  float fresnel = pow(1.0 - max(dot(vViewDirection, vNormal), 0.0), 3.0);
  
  // Voronoi cell pattern
  vec3 voronoiPos = vWorldPosition * 3.0; // Scale for cell size
  vec2 voronoiResult = voronoi3D(voronoiPos);
  float cellDist = voronoiResult.x;
  float cellEdge = voronoiResult.y - voronoiResult.x;
  
  // Detect cell boundaries
  float cellBoundary = smoothstep(0.0, uCellEdgeWidth, cellEdge);
  
  // Multi-frequency plasma color animation
  float time = uTime * uPlasmaSpeed;
  
  // Layer 1: Slow wave
  float plasma1 = sin(vUv.x * 3.0 + time * 0.5) * 0.5 + 0.5;
  
  // Layer 2: Medium wave
  float plasma2 = sin(vUv.y * 4.0 + time * 0.3) * 0.5 + 0.5;
  
  // Layer 3: Fast combined wave
  float plasma3 = sin((vUv.x + vUv.y) * 2.0 + time * 0.7) * 0.5 + 0.5;
  
  // Additional spherical wave based on world position
  float plasma4 = sin(length(vWorldPosition) * 2.0 - time * 0.4) * 0.5 + 0.5;
  
  // Combine plasma layers
  vec3 plasmaColor = mix(uColorPalette[0], uColorPalette[1], plasma1); // Cyan to Magenta
  plasmaColor = mix(plasmaColor, uColorPalette[2], plasma2 * 0.5); // Add Purple
  plasmaColor = plasmaColor * (0.7 + plasma3 * 0.3); // Modulate brightness
  plasmaColor = mix(plasmaColor, uColorPalette[3], plasma4 * 0.2); // Add Teal
  
  // Ensure high saturation (0.7-1.0)
  float saturation = 0.85 + plasma3 * 0.15;
  plasmaColor = mix(vec3(dot(plasmaColor, vec3(0.299, 0.587, 0.114))), plasmaColor, saturation);
  
  // Base color with plasma - ensure minimum brightness
  vec3 finalColor = mix(uBaseColor, plasmaColor, 0.8);
  
  // Add cell edge glow
  float edgeGlow = (1.0 - cellBoundary) * uCellEdgeGlow;
  finalColor += uGlowColor * edgeGlow;
  
  // Add Fresnel edge glow
  finalColor += uGlowColor * fresnel * uGlowIntensity;
  
  // Inner glow effect (subsurface scattering approximation)
  float innerGlow = pow(1.0 - cellDist * 0.5, 2.0) * 0.3;
  finalColor += plasmaColor * innerGlow;
  
  // Ensure minimum brightness (never completely black)
  finalColor = max(finalColor, vec3(0.2));
  
  // Output with opacity
  gl_FragColor = vec4(finalColor, uOpacity);
}
