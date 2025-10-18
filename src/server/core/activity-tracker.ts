import { RedisClient } from '@devvit/web/server';

/**
 * ActivityPattern represents a user's posting behavior
 */
export interface ActivityPattern {
  categories: Record<string, number>;
  dominantCategory: string;
  lastUpdated: number;
}

/**
 * ActivityTracker - Privacy-compliant tracking of user's Reddit posting activity
 *
 * PRIVACY RULES:
 * - Only analyzes PUBLIC posts with explicit user opt-in
 * - Never tracks subreddit visits or browsing history
 * - Never profiles users for personal characteristics
 * - Allows users to opt-out at any time
 * - Clears all data immediately on opt-out
 */
export class ActivityTracker {
  constructor(
    private redis: RedisClient,
    private reddit: any // Reddit API from Devvit
  ) {}

  /**
   * Update activity pattern by analyzing user's public posts from last 30 days
   * Only runs if user has opted in to privacy setting
   */
  async updateActivityPattern(userId: string): Promise<void> {
    // Check if user has opted in
    const familiarId = `familiar:${userId}`;
    const familiarData = await this.redis.hGetAll(familiarId);

    if (!familiarData || familiarData.privacyOptIn !== 'true') {
      return; // User has not opted in, skip tracking
    }

    try {
      // Get user's public posts from last 30 days
      const posts = await this.reddit.getPostsByUser({
        username: userId,
        timeframe: 'month',
        limit: 100,
      });

      // Categorize posts by subreddit type
      const categories = await this.categorizePostsBySubreddit(posts);

      // Store pattern in Redis with 30-day TTL
      const patternKey = `activity:${userId}`;
      await this.redis.hSet(patternKey, {
        categories: JSON.stringify(categories),
        lastUpdated: Date.now().toString(),
      });
      await this.redis.expire(patternKey, 30 * 24 * 60 * 60); // 30 days
    } catch (error) {
      console.error('Failed to update activity pattern:', error);
      // Fail silently - don't break the game if Reddit API fails
    }
  }

  /**
   * Categorize posts by subreddit type
   * Maps subreddits to categories: animals, tech, gaming, nature, art, science
   */
  private async categorizePostsBySubreddit(
    posts: Array<{ subreddit: string }>
  ): Promise<Record<string, number>> {
    const categories: Record<string, number> = {};

    for (const post of posts) {
      const category = this.getSubredditCategory(post.subreddit);
      categories[category] = (categories[category] || 0) + 1;
    }

    return categories;
  }

  /**
   * Get activity pattern for a user
   * Returns pattern if available and user has opted in, otherwise returns default
   */
  async getActivityPattern(userId: string): Promise<ActivityPattern> {
    try {
      // Check if user has opted in
      const familiarId = `familiar:${userId}`;
      const familiarData = await this.redis.hGetAll(familiarId);

      if (!familiarData || familiarData.privacyOptIn !== 'true') {
        return {
          categories: {},
          dominantCategory: 'general',
          lastUpdated: 0,
        };
      }

      // Get stored pattern
      const patternKey = `activity:${userId}`;
      const patternData = await this.redis.hGetAll(patternKey);

      if (!patternData || Object.keys(patternData).length === 0) {
        return {
          categories: {},
          dominantCategory: 'general',
          lastUpdated: 0,
        };
      }

      const categories = JSON.parse(patternData.categories || '{}');
      const dominantCategory = this.getDominantCategory(categories);

      return {
        categories,
        dominantCategory,
        lastUpdated: parseInt(patternData.lastUpdated || '0'),
      };
    } catch (error) {
      console.error('Failed to get activity pattern:', error);
      return {
        categories: {},
        dominantCategory: 'general',
        lastUpdated: 0,
      };
    }
  }

  /**
   * Set privacy opt-in preference for a user
   * If opting out, clears all stored activity data
   */
  async setPrivacyOptIn(userId: string, optIn: boolean): Promise<void> {
    try {
      const familiarId = `familiar:${userId}`;

      // Update opt-in status
      await this.redis.hSet(familiarId, {
        privacyOptIn: optIn.toString(),
      });

      // If opting out, clear all activity data
      if (!optIn) {
        const patternKey = `activity:${userId}`;
        await this.redis.del(patternKey);
      }
    } catch (error) {
      console.error('Failed to set privacy opt-in:', error);
      throw new Error('Failed to update privacy preference');
    }
  }

  /**
   * Calculate dominant category from post frequency
   * Returns the category with the most posts
   */
  private getDominantCategory(categories: Record<string, number>): string {
    let maxCount = 0;
    let dominant = 'general';

    for (const [category, count] of Object.entries(categories)) {
      if (count > maxCount) {
        maxCount = count;
        dominant = category;
      }
    }

    return dominant;
  }

  /**
   * Map subreddit name to category
   * Uses keyword matching to categorize subreddits
   */
  private getSubredditCategory(subreddit: string): string {
    const categoryMap: Record<string, string[]> = {
      animals: ['cats', 'dogs', 'aww', 'animals', 'pets', 'birbs', 'rabbits', 'cat', 'dog', 'pet'],
      gaming: ['gaming', 'games', 'pcgaming', 'xbox', 'playstation', 'nintendo', 'game'],
      tech: ['programming', 'technology', 'coding', 'webdev', 'machinelearning', 'tech', 'code'],
      nature: ['nature', 'earthporn', 'hiking', 'outdoors', 'camping', 'hike', 'outdoor'],
      art: ['art', 'drawing', 'painting', 'design', 'photography', 'draw', 'paint'],
      science: ['science', 'space', 'physics', 'biology', 'chemistry', 'astronomy'],
    };

    const lowerSubreddit = subreddit.toLowerCase();
    for (const [category, keywords] of Object.entries(categoryMap)) {
      if (keywords.some((kw) => lowerSubreddit.includes(kw))) {
        return category;
      }
    }

    return 'general';
  }
}
