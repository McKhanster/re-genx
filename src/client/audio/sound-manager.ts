/**
 * SoundManager - Handles all audio playback for Re-GenX
 * Provides methods for playing sound effects and ambient sounds
 */

export type SoundType =
  | 'mutation'
  | 'feed'
  | 'play'
  | 'attention'
  | 'sad'
  | 'click'
  | 'ambient_jungle'
  | 'ambient_rocky_mountain'
  | 'ambient_desert'
  | 'ambient_ocean'
  | 'ambient_cave';

export class SoundManager {
  private audioContext: AudioContext | null = null;
  private sounds: Map<SoundType, AudioBuffer> = new Map();
  private ambientSource: AudioBufferSourceNode | null = null;
  private ambientGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private enabled: boolean = false; // Disabled by default to stop constant ringing
  private currentAmbient: SoundType | null = null;

  constructor() {
    this.initAudioContext();
  }

  private initAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = 0.7; // Master volume at 70%

      this.ambientGain = this.audioContext.createGain();
      this.ambientGain.connect(this.masterGain);
      this.ambientGain.gain.value = 0.3; // Ambient sounds quieter
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
      this.enabled = false;
    }
  }

  /**
   * Generate procedural sound effects using Web Audio API
   * This avoids needing external audio files
   */
  private async generateSound(type: SoundType): Promise<AudioBuffer | null> {
    if (!this.audioContext) return null;

    const sampleRate = this.audioContext.sampleRate;
    let duration = 0.5;
    let buffer: AudioBuffer;

    switch (type) {
      case 'mutation':
        duration = 1.5;
        buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        this.generateMutationSound(buffer);
        break;

      case 'feed':
        duration = 0.4;
        buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        this.generateFeedSound(buffer);
        break;

      case 'play':
        duration = 0.6;
        buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        this.generatePlaySound(buffer);
        break;

      case 'attention':
        duration = 0.5;
        buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        this.generateAttentionSound(buffer);
        break;

      case 'sad':
        duration = 1.0;
        buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        this.generateSadSound(buffer);
        break;

      case 'click':
        duration = 0.1;
        buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        this.generateClickSound(buffer);
        break;

      case 'ambient_jungle':
        duration = 10.0;
        buffer = this.audioContext.createBuffer(2, sampleRate * duration, sampleRate);
        this.generateJungleAmbient(buffer);
        break;

      case 'ambient_rocky_mountain':
        duration = 10.0;
        buffer = this.audioContext.createBuffer(2, sampleRate * duration, sampleRate);
        this.generateMountainAmbient(buffer);
        break;

      case 'ambient_desert':
        duration = 10.0;
        buffer = this.audioContext.createBuffer(2, sampleRate * duration, sampleRate);
        this.generateDesertAmbient(buffer);
        break;

      case 'ambient_ocean':
        duration = 10.0;
        buffer = this.audioContext.createBuffer(2, sampleRate * duration, sampleRate);
        this.generateOceanAmbient(buffer);
        break;

      case 'ambient_cave':
        duration = 10.0;
        buffer = this.audioContext.createBuffer(2, sampleRate * duration, sampleRate);
        this.generateCaveAmbient(buffer);
        break;

      default:
        return null;
    }

    return buffer;
  }

  private generateMutationSound(buffer: AudioBuffer): void {
    const data = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      // Sweeping frequency with shimmer effect
      const freq = 200 + t * 400;
      const shimmer = Math.sin(2 * Math.PI * 8 * t) * 0.3;
      const envelope = Math.exp(-t * 2);
      data[i] = Math.sin(2 * Math.PI * freq * t + shimmer) * envelope * 0.3;
    }
  }

  private generateFeedSound(buffer: AudioBuffer): void {
    const data = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      // Chomping sound - quick burst
      const freq = 150 + Math.sin(t * 30) * 50;
      const envelope = Math.exp(-t * 8);
      data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.4;
    }
  }

  private generatePlaySound(buffer: AudioBuffer): void {
    const data = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      // Bouncy, playful sound
      const freq = 400 + Math.sin(t * 20) * 200;
      const envelope = Math.exp(-t * 4);
      data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.3;
    }
  }

  private generateAttentionSound(buffer: AudioBuffer): void {
    const data = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      // Gentle, warm sound
      const freq = 600 + t * 200;
      const envelope = Math.exp(-t * 3);
      data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.25;
    }
  }

  private generateSadSound(buffer: AudioBuffer): void {
    const data = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      // Descending, melancholic tone
      const freq = 300 - t * 150;
      const envelope = Math.exp(-t * 1.5);
      data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.2;
    }
  }

  private generateClickSound(buffer: AudioBuffer): void {
    const data = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      // Short click
      const freq = 800;
      const envelope = Math.exp(-t * 50);
      data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.2;
    }
  }

  private generateJungleAmbient(buffer: AudioBuffer): void {
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    const sampleRate = buffer.sampleRate;

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      // Layered nature sounds with birds and rustling
      const bird1 = Math.sin(2 * Math.PI * 1200 * t + Math.sin(t * 5)) * 0.05;
      const bird2 = Math.sin(2 * Math.PI * 1800 * t + Math.sin(t * 3)) * 0.03;
      const rustle = (Math.random() - 0.5) * 0.02;
      left[i] = bird1 + rustle;
      right[i] = bird2 + rustle;
    }
  }

  private generateMountainAmbient(buffer: AudioBuffer): void {
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    const sampleRate = buffer.sampleRate;

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      // Wind sounds
      const wind = (Math.random() - 0.5) * 0.03 * Math.sin(t * 0.5);
      left[i] = wind;
      right[i] = wind * 0.9;
    }
  }

  private generateDesertAmbient(buffer: AudioBuffer): void {
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    const sampleRate = buffer.sampleRate;

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      // Sparse, dry wind
      const wind = (Math.random() - 0.5) * 0.015 * Math.sin(t * 0.3);
      left[i] = wind;
      right[i] = wind * 1.1;
    }
  }

  private generateOceanAmbient(buffer: AudioBuffer): void {
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    const sampleRate = buffer.sampleRate;

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      // Wave sounds
      const wave = Math.sin(2 * Math.PI * 0.3 * t) * 0.04;
      const splash = (Math.random() - 0.5) * 0.02;
      left[i] = wave + splash;
      right[i] = wave * 0.95 + splash;
    }
  }

  private generateCaveAmbient(buffer: AudioBuffer): void {
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    const sampleRate = buffer.sampleRate;

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      // Dripping water and echo
      const drip = Math.sin(2 * Math.PI * 200 * t) * Math.exp(-((t % 2) * 10)) * 0.02;
      const echo = (Math.random() - 0.5) * 0.01;
      left[i] = drip + echo;
      right[i] = drip * 0.8 + echo;
    }
  }

  /**
   * Preload all sound effects
   */
  public async preloadSounds(): Promise<void> {
    if (!this.enabled || !this.audioContext) return;

    const soundTypes: SoundType[] = [
      'mutation',
      'feed',
      'play',
      'attention',
      'sad',
      'click',
      'ambient_jungle',
      'ambient_rocky_mountain',
      'ambient_desert',
      'ambient_ocean',
      'ambient_cave',
    ];

    for (const type of soundTypes) {
      const buffer = await this.generateSound(type);
      if (buffer) {
        this.sounds.set(type, buffer);
      }
    }
  }

  /**
   * Play a sound effect
   */
  public playSound(type: SoundType, volume: number = 1.0): void {
    if (!this.enabled || !this.audioContext || !this.masterGain) return;

    // Resume audio context if suspended (browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const buffer = this.sounds.get(type);
    if (!buffer) return;

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();

    source.buffer = buffer;
    gainNode.gain.value = volume;

    source.connect(gainNode);
    gainNode.connect(this.masterGain);

    source.start(0);
  }

  /**
   * Play ambient sound for a biome (loops)
   */
  public playAmbient(type: SoundType): void {
    if (!this.enabled || !this.audioContext || !this.ambientGain) return;

    // Stop current ambient if playing
    this.stopAmbient();

    // Resume audio context if suspended
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const buffer = this.sounds.get(type);
    if (!buffer) return;

    this.ambientSource = this.audioContext.createBufferSource();
    this.ambientSource.buffer = buffer;
    this.ambientSource.loop = true;
    this.ambientSource.connect(this.ambientGain);
    this.ambientSource.start(0);
    this.currentAmbient = type;
  }

  /**
   * Stop ambient sound
   */
  public stopAmbient(): void {
    if (this.ambientSource) {
      try {
        this.ambientSource.stop();
      } catch (e) {
        // Already stopped
      }
      this.ambientSource = null;
      this.currentAmbient = null;
    }
  }

  /**
   * Set master volume (0.0 to 1.0)
   */
  public setVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Set ambient volume (0.0 to 1.0)
   */
  public setAmbientVolume(volume: number): void {
    if (this.ambientGain) {
      this.ambientGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Enable/disable all sounds
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.stopAmbient();
    }
  }

  /**
   * Get current ambient sound type
   */
  public getCurrentAmbient(): SoundType | null {
    return this.currentAmbient;
  }
}

// Singleton instance
export const soundManager = new SoundManager();
