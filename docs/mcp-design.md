# LLM Integration Design for Re-GenX

## Overview

This document outlines the integration of Large Language Models (LLMs) with the Re-GenX creature evolution game. Based on Devvit's platform constraints, we'll implement a direct LLM integration approach rather than using the Model Context Protocol (MCP).

## Why MCP Isn't Suitable for Devvit

### Platform Limitations

- **No stdio support**: Devvit runs in a serverless environment without access to local processes or stdio pipes
- **No WebSocket support**: Devvit explicitly states "websockets are not supported" in their limitations
- **No long-running connections**: Server endpoints run only long enough to execute and return a response
- **External hosting complexity**: MCP would require external server hosting, adding unnecessary complexity

### Devvit's Networking Constraints

Based on Devvit documentation:

- **Client limitations**: No external requests from client except to app's own webview domain
- **Server capabilities**: Server can make external HTTP fetch requests to approved domains
- **Realtime features**: Available through Devvit's built-in realtime channels (not WebSockets)
- **Approved LLMs**: Only Google Gemini and OpenAI ChatGPT are approved for use

## Recommended Approach: Direct LLM Integration

### Architecture Overview

```
Client → Server API Endpoint → Gemini API → Response → Client
```

### Core Components

#### 1. **LLM Processor Service**

- **Location**: `src/server/llm/gemini-processor.ts`
- **Purpose**: Direct integration with Google Gemini API
- **Transport**: HTTP fetch requests to Gemini API
- **Caching**: Redis-based response caching (5-minute TTL)

#### 2. **Context Builder**

- **Location**: `src/server/llm/context-builder.ts`
- **Purpose**: Gather creature state, mutations, and biome data
- **Data Source**: Redis via Devvit's built-in Redis client

#### 3. **API Endpoints**

- **POST /api/mutation/generate**: Generate LLM-powered mutation options
- **POST /api/mutation/apply**: Apply selected mutations to creature
- **GET /api/creature/state**: Get current creature state for context

#### 4. **Fallback System**

- **Hardcoded mutations**: When LLM fails or times out
- **Redis flags**: Track LLM availability and skip periods
- **Graceful degradation**: Maintain game functionality without LLM

### Communication Flow

#### Mutation Generation Flow

1. **Client Request**: User triggers mutation generation
2. **Context Building**: Server gathers creature stats, recent mutations, biome data
3. **LLM Request**: Server sends structured prompt to Gemini API
4. **Response Processing**: Parse and validate LLM response
5. **Caching**: Store results in Redis with TTL
6. **Client Response**: Return mutation options to client

#### Real-time Updates

- **Devvit Realtime**: Use `@devvit/web/client` realtime channels for live updates
- **Server Broadcasting**: Use `realtime.send()` to broadcast mutation events
- **Client Subscription**: Subscribe to creature-specific channels

### Implementation Strategy

#### Phase 1: Core LLM Integration

- Direct Gemini API integration
- Basic prompt engineering for mutations
- Simple caching layer
- Fallback to hardcoded mutations

#### Phase 2: Enhanced Context

- Activity pattern integration (with privacy opt-in)
- Biome-aware mutations
- Stat balancing logic
- Advanced prompt templates

#### Phase 3: Real-time Features

- Live mutation broadcasting via Devvit realtime
- Multi-user creature updates
- Atmospheric descriptions
- Camera control suggestions

### Benefits of This Approach

#### Simplicity

- No external server hosting required
- Uses Devvit's built-in capabilities
- Leverages approved LLM services
- Minimal infrastructure complexity

#### Performance

- Direct API calls (no proxy layer)
- Built-in Redis caching
- Devvit's optimized serverless execution
- Mobile-optimized response times

#### Compliance

- Uses only approved LLMs (Gemini)
- Follows Devvit networking rules
- Respects platform limitations
- Maintains Reddit integration

### Technical Specifications

#### LLM Configuration

```typescript
// Gemini API setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
```

#### Prompt Structure

```typescript
const prompt = `
Generate 3 mutation options for a creature with:
- Stats: ${JSON.stringify(stats)}
- Recent mutations: ${mutations.join(', ')}
- Biome: ${biome}
- Activity: ${activityCategory || 'unknown'}

Return JSON array with mutation objects containing:
- id, label, category
- geometry: { type, dimensions }
- material: { type, color }
- transform: { position, rotation, scale }
- statEffects: { [stat]: delta }
`;
```

#### Realtime Integration

```typescript
// Server: broadcast mutation
await realtime.send(`creature:${creatureId}`, {
  type: 'mutation_applied',
  mutation: mutationData,
  newStats: updatedStats,
});

// Client: subscribe to updates
const connection = await connectRealtime({
  channel: `creature:${creatureId}`,
  onMessage: (data) => {
    if (data.type === 'mutation_applied') {
      applyMutationToScene(data.mutation);
      updateStatsDisplay(data.newStats);
    }
  },
});
```

This approach provides a robust, platform-compliant solution that leverages Devvit's strengths while avoiding its limitations.
