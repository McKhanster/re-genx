import * as THREE from 'three';
import { navigateTo } from '@devvit/client';
import { InitResponse } from '../shared/types/api';
import { SceneManager } from './scene/scene-manager';
import { CreatureRenderer } from './creature/creature-renderer';

const titleElement = document.getElementById('title') as HTMLHeadingElement;
const counterValueElement = document.getElementById('counter-value') as HTMLSpanElement;

const docsLink = document.getElementById('docs-link');
const playtestLink = document.getElementById('playtest-link');
const discordLink = document.getElementById('discord-link');

docsLink?.addEventListener('click', () => navigateTo('https://developers.reddit.com/docs'));
playtestLink?.addEventListener('click', () => navigateTo('https://www.reddit.com/r/Devvit'));
discordLink?.addEventListener('click', () => navigateTo('https://discord.com/invite/R7yu2wh9Qz'));

async function fetchInitialCount(): Promise<void> {
  try {
    const response = await fetch('/api/init');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = (await response.json()) as InitResponse;
    if (data.type === 'init') {
      counterValueElement.textContent = data.count.toString();
      titleElement.textContent = `Re-GenX Evolution`;
    } else {
      counterValueElement.textContent = 'Error';
    }
  } catch (err) {
    console.error('Error fetching initial count:', err);
    counterValueElement.textContent = 'Error';
  }
}

// Template function - will be used for future features
// async function updateCounter(action: 'increment' | 'decrement'): Promise<void> {
//   if (!currentPostId) return;
//   try {
//     const response = await fetch(`/api/${action}`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({}),
//     });
//     if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
//     const data = (await response.json()) as IncrementResponse | DecrementResponse;
//     counterValueElement.textContent = data.count.toString();
//   } catch (err) {
//     console.error(`Error ${action}ing count:`, err);
//   }
// }

// Initialize SceneManager
const canvas = document.getElementById('bg') as HTMLCanvasElement;
const sceneManager = new SceneManager(canvas);
const scene = sceneManager.getScene();

console.log('SceneManager initialized');
console.log('Mobile:', sceneManager.isMobile());
console.log('Quality multiplier:', sceneManager.getQualityMultiplier());

// Initialize CreatureRenderer
const creatureRenderer = new CreatureRenderer(scene, sceneManager.isMobile());

console.log('CreatureRenderer initialized with organic blob');

// Create ground plane within 10ft radius
const qualityMultiplier = sceneManager.getQualityMultiplier();
const groundSegments = Math.max(32, Math.floor(64 * qualityMultiplier));
const groundGeometry = new THREE.CircleGeometry(15, groundSegments);
const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0x444444,
  roughness: 0.8,
  metalness: 0.2,
});
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
groundMesh.rotation.x = -Math.PI / 2;
groundMesh.position.y = -0.3;
groundMesh.receiveShadow = !sceneManager.isMobile();
scene.add(groundMesh);

// Add grid helper to make ground more visible
const gridHelper = new THREE.GridHelper(20, 20, 0x666666, 0x333333);
gridHelper.position.y = -0.29;
scene.add(gridHelper);

console.log('Ground plane and grid added to scene');

// Camera rotation controls
let isDragging = false;
let previousMouseX = 0;

function handlePointerDown(event: PointerEvent): void {
  isDragging = true;
  previousMouseX = event.clientX;
}

function handlePointerMove(event: PointerEvent): void {
  if (!isDragging) return;

  const deltaX = event.clientX - previousMouseX;
  previousMouseX = event.clientX;

  // Rotate camera based on drag distance
  const rotationSpeed = 0.005;
  const newAngle = sceneManager.getCameraAngle() + deltaX * rotationSpeed;
  sceneManager.rotateCamera(newAngle);
}

function handlePointerUp(): void {
  isDragging = false;
}

window.addEventListener('pointerdown', handlePointerDown);
window.addEventListener('pointermove', handlePointerMove);
window.addEventListener('pointerup', handlePointerUp);
window.addEventListener('pointercancel', handlePointerUp);

// Animation loop with FPS throttling
let lastTime = performance.now();
const targetFrameTime = 1000 / sceneManager.getTargetFPS();

function animate(): void {
  requestAnimationFrame(animate);

  const currentTime = performance.now();
  const deltaTime = currentTime - lastTime;

  // Throttle to target FPS
  if (deltaTime < targetFrameTime) {
    return;
  }

  lastTime = currentTime - (deltaTime % targetFrameTime);

  // Animate creature with fluid organic motion
  const deltaTimeSeconds = deltaTime / 1000;
  creatureRenderer.pulsate(deltaTimeSeconds);

  sceneManager.render();
}

console.log('Starting animation loop');
void fetchInitialCount();
animate();
