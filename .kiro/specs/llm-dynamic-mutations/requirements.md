# Requirements Document

## Introduction

This feature introduces LLM-powered dynamic mutation and scene generation to Re-GenX by building a custom MCP (Model Context Protocol) server that exposes Three.js scene manipulation tools. The LLM will use these MCP tools to generate contextual mutations and scene modifications based on creature state, player activity, and environmental factors. The system consists of: (1) an MCP server that provides scene manipulation tools, (2) a WebSocket bridge between the MCP server and the client's Three.js scene, and (3) an LLM service that uses these tools to create dynamic content.

## Glossary

- **MCP Server**: A Node.js server implementing the Model Context Protocol that exposes Three.js manipulation tools to LLMs via stdio transport
- **MCP Tools**: Individual functions exposed by the MCP server (e.g., `addMutation`, `modifyBiome`, `getSceneState`, `animateObject`)
- **WebSocket Server**: Runs on port 8082 within the MCP server, maintains bidirectional connection with the Three.js client for command execution
- **Three.js Client**: Browser-based Three.js scene that connects to WebSocket server, sends scene state updates, and receives/executes commands
- **LLM Processor**: Component that sends prompts to an LLM API (e.g., xAI Grok) with MCP tools available, receives structured command responses
- **Command Executor**: Validates LLM-generated commands and sends them to the Three.js client via WebSocket
- **Scene State Manager**: Maintains centralized JSON representation of the scene (objects, positions, mutations) synchronized between server and client
- **Context Builder**: Gathers creature stats, mutation history, activity patterns, and current scene state to construct LLM prompts
- **Mutation Cache**: Redis-based storage for LLM-generated mutation specifications to reduce API calls and costs
- **Fallback System**: Hardcoded mutation options and client-side geometry generation used when MCP server or LLM service is unavailable

## Requirements

### Requirement 1

**User Story:** As a player, I want mutations to feel unique and contextual to my creature's current state, so that evolution feels more dynamic and personalized

#### Acceptance Criteria

1. WHEN THE Context Builder receives a mutation request, THE Context Builder SHALL gather creature stats, existing mutations, biome type, and recent player activity
2. WHEN THE Context Builder has gathered context, THE LLM Processor SHALL construct a prompt with available MCP tools and send it to the LLM API
3. WHEN THE LLM API receives the prompt, THE LLM SHALL call the `getSceneState` MCP tool to retrieve current scene objects and their properties
4. WHEN THE MCP Server receives the `getSceneState` tool call, THE MCP Server SHALL return the current scene state JSON from the Scene State Manager
5. WHEN THE LLM analyzes the scene state, THE LLM SHALL generate 3-5 mutation options as structured JSON and return them to the LLM Processor
6. WHEN THE LLM Processor receives options, THE Mutation Cache SHALL store them in Redis with a 5-minute TTL using creature ID and context hash as key
7. IF THE LLM API fails or exceeds 25 seconds, THEN THE Fallback System SHALL return hardcoded mutation options

### Requirement 2

**User Story:** As a player, I want the biome environment to evolve and change based on my creature's mutations, so that the world feels responsive to my choices

#### Acceptance Criteria

1. WHEN THE Scene Generator detects a new mutation has been applied, THE Scene Generator SHALL send mutation context to the LLM Service via Three.js MCP Bridge
2. WHEN THE LLM Service receives mutation context, THE LLM Service SHALL use Three.js MCP tools to query current scene objects and their properties
3. WHEN THE LLM Service analyzes the scene, THE LLM Service SHALL use MCP tools to create, modify, or remove environmental objects in real-time
4. WHEN THE LLM Service manipulates objects, THE Scene Generator SHALL validate that changes stay within the 5ft visibility radius
5. WHEN THE Scene Generator validates changes, THE Scene Generator SHALL persist the scene state to Redis for consistency across sessions
6. WHILE THE creature has fewer than 3 mutations, THE Scene Generator SHALL use standard biome rendering without LLM manipulation

### Requirement 3

**User Story:** As a player, I want mutation descriptions to reference my creature's history and stats, so that mutations feel like a natural progression

#### Acceptance Criteria

1. WHEN THE Context Builder gathers mutation context, THE Context Builder SHALL include the creature's last 3 mutations in the prompt
2. WHEN THE Context Builder includes mutation history, THE Context Builder SHALL include current stat values for all five categories (mobility, senses, survival, cognition, vitals)
3. WHEN THE LLM Service generates mutation options, THE LLM Service SHALL return options that reference existing traits in their descriptions
4. WHEN THE Mutation Generator presents options to players, THE Mutation Generator SHALL display LLM-generated flavor text alongside technical details
5. WHERE THE creature has no mutation history, THE Mutation Generator SHALL request "first mutation" options from the LLM

### Requirement 4

**User Story:** As a developer, I want the LLM integration to handle failures gracefully, so that the game remains playable even when the LLM service is down

#### Acceptance Criteria

1. WHEN THE LLM Service request exceeds 25 seconds, THE Fallback System SHALL cancel the request and use hardcoded options
2. WHEN THE LLM Service returns an error, THE Fallback System SHALL log the error and use hardcoded options
3. WHEN THE LLM Service returns invalid JSON, THE Fallback System SHALL parse what it can and supplement with hardcoded options
4. WHEN THE Fallback System activates, THE Fallback System SHALL set a Redis flag to skip LLM calls for 5 minutes
5. WHILE THE Fallback System is active, THE Mutation Generator SHALL use hardcoded options without attempting LLM calls

### Requirement 5

**User Story:** As a player with privacy opt-in enabled, I want mutations influenced by my Reddit activity patterns, so that my creature reflects my interests

#### Acceptance Criteria

1. WHERE THE player has privacy opt-in enabled, THE Context Builder SHALL include the player's dominant activity category in the LLM prompt
2. WHEN THE Context Builder includes activity patterns, THE Context Builder SHALL request mutations that thematically align with the activity category
3. WHEN THE LLM Service generates activity-influenced mutations, THE LLM Service SHALL return options that reference the activity theme in descriptions
4. WHERE THE player has privacy opt-out, THE Context Builder SHALL exclude all activity data from LLM prompts
5. WHEN THE Mutation Generator caches options, THE Mutation Generator SHALL tag cached options with privacy status to prevent cross-contamination

### Requirement 6

**User Story:** As a developer, I want to minimize LLM API costs, so that the feature is sustainable at scale

#### Acceptance Criteria

1. WHEN THE Mutation Generator caches LLM responses, THE Mutation Generator SHALL use creature ID and context hash as the cache key
2. WHEN THE Mutation Generator checks cache, THE Mutation Generator SHALL reuse cached responses for identical contexts within 5 minutes
3. WHEN THE Scene Generator requests biome variations, THE Scene Generator SHALL cache variations per biome type and mutation count
4. WHEN THE LLM Service makes API calls, THE LLM Service SHALL use the minimum token count necessary (target: 150-300 tokens per response)
5. WHILE THE creature is in a waiting room, THE Mutation Generator SHALL pre-generate and cache one mutation set to reduce latency

### Requirement 7

**User Story:** As a player, I want scene descriptions to enhance the atmosphere, so that I feel more immersed in the game world

#### Acceptance Criteria

1. WHEN THE Scene Generator generates a biome variation, THE Scene Generator SHALL request a 2-3 sentence atmospheric description from the LLM
2. WHEN THE LLM Service returns an atmospheric description, THE Scene Generator SHALL display it in the HUD for 5 seconds
3. WHEN THE Scene Generator displays descriptions, THE Scene Generator SHALL fade the text in and out smoothly
4. WHEN THE creature enters a new biome, THE Scene Generator SHALL request a biome-specific description that references the creature's appearance
5. WHERE THE LLM Service is unavailable, THE Scene Generator SHALL use generic biome descriptions from a fallback library

### Requirement 8

**User Story:** As a player, I want to see mutations applied in real-time with smooth animations, so that evolution feels magical and responsive

#### Acceptance Criteria

1. WHEN THE player selects a mutation option, THE LLM Processor SHALL send a prompt to the LLM API requesting mutation application commands
2. WHEN THE LLM API receives the request, THE LLM SHALL call the `addMutation` MCP tool with geometry type, position, color, and animation parameters
3. WHEN THE MCP Server receives the `addMutation` tool call, THE Command Executor SHALL validate parameters and send the command to the Three.js client via WebSocket
4. WHEN THE Three.js client receives the command, THE Three.js client SHALL create the mutation geometry and animate it over 2-3 seconds using position, rotation, and scale transformations
5. WHEN THE animation completes, THE Three.js client SHALL send the updated scene state back to the MCP Server via WebSocket
6. WHEN THE MCP Server receives the updated state, THE Scene State Manager SHALL persist it to Redis for consistency
7. IF THE WebSocket connection drops during mutation, THEN THE Fallback System SHALL apply the mutation using client-side geometry generation without MCP

### Requirement 9

**User Story:** As a developer, I want the WebSocket connection to handle failures gracefully, so that the game remains stable during network issues

#### Acceptance Criteria

1. WHEN THE Three.js client attempts to connect to the WebSocket Server, THE Three.js client SHALL retry up to 3 times with exponential backoff (1s, 2s, 4s)
2. WHEN THE WebSocket connection is established, THE Three.js client SHALL send scene state updates to the MCP Server every 5 seconds
3. WHEN THE MCP Server receives scene state updates, THE Scene State Manager SHALL update the centralized state for LLM queries
4. IF THE WebSocket connection closes unexpectedly, THEN THE Three.js client SHALL trigger fallback mode and attempt to reconnect after 60 seconds
5. WHILE THE connection is in fallback mode, THE Mutation Generator SHALL use client-side geometry generation for all mutations without MCP tools

### Requirement 10

**User Story:** As a developer, I want the MCP Server to expose Re-GenX-specific tools, so that the LLM can create contextual mutations and biome modifications

#### Acceptance Criteria

1. WHEN THE MCP Server initializes, THE MCP Server SHALL register tools: `getSceneState`, `addMutation`, `modifyBiome`, `animateObject`, `removeMutation`, `controlCamera`
2. WHEN THE LLM calls `controlCamera`, THE MCP Server SHALL accept parameters: position (array[3]), lookAt (array[3]), fov (number), zoom (number), animate (object)
3. WHEN THE LLM calls `addMutation`, THE MCP Server SHALL accept parameters: type (string), position (array[3]), color (string), category (string), statEffects (object)
4. WHEN THE LLM calls `modifyBiome`, THE MCP Server SHALL accept parameters: biomeType (string), groundColor (string), objectsToAdd (array), objectsToRemove (array)
5. WHEN THE LLM calls `animateObject`, THE MCP Server SHALL accept parameters: id (string), duration (number), targetPosition (array[3]), targetRotation (array[3])
6. WHEN THE LLM calls `getSceneState`, THE MCP Server SHALL return JSON containing: creatures (array), mutations (array), biome (object), environmentObjects (array), camera (object)
