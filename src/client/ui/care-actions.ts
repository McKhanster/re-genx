/**
 * CareActionUI - Handles care action buttons and cooldown management
 */

import { soundManager } from '../audio/sound-manager';

export interface CareActionResult {
  careMeter: number;
  evolutionPoints: number;
  careMeterIncrease: number;
  evolutionPointsGained: number;
}

export type CareActionType = 'feed' | 'play' | 'attention';

export class CareActionUI {
  private feedButton: HTMLButtonElement;
  private playButton: HTMLButtonElement;
  private attentionButton: HTMLButtonElement;
  private cooldowns: Map<CareActionType, number> = new Map();
  private cooldownIntervals: Map<CareActionType, number> = new Map();
  private onCareAction?: (
    action: CareActionType,
    result: CareActionResult
  ) => void;
  private onTriggerAnimation?: (action: CareActionType) => void;

  constructor() {
    this.createButtons();
    this.feedButton = document.getElementById('feed-btn') as HTMLButtonElement;
    this.playButton = document.getElementById('play-btn') as HTMLButtonElement;
    this.attentionButton = document.getElementById(
      'attention-btn'
    ) as HTMLButtonElement;
    this.attachEventListeners();
  }

  /**
   * Set callback for when care actions are performed
   */
  public onAction(
    callback: (action: CareActionType, result: CareActionResult) => void
  ): void {
    this.onCareAction = callback;
  }

  /**
   * Set callback for triggering familiar animations
   */
  public onAnimationTrigger(callback: (action: CareActionType) => void): void {
    this.onTriggerAnimation = callback;
  }

  private createButtons(): void {
    // Find the care actions container in the HUD drawer
    const container = document.getElementById('care-actions-container');
    if (!container) {
      console.error('Care actions container not found in HUD drawer');
      return;
    }

    container.className = 'care-actions';
    container.innerHTML = `
      <button id="feed-btn" class="care-btn">
        <span class="icon">🍖</span>
        <span class="label">Feed</span>
        <span class="reward">+15 Care, +10 EP</span>
      </button>
      <button id="play-btn" class="care-btn">
        <span class="icon">🎾</span>
        <span class="label">Play</span>
        <span class="reward">+10 Care, +15 EP</span>
      </button>
      <button id="attention-btn" class="care-btn">
        <span class="icon">💚</span>
        <span class="label">Attention</span>
        <span class="reward">+5 Care, +5 EP</span>
      </button>
    `;
  }

  private attachEventListeners(): void {
    this.feedButton.addEventListener('click', () =>
      this.handleCareAction('feed')
    );
    this.playButton.addEventListener('click', () =>
      this.handleCareAction('play')
    );
    this.attentionButton.addEventListener('click', () =>
      this.handleCareAction('attention')
    );
  }

  private async handleCareAction(action: CareActionType): Promise<void> {
    if (this.isOnCooldown(action)) {
      this.showCooldownMessage(action);
      return;
    }

    const button = this.getButtonForAction(action);
    
    try {
      // Show loading state
      button.classList.add('loading');
      button.disabled = true;

      const response = await fetch(`/api/care/${action}`, { method: 'POST' });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to perform care action');
      }

      const data: CareActionResult = await response.json();

      // Remove loading state
      button.classList.remove('loading');

      // Set cooldown (5 minutes)
      this.setCooldown(action, 5 * 60 * 1000);

      // Play sound effect for care action
      soundManager.playSound(action, 0.7);

      // Show feedback animations
      this.showFeedback(data.careMeterIncrease, data.evolutionPointsGained);

      // Trigger visual feedback on button
      this.showButtonFeedback(action);

      // Trigger familiar animation
      if (this.onTriggerAnimation) {
        this.onTriggerAnimation(action);
      }

      // Trigger callback if set
      if (this.onCareAction) {
        this.onCareAction(action, data);
      }
    } catch (error) {
      console.error(`Care action ${action} failed:`, error);
      
      // Remove loading state on error
      button.classList.remove('loading');
      button.disabled = false;
      
      this.showError(
        error instanceof Error ? error.message : 'Failed to perform action'
      );
    }
  }

  private isOnCooldown(action: CareActionType): boolean {
    const cooldownEnd = this.cooldowns.get(action);
    return cooldownEnd ? Date.now() < cooldownEnd : false;
  }

  private setCooldown(action: CareActionType, durationMs: number): void {
    this.cooldowns.set(action, Date.now() + durationMs);
    this.updateButtonCooldown(action);
  }

  private updateButtonCooldown(action: CareActionType): void {
    const button = this.getButtonForAction(action);
    button.disabled = true;
    button.classList.add('cooldown');

    // Clear any existing interval
    const existingInterval = this.cooldownIntervals.get(action);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    // Update countdown every second
    const interval = window.setInterval(() => {
      const cooldownEnd = this.cooldowns.get(action);
      if (!cooldownEnd) {
        clearInterval(interval);
        return;
      }

      const remaining = cooldownEnd - Date.now();
      if (remaining <= 0) {
        clearInterval(interval);
        this.cooldownIntervals.delete(action);
        button.disabled = false;
        button.classList.remove('cooldown');
        // Restore original label
        this.restoreButtonLabel(action);
      } else {
        const seconds = Math.ceil(remaining / 1000);
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        const labelElement = button.querySelector('.label');
        if (labelElement) {
          labelElement.textContent = `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
      }
    }, 1000);

    this.cooldownIntervals.set(action, interval);
  }

  private getButtonForAction(action: CareActionType): HTMLButtonElement {
    switch (action) {
      case 'feed':
        return this.feedButton;
      case 'play':
        return this.playButton;
      case 'attention':
        return this.attentionButton;
    }
  }

  private restoreButtonLabel(action: CareActionType): void {
    const button = this.getButtonForAction(action);
    const labelElement = button.querySelector('.label');
    if (labelElement) {
      switch (action) {
        case 'feed':
          labelElement.textContent = 'Feed';
          break;
        case 'play':
          labelElement.textContent = 'Play';
          break;
        case 'attention':
          labelElement.textContent = 'Attention';
          break;
      }
    }
  }

  private showCooldownMessage(action: CareActionType): void {
    const cooldownEnd = this.cooldowns.get(action);
    if (!cooldownEnd) return;

    const remaining = Math.ceil((cooldownEnd - Date.now()) / 1000);
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;

    this.showError(
      `${action.charAt(0).toUpperCase() + action.slice(1)} is on cooldown. Wait ${minutes}:${seconds.toString().padStart(2, '0')}`
    );
  }

  private showFeedback(careMeterIncrease: number, epGained: number): void {
    const feedback = document.createElement('div');
    feedback.className = 'care-feedback';
    feedback.innerHTML = `
      <div class="care-increase">+${careMeterIncrease} Care</div>
      <div class="ep-increase">+${epGained} EP</div>
    `;
    document.body.appendChild(feedback);

    // Remove after animation completes
    setTimeout(() => feedback.remove(), 2000);
  }

  private showButtonFeedback(action: CareActionType): void {
    const button = this.getButtonForAction(action);
    
    // Add pulse animation class
    button.style.animation = 'none';
    // Force reflow to restart animation
    void button.offsetWidth;
    button.style.animation = 'buttonPulse 0.3s ease-out';
    
    setTimeout(() => {
      button.style.animation = '';
    }, 300);
  }

  private showError(message: string): void {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'care-error';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);

    setTimeout(() => errorDiv.remove(), 3000);
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    // Clear all intervals
    this.cooldownIntervals.forEach((interval) => clearInterval(interval));
    this.cooldownIntervals.clear();
    this.cooldowns.clear();
  }
}
