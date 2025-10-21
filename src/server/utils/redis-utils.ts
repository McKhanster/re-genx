/**
 * Redis utility functions for safe operations with retry logic
 * 
 * This module provides a centralized retry wrapper for all Redis operations
 * to ensure data persistence reliability across the application.
 */

/**
 * Safe Redis operation wrapper with exponential backoff retry logic
 * 
 * Executes a Redis operation with automatic retry on failure.
 * Uses exponential backoff: 1s, 2s, 4s between retries.
 * 
 * @param operation - Redis operation to execute (async function)
 * @param fallback - Fallback value to return if all retries fail
 * @param retries - Number of retry attempts (default: 3)
 * @returns Operation result or fallback value
 * 
 * @example
 * ```typescript
 * const value = await safeRedisOperation(
 *   () => redis.get('mykey'),
 *   null,
 *   3
 * );
 * ```
 */
export async function safeRedisOperation<T>(
  operation: () => Promise<T>,
  fallback: T,
  retries: number = 3
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error) {
      console.error(`Redis operation failed (attempt ${i + 1}/${retries}):`, error);
      
      // If this was the last retry, log failure and return fallback
      if (i === retries - 1) {
        console.error('All Redis retry attempts exhausted. Using fallback value.');
        return fallback;
      }
      
      // Exponential backoff: 2^i * 1000ms (1s, 2s, 4s)
      const backoffMs = Math.pow(2, i) * 1000;
      console.log(`Retrying in ${backoffMs}ms...`);
      await sleep(backoffMs);
    }
  }
  
  // This should never be reached, but TypeScript requires it
  return fallback;
}

/**
 * Sleep utility for exponential backoff
 * 
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after the specified time
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
