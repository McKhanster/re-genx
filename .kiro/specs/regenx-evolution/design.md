# Design Document

## Overview

Re-GenX is a personal creature companion game built on Reddit's Devvit platform using Three.js for 3D rendering. Each player receives their own unique familiar that they must care for through feeding, playing, and giving attention. The familiar evolves through player-directed controlled mutations and personality-influenced uncontrolled mutations. The visual presentation features a dramatic spotlight effect with the creature at center stage, surrounded by darkness beyond a 5ft radius, viewable from 360 degrees.

### Core Design Principles

1. **Single-Player Intimacy**: Each player has their own personal familiar, creating a strong bond
2. **Tamagotchi-Style Care**: Active care required or familiar will be removed (not death)
3. **Controlled Chaos**: Balance player control (85-95%) with randomness (5-15%)
4. **Visual Drama**: Spotlight effect creates focus and reduces rendering complexity
5. **Privacy-First**: Only analyze public posts with explicit opt-in consent
6. **Mobile-First**: Optimize for touch controls and 30fps minimum on mobile devices
7. **Data Persistence**: Everything stored in Redis with retry logic

### Technology Stack

- **Client**: Three.js (3D rendering), TypeScript, Vite
- **Server**: Express, Devvit SDK, TypeScript
- **Data**: Redis (via Devvit)
- **Platform**: Devvit Web (Reddit integration)

## Architecture

### High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Reddit User                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Devvit Post (Entry Point)                  │
│  - Splash screen with "Play" button                          │
│  - Opens webview in fullscreen                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Client (Three.js Webview)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Scene Manager                                        │   │
│  │  - Spotlight & Camera                                 │   │
│  │  - Familiar Renderer                                  │   │
│  │  - Biome Environment                                  │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  UI Layer                                             │   │
│  │  - Slide-up HUD Drawer                                │   │
│  │  - Care Action Buttons                                │   │
│  │  - Mutation Choice Interface                          │   │
│  │  - Neglect Warnings                                   │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  API Client                                           │   │
│  │  - fetch() calls to /api/* endpoints                  │   │
│  │  - Polling for state updates                          │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Server (Express + Devvit)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  API Endpoints (/api/*)                               │   │
│  │  - /api/familiar/create                               │   │
│  │  - /api/familiar/state                                │   │
│  │  - /api/care/feed                                     │   │
│  │  - /api/care/play                                     │   │
│  │  - /api/care/attention                                │   │
│  │  - /api/mutation/trigger                              │   │
│  │  - /api/mutation/choose                               │   │
│  │  - /api/privacy/opt-in                                │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Business Logic                                       │   │
│  │  - Familiar Manager                                   │   │
│  │  - Care System                                        │   │
│  │  - Mutation Engine                                    │   │
│  │  - Activity Tracker (Privacy-Compliant)              │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Scheduler Jobs                                       │   │
│  │  - Care Meter Decay                                   │   │
│  │  - Evolution Cycle Trigger                            │   │
│  │  - Activity Pattern Update                            │   │
│  │  - Neglect Check                                      │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                      Redis (Devvit)                          │
│  - Familiar data (mutations, stats, age)                     │
│  - Care state (meter, last care time, evolution points)      │
│  - Activity patterns (posting behavior, opt-in status)       │
│  - Mutation choices (active selection sessions)              │
│  - Cooldown timers (care actions)                            │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow Examples

**Example 1: New User Creates Familiar**

1. User clicks "Play" on Reddit post
2. Client loads, calls `GET /api/familiar/state`
3. Server checks Redis for user's familiar
4. If no familiar: Server creates new familiar with default stats
5. Server returns familiar data with Care Meter at 100
6. Client renders familiar in Three.js scene
7. Client displays privacy opt-in dialog

**Example 2: Player Feeds Familiar**

1. User clicks "Feed" button
2. Client calls `POST /api/care/feed`
3. Server checks cooldown timer (5 minutes)
4. Server increases Care Meter by 15 points
5. Server awards 10 Evolution Points
6. Server updates last care timestamp
7. Server returns updated state
8. Client animates feeding and updates HUD

**Example 3: Controlled Mutation**

1. User clicks "Evolve" button (costs 100 Evolution Points)
2. Client calls `POST /api/mutation/trigger`
3. Server deducts 100 Evolution Points
4. Server generates 3-5 trait options
5. Server creates mutation choice session
6. Client displays trait selection UI
7. User selects preferred trait
8. Client calls `POST /api/mutation/choose`
9. Server applies mutation with randomness (0.85-0.95)
10. Server updates familiar state
11. Client animates mutation over 2-3 seconds

**Example 4: Uncontrolled Mutation (Personality-Influenced)**

1. Evolution cycle timer triggers (30min - 4hr)
2. Server increments familiar age
3. Server rolls 20% chance for uncontrolled mutation
4. If triggered: Server checks user's activity pattern opt-in
5. If opted in: Server analyzes recent public posts
6. Server biases mutation toward user's posting categories
7. Server applies mutation with high randomness (0.05-0.15)
8. Server stores mutation in Redis
9. Client polls and receives updated state
10. Client animates mutation


## Components and Interfaces

### Client Components

#### 1. SceneManager

Manages the Three.js scene, camera, and lighting for the familiar.

```typescript
class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private spotlight: THREE.SpotLight;

  constructor(canvas: HTMLCanvasElement) {
    this.initScene();
    this.initCamera();
    this.initLighting();
    this.initRenderer(canvas);
  }

  private initLighting(): void {
    // Spotlight from directly above
    this.spotlight = new THREE.SpotLight(0xffffff, 1.5);
    this.spotlight.position.set(0, 10, 0);
    this.spotlight.angle = Math.PI / 6;
    this.spotlight.penumbra = 0.3;
    this.spotlight.decay = 2;
    this.spotlight.distance = 15;
    this.scene.add(this.spotlight);
  }

  public rotateCamera(angle: number): void {
    // Rotate around Y axis, keep familiar centered
    const radius = 8;
    this.camera.position.x = Math.sin(angle) * radius;
    this.camera.position.z = Math.cos(angle) * radius;
    this.camera.lookAt(0, 0, 0);
  }

  public render(): void {
    this.renderer.render(this.scene, this.camera);
  }
}
```

#### 2. FamiliarRenderer

Renders the familiar with all applied mutations.

```typescript
interface MutationGeometry {
  type: string;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  position: THREE.Vector3;
  scale: THREE.Vector3;
  rotation: THREE.Euler;
}

class FamiliarRenderer {
  private baseMesh: THREE.Mesh;
  private mutationMeshes: Map<string, THREE.Mesh>;
  private careMeterState: number = 100;

  constructor(scene: THREE.Scene) {
    this.mutationMeshes = new Map();
    this.initBaseMesh();
    scene.add(this.baseMesh);
  }

  private initBaseMesh(): void {
    // Pulsating blob
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshPhongMaterial({
      color: 0x00ff88,
      emissive: 0x00ff88,
      emissiveIntensity: 0.3,
      shininess: 100,
    });
    this.baseMesh = new THREE.Mesh(geometry, material);
  }

  public updateCareMeterVisuals(careMeter: number): void {
    this.careMeterState = careMeter;
    
    // Change appearance based on care level
    if (careMeter < 20) {
      // Sad/distressed appearance
      this.baseMesh.material.color.setHex(0x666666);
      this.baseMesh.material.emissiveIntensity = 0.1;
    } else if (careMeter < 50) {
      // Neutral appearance
      this.baseMesh.material.color.setHex(0x00aa66);
      this.baseMesh.material.emissiveIntensity = 0.2;
    } else {
      // Happy appearance
      this.baseMesh.material.color.setHex(0x00ff88);
      this.baseMesh.material.emissiveIntensity = 0.3;
    }
  }

  public applyMutation(mutation: MutationData, randomnessFactor: number): void {
    const geometry = this.generateMutationGeometry(mutation, randomnessFactor);
    const mesh = new THREE.Mesh(geometry.geometry, geometry.material);
    mesh.position.copy(geometry.position);
    mesh.scale.copy(geometry.scale);
    mesh.rotation.copy(geometry.rotation);

    this.mutationMeshes.set(mutation.id, mesh);
    this.baseMesh.add(mesh);
  }

  public async animateMutation(mutationId: string, duration: number): Promise<void> {
    // Animate scale from 0 to target over duration
    return new Promise((resolve) => {
      const mesh = this.mutationMeshes.get(mutationId);
      if (!mesh) {
        resolve();
        return;
      }

      const targetScale = mesh.scale.clone();
      mesh.scale.set(0, 0, 0);

      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = this.easeOutElastic(progress);

        mesh.scale.lerpVectors(new THREE.Vector3(0, 0, 0), targetScale, eased);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      animate();
    });
  }

  public pulsate(deltaTime: number): void {
    // Subtle pulsating effect - faster when happy, slower when sad
    const pulseSpeed = this.careMeterState < 20 ? 0.0005 : 0.001;
    const scale = 1 + Math.sin(Date.now() * pulseSpeed) * 0.05;
    this.baseMesh.scale.set(scale, scale, scale);
  }

  private easeOutElastic(x: number): number {
    const c4 = (2 * Math.PI) / 3;
    return x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
  }
}
```


#### 3. CareActionUI

Handles the care action buttons and feedback.

```typescript
class CareActionUI {
  private feedButton: HTMLButtonElement;
  private playButton: HTMLButtonElement;
  private attentionButton: HTMLButtonElement;
  private cooldowns: Map<string, number> = new Map();

  constructor() {
    this.createButtons();
    this.attachEventListeners();
  }

  private createButtons(): void {
    const container = document.createElement('div');
    container.className = 'care-actions';
    container.innerHTML = `
      <button id="feed-btn" class="care-btn">
        <span class="icon">🍖</span>
        <span class="label">Feed</span>
        <span class="reward">+15 Care, +10 EP</span>
      </button>
      <button id="play-btn" class="care-btn">
        <span class="icon">🎾</span>
        <span class="label">Play</span>
        <span class="reward">+10 Care, +15 EP</span>
      </button>
      <button id="attention-btn" class="care-btn">
        <span class="icon">💚</span>
        <span class="label">Attention</span>
        <span class="reward">+5 Care, +5 EP</span>
      </button>
    `;
    document.body.appendChild(container);

    this.feedButton = document.getElementById('feed-btn') as HTMLButtonElement;
    this.playButton = document.getElementById('play-btn') as HTMLButtonElement;
    this.attentionButton = document.getElementById('attention-btn') as HTMLButtonElement;
  }

  private attachEventListeners(): void {
    this.feedButton.addEventListener('click', () => this.handleCareAction('feed'));
    this.playButton.addEventListener('click', () => this.handleCareAction('play'));
    this.attentionButton.addEventListener('click', () => this.handleCareAction('attention'));
  }

  private async handleCareAction(action: string): Promise<void> {
    if (this.isOnCooldown(action)) {
      this.showCooldownMessage(action);
      return;
    }

    try {
      const response = await fetch(`/api/care/${action}`, { method: 'POST' });
      const data = await response.json();

      this.setCooldown(action, 5 * 60 * 1000); // 5 minutes
      this.showFeedback(data.careMeterIncrease, data.evolutionPointsGained);
      this.updateHUD(data.careMeter, data.evolutionPoints);
      this.triggerAnimation(action);
    } catch (error) {
      console.error(`Care action ${action} failed:`, error);
      this.showError('Failed to perform action. Please try again.');
    }
  }

  private isOnCooldown(action: string): boolean {
    const cooldownEnd = this.cooldowns.get(action);
    return cooldownEnd ? Date.now() < cooldownEnd : false;
  }

  private setCooldown(action: string, durationMs: number): void {
    this.cooldowns.set(action, Date.now() + durationMs);
    this.updateButtonCooldown(action, durationMs);
  }

  private updateButtonCooldown(action: string, durationMs: number): void {
    const button = this.getButtonForAction(action);
    button.disabled = true;
    button.classList.add('cooldown');

    const interval = setInterval(() => {
      const remaining = this.cooldowns.get(action)! - Date.now();
      if (remaining <= 0) {
        clearInterval(interval);
        button.disabled = false;
        button.classList.remove('cooldown');
      } else {
        const seconds = Math.ceil(remaining / 1000);
        button.querySelector('.label')!.textContent = `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
      }
    }, 1000);
  }

  private showFeedback(careMeterIncrease: number, epGained: number): void {
    const feedback = document.createElement('div');
    feedback.className = 'care-feedback';
    feedback.innerHTML = `
      <div class="care-increase">+${careMeterIncrease} Care</div>
      <div class="ep-increase">+${epGained} EP</div>
    `;
    document.body.appendChild(feedback);

    setTimeout(() => feedback.remove(), 2000);
  }
}
```

### Server Components

#### 1. FamiliarManager

Manages familiar creation and state.

```typescript
class FamiliarManager {
  constructor(private redis: RedisClient) {}

  async getFamiliar(userId: string): Promise<FamiliarState | null> {
    const familiarId = `familiar:${userId}`;
    const data = await this.redis.hgetall(familiarId);

    if (!data || Object.keys(data).length === 0) {
      return null;
    }

    return {
      id: familiarId,
      userId,
      age: parseInt(data.age),
      careMeter: parseInt(data.careMeter),
      evolutionPoints: parseInt(data.evolutionPoints),
      mutations: JSON.parse(data.mutations || '[]'),
      stats: JSON.parse(data.stats),
      biome: data.biome as BiomeType,
      lastCareTime: parseInt(data.lastCareTime),
      createdAt: parseInt(data.createdAt),
      privacyOptIn: data.privacyOptIn === 'true',
    };
  }

  async createFamiliar(userId: string): Promise<FamiliarState> {
    const familiarId = `familiar:${userId}`;
    const biomes: BiomeType[] = ['jungle', 'rocky_mountain', 'desert', 'ocean', 'cave'];
    const randomBiome = biomes[Math.floor(Math.random() * biomes.length)];

    const familiar: FamiliarState = {
      id: familiarId,
      userId,
      age: 0,
      careMeter: 100,
      evolutionPoints: 0,
      mutations: [],
      stats: this.getDefaultStats(),
      biome: randomBiome,
      lastCareTime: Date.now(),
      createdAt: Date.now(),
      privacyOptIn: false,
    };

    await this.redis.hset(familiarId, {
      userId,
      age: 0,
      careMeter: 100,
      evolutionPoints: 0,
      mutations: JSON.stringify([]),
      stats: JSON.stringify(familiar.stats),
      biome: randomBiome,
      lastCareTime: Date.now(),
      createdAt: Date.now(),
      privacyOptIn: 'false',
    });

    // Schedule first evolution cycle
    await this.scheduleEvolutionCycle(familiarId);

    return familiar;
  }

  private getDefaultStats(): FamiliarStats {
    return {
      mobility: { speed: 50, agility: 50, endurance: 50 },
      senses: { vision: 50, hearing: 50, smell: 50 },
      survival: { attack: 50, defense: 50, stealth: 50 },
      cognition: { intelligence: 50, social: 50, adaptability: 50 },
      vitals: { health: 100, happiness: 100, energy: 100 },
    };
  }

  async updateCareMeter(familiarId: string, currentMeter: number): Promise<void> {
    const newMeter = Math.max(0, Math.min(100, currentMeter));
    await this.redis.hset(familiarId, 'careMeter', newMeter);
  }

  async checkForRemoval(familiarId: string): Promise<boolean> {
    const data = await this.redis.hgetall(familiarId);
    const careMeter = parseInt(data.careMeter);
    const lastCareTime = parseInt(data.lastCareTime);

    // If care meter is 0 for 24 hours, remove familiar
    if (careMeter === 0 && Date.now() - lastCareTime > 24 * 60 * 60 * 1000) {
      await this.removeFamiliar(familiarId);
      return true;
    }

    return false;
  }

  private async removeFamiliar(familiarId: string): Promise<void> {
    // Archive the familiar data before deletion
    const data = await this.redis.hgetall(familiarId);
    await this.redis.hset(`familiar:archived:${familiarId}`, data);
    await this.redis.del(familiarId);
  }
}
```


#### 2. CareSystem

Handles care actions and care meter decay.

```typescript
class CareSystem {
  constructor(
    private redis: RedisClient,
    private familiarManager: FamiliarManager
  ) {}

  async performCareAction(
    familiarId: string,
    action: 'feed' | 'play' | 'attention'
  ): Promise<CareActionResult> {
    // Check cooldown
    const cooldownKey = `cooldown:${familiarId}:${action}`;
    const cooldownEnd = await this.redis.get(cooldownKey);
    
    if (cooldownEnd && Date.now() < parseInt(cooldownEnd)) {
      throw new Error('Action on cooldown');
    }

    // Get current state
    const data = await this.redis.hgetall(familiarId);
    let careMeter = parseInt(data.careMeter);
    let evolutionPoints = parseInt(data.evolutionPoints);

    // Apply care action effects
    const effects = this.getCareActionEffects(action);
    careMeter = Math.min(100, careMeter + effects.careMeterIncrease);
    evolutionPoints += effects.evolutionPointsGained;

    // Update Redis
    await this.redis.hset(familiarId, {
      careMeter,
      evolutionPoints,
      lastCareTime: Date.now(),
    });

    // Set cooldown (5 minutes)
    await this.redis.set(cooldownKey, Date.now() + 5 * 60 * 1000, { ex: 300 });

    return {
      careMeter,
      evolutionPoints,
      careMeterIncrease: effects.careMeterIncrease,
      evolutionPointsGained: effects.evolutionPointsGained,
    };
  }

  private getCareActionEffects(action: string): {
    careMeterIncrease: number;
    evolutionPointsGained: number;
  } {
    switch (action) {
      case 'feed':
        return { careMeterIncrease: 15, evolutionPointsGained: 10 };
      case 'play':
        return { careMeterIncrease: 10, evolutionPointsGained: 15 };
      case 'attention':
        return { careMeterIncrease: 5, evolutionPointsGained: 5 };
      default:
        return { careMeterIncrease: 0, evolutionPointsGained: 0 };
    }
  }

  async decayCareMeter(familiarId: string): Promise<number> {
    const data = await this.redis.hgetall(familiarId);
    const lastCareTime = parseInt(data.lastCareTime);
    const currentMeter = parseInt(data.careMeter);

    // Calculate hours since last care
    const hoursSinceLastCare = (Date.now() - lastCareTime) / (1000 * 60 * 60);
    const decayAmount = Math.floor(hoursSinceLastCare * 5); // 5 points per hour

    const newMeter = Math.max(0, currentMeter - decayAmount);
    await this.redis.hset(familiarId, 'careMeter', newMeter);

    return newMeter;
  }

  async checkNeglectWarning(familiarId: string): Promise<boolean> {
    const data = await this.redis.hgetall(familiarId);
    const careMeter = parseInt(data.careMeter);
    return careMeter < 20;
  }
}

interface CareActionResult {
  careMeter: number;
  evolutionPoints: number;
  careMeterIncrease: number;
  evolutionPointsGained: number;
}
```

#### 3. MutationEngine

Handles controlled and uncontrolled mutations.

```typescript
class MutationEngine {
  constructor(
    private redis: RedisClient,
    private activityTracker: ActivityTracker
  ) {}

  async triggerControlledMutation(familiarId: string): Promise<MutationChoice> {
    // Check evolution points
    const data = await this.redis.hgetall(familiarId);
    const evolutionPoints = parseInt(data.evolutionPoints);

    if (evolutionPoints < 100) {
      throw new Error('Insufficient evolution points');
    }

    // Deduct points
    await this.redis.hincrby(familiarId, 'evolutionPoints', -100);

    // Generate trait options
    const traitOptions = this.generateTraitOptions();

    // Create choice session
    const sessionId = `mutation:choice:${familiarId}:${Date.now()}`;
    await this.redis.hset(sessionId, {
      familiarId,
      options: JSON.stringify(traitOptions),
      createdAt: Date.now(),
    });
    await this.redis.expire(sessionId, 300); // 5 minute expiry

    return {
      sessionId,
      options: traitOptions,
    };
  }

  async applyChosenMutation(
    sessionId: string,
    chosenOptionId: string
  ): Promise<MutationData> {
    const sessionData = await this.redis.hgetall(sessionId);
    if (!sessionData || Object.keys(sessionData).length === 0) {
      throw new Error('Invalid or expired mutation session');
    }

    const options = JSON.parse(sessionData.options);
    const chosenOption = options.find((opt: TraitOption) => opt.id === chosenOptionId);

    if (!chosenOption) {
      throw new Error('Invalid option selected');
    }

    // Apply randomness factor (0.85-0.95 for controlled)
    const randomnessFactor = 0.85 + Math.random() * 0.1;
    const mutation: MutationData = {
      id: `mut:${Date.now()}`,
      type: 'controlled',
      trait: {
        category: chosenOption.category,
        value: this.applyRandomness(chosenOption.value, randomnessFactor),
        randomnessFactor,
      },
      statEffects: this.calculateStatEffects(chosenOption),
      timestamp: Date.now(),
    };

    // Save mutation to familiar
    const familiarId = sessionData.familiarId;
    await this.addMutationToFamiliar(familiarId, mutation);

    // Clean up session
    await this.redis.del(sessionId);

    return mutation;
  }

  async generateUncontrolledMutation(
    familiarId: string,
    userId: string
  ): Promise<MutationData> {
    const data = await this.redis.hgetall(familiarId);
    const privacyOptIn = data.privacyOptIn === 'true';

    let mutationType: string;

    if (privacyOptIn) {
      // Get activity patterns and bias mutation
      const activityPattern = await this.activityTracker.getActivityPattern(userId);
      mutationType = this.selectMutationFromActivity(activityPattern);
    } else {
      // Pure random
      mutationType = this.selectRandomMutationType();
    }

    // Apply high randomness (0.05-0.15 control)
    const randomnessFactor = 0.05 + Math.random() * 0.1;
    const trait = this.generateRandomTrait(mutationType, randomnessFactor);

    const mutation: MutationData = {
      id: `mut:${Date.now()}`,
      type: 'uncontrolled',
      trait,
      statEffects: this.calculateStatEffects(trait),
      timestamp: Date.now(),
    };

    await this.addMutationToFamiliar(familiarId, mutation);
    return mutation;
  }

  private generateTraitOptions(): TraitOption[] {
    const categories = ['legs', 'color', 'size', 'appendage', 'pattern'];
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];

    switch (randomCategory) {
      case 'legs':
        return [
          { id: 'legs_2', category: 'legs', label: '2 Legs', value: 2 },
          { id: 'legs_4', category: 'legs', label: '4 Legs', value: 4 },
          { id: 'legs_6', category: 'legs', label: '6 Legs', value: 6 },
          { id: 'legs_8', category: 'legs', label: '8 Legs', value: 8 },
        ];
      case 'color':
        return [
          { id: 'color_red', category: 'color', label: 'Red', value: '#ff0000' },
          { id: 'color_blue', category: 'color', label: 'Blue', value: '#0000ff' },
          { id: 'color_green', category: 'color', label: 'Green', value: '#00ff00' },
          { id: 'color_purple', category: 'color', label: 'Purple', value: '#ff00ff' },
          { id: 'color_gold', category: 'color', label: 'Gold', value: '#ffd700' },
        ];
      case 'size':
        return [
          { id: 'size_tiny', category: 'size', label: 'Tiny', value: 0.5 },
          { id: 'size_small', category: 'size', label: 'Small', value: 0.75 },
          { id: 'size_medium', category: 'size', label: 'Medium', value: 1.0 },
          { id: 'size_large', category: 'size', label: 'Large', value: 1.5 },
          { id: 'size_giant', category: 'size', label: 'Giant', value: 2.0 },
        ];
      default:
        return [];
    }
  }

  private applyRandomness(value: any, factor: number): any {
    if (typeof value === 'number') {
      const variance = value * (1 - factor);
      return value + (Math.random() - 0.5) * variance * 2;
    }
    return value;
  }

  private calculateStatEffects(trait: any): StatEffects {
    // Simplified stat calculation
    const effects: StatEffects = {};

    if (trait.category === 'legs') {
      const legCount = trait.value as number;
      effects.mobility = {
        speed: legCount <= 4 ? 10 : -5,
        agility: legCount === 2 ? 15 : legCount === 4 ? 10 : 5,
      };
    }

    if (trait.category === 'size') {
      const size = trait.value as number;
      effects.survival = {
        attack: size > 1 ? 20 : -10,
        defense: size > 1 ? 15 : -5,
      };
      effects.mobility = {
        speed: size < 1 ? 15 : -10,
      };
    }

    return effects;
  }

  private async addMutationToFamiliar(
    familiarId: string,
    mutation: MutationData
  ): Promise<void> {
    const data = await this.redis.hgetall(familiarId);
    const mutations = JSON.parse(data.mutations || '[]');
    mutations.push(mutation);

    await this.redis.hset(familiarId, 'mutations', JSON.stringify(mutations));

    // Update stats
    await this.updateFamiliarStats(familiarId, mutation.statEffects);
  }

  private async updateFamiliarStats(
    familiarId: string,
    effects: StatEffects
  ): Promise<void> {
    const data = await this.redis.hgetall(familiarId);
    const stats = JSON.parse(data.stats);

    for (const [category, changes] of Object.entries(effects)) {
      for (const [stat, delta] of Object.entries(changes)) {
        if (stats[category] && stats[category][stat] !== undefined) {
          stats[category][stat] = Math.max(0, Math.min(100, stats[category][stat] + delta));
        }
      }
    }

    await this.redis.hset(familiarId, 'stats', JSON.stringify(stats));
  }

  private selectMutationFromActivity(pattern: ActivityPattern): string {
    // Bias mutation based on dominant category
    const categoryMutations: Record<string, string[]> = {
      gaming: ['sharp_claws', 'quick_reflexes', 'tactical_eyes'],
      nature: ['leaf_pattern', 'bark_skin', 'flower_bloom'],
      tech: ['circuit_pattern', 'glowing_nodes', 'antenna'],
      art: ['color_shift', 'pattern_morph', 'aesthetic_form'],
      animals: ['fur', 'scales', 'feathers', 'whiskers'],
    };

    const mutations = categoryMutations[pattern.dominantCategory] || [];
    return mutations[Math.floor(Math.random() * mutations.length)] || this.selectRandomMutationType();
  }

  private selectRandomMutationType(): string {
    const types = ['legs', 'color', 'size', 'appendage', 'pattern', 'texture'];
    return types[Math.floor(Math.random() * types.length)];
  }

  private generateRandomTrait(type: string, randomnessFactor: number): MutationTrait {
    // Generate random trait based on type
    return {
      category: type,
      value: Math.random(),
      randomnessFactor,
    };
  }
}
```


#### 4. ActivityTracker (Privacy-Compliant)

Tracks user's Reddit posting activity with explicit opt-in.

```typescript
class ActivityTracker {
  constructor(
    private redis: RedisClient,
    private reddit: RedditAPI
  ) {}

  async updateActivityPattern(userId: string): Promise<void> {
    // Check if user has opted in
    const familiarId = `familiar:${userId}`;
    const data = await this.redis.hgetall(familiarId);
    
    if (data.privacyOptIn !== 'true') {
      return; // User has not opted in, skip tracking
    }

    try {
      // Get user's public posts from last 30 days
      const posts = await this.reddit.getPostsByUser({
        username: userId,
        timeframe: 'month',
        limit: 100,
      });

      // Categorize posts by subreddit
      const categories = await this.categorizePostsBySubreddit(posts);

      // Store pattern
      const patternKey = `activity:${userId}`;
      await this.redis.hset(patternKey, {
        categories: JSON.stringify(categories),
        lastUpdated: Date.now(),
      });
      await this.redis.expire(patternKey, 30 * 24 * 60 * 60); // 30 days

    } catch (error) {
      console.error('Failed to update activity pattern:', error);
      // Fail silently - don't break the game if Reddit API fails
    }
  }

  async getActivityPattern(userId: string): Promise<ActivityPattern> {
    const patternKey = `activity:${userId}`;
    const data = await this.redis.hgetall(patternKey);

    if (!data || Object.keys(data).length === 0) {
      return {
        categories: {},
        dominantCategory: 'general',
        lastUpdated: 0,
      };
    }

    const categories = JSON.parse(data.categories);
    return {
      categories,
      dominantCategory: this.getDominantCategory(categories),
      lastUpdated: parseInt(data.lastUpdated),
    };
  }

  async setPrivacyOptIn(userId: string, optIn: boolean): Promise<void> {
    const familiarId = `familiar:${userId}`;
    await this.redis.hset(familiarId, 'privacyOptIn', optIn ? 'true' : 'false');

    if (!optIn) {
      // Clear activity data if user opts out
      const patternKey = `activity:${userId}`;
      await this.redis.del(patternKey);
    }
  }

  private async categorizePostsBySubreddit(posts: Post[]): Promise<Record<string, number>> {
    const categories: Record<string, number> = {};

    for (const post of posts) {
      const category = await this.getSubredditCategory(post.subreddit);
      categories[category] = (categories[category] || 0) + 1;
    }

    return categories;
  }

  private async getSubredditCategory(subreddit: string): Promise<string> {
    // Simplified categorization - in production, use more sophisticated mapping
    const categoryMap: Record<string, string[]> = {
      animals: ['cats', 'dogs', 'aww', 'animals', 'pets', 'birbs', 'rabbits'],
      gaming: ['gaming', 'games', 'pcgaming', 'xbox', 'playstation', 'nintendo'],
      tech: ['programming', 'technology', 'coding', 'webdev', 'machinelearning'],
      nature: ['nature', 'earthporn', 'hiking', 'outdoors', 'camping'],
      art: ['art', 'drawing', 'painting', 'design', 'photography'],
      science: ['science', 'space', 'physics', 'biology', 'chemistry'],
    };

    const lowerSubreddit = subreddit.toLowerCase();
    for (const [category, keywords] of Object.entries(categoryMap)) {
      if (keywords.some((kw) => lowerSubreddit.includes(kw))) {
        return category;
      }
    }

    return 'general';
  }

  private getDominantCategory(categories: Record<string, number>): string {
    let maxCategory = 'general';
    let maxCount = 0;

    for (const [category, count] of Object.entries(categories)) {
      if (count > maxCount) {
        maxCount = count;
        maxCategory = category;
      }
    }

    return maxCategory;
  }
}

interface ActivityPattern {
  categories: Record<string, number>;
  dominantCategory: string;
  lastUpdated: number;
}
```

#### 5. EvolutionScheduler

Manages evolution cycles and care meter decay.

```typescript
class EvolutionScheduler {
  constructor(
    private redis: RedisClient,
    private mutationEngine: MutationEngine,
    private careSystem: CareSystem,
    private familiarManager: FamiliarManager,
    private scheduler: DevvitScheduler
  ) {}

  async scheduleEvolutionCycle(familiarId: string): Promise<void> {
    // Random interval between 30 minutes and 4 hours
    const minMs = 30 * 60 * 1000;
    const maxMs = 4 * 60 * 60 * 1000;
    const intervalMs = minMs + Math.random() * (maxMs - minMs);

    await this.scheduler.runJob({
      name: `evolution:${familiarId}`,
      cron: null,
      runAt: new Date(Date.now() + intervalMs),
      data: { familiarId },
    });
  }

  async handleEvolutionCycle(familiarId: string): Promise<void> {
    // Get user ID from familiar ID
    const userId = familiarId.replace('familiar:', '');

    // Increment age
    await this.redis.hincrby(familiarId, 'age', 1);

    // Decay care meter
    await this.careSystem.decayCareMeter(familiarId);

    // Check for neglect/removal
    const shouldRemove = await this.familiarManager.checkForRemoval(familiarId);
    if (shouldRemove) {
      // Don't schedule next cycle - familiar has been removed
      return;
    }

    // 20% chance of uncontrolled mutation
    if (Math.random() < 0.2) {
      await this.mutationEngine.generateUncontrolledMutation(familiarId, userId);
    }

    // Check for biome change (15% every 10 cycles)
    const age = parseInt(await this.redis.hget(familiarId, 'age'));
    if (age % 10 === 0 && Math.random() < 0.15) {
      await this.changeBiome(familiarId);
    }

    // Schedule next cycle
    await this.scheduleEvolutionCycle(familiarId);
  }

  async scheduleCareDecay(familiarId: string): Promise<void> {
    // Run every hour
    await this.scheduler.runJob({
      name: `care:decay:${familiarId}`,
      cron: '0 * * * *', // Every hour
      data: { familiarId },
    });
  }

  async handleCareDecay(familiarId: string): Promise<void> {
    await this.careSystem.decayCareMeter(familiarId);

    // Check if warning needed
    const needsWarning = await this.careSystem.checkNeglectWarning(familiarId);
    if (needsWarning) {
      // Store warning flag for client to display
      await this.redis.hset(familiarId, 'neglectWarning', 'true');
    }
  }

  private async changeBiome(familiarId: string): Promise<void> {
    const biomes: BiomeType[] = ['jungle', 'rocky_mountain', 'desert', 'ocean', 'cave'];
    const currentBiome = await this.redis.hget(familiarId, 'biome');

    // Select different biome
    const availableBiomes = biomes.filter((b) => b !== currentBiome);
    const newBiome = availableBiomes[Math.floor(Math.random() * availableBiomes.length)];

    await this.redis.hset(familiarId, 'biome', newBiome);
  }
}
```

## Data Models

### Redis Schema

```typescript
// Familiar
`familiar:{userId}` -> Hash {
  userId: string
  age: number
  careMeter: number (0-100)
  evolutionPoints: number
  mutations: string (JSON array of MutationData)
  stats: string (JSON FamiliarStats)
  biome: BiomeType
  lastCareTime: number (timestamp)
  createdAt: number (timestamp)
  privacyOptIn: string ('true' | 'false')
  neglectWarning: string ('true' | 'false')
}

// Archived Familiar (after removal)
`familiar:archived:{userId}` -> Hash {
  // Same structure as familiar
}

// Activity Pattern (30 day TTL, only if opted in)
`activity:{userId}` -> Hash {
  categories: string (JSON object: category -> count)
  lastUpdated: number (timestamp)
}

// Mutation Choice Session (5 minute TTL)
`mutation:choice:{familiarId}:{timestamp}` -> Hash {
  familiarId: string
  options: string (JSON array of TraitOption)
  createdAt: number (timestamp)
}

// Care Action Cooldown (5 minute TTL)
`cooldown:{familiarId}:{action}` -> string (timestamp)
```

### TypeScript Interfaces

```typescript
interface FamiliarState {
  id: string;
  userId: string;
  age: number;
  careMeter: number;
  evolutionPoints: number;
  mutations: MutationData[];
  stats: FamiliarStats;
  biome: BiomeType;
  lastCareTime: number;
  createdAt: number;
  privacyOptIn: boolean;
}

interface FamiliarStats {
  mobility: {
    speed: number; // 0-100
    agility: number; // 0-100
    endurance: number; // 0-100
  };
  senses: {
    vision: number; // 0-100
    hearing: number; // 0-100
    smell: number; // 0-100
  };
  survival: {
    attack: number; // 0-100
    defense: number; // 0-100
    stealth: number; // 0-100
  };
  cognition: {
    intelligence: number; // 0-100
    social: number; // 0-100
    adaptability: number; // 0-100
  };
  vitals: {
    health: number; // 0-100
    happiness: number; // 0-100
    energy: number; // 0-100
  };
}

interface MutationData {
  id: string;
  type: 'controlled' | 'uncontrolled';
  trait: MutationTrait;
  statEffects: StatEffects;
  timestamp: number;
}

interface MutationTrait {
  category: string;
  value: any;
  randomnessFactor: number;
}

interface MutationChoice {
  sessionId: string;
  options: TraitOption[];
}

interface TraitOption {
  id: string;
  category: string;
  label: string;
  value: any;
}

interface StatEffects {
  [category: string]: {
    [stat: string]: number;
  };
}

type BiomeType = 'jungle' | 'rocky_mountain' | 'desert' | 'ocean' | 'cave';
```

## API Endpoints

### GET /api/familiar/state

Returns the current state of the user's familiar.

**Response:**
```json
{
  "familiar": {
    "id": "familiar:user123",
    "age": 15,
    "careMeter": 75,
    "evolutionPoints": 250,
    "mutations": [...],
    "stats": {...},
    "biome": "jungle",
    "neglectWarning": false
  }
}
```

### POST /api/familiar/create

Creates a new familiar for the user.

**Response:**
```json
{
  "familiar": {
    "id": "familiar:user123",
    "age": 0,
    "careMeter": 100,
    "evolutionPoints": 0,
    ...
  }
}
```

### POST /api/care/feed
### POST /api/care/play
### POST /api/care/attention

Performs a care action on the familiar.

**Response:**
```json
{
  "careMeter": 85,
  "evolutionPoints": 260,
  "careMeterIncrease": 15,
  "evolutionPointsGained": 10
}
```

### POST /api/mutation/trigger

Triggers a controlled mutation (costs 100 EP).

**Response:**
```json
{
  "sessionId": "mutation:choice:familiar:user123:1234567890",
  "options": [
    {
      "id": "legs_2",
      "category": "legs",
      "label": "2 Legs",
      "value": 2
    },
    ...
  ]
}
```

### POST /api/mutation/choose

Applies the chosen mutation trait.

**Request:**
```json
{
  "sessionId": "mutation:choice:familiar:user123:1234567890",
  "optionId": "legs_4"
}
```

**Response:**
```json
{
  "mutation": {
    "id": "mut:1234567890",
    "type": "controlled",
    "trait": {...},
    "statEffects": {...}
  }
}
```

### POST /api/privacy/opt-in

Sets the user's privacy preference for personality reflection.

**Request:**
```json
{
  "optIn": true
}
```

**Response:**
```json
{
  "success": true,
  "privacyOptIn": true
}
```


## Error Handling

### Client-Side Error Handling

```typescript
class APIClient {
  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    retries: number = 3
  ): Promise<Response> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        if (response.ok) {
          return response;
        }

        if (response.status >= 500 && i < retries - 1) {
          // Server error, retry with exponential backoff
          await this.sleep(Math.pow(2, i) * 1000);
          continue;
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        if (i === retries - 1) {
          throw error;
        }
        await this.sleep(Math.pow(2, i) * 1000);
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
```

### Server-Side Error Handling

```typescript
// Middleware for error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  if (err.message.includes('Insufficient evolution points')) {
    return res.status(400).json({ error: err.message });
  }

  if (err.message.includes('Action on cooldown')) {
    return res.status(429).json({ error: 'Action on cooldown. Please wait.' });
  }

  if (err.message.includes('Redis')) {
    return res.status(503).json({ error: 'Service temporarily unavailable' });
  }

  res.status(500).json({ error: 'Internal server error' });
});

// Redis operation wrapper with retry
async function safeRedisOperation<T>(
  operation: () => Promise<T>,
  fallback: T,
  retries: number = 3
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error) {
      console.error(`Redis operation failed (attempt ${i + 1}/${retries}):`, error);
      if (i === retries - 1) {
        return fallback;
      }
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  return fallback;
}
```

## Testing Strategy

### Unit Tests

**Client Components**

- `SceneManager`: Test camera rotation, spotlight positioning
- `FamiliarRenderer`: Test mutation application, animation timing, care meter visuals
- `BiomeRenderer`: Test biome switching, object placement
- `HUDDrawer`: Test expand/collapse, stat updates
- `CareActionUI`: Test button cooldowns, feedback display

**Server Components**

- `FamiliarManager`: Test familiar creation, care meter updates, removal logic
- `CareSystem`: Test care actions, cooldowns, decay calculations
- `MutationEngine`: Test controlled/uncontrolled mutations, randomness application
- `ActivityTracker`: Test privacy opt-in, post categorization, pattern aggregation
- `EvolutionScheduler`: Test cycle timing, mutation triggering, biome changes

### Integration Tests

**Full User Flows**

1. **New User Journey**
   - User opens app → familiar created → privacy dialog shown → familiar appears
   - Verify: User sees environment, HUD shows care meter at 100, familiar is pulsating blob

2. **Care Action Flow**
   - User clicks feed → care meter increases → evolution points awarded → cooldown starts
   - Verify: Care meter updated, EP awarded, button disabled for 5 minutes

3. **Controlled Mutation Flow**
   - User triggers mutation → options displayed → user chooses → mutation applies
   - Verify: EP deducted, trait applied with randomness, stats updated

4. **Uncontrolled Mutation Flow (Opted In)**
   - Evolution cycle triggers → activity analyzed → mutation reflects personality
   - Verify: Age increments, mutation influenced by posting patterns

5. **Neglect Flow**
   - Care meter decays → warning at 20 → removal at 0 for 24 hours
   - Verify: Warning displayed, familiar removed after 24 hours at 0

### Performance Tests

**Client Performance**

- Target: 60fps on desktop, 30fps on mobile
- Test: Render familiar with 20+ mutations
- Test: Rotate camera 360° smoothly
- Test: Care action animations without frame drops

**Server Performance**

- Target: API response < 200ms
- Test: Multiple care actions in quick succession
- Test: Redis operations under load
- Test: Scheduler handling multiple familiars

### Mobile Testing

**Touch Controls**

- Test: Swipe to rotate camera
- Test: Tap HUD handle to expand/collapse
- Test: Tap care action buttons
- Test: Tap mutation options

**Responsive Layout**

- Test: HUD drawer on various screen sizes
- Test: Care buttons on small screens
- Test: Stat display readability

**Performance**

- Test: Frame rate on mid-range Android device
- Test: Frame rate on iPhone
- Test: Battery consumption during 10-minute session

## Deployment Considerations

### Environment Variables

```typescript
// Server configuration
const config = {
  redisUrl: process.env.REDIS_URL,
  subredditId: process.env.SUBREDDIT_ID,
  evolutionCycleMin: parseInt(process.env.EVOLUTION_CYCLE_MIN || '30'),
  evolutionCycleMax: parseInt(process.env.EVOLUTION_CYCLE_MAX || '240'),
  evolutionPointCost: parseInt(process.env.EVOLUTION_POINT_COST || '100'),
  careDecayRate: parseInt(process.env.CARE_DECAY_RATE || '5'), // per hour
  careCooldown: parseInt(process.env.CARE_COOLDOWN || '300'), // seconds
};
```

### Monitoring

**Key Metrics to Track**

- Active familiars count
- Average familiar age
- Care actions per day
- Mutation frequency (controlled vs uncontrolled)
- Privacy opt-in rate
- Removal rate (neglect)
- API response times
- Redis memory usage
- Client FPS (p50, p95, p99)
- Error rates by endpoint

### Scaling Considerations

**Redis Memory Management**

- Each familiar: ~10KB (base + mutations + stats)
- Activity pattern: ~1KB per user (30-day TTL, only if opted in)
- Mutation sessions: ~2KB (5-minute TTL)

**Estimated Memory for 10,000 Users**

- Familiars: 100MB
- Activity patterns (assume 50% opt-in): 5MB
- Active mutation sessions (assume 10): 20KB
- **Total: ~105MB**

**Scheduler Load**

- One evolution cycle job per familiar
- Average interval: ~2 hours
- 10,000 familiars = ~5,000 jobs/hour = ~83 jobs/minute
- One care decay job per familiar (hourly)
- 10,000 jobs/hour = ~167 jobs/minute
- **Total: ~250 jobs/minute**

## Privacy and Security

### Privacy Compliance

**Data Collection**

- Only collect public post data with explicit opt-in
- Never track subreddit visits or browsing history
- Store minimal data necessary for game functionality
- Allow users to opt-out at any time

**Data Deletion**

- When user opts out: Delete activity patterns immediately
- When familiar is removed: Archive data for 30 days, then delete
- Provide user data export on request

### Security Measures

**Input Validation**

```typescript
function validateMutationChoice(optionId: string): boolean {
  return /^[a-z_0-9]+$/.test(optionId) && optionId.length < 50;
}

function validateCareAction(action: string): boolean {
  return ['feed', 'play', 'attention'].includes(action);
}
```

**Rate Limiting**

- Care actions: 5-minute cooldown per action type
- Mutation triggers: Once per 100 EP earned
- API calls: 100 requests per minute per user

**Anti-Cheat**

- Server-side validation of all actions
- Cooldown enforcement in Redis
- Evolution point balance checks before mutations
- Timestamp validation for care meter decay

## Future Enhancements (Phase 2)

### Post-MVP Features

**1. Familiar Battles**

- Players can challenge each other
- Battle outcome based on stat comparison
- Winner gets evolution points

**2. Familiar Showcase**

- Public gallery of familiars
- Leaderboards for oldest/most unique
- Share familiar evolution history

**3. Breeding System**

- Two players can breed familiars
- Offspring inherits traits from both parents
- Creates new generation

**4. Advanced Mutations**

- Unlock special mutations through achievements
- Rare mutations with unique effects
- Mutation combinations create new traits

**5. Social Features**

- Friend list to visit other familiars
- Gift evolution points to friends
- Collaborative care for sick familiars

## Conclusion

This design provides a comprehensive architecture for Re-GenX Phase 1 that balances:

- **Personal Connection**: Single-player familiar creates intimate bond
- **Active Care**: Tamagotchi-style mechanics with consequences
- **Control vs Chaos**: Randomness spectrum (0.05-0.95)
- **Privacy-First**: Explicit opt-in for personality reflection
- **Visual Drama**: Spotlight effect with 5ft visibility
- **Mobile-First**: Touch controls and performance optimization
- **Data Persistence**: Redis with retry logic

The modular component structure allows for incremental development and testing, while the clear separation between client and server enables parallel development. The privacy-compliant activity tracking creates emergent gameplay where familiars can reflect their owner's personality, making each familiar truly unique while respecting user privacy.

