import { context, reddit } from '@devvit/web/server';

/**
 * Creates a Re-GenX post with splash screen
 * The splash screen invites players to nurture their own personal familiar
 */
export const createPost = async () => {
  const { subredditName } = context;
  if (!subredditName) {
    throw new Error('subredditName is required');
  }

  return await reddit.submitCustomPost({
    splash: {
      // Splash Screen Configuration
      appDisplayName: 'Re-GenX',
      backgroundUri: 'default-splash.png',
      buttonLabel: 'Play',
      description: 'Nurture your own evolving familiar. Feed, play, and watch it grow into something unique.',
      heading: 'Your Familiar Awaits',
      appIconUri: 'default-icon.png',
    },
    postData: {
      gameState: 'initial',
    },
    subredditName: subredditName,
    title: 'Re-GenX - Your Personal Familiar',
  });
};
