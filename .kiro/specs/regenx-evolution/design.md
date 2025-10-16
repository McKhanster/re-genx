# Design Document

## Overview

Re-GenX is a collaborative creature evolution game built on Reddit's Devvit platform using Three.js for 3D rendering. The architecture follows a client-server pattern where 25-player groups share ownership of a single creature that evolves through democratic voting and behavior-influenced mutations. The visual presentation features a dramatic spotlight effect with the creature at center stage, surrounded by darkness beyond a 5ft radius, viewable from 360 degrees.

### Core Design Principles

1. **Mobile-First**: Optimize for touch controls and 30fps minimum on mobile devices
2. **Group Collaboration**: All 25 members contribute to evolution decisions
3. **Controlled Chaos**: Balance player control (85-95%) with randomness (5-15%)
4. **Visual Drama**: Spotlight effect creates focus and reduces rendering complexity
5. **Data Persistence**: Everything stored in Redis with retry logic

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
│  │  - Creature Renderer                                  │   │
│  │  - Biome Environment                                  │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  UI Layer                                             │   │
│  │  - Slide-up HUD Drawer                                │   │
│  │  - Voting Interface                                   │   │
│  │  - Mutation Notifications                             │   │
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
│  │  - /api/group/status                                  │   │
│  │  - /api/creature/state                                │   │
│  │  - /api/mutation/vote                                 │   │
│  │  - /api/karma/contribute                              │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Business Logic                                       │   │
│  │  - Group Manager                                      │   │
│  │  - Mutation Engine                                    │   │
│  │  - Voting System                                      │   │
│  │  - Behavior Tracker                                   │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Scheduler Jobs                                       │   │
│  │  - Evolution Cycle Trigger                            │   │
│  │  - Behavior Pattern Update                            │   │
│  │  - Biome Change Check                                 │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                      Redis (Devvit)                          │
│  - Group data (members, karma pool)                          │
│  - Creature state (mutations, stats, age)                    │
│  - Voting sessions (active votes, results)                   │
│  - Behavior patterns (subreddit visit data)                  │
│  - Waiting room queues                                       │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow Examples

**Example 1: User Joins Game**

1. User clicks "Play" on Reddit post
2. Client loads, calls `GET /api/group/status`
3. Server checks Redis for user's group membership
4. If no group: Add to waiting room, return `{status: 'waiting', count: 15/25}`
5. If in group: Return group ID and creature ID
6. Client calls `GET /api/creature/state` to load creature
7. Server fetches creature data from Redis
8. Client renders creature in Three.js scene

**Example 2: Controlled Mutation Vote**

1. User initiates genetic shot purchase
2. Client calls `POST /api/mutation/purchase`
3. Server deducts 100 karma from group pool
4. Server creates mutation session in Redis
5. Server returns mutation options for 3 trait categories
6. Client displays voting UI
7. Users vote via `POST /api/mutation/vote`
8. After 5 minutes, server applies winning traits
9. Server updates creature state in Redis
10. Clients poll and receive updated creature state

## Components and Interfaces

### Client Components

#### 1. SceneManager

Manages the Three.js scene, camera, and lighting.

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
  }

  public rotateCamera(angle: number): void {
    // Rotate around Y axis, keep creature centered
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

#### 2. CreatureRenderer

Renders the creature with all applied mutations.

```typescript
interface MutationGeometry {
  type: string;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  position: THREE.Vector3;
  scale: THREE.Vector3;
  rotation: THREE.Euler;
}

class CreatureRenderer {
  private baseMesh: THREE.Mesh;
  private mutationMeshes: Map<string, THREE.Mesh>;

  constructor(scene: THREE.Scene) {
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

  public applyMutation(mutation: MutationData, randomnessFactor: number): void {
    const geometry = this.generateMutationGeometry(mutation, randomnessFactor);
    const mesh = new THREE.Mesh(geometry.geometry, geometry.material);
    mesh.position.copy(geometry.position);
    mesh.scale.copy(geometry.scale);
    mesh.rotation.copy(geometry.rotation);

    this.mutationMeshes.set(mutation.id, mesh);
    this.baseMesh.add(mesh);
  }

  public animateMutation(mutationId: string, duration: number): Promise<void> {
    // Animate scale from 0 to target over duration
    return new Promise((resolve) => {
      const mesh = this.mutationMeshes.get(mutationId);
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
    // Subtle pulsating effect
    const scale = 1 + Math.sin(Date.now() * 0.001) * 0.05;
    this.baseMesh.scale.set(scale, scale, scale);
  }
}
```

#### 3. BiomeRenderer

Renders the environment within the 5ft visibility radius.

```typescript
type BiomeType = 'jungle' | 'rocky_mountain' | 'desert' | 'ocean' | 'cave';

class BiomeRenderer {
  private groundMesh: THREE.Mesh;
  private environmentObjects: THREE.Object3D[];
  private currentBiome: BiomeType;

  constructor(scene: THREE.Scene) {
    this.environmentObjects = [];
    this.initGround(scene);
  }

  private initGround(scene: THREE.Scene): void {
    const geometry = new THREE.CircleGeometry(5, 64);
    const material = new THREE.MeshStandardMaterial({ color: 0x333333 });
    this.groundMesh = new THREE.Mesh(geometry, material);
    this.groundMesh.rotation.x = -Math.PI / 2;
    this.groundMesh.position.y = -1;
    scene.add(this.groundMesh);
  }

  public setBiome(biome: BiomeType, scene: THREE.Scene): void {
    this.clearEnvironment(scene);
    this.currentBiome = biome;

    switch (biome) {
      case 'jungle':
        this.createJungleBiome(scene);
        break;
      case 'rocky_mountain':
        this.createRockyMountainBiome(scene);
        break;
      case 'desert':
        this.createDesertBiome(scene);
        break;
      case 'ocean':
        this.createOceanBiome(scene);
        break;
      case 'cave':
        this.createCaveBiome(scene);
        break;
    }
  }

  private createJungleBiome(scene: THREE.Scene): void {
    // Update ground texture
    this.groundMesh.material = new THREE.MeshStandardMaterial({
      color: 0x2d5016,
      roughness: 0.8,
    });

    // Add vegetation within 5ft radius
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const distance = 3 + Math.random() * 1.5;
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;

      const plant = this.createPlant();
      plant.position.set(x, -1, z);
      scene.add(plant);
      this.environmentObjects.push(plant);
    }
  }

  private clearEnvironment(scene: THREE.Scene): void {
    this.environmentObjects.forEach((obj) => scene.remove(obj));
    this.environmentObjects = [];
  }
}
```

#### 4. HUDDrawer

Slide-up drawer menu displaying stats and controls.

```typescript
class HUDDrawer {
  private container: HTMLElement;
  private isExpanded: boolean = false;

  constructor() {
    this.createDrawer();
    this.attachEventListeners();
  }

  private createDrawer(): void {
    this.container = document.createElement('div');
    this.container.className = 'hud-drawer';
    this.container.innerHTML = `
      <div class="hud-handle">
        <div class="handle-bar"></div>
      </div>
      <div class="hud-content">
        <div class="hud-section">
          <h3>Creature Stats</h3>
          <div id="stats-display"></div>
        </div>
        <div class="hud-section">
          <h3>Group Members</h3>
          <div id="members-display"></div>
        </div>
        <div class="hud-section">
          <h3>Karma Pool</h3>
          <div id="karma-display"></div>
        </div>
      </div>
    `;
    document.body.appendChild(this.container);
  }

  private attachEventListeners(): void {
    const handle = this.container.querySelector('.hud-handle');
    handle.addEventListener('click', () => this.toggle());

    // Touch support
    let startY = 0;
    handle.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
    });
    handle.addEventListener('touchmove', (e) => {
      const deltaY = e.touches[0].clientY - startY;
      if (Math.abs(deltaY) > 50) {
        if (deltaY < 0 && !this.isExpanded) {
          this.expand();
        } else if (deltaY > 0 && this.isExpanded) {
          this.collapse();
        }
      }
    });
  }

  public toggle(): void {
    if (this.isExpanded) {
      this.collapse();
    } else {
      this.expand();
    }
  }

  public expand(): void {
    this.isExpanded = true;
    this.container.classList.add('expanded');
  }

  public collapse(): void {
    this.isExpanded = false;
    this.container.classList.remove('expanded');
  }

  public updateStats(stats: CreatureStats): void {
    const display = document.getElementById('stats-display');
    display.innerHTML = `
      <div class="stat-category">
        <h4>Mobility</h4>
        <div class="stat-bar">
          <span>Speed</span>
          <div class="bar"><div class="fill" style="width: ${stats.mobility.speed}%"></div></div>
        </div>
        <!-- More stats... -->
      </div>
    `;
  }
}
```

### Server Components

#### 1. GroupManager

Manages group formation and waiting room logic.

```typescript
class GroupManager {
  constructor(private redis: RedisClient) {}

  async getUserGroup(userId: string, subredditId: string): Promise<GroupStatus> {
    // Check if user already in a group
    const groupId = await this.redis.get(`user:${userId}:group`);
    if (groupId) {
      return { status: 'in_group', groupId };
    }

    // Add to waiting room
    await this.redis.sadd(`waitingroom:${subredditId}:current`, userId);
    const count = await this.redis.scard(`waitingroom:${subredditId}:current`);

    // Check if we have 25 members
    if (count >= 25) {
      return await this.createGroup(subredditId);
    }

    return { status: 'waiting', count, total: 25 };
  }

  private async createGroup(subredditId: string): Promise<GroupStatus> {
    const members = await this.redis.spop(`waitingroom:${subredditId}:current`, 25);
    const groupId = `group:${subredditId}:${Date.now()}`;

    // Create group
    await this.redis.hset(groupId, {
      members: JSON.stringify(members),
      karmaPool: 0,
      createdAt: Date.now(),
    });

    // Map users to group
    for (const userId of members) {
      await this.redis.set(`user:${userId}:group`, groupId);
    }

    // Create creature
    const creatureId = await this.createCreature(groupId);
    await this.redis.hset(groupId, 'creatureId', creatureId);

    return { status: 'in_group', groupId, creatureId };
  }

  private async createCreature(groupId: string): Promise<string> {
    const creatureId = `creature:${groupId}`;
    const biomes: BiomeType[] = ['jungle', 'rocky_mountain', 'desert', 'ocean', 'cave'];
    const randomBiome = biomes[Math.floor(Math.random() * biomes.length)];

    await this.redis.hset(creatureId, {
      groupId,
      age: 0,
      biome: randomBiome,
      mutations: JSON.stringify([]),
      stats: JSON.stringify(this.getDefaultStats()),
      createdAt: Date.now(),
    });

    return creatureId;
  }

  private getDefaultStats(): CreatureStats {
    return {
      mobility: { speed: 50, agility: 50, endurance: 50 },
      senses: { vision: 50, hearing: 50, smell: 50 },
      survival: { attack: 50, defense: 50, stealth: 50 },
      cognition: { intelligence: 50, social: 50, adaptability: 50 },
      vitals: { health: 100, population: 100, mutationRate: 50 },
    };
  }
}
```

#### 2. MutationEngine

Handles mutation generation, voting, and application.

```typescript
interface MutationData {
  id: string;
  type: 'controlled' | 'uncontrolled';
  traits: MutationTrait[];
  statEffects: StatEffects;
  timestamp: number;
}

interface MutationTrait {
  category: string; // 'legs', 'color', 'size', etc.
  value: any;
  randomnessFactor: number;
}

class MutationEngine {
  constructor(private redis: RedisClient) {}

  async purchaseGeneticShot(groupId: string, userId: string): Promise<MutationSession> {
    // Check karma pool
    const karmaPool = parseInt(await this.redis.hget(groupId, 'karmaPool'));
    if (karmaPool < 100) {
      throw new Error('Insufficient karma');
    }

    // Deduct karma
    await this.redis.hincrby(groupId, 'karmaPool', -100);

    // Create mutation session
    const sessionId = `mutation:${groupId}:${Date.now()}`;
    const traitCategories = this.generateTraitCategories();

    await this.redis.hset(sessionId, {
      groupId,
      type: 'controlled',
      traitCategories: JSON.stringify(traitCategories),
      votes: JSON.stringify({}),
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    });

    // Schedule session end
    await this.scheduleSessionEnd(sessionId);

    return { sessionId, traitCategories, expiresAt: Date.now() + 5 * 60 * 1000 };
  }

  private generateTraitCategories(): TraitCategory[] {
    return [
      {
        name: 'legs',
        options: [
          { id: 'legs_2', label: '2 Legs', value: 2 },
          { id: 'legs_4', label: '4 Legs', value: 4 },
          { id: 'legs_6', label: '6 Legs', value: 6 },
          { id: 'legs_8', label: '8 Legs', value: 8 },
        ],
      },
      {
        name: 'color',
        options: [
          { id: 'color_red', label: 'Red', value: '#ff0000' },
          { id: 'color_blue', label: 'Blue', value: '#0000ff' },
          { id: 'color_green', label: 'Green', value: '#00ff00' },
          { id: 'color_purple', label: 'Purple', value: '#ff00ff' },
        ],
      },
      {
        name: 'size',
        options: [
          { id: 'size_tiny', label: 'Tiny', value: 0.5 },
          { id: 'size_small', label: 'Small', value: 0.75 },
          { id: 'size_medium', label: 'Medium', value: 1.0 },
          { id: 'size_large', label: 'Large', value: 1.5 },
          { id: 'size_giant', label: 'Giant', value: 2.0 },
        ],
      },
    ];
  }

  async castVote(sessionId: string, userId: string, votes: Record<string, string>): Promise<void> {
    const sessionData = await this.redis.hgetall(sessionId);
    const currentVotes = JSON.parse(sessionData.votes || '{}');

    currentVotes[userId] = votes;
    await this.redis.hset(sessionId, 'votes', JSON.stringify(currentVotes));
  }

  async applyMutation(sessionId: string): Promise<MutationData> {
    const sessionData = await this.redis.hgetall(sessionId);
    const votes = JSON.parse(sessionData.votes);
    const traitCategories = JSON.parse(sessionData.traitCategories);

    // Tally votes for each category
    const winners = this.tallyVotes(votes, traitCategories);

    // Apply randomness factor (0.85-0.95 for controlled)
    const randomnessFactor = 0.85 + Math.random() * 0.1;
    const traits = winners.map((winner) => ({
      category: winner.category,
      value: this.applyRandomness(winner.value, randomnessFactor),
      randomnessFactor,
    }));

    // Create mutation
    const mutation: MutationData = {
      id: `mut:${Date.now()}`,
      type: 'controlled',
      traits,
      statEffects: this.calculateStatEffects(traits),
      timestamp: Date.now(),
    };

    // Save to creature
    const groupId = sessionData.groupId;
    const creatureId = await this.redis.hget(groupId, 'creatureId');
    await this.addMutationToCreature(creatureId, mutation);

    return mutation;
  }

  async generateUncontrolledMutation(creatureId: string): Promise<MutationData> {
    // Get behavior patterns
    const groupId = await this.redis.hget(creatureId, 'groupId');
    const behaviorPatterns = await this.getBehaviorPatterns(groupId);

    // Generate mutation influenced by behavior
    const mutationType = this.selectMutationTypeFromBehavior(behaviorPatterns);

    // Apply high randomness (0.05-0.15 control)
    const randomnessFactor = 0.05 + Math.random() * 0.1;
    const traits = this.generateRandomTraits(mutationType, randomnessFactor);

    const mutation: MutationData = {
      id: `mut:${Date.now()}`,
      type: 'uncontrolled',
      traits,
      statEffects: this.calculateStatEffects(traits),
      timestamp: Date.now(),
    };

    await this.addMutationToCreature(creatureId, mutation);
    return mutation;
  }

  private applyRandomness(value: any, factor: number): any {
    if (typeof value === 'number') {
      const variance = value * (1 - factor);
      return value + (Math.random() - 0.5) * variance * 2;
    }
    return value;
  }

  private calculateStatEffects(traits: MutationTrait[]): StatEffects {
    // Calculate stat changes based on traits
    const effects: StatEffects = {};

    for (const trait of traits) {
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
    }

    return effects;
  }

  private async addMutationToCreature(creatureId: string, mutation: MutationData): Promise<void> {
    const mutationsJson = await this.redis.hget(creatureId, 'mutations');
    const mutations = JSON.parse(mutationsJson || '[]');
    mutations.push(mutation);

    await this.redis.hset(creatureId, 'mutations', JSON.stringify(mutations));

    // Update stats
    await this.updateCreatureStats(creatureId, mutation.statEffects);
  }

  private async updateCreatureStats(creatureId: string, effects: StatEffects): Promise<void> {
    const statsJson = await this.redis.hget(creatureId, 'stats');
    const stats = JSON.parse(statsJson);

    // Apply effects
    for (const [category, changes] of Object.entries(effects)) {
      for (const [stat, delta] of Object.entries(changes)) {
        stats[category][stat] = Math.max(0, Math.min(100, stats[category][stat] + delta));
      }
    }

    await this.redis.hset(creatureId, 'stats', JSON.stringify(stats));
  }
}
```

#### 3. BehaviorTracker

Tracks group member activity across Reddit to influence mutations.

```typescript
class BehaviorTracker {
  constructor(
    private redis: RedisClient,
    private reddit: RedditAPI
  ) {}

  async trackUserActivity(userId: string, groupId: string): Promise<void> {
    // Get user's recent subreddit visits (last 7 days)
    const recentActivity = await this.reddit.getUserActivity(userId, 7);

    // Extract subreddit categories
    const subredditCategories = await this.categorizeSubreddits(recentActivity.subreddits);

    // Store in Redis
    const key = `behavior:${groupId}:${userId}`;
    await this.redis.hset(key, {
      subreddits: JSON.stringify(subredditCategories),
      lastUpdated: Date.now(),
    });

    // Set expiry (7 days)
    await this.redis.expire(key, 7 * 24 * 60 * 60);
  }

  async getGroupBehaviorPatterns(groupId: string): Promise<BehaviorPattern> {
    const members = JSON.parse(await this.redis.hget(groupId, 'members'));
    const patterns: Record<string, number> = {};

    // Aggregate behavior across all members
    for (const userId of members) {
      const key = `behavior:${groupId}:${userId}`;
      const data = await this.redis.hgetall(key);

      if (data.subreddits) {
        const categories = JSON.parse(data.subreddits);
        for (const [category, count] of Object.entries(categories)) {
          patterns[category] = (patterns[category] || 0) + (count as number);
        }
      }
    }

    // Normalize to percentages
    const total = Object.values(patterns).reduce((sum, count) => sum + count, 0);
    const normalized: Record<string, number> = {};
    for (const [category, count] of Object.entries(patterns)) {
      normalized[category] = (count / total) * 100;
    }

    return {
      categories: normalized,
      dominantCategory: this.getDominantCategory(normalized),
      lastUpdated: Date.now(),
    };
  }

  private async categorizeSubreddits(subreddits: string[]): Promise<Record<string, number>> {
    const categories: Record<string, number> = {};

    for (const subreddit of subreddits) {
      const category = await this.getSubredditCategory(subreddit);
      categories[category] = (categories[category] || 0) + 1;
    }

    return categories;
  }

  private async getSubredditCategory(subreddit: string): Promise<string> {
    // Simplified categorization - in production, use ML or API
    const categoryMap: Record<string, string[]> = {
      'animals': ['cats', 'dogs', 'aww', 'animals', 'pets'],
      'tech': ['programming', 'technology', 'coding', 'webdev'],
      'gaming': ['gaming', 'games', 'pcgaming', 'xbox'],
      'nature': ['nature', 'earthporn', 'hiking', 'outdoors'],
      'science': ['science', 'space', 'physics', 'biology'],
    };

    for (const [category, keywords] of Object.entries(categoryMap)) {
      if (keywords.some((kw) => subreddit.toLowerCase().includes(kw))) {
        return category;
      }
    }

    return 'general';
  }

  private getDominantCategory(patterns: Record<string, number>): string {
    let maxCategory = 'general';
    let maxValue = 0;

    for (const [category, value] of Object.entries(patterns)) {
      if (value > maxValue) {
        maxValue = value;
        maxCategory = category;
      }
    }

    return maxCategory;
  }
}
```

#### 4. EvolutionScheduler

Manages evolution cycle timing and triggers.

```typescript
class EvolutionScheduler {
  constructor(
    private redis: RedisClient,
    private mutationEngine: MutationEngine,
    private scheduler: DevvitScheduler
  ) {}

  async scheduleEvolutionCycle(creatureId: string): Promise<void> {
    // Random interval between 15 minutes and 2 hours
    const minMs = 15 * 60 * 1000;
    const maxMs = 2 * 60 * 60 * 1000;
    const intervalMs = minMs + Math.random() * (maxMs - minMs);

    await this.scheduler.runJob({
      name: `evolution:${creatureId}`,
      cron: null,
      runAt: new Date(Date.now() + intervalMs),
      data: { creatureId },
    });
  }

  async handleEvolutionCycle(creatureId: string): Promise<void> {
    // Increment age
    await this.redis.hincrby(creatureId, 'age', 1);

    // 30% chance of uncontrolled mutation
    if (Math.random() < 0.3) {
      await this.mutationEngine.generateUncontrolledMutation(creatureId);
    }

    // Check for biome change (20% every 10 cycles)
    const age = parseInt(await this.redis.hget(creatureId, 'age'));
    if (age % 10 === 0 && Math.random() < 0.2) {
      await this.changeBiome(creatureId);
    }

    // Schedule next cycle
    await this.scheduleEvolutionCycle(creatureId);
  }

  private async changeBiome(creatureId: string): Promise<void> {
    const biomes: BiomeType[] = ['jungle', 'rocky_mountain', 'desert', 'ocean', 'cave'];
    const currentBiome = await this.redis.hget(creatureId, 'biome');

    // Select different biome
    const availableBiomes = biomes.filter((b) => b !== currentBiome);
    const newBiome = availableBiomes[Math.floor(Math.random() * availableBiomes.length)];

    await this.redis.hset(creatureId, 'biome', newBiome);
  }
}
```

## Data Models

### Redis Schema

```typescript
// User to Group mapping
`user:{userId}:group` -> groupId (string)

// Waiting Room
`waitingroom:{subredditId}:current` -> Set<userId>

// Group
`group:{subredditId}:{timestamp}` -> Hash {
  members: string (JSON array of userIds)
  karmaPool: number
  creatureId: string
  createdAt: number
}

// Creature
`creature:{groupId}` -> Hash {
  groupId: string
  age: number
  biome: BiomeType
  mutations: string (JSON array of MutationData)
  stats: string (JSON CreatureStats)
  createdAt: number
}

// Mutation Session (temporary, 5 min TTL)
`mutation:{groupId}:{timestamp}` -> Hash {
  groupId: string
  type: 'controlled' | 'uncontrolled'
  traitCategories: string (JSON array)
  votes: string (JSON object: userId -> votes)
  expiresAt: number
}

// Behavior Tracking (7 day TTL)
`behavior:{groupId}:{userId}` -> Hash {
  subreddits: string (JSON object: category -> count)
  lastUpdated: number
}
```

### TypeScript Interfaces

```typescript
interface CreatureStats {
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
    population: number; // 0-10000
    mutationRate: number; // 0-100
  };
}

interface GroupStatus {
  status: 'waiting' | 'in_group';
  groupId?: string;
  creatureId?: string;
  count?: number;
  total?: number;
}

interface MutationSession {
  sessionId: string;
  traitCategories: TraitCategory[];
  expiresAt: number;
}

interface TraitCategory {
  name: string;
  options: TraitOption[];
}

interface TraitOption {
  id: string;
  label: string;
  value: any;
}

interface BehaviorPattern {
  categories: Record<string, number>;
  dominantCategory: string;
  lastUpdated: number;
}

interface StatEffects {
  [category: string]: {
    [stat: string]: number;
  };
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

  if (err.message.includes('Insufficient karma')) {
    return res.status(400).json({ error: err.message });
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
- `CreatureRenderer`: Test mutation application, animation timing
- `BiomeRenderer`: Test biome switching, object placement
- `HUDDrawer`: Test expand/collapse, stat updates

**Server Components**

- `GroupManager`: Test group formation, waiting room logic
- `MutationEngine`: Test vote tallying, randomness application, stat calculations
- `BehaviorTracker`: Test subreddit categorization, pattern aggregation
- `EvolutionScheduler`: Test cycle timing, mutation triggering

### Integration Tests

**Full User Flows**

1. **New User Journey**

   - User opens app → joins waiting room → group forms → creature appears
   - Verify: User sees environment, HUD shows "Waiting for players", creature appears when 25 join

2. **Controlled Mutation Flow**

   - Group purchases genetic shot → voting UI appears → users vote → mutation applies
   - Verify: Karma deducted, votes counted correctly, winning traits applied with randomness

3. **Uncontrolled Mutation Flow**

   - Evolution cycle triggers → 30% chance mutation → creature changes
   - Verify: Age increments, mutation influenced by behavior patterns

4. **Behavior Influence**
   - Track user subreddit visits → aggregate patterns → mutation reflects dominant category
   - Verify: Cat subreddit visits → feline traits more likely

### Performance Tests

**Client Performance**

- Target: 60fps on desktop, 30fps on mobile
- Test: Render creature with 20+ mutations
- Test: Rotate camera 360° smoothly
- Test: Expand/collapse HUD without frame drops

**Server Performance**

- Target: API response < 200ms
- Test: 25 concurrent votes on mutation session
- Test: Redis operations under load
- Test: Scheduler handling multiple creatures

### Mobile Testing

**Touch Controls**

- Test: Swipe to rotate camera
- Test: Tap HUD handle to expand/collapse
- Test: Tap voting options
- Test: Pinch to zoom (if implemented)

**Responsive Layout**

- Test: HUD drawer on various screen sizes
- Test: Voting UI on small screens
- Test: Stat display readability

**Performance**

- Test: Frame rate on mid-range Android device
- Test: Frame rate on iPhone
- Test: Battery consumption during 10-minute session

## Deployment Considerations

### Build Process

```bash
# Development
npm run dev  # Starts client, server, and devvit playtest

# Production build
npm run build  # Builds client and server bundles

# Deploy to Reddit
npm run deploy  # Uploads to Devvit platform
```

### Environment Variables

```typescript
// Server configuration
const config = {
  redisUrl: process.env.REDIS_URL,
  subredditId: process.env.SUBREDDIT_ID,
  evolutionCycleMin: parseInt(process.env.EVOLUTION_CYCLE_MIN || '15'),
  evolutionCycleMax: parseInt(process.env.EVOLUTION_CYCLE_MAX || '120'),
  karmaPoolContribution: parseFloat(process.env.KARMA_CONTRIBUTION || '0.1'),
  geneticShotCost: parseInt(process.env.GENETIC_SHOT_COST || '100'),
};
```

### Monitoring

**Key Metrics to Track**

- Active groups count
- Average creature age
- Mutation frequency (controlled vs uncontrolled)
- Voting participation rate
- API response times
- Redis memory usage
- Client FPS (p50, p95, p99)
- Error rates by endpoint

**Logging Strategy**

```typescript
// Structured logging
logger.info('mutation_applied', {
  creatureId,
  mutationType: 'controlled',
  traitCount: 3,
  votingParticipation: 0.84,
  duration: 2500,
});

logger.error('redis_operation_failed', {
  operation: 'hset',
  key: creatureId,
  attempt: 3,
  error: error.message,
});
```

### Scaling Considerations

**Redis Memory Management**

- Each creature: ~10KB (base + mutations + stats)
- Each group: ~2KB (members + karma pool)
- Behavior tracking: ~1KB per user per group (7-day TTL)
- Mutation sessions: ~5KB (5-minute TTL)

**Estimated Memory for 1000 Groups**

- Creatures: 10MB
- Groups: 2MB
- Behavior (25 users × 1000 groups): 25MB
- Active mutation sessions (assume 10): 50KB
- **Total: ~37MB**

**Scheduler Load**

- One evolution cycle job per creature
- Average interval: ~1 hour
- 1000 creatures = ~1000 jobs/hour = ~17 jobs/minute
- Well within Devvit scheduler limits

### Security Considerations

**Input Validation**

```typescript
// Validate vote payload
function validateVote(votes: any): votes is Record<string, string> {
  if (typeof votes !== 'object' || votes === null) {
    return false;
  }

  for (const [category, optionId] of Object.entries(votes)) {
    if (typeof category !== 'string' || typeof optionId !== 'string') {
      return false;
    }
  }

  return true;
}

// Sanitize user input
function sanitizeTraitValue(value: any, type: string): any {
  switch (type) {
    case 'number':
      const num = parseFloat(value);
      return isNaN(num) ? 0 : Math.max(0, Math.min(100, num));
    case 'color':
      return /^#[0-9A-Fa-f]{6}$/.test(value) ? value : '#000000';
    default:
      return String(value).slice(0, 100);
  }
}
```

**Rate Limiting**

```typescript
// Simple in-memory rate limiter
class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  isAllowed(userId: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];

    // Remove old requests outside window
    const recentRequests = userRequests.filter((time) => now - time < windowMs);

    if (recentRequests.length >= maxRequests) {
      return false;
    }

    recentRequests.push(now);
    this.requests.set(userId, recentRequests);
    return true;
  }
}

// Apply to endpoints
app.post('/api/mutation/vote', (req, res, next) => {
  if (!rateLimiter.isAllowed(req.userId, 100, 60000)) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  next();
});
```

**Anti-Cheat Measures**

- Vote weight based on account age (prevent new account spam)
- Prevent users from joining multiple groups
- Validate mutation compatibility before application
- Rate limit API calls per user

## Future Enhancements

### Post-MVP Features

**1. Creature Battles**

- Groups can challenge each other
- Battle outcome based on stat comparison
- Winner gets karma rewards

**2. Evolution Tree Visualization**

- Interactive diagram showing all mutation paths
- "What if" scenarios for alternative votes
- Time-lapse replay of evolution

**3. Achievements System**

- Unlock special mutations through milestones
- Display badges on group profile
- Leaderboards for oldest creatures

**4. Advanced Behavior Tracking**

- ML-based subreddit categorization
- Sentiment analysis of user comments
- Time-of-day activity patterns

**5. Creature Reproduction**

- Two groups can breed creatures
- Offspring inherits traits from both parents
- Creates new generation with mixed genetics

### Technical Improvements

**1. Real-time Updates**

- WebSocket support (if Devvit adds it)
- Push notifications for mutations
- Live voting updates

**2. Advanced Graphics**

- Procedural mutation generation
- Particle effects for mutations
- Dynamic lighting based on biome

**3. Performance Optimizations**

- Level-of-detail (LOD) for mutations
- Geometry instancing for repeated elements
- Texture atlasing for biomes

**4. Analytics Dashboard**

- Admin view of all creatures
- Mutation popularity statistics
- Group engagement metrics

## Conclusion

This design provides a comprehensive architecture for Re-GenX that balances:

- **Collaboration**: 25-player groups working together
- **Control vs Chaos**: Randomness spectrum (0.05-0.95)
- **Visual Drama**: Spotlight effect with 5ft visibility
- **Mobile-First**: Touch controls and performance optimization
- **Data Persistence**: Redis with retry logic
- **Scalability**: Efficient memory usage and scheduler design

The modular component structure allows for incremental development and testing, while the clear separation between client and server enables parallel development. The behavior tracking system creates emergent gameplay where creatures reflect their group's collective interests, making each creature truly unique.
