import type { MutationTraitOption, MutationTriggerResponse } from '../../shared/types/api';
import { soundManager } from '../audio/sound-manager';

/**
 * MutationChoiceUI - Handles controlled mutation interface
 *
 * Features:
 * - "Evolve" button that costs 100 Evolution Points
 * - Displays 3-5 trait options when mutation is triggered
 * - Shows preview of each option
 * - Allows player to select one option
 * - Shows confirmation after selection
 */
export class MutationChoiceUI {
  private container!: HTMLElement;
  private evolveButton: HTMLButtonElement | null = null;
  private optionsContainer: HTMLElement | null = null;
  private currentSessionId: string | null = null;
  private currentOptions: MutationTraitOption[] = [];
  private onTriggerCallback: (() => Promise<MutationTriggerResponse>) | null = null;
  private onChooseCallback: ((sessionId: string, optionId: string) => Promise<void>) | null = null;

  constructor() {
    this.createUI();
    this.attachEventListeners();
  }

  /**
   * Creates the HTML structure for the mutation choice UI
   */
  private createUI(): void {
    this.container = document.createElement('div');
    this.container.className = 'mutation-choice-ui';
    this.container.innerHTML = `
      <!-- Evolve Button (always visible) -->
      <div class="evolve-button-container">
        <button class="evolve-btn" id="evolve-btn">
          <span class="evolve-icon">⚡</span>
          <span class="evolve-label">Evolve</span>
          <span class="evolve-cost">100 EP</span>
        </button>
      </div>

      <!-- Trait Options Panel (hidden by default) -->
      <div class="trait-options-panel" id="trait-options-panel">
        <div class="trait-options-header">
          <h3 class="trait-options-title">Choose Your Evolution</h3>
          <p class="trait-options-subtitle">Select one trait to evolve your familiar</p>
        </div>
        <div class="trait-options-grid" id="trait-options-grid">
          <!-- Options will be dynamically inserted here -->
        </div>
        <button class="trait-cancel-btn" id="trait-cancel-btn">Cancel</button>
      </div>

      <!-- Confirmation Overlay (hidden by default) -->
      <div class="mutation-confirmation" id="mutation-confirmation">
        <div class="confirmation-content">
          <div class="confirmation-icon">✨</div>
          <div class="confirmation-text">Evolution Applied!</div>
          <div class="confirmation-subtext" id="confirmation-trait-name"></div>
        </div>
      </div>
    `;
    document.body.appendChild(this.container);

    this.evolveButton = document.getElementById('evolve-btn') as HTMLButtonElement;
    this.optionsContainer = document.getElementById('trait-options-grid');
  }

  /**
   * Attaches event listeners
   */
  private attachEventListeners(): void {
    // Evolve button click
    if (this.evolveButton) {
      this.evolveButton.addEventListener('click', () => this.handleEvolveClick());
    }

    // Cancel button click
    const cancelButton = document.getElementById('trait-cancel-btn');
    if (cancelButton) {
      cancelButton.addEventListener('click', () => this.hideTraitOptions());
    }

    // Close options panel on ESC key
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.hideTraitOptions();
      }
    });
  }

  /**
   * Sets the callback for triggering a mutation
   */
  public onTrigger(callback: () => Promise<MutationTriggerResponse>): void {
    this.onTriggerCallback = callback;
  }

  /**
   * Sets the callback for choosing a mutation option
   */
  public onChoose(callback: (sessionId: string, optionId: string) => Promise<void>): void {
    this.onChooseCallback = callback;
  }

  /**
   * Updates the evolve button state based on evolution points
   */
  public updateEvolveButton(evolutionPoints: number): void {
    if (!this.evolveButton) return;

    if (evolutionPoints < 100) {
      this.evolveButton.disabled = true;
      this.evolveButton.classList.add('insufficient-ep');
      const costElement = this.evolveButton.querySelector('.evolve-cost');
      if (costElement) {
        costElement.textContent = `${evolutionPoints}/100 EP`;
      }
    } else {
      this.evolveButton.disabled = false;
      this.evolveButton.classList.remove('insufficient-ep');
      const costElement = this.evolveButton.querySelector('.evolve-cost');
      if (costElement) {
        costElement.textContent = '100 EP';
      }
    }
  }

  /**
   * Handles the evolve button click
   */
  private async handleEvolveClick(): Promise<void> {
    if (!this.onTriggerCallback) {
      console.error('No trigger callback set');
      return;
    }

    // Play click sound
    soundManager.playSound('click', 0.5);

    try {
      // Show loading state
      if (this.evolveButton) {
        this.evolveButton.disabled = true;
        this.evolveButton.classList.add('loading');
        this.evolveButton.innerHTML = `
          <span class="evolve-icon loading-spinner-small"></span>
          <span class="evolve-label">Generating...</span>
        `;
      }

      // Call the trigger callback
      const response = await this.onTriggerCallback();

      // Store session data
      this.currentSessionId = response.sessionId;
      this.currentOptions = response.options;

      // Display trait options
      this.displayTraitOptions(response.options);
    } catch (error) {
      console.error('Failed to trigger mutation:', error);
      this.showError('Failed to trigger evolution. Please try again.');

      // Re-enable button
      if (this.evolveButton) {
        this.evolveButton.disabled = false;
        this.evolveButton.classList.remove('loading');
        const icon = '<span class="evolve-icon">⚡</span>';
        const label = '<span class="evolve-label">Evolve</span>';
        const cost = '<span class="evolve-cost">100 EP</span>';
        this.evolveButton.innerHTML = icon + label + cost;
      }
    }
  }

  /**
   * Displays the trait options panel
   */
  private displayTraitOptions(options: MutationTraitOption[]): void {
    if (!this.optionsContainer) return;

    // Clear existing options
    this.optionsContainer.innerHTML = '';

    // Create option cards
    for (const option of options) {
      const optionCard = this.createOptionCard(option);
      this.optionsContainer.appendChild(optionCard);
    }

    // Show the options panel
    const panel = document.getElementById('trait-options-panel');
    if (panel) {
      panel.classList.add('visible');
    }
  }

  /**
   * Creates an option card element
   */
  private createOptionCard(option: MutationTraitOption): HTMLElement {
    const card = document.createElement('div');
    card.className = 'trait-option-card';
    card.dataset.optionId = option.id;

    // Format the value for display
    const displayValue = this.formatOptionValue(option.value);

    card.innerHTML = `
      <div class="trait-option-preview">
        ${this.getPreviewIcon(option.category)}
      </div>
      <div class="trait-option-info">
        <div class="trait-option-label">${option.label}</div>
        <div class="trait-option-category">${this.formatCategory(option.category)}</div>
        <div class="trait-option-value">${displayValue}</div>
      </div>
      <button class="trait-select-btn" data-option-id="${option.id}">
        Select
      </button>
    `;

    // Add click handler to select button
    const selectButton = card.querySelector('.trait-select-btn') as HTMLButtonElement;
    if (selectButton) {
      selectButton.addEventListener('click', () =>
        this.handleOptionSelect(option.id, option.label)
      );
    }

    return card;
  }

  /**
   * Gets a preview icon based on the trait category
   */
  private getPreviewIcon(category: string): string {
    const icons: Record<string, string> = {
      legs: '🦵',
      color: '🎨',
      size: '📏',
      appendage: '🦾',
      pattern: '✨',
      texture: '🌟',
      eyes: '👁️',
      wings: '🦋',
      tail: '🦎',
      horns: '🦌',
      scales: '🐉',
      fur: '🐻',
      feathers: '🦅',
    };

    return `<span class="trait-preview-icon">${icons[category] || '⚡'}</span>`;
  }

  /**
   * Formats the category name for display
   */
  private formatCategory(category: string): string {
    return category
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Formats the option value for display
   */
  private formatOptionValue(value: string | number | boolean | object): string {
    if (typeof value === 'number') {
      return value.toString();
    }
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    return JSON.stringify(value);
  }

  /**
   * Handles option selection
   */
  private async handleOptionSelect(optionId: string, optionLabel: string): Promise<void> {
    if (!this.currentSessionId || !this.onChooseCallback) {
      console.error('No session or callback available');
      return;
    }

    // Play click sound
    soundManager.playSound('click', 0.5);

    try {
      // Show loading state on the entire panel
      const panel = document.getElementById('trait-options-panel');
      if (panel) {
        panel.classList.add('loading');
      }

      // Disable all select buttons
      const selectButtons = document.querySelectorAll('.trait-select-btn');
      selectButtons.forEach((btn) => {
        (btn as HTMLButtonElement).disabled = true;
        btn.textContent = 'Applying...';
      });

      // Call the choose callback
      await this.onChooseCallback(this.currentSessionId, optionId);

      // Remove loading state
      if (panel) {
        panel.classList.remove('loading');
      }

      // Hide options panel
      this.hideTraitOptions();

      // Show confirmation
      this.showConfirmation(optionLabel);

      // Reset state
      this.currentSessionId = null;
      this.currentOptions = [];

      // Re-enable evolve button
      if (this.evolveButton) {
        this.evolveButton.disabled = false;
        this.evolveButton.classList.remove('loading');
        const icon = '<span class="evolve-icon">⚡</span>';
        const label = '<span class="evolve-label">Evolve</span>';
        const cost = '<span class="evolve-cost">100 EP</span>';
        this.evolveButton.innerHTML = icon + label + cost;
      }
    } catch (error) {
      console.error('Failed to apply mutation:', error);
      this.showError('Failed to apply evolution. Please try again.');

      // Remove loading state
      const panel = document.getElementById('trait-options-panel');
      if (panel) {
        panel.classList.remove('loading');
      }

      // Re-enable select buttons
      const selectButtons = document.querySelectorAll('.trait-select-btn');
      selectButtons.forEach((btn) => {
        (btn as HTMLButtonElement).disabled = false;
        btn.textContent = 'Select';
      });
    }
  }

  /**
   * Hides the trait options panel
   */
  private hideTraitOptions(): void {
    const panel = document.getElementById('trait-options-panel');
    if (panel) {
      panel.classList.remove('visible');
    }

    // Reset state
    this.currentSessionId = null;
    this.currentOptions = [];

    // Re-enable evolve button
    if (this.evolveButton) {
      this.evolveButton.disabled = false;
      const icon = '<span class="evolve-icon">⚡</span>';
      const label = '<span class="evolve-label">Evolve</span>';
      const cost = '<span class="evolve-cost">100 EP</span>';
      this.evolveButton.innerHTML = icon + label + cost;
    }
  }

  /**
   * Shows a confirmation message
   */
  private showConfirmation(traitName: string): void {
    const confirmation = document.getElementById('mutation-confirmation');
    const traitNameElement = document.getElementById('confirmation-trait-name');

    if (confirmation && traitNameElement) {
      traitNameElement.textContent = traitName;
      confirmation.classList.add('visible');

      // Hide after 3 seconds
      setTimeout(() => {
        confirmation.classList.remove('visible');
      }, 3000);
    }
  }

  /**
   * Shows an error message
   */
  private showError(message: string): void {
    const errorElement = document.createElement('div');
    errorElement.className = 'mutation-error';
    errorElement.textContent = message;
    document.body.appendChild(errorElement);

    // Remove after 3 seconds
    setTimeout(() => {
      errorElement.remove();
    }, 3000);
  }

  /**
   * Removes the UI from the DOM
   */
  public destroy(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
