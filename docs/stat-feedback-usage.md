# Stat Feedback System Usage

## Overview

The stat feedback system displays floating numbers when creature stats change, providing visual feedback to players about the effects of mutations and other stat-affecting actions.

## Features

- **Color-coded changes**: Green for increases (+), red for decreases (-)
- **Smooth animations**: Float up and fade out over 1 second
- **Stacked display**: Multiple stat changes appear stacked vertically with slight delays
- **Mobile-optimized**: Automatically centers on mobile devices

## Usage

### Basic Usage

```typescript
import { StatFeedback } from './ui/stat-feedback';

// Show a single stat change
StatFeedback.showStatChange('speed', 10); // +10 speed (green)
StatFeedback.showStatChange('defense', -5); // -5 defense (red)
```

### Multiple Stat Changes

```typescript
// Show multiple stat changes at once (stacked vertically)
StatFeedback.showMultipleStatChanges({
  'Mobility.speed': 15,
  'Mobility.agility': 10,
  'Senses.vision': -8,
  'Cognition.intelligence': 12,
});
```

### Category-Based Display

```typescript
// Show category header followed by stat changes
StatFeedback.showCategoryStatChanges('Mobility', {
  speed: 15,
  agility: 10,
  endurance: 5,
});
```

## Integration with CreatureRenderer

The `CreatureRenderer` class includes methods to automatically show stat changes when mutations are applied:

```typescript
// Apply mutation with automatic stat feedback
await creatureRenderer.applyMutationWithFeedback(
  mutation,
  randomnessFactor,
  true,  // animate
  true   // show stats
);

// Or manually show stat changes
creatureRenderer.showStatChanges(mutation.statEffects);
```

## Integration with HUDDrawer

The `HUDDrawer` automatically shows floating stat changes when stats are updated:

```typescript
// Update stats with previous values to show changes
hudDrawer.updateStats(newStats, previousStats);
```

## CSS Customization

The stat feedback appearance can be customized in `src/client/index.css`:

- `.stat-change-feedback` - Main container
- `.stat-change-label` - Stat name label
- `.stat-change-value` - Numeric value
- `.stat-change-category-header` - Category header

## Animation Details

- **Duration**: 1 second
- **Easing**: Custom float-up animation with scale
- **Stagger delay**: 100ms between multiple stats
- **Position**: Center-right by default (70% from left, 50% from top)

## Mobile Behavior

On mobile devices:
- Feedback automatically centers horizontally
- Font sizes are reduced for better readability
- Touch-friendly spacing maintained
