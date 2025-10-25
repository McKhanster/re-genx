/**
 * Performance monitoring system that tracks frame rate and adaptively adjusts
 * visual quality to maintain target FPS.
 */

export type EffectName = 'foregroundParallax' | 'plasmaAnimation' | 'bloomIntensity';

export interface EffectSettings {
  bloomIntensity: number;
  plasmaSpeed: number;
  foregroundEnabled: boolean;
}

interface PerformanceMetrics {
  currentFPS: number;
  averageFPS: number;
  frameTime: number;
  qualityLevel: number; // 0-1
  enabledEffects: Set<EffectName>;
  lastAdjustmentTime: number;
}

export class PerformanceMonitor {
  private targetFPS: number;
  private frameCount: number = 0;
  private lastFrameTime: number = performance.now();
  private frameTimes: number[] = [];
  private readonly maxFrameTimeSamples = 5;
  private readonly measurementInterval = 60; // Measure every 60 frames
  
  private metrics: PerformanceMetrics = {
    currentFPS: 60,
    averageFPS: 60,
    frameTime: 16.67,
    qualityLevel: 1.0,
    enabledEffects: new Set(['foregroundParallax', 'plasmaAnimation', 'bloomIntensity']),
    lastAdjustmentTime: 0,
  };
  
  // Effect priority order (first to disable)
  private readonly effectPriority: EffectName[] = [
    'foregroundParallax',
    'plasmaAnimation',
    'bloomIntensity',
  ];
  
  private goodPerformanceFrames: number = 0;
  private readonly goodPerformanceThreshold = 5 * 60; // 5 seconds at 60fps
  
  constructor(targetFPS: number = 30) {
    this.targetFPS = targetFPS;
  }
  
  /**
   * Update performance metrics with current frame time
   */
  public update(_deltaTime: number): void {
    this.frameCount++;
    
    // Measure frame time every 60 frames
    if (this.frameCount >= this.measurementInterval) {
      const currentTime = performance.now();
      const elapsed = currentTime - this.lastFrameTime;
      const frameTime = elapsed / this.measurementInterval;
      
      // Add to rolling average
      this.frameTimes.push(frameTime);
      if (this.frameTimes.length > this.maxFrameTimeSamples) {
        this.frameTimes.shift();
      }
      
      // Calculate average frame time and FPS
      const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
      this.metrics.frameTime = avgFrameTime;
      this.metrics.currentFPS = 1000 / frameTime;
      this.metrics.averageFPS = 1000 / avgFrameTime;
      
      // Update quality level based on average FPS
      this.updateQualityLevel();
      
      // Reset counters
      this.frameCount = 0;
      this.lastFrameTime = currentTime;
    }
  }
  
  /**
   * Update quality level and adjust effects based on performance
   */
  private updateQualityLevel(): void {
    const avgFPS = this.metrics.averageFPS;
    const currentTime = performance.now();
    
    // Check if performance is below target
    if (avgFPS < this.targetFPS) {
      // Disable effects in priority order
      this.disableNextEffect();
      this.metrics.lastAdjustmentTime = currentTime;
      this.goodPerformanceFrames = 0;
    }
    // Check if performance has recovered
    else if (avgFPS > this.targetFPS + 5) {
      this.goodPerformanceFrames++;
      
      // Re-enable effects after 5 seconds of good performance
      if (this.goodPerformanceFrames >= this.goodPerformanceThreshold) {
        this.enableNextEffect();
        this.metrics.lastAdjustmentTime = currentTime;
        this.goodPerformanceFrames = 0;
      }
    } else {
      // Performance is stable, reset good performance counter
      this.goodPerformanceFrames = 0;
    }
    
    // Calculate quality level (0-1) based on enabled effects
    const totalEffects = this.effectPriority.length;
    const enabledCount = this.metrics.enabledEffects.size;
    this.metrics.qualityLevel = enabledCount / totalEffects;
  }
  
  /**
   * Disable the next effect in priority order
   */
  private disableNextEffect(): void {
    for (const effect of this.effectPriority) {
      if (this.metrics.enabledEffects.has(effect)) {
        this.metrics.enabledEffects.delete(effect);
        console.warn(`Performance: Disabled ${effect} (FPS: ${this.metrics.averageFPS.toFixed(1)})`);
        break;
      }
    }
  }
  
  /**
   * Re-enable the next effect in reverse priority order
   */
  private enableNextEffect(): void {
    for (let i = this.effectPriority.length - 1; i >= 0; i--) {
      const effect = this.effectPriority[i];
      if (effect && !this.metrics.enabledEffects.has(effect)) {
        this.metrics.enabledEffects.add(effect);
        console.log(`Performance: Enabled ${effect} (FPS: ${this.metrics.averageFPS.toFixed(1)})`);
        break;
      }
    }
  }
  
  /**
   * Get current quality level (0-1)
   */
  public getQualityLevel(): number {
    return this.metrics.qualityLevel;
  }
  
  /**
   * Check if a specific effect should be enabled
   */
  public shouldEnableEffect(effectName: EffectName): boolean {
    return this.metrics.enabledEffects.has(effectName);
  }
  
  /**
   * Get recommended effect settings based on current performance
   */
  public getEffectSettings(): EffectSettings {
    const bloomEnabled = this.metrics.enabledEffects.has('bloomIntensity');
    const plasmaEnabled = this.metrics.enabledEffects.has('plasmaAnimation');
    const foregroundEnabled = this.metrics.enabledEffects.has('foregroundParallax');
    
    return {
      bloomIntensity: bloomEnabled ? 2.0 : 1.0,
      plasmaSpeed: plasmaEnabled ? 1.0 : 0.5,
      foregroundEnabled,
    };
  }
  
  /**
   * Get current performance metrics (for debugging)
   */
  public getMetrics(): Readonly<PerformanceMetrics> {
    return { ...this.metrics };
  }
  
  /**
   * Manually set which effects are enabled (for testing or user preferences)
   */
  public setEnabledEffects(effects: EffectName[]): void {
    this.metrics.enabledEffects = new Set(effects);
    this.metrics.qualityLevel = effects.length / this.effectPriority.length;
  }
  
  /**
   * Reset performance monitoring
   */
  public reset(): void {
    this.frameCount = 0;
    this.lastFrameTime = performance.now();
    this.frameTimes = [];
    this.goodPerformanceFrames = 0;
    this.metrics = {
      currentFPS: 60,
      averageFPS: 60,
      frameTime: 16.67,
      qualityLevel: 1.0,
      enabledEffects: new Set(['foregroundParallax', 'plasmaAnimation', 'bloomIntensity']),
      lastAdjustmentTime: 0,
    };
  }
}
