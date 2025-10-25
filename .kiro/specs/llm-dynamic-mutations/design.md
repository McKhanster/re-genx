# Design Document: LLM-Driven Dynamic Mutations

## Overview

This design implements an LLM-powered mutation and scene generation system for Re-GenX using Google Gemini API and a custom MCP (Model Context Protocol) server. The system enables contextual, dynamic mutations that respond to creature state, player activity, and environmental factors through real-time Three.js scene manipulation.

## Architecture

### High-Level Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         Devvit Server                            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    MCP Server (Node.js)                     │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │ │
│  │  │ LLM Processor│  │Scene State   │  │ Command         │  │ │
│  │  │ (Gemini API) │  │Manager       │  │ Executor        │  │ │
│  │  └──────┬───────┘  └──────┬───────┘  └────────┬────────┘  │ │
│  │         │                  │                    │           │ │
│  │  ┌──────┴──────────────────┴────────────────────┴────────┐ │ │
│  │  │           WebSocket Server (Port 8082)                 │ │ │
│  │  └────────────────────────┬───────────────────────────────┘ │ │
│  └───────────────────────────┼─────────────────────────────────┘ │
│                              │                                   │
│  ┌───────────────────────────┼─────────────────────────────────┐ │
│  │                    Redis Storage                            │ │
│  │  • Scene State Cache  • Mutation Cache  • Fallback Flags   │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────┼───────────────────────────────────┘
                               │ WebSocket
                               │
┌──────────────────────────────┼───────────────────────────────────┐
│                       Client (Browser)                            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                  Three.js Scene Manager                     │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │ │
│  │  │ Creature     │  │ Biome        │  │ Mutation        │  │ │
│  │  │ Renderer     │  │ Renderer     │  │ Geometry Gen    │  │ │
│  │  └──────────────┘  └──────────────┘  └─────────────────┘  │ │
│  │                                                             │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │         WebSocket Client (Scene State Sync)          │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```

## Component Design

### 1. MCP Server (Server-Side)

**Location:** `src/server/mcp/mcp-server.ts`

**Responsibilities:**
- Expose MCP tools to Google Gemini via stdio transport
- Manage WebSocket server on port 8082
- Maintain scene state synchronization
- Execute LLM-generated commands on Three.js client

**MCP Tools Exposed:**

```typescript
interface MCPTools {
  getSceneState(): SceneState;
  addMutation(params: AddMutationParams): CommandResult;
  modifyBiome(params: ModifyBiomeParams): CommandResult;
  animateObject(params: AnimateObjectParams): CommandResult;
  removeMutation(params: RemoveMutationParams): CommandResult;
}

interface SceneState {
  creatures: Array<{
    id: string;
    position: [number, number, number];
    mutations: MutationData[];
  }>;
  biome: {
    type: BiomeType;
    groundColor: string;
    objects: Array<{ id: string; type: string; position: [number, number, number] }>;
  };
  environmentObjects: Array<{ id: string; type: string; position: [number, number, number] }>;
}

interface AddMutationParams {
  // Geometry Definition - ALL Three.js Primitives
  geometry: {
    type: 'box' | 'sphere' | 'cylinder' | 'cone' | 'torus' | 'torusKnot' | 'plane' | 
          'circle' | 'ring' | 'polyhedron' | 'dodecahedron' | 'icosahedron' | 
          'octahedron' | 'tetrahedron' | 'lathe' | 'extrude' | 'shape' | 'tube' | 
          'edges' | 'wireframe' | 'custom';
    
    // Common dimensions for all primitives
    dimensions?: {
      // Box
      width?: number;
      height?: number;
      depth?: number;
      widthSegments?: number;
      heightSegments?: number;
      depthSegments?: number;
      
      // Sphere
      radius?: number;
      phiStart?: number;
      phiLength?: number;
      thetaStart?: number;
      thetaLength?: number;
      
      // Cylinder/Cone
      radiusTop?: number;
      radiusBottom?: number;
      radialSegments?: number;
      openEnded?: boolean;
      
      // Torus
      radiusTube?: number;
      tubularSegments?: number;
      arc?: number;
      
      // TorusKnot
      p?: number; // winding number
      q?: number; // winding number
      
      // Circle/Ring
      innerRadius?: number;
      outerRadius?: number;
      segments?: number;
      
      // Lathe
      points?: Array<[number, number]>; // 2D points to revolve
      
      // Extrude
      shapes?: any[]; // THREE.Shape objects
      extrudeSettings?: {
        depth?: number;
        bevelEnabled?: boolean;
        bevelThickness?: number;
        bevelSize?: number;
        bevelSegments?: number;
        steps?: number;
        curveSegments?: number;
      };
      
      // Tube
      path?: Array<[number, number, number]>; // 3D curve points
      tubularSegments?: number;
      closed?: boolean;
    };
    
    // For custom buffer geometry
    customBuffer?: {
      // Position attribute (required)
      positions: number[]; // Flat array: [x1,y1,z1, x2,y2,z2, ...]
      
      // Normal attribute (optional, will be computed if not provided)
      normals?: number[]; // Flat array: [nx1,ny1,nz1, nx2,ny2,nz2, ...]
      
      // UV attribute (optional, for textures)
      uvs?: number[]; // Flat array: [u1,v1, u2,v2, ...]
      
      // Color attribute (optional, per-vertex colors)
      colors?: number[]; // Flat array: [r1,g1,b1, r2,g2,b2, ...] (0-1 range)
      
      // Index attribute (optional, for indexed geometry)
      indices?: number[]; // Flat array: [i1,i2,i3, i4,i5,i6, ...]
      
      // Tangent attribute (optional, for normal mapping)
      tangents?: number[]; // Flat array: [tx1,ty1,tz1,tw1, ...]
      
      // Custom attributes (optional)
      customAttributes?: {
        [name: string]: {
          itemSize: number; // 1, 2, 3, or 4
          array: number[];
          normalized?: boolean;
        };
      };
      
      // Morph targets (optional, for shape animations)
      morphTargets?: Array<{
        name: string;
        positions: number[];
        normals?: number[];
      }>;
      
      // Groups (optional, for multi-material)
      groups?: Array<{
        start: number;
        count: number;
        materialIndex: number;
      }>;
      
      // Bounding sphere/box (optional, for optimization)
      boundingSphere?: {
        center: [number, number, number];
        radius: number;
      };
      boundingBox?: {
        min: [number, number, number];
        max: [number, number, number];
      };
    };
  };

  // Material Properties
  material: {
    type: 'basic' | 'phong' | 'standard' | 'physical';
    color: string;
    emissive?: string;
    emissiveIntensity?: number;
    metalness?: number;
    roughness?: number;
    opacity?: number;
    transparent?: boolean;
    side?: 'front' | 'back' | 'double';
    wireframe?: boolean;
  };

  // Transform
  transform: {
    position: [number, number, number];
    rotation: [number, number, number]; // Euler angles in radians
    scale: [number, number, number];
  };

  // Scene Graph
  parent?: string; // ID of parent object (defaults to creature root)
  children?: AddMutationParams[]; // Nested mutations (e.g., legs with feet)

  // Animation
  animation?: {
    duration: number; // milliseconds
    easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'elastic';
    keyframes?: Array<{
      time: number; // 0-1
      position?: [number, number, number];
      rotation?: [number, number, number];
      scale?: [number, number, number];
    }>;
    loop?: boolean;
    yoyo?: boolean;
  };

  // Game-Specific
  category: 'legs' | 'appendage' | 'pattern' | 'size' | 'color';
  statEffects: StatEffects;
  
  // Rendering Optimization
  renderingHints?: {
    // Shadow casting
    castShadow?: boolean;
    receiveShadow?: boolean;
    
    // Culling
    frustumCulled?: boolean;
    
    // Render order
    renderOrder?: number;
    
    // Layers (bitmask for selective rendering)
    layers?: number;
    
    // On-demand rendering
    onDemand?: {
      enabled: boolean;
      // Render only when these conditions are met
      renderWhen?: {
        cameraMoving?: boolean;
        objectMoving?: boolean;
        animating?: boolean;
        userInteraction?: boolean;
      };
      // Dirty flag triggers
      dirtyOn?: Array<'transform' | 'material' | 'geometry' | 'visibility'>;
    };
    
    // Level of Detail (LOD)
    lod?: Array<{
      distance: number; // Camera distance threshold
      geometry: {
        type: string;
        dimensions: any;
      };
    }>;
    
    // Instancing (for repeated mutations like legs)
    instanced?: {
      count: number;
      positions?: Array<[number, number, number]>;
      rotations?: Array<[number, number, number]>;
      scales?: Array<[number, number, number]>;
      colors?: Array<string>;
    };
    
    // Performance hints
    performance?: {
      // Reduce geometry complexity on mobile
      mobileSimplification?: number; // 0-1, amount to reduce
      // Use simpler materials on mobile
      mobileMaterial?: 'basic' | 'lambert';
      // Disable features on mobile
      mobileDisable?: Array<'shadows' | 'reflections' | 'postprocessing'>;
    };
  };

  // Metadata
  id: string;
  label: string;
  description: string;
}
```

**Implementation:**

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import WebSocket, { WebSocketServer } from 'ws';

export class MCPServer {
  private server: Server;
  private wss: WebSocketServer;
  private clientConnection: WebSocket | null = null;
  private sceneState: SceneState | null = null;

  constructor() {
    // Initialize MCP server
    this.server = new Server(
      { name: 'regenx_mcp_server', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );

    // Initialize WebSocket server
    this.wss = new WebSocketServer({ port: 8082 });
    this.setupWebSocket();
    this.registerTools();
  }

  private setupWebSocket(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('Three.js client connected');
      this.clientConnection = ws;

      ws.on('message', (message: string) => {
        try {
          const update = JSON.parse(message);
          if (update.type === 'sceneState') {
            this.sceneState = update.data;
          }
        } catch (e) {
          console.error('Invalid scene state message:', e);
        }
      });

      ws.on('close', () => {
        console.log('Three.js client disconnected');
        this.clientConnection = null;
      });
    });
  }

  private registerTools(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'getSceneState',
          description: 'Get current Three.js scene state including creatures, mutations, and biome',
          inputSchema: { type: 'object', properties: {} }
        },
        {
          name: 'controlCamera',
          description: 'Control the Three.js camera position, rotation, and properties',
          inputSchema: {
            type: 'object',
            properties: {
              position: { type: 'array', items: { type: 'number' }, minItems: 3, maxItems: 3 },
              lookAt: { type: 'array', items: { type: 'number' }, minItems: 3, maxItems: 3 },
              fov: { type: 'number' },
              zoom: { type: 'number' },
              animate: {
                type: 'object',
                properties: {
                  duration: { type: 'number' },
                  easing: { type: 'string' }
                }
              }
            }
          }
        },
        {
          name: 'addMutation',
          description: 'Add a mutation to the creature with detailed Three.js geometry, materials, transforms, and animations',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              label: { type: 'string' },
              description: { type: 'string' },
              category: { type: 'string', enum: ['legs', 'appendage', 'pattern', 'size', 'color'] },
              geometry: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['box', 'sphere', 'cylinder', 'cone', 'torus', 'plane', 'custom'] },
                  dimensions: { type: 'object' },
                  vertices: { type: 'array' },
                  normals: { type: 'array' },
                  uvs: { type: 'array' },
                  indices: { type: 'array' }
                },
                required: ['type']
              },
              material: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['basic', 'phong', 'standard', 'physical'] },
                  color: { type: 'string' },
                  emissive: { type: 'string' },
                  emissiveIntensity: { type: 'number' },
                  metalness: { type: 'number' },
                  roughness: { type: 'number' },
                  opacity: { type: 'number' },
                  transparent: { type: 'boolean' }
                },
                required: ['type', 'color']
              },
              transform: {
                type: 'object',
                properties: {
                  position: { type: 'array', items: { type: 'number' }, minItems: 3, maxItems: 3 },
                  rotation: { type: 'array', items: { type: 'number' }, minItems: 3, maxItems: 3 },
                  scale: { type: 'array', items: { type: 'number' }, minItems: 3, maxItems: 3 }
                },
                required: ['position']
              },
              parent: { type: 'string' },
              children: { type: 'array' },
              animation: { type: 'object' },
              statEffects: { type: 'object' },
              renderingHints: { type: 'object' }
            },
            required: ['id', 'label', 'category', 'geometry', 'material', 'transform']
          }
        },
        // ... other tools
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'getSceneState':
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(this.sceneState, null, 2)
            }]
          };

        case 'addMutation':
          if (!this.clientConnection) {
            return { content: [{ type: 'text', text: 'No client connected' }] };
          }
          const command = { action: 'addMutation', ...args };
          this.clientConnection.send(JSON.stringify(command));
          return { content: [{ type: 'text', text: 'Mutation command sent' }] };

        // ... other tool handlers
      }
    });
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}
```

### 2. LLM Processor (Server-Side)

**Location:** `src/server/llm/gemini-processor.ts`

**Responsibilities:**
- Interface with Google Gemini API
- Construct prompts with creature context
- Parse LLM responses into structured commands
- Handle errors and timeouts

**Implementation:**

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiProcessor {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async generateMutationOptions(context: MutationContext): Promise<MutationOption[]> {
    const prompt = this.buildMutationPrompt(context);

    try {
      const result = await Promise.race([
        this.model.generateContent(prompt),
        this.timeout(25000)
      ]);

      const response = await result.response;
      const text = response.text();
      
      // Parse JSON from response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON in response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }

  private buildMutationPrompt(context: MutationContext): string {
    return `You are a Three.js creature evolution designer for Re-GenX. Generate 3-5 unique mutation options with complete geometry, materials, and animations.

Current Creature State:
- Stats: ${JSON.stringify(context.stats)}
- Existing Mutations: ${context.mutations.map(m => `${m.category}: ${m.id}`).join(', ')}
- Biome: ${context.biome}
${context.activityCategory ? `- Player Interests: ${context.activityCategory}` : ''}

Three.js Geometry Guidelines:
- Use appropriate primitives: box (cubes), sphere (round), cylinder (limbs), cone (spikes), torus (rings)
- For legs: Use cylinder with appropriate radialSegments (6-12) and height
- For appendages: Use custom geometry or combine primitives
- For patterns: Use plane geometry with custom UVs or modify existing geometry normals
- Dimensions should be relative to creature size (1.0 = normal)
- Position relative to creature center (0,0,0), within 5ft radius

Material Guidelines:
- Use 'phong' for most mutations (good performance, nice lighting)
- Use 'standard' for metallic/rough surfaces
- Emissive for glowing effects (intensity 0.3-0.7)
- Transparent materials need opacity < 1.0
- Colors in hex format (#rrggbb)

Animation Guidelines:
- Duration: 2000-3000ms for mutation appearance
- Use 'elastic' easing for organic growth
- Use 'easeOut' for mechanical additions
- Keyframes for complex animations (0.0 = start, 1.0 = end)

Scene Graph:
- parent: null for root-level mutations
- parent: "creature_body" to attach to creature
- children: array of nested mutations (e.g., leg with foot)

Stat Balance:
- Total stat delta must be ≤ 0 (more negatives than positives)
- Larger/heavier mutations reduce mobility
- Defensive mutations reduce speed
- Offensive mutations reduce defense

Output ONLY a JSON array with complete AddMutationParams objects:
[
  {
    "id": "mutation_cyber_tentacles_001",
    "label": "Cyber Tentacles",
    "description": "Glowing tech-infused tentacles that pulse with energy, complementing your existing ${context.mutations[0]?.category || 'form'}",
    "category": "appendage",
    "geometry": {
      "type": "cylinder",
      "dimensions": {
        "radiusTop": 0.15,
        "radiusBottom": 0.08,
        "height": 2.0,
        "radialSegments": 8,
        "heightSegments": 12
      }
    },
    "material": {
      "type": "phong",
      "color": "#00ffff",
      "emissive": "#00ffff",
      "emissiveIntensity": 0.5,
      "shininess": 80
    },
    "transform": {
      "position": [1.2, -0.5, 0],
      "rotation": [0, 0, 0.3],
      "scale": [1, 1, 1]
    },
    "parent": "creature_body",
    "animation": {
      "duration": 2500,
      "easing": "elastic",
      "keyframes": [
        { "time": 0, "scale": [0, 0, 0] },
        { "time": 0.5, "scale": [1.2, 1.2, 1.2] },
        { "time": 1.0, "scale": [1, 1, 1] }
      ]
    },
    "statEffects": {
      "mobility": { "agility": 15 },
      "cognition": { "intelligence": 10 },
      "survival": { "attack": -5 }
    },
    "renderingHints": {
      "castShadow": true,
      "receiveShadow": false,
      "frustumCulled": true
    }
  }
]

Generate ${context.activityCategory ? `mutations themed around ${context.activityCategory}` : 'creative, unique mutations'}. Be specific with geometry dimensions and materials.`;
  }

  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), ms)
    );
  }
}
```

### 3. Context Builder (Server-Side)

**Location:** `src/server/llm/context-builder.ts`

**Responsibilities:**
- Gather creature stats, mutations, biome
- Fetch player activity patterns (if privacy opt-in)
- Build structured context for LLM prompts

**Implementation:**

```typescript
export class ContextBuilder {
  constructor(private redis: RedisClient) {}

  async buildMutationContext(userId: string, creatureId: string): Promise<MutationContext> {
    // Get creature data
    const creatureData = await this.redis.hGetAll(`creature:${creatureId}`);
    const stats: FamiliarStats = JSON.parse(creatureData.stats || '{}');
    const mutations: MutationData[] = JSON.parse(creatureData.mutations || '[]');
    const biome = creatureData.biome as BiomeType;

    // Get privacy setting
    const privacyOptIn = creatureData.privacyOptIn === 'true';

    // Get activity pattern if opted in
    let activityCategory: string | undefined;
    if (privacyOptIn) {
      const pattern = await this.getActivityPattern(userId);
      activityCategory = pattern.dominantCategory;
    }

    return {
      stats,
      mutations: mutations.slice(-3), // Last 3 mutations
      biome,
      activityCategory,
      creatureId
    };
  }

  private async getActivityPattern(userId: string): Promise<ActivityPattern> {
    const patternData = await this.redis.hGetAll(`activity:${userId}`);
    return {
      categories: JSON.parse(patternData.categories || '{}'),
      dominantCategory: patternData.dominantCategory || 'general',
      lastUpdated: parseInt(patternData.lastUpdated || '0')
    };
  }
}
```

### 4. Mutation Cache (Server-Side)

**Location:** `src/server/llm/mutation-cache.ts`

**Responsibilities:**
- Cache LLM-generated mutations in Redis
- Use context hash for cache keys
- Implement 5-minute TTL

**Implementation:**

```typescript
import crypto from 'crypto';

export class MutationCache {
  constructor(private redis: RedisClient) {}

  async get(context: MutationContext): Promise<MutationOption[] | null> {
    const key = this.getCacheKey(context);
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async set(context: MutationContext, options: MutationOption[]): Promise<void> {
    const key = this.getCacheKey(context);
    await this.redis.setEx(key, 300, JSON.stringify(options)); // 5 min TTL
  }

  private getCacheKey(context: MutationContext): string {
    const hash = crypto
      .createHash('md5')
      .update(JSON.stringify({
        stats: context.stats,
        mutations: context.mutations.map(m => m.category),
        biome: context.biome,
        activity: context.activityCategory
      }))
      .digest('hex');
    
    return `mutation:cache:${context.creatureId}:${hash}`;
  }
}
```

### 5. WebSocket Client (Client-Side)

**Location:** `src/client/mcp/websocket-client.ts`

**Responsibilities:**
- Connect to MCP WebSocket server
- Send scene state updates every 5 seconds
- Receive and execute commands from server
- Handle reconnection with exponential backoff

**Implementation:**

```typescript
export class MCPWebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private sceneManager: SceneManager;
  private stateUpdateInterval: number | null = null;

  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
  }

  connect(): void {
    try {
      this.ws = new WebSocket('ws://localhost:8082');

      this.ws.onopen = () => {
        console.log('Connected to MCP server');
        this.reconnectAttempts = 0;
        this.startStateUpdates();
      };

      this.ws.onmessage = (event) => {
        this.handleCommand(JSON.parse(event.data));
      };

      this.ws.onclose = () => {
        console.log('Disconnected from MCP server');
        this.stopStateUpdates();
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Connection failed:', error);
      this.attemptReconnect();
    }
  }

  private startStateUpdates(): void {
    this.stateUpdateInterval = window.setInterval(() => {
      this.sendSceneState();
    }, 5000); // Every 5 seconds
  }

  private stopStateUpdates(): void {
    if (this.stateUpdateInterval) {
      clearInterval(this.stateUpdateInterval);
      this.stateUpdateInterval = null;
    }
  }

  private sendSceneState(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const state = this.sceneManager.getSceneState();
      this.ws.send(JSON.stringify({
        type: 'sceneState',
        data: state
      }));
    }
  }

  private handleCommand(command: any): void {
    switch (command.action) {
      case 'addMutation':
        this.sceneManager.addMutationFromParams(command);
        break;
      case 'modifyBiome':
        this.sceneManager.modifyBiome(command);
        break;
      case 'animateObject':
        this.sceneManager.animateObject(command);
        break;
      case 'removeMutation':
        this.sceneManager.removeMutation(command);
        break;
    }
  }
}
```

### 6. Mutation Geometry Builder (Client-Side)

**Location:** `src/client/mcp/mutation-geometry-builder.ts`

**Responsibilities:**
- Convert AddMutationParams to Three.js objects
- Create geometry from parameters
- Apply materials and transforms
- Set up animations
- Handle scene graph hierarchy

**Implementation:**

```typescript
import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';

export class MutationGeometryBuilder {
  buildFromParams(params: AddMutationParams): THREE.Object3D {
    // Create geometry
    const geometry = this.createGeometry(params.geometry);
    
    // Create material
    const material = this.createMaterial(params.material);
    
    // Create mesh
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = params.id;
    
    // Apply transform
    mesh.position.set(...params.transform.position);
    if (params.transform.rotation) {
      mesh.rotation.set(...params.transform.rotation);
    }
    if (params.transform.scale) {
      mesh.scale.set(...params.transform.scale);
    }
    
    // Apply rendering hints
    if (params.renderingHints) {
      mesh.castShadow = params.renderingHints.castShadow ?? true;
      mesh.receiveShadow = params.renderingHints.receiveShadow ?? false;
      mesh.frustumCulled = params.renderingHints.frustumCulled ?? true;
      if (params.renderingHints.renderOrder !== undefined) {
        mesh.renderOrder = params.renderingHints.renderOrder;
      }
      if (params.renderingHints.layers !== undefined) {
        mesh.layers.mask = params.renderingHints.layers;
      }
    }
    
    // Handle children (recursive)
    if (params.children) {
      params.children.forEach(childParams => {
        const child = this.buildFromParams(childParams);
        mesh.add(child);
      });
    }
    
    // Set up animation
    if (params.animation) {
      this.setupAnimation(mesh, params.animation);
    }
    
    return mesh;
  }
  
  private createGeometry(geomParams: AddMutationParams['geometry']): THREE.BufferGeometry {
    const { type, dimensions } = geomParams;
    
    switch (type) {
      case 'box':
        return new THREE.BoxGeometry(
          dimensions?.width ?? 1,
          dimensions?.height ?? 1,
          dimensions?.depth ?? 1,
          dimensions?.widthSegments,
          dimensions?.heightSegments,
          dimensions?.depthSegments
        );
        
      case 'sphere':
        return new THREE.SphereGeometry(
          dimensions?.radius ?? 0.5,
          dimensions?.widthSegments ?? 32,
          dimensions?.heightSegments ?? 16,
          dimensions?.phiStart,
          dimensions?.phiLength,
          dimensions?.thetaStart,
          dimensions?.thetaLength
        );
        
      case 'cylinder':
        return new THREE.CylinderGeometry(
          dimensions?.radiusTop ?? 0.5,
          dimensions?.radiusBottom ?? 0.5,
          dimensions?.height ?? 1,
          dimensions?.radialSegments ?? 8,
          dimensions?.heightSegments ?? 1,
          false,
          dimensions?.thetaStart ?? 0,
          dimensions?.thetaLength ?? Math.PI * 2
        );
        
      case 'cone':
        return new THREE.ConeGeometry(
          dimensions?.radius ?? 0.5,
          dimensions?.height ?? 1,
          dimensions?.radialSegments ?? 8,
          dimensions?.heightSegments ?? 1,
          false,
          dimensions?.thetaStart ?? 0,
          dimensions?.thetaLength ?? Math.PI * 2
        );
        
      case 'torus':
        return new THREE.TorusGeometry(
          dimensions?.radius ?? 0.5,
          dimensions?.radiusTube ?? 0.2,
          dimensions?.radialSegments ?? 8,
          dimensions?.heightSegments ?? 6,
          dimensions?.thetaLength ?? Math.PI * 2
        );
        
      case 'plane':
        return new THREE.PlaneGeometry(
          dimensions?.width ?? 1,
          dimensions?.height ?? 1,
          dimensions?.widthSegments ?? 1,
          dimensions?.heightSegments ?? 1
        );
        
      case 'custom':
        return this.createCustomGeometry(geomParams);
        
      default:
        return new THREE.SphereGeometry(0.5, 16, 16);
    }
  }
  
  private createCustomGeometry(geomParams: AddMutationParams['geometry']): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    
    if (geomParams.vertices) {
      geometry.setAttribute('position', new THREE.BufferAttribute(geomParams.vertices, 3));
    }
    
    if (geomParams.normals) {
      geometry.setAttribute('normal', new THREE.BufferAttribute(geomParams.normals, 3));
    }
    
    if (geomParams.uvs) {
      geometry.setAttribute('uv', new THREE.BufferAttribute(geomParams.uvs, 2));
    }
    
    if (geomParams.indices) {
      geometry.setIndex(new THREE.BufferAttribute(geomParams.indices, 1));
    }
    
    if (!geomParams.normals) {
      geometry.computeVertexNormals();
    }
    
    return geometry;
  }
  
  private createMaterial(matParams: AddMutationParams['material']): THREE.Material {
    const baseParams = {
      color: new THREE.Color(matParams.color),
      transparent: matParams.transparent ?? false,
      opacity: matParams.opacity ?? 1.0,
      side: this.getSide(matParams.side),
      wireframe: matParams.wireframe ?? false
    };
    
    switch (matParams.type) {
      case 'basic':
        return new THREE.MeshBasicMaterial(baseParams);
        
      case 'phong':
        return new THREE.MeshPhongMaterial({
          ...baseParams,
          emissive: matParams.emissive ? new THREE.Color(matParams.emissive) : new THREE.Color(0x000000),
          emissiveIntensity: matParams.emissiveIntensity ?? 0,
          shininess: 30
        });
        
      case 'standard':
        return new THREE.MeshStandardMaterial({
          ...baseParams,
          emissive: matParams.emissive ? new THREE.Color(matParams.emissive) : new THREE.Color(0x000000),
          emissiveIntensity: matParams.emissiveIntensity ?? 0,
          metalness: matParams.metalness ?? 0,
          roughness: matParams.roughness ?? 0.5
        });
        
      case 'physical':
        return new THREE.MeshPhysicalMaterial({
          ...baseParams,
          emissive: matParams.emissive ? new THREE.Color(matParams.emissive) : new THREE.Color(0x000000),
          emissiveIntensity: matParams.emissiveIntensity ?? 0,
          metalness: matParams.metalness ?? 0,
          roughness: matParams.roughness ?? 0.5
        });
        
      default:
        return new THREE.MeshPhongMaterial(baseParams);
    }
  }
  
  private getSide(side?: string): THREE.Side {
    switch (side) {
      case 'front': return THREE.FrontSide;
      case 'back': return THREE.BackSide;
      case 'double': return THREE.DoubleSide;
      default: return THREE.FrontSide;
    }
  }
  
  private setupAnimation(mesh: THREE.Object3D, animParams: NonNullable<AddMutationParams['animation']>): void {
    if (!animParams.keyframes || animParams.keyframes.length === 0) {
      // Simple scale-in animation
      const startScale = new THREE.Vector3(0, 0, 0);
      const endScale = mesh.scale.clone();
      mesh.scale.copy(startScale);
      
      new TWEEN.Tween(mesh.scale)
        .to(endScale, animParams.duration)
        .easing(this.getEasing(animParams.easing))
        .start();
    } else {
      // Keyframe animation
      this.setupKeyframeAnimation(mesh, animParams);
    }
  }
  
  private setupKeyframeAnimation(mesh: THREE.Object3D, animParams: NonNullable<AddMutationParams['animation']>): void {
    const keyframes = animParams.keyframes!;
    const duration = animParams.duration;
    
    // Create tween chain
    let prevTween: TWEEN.Tween<any> | null = null;
    
    for (let i = 0; i < keyframes.length - 1; i++) {
      const current = keyframes[i];
      const next = keyframes[i + 1];
      const segmentDuration = (next.time - current.time) * duration;
      
      const target: any = {};
      if (next.position) target.position = new THREE.Vector3(...next.position);
      if (next.rotation) target.rotation = new THREE.Euler(...next.rotation);
      if (next.scale) target.scale = new THREE.Vector3(...next.scale);
      
      const tween = new TWEEN.Tween(mesh)
        .to(target, segmentDuration)
        .easing(this.getEasing(animParams.easing));
      
      if (prevTween) {
        prevTween.chain(tween);
      } else {
        tween.start();
      }
      
      prevTween = tween;
    }
    
    // Handle loop/yoyo
    if (animParams.loop && prevTween) {
      prevTween.repeat(Infinity);
      if (animParams.yoyo) {
        prevTween.yoyo(true);
      }
    }
  }
  
  private getEasing(easing: string): (t: number) => number {
    switch (easing) {
      case 'linear': return TWEEN.Easing.Linear.None;
      case 'easeIn': return TWEEN.Easing.Quadratic.In;
      case 'easeOut': return TWEEN.Easing.Quadratic.Out;
      case 'easeInOut': return TWEEN.Easing.Quadratic.InOut;
      case 'elastic': return TWEEN.Easing.Elastic.Out;
      default: return TWEEN.Easing.Linear.None;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // 1s, 2s, 4s
      this.reconnectAttempts++;
      
      setTimeout(() => {
        console.log(`Reconnect attempt ${this.reconnectAttempts}`);
        this.connect();
      }, delay);
    } else {
      console.log('Max reconnect attempts reached, entering fallback mode');
      this.sceneManager.enableFallbackMode();
    }
  }

  disconnect(): void {
    this.stopStateUpdates();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
```

## Data Models

### Mutation Context

```typescript
interface MutationContext {
  stats: FamiliarStats;
  mutations: MutationData[];
  biome: BiomeType;
  activityCategory?: string;
  creatureId: string;
}
```

### Mutation Option

```typescript
interface MutationOption {
  id: string;
  category: 'legs' | 'appendage' | 'pattern' | 'size' | 'color';
  label: string;
  value: string | number;
  description: string;
  statEffects: StatEffects;
}
```

### Scene State

```typescript
interface SceneState {
  creatures: Array<{
    id: string;
    position: [number, number, number];
    mutations: MutationData[];
  }>;
  biome: {
    type: BiomeType;
    groundColor: string;
    objects: EnvironmentObject[];
  };
  environmentObjects: EnvironmentObject[];
}
```

## API Endpoints

### POST /api/mutation/generate

Generate mutation options using LLM.

**Request:**
```typescript
{
  userId: string;
  creatureId: string;
}
```

**Response:**
```typescript
{
  options: MutationOption[];
  cached: boolean;
}
```

### POST /api/mutation/apply

Apply selected mutation.

**Request:**
```typescript
{
  sessionId: string;
  optionId: string;
}
```

**Response:**
```typescript
{
  mutation: MutationData;
  sceneUpdates: any;
}
```

## Error Handling

### Fallback System

**Triggers:**
- LLM API timeout (>25s)
- LLM API error
- Invalid JSON response
- WebSocket disconnection

**Behavior:**
1. Set Redis flag: `llm:fallback:active` with 5-minute TTL
2. Use hardcoded mutation options from `mutation-engine.ts`
3. Use client-side geometry generation
4. Log error for monitoring

### Retry Logic

**LLM API Calls:**
- Single attempt (no retries due to 30s Devvit limit)
- Timeout at 25 seconds
- Immediate fallback on failure

**WebSocket Connection:**
- 3 retry attempts with exponential backoff (1s, 2s, 4s)
- After 3 failures, enter fallback mode
- Reconnect attempt every 60 seconds in fallback mode

## Performance Considerations

### Caching Strategy

1. **Mutation Options:** 5-minute TTL, keyed by context hash
2. **Scene State:** Updated every 5 seconds from client
3. **Fallback Flag:** 5-minute TTL to prevent repeated LLM calls during outages

### Token Optimization

- Target: 150-300 tokens per LLM response
- Use concise prompts with examples
- Request JSON-only output
- Pre-generate mutations for waiting room creatures

### Mobile Optimization

- Reduce WebSocket update frequency on mobile (10s instead of 5s)
- Simplify geometry in fallback mode
- Cache more aggressively on mobile

## Security

### Input Validation

- Validate all MCP tool parameters server-side
- Sanitize LLM-generated descriptions
- Enforce position bounds (5ft radius)
- Validate stat effect totals

### API Key Management

- Store Gemini API key in environment variables
- Never expose API key to client
- Rotate keys periodically

## Testing Strategy

### Unit Tests

- Context Builder: Mock Redis, verify context structure
- Gemini Processor: Mock API, test prompt construction
- Mutation Cache: Test cache hits/misses, TTL
- WebSocket Client: Test reconnection logic

### Integration Tests

- End-to-end mutation flow with mock Gemini API
- WebSocket communication between server and client
- Fallback system activation

### Load Tests

- Concurrent LLM requests
- WebSocket connection limits
- Redis cache performance

## Deployment

### Environment Variables

```bash
GEMINI_API_KEY=your_api_key_here
MCP_WEBSOCKET_PORT=8082
REDIS_URL=redis://localhost:6379
```

### Devvit Configuration

```typescript
Devvit.configure({
  http: {
    domains: ['generativelanguage.googleapis.com']
  },
  redis: true
});
```

## On-Demand Rendering System

### Overview

To optimize performance, especially on mobile, the system implements on-demand rendering where the scene only re-renders when necessary.

### Render Triggers

**Location:** `src/client/rendering/render-manager.ts`

```typescript
export class RenderManager {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private renderRequested = false;
  private onDemandEnabled = true;

  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
  }

  requestRender(): void {
    if (!this.renderRequested) {
      this.renderRequested = true;
      requestAnimationFrame(() => this.render());
    }
  }

  private render(): void {
    this.renderRequested = false;
    this.renderer.render(this.scene, this.camera);
  }

  // Enable continuous rendering (for animations)
  enableContinuousRendering(): void {
    this.onDemandEnabled = false;
    this.animate();
  }

  // Enable on-demand rendering (for static scenes)
  enableOnDemandRendering(): void {
    this.onDemandEnabled = true;
  }

  private animate = (): void => {
    if (!this.onDemandEnabled) {
      requestAnimationFrame(this.animate);
      this.renderer.render(this.scene, this.camera);
    }
  };
}
```

### Dirty Flag System

```typescript
export class DirtyFlagManager {
  private dirtyObjects = new Set<string>();
  private renderManager: RenderManager;

  constructor(renderManager: RenderManager) {
    this.renderManager = renderManager;
  }

  markDirty(objectId: string, reason: 'transform' | 'material' | 'geometry' | 'visibility'): void {
    this.dirtyObjects.add(objectId);
    this.renderManager.requestRender();
  }

  clearDirty(objectId: string): void {
    this.dirtyObjects.delete(objectId);
  }

  isDirty(objectId: string): boolean {
    return this.dirtyObjects.has(objectId);
  }
}
```

### Integration with Mutations

When a mutation is added, the system:
1. Checks if `renderingHints.onDemand.enabled` is true
2. If true, only renders when dirty flags are set
3. Automatically enables continuous rendering during animations
4. Returns to on-demand rendering when animations complete

## Complete Geometry Builder

### All Primitives Support

```typescript
private createGeometry(geomParams: AddMutationParams['geometry']): THREE.BufferGeometry {
  const { type, dimensions, customBuffer } = geomParams;
  
  switch (type) {
    case 'box':
      return new THREE.BoxGeometry(
        dimensions?.width ?? 1,
        dimensions?.height ?? 1,
        dimensions?.depth ?? 1,
        dimensions?.widthSegments,
        dimensions?.heightSegments,
        dimensions?.depthSegments
      );
      
    case 'sphere':
      return new THREE.SphereGeometry(
        dimensions?.radius ?? 0.5,
        dimensions?.widthSegments ?? 32,
        dimensions?.heightSegments ?? 16,
        dimensions?.phiStart,
        dimensions?.phiLength,
        dimensions?.thetaStart,
        dimensions?.thetaLength
      );
      
    case 'cylinder':
      return new THREE.CylinderGeometry(
        dimensions?.radiusTop ?? 0.5,
        dimensions?.radiusBottom ?? 0.5,
        dimensions?.height ?? 1,
        dimensions?.radialSegments ?? 8,
        dimensions?.heightSegments ?? 1,
        dimensions?.openEnded ?? false,
        dimensions?.thetaStart ?? 0,
        dimensions?.thetaLength ?? Math.PI * 2
      );
      
    case 'cone':
      return new THREE.ConeGeometry(
        dimensions?.radius ?? 0.5,
        dimensions?.height ?? 1,
        dimensions?.radialSegments ?? 8,
        dimensions?.heightSegments ?? 1,
        dimensions?.openEnded ?? false,
        dimensions?.thetaStart ?? 0,
        dimensions?.thetaLength ?? Math.PI * 2
      );
      
    case 'torus':
      return new THREE.TorusGeometry(
        dimensions?.radius ?? 0.5,
        dimensions?.radiusTube ?? 0.2,
        dimensions?.radialSegments ?? 8,
        dimensions?.tubularSegments ?? 6,
        dimensions?.arc ?? Math.PI * 2
      );
      
    case 'torusKnot':
      return new THREE.TorusKnotGeometry(
        dimensions?.radius ?? 0.5,
        dimensions?.radiusTube ?? 0.2,
        dimensions?.tubularSegments ?? 64,
        dimensions?.radialSegments ?? 8,
        dimensions?.p ?? 2,
        dimensions?.q ?? 3
      );
      
    case 'plane':
      return new THREE.PlaneGeometry(
        dimensions?.width ?? 1,
        dimensions?.height ?? 1,
        dimensions?.widthSegments ?? 1,
        dimensions?.heightSegments ?? 1
      );
      
    case 'circle':
      return new THREE.CircleGeometry(
        dimensions?.radius ?? 0.5,
        dimensions?.segments ?? 8,
        dimensions?.thetaStart ?? 0,
        dimensions?.thetaLength ?? Math.PI * 2
      );
      
    case 'ring':
      return new THREE.RingGeometry(
        dimensions?.innerRadius ?? 0.2,
        dimensions?.outerRadius ?? 0.5,
        dimensions?.thetaSegments ?? 8,
        dimensions?.phiSegments ?? 1,
        dimensions?.thetaStart ?? 0,
        dimensions?.thetaLength ?? Math.PI * 2
      );
      
    case 'dodecahedron':
      return new THREE.DodecahedronGeometry(
        dimensions?.radius ?? 0.5,
        dimensions?.detail ?? 0
      );
      
    case 'icosahedron':
      return new THREE.IcosahedronGeometry(
        dimensions?.radius ?? 0.5,
        dimensions?.detail ?? 0
      );
      
    case 'octahedron':
      return new THREE.OctahedronGeometry(
        dimensions?.radius ?? 0.5,
        dimensions?.detail ?? 0
      );
      
    case 'tetrahedron':
      return new THREE.TetrahedronGeometry(
        dimensions?.radius ?? 0.5,
        dimensions?.detail ?? 0
      );
      
    case 'lathe':
      if (dimensions?.points) {
        const points = dimensions.points.map(p => new THREE.Vector2(p[0], p[1]));
        return new THREE.LatheGeometry(
          points,
          dimensions?.segments ?? 12,
          dimensions?.phiStart ?? 0,
          dimensions?.phiLength ?? Math.PI * 2
        );
      }
      return new THREE.SphereGeometry(0.5);
      
    case 'tube':
      if (dimensions?.path) {
        const curve = new THREE.CatmullRomCurve3(
          dimensions.path.map(p => new THREE.Vector3(p[0], p[1], p[2]))
        );
        return new THREE.TubeGeometry(
          curve,
          dimensions?.tubularSegments ?? 64,
          dimensions?.radius ?? 0.1,
          dimensions?.radialSegments ?? 8,
          dimensions?.closed ?? false
        );
      }
      return new THREE.CylinderGeometry(0.1, 0.1, 1);
      
    case 'custom':
      return this.createCustomBufferGeometry(customBuffer!);
      
    default:
      return new THREE.SphereGeometry(0.5, 16, 16);
  }
}

private createCustomBufferGeometry(customBuffer: NonNullable<AddMutationParams['geometry']['customBuffer']>): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  
  // Position attribute (required)
  if (customBuffer.positions) {
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(customBuffer.positions, 3)
    );
  }
  
  // Normal attribute
  if (customBuffer.normals) {
    geometry.setAttribute(
      'normal',
      new THREE.Float32BufferAttribute(customBuffer.normals, 3)
    );
  } else {
    // Compute normals if not provided
    geometry.computeVertexNormals();
  }
  
  // UV attribute
  if (customBuffer.uvs) {
    geometry.setAttribute(
      'uv',
      new THREE.Float32BufferAttribute(customBuffer.uvs, 2)
    );
  }
  
  // Color attribute
  if (customBuffer.colors) {
    geometry.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(customBuffer.colors, 3)
    );
  }
  
  // Tangent attribute
  if (customBuffer.tangents) {
    geometry.setAttribute(
      'tangent',
      new THREE.Float32BufferAttribute(customBuffer.tangents, 4)
    );
  }
  
  // Index attribute
  if (customBuffer.indices) {
    geometry.setIndex(customBuffer.indices);
  }
  
  // Custom attributes
  if (customBuffer.customAttributes) {
    Object.entries(customBuffer.customAttributes).forEach(([name, attr]) => {
      geometry.setAttribute(
        name,
        new THREE.Float32BufferAttribute(attr.array, attr.itemSize, attr.normalized)
      );
    });
  }
  
  // Morph targets
  if (customBuffer.morphTargets) {
    customBuffer.morphTargets.forEach(target => {
      geometry.morphAttributes.position = geometry.morphAttributes.position || [];
      geometry.morphAttributes.position.push(
        new THREE.Float32BufferAttribute(target.positions, 3)
      );
      
      if (target.normals) {
        geometry.morphAttributes.normal = geometry.morphAttributes.normal || [];
        geometry.morphAttributes.normal.push(
          new THREE.Float32BufferAttribute(target.normals, 3)
        );
      }
    });
  }
  
  // Groups (for multi-material)
  if (customBuffer.groups) {
    customBuffer.groups.forEach(group => {
      geometry.addGroup(group.start, group.count, group.materialIndex);
    });
  }
  
  // Bounding sphere
  if (customBuffer.boundingSphere) {
    geometry.boundingSphere = new THREE.Sphere(
      new THREE.Vector3(...customBuffer.boundingSphere.center),
      customBuffer.boundingSphere.radius
    );
  }
  
  // Bounding box
  if (customBuffer.boundingBox) {
    geometry.boundingBox = new THREE.Box3(
      new THREE.Vector3(...customBuffer.boundingBox.min),
      new THREE.Vector3(...customBuffer.boundingBox.max)
    );
  }
  
  return geometry;
}
```

## Camera Control System

### Overview

The LLM can control the camera to create cinematic views of mutations, follow the creature, or provide dramatic angles during evolution events.

### Camera Control Handler

**Location:** `src/client/mcp/camera-controller.ts`

```typescript
export class CameraController {
  private camera: THREE.PerspectiveCamera;
  private renderManager: RenderManager;
  private currentTween: TWEEN.Tween<any> | null = null;

  constructor(camera: THREE.PerspectiveCamera, renderManager: RenderManager) {
    this.camera = camera;
    this.renderManager = renderManager;
  }

  applyControl(params: CameraControlParams): void {
    // Cancel any existing camera animation
    if (this.currentTween) {
      this.currentTween.stop();
      this.currentTween = null;
    }

    if (params.animate) {
      this.animateCamera(params);
    } else {
      this.setCamera(params);
    }
  }

  private setCamera(params: CameraControlParams): void {
    if (params.position) {
      this.camera.position.set(...params.position);
    }

    if (params.lookAt) {
      this.camera.lookAt(new THREE.Vector3(...params.lookAt));
    }

    if (params.fov !== undefined) {
      this.camera.fov = params.fov;
      this.camera.updateProjectionMatrix();
    }

    if (params.zoom !== undefined) {
      this.camera.zoom = params.zoom;
      this.camera.updateProjectionMatrix();
    }

    this.renderManager.requestRender();
  }

  private animateCamera(params: CameraControlParams): void {
    const duration = params.animate?.duration ?? 2000;
    const easing = this.getEasing(params.animate?.easing ?? 'easeInOut');

    // Enable continuous rendering during animation
    this.renderManager.enableContinuousRendering();

    const startPosition = this.camera.position.clone();
    const startFov = this.camera.fov;
    const startZoom = this.camera.zoom;

    const targetPosition = params.position 
      ? new THREE.Vector3(...params.position)
      : startPosition;

    const target: any = {};
    if (params.position) {
      target.x = targetPosition.x;
      target.y = targetPosition.y;
      target.z = targetPosition.z;
    }
    if (params.fov !== undefined) target.fov = params.fov;
    if (params.zoom !== undefined) target.zoom = params.zoom;

    this.currentTween = new TWEEN.Tween(this.camera.position)
      .to(target, duration)
      .easing(easing)
      .onUpdate(() => {
        if (params.lookAt) {
          this.camera.lookAt(new THREE.Vector3(...params.lookAt));
        }
        if (target.fov !== undefined || target.zoom !== undefined) {
          if (target.fov !== undefined) this.camera.fov = target.fov;
          if (target.zoom !== undefined) this.camera.zoom = target.zoom;
          this.camera.updateProjectionMatrix();
        }
      })
      .onComplete(() => {
        this.currentTween = null;
        // Return to on-demand rendering after animation
        this.renderManager.enableOnDemandRendering();
      })
      .start();
  }

  private getEasing(easing: string): (t: number) => number {
    switch (easing) {
      case 'linear': return TWEEN.Easing.Linear.None;
      case 'easeIn': return TWEEN.Easing.Quadratic.In;
      case 'easeOut': return TWEEN.Easing.Quadratic.Out;
      case 'easeInOut': return TWEEN.Easing.Quadratic.InOut;
      case 'elastic': return TWEEN.Easing.Elastic.Out;
      default: return TWEEN.Easing.Quadratic.InOut;
    }
  }

  // Preset camera positions
  getCinematicView(creature: THREE.Object3D): CameraControlParams {
    const creaturePos = creature.position;
    return {
      position: [creaturePos.x + 5, creaturePos.y + 3, creaturePos.z + 5],
      lookAt: [creaturePos.x, creaturePos.y, creaturePos.z],
      fov: 50,
      animate: { duration: 3000, easing: 'easeInOut' }
    };
  }

  getCloseUpView(creature: THREE.Object3D): CameraControlParams {
    const creaturePos = creature.position;
    return {
      position: [creaturePos.x + 2, creaturePos.y + 1, creaturePos.z + 2],
      lookAt: [creaturePos.x, creaturePos.y, creaturePos.z],
      fov: 40,
      zoom: 1.5,
      animate: { duration: 2000, easing: 'easeOut' }
    };
  }

  getTopDownView(creature: THREE.Object3D): CameraControlParams {
    const creaturePos = creature.position;
    return {
      position: [creaturePos.x, creaturePos.y + 10, creaturePos.z],
      lookAt: [creaturePos.x, creaturePos.y, creaturePos.z],
      fov: 60,
      animate: { duration: 2500, easing: 'easeInOut' }
    };
  }
}

interface CameraControlParams {
  position?: [number, number, number];
  lookAt?: [number, number, number];
  fov?: number;
  zoom?: number;
  animate?: {
    duration: number;
    easing: string;
  };
}
```

### LLM Prompt for Camera Control

```typescript
private buildCameraControlPrompt(context: MutationContext): string {
  return `You can control the camera to create dramatic views of the creature.

Available camera controls:
- position: [x, y, z] - Camera position in 3D space
- lookAt: [x, y, z] - Point the camera looks at
- fov: number - Field of view (30-90 degrees)
- zoom: number - Zoom level (0.5-2.0)
- animate: { duration: ms, easing: 'linear'|'easeIn'|'easeOut'|'easeInOut'|'elastic' }

Creature is at position [0, 0, 0].

Example camera commands:
1. Cinematic reveal: { position: [5, 3, 5], lookAt: [0, 0, 0], fov: 50, animate: { duration: 3000, easing: 'easeInOut' } }
2. Close-up: { position: [2, 1, 2], lookAt: [0, 0, 0], fov: 40, zoom: 1.5, animate: { duration: 2000, easing: 'easeOut' } }
3. Top-down: { position: [0, 10, 0], lookAt: [0, 0, 0], fov: 60, animate: { duration: 2500, easing: 'easeInOut' } }
4. Orbit: Multiple camera positions in sequence to create orbit effect

When should you control the camera:
- When a dramatic mutation is applied (zoom in for close-up)
- When showing the full creature (pull back for wide shot)
- When highlighting a specific mutation (position camera to focus on it)
- When transitioning between biomes (cinematic pan)

Current context: ${context.mutations.length > 0 ? 'Creature has mutations, consider dramatic angle' : 'New creature, show full view'}`;
}
```

### Integration with Mutation Application

When the LLM applies a mutation, it can also control the camera:

```typescript
// Example LLM response for mutation with camera control
{
  "mutations": [
    {
      "id": "mutation_wings_001",
      "category": "appendage",
      // ... mutation details
    }
  ],
  "cameraControl": {
    "position": [3, 2, 3],
    "lookAt": [0, 1, 0],
    "fov": 45,
    "animate": {
      "duration": 2500,
      "easing": "easeOut"
    }
  }
}
```

## Monitoring

### Metrics to Track

- LLM API latency
- LLM API error rate
- Cache hit rate
- Fallback activation frequency
- WebSocket connection stability
- Token usage per request
- Render calls per second (on-demand vs continuous)
- Geometry complexity (triangle count)
- Memory usage (geometry + textures)

### Logging

- Log all LLM requests/responses
- Log fallback activations
- Log WebSocket disconnections
- Log cache performance
- Log render triggers (on-demand mode)
- Log geometry creation (type, complexity)
