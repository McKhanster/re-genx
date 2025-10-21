import { navigateTo } from '@devvit/client';
import { InitResponse, BiomeType, MutationTriggerResponse, FamiliarState } from '../shared/types/api';
import { SceneManager } from './scene/scene-manager';
import { CreatureRenderer } from './creature/creature-renderer';
import { BiomeRenderer } from './biome/biome-renderer';
import { HUDDrawer } from './ui/hud-drawer';
import { CareActionUI } from './ui/care-actions';
import { MutationChoiceUI } from './ui/mutation-choice';
import { PrivacyDialog } from './ui/privacy-dialog';
import { notificationSystem } from './ui/notification-system';
import { removalWarning } from './ui/removal-warning';
import { apiClient } from './api/api-client';
import { soundManager } from './audio/sound-manager';
import { SoundSettings } from './ui/sound-settings';

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

// ============================================================================
// State Management
// ============================================================================

let currentFamiliarState: FamiliarState | null = null;
let pollingIntervalId: number | null = null;

/**
 * Update UI components with familiar state
 */
function updateUIWithFamiliarState(familiar: FamiliarState): void {
  // Update HUD
  hudDrawer.updateCareMeter(familiar.careMeter);
  hudDrawer.updateEvolutionPoints(familiar.evolutionPoints);
  hudDrawer.updateAge(familiar.age);
  hudDrawer.updateStats(familiar.stats);
  
  // Update mutation choice button
  mutationChoiceUI.updateEvolveButton(familiar.evolutionPoints);
  
  // Update creature visuals based on care meter
  creatureRenderer.updateCareMeterVisuals(familiar.careMeter);
  
  // Show neglect warning if care meter is low
  if (familiar.careMeter < 20) {
    showNeglectWarning(familiar.careMeter);
  } else {
    hideNeglectWarning();
  }
}

/**
 * Check if familiar state has changed and update accordingly
 */
function handleStateChanges(newState: FamiliarState): void {
  if (!currentFamiliarState) {
    // First load - update everything
    updateUIWithFamiliarState(newState);
    currentFamiliarState = newState;
    return;
  }
  
  // Check for biome change
  if (newState.biome !== currentFamiliarState.biome) {
    console.log(`Biome changed: ${currentFamiliarState.biome} -> ${newState.biome}`);
    biomeRenderer.setBiome(newState.biome);
    
    // Play new ambient sound for biome
    const ambientMap: Record<BiomeType, string> = {
      jungle: 'ambient_jungle',
      rocky_mountain: 'ambient_rocky_mountain',
      desert: 'ambient_desert',
      ocean: 'ambient_ocean',
      cave: 'ambient_cave',
    };
    const ambientSound = ambientMap[newState.biome];
    if (ambientSound) {
      soundManager.playAmbient(ambientSound as any);
    }
  }
  
  // Check for new mutations
  if (newState.mutations.length > currentFamiliarState.mutations.length) {
    const newMutations = newState.mutations.slice(currentFamiliarState.mutations.length);
    console.log(`New mutations detected: ${newMutations.length}`);
    
    // Show notification for each new mutation
    for (const mutation of newMutations) {
      console.log('New mutation:', mutation);
      
      // Calculate stat changes for notification
      const statChanges: Record<string, number> = {};
      if (mutation.statEffects) {
        for (const [category, effects] of Object.entries(mutation.statEffects)) {
          for (const [stat, value] of Object.entries(effects as Record<string, number>)) {
            statChanges[`${category}.${stat}`] = value;
          }
        }
      }
      
      // Show appropriate notification based on mutation type
      if (mutation.type === 'controlled') {
        const traitLabel = mutation.traits?.[0]?.category || 'Unknown';
        notificationSystem.showControlledMutationNotification(traitLabel, statChanges);
      } else {
        const mutationType = mutation.traits?.[0]?.category || 'Random';
        notificationSystem.showMutationNotification(mutationType, statChanges);
      }
      
      // Play mutation sound effect
      soundManager.playSound('mutation', 0.6);
    }
    
    // TODO: Apply new mutations to creature renderer with animation
  }
  
  // Check for stat changes
  const statsChanged = JSON.stringify(newState.stats) !== JSON.stringify(currentFamiliarState.stats);
  if (statsChanged) {
    console.log('Stats changed, updating HUD');
  }
  
  // Check for care meter warnings
  if (newState.careMeter < 20 && (!currentFamiliarState || currentFamiliarState.careMeter >= 20)) {
    // Care meter just dropped below 20
    notificationSystem.showCareMeterWarning(newState.careMeter);
    // Play sad sound when care meter drops below 20
    soundManager.playSound('sad', 0.5);
  }
  
  // Check for removal warning (care meter at 0)
  if (newState.careMeter === 0) {
    // Calculate hours since last care
    const hoursSinceLastCare = (Date.now() - newState.lastCareTime) / (1000 * 60 * 60);
    const hoursRemaining = Math.max(0, 24 - hoursSinceLastCare);
    
    // Show removal warning if not already visible and there's time remaining
    if (hoursRemaining > 0 && !removalWarning.isVisible()) {
      removalWarning.show(
        hoursRemaining,
        () => {
          // On "Care Now" - open HUD menu to show care actions
          hudDrawer.toggleMenu();
        },
        () => {
          // On dismiss - just close the warning
          console.log('Removal warning dismissed');
        }
      );
    } else if (hoursRemaining <= 0) {
      // Familiar has been removed - show special removal message
      showFamiliarRemovedMessage();
    }
  } else if (newState.careMeter > 0 && removalWarning.isVisible()) {
    // Care meter is no longer 0, hide removal warning
    removalWarning.hide();
  }
  
  // Update UI with new state
  updateUIWithFamiliarState(newState);
  
  // Update current state
  currentFamiliarState = newState;
}

/**
 * Show neglect warning overlay
 */
function showNeglectWarning(careMeter: number): void {
  let warningDiv = document.getElementById('neglect-warning');
  
  if (!warningDiv) {
    warningDiv = document.createElement('div');
    warningDiv.id = 'neglect-warning';
    warningDiv.className = 'neglect-warning';
    warningDiv.innerHTML = `
      <div class="warning-icon">⚠️</div>
      <div class="warning-text">Your familiar needs attention!</div>
      <div class="warning-meter">Care Meter: ${careMeter}</div>
    `;
    document.body.appendChild(warningDiv);
  } else {
    // Update meter value
    const meterDiv = warningDiv.querySelector('.warning-meter');
    if (meterDiv) {
      meterDiv.textContent = `Care Meter: ${careMeter}`;
    }
  }
}

/**
 * Hide neglect warning overlay
 */
function hideNeglectWarning(): void {
  const warningDiv = document.getElementById('neglect-warning');
  if (warningDiv) {
    warningDiv.remove();
  }
}

/**
 * Refresh familiar state from server using APIClient
 */
async function refreshFamiliarState(): Promise<void> {
  try {
    const data = await apiClient.getFamiliarState();
    
    if (data.familiar) {
      handleStateChanges(data.familiar);
    }
  } catch (err) {
    console.error('Error refreshing familiar state:', err);
    // Don't show error notification for polling failures - APIClient handles it
  }
}

/**
 * Start polling for state updates every 5 seconds
 */
function startStatePolling(): void {
  if (pollingIntervalId !== null) {
    return; // Already polling
  }
  
  console.log('Starting state polling (every 5 seconds)');
  pollingIntervalId = window.setInterval(() => {
    void refreshFamiliarState();
  }, 5000);
}

/**
 * Stop polling for state updates
 */
function stopStatePolling(): void {
  if (pollingIntervalId !== null) {
    clearInterval(pollingIntervalId);
    pollingIntervalId = null;
    console.log('Stopped state polling');
  }
}

/**
 * Show privacy consent dialog and handle user choice
 */
function showPrivacyDialog(): void {
  privacyDialog.show(async (optIn: boolean) => {
    console.log(`User ${optIn ? 'opted in' : 'opted out'} of personality reflection`);
    
    try {
      // Submit privacy preference to server
      const response = await apiClient.setPrivacyOptIn(optIn);
      console.log('Privacy preference saved:', response);
      
      // Show confirmation message
      showPrivacyConfirmation(optIn);
      
      // Store preference locally for UI display
      localStorage.setItem('privacyOptIn', optIn.toString());
      
    } catch (error) {
      console.error('Failed to save privacy preference:', error);
      // APIClient already shows error notification
    }
  });
}

/**
 * Show privacy confirmation message
 */
function showPrivacyConfirmation(optIn: boolean): void {
  const confirmDiv = document.createElement('div');
  confirmDiv.className = 'privacy-confirmation';
  confirmDiv.textContent = optIn
    ? '✓ Personality reflection enabled! Your familiar will evolve based on your Reddit activity.'
    : '✓ Privacy preference saved. Your familiar will evolve randomly.';
  
  document.body.appendChild(confirmDiv);
  
  // Remove after 5 seconds
  setTimeout(() => {
    confirmDiv.style.animation = 'privacyConfirmSlideIn 0.3s ease-out reverse';
    setTimeout(() => confirmDiv.remove(), 300);
  }, 5000);
}

/**
 * Load or create familiar for the current user
 * Restores complete state including mutations, stats, and biome within 2 seconds
 */
async function initializeFamiliar(): Promise<void> {
  const startTime = performance.now();
  
  try {
    // Preload sound effects
    console.log('Preloading sound effects...');
    await soundManager.preloadSounds();
    console.log('Sound effects preloaded');
    
    // Show loading indicator
    showLoadingIndicator('Loading your familiar...');
    
    // Try to fetch existing familiar using APIClient
    const data = await apiClient.getFamiliarState();
    
    if (data.familiar) {
      console.log('Loaded existing familiar:', data.familiar);
      
      // Restore biome environment first
      biomeRenderer.setBiome(data.familiar.biome);
      
      // Play ambient sound for biome
      const ambientMap: Record<BiomeType, string> = {
        jungle: 'ambient_jungle',
        rocky_mountain: 'ambient_rocky_mountain',
        desert: 'ambient_desert',
        ocean: 'ambient_ocean',
        cave: 'ambient_cave',
      };
      const ambientSound = ambientMap[data.familiar.biome];
      if (ambientSound) {
        soundManager.playAmbient(ambientSound as any);
      }
      
      // Restore all mutations to creature renderer
      if (data.familiar.mutations && data.familiar.mutations.length > 0) {
        console.log(`Restoring ${data.familiar.mutations.length} mutations to familiar`);
        console.log('Mutations:', data.familiar.mutations);
        
        // Apply each mutation without animation for faster loading
        for (const mutation of data.familiar.mutations) {
          // Determine randomness factor from mutation data
          const randomnessFactor = mutation.traits?.[0]?.randomnessFactor ?? 
            (mutation.type === 'controlled' ? 0.9 : 0.1);
          
          // Apply mutation geometry without animation
          creatureRenderer.applyMutation(mutation, randomnessFactor);
        }
        
        console.log(`Successfully restored ${data.familiar.mutations.length} mutations`);
      }
      
      // Update UI with complete familiar state (Care Meter, Evolution Points, stats)
      handleStateChanges(data.familiar);
      
      // Calculate load time
      const loadTime = performance.now() - startTime;
      console.log(`State restoration completed in ${loadTime.toFixed(0)}ms`);
      
      // Hide loading indicator
      hideLoadingIndicator();
      
      // Start polling for updates
      startStatePolling();
      
      return;
    }
    
    // If no familiar exists, create one
    console.log('No familiar found, creating new familiar...');
    const createData = await apiClient.createFamiliar();
    console.log('Created new familiar:', createData.familiar);
    
    // Set biome first
    biomeRenderer.setBiome(createData.familiar.biome);
    
    // Update UI with new familiar data
    handleStateChanges(createData.familiar);
    
    // Calculate load time
    const loadTime = performance.now() - startTime;
    console.log(`Familiar creation completed in ${loadTime.toFixed(0)}ms`);
    
    // Hide loading indicator
    hideLoadingIndicator();
    
    // Start polling for updates
    startStatePolling();
    
    // Show privacy opt-in dialog for new users
    showPrivacyDialog();
    
  } catch (err) {
    console.error('Error initializing familiar:', err);
    
    // Always hide loading indicator on error
    hideLoadingIndicator();
    
    // Show a more helpful error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'initialization-error';
    errorDiv.innerHTML = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(20, 20, 30, 0.95);
        color: #ff5555;
        padding: 30px;
        border-radius: 12px;
        border: 2px solid #ff5555;
        font-family: 'Orbitron', sans-serif;
        text-align: center;
        z-index: 10000;
        max-width: 400px;
      ">
        <div style="font-size: 48px; margin-bottom: 15px;">⚠️</div>
        <div style="font-size: 18px; margin-bottom: 10px;">Failed to Initialize</div>
        <div style="font-size: 14px; color: #aaa; margin-bottom: 20px;">
          ${err instanceof Error ? err.message : 'Unknown error occurred'}
        </div>
        <button onclick="location.reload()" style="
          background: #ff5555;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-family: 'Orbitron', sans-serif;
          font-size: 14px;
        ">Reload Page</button>
      </div>
    `;
    document.body.appendChild(errorDiv);
  }
}

/**
 * Show loading indicator during state restoration
 */
function showLoadingIndicator(message: string): void {
  let loadingDiv = document.getElementById('loading-indicator');
  
  if (!loadingDiv) {
    loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-indicator';
    loadingDiv.className = 'loading-indicator';
    loadingDiv.innerHTML = `
      <div class="loading-spinner"></div>
      <div class="loading-text">${message}</div>
    `;
    document.body.appendChild(loadingDiv);
  } else {
    const textDiv = loadingDiv.querySelector('.loading-text');
    if (textDiv) {
      textDiv.textContent = message;
    }
  }
}

/**
 * Hide loading indicator after state restoration
 */
function hideLoadingIndicator(): void {
  const loadingDiv = document.getElementById('loading-indicator');
  if (loadingDiv) {
    loadingDiv.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => loadingDiv.remove(), 300);
  }
}

/**
 * Show familiar removed message with option to create new familiar
 */
function showFamiliarRemovedMessage(): void {
  // Check if message already exists
  if (document.getElementById('familiar-removed-message')) {
    return;
  }

  const messageDiv = document.createElement('div');
  messageDiv.id = 'familiar-removed-message';
  messageDiv.className = 'familiar-removed-message';
  messageDiv.innerHTML = `
    <div class="removed-icon">💔</div>
    <div class="removed-title">Familiar Removed</div>
    <div class="removed-text">
      Your familiar has been removed due to prolonged neglect.<br>
      The Care Meter reached 0 and stayed there for 24 hours.<br><br>
      You can start fresh with a new familiar.
    </div>
    <button class="removed-button" onclick="location.reload()">
      Create New Familiar
    </button>
  `;
  document.body.appendChild(messageDiv);
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

// Initialize Privacy Dialog
const privacyDialog = new PrivacyDialog();

// Initialize Sound Settings
const soundSettings = new SoundSettings();
console.log('SoundSettings initialized');

// Set up care action callback to update HUD
careActionUI.onAction((action, result) => {
  console.log(`Care action ${action} performed:`, result);
  // Update care meter and evolution points
  hudDrawer.updateCareMeter(result.careMeter);
  hudDrawer.updateEvolutionPoints(result.evolutionPoints);
  // Update mutation choice button state
  mutationChoiceUI.updateEvolveButton(result.evolutionPoints);
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

// Initialize Mutation Choice UI
const mutationChoiceUI = new MutationChoiceUI();

// Set up mutation trigger callback
mutationChoiceUI.onTrigger(async (): Promise<MutationTriggerResponse> => {
  console.log('Triggering controlled mutation...');
  return await apiClient.triggerMutation();
});

// Set up mutation choice callback
mutationChoiceUI.onChoose(async (sessionId: string, optionId: string): Promise<void> => {
  console.log(`Applying mutation choice: ${optionId} from session ${sessionId}`);
  
  const data = await apiClient.chooseMutation(sessionId, optionId);
  console.log('Mutation applied:', data);
  
  // Update HUD with new stats (FamiliarStats)
  hudDrawer.updateStats(data.updatedStats as any);
  
  // Calculate stat changes for notification
  const statChanges: Record<string, number> = {};
  if (data.mutation.statEffects) {
    for (const [category, effects] of Object.entries(data.mutation.statEffects)) {
      for (const [stat, value] of Object.entries(effects as Record<string, number>)) {
        statChanges[`${category}.${stat}`] = value;
      }
    }
  }
  
  // Show controlled mutation notification
  const traitLabel = data.mutation.traits?.[0]?.category || 'Unknown';
  notificationSystem.showControlledMutationNotification(traitLabel, statChanges);
  
  // TODO: Apply mutation visually to creature renderer
  // For now, just log the mutation
  console.log('Mutation data:', data.mutation);
  
  // Refresh familiar state to get updated evolution points
  await refreshFamiliarState();
});

console.log('MutationChoiceUI initialized');

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

// Debug: Add button to reset familiar (remove after testing)
const resetButton = document.createElement('button');
resetButton.textContent = 'Reset Familiar (Debug)';
resetButton.style.cssText = `
  position: fixed;
  top: 100px;
  right: 20px;
  padding: 10px 20px;
  background: #ff4444;
  color: white;
  border: 2px solid #ff0000;
  border-radius: 8px;
  cursor: pointer;
  font-family: 'Orbitron', sans-serif;
  z-index: 10000;
`;
resetButton.onclick = async () => {
  if (confirm('Reset familiar? This will clear all mutations and start fresh.')) {
    try {
      const response = await fetch('/api/familiar/reset', { method: 'POST' });
      if (response.ok) {
        alert('Familiar reset! Reloading...');
        location.reload();
      }
    } catch (error) {
      console.error('Failed to reset:', error);
    }
  }
};
document.body.appendChild(resetButton);

// Initialize familiar (load existing or create new)
// This will also start the polling mechanism
void initializeFamiliar();

animate();
