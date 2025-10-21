/**
 * PrivacyDialog - Privacy consent dialog for personality reflection feature
 * 
 * Displays on first familiar creation to get user consent for analyzing
 * their public Reddit posts to influence uncontrolled mutations.
 */

export class PrivacyDialog {
  private dialog: HTMLDivElement | null = null;
  private onOptInCallback: ((optIn: boolean) => void) | null = null;
  private isVisible: boolean = false;

  constructor() {
    this.createDialog();
  }

  /**
   * Creates the privacy dialog HTML structure
   */
  private createDialog(): void {
    const dialog = document.createElement('div');
    dialog.className = 'privacy-dialog-overlay';
    dialog.innerHTML = `
      <div class="privacy-dialog">
        <div class="privacy-dialog-header">
          <h2>🔒 Privacy & Personality Reflection</h2>
        </div>
        
        <div class="privacy-dialog-content">
          <p class="privacy-intro">
            Your familiar can evolve to reflect your unique personality on Reddit!
          </p>
          
          <div class="privacy-explanation">
            <h3>How It Works:</h3>
            <ul>
              <li>✅ We analyze your <strong>public posts</strong> from the last 30 days</li>
              <li>✅ We look at which subreddits you post in (e.g., gaming, nature, tech)</li>
              <li>✅ Uncontrolled mutations are influenced by your posting patterns</li>
              <li>❌ We <strong>never</strong> track your browsing history</li>
              <li>❌ We <strong>never</strong> access private messages or data</li>
              <li>❌ We <strong>never</strong> share your data with anyone</li>
            </ul>
          </div>
          
          <div class="privacy-example">
            <p><strong>Example:</strong> If you frequently post in cat subreddits, your familiar might develop feline traits like whiskers or cat ears!</p>
          </div>
          
          <div class="privacy-note">
            <p>⚙️ You can change this preference anytime in settings.</p>
            <p>🎲 If you opt out, mutations will be completely random.</p>
          </div>
        </div>
        
        <div class="privacy-dialog-actions">
          <button id="privacy-opt-out" class="privacy-btn privacy-btn-secondary">
            Opt Out (Random Only)
          </button>
          <button id="privacy-opt-in" class="privacy-btn privacy-btn-primary">
            Opt In (Personality Reflection)
          </button>
        </div>
      </div>
    `;

    this.dialog = dialog;
    document.body.appendChild(dialog);

    // Attach event listeners
    const optInBtn = dialog.querySelector('#privacy-opt-in') as HTMLButtonElement;
    const optOutBtn = dialog.querySelector('#privacy-opt-out') as HTMLButtonElement;

    optInBtn?.addEventListener('click', () => this.handleChoice(true));
    optOutBtn?.addEventListener('click', () => this.handleChoice(false));

    // Initially hidden
    dialog.style.display = 'none';
  }

  /**
   * Shows the privacy dialog
   * @param onOptIn Callback function called when user makes a choice
   */
  public show(onOptIn: (optIn: boolean) => void): void {
    if (!this.dialog) {
      this.createDialog();
    }

    this.onOptInCallback = onOptIn;
    this.isVisible = true;

    if (this.dialog) {
      this.dialog.style.display = 'flex';
      // Add animation class
      setTimeout(() => {
        this.dialog?.classList.add('visible');
      }, 10);
    }
  }

  /**
   * Hides the privacy dialog
   */
  public hide(): void {
    if (!this.dialog) return;

    this.isVisible = false;
    this.dialog.classList.remove('visible');

    // Wait for animation to complete before hiding
    setTimeout(() => {
      if (this.dialog) {
        this.dialog.style.display = 'none';
      }
    }, 300);
  }

  /**
   * Handles user's privacy choice
   * @param optIn Whether user opted in to personality reflection
   */
  private handleChoice(optIn: boolean): void {
    if (this.onOptInCallback) {
      this.onOptInCallback(optIn);
    }
    this.hide();
  }

  /**
   * Checks if the dialog is currently visible
   */
  public get visible(): boolean {
    return this.isVisible;
  }

  /**
   * Destroys the dialog and removes it from DOM
   */
  public destroy(): void {
    if (this.dialog) {
      this.dialog.remove();
      this.dialog = null;
    }
    this.onOptInCallback = null;
    this.isVisible = false;
  }
}
