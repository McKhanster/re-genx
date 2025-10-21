/**
 * NotificationSystem - Toast notification system for mutations and care events
 *
 * Features:
 * - Toast notifications for uncontrolled mutations
 * - Toast notifications for controlled mutations
 * - Toast notifications for care meter warnings
 * - Auto-dismiss after 5 seconds
 * - Stack multiple notifications
 */

export interface NotificationOptions {
  type: 'mutation' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  duration?: number; // milliseconds, default 5000
  icon?: string;
}

export class NotificationSystem {
  private container!: HTMLElement;
  private notifications: Map<string, HTMLElement> = new Map();
  private notificationCount: number = 0;

  constructor() {
    this.createContainer();
  }

  /**
   * Creates the notification container
   */
  private createContainer(): void {
    this.container = document.createElement('div');
    this.container.className = 'notification-container';
    document.body.appendChild(this.container);
  }

  /**
   * Shows a notification toast
   */
  public show(options: NotificationOptions): string {
    const id = `notification-${++this.notificationCount}`;
    const duration = options.duration || 5000;

    const notification = document.createElement('div');
    notification.className = `notification notification-${options.type}`;
    notification.id = id;

    const icon = options.icon || this.getDefaultIcon(options.type);

    notification.innerHTML = `
      <div class="notification-icon">${icon}</div>
      <div class="notification-content">
        <div class="notification-title">${options.title}</div>
        <div class="notification-message">${options.message}</div>
      </div>
      <button class="notification-close" aria-label="Close notification">×</button>
    `;

    // Add close button handler
    const closeButton = notification.querySelector('.notification-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => this.dismiss(id));
    }

    // Add to container
    this.container.appendChild(notification);
    this.notifications.set(id, notification);

    // Trigger animation
    requestAnimationFrame(() => {
      notification.classList.add('visible');
    });

    // Auto-dismiss after duration
    setTimeout(() => {
      this.dismiss(id);
    }, duration);

    return id;
  }

  /**
   * Dismisses a notification
   */
  public dismiss(id: string): void {
    const notification = this.notifications.get(id);
    if (!notification) return;

    notification.classList.remove('visible');
    notification.classList.add('dismissing');

    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
      this.notifications.delete(id);
    }, 300);
  }

  /**
   * Shows a mutation notification
   */
  public showMutationNotification(
    mutationType: string,
    statChanges: Record<string, number>
  ): string {
    const statChangeText = Object.entries(statChanges)
      .map(([stat, change]) => {
        const sign = change > 0 ? '+' : '';
        return `${stat}: ${sign}${change.toFixed(0)}`;
      })
      .join(', ');

    return this.show({
      type: 'mutation',
      title: '🧬 Mutation Occurred!',
      message: `${mutationType} mutation applied. ${statChangeText}`,
      icon: '🧬',
      duration: 6000,
    });
  }

  /**
   * Shows a controlled mutation completion notification
   */
  public showControlledMutationNotification(
    traitLabel: string,
    statChanges: Record<string, number>
  ): string {
    const statChangeText = Object.entries(statChanges)
      .map(([stat, change]) => {
        const sign = change > 0 ? '+' : '';
        return `${stat}: ${sign}${change.toFixed(0)}`;
      })
      .join(', ');

    return this.show({
      type: 'success',
      title: '✨ Evolution Complete!',
      message: `${traitLabel} trait applied. ${statChangeText}`,
      icon: '✨',
      duration: 6000,
    });
  }

  /**
   * Shows a care meter warning notification
   */
  public showCareMeterWarning(careMeter: number): string {
    return this.show({
      type: 'warning',
      title: '⚠️ Care Meter Low!',
      message: `Your familiar needs attention! Care Meter: ${Math.round(careMeter)}`,
      icon: '⚠️',
      duration: 7000,
    });
  }

  /**
   * Shows a removal warning notification
   */
  public showRemovalWarning(hoursRemaining: number): string {
    return this.show({
      type: 'error',
      title: '🚨 Removal Warning!',
      message: `Familiar will be removed in ${hoursRemaining} hours if not cared for!`,
      icon: '🚨',
      duration: 10000,
    });
  }

  /**
   * Gets default icon for notification type
   */
  private getDefaultIcon(type: string): string {
    switch (type) {
      case 'mutation':
        return '🧬';
      case 'warning':
        return '⚠️';
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      default:
        return 'ℹ️';
    }
  }

  /**
   * Clears all notifications
   */
  public clearAll(): void {
    for (const id of this.notifications.keys()) {
      this.dismiss(id);
    }
  }

  /**
   * Destroys the notification system
   */
  public destroy(): void {
    this.clearAll();
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}

// Export singleton instance
export const notificationSystem = new NotificationSystem();
