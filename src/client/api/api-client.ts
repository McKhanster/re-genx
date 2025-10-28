// ============================================================================
// API Client for Re-GenX
// Handles all client-server communication with retry logic and error handling
// ============================================================================

import type {
  FamiliarStateResponse,
  FamiliarCreateResponse,
  CareActionResponse,
  MutationTriggerResponse,
  MutationChooseRequest,
  MutationChooseResponse,
  PrivacyOptInRequest,
  PrivacyOptInResponse,
} from '../../shared/types/api';

/**
 * APIClient handles all communication with the server
 * Implements exponential backoff retry logic for resilience
 */
export class APIClient {
  private baseUrl: string;
  private maxRetries: number;

  constructor(baseUrl: string = '', maxRetries: number = 3) {
    this.baseUrl = baseUrl;
    this.maxRetries = maxRetries;
  }

  // ============================================================================
  // Core Fetch with Retry Logic
  // ============================================================================

  /**
   * Fetch with exponential backoff retry logic
   * Retries on network errors and 5xx server errors
   */
  private async fetchWithRetry(
    url: string,
    options: RequestInit = {},
    retries: number = this.maxRetries
  ): Promise<Response> {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });

        // Success - return response
        if (response.ok) {
          return response;
        }

        // Client error (4xx) - don't retry
        if (response.status >= 400 && response.status < 500) {
          const errorData = await response.json().catch(() => ({ error: response.statusText }));
          throw new Error(errorData.error || `Request failed: ${response.statusText}`);
        }

        // Server error (5xx) - retry if attempts remain
        if (response.status >= 500 && attempt < retries - 1) {
          await this.sleep(this.getBackoffDelay(attempt));
          continue;
        }

        // Last attempt failed
        throw new Error(`Server error: ${response.statusText}`);
      } catch (error) {
        // Network error or other exception
        if (attempt === retries - 1) {
          throw error;
        }
        await this.sleep(this.getBackoffDelay(attempt));
      }
    }

    throw new Error('Max retries exceeded');
  }

  /**
   * Calculate exponential backoff delay
   */
  private getBackoffDelay(attempt: number): number {
    return Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Display user-friendly error message with optional retry button
   */
  private showError(message: string, retryCallback?: () => void, hint?: string): void {
    // Create error notification
    const errorDiv = document.createElement('div');
    errorDiv.className = 'api-error-notification';
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'error-message';
    messageDiv.textContent = message;
    errorDiv.appendChild(messageDiv);
    
    // Add hint if provided
    if (hint) {
      const hintDiv = document.createElement('div');
      hintDiv.className = 'error-hint';
      hintDiv.textContent = hint;
      errorDiv.appendChild(hintDiv);
    }
    
    // Add retry button if callback provided
    if (retryCallback) {
      const retryButton = document.createElement('button');
      retryButton.className = 'error-retry-btn';
      retryButton.textContent = 'Retry';
      retryButton.onclick = () => {
        errorDiv.remove();
        retryCallback();
      };
      errorDiv.appendChild(retryButton);
    }
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.className = 'error-close-btn';
    closeButton.textContent = '×';
    closeButton.onclick = () => errorDiv.remove();
    errorDiv.appendChild(closeButton);

    document.body.appendChild(errorDiv);

    // Auto-remove after 8 seconds if no retry button
    if (!retryCallback) {
      setTimeout(() => {
        if (errorDiv.parentNode) {
          errorDiv.style.animation = 'slideUp 0.3s ease-out';
          setTimeout(() => errorDiv.remove(), 300);
        }
      }, 8000);
    }
  }

  // ============================================================================
  // Familiar Management APIs
  // ============================================================================

  /**
   * Get current familiar state
   */
  async getFamiliarState(): Promise<FamiliarStateResponse> {
    try {
      const response = await this.fetchWithRetry(`${this.baseUrl}/api/familiar/state`);
      return await response.json();
    } catch (error) {
      this.showError(
        'Failed to load familiar',
        () => window.location.reload(),
        'Check your internet connection and try refreshing the page.'
      );
      throw error;
    }
  }

  /**
   * Create a new familiar
   */
  async createFamiliar(): Promise<FamiliarCreateResponse> {
    try {
      const response = await this.fetchWithRetry(`${this.baseUrl}/api/familiar/create`, {
        method: 'POST',
      });
      return await response.json();
    } catch (error) {
      this.showError(
        'Failed to create familiar',
        () => this.createFamiliar(),
        'There was an issue creating your familiar. Please try again.'
      );
      throw error;
    }
  }

  // ============================================================================
  // Care Action APIs
  // ============================================================================

  /**
   * Feed the familiar
   */
  async feedFamiliar(): Promise<CareActionResponse> {
    try {
      const response = await this.fetchWithRetry(`${this.baseUrl}/api/care/feed`, {
        method: 'POST',
      });
      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.message.includes('cooldown')) {
        this.showError(
          'Feed action on cooldown',
          undefined,
          'You can feed your familiar every 5 minutes. Check the timer on the button.'
        );
      } else {
        this.showError(
          'Failed to feed familiar',
          () => this.feedFamiliar(),
          'There was an issue performing this action.'
        );
      }
      throw error;
    }
  }

  /**
   * Play with the familiar
   */
  async playWithFamiliar(): Promise<CareActionResponse> {
    try {
      const response = await this.fetchWithRetry(`${this.baseUrl}/api/care/play`, {
        method: 'POST',
      });
      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.message.includes('cooldown')) {
        this.showError(
          'Play action on cooldown',
          undefined,
          'You can play with your familiar every 5 minutes. Check the timer on the button.'
        );
      } else {
        this.showError(
          'Failed to play with familiar',
          () => this.playWithFamiliar(),
          'There was an issue performing this action.'
        );
      }
      throw error;
    }
  }

  /**
   * Give attention to the familiar
   */
  async giveAttention(): Promise<CareActionResponse> {
    try {
      const response = await this.fetchWithRetry(`${this.baseUrl}/api/care/attention`, {
        method: 'POST',
      });
      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.message.includes('cooldown')) {
        this.showError(
          'Attention action on cooldown',
          undefined,
          'You can give attention to your familiar every 5 minutes. Check the timer on the button.'
        );
      } else {
        this.showError(
          'Failed to give attention',
          () => this.giveAttention(),
          'There was an issue performing this action.'
        );
      }
      throw error;
    }
  }

  /**
   * Perform a care action (generic)
   */
  async performCareAction(action: 'feed' | 'play' | 'attention'): Promise<CareActionResponse> {
    switch (action) {
      case 'feed':
        return this.feedFamiliar();
      case 'play':
        return this.playWithFamiliar();
      case 'attention':
        return this.giveAttention();
      default:
        throw new Error(`Invalid care action: ${action}`);
    }
  }

  // ============================================================================
  // Mutation APIs
  // ============================================================================

  /**
   * Trigger a controlled mutation (costs 5 EP)
   */
  async triggerMutation(): Promise<MutationTriggerResponse> {
    try {
      const response = await this.fetchWithRetry(`${this.baseUrl}/api/mutation/trigger`, {
        method: 'POST',
      });
      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.message.includes('Insufficient')) {
        this.showError(
          'Not enough Evolution Points',
          undefined,
          'You need 5 EP to evolve. Care for your familiar to earn more points!'
        );
      } else {
        this.showError(
          'Failed to trigger evolution',
          () => this.triggerMutation(),
          'There was an issue starting the evolution process.'
        );
      }
      throw error;
    }
  }

  /**
   * Choose a mutation trait option
   */
  async chooseMutation(
    sessionId: string,
    optionId: string
  ): Promise<MutationChooseResponse> {
    try {
      const request: MutationChooseRequest = { sessionId, optionId };
      const response = await this.fetchWithRetry(`${this.baseUrl}/api/mutation/choose`, {
        method: 'POST',
        body: JSON.stringify(request),
      });
      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.message.includes('expired')) {
        this.showError(
          'Evolution session expired',
          () => this.triggerMutation(),
          'Your evolution choices expired after 5 minutes. Start a new evolution.'
        );
      } else {
        this.showError(
          'Failed to apply evolution',
          () => this.chooseMutation(sessionId, optionId),
          'There was an issue applying your chosen trait.'
        );
      }
      throw error;
    }
  }

  // ============================================================================
  // Privacy APIs
  // ============================================================================

  /**
   * Set privacy opt-in preference
   */
  async setPrivacyOptIn(optIn: boolean): Promise<PrivacyOptInResponse> {
    try {
      const request: PrivacyOptInRequest = { optIn };
      const response = await this.fetchWithRetry(`${this.baseUrl}/api/privacy/opt-in`, {
        method: 'POST',
        body: JSON.stringify(request),
      });
      return await response.json();
    } catch (error) {
      this.showError(
        'Failed to update privacy settings',
        () => this.setPrivacyOptIn(optIn),
        'There was an issue saving your privacy preference.'
      );
      throw error;
    }
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const apiClient = new APIClient();
