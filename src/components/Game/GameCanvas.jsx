/**
 * GameCanvas - Multiplayer Platformer Battle Arena
 * 
 * A Donkey Kong-style multiplayer game integrated with full canvas features:
 * - Grid background like normal canvas
 * - Presence list showing online players
 * - Chat panel with M key
 * - Arrow keys to move, Up to jump, Space to shoot
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Stage, Layer, Line as KonvaLine, Circle, Rect, Group, Text } from 'react-konva';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { subscribeToPlayers, updatePlayer, removePlayer, subscribeToBullets, createBullet, removeBullet } from '../../services/gameState';
import ChatPanel from '../Canvas/ChatPanel';
import PresenceList from '../Collaboration/PresenceList';
import CharacterCustomization from './CharacterCustomization';
import usePresence from '../../hooks/usePresence';
import useCursors from '../../hooks/useCursors';

const GAME_CANVAS_ID = 'game-canvas-platformer';
const PLAYER_SIZE = 40;
const PLAYER_SPEED = 10;
const JUMP_VELOCITY = -25;
const GRAVITY = 0.9;
const BULLET_SPEED = 20;
const BULLET_SIZE = 8;
const CANVAS_WIDTH = 3000;
const CANVAS_HEIGHT = 2000;
const GRID_SIZE = 50;

// Static platform layout - Donkey Kong style (scaled for 3000x2000 canvas)
const PLATFORMS = [
  // Ground level
  { id: 'platform_0', x: 0, y: 1900, width: 3000, strokeWidth: 20 },
  // Level 1 - low platforms (250px gap vertically)
  { id: 'platform_1a', x: 240, y: 1650, width: 720, strokeWidth: 15 },
  { id: 'platform_1b', x: 1200, y: 1650, width: 720, strokeWidth: 15 },
  { id: 'platform_1c', x: 2160, y: 1650, width: 720, strokeWidth: 15 },
  // Level 2 - mid platforms (250px gap)
  { id: 'platform_2a', x: 480, y: 1400, width: 660, strokeWidth: 15 },
  { id: 'platform_2b', x: 1440, y: 1400, width: 660, strokeWidth: 15 },
  { id: 'platform_2c', x: 2400, y: 1400, width: 480, strokeWidth: 15 },
  // Level 3 - high platforms (250px gap)
  { id: 'platform_3a', x: 120, y: 1150, width: 600, strokeWidth: 15 },
  { id: 'platform_3b', x: 1080, y: 1150, width: 600, strokeWidth: 15 },
  { id: 'platform_3c', x: 2040, y: 1150, width: 600, strokeWidth: 15 },
  // Level 4 - top platforms (250px gap)
  { id: 'platform_4a', x: 360, y: 900, width: 540, strokeWidth: 15 },
  { id: 'platform_4b', x: 1320, y: 900, width: 540, strokeWidth: 15 },
  { id: 'platform_4c', x: 2280, y: 900, width: 540, strokeWidth: 15 },
  // Level 5 - highest platforms (250px gap)
  { id: 'platform_5a', x: 240, y: 650, width: 480, strokeWidth: 15 },
  { id: 'platform_5b', x: 1080, y: 650, width: 480, strokeWidth: 15 },
  { id: 'platform_5c', x: 1920, y: 650, width: 480, strokeWidth: 15 }
];

// Spawn points (positioned on platforms minus player height)
const SPAWN_POINTS = [
  { x: 360, y: 610 },   // Level 5 platform
  { x: 1200, y: 610 },  // Level 5 platform
  { x: 2040, y: 610 },  // Level 5 platform
  { x: 600, y: 860 },   // Level 4 platform
  { x: 1500, y: 1110 }  // Level 3 platform
];

export default function GameCanvas() {
  const { user } = useAuth();
  const { theme, currentThemeId } = useTheme();
  const navigate = useNavigate();
  const stageRef = useRef(null);
  
  // Canvas integrations
  const { onlineUsers } = usePresence(GAME_CANVAS_ID);
  const { cursors } = useCursors(stageRef, GAME_CANVAS_ID);
  
  // Game state
  const [players, setPlayers] = useState([]);
  const [bullets, setBullets] = useState([]);
  const playersRef = useRef([]); // Ref for collision detection without recreating game loop
  const localBulletsRef = useRef([]); // Use ref for 60 FPS updates
  const remoteBulletsRef = useRef(new Map()); // Track remote bullets by ID to prevent resets
  
  // Local player state
  const [localPlayer, setLocalPlayer] = useState({
    x: 1200,
    y: 610,
    velocityY: 0,
    facingRight: true,
    isOnGround: false,
    hasDoubleJumped: false
  });
  
  // Character customization
  const [selectedHat, setSelectedHat] = useState(localStorage.getItem('battleArenaHairStyle') || 'none');
  const [showCustomization, setShowCustomization] = useState(!localStorage.getItem('battleArenaHairStyle'));
  
  // Input state
  const keysPressed = useRef({});
  const lastShootTime = useRef(0);
  
  // Camera state - with zoom and pan like normal canvas
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(0.8);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef(null);
  const panInitialPosRef = useRef(null);
  
  // UI state
  const [kills, setKills] = useState(0);
  const [deaths, setDeaths] = useState(0);
  const [isUIVisible, setIsUIVisible] = useState(false);
  const [isChatPanelVisible, setIsChatPanelVisible] = useState(false);
  const [deathAnimation, setDeathAnimation] = useState(null); // {uid, x, y, timestamp}
  const [respawnAnimation, setRespawnAnimation] = useState(null); // {x, y, timestamp}
  const [doubleJumpParticles, setDoubleJumpParticles] = useState([]); // Particle effects
  
  // Handle hair style selection
  const handleHatSelect = (styleId) => {
    setSelectedHat(styleId);
    localStorage.setItem('battleArenaHairStyle', styleId);
    setShowCustomization(false);
  };
  
  // Center canvas on load
  useEffect(() => {
    const centeredX = (window.innerWidth - CANVAS_WIDTH * stageScale) / 2;
    const centeredY = (window.innerHeight - CANVAS_HEIGHT * stageScale) / 2;
    setStagePos({ x: centeredX, y: centeredY });
  }, []);
  
  // Zoom handler (like Canvas.jsx)
  const handleWheel = (e) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    const scaleBy = 1.05;
    
    const newScale = e.evt.deltaY > 0 
      ? stageScale / scaleBy 
      : stageScale * scaleBy;
    const clampedScale = Math.max(0.3, Math.min(2, newScale));
    
    const mousePointTo = {
      x: (pointer.x - stagePos.x) / stageScale,
      y: (pointer.y - stagePos.y) / stageScale
    };
    
    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale
    };
    
    setStageScale(clampedScale);
    setStagePos(newPos);
  };
  
  // Pan handlers (middle click like Canvas.jsx)
  const handleStageMouseDown = (e) => {
    if (e.evt.button === 1) { // Middle click
      e.evt.preventDefault();
      setIsPanning(true);
      panStartRef.current = { x: e.evt.clientX, y: e.evt.clientY };
      panInitialPosRef.current = { ...stagePos };
    }
  };
  
  const handleStageMouseMove = (e) => {
    if (isPanning && panStartRef.current && panInitialPosRef.current) {
      const deltaX = e.evt.clientX - panStartRef.current.x;
      const deltaY = e.evt.clientY - panStartRef.current.y;
      
      setStagePos({
        x: panInitialPosRef.current.x + deltaX,
        y: panInitialPosRef.current.y + deltaY
      });
    }
  };
  
  const handleStageMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      panStartRef.current = null;
      panInitialPosRef.current = null;
    }
  };
  
  // Subscribe to multiplayer state
  useEffect(() => {
    if (!user) return;
    
    console.log('[Game] Setting up player subscription for user:', user.uid);
    
    const unsubPlayers = subscribeToPlayers((remotePlayers) => {
      console.log('[Game] 👥 Received players from RTDB:', remotePlayers.length, 'total');
      remotePlayers.forEach(p => console.log('  - Player:', p.name, 'at', `(${p.x}, ${p.y})`, 'hair:', p.hat));
      // Filter out local player
      const filtered = remotePlayers.filter(p => p.uid !== user.uid);
      console.log('[Game] 🎯 Filtered to', filtered.length, 'remote players (excluding self)');
      playersRef.current = filtered;
      setPlayers(filtered);
    });
    
    const unsubBullets = subscribeToBullets((remoteBullets) => {
      console.log('[Game] 🔫 Received bullets from RTDB:', remoteBullets.length, 'total');
      
      // CRITICAL: Only add NEW bullets, don't replace existing ones
      // This prevents RTDB subscription from resetting bullet positions
      remoteBullets.forEach(bullet => {
        // Skip your own bullets
        if (bullet.ownerId === user.uid) return;
        
        // Skip if already tracking this bullet
        if (remoteBulletsRef.current.has(bullet.id)) return;
        
        // Validate bullet data
        if (!bullet.velocityX || !bullet.createdAt) {
          console.warn('[Game] ⚠️ Invalid bullet data:', bullet.id);
          return;
        }
        
        // Add new remote bullet
        remoteBulletsRef.current.set(bullet.id, bullet);
        console.log('[Game] ➕ New remote bullet from', bullet.ownerName, '- velocity:', bullet.velocityX);
      });
      
      // Update bullets state from the Map
      setBullets(Array.from(remoteBulletsRef.current.values()));
      console.log('[Game] 📊 Total remote bullets being tracked:', remoteBulletsRef.current.size);
    });
    
    return () => {
      console.log('[Game] Cleaning up - removing player from RTDB');
      unsubPlayers();
      unsubBullets();
      removePlayer(user.uid);
    };
  }, [user]);
  
  // Trigger UI entrance animation
  useEffect(() => {
    setTimeout(() => setIsUIVisible(true), 150);
  }, []);
  
  // Refs for click-outside detection
  const chatPanelRef = useRef(null);
  
  // Keyboard input handlers
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if user is typing in chat
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }
      
      // Chat toggle
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setIsChatPanelVisible(prev => !prev);
        return;
      }
      
      // Prevent default for game controls
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      
      keysPressed.current[e.key] = true;
      
      // Handle shooting
      if (e.key === ' ') {
        const now = Date.now();
        if (now - lastShootTime.current > 500) { // 500ms cooldown
          lastShootTime.current = now;
          handleShoot();
        }
      }
    };
    
    const handleKeyUp = (e) => {
      keysPressed.current[e.key] = false;
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [localPlayer, user]);
  
  // Handle shooting
  const handleShoot = useCallback(() => {
    if (!user) return;
    
    const bulletId = `bullet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const bulletData = {
      id: bulletId,
      x: localPlayer.x + (localPlayer.facingRight ? PLAYER_SIZE + 10 : -20),
      y: localPlayer.y + PLAYER_SIZE / 2,
      velocityX: localPlayer.facingRight ? BULLET_SPEED : -BULLET_SPEED,
      ownerId: user.uid,
      ownerName: user.displayName || user.email?.split('@')[0] || 'Player',
      createdAt: Date.now()
    };
    
    console.log('[Game] 🔫 Shooting bullet:', bulletData.id, 'velocity:', bulletData.velocityX);
    
    // Add to local bullets ref for immediate rendering
    localBulletsRef.current.push(bulletData);
    
    // Sync to RTDB for multiplayer - CRITICAL for other players to see
    createBullet(bulletData).then(() => {
      console.log('[Game] ✅ Bullet synced to RTDB for multiplayer');
    }).catch((err) => {
      console.error('[Game] ❌ Bullet sync failed:', err.message);
    });
  }, [localPlayer, user]);
  
  // Check collision with platforms
  const checkPlatformCollision = useCallback((x, y, velocityY) => {
    for (const platform of PLATFORMS) {
      const platformLeft = platform.x;
      const platformRight = platform.x + platform.width;
      const platformTop = platform.y;
      const platformBottom = platform.y + platform.strokeWidth;
      
      // Check if player is falling onto platform
      if (velocityY >= 0 &&
          x + PLAYER_SIZE > platformLeft && 
          x < platformRight &&
          y + PLAYER_SIZE >= platformTop && 
          y + PLAYER_SIZE <= platformBottom + 15) {
        return { collision: true, platformY: platformTop };
      }
    }
    return { collision: false };
  }, []);
  
  // Master game loop - physics, bullets, and collisions at 60 FPS
  useEffect(() => {
    if (!user) return;
    
    const gameLoop = () => {
      // Update player physics
      setLocalPlayer(prev => {
        let newX = prev.x;
        let newY = prev.y;
        let newVelocityY = prev.velocityY;
        let newIsOnGround = false;
        let newFacingRight = prev.facingRight;
        let newHasDoubleJumped = prev.hasDoubleJumped;
        
        // Horizontal movement
        if (keysPressed.current['ArrowLeft']) {
          newX -= PLAYER_SPEED;
          newFacingRight = false;
        }
        if (keysPressed.current['ArrowRight']) {
          newX += PLAYER_SPEED;
          newFacingRight = true;
        }
        
        // Jumping (with double jump mechanic)
        if (keysPressed.current['ArrowUp']) {
          if (prev.isOnGround) {
            // First jump
            newVelocityY = JUMP_VELOCITY;
            newIsOnGround = false;
            newHasDoubleJumped = false;
          } else if (!prev.hasDoubleJumped && !prev.isOnGround) {
            // Double jump (only if not already used)
            newVelocityY = JUMP_VELOCITY * 0.8; // Slightly weaker second jump
            newHasDoubleJumped = true;
            
            // Create particle effect
            const particles = Array.from({ length: 8 }, (_, i) => ({
              id: `particle_${Date.now()}_${i}`,
              x: newX + PLAYER_SIZE / 2,
              y: newY + PLAYER_SIZE,
              velocityX: (Math.random() - 0.5) * 10,
              velocityY: Math.random() * 5 + 2,
              createdAt: Date.now()
            }));
            setDoubleJumpParticles(prev => [...prev, ...particles]);
            
            // Clear used jump key to prevent repeated jumps
            keysPressed.current['ArrowUp'] = false;
          }
        }
        
        // Apply gravity
        newVelocityY += GRAVITY;
        newY += newVelocityY;
        
        // Check platform collisions
        const collision = checkPlatformCollision(newX, newY, newVelocityY);
        if (collision.collision) {
          newY = collision.platformY - PLAYER_SIZE;
          newVelocityY = 0;
          newIsOnGround = true;
        }
        
        // Boundary checks
        newX = Math.max(0, Math.min(CANVAS_WIDTH - PLAYER_SIZE, newX));
        if (newY < 0) {
          newY = 0;
          newVelocityY = 0;
        }
        
        // If fell off bottom, respawn
        if (newY >= CANVAS_HEIGHT - PLAYER_SIZE) {
          const spawn = SPAWN_POINTS[Math.floor(Math.random() * SPAWN_POINTS.length)];
          newX = spawn.x;
          newY = spawn.y;
          newVelocityY = 0;
          setDeaths(d => d + 1);
        }
        
        return {
          x: newX,
          y: newY,
          velocityY: newVelocityY,
          facingRight: newFacingRight,
          isOnGround: newIsOnGround,
          hasDoubleJumped: newHasDoubleJumped
        };
      });
      
      // Update LOCAL bullet positions
      localBulletsRef.current = localBulletsRef.current.map(bullet => ({
        ...bullet,
        x: bullet.x + bullet.velocityX
      })).filter(bullet => {
        // Remove if out of bounds or too old
        const age = Date.now() - bullet.createdAt;
        const inBounds = bullet.x >= -100 && bullet.x <= CANVAS_WIDTH + 100;
        return inBounds && age < 5000;
      });
      
      // Update REMOTE bullet positions (CRITICAL - makes them move on all screens!)
      // Update positions in the Map to maintain state between RTDB syncs
      const bulletsToRemove = [];
      remoteBulletsRef.current.forEach((bullet, id) => {
        const newX = bullet.x + bullet.velocityX;
        const age = Date.now() - bullet.createdAt;
        const inBounds = newX >= -100 && newX <= CANVAS_WIDTH + 100;
        
        if (!inBounds || age > 5000) {
          // Mark for removal
          bulletsToRemove.push(id);
        } else {
          // Update position
          bullet.x = newX;
          remoteBulletsRef.current.set(id, bullet);
        }
      });
      
      // Remove old bullets
      bulletsToRemove.forEach(id => remoteBulletsRef.current.delete(id));
      
      // Update bullets state for rendering
      setBullets(Array.from(remoteBulletsRef.current.values()));
      
      // Update particle effects
      setDoubleJumpParticles(prev => 
        prev.filter(p => Date.now() - p.createdAt < 600).map(p => ({
          ...p,
          y: p.y + p.velocityY,
          velocityY: p.velocityY + 0.5, // Gravity effect
          x: p.x + p.velocityX
        }))
      );
      
      // Check bullet collisions (use refs directly to avoid stale closure)
      const allBullets = [...localBulletsRef.current, ...Array.from(remoteBulletsRef.current.values())];
      allBullets.forEach(bullet => {
        const hitPlayer = [...playersRef.current, {
          uid: user.uid,
          x: localPlayer.x,
          y: localPlayer.y
        }].find(p => {
          if (p.uid === bullet.ownerId) return false;
          
          return bullet.x >= p.x && bullet.x <= p.x + PLAYER_SIZE &&
                 bullet.y >= p.y && bullet.y <= p.y + PLAYER_SIZE;
        });
        
        if (hitPlayer) {
          // Remove bullet from local and remote tracking
          localBulletsRef.current = localBulletsRef.current.filter(b => b.id !== bullet.id);
          remoteBulletsRef.current.delete(bullet.id);
          removeBullet(bullet.id).catch(() => {});
          
          // Hit local player - you died
          if (hitPlayer.uid === user.uid) {
            console.log('[Game] 💀 You were killed by', bullet.ownerName);
            
            // Death animation
            setDeathAnimation({
              uid: user.uid,
              x: localPlayer.x,
              y: localPlayer.y,
              timestamp: Date.now()
            });
            setTimeout(() => setDeathAnimation(null), 1000);
            
            const spawn = SPAWN_POINTS[Math.floor(Math.random() * SPAWN_POINTS.length)];
            
            // Respawn animation
            setRespawnAnimation({
              x: spawn.x,
              y: spawn.y,
              timestamp: Date.now()
            });
            setTimeout(() => setRespawnAnimation(null), 1500);
            
            setLocalPlayer(prev => ({
              ...prev,
              x: spawn.x,
              y: spawn.y,
              velocityY: 0
            }));
            
            setDeaths(d => {
              const newDeaths = d + 1;
              console.log('[Game] 📊 Your deaths:', newDeaths);
              return newDeaths;
            });
          } else {
            // You killed someone else
            console.log('[Game] ☠️ You killed', hitPlayer.name || 'Player');
            
            setDeathAnimation({
              uid: hitPlayer.uid,
              x: hitPlayer.x,
              y: hitPlayer.y,
              timestamp: Date.now()
            });
            setTimeout(() => setDeathAnimation(null), 1000);
            
            setKills(k => {
              const newKills = k + 1;
              console.log('[Game] 📊 Your kills:', newKills);
              return newKills;
            });
          }
        }
      });
    };
    
    const gameLoopInterval = setInterval(gameLoop, 1000 / 60); // 60 FPS
    
    return () => clearInterval(gameLoopInterval);
  }, [user, checkPlatformCollision, localPlayer.x, localPlayer.y]);
  
  // Update remote player position - use ref to avoid recreating interval
  const localPlayerRef = useRef(localPlayer);
  useEffect(() => {
    localPlayerRef.current = localPlayer;
  }, [localPlayer]);
  
  useEffect(() => {
    if (!user) return;
    
    let updateCount = 0;
    console.log('[Game] Starting player position sync to RTDB');
    
    const updateInterval = setInterval(() => {
      updateCount++;
      const current = localPlayerRef.current;
      const playerData = {
        uid: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'Player',
        x: Math.round(current.x),
        y: Math.round(current.y),
        facingRight: current.facingRight,
        hat: selectedHat
      };
      
      if (updateCount === 1 || updateCount % 40 === 0) {
        console.log('[Game] Updating player position to RTDB:', playerData, '(hair:', playerData.hat, ')');
      }
      
      updatePlayer(user.uid, playerData).catch((err) => {
        if (updateCount % 40 === 0) {
          console.error('[Game] Player update failed:', err.message);
        }
      });
    }, 1000 / 20); // 20 updates per second
    
    return () => {
      console.log('[Game] Stopping player position sync');
      clearInterval(updateInterval);
    };
  }, [user, selectedHat]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (user) {
        removePlayer(user.uid).catch(() => {});
      }
    };
  }, [user]);
  
  // Auto-cleanup old bullets and expose debug utilities
  useEffect(() => {
    // Auto-cleanup old bullets every 10 seconds
    const cleanupInterval = setInterval(async () => {
      try {
        const { ref, get, remove } = await import('firebase/database');
        const { rtdb } = await import('../../services/firebase');
        const bulletsRef = ref(rtdb, `game/${GAME_CANVAS_ID}/bullets`);
        const snapshot = await get(bulletsRef);
        
        if (snapshot.exists()) {
          const allBullets = snapshot.val();
          const now = Date.now();
          let removedCount = 0;
          
          // Remove bullets older than 5 seconds
          for (const [bulletId, bullet] of Object.entries(allBullets)) {
            if (now - bullet.createdAt > 5000) {
              const bulletRef = ref(rtdb, `game/${GAME_CANVAS_ID}/bullets/${bulletId}`);
              await remove(bulletRef);
              removedCount++;
            }
          }
          
          if (removedCount > 0) {
            console.log('[Game] 🧹 Auto-cleaned', removedCount, 'old bullets from RTDB');
          }
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    }, 10000);
    
    // Debug utilities
    window.gameDebug = {
      clearAllBullets: async () => {
        const { ref, remove } = await import('firebase/database');
        const { rtdb } = await import('../../services/firebase');
        const bulletsRef = ref(rtdb, `game/${GAME_CANVAS_ID}/bullets`);
        await remove(bulletsRef);
        localBulletsRef.current = [];
        remoteBulletsRef.current.clear();
        setBullets([]);
        console.log('[Game Debug] ✅ Cleared all bullets from RTDB and local state');
      },
      clearAllPlayers: async () => {
        const { ref, remove } = await import('firebase/database');
        const { rtdb } = await import('../../services/firebase');
        const playersRef = ref(rtdb, `game/${GAME_CANVAS_ID}/players`);
        await remove(playersRef);
        console.log('[Game Debug] ✅ Cleared all players from RTDB');
      },
      getGameState: async () => {
        const { ref, get } = await import('firebase/database');
        const { rtdb } = await import('../../services/firebase');
        const gameRef = ref(rtdb, `game/${GAME_CANVAS_ID}`);
        const snapshot = await get(gameRef);
        console.log('[Game Debug] Current game state:', snapshot.val());
        return snapshot.val();
      }
    };
    
    console.log('[Game] 🎮 Debug utilities available:');
    console.log('  - window.gameDebug.clearAllBullets() - Remove all bullets');
    console.log('  - window.gameDebug.clearAllPlayers() - Clear player list');
    console.log('  - window.gameDebug.getGameState() - View game state');
    
    return () => {
      clearInterval(cleanupInterval);
      delete window.gameDebug;
    };
  }, []);
  
  // Grid rendering like Canvas.jsx
  const renderGrid = () => {
    const lines = [];
    const gridColor = theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
    
    for (let i = 0; i <= CANVAS_WIDTH; i += GRID_SIZE) {
      lines.push(
        <KonvaLine
          key={`v-${i}`}
          points={[i, 0, i, CANVAS_HEIGHT]}
          stroke={gridColor}
          strokeWidth={1 / stageScale}
          listening={false}
          perfectDrawEnabled={false}
        />
      );
    }
    
    for (let i = 0; i <= CANVAS_HEIGHT; i += GRID_SIZE) {
      lines.push(
        <KonvaLine
          key={`h-${i}`}
          points={[0, i, CANVAS_WIDTH, i]}
          stroke={gridColor}
          strokeWidth={1 / stageScale}
          listening={false}
          perfectDrawEnabled={false}
        />
      );
    }
    
    return lines;
  };
  
  // Render hair based on style
  const renderHair = (x, y, size, color, style) => {
    if (!style || style === 'none') return null;
    
    const headCenterX = x + size / 2;
    const headCenterY = y + size * 0.25;
    const headRadius = size * 0.2;
    
    switch (style) {
      case 'spiky':
        // Spiky hair - triangular spikes on top
        return (
          <>
            <KonvaLine points={[headCenterX - 6, headCenterY - headRadius, headCenterX - 6, headCenterY - headRadius - 8]} stroke={color} strokeWidth={3} />
            <KonvaLine points={[headCenterX, headCenterY - headRadius, headCenterX, headCenterY - headRadius - 10]} stroke={color} strokeWidth={3} />
            <KonvaLine points={[headCenterX + 6, headCenterY - headRadius, headCenterX + 6, headCenterY - headRadius - 8]} stroke={color} strokeWidth={3} />
          </>
        );
      
      case 'afro':
        // Afro - large circle around head
        return (
          <Circle
            x={headCenterX}
            y={headCenterY - 2}
            radius={headRadius * 1.6}
            stroke={color}
            strokeWidth={3}
            listening={false}
          />
        );
      
      case 'long':
        // Long hair - lines down the sides
        return (
          <>
            <KonvaLine points={[headCenterX - headRadius, headCenterY, headCenterX - headRadius - 2, headCenterY + 15]} stroke={color} strokeWidth={3} />
            <KonvaLine points={[headCenterX + headRadius, headCenterY, headCenterX + headRadius + 2, headCenterY + 15]} stroke={color} strokeWidth={3} />
          </>
        );
      
      case 'ponytail':
        // Ponytail - line extending from back of head
        return (
          <KonvaLine points={[headCenterX + headRadius, headCenterY, headCenterX + headRadius + 8, headCenterY + 5]} stroke={color} strokeWidth={3} />
        );
      
      case 'curly':
        // Curly - wavy line on top
        return (
          <>
            <Circle x={headCenterX - 5} y={headCenterY - headRadius - 2} radius={3} stroke={color} strokeWidth={2} listening={false} />
            <Circle x={headCenterX + 0} y={headCenterY - headRadius - 3} radius={3} stroke={color} strokeWidth={2} listening={false} />
            <Circle x={headCenterX + 5} y={headCenterY - headRadius - 2} radius={3} stroke={color} strokeWidth={2} listening={false} />
          </>
        );
      
      case 'buzz':
        // Buzz cut - short line on top
        return (
          <KonvaLine points={[headCenterX - headRadius, headCenterY - headRadius, headCenterX + headRadius, headCenterY - headRadius]} stroke={color} strokeWidth={4} />
        );
      
      case 'mohawk':
        // Mohawk - central spike
        return (
          <KonvaLine points={[headCenterX, headCenterY - headRadius, headCenterX, headCenterY - headRadius - 12]} stroke={color} strokeWidth={4} />
        );
      
      case 'wavy':
        // Wavy - curved lines
        return (
          <>
            <KonvaLine points={[headCenterX - 6, headCenterY - headRadius, headCenterX - 4, headCenterY - headRadius - 6, headCenterX - 6, headCenterY - headRadius - 10]} stroke={color} strokeWidth={2} />
            <KonvaLine points={[headCenterX + 6, headCenterY - headRadius, headCenterX + 4, headCenterY - headRadius - 6, headCenterX + 6, headCenterY - headRadius - 10]} stroke={color} strokeWidth={2} />
          </>
        );
      
      default:
        return null;
    }
  };
  
  // Render stick figure player
  const renderPlayer = (player, isLocal = false) => {
    const color = isLocal ? theme.button.primary : theme.accent.blue;
    const x = player.x;
    const y = player.y;
    const size = PLAYER_SIZE;
    const facingRight = player.facingRight;
    const hairStyle = player.hat || 'none';
    
    return (
      <Group key={player.uid || 'local'}>
        {/* Hair */}
        {renderHair(x, y, size, color, hairStyle)}
        
        {/* Head */}
        <Circle
          x={x + size / 2}
          y={y + size * 0.25}
          radius={size * 0.2}
          stroke={color}
          strokeWidth={3}
          listening={false}
          perfectDrawEnabled={false}
        />
        
        {/* Body */}
        <KonvaLine
          points={[x + size / 2, y + size * 0.4, x + size / 2, y + size * 0.7]}
          stroke={color}
          strokeWidth={3}
          listening={false}
          perfectDrawEnabled={false}
        />
        
        {/* Legs */}
        <KonvaLine
          points={[
            x + size / 2, y + size * 0.7,
            x + size * 0.3, y + size
          ]}
          stroke={color}
          strokeWidth={3}
          listening={false}
          perfectDrawEnabled={false}
        />
        <KonvaLine
          points={[
            x + size / 2, y + size * 0.7,
            x + size * 0.7, y + size
          ]}
          stroke={color}
          strokeWidth={3}
          listening={false}
          perfectDrawEnabled={false}
        />
        
        {/* Arms */}
        <KonvaLine
          points={[
            x + size / 2, y + size * 0.5,
            x + (facingRight ? size * 0.8 : size * 0.2), y + size * 0.5
          ]}
          stroke={color}
          strokeWidth={3}
          listening={false}
          perfectDrawEnabled={false}
        />
        
        {/* Gun */}
        <KonvaLine
          points={[
            x + (facingRight ? size * 0.8 : size * 0.2), y + size * 0.5,
            x + (facingRight ? size * 1.1 : -size * 0.1), y + size * 0.5
          ]}
          stroke={color}
          strokeWidth={4}
          listening={false}
          perfectDrawEnabled={false}
        />
        
        {/* Name label */}
        <Text
          x={x - 20}
          y={y - 25}
          text={player.name || 'Player'}
          fontSize={12}
          fill={color}
          align="center"
          width={size + 40}
          fontStyle="bold"
          listening={false}
          perfectDrawEnabled={false}
        />
      </Group>
    );
  };
  
  // Render bullet
  const renderBullet = (bullet) => {
    return (
      <Group key={bullet.id}>
        {/* Glow effect */}
        <Circle
          x={bullet.x}
          y={bullet.y}
          radius={BULLET_SIZE + 4}
          fill={theme.accent.yellow}
          opacity={0.3}
          listening={false}
          perfectDrawEnabled={false}
        />
        {/* Main bullet */}
        <Circle
          x={bullet.x}
          y={bullet.y}
          radius={BULLET_SIZE}
          fill={theme.accent.yellow}
          stroke={theme.accent.red}
          strokeWidth={2}
          listening={false}
          perfectDrawEnabled={false}
        />
      </Group>
    );
  };
  
  // Render platform
  const renderPlatform = (platform) => {
    return (
      <KonvaLine
        key={platform.id}
        x={platform.x}
        y={platform.y}
        points={[0, 0, platform.width, 0]}
        stroke={theme.isDark ? '#8b7355' : '#6b5345'}
        strokeWidth={platform.strokeWidth}
        lineCap="round"
        listening={false}
        perfectDrawEnabled={false}
      />
    );
  };
  
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: theme.background.page,
      position: 'relative'
    }}>
      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          padding: '10px 16px',
          background: theme.background.card,
          border: `1px solid ${theme.border.normal}`,
          borderRadius: '10px',
          fontSize: '14px',
          fontWeight: '500',
          color: theme.text.primary,
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: theme.shadow.md,
          zIndex: 10000,
          opacity: isUIVisible ? 1 : 0,
          transform: isUIVisible ? 'translateY(0)' : 'translateY(-10px)'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = theme.background.elevated;
        }}
        onMouseLeave={(e) => {
          e.target.style.background = theme.background.card;
        }}
      >
        ← Back to Projects
      </button>
      
      {/* Game Title */}
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: theme.background.card,
        padding: '12px 24px',
        borderRadius: '10px',
        boxShadow: theme.shadow.md,
        border: `1px solid ${theme.border.normal}`,
        zIndex: 10000,
        opacity: isUIVisible ? 1 : 0,
        transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.1s'
      }}>
        <div style={{
          fontSize: '18px',
          fontWeight: '600',
          color: theme.text.primary,
          textAlign: 'center'
        }}>
          Battle Arena
        </div>
        <div style={{
          fontSize: '11px',
          color: theme.text.secondary,
          textAlign: 'center',
          marginTop: '2px'
        }}>
          Arrows to move • Up to jump (double jump!) • Space to shoot • M for chat
        </div>
      </div>
      
      {/* Presence List */}
      <PresenceList 
        users={onlineUsers} 
        canvasOwnerId={null}
        isVisible={isUIVisible}
        isChatPanelVisible={isChatPanelVisible}
      />
      
      {/* Stats */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        background: theme.background.card,
        padding: '12px 20px',
        borderRadius: '10px',
        boxShadow: theme.shadow.md,
        border: `1px solid ${theme.border.normal}`,
        zIndex: 10000,
        opacity: isUIVisible ? 1 : 0,
        transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.2s'
      }}>
        <div style={{
          fontSize: '13px',
          color: theme.text.primary,
          fontWeight: '500',
          marginBottom: '4px'
        }}>
          Kills: {kills}
        </div>
        <div style={{
          fontSize: '13px',
          color: theme.text.primary,
          fontWeight: '500'
        }}>
          Deaths: {deaths}
        </div>
      </div>
      
      {/* Chat Button */}
      <button
        onClick={() => setIsChatPanelVisible(!isChatPanelVisible)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '48px',
          height: '48px',
          display: isChatPanelVisible ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: theme.gradient.button,
          border: `1px solid ${theme.border.normal}`,
          borderRadius: '10px',
          cursor: 'pointer',
          boxShadow: theme.shadow.md,
          zIndex: 10000,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: isUIVisible ? 1 : 0,
          transform: isUIVisible ? 'translateY(0)' : 'translateY(10px)'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = theme.gradient.hover;
          e.target.style.boxShadow = theme.shadow.lg;
        }}
        onMouseLeave={(e) => {
          e.target.style.background = theme.gradient.button;
          e.target.style.boxShadow = theme.shadow.md;
        }}
        title="Chat (M)"
      >
        <svg 
          width="22" 
          height="22" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke={theme.text.primary}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>
      
      {/* Game Canvas */}
      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight}
        x={stagePos.x}
        y={stagePos.y}
        scaleX={stageScale}
        scaleY={stageScale}
        onWheel={handleWheel}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
      >
        <Layer>
          {/* Background */}
          <Rect
            x={0}
            y={0}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            fill={theme.isDark ? theme.background.elevated : '#ffffff'}
            listening={false}
          />
          
          {/* Grid lines */}
          {renderGrid()}
          
          {/* Sky gradient effect */}
          <Rect
            x={0}
            y={0}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT / 2}
            fillLinearGradientStartPoint={{ x: 0, y: 0 }}
            fillLinearGradientEndPoint={{ x: 0, y: CANVAS_HEIGHT / 2 }}
            fillLinearGradientColorStops={
              theme.isDark 
                ? [0, 'rgba(30, 41, 59, 0.3)', 1, 'transparent']
                : [0, 'rgba(191, 219, 254, 0.3)', 1, 'transparent']
            }
            listening={false}
          />
          
          {/* Platforms */}
          {PLATFORMS.map(renderPlatform)}
          
          {/* Remote players */}
          {players.map(player => renderPlayer(player, false))}
          
          {/* Local player */}
          {renderPlayer({
            uid: user?.uid,
            name: user?.displayName || user?.email?.split('@')[0] || 'You',
            ...localPlayer,
            hat: selectedHat
          }, true)}
          
          {/* Local bullets (smooth client-side movement) - YOUR bullets */}
          {localBulletsRef.current.map(renderBullet)}
          
          {/* Remote bullets from other players - THEIR bullets (already filtered) */}
          {bullets.map(renderBullet)}
          
          {/* Double Jump Particles */}
          {doubleJumpParticles.map(particle => (
            <Circle
              key={particle.id}
              x={particle.x}
              y={particle.y}
              radius={3}
              fill={theme.accent.blue}
              opacity={Math.max(0, 1 - (Date.now() - particle.createdAt) / 600)}
              listening={false}
              perfectDrawEnabled={false}
            />
          ))}
          
          {/* Death Animation */}
          {deathAnimation && (
            <Group>
              {/* Explosion effect */}
              <Circle
                x={deathAnimation.x + PLAYER_SIZE / 2}
                y={deathAnimation.y + PLAYER_SIZE / 2}
                radius={PLAYER_SIZE * 2}
                stroke={theme.accent.red}
                strokeWidth={4}
                opacity={0.6}
                listening={false}
              />
              <Circle
                x={deathAnimation.x + PLAYER_SIZE / 2}
                y={deathAnimation.y + PLAYER_SIZE / 2}
                radius={PLAYER_SIZE}
                fill={theme.accent.red}
                opacity={0.4}
                listening={false}
              />
              <Text
                x={deathAnimation.x - 20}
                y={deathAnimation.y - 40}
                text="💀"
                fontSize={32}
                align="center"
                width={PLAYER_SIZE + 40}
                listening={false}
              />
            </Group>
          )}
          
          {/* Respawn Animation */}
          {respawnAnimation && (
            <Group>
              {/* Spawn pulse */}
              <Circle
                x={respawnAnimation.x + PLAYER_SIZE / 2}
                y={respawnAnimation.y + PLAYER_SIZE / 2}
                radius={PLAYER_SIZE * 1.5}
                stroke={theme.accent.green}
                strokeWidth={3}
                opacity={0.5}
                listening={false}
              />
              <Circle
                x={respawnAnimation.x + PLAYER_SIZE / 2}
                y={respawnAnimation.y + PLAYER_SIZE / 2}
                radius={PLAYER_SIZE * 0.8}
                fill={theme.accent.green}
                opacity={0.3}
                listening={false}
              />
              <Text
                x={respawnAnimation.x - 20}
                y={respawnAnimation.y - 40}
                text="✨"
                fontSize={32}
                align="center"
                width={PLAYER_SIZE + 40}
                listening={false}
              />
            </Group>
          )}
        </Layer>
      </Stage>
      
      {/* Change Hair Button */}
      <button
        onClick={() => setShowCustomization(true)}
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '20px',
          width: '48px',
          height: '48px',
          display: isChatPanelVisible ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: theme.gradient.button,
          border: `1px solid ${theme.border.normal}`,
          borderRadius: '10px',
          cursor: 'pointer',
          boxShadow: theme.shadow.md,
          zIndex: 10000,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: isUIVisible ? 1 : 0,
          transform: isUIVisible ? 'translateY(0)' : 'translateY(10px)'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = theme.gradient.hover;
          e.target.style.boxShadow = theme.shadow.lg;
        }}
        onMouseLeave={(e) => {
          e.target.style.background = theme.gradient.button;
          e.target.style.boxShadow = theme.shadow.md;
        }}
        title="Change Hair Style"
      >
        <svg 
          width="22" 
          height="22" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke={theme.text.primary}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="8" r="4" />
          <path d="M8 12c-2 0-4 1-4 3v1h16v-1c0-2-2-3-4-3" />
        </svg>
      </button>
      
      {/* Character Customization Modal */}
      <CharacterCustomization
        isOpen={showCustomization}
        onSelect={handleHatSelect}
        selectedHat={selectedHat}
      />
      
      {/* Chat Panel Backdrop (click outside to close) */}
      {isChatPanelVisible && (
        <div
          onClick={() => setIsChatPanelVisible(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9998, // Below chat panel (9999) but above everything else
            cursor: 'pointer'
          }}
        />
      )}
      
      {/* Chat Panel */}
      <div
        ref={chatPanelRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          zIndex: 9999
        }}
      >
        <ChatPanel
          canvasId={GAME_CANVAS_ID}
          isOpen={isChatPanelVisible}
          onClose={() => setIsChatPanelVisible(false)}
          hasSharedAccess={true}
        />
      </div>
    </div>
  );
}
