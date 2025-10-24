// Plasma Vertex Shader
// Calculates view direction and normal for Fresnel effect

varying vec3 vNormal;
varying vec3 vViewDirection;
varying vec3 vWorldPosition;
varying vec2 vUv;

void main() {
  // Transform normal to world space
  vNormal = normalize(normalMatrix * normal);
  
  // Calculate world position
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  
  // Calculate view direction (from vertex to camera)
  vViewDirection = normalize(cameraPosition - worldPosition.xyz);
  
  // Pass UV coordinates
  vUv = uv;
  
  // Standard vertex transformation
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
