/**
 * StatFeedback - Displays floating numbers for stat changes
 * Shows color-coded stat increases/decreases that fade out over 1 second
 */
export class StatFeedback {
  /**
   * Display a floating stat change notification
   * @param statName - Name of the stat that changed
   * @param change - Amount of change (positive or negative)
   * @param position - Optional screen position (defaults to center-right)
   */
  public static showStatChange(
    statName: string,
    change: number,
    position?: { x: number; y: number }
  ): void {
    if (change === 0) return;

    const feedback = document.createElement('div');
    feedback.className = 'stat-change-feedback';

    // Determine color based on positive/negative change
    const isPositive = change > 0;
    const color = isPositive ? '#00ff88' : '#ff4444';
    const sign = isPositive ? '+' : '';

    // Format the stat name (capitalize first letter)
    const formattedStatName = statName.charAt(0).toUpperCase() + statName.slice(1);

    feedback.innerHTML = `
      <div class="stat-change-label">${formattedStatName}</div>
      <div class="stat-change-value" style="color: ${color};">${sign}${Math.round(change)}</div>
    `;

    // Position the feedback
    if (position) {
      feedback.style.left = `${position.x}px`;
      feedback.style.top = `${position.y}px`;
    } else {
      // Default position: center-right of screen
      feedback.style.left = '70%';
      feedback.style.top = '50%';
      feedback.style.transform = 'translate(-50%, -50%)';
    }

    document.body.appendChild(feedback);

    // Remove after animation completes (1 second)
    setTimeout(() => {
      feedback.remove();
    }, 1000);
  }

  /**
   * Display multiple stat changes at once
   * Stacks them vertically with slight delays
   * @param statChanges - Object mapping stat names to change amounts
   */
  public static showMultipleStatChanges(statChanges: Record<string, number>): void {
    const entries = Object.entries(statChanges).filter(([_, change]) => change !== 0);

    if (entries.length === 0) return;

    // Calculate starting position (center-right)
    const baseX = window.innerWidth * 0.7;
    const baseY = window.innerHeight * 0.5;
    const spacing = 50; // Vertical spacing between stat changes

    // Calculate offset to center the stack
    const totalHeight = (entries.length - 1) * spacing;
    const startY = baseY - totalHeight / 2;

    entries.forEach(([statName, change], index) => {
      // Slight delay for each stat to create staggered effect
      setTimeout(() => {
        this.showStatChange(statName, change, {
          x: baseX,
          y: startY + index * spacing,
        });
      }, index * 100); // 100ms delay between each stat
    });
  }

  /**
   * Display stat changes for a specific category
   * @param categoryName - Name of the stat category (e.g., "Mobility")
   * @param statChanges - Object mapping stat names to change amounts
   */
  public static showCategoryStatChanges(
    categoryName: string,
    statChanges: Record<string, number>
  ): void {
    const entries = Object.entries(statChanges).filter(([_, change]) => change !== 0);

    if (entries.length === 0) return;

    // Show category header first
    const header = document.createElement('div');
    header.className = 'stat-change-category-header';
    header.textContent = categoryName;
    header.style.left = '70%';
    header.style.top = '45%';
    header.style.transform = 'translate(-50%, -50%)';

    document.body.appendChild(header);

    setTimeout(() => {
      header.remove();
    }, 1200);

    // Then show individual stats
    setTimeout(() => {
      this.showMultipleStatChanges(statChanges);
    }, 200);
  }
}
