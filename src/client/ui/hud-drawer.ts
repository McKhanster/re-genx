import type { CreatureStats, FamiliarStats } from '../../shared/types/api';
import { StatFeedback } from './stat-feedback';
import { soundManager } from '../audio/sound-manager';

/**
 * HUDDrawer - Fighter jet style Heads-Up Display
 * 
 * Features:
 * - Minimal always-visible info at screen corners (age, countdown, karma)
 * - Detailed menu panel slides down from top when toggled
 * - Non-intrusive overlay that doesn't block the view
 */
export class HUDDrawer {
  private container!: HTMLElement;
  private menuPanel: HTMLElement | null = null;
  private menuVisible: boolean = false;

  constructor() {
    this.createHUD();
    this.attachEventListeners();
  }

  /**
   * Creates the HTML structure for the HUD
   */
  private createHUD(): void {
    this.container = document.createElement('div');
    this.container.className = 'hud-drawer';
    this.container.innerHTML = `
      <!-- Always-visible HUD overlay -->
      <div class="hud-overlay">
        <!-- Top Left - Age -->
        <div class="hud-top-left">
          <div class="hud-info-item">
            <span class="hud-info-label">Age</span>
            <span class="hud-info-value" id="age-value">0</span>
          </div>
        </div>

        <!-- Top Right - Next Cycle & Care Meter -->
        <div class="hud-top-right">
          <div class="hud-info-item">
            <span class="hud-info-label">Next Cycle</span>
            <span class="hud-info-value" id="countdown-value">--:--</span>
          </div>
          <div class="hud-info-item" id="care-meter-display">
            <span class="hud-info-label">Care</span>
            <span class="hud-info-value" id="care-meter-value">100</span>
          </div>
        </div>

        <!-- Bottom Left - Evolution Points -->
        <div class="hud-bottom-left">
          <div class="hud-info-item">
            <span class="hud-info-label">EP</span>
            <span class="hud-info-value" id="ep-value">0</span>
          </div>
        </div>

        <!-- Bottom Right - Neglect Warning (hidden by default) -->
        <div class="hud-bottom-right" id="neglect-warning" style="display: none;">
          <span class="warning-text">⚠️ NEEDS ATTENTION</span>
        </div>
      </div>

      <!-- Menu toggle button -->
      <button class="hud-menu-toggle" id="menu-toggle">
        ▼ MENU
      </button>

      <!-- Slide-down menu panel -->
      <div class="hud-menu-panel" id="menu-panel">
        <div class="hud-menu-content">
          <!-- Care Actions Section -->
          <div class="hud-menu-section hud-care-section">
            <div class="hud-menu-section-title">Care Actions</div>
            <div id="care-actions-container"></div>
          </div>

          <!-- Care Info Section -->
          <div class="hud-menu-section">
            <div class="hud-menu-section-title">Care Status</div>
            <div id="care-info-display">
              <div class="care-info-row">
                <span class="care-info-label">Care Meter:</span>
                <span class="care-info-value" id="care-meter-detail">100</span>
              </div>
              <div class="care-info-row">
                <span class="care-info-label">Evolution Points:</span>
                <span class="care-info-value" id="ep-detail">0</span>
              </div>
              <div class="care-info-row">
                <span class="care-info-label">Next Evolution:</span>
                <span class="care-info-value" id="next-evolution-detail">--:--</span>
              </div>
            </div>
          </div>

          <!-- Stats Section -->
          <div class="hud-menu-section">
            <div class="hud-menu-section-title">Familiar Stats</div>
            <div id="stats-display"></div>
          </div>

          <!-- Debug Section -->
          <div class="hud-menu-section">
            <div class="hud-menu-section-title">Debug</div>
            <button id="reset-familiar-btn" class="care-btn" style="width: 100%; margin-top: 10px;">
              🔄 Reset Familiar
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(this.container);

    this.menuPanel = document.getElementById('menu-panel');
  }

  /**
   * Attaches event listeners
   */
  private attachEventListeners(): void {
    const toggleButton = document.getElementById('menu-toggle');
    if (toggleButton) {
      toggleButton.addEventListener('click', () => this.toggleMenu());
    }

    // Prevent menu interactions from affecting the 3D scene
    if (this.menuPanel) {
      this.menuPanel.addEventListener('touchstart', (e: Event) => {
        e.stopPropagation();
      }, { passive: true });

      this.menuPanel.addEventListener('touchmove', (e: Event) => {
        e.stopPropagation();
      }, { passive: true });

      this.menuPanel.addEventListener('wheel', (e: Event) => {
        e.stopPropagation();
      }, { passive: true });
    }

    // Close menu on ESC key
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.menuVisible) {
        this.toggleMenu();
      }
    });
  }

  /**
   * Toggles the menu panel visibility
   */
  public toggleMenu(): void {
    this.menuVisible = !this.menuVisible;
    
    // Play click sound
    soundManager.playSound('click', 0.5);
    
    if (this.menuPanel) {
      this.menuPanel.classList.toggle('visible', this.menuVisible);
    }

    const toggleButton = document.getElementById('menu-toggle');
    if (toggleButton) {
      toggleButton.textContent = this.menuVisible ? '▲ CLOSE' : '▼ MENU';
    }
  }

  /**
   * Updates the age display
   */
  public updateAge(age: number): void {
    const ageElement = document.getElementById('age-value');
    if (ageElement) {
      ageElement.textContent = age.toString();
    }
  }

  /**
   * Updates the countdown timer display
   */
  public updateCountdown(timeRemaining: string): void {
    const countdownElement = document.getElementById('countdown-value');
    if (countdownElement) {
      countdownElement.textContent = timeRemaining;
    }
  }

  /**
   * Updates the care meter display
   * Shows visual warning when below 20
   */
  public updateCareMeter(careMeter: number): void {
    const careMeterValue = document.getElementById('care-meter-value');
    const careMeterDetail = document.getElementById('care-meter-detail');
    const careMeterDisplay = document.getElementById('care-meter-display');

    if (careMeterValue) {
      careMeterValue.textContent = Math.round(careMeter).toString();
    }
    if (careMeterDetail) {
      careMeterDetail.textContent = Math.round(careMeter).toString();
    }

    // Show warning styling when care meter is low
    if (careMeter < 20) {
      careMeterDisplay?.classList.add('warning');
      this.showNeglectWarning(true);
    } else {
      careMeterDisplay?.classList.remove('warning');
      this.showNeglectWarning(false);
    }
  }

  /**
   * Updates the evolution points balance display
   */
  public updateEvolutionPoints(points: number): void {
    const epValue = document.getElementById('ep-value');
    const epDetail = document.getElementById('ep-detail');
    
    if (epValue) {
      epValue.textContent = Math.round(points).toString();
    }
    if (epDetail) {
      epDetail.textContent = Math.round(points).toString();
    }
  }

  /**
   * Updates the next evolution cycle countdown
   */
  public updateNextEvolution(timeRemaining: string): void {
    const nextEvolutionDetail = document.getElementById('next-evolution-detail');
    if (nextEvolutionDetail) {
      nextEvolutionDetail.textContent = timeRemaining;
    }
  }

  /**
   * Shows or hides the neglect warning
   * Displays prominent warning when care meter is critically low
   */
  public showNeglectWarning(show: boolean): void {
    const neglectWarning = document.getElementById('neglect-warning');
    if (neglectWarning) {
      neglectWarning.style.display = show ? 'block' : 'none';
    }

    // Also show a more prominent warning overlay if care meter is very low
    if (show) {
      this.showNeglectOverlay();
    } else {
      this.hideNeglectOverlay();
    }
  }

  /**
   * Shows a prominent neglect warning overlay
   */
  private showNeglectOverlay(): void {
    // Check if overlay already exists
    let overlay = document.getElementById('neglect-overlay');
    if (overlay) return;

    overlay = document.createElement('div');
    overlay.id = 'neglect-overlay';
    overlay.className = 'neglect-overlay';
    overlay.innerHTML = `
      <div class="neglect-message">
        <div class="neglect-icon">⚠️</div>
        <div class="neglect-text">Your familiar needs attention!</div>
        <div class="neglect-subtext">Care Meter is critically low</div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  /**
   * Hides the neglect warning overlay
   */
  private hideNeglectOverlay(): void {
    const overlay = document.getElementById('neglect-overlay');
    if (overlay) {
      overlay.remove();
    }
  }

  /**
   * Updates the creature stats display with visual bars
   * Shows color-coded indicators for stat changes (green/red)
   * Displays floating numbers for stat changes
   */
  public updateStats(stats: CreatureStats | FamiliarStats, previousStats?: CreatureStats | FamiliarStats): void {
    const display = document.getElementById('stats-display');
    if (!display) return;

    // Determine which vitals stats to show based on the stats type
    const vitalsStats = 'population' in (stats.vitals as any) 
      ? ['health', 'population', 'mutationRate']
      : ['health', 'happiness', 'energy'];

    const statCategories = [
      { name: 'Mobility', key: 'mobility', stats: ['speed', 'agility', 'endurance'] },
      { name: 'Senses', key: 'senses', stats: ['vision', 'hearing', 'smell'] },
      { name: 'Survival', key: 'survival', stats: ['attack', 'defense', 'stealth'] },
      { name: 'Cognition', key: 'cognition', stats: ['intelligence', 'social', 'adaptability'] },
      { name: 'Vitals', key: 'vitals', stats: vitalsStats },
    ];

    let html = '';
    const allChanges: Record<string, number> = {};

    for (const category of statCategories) {
      html += `<div class="stat-category">`;
      html += `<h4 class="stat-category-name">${category.name}</h4>`;

      const categoryStats = stats[category.key as keyof CreatureStats] as Record<string, number>;
      const previousCategoryStats = previousStats?.[category.key as keyof CreatureStats] as Record<string, number> | undefined;

      for (const statName of category.stats) {
        const value = categoryStats[statName] || 0;
        const previousValue = previousCategoryStats?.[statName];
        const change = previousValue !== undefined ? value - previousValue : 0;
        
        // Track changes for floating feedback
        if (change !== 0) {
          allChanges[`${category.name}.${statName}`] = change;
        }
        
        // Determine change indicator
        let changeClass = '';
        let changeIndicator = '';
        if (change > 0) {
          changeClass = 'stat-increase';
          changeIndicator = `<span class="stat-change ${changeClass}">+${change.toFixed(0)}</span>`;
        } else if (change < 0) {
          changeClass = 'stat-decrease';
          changeIndicator = `<span class="stat-change ${changeClass}">${change.toFixed(0)}</span>`;
        }

        // Format stat name (capitalize first letter)
        const formattedStatName = statName.charAt(0).toUpperCase() + statName.slice(1);

        html += `
          <div class="stat-row">
            <div class="stat-info">
              <span class="stat-name">${formattedStatName}</span>
              ${changeIndicator}
            </div>
            <div class="stat-bar-container">
              <div class="stat-bar">
                <div class="stat-bar-fill ${changeClass}" style="width: ${value}%"></div>
              </div>
              <span class="stat-value">${value.toFixed(0)}</span>
            </div>
          </div>
        `;
      }

      html += `</div>`;
    }

    display.innerHTML = html;

    // Show floating stat changes if there are any
    if (Object.keys(allChanges).length > 0) {
      StatFeedback.showMultipleStatChanges(allChanges);
    }
  }

  /**
   * Removes the HUD from the DOM
   */
  public destroy(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
