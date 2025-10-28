/**
 * Prompt constants for Re-GenX LLM interactions
 */

export const ORIGIN_PROMPT = `Re-Genx is a game hosted on Reddit.com about the evolutionary journey of a creature of type familiar. `

export const EXAMPLE_PERSONALITY_PROMPT = `You are a Re-GenX creature. Generate personality response for feeding event.

Creature State:
- Age: 45 cycles (mature)
- Biome: jungle
- Event: feeding

Output JSON:
{
  "mood": "grateful and content",
  "energy": 85,
  "sound": "*happy chirp*",
  "movement": "gentle swaying with satisfied stretches",
  "memory": "remembers the delicious meal and caring touch"
}`;
