/**
 * RemovalWarning - Prominent warning system for familiar removal
 * 
 * Features:
 * - Full-screen overlay warning when care meter reaches 0
 * - Countdown timer showing hours until removal
 * - Clear call-to-action buttons
 * - Auto-update countdown
 */

export class RemovalWarning {
  private overlay: HTMLElement | null = null;
  private countdownInterval: number | null = null;
  private removalTime: number = 0;
  private onCareCallback: (() => void) | null = null;
  private onDismissCallback: (() => void) | null = null;

  /**
   * Shows the removal warning overlay
   * @param hoursRemaining - Hours until familiar is removed
   * @param onCare - Callback when user clicks "Care Now" button
   * @param onDismiss - Callback when user dismisses the warning
   */
  public show(hoursRemaining: number, onCare?: () => void, onDismiss?: () => void): void {
    if (this.overlay) {
      this.hide();
    }

    this.onCareCallback = onCare || null;
    this.onDismissCallback = onDismiss || null;
    this.removalTime = Date.now() + hoursRemaining * 60 * 60 * 1000;

    this.createOverlay(hoursRemaining);
    this.startCountdown();

    // Show with animation
    requestAnimationFrame(() => {
      if (this.overlay) {
        this.overlay.classList.add('visible');
      }
    });
  }

  /**
   * Hides the removal warning overlay
   */
  public hide(): void {
    if (!this.overlay) return;

    this.stopCountdown();

    this.overlay.classList.remove('visible');

    setTimeout(() => {
      if (this.overlay && this.overlay.parentNode) {
        this.overlay.parentNode.removeChild(this.overlay);
      }
      this.overlay = null;
    }, 300);
  }

  /**
   * Creates the overlay HTML
   */
  private createOverlay(hoursRemaining: number): void {
    this.overlay = document.createElement('div');
    this.overlay.className = 'removal-warning-overlay';
    this.overlay.innerHTML = `
      <div class="removal-warning-dialog">
        <div class="removal-warning-icon">🚨</div>
        <div class="removal-warning-title">Critical Warning!</div>
        <div class="removal-warning-message">
          Your familiar's Care Meter has reached 0
        </div>
        <div class="removal-warning-countdown" id="removal-countdown">
          ${this.formatTime(hoursRemaining)}
        </div>
        <div class="removal-warning-cta">
          Your familiar will be removed if not cared for!<br>
          Feed, play, or give attention to save your familiar.
        </div>
        <div class="removal-warning-actions">
          <button class="removal-warning-btn removal-warning-btn-primary" id="care-now-btn">
            Care Now
          </button>
          <button class="removal-warning-btn removal-warning-btn-secondary" id="dismiss-warning-btn">
            Dismiss
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(this.overlay);

    // Attach event listeners
    const careNowBtn = document.getElementById('care-now-btn');
    const dismissBtn = document.getElementById('dismiss-warning-btn');

    if (careNowBtn) {
      careNowBtn.addEventListener('click', () => {
        this.hide();
        if (this.onCareCallback) {
          this.onCareCallback();
        }
      });
    }

    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => {
        this.hide();
        if (this.onDismissCallback) {
          this.onDismissCallback();
        }
      });
    }
  }

  /**
   * Starts the countdown timer
   */
  private startCountdown(): void {
    this.stopCountdown();

    this.countdownInterval = window.setInterval(() => {
      this.updateCountdown();
    }, 1000);
  }

  /**
   * Stops the countdown timer
   */
  private stopCountdown(): void {
    if (this.countdownInterval !== null) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  /**
   * Updates the countdown display
   */
  private updateCountdown(): void {
    const countdownElement = document.getElementById('removal-countdown');
    if (!countdownElement) return;

    const now = Date.now();
    const remaining = this.removalTime - now;

    if (remaining <= 0) {
      countdownElement.textContent = '0h 0m 0s';
      this.stopCountdown();
      return;
    }

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

    countdownElement.textContent = `${hours}h ${minutes}m ${seconds}s`;
  }

  /**
   * Formats time for initial display
   */
  private formatTime(hours: number): string {
    const wholeHours = Math.floor(hours);
    const minutes = Math.floor((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m 0s`;
  }

  /**
   * Checks if warning is currently visible
   */
  public isVisible(): boolean {
    return this.overlay !== null && this.overlay.classList.contains('visible');
  }

  /**
   * Destroys the removal warning system
   */
  public destroy(): void {
    this.hide();
  }
}

// Export singleton instance
export const removalWarning = new RemovalWarning();
