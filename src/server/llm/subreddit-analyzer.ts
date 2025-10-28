

// ============================================================================
// Theme Mapping Interface
// ============================================================================

export interface SubredditTheme {
  name: string;
  keywords: string[];
  description: string;
}

// ============================================================================
// Subreddit Analyzer Class
// ============================================================================

export class SubredditAnalyzer {
  private static readonly THEMES: SubredditTheme[] = [
    {
      name: 'space',
      keywords: ['space', 'nasa', 'astronomy', 'cosmos', 'universe', 'galaxy', 'planet', 'moon', 'mars', 'stars', 'nebula', 'astronaut', 'spaceflight'],
      description: 'Space exploration and astronomical themes'
    },
    {
      name: 'ocean',
      keywords: ['ocean', 'sea', 'aquarium', 'marine', 'fish', 'coral', 'whale', 'shark', 'deepsea', 'nautical', 'maritime', 'underwater'],
      description: 'Ocean exploration and marine life themes'
    },
    {
      name: 'tech',
      keywords: ['tech', 'technology', 'programming', 'coding', 'computer', 'ai', 'robot', 'cyber', 'digital', 'gadget', 'software', 'hardware'],
      description: 'Technology and computing themes'
    },
    {
      name: 'nature',
      keywords: ['nature', 'forest', 'mountain', 'river', 'wildlife', 'animal', 'plant', 'earth', 'environment', 'outdoor', 'adventure', 'hiking'],
      description: 'Nature and wildlife themes'
    },
    {
      name: 'art',
      keywords: ['art', 'drawing', 'painting', 'design', 'creative', 'photography', 'illustration', 'digitalart', 'artist', 'sketch', 'canvas'],
      description: 'Art and creative expression themes'
    },
    {
      name: 'gaming',
      keywords: ['game', 'gaming', 'gamer', 'esports', 'rpg', 'pcgaming', 'indiegames', 'retrogaming', 'pixelart', 'console', 'steam'],
      description: 'Gaming and interactive entertainment themes'
    },
    {
      name: 'music',
      keywords: ['music', 'band', 'song', 'musician', 'instrument', 'concert', 'melody', 'sound', 'audio', 'electronic', 'folk', 'rock'],
      description: 'Music and auditory creativity themes'
    },
    {
      name: 'science',
      keywords: ['science', 'physics', 'chemistry', 'biology', 'research', 'experiment', 'laboratory', 'scientific', 'discovery', 'innovation'],
      description: 'Scientific discovery and research themes'
    },
    {
      name: 'fantasy',
      keywords: ['fantasy', 'magic', 'mythical', 'dragon', 'wizard', 'fairy', 'medieval', 'rpg', 'adventure', 'quest', 'creature'],
      description: 'Fantasy and mythical themes'
    },
    {
      name: 'sports',
      keywords: ['sports', 'fitness', 'athlete', 'team', 'game', 'competition', 'training', 'workout', 'basketball', 'football', 'soccer'],
      description: 'Sports and athletic themes'
    }
  ];

  private redis: any; // Redis client injected via constructor

  constructor(redis: any) {
    this.redis = redis;
  }

  /**
   * Detect theme from subreddit name using keyword matching
   * @param subredditName - Name of the subreddit (e.g., 'space', 'ocean', 'technology')
   * @returns Promise<string> - Detected theme name or 'general' as fallback
   */
  async detectTheme(subredditName: string): Promise<string> {
    try {
      // Convert to lowercase for case-insensitive matching
      const normalizedName = subredditName.toLowerCase().replace('r/', '').replace('/', '');

      // Check cache first
      const cacheKey = `subreddit:theme:${normalizedName}`;
      const cachedTheme = await this.redis.get(cacheKey);

      if (cachedTheme) {
        console.log(`[SubredditAnalyzer] Cache hit for r/${normalizedName}: ${cachedTheme}`);
        return cachedTheme;
      }

      // Perform keyword matching
      const detectedTheme = this.matchKeywords(normalizedName);

      // Cache the result for 24 hours (86400 seconds)
      await this.redis.setEx(cacheKey, 86400, detectedTheme);

      console.log(`[SubredditAnalyzer] Detected theme for r/${normalizedName}: ${detectedTheme}`);
      return detectedTheme;

    } catch (error) {
      console.error(`[SubredditAnalyzer] Error detecting theme for ${subredditName}:`, error);
      return 'general';
    }
  }

  /**
   * Perform keyword matching against subreddit name
   * @param subredditName - Normalized subreddit name without r/ prefix
   * @returns string - Matched theme name or 'general'
   */
  private matchKeywords(subredditName: string): string {
    // Direct exact match first
    for (const theme of SubredditAnalyzer.THEMES) {
      if (theme.keywords.includes(subredditName)) {
        return theme.name;
      }
    }

    // Partial keyword matching
    for (const theme of SubredditAnalyzer.THEMES) {
      for (const keyword of theme.keywords) {
        // Check if keyword appears in subreddit name
        if (subredditName.includes(keyword)) {
          return theme.name;
        }

        // Check if subreddit name appears in keyword (for compound keywords)
        if (keyword.includes(subredditName)) {
          return theme.name;
        }
      }
    }

    // Fuzzy matching for common variations
    if (subredditName.includes('sci') || subredditName.includes('research')) {
      return 'science';
    }

    if (subredditName.includes('anime') || subredditName.includes('manga') ||
        subredditName.includes('ghibli') || subredditName.includes('cartoon')) {
      return 'art'; // Could create anime theme if needed
    }

    if (subredditName.includes('movie') || subredditName.includes('film') ||
        subredditName.includes('cinema')) {
      return 'art'; // Art category for film/animation
    }

    // Default to general if no matches
    return 'general';
  }

  /**
   * Get theme description for UI display
   * @param themeName - Name of the theme
   * @returns string - Human-readable description or empty string
   */
  getThemeDescription(themeName: string): string {
    const theme = SubredditAnalyzer.THEMES.find(t => t.name === themeName);
    return theme?.description || '';
  }

  /**
   * Get all available themes for configuration or testing
   * @returns SubredditTheme[] - Array of all theme configurations
   */
  getAllThemes(): SubredditTheme[] {
    return [...SubredditAnalyzer.THEMES];
  }

  /**
   * Get theme suggestions for a partial subreddit name
   * @param partialName - Partial subreddit name to match
   * @returns string[] - Array of matching theme names
   */
  getThemeSuggestions(partialName: string): string[] {
    const normalizedName = partialName.toLowerCase().replace('r/', '').replace('/', '');
    const matchedThemes = new Set<string>();

    for (const theme of SubredditAnalyzer.THEMES) {
      for (const keyword of theme.keywords) {
        if (keyword.includes(normalizedName) || normalizedName.includes(keyword)) {
          matchedThemes.add(theme.name);
        }
      }
    }

    return Array.from(matchedThemes);
  }

  /**
   * Validate if a theme name is valid
   * @param themeName - Theme name to validate
   * @returns boolean - True if theme exists
   */
  isValidTheme(themeName: string): boolean {
    return SubredditAnalyzer.THEMES.some(theme => theme.name === themeName);
  }
}
