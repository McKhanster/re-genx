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

  // Use the working local asset path
  const backgroundUri = 'regenx.png'; // This should work with media.dir: "assets"
  console.log(`[CreatePost] Creating post with splash screen background: ${backgroundUri}`);

  return await reddit.submitCustomPost({
    subredditName: subredditName,
    title: 'Re-GenX - Your Personal Familiar',
    splash: {
      appDisplayName: 'Re-GenX', // only required field
      backgroundUri: backgroundUri,
      buttonLabel: 'Start Playing',
      description:
        'Nurture your own evolving familiar. Feed, play, and watch it grow into something unique.',
      heading: 'Your Familiar Awaits',
    },
    postData: {
      gameState: 'initial',
      score: 0,
    },
  });
};
