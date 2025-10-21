/**
 * RateLimiter class for tracking and limiting API requests per user
 * Implements in-memory request tracking with sliding window algorithm
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  /**
   * @param maxRequests Maximum number of requests allowed per window
   * @param windowMs Time window in milliseconds (default: 60000 = 1 minute)
   */
  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if a user has exceeded the rate limit
   * @param userId User identifier
   * @returns true if rate limit exceeded, false otherwise
   */
  isRateLimited(userId: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];

    // Remove requests outside the current window
    const validRequests = userRequests.filter((timestamp) => now - timestamp < this.windowMs);

    // Update the stored requests
    this.requests.set(userId, validRequests);

    // Check if limit exceeded
    return validRequests.length >= this.maxRequests;
  }

  /**
   * Record a request for a user
   * @param userId User identifier
   */
  recordRequest(userId: string): void {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];

    // Add current request
    userRequests.push(now);

    // Store updated requests
    this.requests.set(userId, userRequests);
  }

  /**
   * Get remaining requests for a user
   * @param userId User identifier
   * @returns Number of requests remaining in current window
   */
  getRemainingRequests(userId: string): number {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];

    // Count valid requests in current window
    const validRequests = userRequests.filter((timestamp) => now - timestamp < this.windowMs);

    return Math.max(0, this.maxRequests - validRequests.length);
  }

  /**
   * Get time until rate limit resets for a user
   * @param userId User identifier
   * @returns Milliseconds until oldest request expires, or 0 if not rate limited
   */
  getResetTime(userId: string): number {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];

    if (userRequests.length === 0) {
      return 0;
    }

    // Find oldest request in current window
    const validRequests = userRequests.filter((timestamp) => now - timestamp < this.windowMs);

    if (validRequests.length < this.maxRequests) {
      return 0;
    }

    // Time until oldest request expires
    const oldestRequest = Math.min(...validRequests);
    return this.windowMs - (now - oldestRequest);
  }

  /**
   * Clear all rate limit data for a user
   * @param userId User identifier
   */
  clearUser(userId: string): void {
    this.requests.delete(userId);
  }

  /**
   * Clear all rate limit data
   */
  clearAll(): void {
    this.requests.clear();
  }

  /**
   * Clean up expired requests for all users
   * Should be called periodically to prevent memory leaks
   */
  cleanup(): void {
    const now = Date.now();

    for (const [userId, timestamps] of this.requests.entries()) {
      const validRequests = timestamps.filter((timestamp) => now - timestamp < this.windowMs);

      if (validRequests.length === 0) {
        this.requests.delete(userId);
      } else {
        this.requests.set(userId, validRequests);
      }
    }
  }
}
