// ============================================================================
// Re-GenX Shared Types
// ============================================================================

// Biome Types
export type BiomeType = 'jungle' | 'rocky_mountain' | 'desert' | 'ocean' | 'cave';

// ============================================================================
// Creature Stats
// ============================================================================

export interface CreatureStats {
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

// ============================================================================
// Familiar Stats (Personal Creature)
// ============================================================================

export interface FamiliarStats {
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

// ============================================================================
// Familiar State
// ============================================================================

export interface FamiliarState {
  id: string;
  userId: string;
  age: number;
  careMeter: number; // 0-100
  evolutionPoints: number;
  mutations: MutationData[];
  stats: FamiliarStats;
  biome: BiomeType;
  lastCareTime: number;
  createdAt: number;
  privacyOptIn: boolean;
  neglectWarning?: boolean;
}

// ============================================================================
// Mutation Types
// ============================================================================

export interface MutationTrait {
  category: string; // 'legs', 'color', 'size', etc.
  value: string | number | boolean | object;
  randomnessFactor: number;
}

export interface StatEffects {
  [category: string]: {
    [stat: string]: number;
  };
}

export interface MutationData {
  id: string;
  type: 'controlled' | 'uncontrolled';
  traits: MutationTrait[];
  statEffects: StatEffects;
  timestamp: number;
}

// ============================================================================
// Group and Status Types
// ============================================================================

export interface GroupStatus {
  status: 'waiting' | 'in_group';
  groupId?: string;
  creatureId?: string;
  count?: number;
  total?: number;
}

// ============================================================================
// Voting and Mutation Session Types
// ============================================================================

export interface TraitOption {
  id: string;
  label: string;
  value: string | number | boolean | object;
}

export interface TraitCategory {
  name: string;
  options: TraitOption[];
}

export interface MutationSession {
  sessionId: string;
  traitCategories: TraitCategory[];
  expiresAt: number;
}

// ============================================================================
// Behavior Pattern Types
// ============================================================================

export interface BehaviorPattern {
  categories: Record<string, number>;
  dominantCategory: string;
  lastUpdated: number;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface CreatureStateResponse {
  creatureId: string;
  groupId: string;
  age: number;
  biome: BiomeType;
  mutations: MutationData[];
  stats: CreatureStats;
  createdAt: number;
}

export type GroupStatusResponse = GroupStatus;

export type MutationSessionResponse = MutationSession;

export interface KarmaContributeResponse {
  success: boolean;
  newBalance: number;
}

export interface ErrorResponse {
  error: string;
}

export interface FamiliarStateResponse {
  familiar: FamiliarState | null;
}

export interface FamiliarCreateResponse {
  familiar: FamiliarState;
}

export interface CareActionResponse {
  careMeter: number;
  evolutionPoints: number;
  careMeterIncrease: number;
  evolutionPointsGained: number;
}

export interface MutationTriggerResponse {
  sessionId: string;
  options: MutationTraitOption[];
}

export interface MutationTraitOption {
  id: string;
  category: string;
  label: string;
  value: string | number | boolean | object;
}

export interface MutationChooseRequest {
  sessionId: string;
  optionId: string;
}

export interface MutationChooseResponse {
  mutation: MutationData;
  updatedStats: FamiliarStats;
}

export interface PrivacyOptInRequest {
  optIn: boolean;
}

export interface PrivacyOptInResponse {
  success: boolean;
  privacyOptIn: boolean;
}

// ============================================================================
// Creature Personality API Types
// ============================================================================

export interface CreatureInteractRequest {
  creatureId: string;
  eventType: 'birth' | 'feeding' | 'mutation' | 'hourly_evolution';
  context?: {
    mutationId?: string;
    careAction?: string;
    [key: string]: any;
  };
}

export interface CreaturePersonalityResponse {
  personality: {
    mood: string;
    energy: number;
    sound: string;
    movement: string;
    memory?: string;
  };
  timestamp: number;
  cached: boolean;
}

export interface CreaturePersonalityStateResponse {
  personality: {
    mood: string;
    energy: number;
    sound: string;
    movement: string;
    memory?: string;
  } | null;
  timestamp: number;
  creatureId: string;
}

export interface PrivacyConsentRequest {
  consent: boolean;
}

export interface PrivacyConsentResponse {
  success: boolean;
  consentStatus: boolean;
}

// ============================================================================
// Legacy API Response Types (from template)
// ============================================================================

export interface InitResponse {
  type: 'init';
  postId: string;
  count: number;
  username: string;
}

export interface IncrementResponse {
  type: 'increment';
  postId: string;
  count: number;
}

export interface DecrementResponse {
  type: 'decrement';
  postId: string;
  count: number;
}
