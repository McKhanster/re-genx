---
inclusion: fileMatch
fileMatchPattern: 'src/server/core/mutation*.ts'
---

# Mutation Design Guidelines

Quick reference for creating and modifying mutations in Re-GenX.

## Randomness Spectrum (Requirement 8)

**Controlled Mutations** (from genetic shots):

- Randomness factor: `0.85 - 0.95`
- Players vote on traits, but get 5-15% variation
- Example: Vote for "4 legs" → get 3.8-4.2 legs (rounded)

**Uncontrolled Mutations** (automatic):

- Randomness factor: `0.05 - 0.15`
- Mostly random, but 5-15% influenced by behavior
- Example: Behavior suggests "feline" → 10% bias toward cat-like traits

```typescript
// Apply randomness to any numeric value
function applyRandomness(value: number, factor: number): number {
  const variance = value * (1 - factor);
  return value + (Math.random() - 0.5) * variance * 2;
}

// Usage
const controlledValue = applyRandomness(votedValue, 0.85 + Math.random() * 0.1);
const uncontrolledValue = applyRandomness(baseValue, 0.05 + Math.random() * 0.1);
```

## Stat Balance Rules

Every mutation MUST have trade-offs:

```typescript
// ✓ GOOD - Balanced trade-offs
{
  type: 'giant_size',
  statEffects: {
    survival: { attack: +40, defense: +30 },
    mobility: { speed: -25, agility: -20 }
  }
}

// ✗ BAD - Only positive effects
{
  type: 'super_mutation',
  statEffects: {
    survival: { attack: +50, defense: +50 }
  }
}
```

**Rule:** Total stat delta should be ≤ 0 (more negatives than positives)

## Mutation Compatibility

Check compatibility before applying:

```typescript
const INCOMPATIBLE_PAIRS = {
  'wings': ['heavy_armor', 'aquatic_fins'],
  'aquatic_fins': ['wings', 'desert_adaptation'],
  'bioluminescence': ['camouflage'],
};

function isCompatible(newMutation: string, existing: string[]): boolean {
  const incompatible = INCOMPATIBLE_PAIRS[newMutation] || [];
  return !existing.some((m) => incompatible.includes(m));
}
```

## Visual Mutation Guidelines

1. **Additive, not replacement** - Add new meshes, don't remove existing
2. **Relative positioning** - Position relative to creature center
3. **Reasonable poly counts** - Max 2,000 triangles per mutation
4. **Mobile optimization** - Reduce complexity by 50% on mobile

```typescript
// ✓ GOOD - Additive
function addLegs(creature: THREE.Object3D, count: number): void {
  const legGeometry = new THREE.CylinderGeometry(0.1, 0.05, 1, 8);
  for (let i = 0; i < count; i++) {
    const leg = new THREE.Mesh(legGeometry, legMaterial);
    creature.add(leg); // Add as child
  }
}

// ✗ BAD - Replacement
function addLegs(creature: THREE.Object3D, count: number): void {
  creature.clear(); // Don't clear existing!
  // ...
}
```

## Behavior-Influenced Mutations

Use behavior patterns to bias mutation selection:

```typescript
async function selectMutationType(groupId: string): Promise<string> {
  const patterns = await getBehaviorPatterns(groupId);
  const dominant = patterns.dominantCategory;

  // 40% bias toward dominant category
  if (Math.random() < 0.4) {
    return CATEGORY_MUTATIONS[dominant][
      Math.floor(Math.random() * CATEGORY_MUTATIONS[dominant].length)
    ];
  }

  // 60% completely random
  return getRandomMutationType();
}
```

## Animation Requirements

All mutations MUST animate over 2-3 seconds:

```typescript
async function animateMutation(mesh: THREE.Mesh): Promise<void> {
  const duration = 2000 + Math.random() * 1000; // 2-3 seconds
  const startScale = new THREE.Vector3(0, 0, 0);
  const targetScale = mesh.scale.clone();

  mesh.scale.copy(startScale);

  return new Promise((resolve) => {
    const startTime = Date.now();

    function animate() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutElastic(progress);

      mesh.scale.lerpVectors(startScale, targetScale, eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        resolve();
      }
    }

    animate();
  });
}
```

## Common Mistakes to Avoid

1. ❌ Forgetting to apply randomness factor
2. ❌ Creating mutations with only positive stat effects
3. ❌ Not checking compatibility with existing mutations
4. ❌ Replacing creature geometry instead of adding to it
5. ❌ Skipping animation (instant mutations feel wrong)
6. ❌ Not optimizing for mobile (high poly counts)
7. ❌ Hardcoding values instead of using behavior patterns
