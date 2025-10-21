# Re-GenX Sound System

## Overview

The Re-GenX sound system provides immersive audio feedback using procedurally generated sounds via the Web Audio API. This approach avoids the need for external audio files while providing rich audio experiences.

## Features

### Sound Effects

1. **Mutation Sound** - Subtle shimmer effect when mutations complete (1.5s)
2. **Feed Sound** - Quick chomping burst when feeding familiar (0.4s)
3. **Play Sound** - Bouncy, playful tone when playing with familiar (0.6s)
4. **Attention Sound** - Gentle, warm tone when giving attention (0.5s)
5. **Sad Sound** - Descending melancholic tone when Care Meter drops below 20 (1.0s)
6. **Click Sound** - Short click for UI interactions (0.1s)

### Ambient Sounds

Each biome has its own looping ambient sound:

1. **Jungle** - Layered bird calls and rustling (10s loop)
2. **Rocky Mountain** - Wind sounds (10s loop)
3. **Desert** - Sparse, dry wind (10s loop)
4. **Ocean** - Wave sounds with splashes (10s loop)
5. **Cave** - Dripping water with echo (10s loop)

## Architecture

### SoundManager (`src/client/audio/sound-manager.ts`)

The central sound management class that handles:

- Audio context initialization
- Procedural sound generation
- Sound playback
- Ambient sound looping
- Volume control
- Enable/disable functionality

### SoundSettings (`src/client/ui/sound-settings.ts`)

UI component for user sound preferences:

- Master volume control (0-100%)
- Ambient volume control (0-100%)
- Enable/disable toggle
- Settings persistence via localStorage

## Usage

### Playing Sound Effects

```typescript
import { soundManager } from './audio/sound-manager';

// Play a sound effect
soundManager.playSound('mutation', 0.6); // 60% volume
soundManager.playSound('feed', 0.7);
soundManager.playSound('click', 0.5);
```

### Playing Ambient Sounds

```typescript
// Play ambient sound for a biome (loops automatically)
soundManager.playAmbient('ambient_jungle');

// Stop current ambient sound
soundManager.stopAmbient();
```

### Volume Control

```typescript
// Set master volume (0.0 to 1.0)
soundManager.setVolume(0.7);

// Set ambient volume (0.0 to 1.0)
soundManager.setAmbientVolume(0.3);

// Enable/disable all sounds
soundManager.setEnabled(false);
```

## Integration Points

### Main Application (`src/client/main.ts`)

- Preloads all sounds on initialization
- Plays ambient sound when biome changes
- Plays mutation sound when mutations occur
- Plays sad sound when Care Meter drops below 20

### Care Actions (`src/client/ui/care-actions.ts`)

- Plays appropriate sound for each care action (feed, play, attention)

### HUD Drawer (`src/client/ui/hud-drawer.ts`)

- Plays click sound when menu is toggled

### Mutation Choice (`src/client/ui/mutation-choice.ts`)

- Plays click sound when evolve button is clicked
- Plays click sound when trait option is selected

## User Settings

Sound preferences are stored in localStorage:

- `soundMasterVolume` - Master volume (0-100)
- `soundAmbientVolume` - Ambient volume (0-100)
- `soundEnabled` - Enable/disable flag (true/false)

Settings persist across sessions and are automatically loaded on initialization.

## Browser Compatibility

The sound system uses the Web Audio API, which is supported in all modern browsers:

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (may require user interaction to start)

### Autoplay Policy

Due to browser autoplay policies, audio context may be suspended until user interaction. The sound manager automatically resumes the audio context when sounds are played.

## Performance

### Memory Usage

All sounds are procedurally generated and stored in memory:

- Sound effects: ~50KB total
- Ambient sounds: ~200KB total (10s loops)
- Total: ~250KB

### CPU Usage

Sound generation happens once during preload. Playback has minimal CPU impact.

## Future Enhancements

Potential improvements for Phase 2:

1. **More Sound Variations** - Multiple variations of each sound effect
2. **Spatial Audio** - 3D positional audio for mutations
3. **Dynamic Music** - Adaptive music based on familiar state
4. **Custom Sound Packs** - Allow users to upload custom sounds
5. **Sound Visualization** - Visual feedback synced with audio

## Troubleshooting

### No Sound Playing

1. Check browser console for Web Audio API errors
2. Verify sound is enabled in settings (speaker icon)
3. Check master volume is not at 0
4. Ensure browser allows audio playback

### Ambient Sound Not Looping

1. Check ambient volume is not at 0
2. Verify biome has changed (ambient only plays on biome change)
3. Check browser console for errors

### Sounds Too Loud/Quiet

1. Open sound settings (speaker icon in top-right)
2. Adjust master volume slider
3. Adjust ambient volume slider separately
4. Settings are saved automatically

## Technical Details

### Procedural Sound Generation

All sounds are generated using oscillators and envelopes:

```typescript
// Example: Mutation sound
const freq = 200 + t * 400; // Sweeping frequency
const shimmer = Math.sin(2 * Math.PI * 8 * t) * 0.3; // Shimmer effect
const envelope = Math.exp(-t * 2); // Exponential decay
data[i] = Math.sin(2 * Math.PI * freq * t + shimmer) * envelope * 0.3;
```

This approach provides:
- Small file size (no audio files needed)
- Instant loading
- Consistent quality
- Easy customization

### Audio Context Management

The sound manager handles audio context lifecycle:

1. Initialize on construction
2. Resume on first user interaction
3. Manage multiple audio sources
4. Clean up on page unload

## Accessibility

The sound system is designed to be accessible:

- All sounds are optional (can be disabled)
- Visual feedback accompanies all audio cues
- Volume controls for different sound types
- Clear UI for sound settings
