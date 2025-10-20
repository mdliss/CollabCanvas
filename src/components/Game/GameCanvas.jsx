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
import usePresence from '../../hooks/usePresence';
import useCursors from '../../hooks/useCursors';

const GAME_CANVAS_ID = 'game-canvas-platformer';
const PLAYER_SIZE = 40;
const PLAYER_SPEED = 10;
const JUMP_VELOCITY = -22;
const GRAVITY = 0.9;
const BULLET_SPEED = 20;
const BULLET_SIZE = 8;
const CANVAS_WIDTH = 5000;
const CANVAS_HEIGHT = 3000;
const GRID_SIZE = 50;

// Static platform layout - Donkey Kong style
const PLATFORMS = [
  // Ground level
  { id: 'platform_0', x: 0, y: 2800, width: 5000, strokeWidth: 20 },
  // Level 1 - low platforms (350px gap vertically)
  { id: 'platform_1a', x: 400, y: 2450, width: 1200, strokeWidth: 15 },
  { id: 'platform_1b', x: 2000, y: 2450, width: 1200, strokeWidth: 15 },
  { id: 'platform_1c', x: 3600, y: 2450, width: 1200, strokeWidth: 15 },
  // Level 2 - mid platforms (350px gap)
  { id: 'platform_2a', x: 800, y: 2100, width: 1100, strokeWidth: 15 },
  { id: 'platform_2b', x: 2400, y: 2100, width: 1100, strokeWidth: 15 },
  { id: 'platform_2c', x: 4000, y: 2100, width: 800, strokeWidth: 15 },
  // Level 3 - high platforms (350px gap)
  { id: 'platform_3a', x: 200, y: 1750, width: 1000, strokeWidth: 15 },
  { id: 'platform_3b', x: 1800, y: 1750, width: 1000, strokeWidth: 15 },
  { id: 'platform_3c', x: 3400, y: 1750, width: 1000, strokeWidth: 15 },
  // Level 4 - top platforms (350px gap)
  { id: 'platform_4a', x: 600, y: 1400, width: 900, strokeWidth: 15 },
  { id: 'platform_4b', x: 2200, y: 1400, width: 900, strokeWidth: 15 },
  { id: 'platform_4c', x: 3800, y: 1400, width: 900, strokeWidth: 15 },
  // Level 5 - highest platforms (350px gap)
  { id: 'platform_5a', x: 400, y: 1050, width: 800, strokeWidth: 15 },
  { id: 'platform_5b', x: 1800, y: 1050, width: 800, strokeWidth: 15 },
  { id: 'platform_5c', x: 3200, y: 1050, width: 800, strokeWidth: 15 }
];

// Spawn points
const SPAWN_POINTS = [
  { x: 600, y: 950 },
  { x: 2000, y: 950 },
  { x: 3400, y: 950 },
  { x: 1000, y: 1300 },
  { x: 2500, y: 1650 }
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
  const localBulletsRef = useRef([]); // Use ref for 60 FPS updates
  
  // Local player state
  const [localPlayer, setLocalPlayer] = useState({
    x: 2000,
    y: 950,
    velocityY: 0,
    facingRight: true,
    isOnGround: false
  });
  
  // Input state
  const keysPressed = useRef({});
  const lastShootTime = useRef(0);
  
  // Camera state - centered view
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale] = useState(0.6);
  
  // UI state
  const [kills, setKills] = useState(0);
  const [deaths, setDeaths] = useState(0);
  const [isUIVisible, setIsUIVisible] = useState(false);
  const [isChatPanelVisible, setIsChatPanelVisible] = useState(false);
  
  // Center canvas on load
  useEffect(() => {
    const centeredX = (window.innerWidth - CANVAS_WIDTH * stageScale) / 2;
    const centeredY = (window.innerHeight - CANVAS_HEIGHT * stageScale) / 2;
    setStagePos({ x: centeredX, y: centeredY });
  }, [stageScale]);
  
  // Subscribe to multiplayer state
  useEffect(() => {
    if (!user) return;
    
    const unsubPlayers = subscribeToPlayers((remotePlayers) => {
      // Filter out local player
      setPlayers(remotePlayers.filter(p => p.uid !== user.uid));
    });
    
    const unsubBullets = subscribeToBullets(setBullets);
    
    return () => {
      unsubPlayers();
      unsubBullets();
      removePlayer(user.uid);
    };
  }, [user]);
  
  // Trigger UI entrance animation
  useEffect(() => {
    setTimeout(() => setIsUIVisible(true), 150);
  }, []);
  
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
    
    // Add to local bullets ref for immediate rendering
    localBulletsRef.current.push(bulletData);
    
    // Sync to RTDB for multiplayer (non-blocking)
    createBullet(bulletData).catch(() => {
      console.log('[Game] Bullet sync failed (non-critical)');
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
        
        // Horizontal movement
        if (keysPressed.current['ArrowLeft']) {
          newX -= PLAYER_SPEED;
          newFacingRight = false;
        }
        if (keysPressed.current['ArrowRight']) {
          newX += PLAYER_SPEED;
          newFacingRight = true;
        }
        
        // Jumping
        if (keysPressed.current['ArrowUp'] && prev.isOnGround) {
          newVelocityY = JUMP_VELOCITY;
          newIsOnGround = false;
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
          isOnGround: newIsOnGround
        };
      });
      
      // Update bullet positions
      localBulletsRef.current = localBulletsRef.current.map(bullet => ({
        ...bullet,
        x: bullet.x + bullet.velocityX
      })).filter(bullet => {
        // Remove if out of bounds or too old
        const age = Date.now() - bullet.createdAt;
        const inBounds = bullet.x >= -100 && bullet.x <= CANVAS_WIDTH + 100;
        return inBounds && age < 5000;
      });
      
      // Check bullet collisions
      const allBullets = [...localBulletsRef.current, ...bullets];
      allBullets.forEach(bullet => {
        const hitPlayer = [...players, {
          uid: user.uid,
          x: localPlayer.x,
          y: localPlayer.y
        }].find(p => {
          if (p.uid === bullet.ownerId) return false;
          
          return bullet.x >= p.x && bullet.x <= p.x + PLAYER_SIZE &&
                 bullet.y >= p.y && bullet.y <= p.y + PLAYER_SIZE;
        });
        
        if (hitPlayer) {
          // Remove bullet
          localBulletsRef.current = localBulletsRef.current.filter(b => b.id !== bullet.id);
          removeBullet(bullet.id).catch(() => {});
          
          // If hit local player, respawn
          if (hitPlayer.uid === user.uid) {
            const spawn = SPAWN_POINTS[Math.floor(Math.random() * SPAWN_POINTS.length)];
            setLocalPlayer(prev => ({
              ...prev,
              x: spawn.x,
              y: spawn.y,
              velocityY: 0
            }));
            setDeaths(d => d + 1);
          } else {
            setKills(k => k + 1);
          }
        }
      });
    };
    
    const gameLoopInterval = setInterval(gameLoop, 1000 / 60); // 60 FPS
    
    return () => clearInterval(gameLoopInterval);
  }, [user, players, bullets, checkPlatformCollision, localPlayer.x, localPlayer.y]);
  
  // Update remote player position
  useEffect(() => {
    if (!user) return;
    
    const updateInterval = setInterval(() => {
      updatePlayer(user.uid, {
        uid: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'Player',
        x: localPlayer.x,
        y: localPlayer.y,
        facingRight: localPlayer.facingRight
      }).catch(() => {
        // Silently fail - game works client-side
      });
    }, 1000 / 20); // 20 updates per second
    
    return () => clearInterval(updateInterval);
  }, [user, localPlayer]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (user) {
        removePlayer(user.uid).catch(() => {});
      }
    };
  }, [user]);
  
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
  
  // Render stick figure player
  const renderPlayer = (player, isLocal = false) => {
    const color = isLocal ? theme.button.primary : theme.accent.blue;
    const x = player.x;
    const y = player.y;
    const size = PLAYER_SIZE;
    const facingRight = player.facingRight;
    
    return (
      <Group key={player.uid || 'local'}>
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
          Arrow keys to move • Up to jump • Space to shoot • M for chat
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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isChatPanelVisible ? theme.button.primary : theme.gradient.button,
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
          e.target.style.background = isChatPanelVisible ? theme.button.primaryHover : theme.gradient.hover;
          e.target.style.boxShadow = theme.shadow.lg;
        }}
        onMouseLeave={(e) => {
          e.target.style.background = isChatPanelVisible ? theme.button.primary : theme.gradient.button;
          e.target.style.boxShadow = theme.shadow.md;
        }}
        title="Chat (M)"
      >
        <svg 
          width="22" 
          height="22" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke={isChatPanelVisible ? theme.text.inverse : theme.text.primary}
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
            ...localPlayer
          }, true)}
          
          {/* Local bullets (smooth client-side movement) */}
          {localBulletsRef.current.map(renderBullet)}
          
          {/* Remote bullets from other players */}
          {bullets.filter(b => b.ownerId !== user?.uid).map(renderBullet)}
        </Layer>
      </Stage>
      
      {/* Chat Panel */}
      <ChatPanel
        canvasId={GAME_CANVAS_ID}
        isOpen={isChatPanelVisible}
        onClose={() => setIsChatPanelVisible(false)}
        hasSharedAccess={true}
      />
    </div>
  );
}
