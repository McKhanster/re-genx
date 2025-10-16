import { context, reddit } from '@devvit/web/server';

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
      description: 'Evolve your creature with 24 other players',
      heading: 'Welcome to Re-GenX!',
      appIconUri: 'default-icon.png',
    },
    postData: {
      gameState: 'initial',
    },
    subredditName: subredditName,
    title: 'Re-GenX - Collaborative Creature Evolution',
  });
};
