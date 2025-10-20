/**
 * Game State Service - Multiplayer Platformer Game
 * 
 * Manages real-time game state synchronization for the CollabCanvas platformer game.
 * Handles player positions, bullets, deaths, and respawns across all connected players.
 */

import { ref, onValue, set, get, update, remove } from 'firebase/database';
import { rtdb } from './firebase';

const GAME_CANVAS_ID = 'game-canvas-platformer';

/**
 * Subscribe to all players in the game
 */
export function subscribeToPlayers(callback) {
  const playersRef = ref(rtdb, `game/${GAME_CANVAS_ID}/players`);
  
  return onValue(playersRef, (snapshot) => {
    const data = snapshot.val();
    const players = data ? Object.values(data) : [];
    callback(players);
  });
}

/**
 * Update player position and state
 */
export async function updatePlayer(userId, playerData) {
  const playerRef = ref(rtdb, `game/${GAME_CANVAS_ID}/players/${userId}`);
  
  await set(playerRef, {
    ...playerData,
    lastUpdate: Date.now()
  });
}

/**
 * Remove player from game (disconnect)
 */
export async function removePlayer(userId) {
  const playerRef = ref(rtdb, `game/${GAME_CANVAS_ID}/players/${userId}`);
  await remove(playerRef);
}

/**
 * Subscribe to all active bullets
 */
export function subscribeToBullets(callback) {
  const bulletsRef = ref(rtdb, `game/${GAME_CANVAS_ID}/bullets`);
  
  return onValue(bulletsRef, (snapshot) => {
    const data = snapshot.val();
    const bullets = data ? Object.values(data) : [];
    callback(bullets);
  });
}

/**
 * Create a new bullet
 */
export async function createBullet(bulletData) {
  const bulletId = `bullet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const bulletRef = ref(rtdb, `game/${GAME_CANVAS_ID}/bullets/${bulletId}`);
  
  await set(bulletRef, {
    ...bulletData,
    id: bulletId,
    createdAt: Date.now()
  });
  
  return bulletId;
}

/**
 * Remove bullet (hit or expired)
 */
export async function removeBullet(bulletId) {
  const bulletRef = ref(rtdb, `game/${GAME_CANVAS_ID}/bullets/${bulletId}`);
  await remove(bulletRef);
}

/**
 * Get spawn points from canvas
 */
export async function getSpawnPoints() {
  const spawnRef = ref(rtdb, `game/${GAME_CANVAS_ID}/spawnPoints`);
  const snapshot = await get(spawnRef);
  
  if (snapshot.exists()) {
    return snapshot.val();
  }
  
  // Default spawn points if not set
  return [
    { x: 1000, y: 500 },
    { x: 5000, y: 500 },
    { x: 10000, y: 500 }
  ];
}

/**
 * Initialize game canvas with platforms if it doesn't exist
 */
export async function initializeGameCanvas(userId) {
  const canvasRef = ref(rtdb, `canvas/${GAME_CANVAS_ID}`);
  const snapshot = await get(canvasRef);
  
  if (!snapshot.exists()) {
    // Create game canvas with platforms
    const platforms = createPlatformLayout();
    
    await set(canvasRef, {
      metadata: {
        projectName: 'Battle Arena',
        createdBy: 'system',
        createdAt: Date.now(),
        isGameCanvas: true
      },
      shapes: platforms
    });
  }
}

/**
 * Create platform layout for Donkey Kong-style game
 */
function createPlatformLayout() {
  const platforms = {};
  const platformWidth = 2000;
  const platformThickness = 20;
  
  // Create 5 levels of platforms
  const levels = [
    { y: 2500, count: 1, startX: 7000 }, // Ground level
    { y: 2000, count: 2, startX: 5000 },
    { y: 1500, count: 2, startX: 8000 },
    { y: 1000, count: 2, startX: 4000 },
    { y: 500, count: 1, startX: 7000 }  // Top level
  ];
  
  levels.forEach((level, levelIndex) => {
    for (let i = 0; i < level.count; i++) {
      const xOffset = i * 4000;
      const shapeId = `platform_${levelIndex}_${i}`;
      
      platforms[shapeId] = {
        id: shapeId,
        type: 'line',
        x: level.startX + xOffset,
        y: level.y,
        width: platformWidth,
        height: platformThickness,
        fill: '#8b7355',
        strokeWidth: 6,
        rotation: 0,
        zIndex: -1,
        createdBy: 'system',
        createdAt: Date.now(),
        isPlatform: true
      };
    }
  });
  
  return platforms;
}

