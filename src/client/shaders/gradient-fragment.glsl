uniform vec3 uTopColor;
uniform vec3 uBottomColor;

varying vec3 vWorldPosition;

void main() {
  // Normalize the vertical position (-1 to 1)
  float gradientFactor = (vWorldPosition.y + 300.0) / 600.0;
  gradientFactor = clamp(gradientFactor, 0.0, 1.0);
  
  // Interpolate between top and bottom colors
  vec3 color = mix(uBottomColor, uTopColor, gradientFactor);
  
  gl_FragColor = vec4(color, 1.0);
}
