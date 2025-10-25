import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import WebSocket, { WebSocketServer } from 'ws';
import type { BiomeType, MutationData, StatEffects } from '../../shared/types/api.js';

// ============================================================================
// Type Definitions
// ============================================================================

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
  camera?: {
    position: [number, number, number];
    lookAt: [number, number, number];
    fov: number;
  };
}

interface AddMutationParams {
  id: string;
  label: string;
  description: string;
  category: 'legs' | 'appendage' | 'pattern' | 'size' | 'color';
  geometry: {
    type: string;
    dimensions?: Record<string, any>;
    customBuffer?: {
      positions: number[];
      normals?: number[];
      uvs?: number[];
      colors?: number[];
      indices?: number[];
    };
  };
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
  transform: {
    position: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number];
  };
  parent?: string;
  children?: AddMutationParams[];
  animation?: {
    duration: number;
    easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'elastic';
    keyframes?: Array<{
      time: number;
      position?: [number, number, number];
      rotation?: [number, number, number];
      scale?: [number, number, number];
    }>;
    loop?: boolean;
    yoyo?: boolean;
  };
  statEffects: StatEffects;
  renderingHints?: {
    castShadow?: boolean;
    receiveShadow?: boolean;
    frustumCulled?: boolean;
    renderOrder?: number;
    layers?: number;
  };
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

interface ModifyBiomeParams {
  biomeType?: BiomeType;
  groundColor?: string;
  objectsToAdd?: Array<{
    id: string;
    type: string;
    position: [number, number, number];
  }>;
  objectsToRemove?: string[];
}

interface AnimateObjectParams {
  id: string;
  duration: number;
  targetPosition?: [number, number, number];
  targetRotation?: [number, number, number];
  targetScale?: [number, number, number];
  easing?: string;
}

interface RemoveMutationParams {
  id: string;
}

// ============================================================================
// MCP Server Implementation
// ============================================================================

export class MCPServer {
  private server: Server;
  private wss: WebSocketServer;
  private clientConnection: WebSocket | null = null;
  private sceneState: SceneState | null = null;

  constructor() {
    // Initialize MCP server with stdio transport
    this.server = new Server(
      {
        name: 'regenx_mcp_server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Add error handler
    this.server.onerror = (error) => console.error('[MCP Error]', error);

    // Initialize WebSocket server
    this.wss = new WebSocketServer({ port: 8082 });
    this.setupWebSocket();
    this.registerTools();
  }

  /**
   * Start the MCP server with stdio transport
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log('[MCP Server] Started on stdio transport');
  }

  /**
   * Set up WebSocket server for Three.js client communication
   */
  private setupWebSocket(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('[MCP Server] Three.js client connected');
      this.clientConnection = ws;

      ws.on('message', (message: string) => {
        try {
          const update = JSON.parse(message.toString());
          if (update.type === 'sceneState') {
            this.sceneState = update.data;
            console.log('[MCP Server] Scene state updated');
          }
        } catch (e) {
          console.error('[MCP Server] Invalid scene state message:', e);
        }
      });

      ws.on('close', () => {
        console.log('[MCP Server] Three.js client disconnected');
        this.clientConnection = null;
      });

      ws.on('error', (error) => {
        console.error('[MCP Server] WebSocket error:', error);
      });
    });

    console.log('[MCP Server] WebSocket server listening on port 8082');
  }

  /**
   * Register all MCP tools
   */
  private registerTools(): void {
    // Register tool list handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'getSceneState',
          description: 'Get current Three.js scene state including creatures, mutations, biome, and environment objects',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'addMutation',
          description: 'Add a mutation to the creature with detailed Three.js geometry, materials, transforms, and animations',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Unique mutation identifier' },
              label: { type: 'string', description: 'Human-readable mutation name' },
              description: { type: 'string', description: 'Mutation description' },
              category: {
                type: 'string',
                enum: ['legs', 'appendage', 'pattern', 'size', 'color'],
                description: 'Mutation category',
              },
              geometry: {
                type: 'object',
                properties: {
                  type: {
                    type: 'string',
                    enum: ['box', 'sphere', 'cylinder', 'cone', 'torus', 'torusKnot', 'plane', 'circle', 'ring', 'custom'],
                    description: 'Three.js geometry type',
                  },
                  dimensions: {
                    type: 'object',
                    description: 'Geometry-specific dimensions',
                  },
                  customBuffer: {
                    type: 'object',
                    description: 'Custom buffer geometry data',
                  },
                },
                required: ['type'],
              },
              material: {
                type: 'object',
                properties: {
                  type: {
                    type: 'string',
                    enum: ['basic', 'phong', 'standard', 'physical'],
                    description: 'Three.js material type',
                  },
                  color: { type: 'string', description: 'Hex color code' },
                  emissive: { type: 'string', description: 'Emissive color' },
                  emissiveIntensity: { type: 'number', description: 'Emissive intensity' },
                  metalness: { type: 'number', description: 'Metalness (0-1)' },
                  roughness: { type: 'number', description: 'Roughness (0-1)' },
                  opacity: { type: 'number', description: 'Opacity (0-1)' },
                  transparent: { type: 'boolean', description: 'Enable transparency' },
                },
                required: ['type', 'color'],
              },
              transform: {
                type: 'object',
                properties: {
                  position: {
                    type: 'array',
                    items: { type: 'number' },
                    minItems: 3,
                    maxItems: 3,
                    description: 'Position [x, y, z]',
                  },
                  rotation: {
                    type: 'array',
                    items: { type: 'number' },
                    minItems: 3,
                    maxItems: 3,
                    description: 'Rotation [x, y, z] in radians',
                  },
                  scale: {
                    type: 'array',
                    items: { type: 'number' },
                    minItems: 3,
                    maxItems: 3,
                    description: 'Scale [x, y, z]',
                  },
                },
                required: ['position'],
              },
              statEffects: {
                type: 'object',
                description: 'Stat effects of the mutation',
              },
              animation: {
                type: 'object',
                description: 'Animation parameters',
              },
              renderingHints: {
                type: 'object',
                description: 'Rendering optimization hints',
              },
            },
            required: ['id', 'label', 'category', 'geometry', 'material', 'transform'],
          },
        },
        {
          name: 'controlCamera',
          description: 'Control the Three.js camera position, rotation, and properties with optional animation',
          inputSchema: {
            type: 'object',
            properties: {
              position: {
                type: 'array',
                items: { type: 'number' },
                minItems: 3,
                maxItems: 3,
                description: 'Camera position [x, y, z]',
              },
              lookAt: {
                type: 'array',
                items: { type: 'number' },
                minItems: 3,
                maxItems: 3,
                description: 'Point to look at [x, y, z]',
              },
              fov: {
                type: 'number',
                description: 'Field of view in degrees',
              },
              zoom: {
                type: 'number',
                description: 'Zoom level',
              },
              animate: {
                type: 'object',
                properties: {
                  duration: { type: 'number', description: 'Animation duration in ms' },
                  easing: { type: 'string', description: 'Easing function' },
                },
              },
            },
          },
        },
        {
          name: 'modifyBiome',
          description: 'Modify the biome environment including ground color and objects',
          inputSchema: {
            type: 'object',
            properties: {
              biomeType: {
                type: 'string',
                enum: ['jungle', 'rocky_mountain', 'desert', 'ocean', 'cave'],
                description: 'Biome type',
              },
              groundColor: {
                type: 'string',
                description: 'Ground material color (hex)',
              },
              objectsToAdd: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    type: { type: 'string' },
                    position: {
                      type: 'array',
                      items: { type: 'number' },
                      minItems: 3,
                      maxItems: 3,
                    },
                  },
                },
                description: 'Objects to add to the biome',
              },
              objectsToRemove: {
                type: 'array',
                items: { type: 'string' },
                description: 'IDs of objects to remove',
              },
            },
          },
        },
        {
          name: 'animateObject',
          description: 'Animate an object in the scene with position, rotation, or scale changes',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Object ID' },
              duration: { type: 'number', description: 'Animation duration in ms' },
              targetPosition: {
                type: 'array',
                items: { type: 'number' },
                minItems: 3,
                maxItems: 3,
                description: 'Target position [x, y, z]',
              },
              targetRotation: {
                type: 'array',
                items: { type: 'number' },
                minItems: 3,
                maxItems: 3,
                description: 'Target rotation [x, y, z] in radians',
              },
              targetScale: {
                type: 'array',
                items: { type: 'number' },
                minItems: 3,
                maxItems: 3,
                description: 'Target scale [x, y, z]',
              },
              easing: {
                type: 'string',
                description: 'Easing function',
              },
            },
            required: ['id', 'duration'],
          },
        },
        {
          name: 'removeMutation',
          description: 'Remove a mutation from the creature',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Mutation ID to remove' },
            },
            required: ['id'],
          },
        },
      ],
    }));

    // Register tool call handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'getSceneState':
          return this.handleGetSceneState();

        case 'addMutation':
          return this.handleAddMutation(args as unknown as AddMutationParams);

        case 'controlCamera':
          return this.handleControlCamera(args as unknown as CameraControlParams);

        case 'modifyBiome':
          return this.handleModifyBiome(args as unknown as ModifyBiomeParams);

        case 'animateObject':
          return this.handleAnimateObject(args as unknown as AnimateObjectParams);

        case 'removeMutation':
          return this.handleRemoveMutation(args as unknown as RemoveMutationParams);

        default:
          return {
            content: [
              {
                type: 'text',
                text: `Unknown tool: ${name}`,
              },
            ],
            isError: true,
          };
      }
    });
  }

  /**
   * Handle getSceneState tool call
   */
  private handleGetSceneState() {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(this.sceneState, null, 2),
        },
      ],
    };
  }

  /**
   * Handle addMutation tool call
   */
  private handleAddMutation(params: AddMutationParams) {
    if (!this.clientConnection) {
      return {
        content: [
          {
            type: 'text',
            text: 'No Three.js client connected',
          },
        ],
        isError: true,
      };
    }

    const command = {
      action: 'addMutation',
      ...params,
    };

    this.clientConnection.send(JSON.stringify(command));

    return {
      content: [
        {
          type: 'text',
          text: `Mutation command sent: ${params.id}`,
        },
      ],
    };
  }

  /**
   * Handle controlCamera tool call
   */
  private handleControlCamera(params: CameraControlParams) {
    if (!this.clientConnection) {
      return {
        content: [
          {
            type: 'text',
            text: 'No Three.js client connected',
          },
        ],
        isError: true,
      };
    }

    const command = {
      action: 'controlCamera',
      ...params,
    };

    this.clientConnection.send(JSON.stringify(command));

    return {
      content: [
        {
          type: 'text',
          text: 'Camera control command sent',
        },
      ],
    };
  }

  /**
   * Handle modifyBiome tool call
   */
  private handleModifyBiome(params: ModifyBiomeParams) {
    if (!this.clientConnection) {
      return {
        content: [
          {
            type: 'text',
            text: 'No Three.js client connected',
          },
        ],
        isError: true,
      };
    }

    const command = {
      action: 'modifyBiome',
      ...params,
    };

    this.clientConnection.send(JSON.stringify(command));

    return {
      content: [
        {
          type: 'text',
          text: 'Biome modification command sent',
        },
      ],
    };
  }

  /**
   * Handle animateObject tool call
   */
  private handleAnimateObject(params: AnimateObjectParams) {
    if (!this.clientConnection) {
      return {
        content: [
          {
            type: 'text',
            text: 'No Three.js client connected',
          },
        ],
        isError: true,
      };
    }

    const command = {
      action: 'animateObject',
      ...params,
    };

    this.clientConnection.send(JSON.stringify(command));

    return {
      content: [
        {
          type: 'text',
          text: `Animation command sent for object: ${params.id}`,
        },
      ],
    };
  }

  /**
   * Handle removeMutation tool call
   */
  private handleRemoveMutation(params: RemoveMutationParams) {
    if (!this.clientConnection) {
      return {
        content: [
          {
            type: 'text',
            text: 'No Three.js client connected',
          },
        ],
        isError: true,
      };
    }

    const command = {
      action: 'removeMutation',
      ...params,
    };

    this.clientConnection.send(JSON.stringify(command));

    return {
      content: [
        {
          type: 'text',
          text: `Mutation removal command sent: ${params.id}`,
        },
      ],
    };
  }

  /**
   * Stop the server and close connections
   */
  async stop(): Promise<void> {
    if (this.clientConnection) {
      this.clientConnection.close();
    }
    this.wss.close();
    await this.server.close();
    console.log('[MCP Server] Stopped');
  }
}

// ============================================================================
// Main Entry Point
// ============================================================================

// Only start if this file is run directly
if (require.main === module) {
  const server = new MCPServer();
  server.start().catch((error) => {
    console.error('[MCP Server] Failed to start:', error);
    process.exit(1);
  });

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('[MCP Server] Shutting down...');
    await server.stop();
    process.exit(0);
  });
}
