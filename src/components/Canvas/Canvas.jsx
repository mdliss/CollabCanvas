import { Stage, Layer, Rect, Line as KonvaLine, Group, Circle } from "react-konva";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { subscribeToShapes, createShape, updateShape, deleteShape, tryLockShape, unlockShape, staleLockSweeper, duplicateShapes } from "../../services/canvas";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "./constants";
import ShapeRenderer from "./ShapeRenderer";
import ShapeToolbar from "./ShapeToolbar";
import DebugNote from "./DebugNote";
import PresenceList from "../Collaboration/PresenceList";
import Cursor from "../Collaboration/Cursor";
import SelectionBadge from "../Collaboration/SelectionBadge";
import ColorPalette from "./ColorPalette";
import usePresence from "../../hooks/usePresence";
import useCursors from "../../hooks/useCursors";
import useDragStreams from "../../hooks/useDragStreams";
import { watchSelections, setSelection, clearSelection } from "../../services/selection";
import { stopDragStream } from "../../services/dragStream";
import { generateUserColor } from "../../services/presence";
import { shapeIntersectsBox } from "../../utils/geometry";

const CANVAS_ID = "global-canvas-v1";
const GRID_SIZE = 50; // Larger spacing for expansive canvas
const GRID_COLOR = "#e0e0e0";
const LOCK_TTL_MS = 8000; // 8 seconds

export default function Canvas() {
  const { user } = useAuth();
  const [shapes, setShapes] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [lastError, setLastError] = useState(null);
  const [isDraggingShape, setIsDraggingShape] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  
  // Load viewport from localStorage or use defaults
  // Default: 0.5x zoom, centered on canvas for spacious infinite feel
  const [stageScale, setStageScale] = useState(() => {
    const saved = localStorage.getItem('collabcanvas-viewport');
    return saved ? JSON.parse(saved).scale : 0.5;
  });
  const [stagePos, setStagePos] = useState(() => {
    const saved = localStorage.getItem('collabcanvas-viewport');
    if (saved) return JSON.parse(saved).pos;
    // Center viewport on canvas center (10000, 10000) at 0.5x zoom
    const centerX = -(CANVAS_WIDTH * 0.5 - window.innerWidth) / 2;
    const centerY = -(CANVAS_HEIGHT * 0.5 - (window.innerHeight - 50)) / 2;
    return { x: centerX, y: centerY };
  });
  const stageRef = useRef(null);

  // Mouse position HUD state (canvas coordinates)
  const [mousePos, setMousePos] = useState(null);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const lastUpdateTimeRef = useRef(0);

  // Marquee selection state
  const [selectionBox, setSelectionBox] = useState(null);
  const selectionStartRef = useRef(null);
  
  // Pan tracking state (for manual pan implementation)
  const panStartRef = useRef(null);
  const panInitialPosRef = useRef(null);

  // Presence, cursors, and live drag streams
  const { onlineUsers } = usePresence();
  const { cursors } = useCursors(stageRef);
  const { activeDrags } = useDragStreams();
  const [selections, setSelections] = useState({});

  // Watch selections
  useEffect(() => {
    const unsubscribe = watchSelections(setSelections);
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Log presence and cursor counts
  useEffect(() => {
    console.info("[Canvas] presence:", onlineUsers.length, "cursors:", Object.keys(cursors).length);
  }, [onlineUsers.length, cursors]);

  // Persist viewport to localStorage
  useEffect(() => {
    localStorage.setItem('collabcanvas-viewport', JSON.stringify({
      scale: stageScale,
      pos: stagePos
    }));
  }, [stageScale, stagePos]);

  // Subscribe to shapes from Firestore
  useEffect(() => {
    let unsub = () => {};
    (async () => {
      unsub = await subscribeToShapes(CANVAS_ID, (arr) => {
        console.log("[Canvas] shapes =", arr.length);
        setShapes(arr);
      });
    })();
    return () => { 
      try { 
        unsub && unsub(); 
      } catch (error) {
        console.error("[Canvas] Unsubscribe error:", error);
      } 
    };
  }, []);

  // Handle duplicate shapes
  const handleDuplicate = async () => {
    if (selectedIds.length === 0) return;
    
    try {
      const count = await duplicateShapes(CANVAS_ID, selectedIds, user);
      showFeedback(`Duplicated ${count} shape${count > 1 ? 's' : ''}`);
    } catch (error) {
      console.error("[Canvas] Duplicate failed:", error.message);
      showFeedback("Duplicate failed");
    }
  };


  // Show temporary feedback message
  const showFeedback = (message) => {
    setFeedbackMessage(message);
    setTimeout(() => setFeedbackMessage(null), 2000);
  };

  // Handle keyboard events (shortcuts + delete)
  useEffect(() => {
    const handleKeyDown = async (e) => {
      // Ignore if typing in input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      // Space key for pan mode
      if (e.key === ' ' && !isSpacePressed) {
        e.preventDefault();
        setIsSpacePressed(true);
        return;
      }
      
      // Delete selected shapes
      if ((e.key === "Delete" || e.key === "Backspace") && selectedIds.length > 0) {
        e.preventDefault();
        try {
          for (const id of selectedIds) {
            await deleteShape(CANVAS_ID, id, user);
          }
          selectedIds.forEach(id => clearSelection(id));
          setSelectedIds([]);
        } catch (error) {
          console.error("[Canvas] Delete failed:", error.message);
          setLastError(error.message);
        }
        return;
      }
      
      // Shape creation shortcuts (no modifier keys)
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'r':
            e.preventDefault();
            handleAddShape('rectangle');
            break;
          case 'c':
            e.preventDefault();
            handleAddShape('circle');
            break;
          case 'l':
            e.preventDefault();
            handleAddShape('line');
            break;
          case 't':
            if (e.shiftKey) {
              // Shift+T = Triangle
              e.preventDefault();
              handleAddShape('triangle');
            } else {
              // T = Text
              e.preventDefault();
              handleAddShape('text');
            }
            break;
          // 'd' key removed - diamond shape creation disabled
          case 's':
            e.preventDefault();
            handleAddShape('star');
            break;
          case 'v':
            e.preventDefault();
            // V = Select tool (clear selection)
            if (selectedIds.length > 0) {
              selectedIds.forEach(id => clearSelection(id));
              setSelectedIds([]);
            }
            break;
        }
      }
      
      // Duplicate (Cmd/Ctrl+D)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd' && selectedIds.length > 0) {
        e.preventDefault();
        handleDuplicate();
      }
    };
    
    const handleKeyUp = (e) => {
      if (e.key === ' ') {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [selectedIds, user, isSpacePressed]);

  // Create new shape at viewport center
  const handleAddShape = (type) => {
    // Calculate center of current viewport
    const centerX = (-stagePos.x + window.innerWidth / 2) / stageScale;
    const centerY = (-stagePos.y + (window.innerHeight - 50) / 2) / stageScale;
    
    let shapeData = {
      type,
      fill: '#cccccc',
      x: centerX,
      y: centerY
    };

    // Type-specific defaults
    switch (type) {
      case 'circle':
        shapeData.width = 100; // diameter
        shapeData.height = 100;
        shapeData.x = Math.max(50, Math.min(centerX, CANVAS_WIDTH - 50));
        shapeData.y = Math.max(50, Math.min(centerY, CANVAS_HEIGHT - 50));
        break;
      case 'line':
        shapeData.width = 200;
        shapeData.height = 0;
        shapeData.x = Math.max(0, Math.min(centerX - 100, CANVAS_WIDTH - 200));
        shapeData.y = Math.max(0, Math.min(centerY, CANVAS_HEIGHT));
        break;
      case 'text':
        shapeData.text = 'Text';
        shapeData.fontSize = 24;
        shapeData.fill = '#000000';
        shapeData.width = 200;
        shapeData.height = 30;
        shapeData.x = Math.max(0, Math.min(centerX - 100, CANVAS_WIDTH - 200));
        shapeData.y = Math.max(0, Math.min(centerY - 15, CANVAS_HEIGHT - 30));
        break;
      // Diamond case removed - shape type kept in renderer for backwards compatibility only
      case 'triangle':
        shapeData.width = 100;
        shapeData.height = 100;
        shapeData.x = Math.max(50, Math.min(centerX, CANVAS_WIDTH - 50));
        shapeData.y = Math.max(50, Math.min(centerY, CANVAS_HEIGHT - 50));
        break;
      case 'star':
        shapeData.width = 80;
        shapeData.height = 80;
        shapeData.x = Math.max(40, Math.min(centerX, CANVAS_WIDTH - 40));
        shapeData.y = Math.max(40, Math.min(centerY, CANVAS_HEIGHT - 40));
        break;
      case 'rectangle':
      default:
        shapeData.width = 100;
        shapeData.height = 100;
        shapeData.x = Math.max(0, Math.min(centerX - 50, CANVAS_WIDTH - 100));
        shapeData.y = Math.max(0, Math.min(centerY - 50, CANVAS_HEIGHT - 100));
        break;
    }
    
    createShape(CANVAS_ID, shapeData, user)
      .catch((e) => setLastError(String(e)));
  };

  // Zoom with mousewheel
  const handleWheel = (e) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    const scaleBy = 1.05;
    
    const newScale = e.evt.deltaY > 0 
      ? stageScale / scaleBy 
      : stageScale * scaleBy;
    const clampedScale = Math.max(0.05, Math.min(3, newScale)); // Allow 0.05x (20× zoom out) for large canvas
    
    // Calculate mouse point in canvas space before zoom
    const mousePointTo = {
      x: (pointer.x - stagePos.x) / stageScale,
      y: (pointer.y - stagePos.y) / stageScale
    };
    
    // Calculate new position to keep mouse point anchored
    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale
    };
    
    setStageScale(clampedScale);
    setStagePos(newPos);
  };

  // Clamp stage position to canvas bounds
  const clampStagePos = (pos) => {
    // Calculate scaled canvas dimensions
    const scaledCanvasWidth = CANVAS_WIDTH * stageScale;
    const scaledCanvasHeight = CANVAS_HEIGHT * stageScale;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight - 50;
    
    let clampedX = pos.x;
    let clampedY = pos.y;
    
    // Only clamp if canvas is larger than viewport
    if (scaledCanvasWidth > viewportWidth) {
      // Stage position ranges from 0 (canvas left edge at screen left)
      // to -(scaledCanvasWidth - viewportWidth) (canvas right edge at screen right)
      const minX = -(scaledCanvasWidth - viewportWidth);
      const maxX = 0;
      clampedX = Math.max(minX, Math.min(maxX, pos.x));
    } else {
      // Canvas smaller than viewport - allow free positioning or center
      // For now, allow free positioning (user can pan anywhere)
      clampedX = pos.x;
    }
    
    if (scaledCanvasHeight > viewportHeight) {
      const minY = -(scaledCanvasHeight - viewportHeight);
      const maxY = 0;
      clampedY = Math.max(minY, Math.min(maxY, pos.y));
    } else {
      clampedY = pos.y;
    }
    
    return {
      x: clampedX,
      y: clampedY
    };
  };

  // Handle shape drag start - disable stage dragging
  const handleShapeDragStart = () => {
    setIsDraggingShape(true);
  };

  // Handle shape drag end - persist to Firestore, unlock, and re-enable stage dragging
  const handleShapeDragEnd = async (shapeId, pos) => {
    setIsDraggingShape(false);
    
    if (import.meta.env.VITE_DEBUG) {
      console.debug('[Canvas] dragEnd persist', shapeId, pos);
    }
    
    await updateShape(CANVAS_ID, shapeId, pos, user);
    // Release lock after drag completes
    await unlockShape(CANVAS_ID, shapeId, user?.uid);
  };

  // Handle shape transform end - persist width/height/rotation
  const handleShapeTransformEnd = async (shapeId, attrs) => {
    if (import.meta.env.VITE_DEBUG) {
      console.debug('[Canvas] transformEnd persist', shapeId, attrs);
    }
    
    await updateShape(CANVAS_ID, shapeId, attrs, user);
    // Release lock after transform completes
    await unlockShape(CANVAS_ID, shapeId, user?.uid);
  };

  // Handle lock request for shape
  const handleRequestLock = async (shapeId) => {
    if (!user?.uid) return false;
    const acquired = await tryLockShape(CANVAS_ID, shapeId, user.uid, LOCK_TTL_MS);
    
    if (import.meta.env.VITE_DEBUG) {
      console.debug('[Canvas] lock', shapeId, acquired ? 'acquired' : 'blocked');
    }
    
    return acquired;
  };

  // Handle shape selection (with shift-click multi-select)
  const handleShapeSelect = (shapeId, isShiftKey) => {
    if (isShiftKey) {
      // Add to selection
      if (!selectedIds.includes(shapeId)) {
        const newIds = [...selectedIds, shapeId];
        setSelectedIds(newIds);
        if (user?.uid) {
          const name = user.displayName || user.email?.split('@')[0] || 'User';
          const color = generateUserColor(user.uid);
          setSelection(shapeId, user.uid, name, color);
        }
      }
    } else {
      // Replace selection - stop drag streams for previously selected shapes
      if (selectedIds.length > 0) {
        selectedIds.forEach(id => {
          clearSelection(id);
          // Stop any active drag streams for deselected shapes
          stopDragStream(id);
        });
      }
      setSelectedIds([shapeId]);
      if (user?.uid) {
        const name = user.displayName || user.email?.split('@')[0] || 'User';
        const color = generateUserColor(user.uid);
        setSelection(shapeId, user.uid, name, color);
      }
    }
  };

  // Handle color change for selected shapes
  const handleColorChange = async (color) => {
    if (selectedIds.length === 0 || !user) return;
    
    let changedCount = 0;
    let lockedCount = 0;
    
    // Apply color to all selected shapes
    for (const shapeId of selectedIds) {
      const shape = shapes.find(s => s.id === shapeId);
      if (!shape) continue;
      
      // Skip if locked by another user
      if (shape.isLocked && shape.lockedBy !== user.uid) {
        console.warn(`[ColorChange] Shape ${shapeId} locked by another user`);
        lockedCount++;
        continue;
      }
      
      try {
        // Apply color to fill property (works for all shape types)
        await updateShape(CANVAS_ID, shapeId, { fill: color }, user);
        changedCount++;
      } catch (error) {
        console.error(`[ColorChange] Failed to update shape ${shapeId}:`, error);
      }
    }
    
    // Show feedback
    if (changedCount > 0) {
      showFeedback(`Changed color of ${changedCount} shape${changedCount > 1 ? 's' : ''}`);
    }
    if (lockedCount > 0) {
      setTimeout(() => {
        showFeedback(`${lockedCount} shape${lockedCount > 1 ? 's' : ''} locked by other users`);
      }, 2200);
    }
  };

  // Marquee selection and pan handlers
  const handleStageMouseDown = (e) => {
    // Only handle stage background clicks (not on shapes)
    if (e.target !== e.target.getStage()) {
      return;
    }

    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();
    
    // Middle-mouse button = pan
    if (e.evt.button === 1) {
      e.evt.preventDefault();
      setIsPanning(true);
      panStartRef.current = { x: e.evt.clientX, y: e.evt.clientY };
      panInitialPosRef.current = { ...stagePos };
      return;
    }
    
    // Space + left-mouse = pan
    if (isSpacePressed && e.evt.button === 0) {
      setIsPanning(true);
      panStartRef.current = { x: e.evt.clientX, y: e.evt.clientY };
      panInitialPosRef.current = { ...stagePos };
      return;
    }
    
    // Left-mouse on background = marquee selection
    if (e.evt.button === 0 && !isSpacePressed) {
      // Convert screen coordinates to canvas coordinates
      const canvasX = (pointerPos.x - stagePos.x) / stageScale;
      const canvasY = (pointerPos.y - stagePos.y) / stageScale;

      // Check if shift key is pressed
      const isShiftKey = e.evt?.shiftKey || false;
      
      // If not shift-click, clear existing selection
      if (!isShiftKey && selectedIds.length > 0) {
        selectedIds.forEach(id => clearSelection(id));
        setSelectedIds([]);
      }

      // Start marquee selection
      selectionStartRef.current = { x: canvasX, y: canvasY, isShiftKey };
      setSelectionBox({ x: canvasX, y: canvasY, width: 0, height: 0 });
    }
  };

  const handleStageMouseMove = (e) => {
    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();
    const currentTime = Date.now();
    
    // Handle panning if active - use screen-space delta for perfect accuracy
    if (isPanning && panStartRef.current && panInitialPosRef.current) {
      const deltaX = e.evt.clientX - panStartRef.current.x;
      const deltaY = e.evt.clientY - panStartRef.current.y;
      
      const newPos = {
        x: panInitialPosRef.current.x + deltaX,
        y: panInitialPosRef.current.y + deltaY
      };
      
      setStagePos(clampStagePos(newPos));
      return;
    }
    
    // Update HUD with throttling (~16ms for ~60fps)
    if (pointerPos && currentTime - lastUpdateTimeRef.current > 16) {
      // Convert screen coordinates to canvas coordinates
      const canvasX = Math.round((pointerPos.x - stagePos.x) / stageScale);
      const canvasY = Math.round((pointerPos.y - stagePos.y) / stageScale);
      
      // Only update if moved >2px
      const delta = Math.abs(canvasX - lastMousePosRef.current.x) + 
                    Math.abs(canvasY - lastMousePosRef.current.y);
      if (delta > 2) {
        setMousePos({ x: canvasX, y: canvasY });
        lastMousePosRef.current = { x: canvasX, y: canvasY };
        lastUpdateTimeRef.current = currentTime;
      }
    }
    
    // Handle marquee selection if active
    if (!selectionStartRef.current) return;

    // Convert screen coordinates to canvas coordinates
    const canvasX = (pointerPos.x - stagePos.x) / stageScale;
    const canvasY = (pointerPos.y - stagePos.y) / stageScale;

    const startX = selectionStartRef.current.x;
    const startY = selectionStartRef.current.y;

    setSelectionBox({
      x: startX,
      y: startY,
      width: canvasX - startX,
      height: canvasY - startY
    });
  };

  const handleStageMouseUp = () => {
    // End panning
    if (isPanning) {
      setIsPanning(false);
      panStartRef.current = null;
      panInitialPosRef.current = null;
      return;
    }
    
    // Handle marquee selection completion
    if (!selectionStartRef.current || !selectionBox) {
      selectionStartRef.current = null;
      setSelectionBox(null);
      return;
    }

    // Find shapes that intersect with the selection box
    const intersectingShapes = shapes.filter(shape =>
      shapeIntersectsBox(shape, selectionBox)
    );

    const isShiftKey = selectionStartRef.current.isShiftKey;

    if (intersectingShapes.length > 0) {
      if (isShiftKey) {
        // Add to existing selection
        const newIds = [...selectedIds];
        intersectingShapes.forEach(shape => {
          if (!newIds.includes(shape.id)) {
            newIds.push(shape.id);
            if (user?.uid) {
              const name = user.displayName || user.email?.split('@')[0] || 'User';
              const color = generateUserColor(user.uid);
              setSelection(shape.id, user.uid, name, color);
            }
          }
        });
        setSelectedIds(newIds);
      } else {
        // Replace selection
        const newIds = intersectingShapes.map(s => s.id);
        setSelectedIds(newIds);
        if (user?.uid) {
          const name = user.displayName || user.email?.split('@')[0] || 'User';
          const color = generateUserColor(user.uid);
          newIds.forEach(id => setSelection(id, user.uid, name, color));
        }
      }
    }

    // Clear marquee state
    selectionStartRef.current = null;
    setSelectionBox(null);
  };

  const handleStageMouseLeave = () => {
    // Hide HUD when mouse leaves stage
    setMousePos(null);
  };

  // Handle stage click (deselect) - kept for backward compatibility
  const handleStageClick = (e) => {
    // This is now mostly handled by mousedown/mouseup
    // But we keep it to ensure clicks without drag still deselect
    if (e.target === e.target.getStage() && !selectionBox && !selectionStartRef.current) {
      if (selectedIds.length > 0) {
        selectedIds.forEach(id => {
          clearSelection(id);
          // Stop any active drag streams when deselecting
          stopDragStream(id);
        });
      }
      setSelectedIds([]);
    }
  };

  // Clear selections on unmount
  useEffect(() => {
    return () => {
      if (selectedIds.length > 0) {
        selectedIds.forEach(id => {
          clearSelection(id);
          // Stop any active drag streams on unmount
          stopDragStream(id);
        });
      }
    };
  }, [selectedIds]);

  // Stale lock sweeper - run every 2 seconds and on visibility change
  useEffect(() => {
    const interval = setInterval(() => {
      staleLockSweeper(CANVAS_ID);
    }, 2000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        staleLockSweeper(CANVAS_ID);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Debug helper for programmatic text updates (AI integration testing)
  useEffect(() => {
    window.debugUpdateText = (shapeId, newText) => {
      if (!user) {
        console.error('[debugUpdateText] No authenticated user');
        return;
      }
      console.log('[debugUpdateText] Updating shape', shapeId, 'with text:', newText);
      updateShape(CANVAS_ID, shapeId, { text: newText }, user)
        .then(() => console.log('[debugUpdateText] Success!'))
        .catch(err => console.error('[debugUpdateText] Failed:', err));
    };

    window.debugGetShapes = () => {
      console.table(shapes.map(s => ({ 
        id: s.id, 
        type: s.type, 
        text: s.text, 
        x: Math.round(s.x), 
        y: Math.round(s.y) 
      })));
      return shapes;
    };

    return () => {
      delete window.debugUpdateText;
      delete window.debugGetShapes;
    };
  }, [user, shapes]);

  // Render grid lines
  const renderGrid = () => {
    const lines = [];
    
    // Vertical lines
    for (let i = 0; i <= CANVAS_WIDTH; i += GRID_SIZE) {
      lines.push(
        <KonvaLine
          key={`v-${i}`}
          points={[i, 0, i, CANVAS_HEIGHT]}
          stroke={GRID_COLOR}
          strokeWidth={1 / stageScale} // Keep line width constant when zoomed
          listening={false}
          perfectDrawEnabled={false}
        />
      );
    }
    
    // Horizontal lines
    for (let i = 0; i <= CANVAS_HEIGHT; i += GRID_SIZE) {
      lines.push(
        <KonvaLine
          key={`h-${i}`}
          points={[0, i, CANVAS_WIDTH, i]}
          stroke={GRID_COLOR}
          strokeWidth={1 / stageScale} // Keep line width constant when zoomed
          listening={false}
          perfectDrawEnabled={false}
        />
      );
    }
    
    return lines;
  };

  return (
    <div>
      <DebugNote 
        projectId={import.meta.env.VITE_FB_PROJECT_ID} 
        docPath={`canvas/${CANVAS_ID}`} 
        count={shapes.length} 
        error={lastError}
        rtdbUrl={import.meta.env.VITE_FB_DB_URL}
        presenceCount={onlineUsers.length}
        cursorCount={Object.keys(cursors).length}
      />
      <PresenceList users={onlineUsers} />
      <ShapeToolbar 
        onAddShape={handleAddShape} 
        onDuplicate={handleDuplicate}
        selectedCount={selectedIds.length}
      />
      
      {/* Color Palette - shows when shapes are selected */}
      {selectedIds.length > 0 && (
        <ColorPalette
          onColorSelect={handleColorChange}
          selectedCount={selectedIds.length}
        />
      )}
      
      {/* Feedback Toast */}
      {feedbackMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '32px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0, 0, 0, 0.85)',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            zIndex: 10000,
            pointerEvents: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          {feedbackMessage}
        </div>
      )}
      
      {/* Mouse Position HUD */}
      {mousePos && (
        <div
          style={{
            position: 'fixed',
            top: '60px',
            right: '20px',
            background: 'rgba(0, 0, 0, 0.75)',
            color: '#fff',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '13px',
            fontFamily: 'monospace',
            fontWeight: '600',
            zIndex: 9998,
            pointerEvents: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}
        >
          x: {mousePos.x} , y: {mousePos.y}
        </div>
      )}

      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight - 50}
        draggable={false}
        x={stagePos.x}
        y={stagePos.y}
        scaleX={stageScale}
        scaleY={stageScale}
        onWheel={handleWheel}
        onClick={handleStageClick}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onMouseLeave={handleStageMouseLeave}
      >
        <Layer>
          {/* Canvas background - listening={false} so clicks pass through to Stage */}
          <Rect
            x={0} 
            y={0} 
            width={CANVAS_WIDTH} 
            height={CANVAS_HEIGHT} 
            fill="#ffffff" 
            listening={false}
          />
          
          {/* Grid lines */}
          {renderGrid()}
          
          {/* Center indicator - subtle crosshair at canvas center */}
          <Group listening={false}>
            <KonvaLine
              points={[
                CANVAS_WIDTH / 2 - 30, CANVAS_HEIGHT / 2,
                CANVAS_WIDTH / 2 + 30, CANVAS_HEIGHT / 2
              ]}
              stroke="#999999"
              strokeWidth={2 / stageScale}
              opacity={0.4}
              perfectDrawEnabled={false}
            />
            <KonvaLine
              points={[
                CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30,
                CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30
              ]}
              stroke="#999999"
              strokeWidth={2 / stageScale}
              opacity={0.4}
              perfectDrawEnabled={false}
            />
            <Circle
              x={CANVAS_WIDTH / 2}
              y={CANVAS_HEIGHT / 2}
              radius={4 / stageScale}
              fill="#999999"
              opacity={0.6}
              perfectDrawEnabled={false}
            />
          </Group>
          
          {/* Render all shapes with live drag position updates */}
          {shapes.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)).map(shape => {
            // Check if this shape is being dragged by another user
            const dragData = activeDrags[shape.id];
            const isDraggedByOther = dragData && dragData.uid !== user?.uid;
            
            // If being dragged by another user, use live position from drag stream
            const displayShape = isDraggedByOther ? {
              ...shape,
              x: dragData.x,
              y: dragData.y,
              rotation: dragData.rotation || shape.rotation || 0
            } : shape;
            
            return (
              <ShapeRenderer
                key={shape.id}
                shape={displayShape}
                isSelected={selectedIds.includes(shape.id)}
                currentUserId={user?.uid}
                currentUserName={user?.displayName || user?.email?.split('@')[0] || 'User'}
                currentUser={user}
                onSelect={handleShapeSelect}
                onRequestLock={handleRequestLock}
                onDragStart={handleShapeDragStart}
                onDragEnd={handleShapeDragEnd}
                onTransformEnd={handleShapeTransformEnd}
                isBeingDraggedByOther={isDraggedByOther}
                draggedByUserName={isDraggedByOther ? dragData.displayName : null}
              />
            );
          })}

          {/* Render selection badges (for selections and locks) */}
          {shapes.map(shape => {
            const selection = selections[shape.id];
            const isLockedByOther = shape.isLocked && shape.lockedBy && shape.lockedBy !== user?.uid;
            
            // Show badge if selected OR locked by someone else
            if (selection || isLockedByOther) {
              // For locks, we need to get the user's display name from online users
              let badgeName = selection?.name;
              let badgeColor = selection?.color;
              
              if (isLockedByOther) {
                const lockOwner = onlineUsers.find(u => u.uid === shape.lockedBy);
                badgeName = lockOwner ? `🔒 ${lockOwner.displayName}` : "🔒 Locked";
                badgeColor = lockOwner?.color || "#ff0000";
              }
              
              return (
                <SelectionBadge
                  key={`badge-${shape.id}`}
                  x={shape.x + (shape.width || 50) / 2}
                  y={shape.y}
                  name={badgeName}
                  color={badgeColor}
                />
              );
            }
            return null;
          })}

          {/* Render remote user cursors */}
          {Object.entries(cursors).map(([uid, cursor]) => (
            <Cursor key={uid} cursor={cursor} />
          ))}

          {/* Render marquee selection box */}
          {selectionBox && (
            <Rect
              x={selectionBox.x}
              y={selectionBox.y}
              width={selectionBox.width}
              height={selectionBox.height}
              fill="rgba(0, 102, 204, 0.2)"
              stroke="#0066cc"
              strokeWidth={1 / stageScale}
              listening={false}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
}
