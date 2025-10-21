import { Request, Response, NextFunction } from 'express';
import { RateLimiter } from '../utils/rate-limiter';
import { reddit } from '@devvit/web/server';

/**
 * Rate limiting middleware for API endpoints
 * Limits requests to 100 per minute per user
 */
export class RateLimitMiddleware {
  private rateLimiter: RateLimiter;

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.rateLimiter = new RateLimiter(maxRequests, windowMs);

    // Cleanup expired requests every 5 minutes
    setInterval(() => {
      this.rateLimiter.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Express middleware function for rate limiting
   */
  middleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get username from Reddit context
      const username = await reddit.getCurrentUsername();

      // If no username, allow request (will be handled by auth check in route)
      if (!username) {
        next();
        return;
      }

      // Check if user is rate limited
      if (this.rateLimiter.isRateLimited(username)) {
        const resetTime = this.rateLimiter.getResetTime(username);
        const resetSeconds = Math.ceil(resetTime / 1000);

        res.status(429).json({
          error: 'Too many requests. Please try again later.',
          retryAfter: resetSeconds,
        });
        return;
      }

      // Record the request
      this.rateLimiter.recordRequest(username);

      // Add rate limit info to response headers
      const remaining = this.rateLimiter.getRemainingRequests(username);
      res.setHeader('X-RateLimit-Limit', '100');
      res.setHeader('X-RateLimit-Remaining', remaining.toString());

      next();
    } catch (error) {
      console.error('Rate limit middleware error:', error);
      // On error, allow request to proceed
      next();
    }
  };

  /**
   * Get the rate limiter instance (for testing or manual operations)
   */
  getRateLimiter(): RateLimiter {
    return this.rateLimiter;
  }
}
