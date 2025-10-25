import { GoogleGenerativeAI } from '@google/generative-ai';
import { FamiliarStats, MutationData, BiomeType, StatEffects } from '../../shared/types/api.js';

// ============================================================================
// Types for LLM Processing
// ============================================================================

export interface MutationContext {
  stats: FamiliarStats;
  mutations: MutationData[];
  biome: BiomeType;
  activityCategory?: string;
  creatureId: string;
}

export interface MutationOption {
  id: string;
  label: string;
  description: string;
  category: string;
  geometry: {
    type: string;
    dimensions?: any;
    customBuffer?: any;
  };
  material: {
    type: string;
    color: string;
    emissive?: string;
    emissiveIntensity?: number;
    metalness?: number;
    roughness?: number;
    opacity?: number;
    transparent?: boolean;
  };
  transform: {
    position: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number];
  };
  parent?: string;
  children?: MutationOption[];
  animation?: {
    duration: number;
    easing: string;
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
  renderingHints?: any;
}

// ============================================================================
// Gemini LLM Processor
// ============================================================================

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

      const parsedOptions = JSON.parse(jsonMatch[0]);
      
      // Validate each mutation option has required fields
      const validatedOptions = parsedOptions.filter((option: any) => {
        return this.validateMutationOption(option);
      });

      if (validatedOptions.length === 0) {
        throw new Error('No valid mutation options in response');
      }

      return validatedOptions;
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }

  private validateMutationOption(option: any): boolean {
    // Check required fields: id, category, label, geometry, material, transform
    if (!option.id || typeof option.id !== 'string') {
      console.warn('Invalid mutation option: missing or invalid id');
      return false;
    }

    if (!option.category || typeof option.category !== 'string') {
      console.warn('Invalid mutation option: missing or invalid category');
      return false;
    }

    if (!option.label || typeof option.label !== 'string') {
      console.warn('Invalid mutation option: missing or invalid label');
      return false;
    }

    if (!option.geometry || typeof option.geometry !== 'object' || !option.geometry.type) {
      console.warn('Invalid mutation option: missing or invalid geometry');
      return false;
    }

    if (!option.material || typeof option.material !== 'object' || !option.material.type || !option.material.color) {
      console.warn('Invalid mutation option: missing or invalid material');
      return false;
    }

    if (!option.transform || typeof option.transform !== 'object' || !Array.isArray(option.transform.position)) {
      console.warn('Invalid mutation option: missing or invalid transform');
      return false;
    }

    return true;
  }

  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), ms)
    );
  }

  private buildMutationPrompt(context: MutationContext): string {
    return `You are a Three.js creature evolution designer for Re-GenX. Generate 3-5 unique mutation options with complete geometry, materials, and animations.

Current Creature State:
- Stats: ${JSON.stringify(context.stats)}
- Existing Mutations: ${context.mutations.map(m => m.category).join(', ')}
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

Output ONLY a JSON array with complete MutationOption objects:
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
      "emissiveIntensity": 0.5
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
    }
  }
]

Generate ${context.activityCategory ? `mutations themed around ${context.activityCategory}` : 'creative, unique mutations'}. Be specific with geometry dimensions and materials.`;
  }
}
