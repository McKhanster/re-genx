import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Setup scene, camera, renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1, 3);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

// Uniforms for the shader
const uniforms = {
  u_time: { value: 0.0 },
  u_bFactor: { value: 2.0 }, // Adjust for blue emphasis
  u_pcurveHandle: { value: 0.5 }, // Handle for pcurve
};

// Vertex Shader
const vertexShader = `
  varying vec3 vPosition;
  void main() {
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Fragment Shader with Voronoi for cellular pattern and pulsing via time-animated points
const fragmentShader = `
  uniform float u_time;
  uniform float u_bFactor;
  uniform float u_pcurveHandle;
  varying vec3 vPosition;

  vec3 hash3d(vec3 p) {
    p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
             dot(p, vec3(269.5, 183.3, 246.1)),
             dot(p, vec3(113.5, 271.9, 124.6)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }

  float pcurve(float x, float a, float b) {
    float k = pow(a + b, a + b) / (pow(a, a) * pow(b, b));
    return k * pow(x, a) * pow(1.0 - x, b);
  }

  vec2 voronoi(in vec3 x, in float time) {
    vec3 n = floor(x);
    vec3 f = fract(x);
    vec4 m = vec4(8.0);
    for (int k = -1; k <= 1; k++) {
      for (int j = -1; j <= 1; j++) {
        for (int i = -1; i <= 1; i++) {
          vec3 g = vec3(float(i), float(j), float(k));
          vec3 o = hash3d(n + g);
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
    vec2 res = voronoi(vPosition * 4.0, u_time * 0.5); // Adjust scale and speed for more cells and pulsing
    float dist = sqrt(res.x);
    vec3 mycolor = vec3(pow(dist, 1.5));

    float blue = mycolor.b * u_bFactor;
    mycolor.b = blue * (1.0 - smoothstep(0.8, 1.0, dist));

    mycolor.r = pcurve(mycolor.r, 4.0, u_pcurveHandle);
    mycolor.g = pcurve(mycolor.g, 4.0, u_pcurveHandle);

    // Adjust colors to match blue interiors with pink outlines
    vec3 baseColor = vec3(0.1, 0.4, 0.9); // Blue for bubble centers
    vec3 edgeColor = vec3(1.0, 0.2, 0.8); // Pink for outlines
    float mixFactor = smoothstep(0.1, 0.4, dist); // Low dist (centers) = blue, high (edges) = pink
    vec3 color = mix(baseColor, edgeColor, mixFactor) * (1.0 + 0.5 * sin(u_time)); // Add subtle global pulse

    gl_FragColor = vec4(color, 1.0);
  }
`;

// Create orb material and mesh
const geometry = new THREE.SphereGeometry(1, 64, 64);
const material = new THREE.ShaderMaterial({
  uniforms,
  vertexShader,
  fragmentShader,
  transparent: true,
  side: THREE.DoubleSide,
});

// Orb mesh
const orb = new THREE.Mesh(geometry, material);
scene.add(orb);

// Halo for outer glow
const haloVertexShader = `
  varying vec3 vertexNormal;
  void main() {
    vertexNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const haloFragmentShader = `
  varying vec3 vertexNormal;
  void main() {
    float intensity = pow(0.7 - dot(vertexNormal, vec3(0.0, 0.0, 1.0)), 4.0);
    gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
  }
`;

const haloMaterial = new THREE.ShaderMaterial({
  vertexShader: haloVertexShader,
  fragmentShader: haloFragmentShader,
  blending: THREE.AdditiveBlending,
  side: THREE.BackSide,
});

const halo = new THREE.Mesh(geometry, haloMaterial);
halo.scale.set(1.2, 1.2, 1.2);
scene.add(halo);

// Star particles for background
const starCount = 2000;
const starGeometry = new THREE.BufferGeometry();
const starPositions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount * 3; i++) {
  starPositions[i] = (Math.random() - 0.5) * 20;
}
starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.02 });
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// Ground plane for rocky base
const groundGeometry = new THREE.PlaneGeometry(10, 10, 128, 128);
const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x111133, side: THREE.DoubleSide });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -1.2;
scene.add(ground);

// Resize handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
function animate(time: number) {
  requestAnimationFrame(animate);

  // Update time uniform for pulsing in shader
  uniforms.u_time.value = time / 1000;

  // Additional scale pulsing
  const pulse = 1 + 0.05 * Math.sin(time / 1000);
  orb.scale.set(pulse, pulse, pulse);
  halo.scale.set(1.2 * pulse, 1.2 * pulse, 1.2 * pulse);

  // Rotate orb slowly
  orb.rotation.y += 0.001;

  controls.update();
  renderer.render(scene, camera);
}

animate(0);
