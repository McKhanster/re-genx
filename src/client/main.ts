import { navigateTo } from '@devvit/client';
import { InitResponse, BiomeType } from '../shared/types/api';
import { SceneManager } from './scene/scene-manager';
import { CreatureRenderer } from './creature/creature-renderer';
import { BiomeRenderer } from './biome/biome-renderer';
import { HUDDrawer } from './ui/hud-drawer';
import { CareActionUI } from './ui/care-actions';

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
    console.log('Initialized:', data);
  } catch (err) {
    console.error('Error fetching initial count:', err);
  }
}

/**
 * Load or create familiar for the current user
 */
async function initializeFamiliar(): Promise<void> {
  try {
    // Try to fetch existing familiar
    const response = await fetch('/api/familiar/state');
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.familiar) {
        console.log('Loaded existing familiar:', data.familiar);
        // Update UI with familiar data
        hudDrawer.updateCareMeter(data.familiar.careMeter);
        hudDrawer.updateEvolutionPoints(data.familiar.evolutionPoints);
        hudDrawer.updateAge(data.familiar.age);
        hudDrawer.updateStats(data.familiar.stats);
        
        // Update biome
        biomeRenderer.setBiome(data.familiar.biome);
        
        // Update creature visuals
        creatureRenderer.updateCareMeterVisuals(data.familiar.careMeter);
        
        // Apply mutations if any
        if (data.familiar.mutations && data.familiar.mutations.length > 0) {
          console.log(`Applying ${data.familiar.mutations.length} mutations to familiar`);
          // TODO: Apply mutations to creature renderer
        }
        
        return;
      }
    }
    
    // If no familiar exists, create one
    console.log('No familiar found, creating new familiar...');
    const createResponse = await fetch('/api/familiar/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!createResponse.ok) {
      throw new Error(`Failed to create familiar: ${createResponse.status}`);
    }
    
    const createData = await createResponse.json();
    console.log('Created new familiar:', createData.familiar);
    
    // Update UI with new familiar data
    hudDrawer.updateCareMeter(createData.familiar.careMeter);
    hudDrawer.updateEvolutionPoints(createData.familiar.evolutionPoints);
    hudDrawer.updateAge(createData.familiar.age);
    hudDrawer.updateStats(createData.familiar.stats);
    
    // Update biome
    biomeRenderer.setBiome(createData.familiar.biome);
    
  } catch (err) {
    console.error('Error initializing familiar:', err);
    // Show error to user
    alert('Failed to load your familiar. Please refresh the page.');
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

// Debug shadow settings
const renderer = sceneManager.getRenderer();
const spotlight = sceneManager.getSpotlight();
console.log('Shadow map enabled:', renderer.shadowMap.enabled);
console.log('Spotlight casts shadow:', spotlight.castShadow);
if (!sceneManager.isMobile()) {
  console.log('Shadow map size:', spotlight.shadow.mapSize);
  console.log('Shadow camera near/far:', spotlight.shadow.camera.near, spotlight.shadow.camera.far);
} else {
  console.warn('⚠️ SHADOWS ARE DISABLED ON MOBILE DEVICES');
}

// Initialize CreatureRenderer
const creatureRenderer = new CreatureRenderer(scene, sceneManager.isMobile());

console.log('CreatureRenderer initialized with organic blob');
console.log('Creature casts shadow:', creatureRenderer.getBaseMesh().castShadow);
console.log('Creature receives shadow:', creatureRenderer.getBaseMesh().receiveShadow);

// Initialize BiomeRenderer
const biomeRenderer = new BiomeRenderer(scene, sceneManager.isMobile());

// Set initial biome (randomly selected for demo)
const biomes: BiomeType[] = ['jungle', 'rocky_mountain', 'desert', 'ocean', 'cave'];
const randomIndex = Math.floor(Math.random() * biomes.length);
const randomBiome = biomes[randomIndex] || 'jungle'; // Fallback to jungle
biomeRenderer.setBiome(randomBiome);

console.log(`BiomeRenderer initialized with biome: ${randomBiome}`);
console.log('Ground receives shadow:', biomeRenderer.getGroundMesh().receiveShadow);
console.log('Ground position:', biomeRenderer.getGroundMesh().position);
const groundMaterial = biomeRenderer.getGroundMesh().material;
if (!Array.isArray(groundMaterial)) {
  console.log('Ground material:', groundMaterial.type);
}

// Initialize HUD Drawer
const hudDrawer = new HUDDrawer();

// Update age and countdown (demo values for now)
hudDrawer.updateAge(0);
hudDrawer.updateCountdown('15:00');
hudDrawer.updateNextEvolution('15:00');

// Initialize familiar care values (demo values)
hudDrawer.updateCareMeter(100);
hudDrawer.updateEvolutionPoints(0);

// Initialize Care Action UI
const careActionUI = new CareActionUI();

// Set up care action callback to update HUD
careActionUI.onAction((action, result) => {
  console.log(`Care action ${action} performed:`, result);
  // Update care meter and evolution points
  hudDrawer.updateCareMeter(result.careMeter);
  hudDrawer.updateEvolutionPoints(result.evolutionPoints);
  // Update creature appearance based on care meter
  creatureRenderer.updateCareMeterVisuals(result.careMeter);
});

// Set up animation trigger callback
careActionUI.onAnimationTrigger((action) => {
  console.log(`Triggering ${action} animation on familiar`);
  // TODO: Trigger specific animations on creature renderer based on action type
  // For now, just make the creature pulse more intensely
  creatureRenderer.triggerCareAnimation(action);
});

console.log('CareActionUI initialized');

// Demo stats (will be replaced with real data from API)
const demoStats = {
  mobility: { speed: 50, agility: 50, endurance: 50 },
  senses: { vision: 50, hearing: 50, smell: 50 },
  survival: { attack: 50, defense: 50, stealth: 50 },
  cognition: { intelligence: 50, social: 50, adaptability: 50 },
  vitals: { health: 100, population: 100, mutationRate: 50 },
};

hudDrawer.updateStats(demoStats);

console.log('HUDDrawer initialized with demo data');

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

// Initialize familiar (load existing or create new)
void initializeFamiliar();

animate();
