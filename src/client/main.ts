import { navigateTo } from '@devvit/client';
import { InitResponse } from '../shared/types/api';
import { GameManager } from './core/game-manager';
import { SoundSettings } from './ui/sound-settings';

// Set up navigation links
const docsLink = document.getElementById('docs-link');
const playtestLink = document.getElementById('playtest-link');
const discordLink = document.getElementById('discord-link');

docsLink?.addEventListener('click', () => navigateTo('https://developers.reddit.com/docs'));
playtestLink?.addEventListener('click', () => navigateTo('https://www.reddit.com/r/Devvit'));
discordLink?.addEventListener('click', () => navigateTo('https://discord.com/invite/R7yu2wh9Qz'));

async function fetchInitialCount(): Promise<void> {
  try {
    const response = await fetch('/api/init');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = (await response.json()) as InitResponse;
    console.log('Initialized:', data);
  } catch (err) {
    console.error('Error fetching initial count:', err);
  }
}

// ============================================================================
// Background Image Setup
// ============================================================================

function setupBackgroundImage(): void {
  // Create a background container
  const backgroundContainer = document.createElement('div');
  backgroundContainer.id = 'background-container';

  // Try multiple image paths (including Vite-friendly paths)
  const imagePaths = [
    '/assets/regenx.png',
    'assets/regenx.png',
    './assets/regenx.png',
    '../assets/regenx.png',
    '/regenx.png',
    'regenx.png',
  ];

  let imageLoaded = false;

  // Test each image path
  const testImage = new Image();

  const tryNextPath = (index: number) => {
    if (index >= imagePaths.length) {
      // All paths failed, use gradient fallback
      backgroundContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #ff0000 0%, #00ff00 50%, #0000ff 100%);
        z-index: -1;
      `;
      console.log('Using BRIGHT TEST gradient background - you should see red/green/blue');
      return;
    }

    testImage.onload = () => {
      // Image loaded successfully
      backgroundContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image: url('${imagePaths[index]}');
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        z-index: -1;
        opacity: 0.8;
      `;
      console.log(`Background image loaded successfully from: ${imagePaths[index]}`);
      imageLoaded = true;
    };

    testImage.onerror = () => {
      // Try next path
      console.warn(`Failed to load image from: ${imagePaths[index]}`);
      tryNextPath(index + 1);
    };

    testImage.src = imagePaths[index] || '';
  };

  // Start testing paths
  tryNextPath(0);

  // Insert the background container
  const canvas = document.getElementById('bg');
  if (canvas && canvas.parentNode) {
    canvas.parentNode.insertBefore(backgroundContainer, canvas);
  }

  // Fallback timeout in case image loading takes too long
  setTimeout(() => {
    if (!imageLoaded && !backgroundContainer.style.backgroundImage) {
      backgroundContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
        z-index: -1;
      `;
      console.log('Timeout: Using fallback gradient background');
    }
  }, 2000);
}

// ============================================================================
// Application Initialization
// ============================================================================

// Initialize the game
async function initializeApp(): Promise<void> {
  try {
    // Setup background image first
    setupBackgroundImage();

    // Get canvas element
    const canvas = document.getElementById('bg') as HTMLCanvasElement;
    if (!canvas) {
      throw new Error('Canvas element not found');
    }

    // Initialize sound settings
    new SoundSettings();
    console.log('SoundSettings initialized');

    // Create and initialize game manager
    const gameManager = new GameManager(canvas);
    await gameManager.initialize();

    console.log('Re-GenX game initialized successfully');
  } catch (error) {
    console.error('Failed to initialize app:', error);
  }
}

// Start the application
void fetchInitialCount();
void initializeApp();
