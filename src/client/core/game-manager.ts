import { BiomeType, FamiliarState } from '../../shared/types/api';
import { SceneManager } from '../scene/scene-manager';
import { CreatureRenderer } from '../creature/creature-renderer';
import { BiomeRenderer } from '../biome/biome-renderer';
import { HUDDrawer } from '../ui/hud-drawer';
import { CareActionUI } from '../ui/care-actions';
import { MutationChoiceUI } from '../ui/mutation-choice';
import { PrivacyDialog } from '../ui/privacy-dialog';
import { notificationSystem } from '../ui/notification-system';
import { removalWarning } from '../ui/removal-warning';
import { apiClient } from '../api/api-client';
import { soundManager } from '../audio/sound-manager';

/**
 * GameManager handles all game logic and state management
 */
export class GameManager {
  private sceneManager: SceneManager;
  private creatureRenderer: CreatureRenderer;
  private biomeRenderer: BiomeRenderer;
  private hudDrawer: HUDDrawer;
  private careActionUI: CareActionUI;
  private mutationChoiceUI: MutationChoiceUI;
  private privacyDialog: PrivacyDialog;
  
  private currentFamiliarState: FamiliarState | null = null;
  private pollingIntervalId: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    // Initialize core systems
    this.sceneManager = new SceneManager(canvas);
    const scene = this.sceneManager.getScene();
    
    this.creatureRenderer = new CreatureRenderer(scene, this.sceneManager.isMobile());
    this.biomeRenderer = new BiomeRenderer(scene, this.sceneManager.isMobile());
    
    // Initialize UI systems
    this.hudDrawer = new HUDDrawer();
    this.careActionUI = new CareActionUI();
    this.mutationChoiceUI = new MutationChoiceUI();
    this.privacyDialog = new PrivacyDialog();
    
    this.setupEventHandlers();
    this.setupCameraControls();
    this.startAnimationLoop();
  }

  /**
   * Initialize the game
   */
  public async initialize(): Promise<void> {
    try {
      // Preload sound effects
      console.log('Preloading sound effects...');
      await soundManager.preloadSounds();
      console.log('Sound effects preloaded');
      
      // Load or create familiar
      await this.initializeFamiliar();
      
    } catch (error) {
      console.error('Failed to initialize game:', error);
      this.showInitializationError(error);
    }
  }

  /**
   * Set up event handlers for UI components
   */
  private setupEventHandlers(): void {
    // Care action callbacks
    this.careActionUI.onAction((action, result) => {
      console.log(`Care action ${action} performed:`, result);
      this.hudDrawer.updateCareMeter(result.careMeter);
      this.hudDrawer.updateEvolutionPoints(result.evolutionPoints);
      this.mutationChoiceUI.updateEvolveButton(result.evolutionPoints);
      this.creatureRenderer.updateCareMeterVisuals(result.careMeter);
    });

    this.careActionUI.onAnimationTrigger((action) => {
      console.log(`Triggering ${action} animation on familiar`);
      this.creatureRenderer.triggerCareAnimation(action);
    });

    // Mutation callbacks
    this.mutationChoiceUI.onTrigger(async () => {
      console.log('Triggering controlled mutation...');
      return await apiClient.triggerMutation();
    });

    this.mutationChoiceUI.onChoose(async (sessionId: string, optionId: string) => {
      console.log(`Applying mutation choice: ${optionId} from session ${sessionId}`);
      
      const data = await apiClient.chooseMutation(sessionId, optionId);
      console.log('Mutation applied:', data);
      
      // Update HUD with new stats
      this.hudDrawer.updateStats(data.updatedStats as any);
      
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
      
      // Apply mutation visually to creature renderer
      const randomnessFactor = data.mutation.traits?.[0]?.randomnessFactor ?? 0.9;
      console.log('About to apply mutation:', data.mutation);
      console.log('Mutation traits:', data.mutation.traits);
      console.log('Randomness factor:', randomnessFactor);
      
      try {
        this.creatureRenderer.applyMutation(data.mutation, randomnessFactor);
        console.log('Mutation applied successfully!');
      } catch (error) {
        console.error('Error applying mutation:', error);
      }
      
      // Refresh familiar state to get updated evolution points
      await this.refreshFamiliarState();
    });
  }

  /**
   * Set up camera controls
   */
  private setupCameraControls(): void {
    let isDragging = false;
    let previousMouseX = 0;
    let previousMouseY = 0;

    const handlePointerDown = (event: PointerEvent): void => {
      isDragging = true;
      previousMouseX = event.clientX;
      previousMouseY = event.clientY;
    };

    const handlePointerMove = (event: PointerEvent): void => {
      if (!isDragging) return;

      const deltaX = event.clientX - previousMouseX;
      const deltaY = event.clientY - previousMouseY;
      
      previousMouseX = event.clientX;
      previousMouseY = event.clientY;

      // Horizontal rotation (azimuth)
      const rotationSpeed = 0.005;
      const newAngle = this.sceneManager.getCameraAngle() + deltaX * rotationSpeed;
      
      // Vertical elevation (up/down movement)
      const elevationSpeed = 0.003;
      const currentElevation = this.sceneManager.getCameraElevation();
      const newElevation = currentElevation + deltaY * elevationSpeed;
      
      // Update camera with both horizontal and vertical movement
      this.sceneManager.setCameraSpherical(newAngle, newElevation);
    };

    const handlePointerUp = (): void => {
      isDragging = false;
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  }

  /**
   * Start the animation loop
   */
  private startAnimationLoop(): void {
    let lastTime = performance.now();
    const targetFrameTime = 1000 / this.sceneManager.getTargetFPS();

    const animate = (): void => {
      requestAnimationFrame(animate);

      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;

      // Throttle to target FPS
      if (deltaTime < targetFrameTime) {
        return;
      }

      lastTime = currentTime - (deltaTime % targetFrameTime);
      const deltaTimeSeconds = deltaTime / 1000;
      
      // Update scene and creature
      this.sceneManager.update(deltaTimeSeconds);
      this.creatureRenderer.pulsate(deltaTimeSeconds);
      this.sceneManager.render();
    };

    console.log('Starting animation loop');
    animate();
  }

  /**
   * Load or create familiar for the current user
   */
  private async initializeFamiliar(): Promise<void> {
    const startTime = performance.now();
    
    try {
      this.showLoadingIndicator('Loading your familiar...');
      
      // Try to fetch existing familiar
      const data = await apiClient.getFamiliarState();
      
      if (data.familiar) {
        console.log('Loaded existing familiar:', data.familiar);
        
        // Restore biome environment first
        this.biomeRenderer.setBiome(data.familiar.biome);
        
        // Ambient sound disabled to prevent constant ringing
        // const ambientMap: Record<BiomeType, string> = {
        //   jungle: 'ambient_jungle',
        //   rocky_mountain: 'ambient_rocky_mountain',
        //   desert: 'ambient_desert',
        //   ocean: 'ambient_ocean',
        //   cave: 'ambient_cave',
        // };
        // const ambientSound = ambientMap[data.familiar.biome];
        // if (ambientSound) {
        //   soundManager.playAmbient(ambientSound as any);
        // }
        
        // Restore all mutations to creature renderer
        if (data.familiar.mutations && data.familiar.mutations.length > 0) {
          console.log(`Restoring ${data.familiar.mutations.length} mutations to familiar`);
          console.log('Mutations:', data.familiar.mutations);
          
          // Apply each mutation without animation for faster loading
          for (const mutation of data.familiar.mutations) {
            const randomnessFactor = mutation.traits?.[0]?.randomnessFactor ?? 
              (mutation.type === 'controlled' ? 0.9 : 0.1);
            
            this.creatureRenderer.applyMutation(mutation, randomnessFactor);
          }
          
          console.log(`Successfully restored ${data.familiar.mutations.length} mutations`);
        }
        
        // Update UI with complete familiar state
        this.handleStateChanges(data.familiar);
        
        const loadTime = performance.now() - startTime;
        console.log(`State restoration completed in ${loadTime.toFixed(0)}ms`);
        
        this.hideLoadingIndicator();
        this.startStatePolling();
        
        return;
      }
      
      // If no familiar exists, create one
      console.log('No familiar found, creating new familiar...');
      const createData = await apiClient.createFamiliar();
      console.log('Created new familiar:', createData.familiar);
      
      // Set biome first
      this.biomeRenderer.setBiome(createData.familiar.biome);
      
      // Update UI with new familiar data
      this.handleStateChanges(createData.familiar);
      
      const loadTime = performance.now() - startTime;
      console.log(`Familiar creation completed in ${loadTime.toFixed(0)}ms`);
      
      this.hideLoadingIndicator();
      this.startStatePolling();
      
      // Show privacy opt-in dialog for new users
      this.showPrivacyDialog();
      
    } catch (err) {
      console.error('Error initializing familiar:', err);
      this.hideLoadingIndicator();
      this.showInitializationError(err);
    }
  }

  /**
   * Update UI components with familiar state
   */
  private updateUIWithFamiliarState(familiar: FamiliarState): void {
    this.hudDrawer.updateCareMeter(familiar.careMeter);
    this.hudDrawer.updateEvolutionPoints(familiar.evolutionPoints);
    this.hudDrawer.updateAge(familiar.age);
    this.hudDrawer.updateStats(familiar.stats);
    
    this.mutationChoiceUI.updateEvolveButton(familiar.evolutionPoints);
    this.creatureRenderer.updateCareMeterVisuals(familiar.careMeter);
    
    // Show neglect warning if care meter is low
    if (familiar.careMeter < 20) {
      this.showNeglectWarning(familiar.careMeter);
    } else {
      this.hideNeglectWarning();
    }
  }

  /**
   * Handle state changes and detect new mutations
   */
  private handleStateChanges(newState: FamiliarState): void {
    if (!this.currentFamiliarState) {
      // First load - update everything
      this.updateUIWithFamiliarState(newState);
      this.currentFamiliarState = newState;
      return;
    }
    
    // Check for biome change
    if (newState.biome !== this.currentFamiliarState.biome) {
      console.log(`Biome changed: ${this.currentFamiliarState.biome} -> ${newState.biome}`);
      this.biomeRenderer.setBiome(newState.biome);
      
      // Ambient sound disabled to prevent constant ringing
      // const ambientMap: Record<BiomeType, string> = {
      //   jungle: 'ambient_jungle',
      //   rocky_mountain: 'ambient_rocky_mountain',
      //   desert: 'ambient_desert',
      //   ocean: 'ambient_ocean',
      //   cave: 'ambient_cave',
      // };
      // const ambientSound = ambientMap[newState.biome];
      // if (ambientSound) {
      //   soundManager.playAmbient(ambientSound as any);
      // }
    }
    
    // Check for new mutations
    if (newState.mutations.length > this.currentFamiliarState.mutations.length) {
      const newMutations = newState.mutations.slice(this.currentFamiliarState.mutations.length);
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
      
      // Apply new mutations to creature renderer with animation
      for (const mutation of newMutations) {
        const randomnessFactor = mutation.traits?.[0]?.randomnessFactor ?? 
          (mutation.type === 'controlled' ? 0.9 : 0.1);
        
        console.log('Applying new mutation visually:', mutation);
        this.creatureRenderer.applyMutation(mutation, randomnessFactor);
      }
    }
    
    // Check for care meter warnings
    if (newState.careMeter < 20 && (!this.currentFamiliarState || this.currentFamiliarState.careMeter >= 20)) {
      notificationSystem.showCareMeterWarning(newState.careMeter);
      soundManager.playSound('sad', 0.5);
    }
    
    // Check for removal warning (care meter at 0)
    if (newState.careMeter === 0) {
      const hoursSinceLastCare = (Date.now() - newState.lastCareTime) / (1000 * 60 * 60);
      const hoursRemaining = Math.max(0, 24 - hoursSinceLastCare);
      
      if (hoursRemaining > 0 && !removalWarning.isVisible()) {
        removalWarning.show(
          hoursRemaining,
          () => this.hudDrawer.toggleMenu(),
          () => console.log('Removal warning dismissed')
        );
      } else if (hoursRemaining <= 0) {
        this.showFamiliarRemovedMessage();
      }
    } else if (newState.careMeter > 0 && removalWarning.isVisible()) {
      removalWarning.hide();
    }
    
    // Update UI with new state
    this.updateUIWithFamiliarState(newState);
    this.currentFamiliarState = newState;
  }

  /**
   * Refresh familiar state from server
   */
  private async refreshFamiliarState(): Promise<void> {
    try {
      const data = await apiClient.getFamiliarState();
      
      if (data.familiar) {
        this.handleStateChanges(data.familiar);
      }
    } catch (err) {
      console.error('Error refreshing familiar state:', err);
    }
  }

  /**
   * Start polling for state updates every 5 seconds
   */
  private startStatePolling(): void {
    if (this.pollingIntervalId !== null) {
      return; // Already polling
    }
    
    console.log('Starting state polling (every 5 seconds)');
    this.pollingIntervalId = window.setInterval(() => {
      void this.refreshFamiliarState();
    }, 5000);
  }

  /**
   * Show privacy consent dialog
   */
  private showPrivacyDialog(): void {
    this.privacyDialog.show(async (optIn: boolean) => {
      console.log(`User ${optIn ? 'opted in' : 'opted out'} of personality reflection`);
      
      try {
        const response = await apiClient.setPrivacyOptIn(optIn);
        console.log('Privacy preference saved:', response);
        
        this.showPrivacyConfirmation(optIn);
        localStorage.setItem('privacyOptIn', optIn.toString());
        
      } catch (error) {
        console.error('Failed to save privacy preference:', error);
      }
    });
  }

  /**
   * Show privacy confirmation message
   */
  private showPrivacyConfirmation(optIn: boolean): void {
    const confirmDiv = document.createElement('div');
    confirmDiv.className = 'privacy-confirmation';
    confirmDiv.textContent = optIn
      ? '✓ Personality reflection enabled! Your familiar will evolve based on your Reddit activity.'
      : '✓ Privacy preference saved. Your familiar will evolve randomly.';
    
    document.body.appendChild(confirmDiv);
    
    setTimeout(() => {
      confirmDiv.style.animation = 'privacyConfirmSlideIn 0.3s ease-out reverse';
      setTimeout(() => confirmDiv.remove(), 300);
    }, 5000);
  }

  /**
   * Show loading indicator
   */
  private showLoadingIndicator(message: string): void {
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
   * Hide loading indicator
   */
  private hideLoadingIndicator(): void {
    const loadingDiv = document.getElementById('loading-indicator');
    if (loadingDiv) {
      loadingDiv.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => loadingDiv.remove(), 300);
    }
  }

  /**
   * Show neglect warning
   */
  private showNeglectWarning(careMeter: number): void {
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
      const meterDiv = warningDiv.querySelector('.warning-meter');
      if (meterDiv) {
        meterDiv.textContent = `Care Meter: ${careMeter}`;
      }
    }
  }

  /**
   * Hide neglect warning
   */
  private hideNeglectWarning(): void {
    const warningDiv = document.getElementById('neglect-warning');
    if (warningDiv) {
      warningDiv.remove();
    }
  }

  /**
   * Show initialization error
   */
  private showInitializationError(error: any): void {
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
          ${error instanceof Error ? error.message : 'Unknown error occurred'}
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

  /**
   * Show familiar removed message
   */
  private showFamiliarRemovedMessage(): void {
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
}
