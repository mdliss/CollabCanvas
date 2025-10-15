import { Stage, Layer, Rect, Line as KonvaLine, Group, Circle } from "react-konva";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { subscribeToShapes, createShape, updateShape, deleteShape, tryLockShape, unlockShape, staleLockSweeper } from "../../services/canvas";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "./constants";
import ShapeRenderer from "./ShapeRenderer";
import ShapeToolbar from "./ShapeToolbar";
import DebugNote from "./DebugNote";
import PresenceList from "../Collaboration/PresenceList";
import Cursor from "../Collaboration/Cursor";
import SelectionBadge from "../Collaboration/SelectionBadge";
import ColorPalette from "./ColorPalette";
import PerformanceMonitor, { PerformanceToggleButton } from "../UI/PerformanceMonitor";
import usePresence from "../../hooks/usePresence";
import useCursors from "../../hooks/useCursors";
import useDragStreams from "../../hooks/useDragStreams";
import { usePerformance } from "../../hooks/usePerformance";
import { watchSelections, setSelection, clearSelection } from "../../services/selection";
import { stopDragStream } from "../../services/dragStream";
import { generateUserColor } from "../../services/presence";
import { shapeIntersectsBox } from "../../utils/geometry";
import { ref, remove } from "firebase/database";
import { rtdb } from "../../services/firebase";
import { performanceMonitor } from "../../services/performance";

const CANVAS_ID = "global-canvas-v1";
const GRID_SIZE = 50;
const GRID_COLOR = "#e0e0e0";
const LOCK_TTL_MS = 8000;

export default function Canvas() {
  const { user } = useAuth();
  const [shapes, setShapes] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [lastError, setLastError] = useState(null);
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  
  const [stageScale, setStageScale] = useState(() => {
    const saved = localStorage.getItem('collabcanvas-viewport');
    return saved ? JSON.parse(saved).scale : 0.5;
  });
  const [stagePos, setStagePos] = useState(() => {
    const saved = localStorage.getItem('collabcanvas-viewport');
    if (saved) return JSON.parse(saved).pos;
    const centerX = -(CANVAS_WIDTH * 0.5 - window.innerWidth) / 2;
    const centerY = -(CANVAS_HEIGHT * 0.5 - (window.innerHeight - 50)) / 2;
    return { x: centerX, y: centerY };
  });
  const stageRef = useRef(null);
  const [mousePos, setMousePos] = useState(null);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const lastUpdateTimeRef = useRef(0);
  const [selectionBox, setSelectionBox] = useState(null);
  const selectionStartRef = useRef(null);
  const panStartRef = useRef(null);
  const panInitialPosRef = useRef(null);

  const { onlineUsers } = usePresence();
  const { cursors } = useCursors(stageRef);
  const { activeDrags } = useDragStreams();
  const [selections, setSelections] = useState({});
  const { setEditing, isVisible, toggleVisibility } = usePerformance();

  useEffect(() => {
    const unsubscribe = watchSelections(setSelections);
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Initialize performance monitoring
  useEffect(() => {
    performanceMonitor.init();
    return () => performanceMonitor.destroy();
  }, []);

  useEffect(() => {
    localStorage.setItem('collabcanvas-viewport', JSON.stringify({
      scale: stageScale,
      pos: stagePos
    }));
  }, [stageScale, stagePos]);

  useEffect(() => {
    let unsub = () => {};
    (async () => {
      unsub = await subscribeToShapes(CANVAS_ID, setShapes);
    })();
    return () => { 
      try { 
        unsub && unsub(); 
      } catch (error) {
        console.error("[Canvas] Unsubscribe error:", error);
      } 
    };
  }, []);

  const showFeedback = (message) => {
    setFeedbackMessage(message);
    setTimeout(() => setFeedbackMessage(null), 2000);
  };

  useEffect(() => {
    const handleKeyDown = async (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      if (e.key === ' ' && !isSpacePressed) {
        e.preventDefault();
        setIsSpacePressed(true);
        return;
      }
      
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
            e.preventDefault();
            handleAddShape(e.shiftKey ? 'triangle' : 'text');
            break;
          case 's':
            e.preventDefault();
            handleAddShape('star');
            break;
          case 'v':
            e.preventDefault();
            if (selectedIds.length > 0) {
              selectedIds.forEach(id => clearSelection(id));
              setSelectedIds([]);
            }
            break;
        }
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

  const handleAddShape = (type) => {
    const centerX = (-stagePos.x + window.innerWidth / 2) / stageScale;
    const centerY = (-stagePos.y + (window.innerHeight - 50) / 2) / stageScale;
    
    let shapeData = {
      type,
      fill: '#cccccc',
      x: centerX,
      y: centerY
    };

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

  const handleWheel = (e) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    const scaleBy = 1.05;
    
    const newScale = e.evt.deltaY > 0 
      ? stageScale / scaleBy 
      : stageScale * scaleBy;
    const clampedScale = Math.max(0.05, Math.min(3, newScale));
    
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

  const clampStagePos = (pos) => {
    const scaledCanvasWidth = CANVAS_WIDTH * stageScale;
    const scaledCanvasHeight = CANVAS_HEIGHT * stageScale;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight - 50;
    
    let clampedX = pos.x;
    let clampedY = pos.y;
    
    if (scaledCanvasWidth > viewportWidth) {
      const minX = -(scaledCanvasWidth - viewportWidth);
      const maxX = 0;
      clampedX = Math.max(minX, Math.min(maxX, pos.x));
    }
    
    if (scaledCanvasHeight > viewportHeight) {
      const minY = -(scaledCanvasHeight - viewportHeight);
      const maxY = 0;
      clampedY = Math.max(minY, Math.min(maxY, pos.y));
    }
    
    return { x: clampedX, y: clampedY };
  };

  const handleShapeDragStart = () => {
    // Shape drag started (prevent stage dragging)
    setEditing(true);
  };

  const handleShapeDragEnd = async (shapeId, pos) => {
    if (import.meta.env.VITE_DEBUG) {
      console.debug('[Canvas] dragEnd persist', shapeId, pos);
    }
    setEditing(false);
    await updateShape(CANVAS_ID, shapeId, pos, user);
    await unlockShape(CANVAS_ID, shapeId, user?.uid);
  };

  const handleShapeTransformStart = () => {
    // Transform started (scaling, rotating)
    setEditing(true);
  };

  const handleShapeTransformEnd = async (shapeId, attrs) => {
    if (import.meta.env.VITE_DEBUG) {
      console.debug('[Canvas] transformEnd persist', shapeId, attrs);
    }
    setEditing(false);
    await updateShape(CANVAS_ID, shapeId, attrs, user);
    await unlockShape(CANVAS_ID, shapeId, user?.uid);
  };

  const handleRequestLock = async (shapeId) => {
    if (!user?.uid) return false;
    const acquired = await tryLockShape(CANVAS_ID, shapeId, user.uid, LOCK_TTL_MS);
    
    if (import.meta.env.VITE_DEBUG) {
      console.debug('[Canvas] lock', shapeId, acquired ? 'acquired' : 'blocked');
    }
    
    return acquired;
  };

  const handleShapeSelect = (shapeId, isShiftKey) => {
    if (isShiftKey) {
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
      if (selectedIds.length > 0) {
        selectedIds.forEach(id => {
          clearSelection(id);
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

  const handleColorChange = async (color) => {
    if (selectedIds.length === 0 || !user) return;
    
    let changedCount = 0;
    let lockedCount = 0;
    
    for (const shapeId of selectedIds) {
      const shape = shapes.find(s => s.id === shapeId);
      if (!shape) continue;
      
      if (shape.isLocked && shape.lockedBy !== user.uid) {
        console.warn(`[ColorChange] Shape ${shapeId} locked by another user`);
        lockedCount++;
        continue;
      }
      
      try {
        await updateShape(CANVAS_ID, shapeId, { fill: color }, user);
        changedCount++;
      } catch (error) {
        console.error(`[ColorChange] Failed to update shape ${shapeId}:`, error);
      }
    }
    
    if (changedCount > 0) {
      showFeedback(`Changed color of ${changedCount} shape${changedCount > 1 ? 's' : ''}`);
    }
    if (lockedCount > 0) {
      setTimeout(() => {
        showFeedback(`${lockedCount} shape${lockedCount > 1 ? 's' : ''} locked by other users`);
      }, 2200);
    }
  };

  const handleStageMouseDown = (e) => {
    if (e.target !== e.target.getStage()) {
      return;
    }

    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();
    
    if (e.evt.button === 1) {
      e.evt.preventDefault();
      setIsPanning(true);
      panStartRef.current = { x: e.evt.clientX, y: e.evt.clientY };
      panInitialPosRef.current = { ...stagePos };
      return;
    }
    
    if (isSpacePressed && e.evt.button === 0) {
      setIsPanning(true);
      panStartRef.current = { x: e.evt.clientX, y: e.evt.clientY };
      panInitialPosRef.current = { ...stagePos };
      return;
    }
    
    if (e.evt.button === 0 && !isSpacePressed) {
      const canvasX = (pointerPos.x - stagePos.x) / stageScale;
      const canvasY = (pointerPos.y - stagePos.y) / stageScale;
      const isShiftKey = e.evt?.shiftKey || false;
      
      if (!isShiftKey && selectedIds.length > 0) {
        selectedIds.forEach(id => clearSelection(id));
        setSelectedIds([]);
      }

      selectionStartRef.current = { x: canvasX, y: canvasY, isShiftKey };
      setSelectionBox({ x: canvasX, y: canvasY, width: 0, height: 0 });
    }
  };

  const handleStageMouseMove = (e) => {
    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();
    const currentTime = Date.now();
    
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
    
    if (pointerPos && currentTime - lastUpdateTimeRef.current > 16) {
      const canvasX = Math.round((pointerPos.x - stagePos.x) / stageScale);
      const canvasY = Math.round((pointerPos.y - stagePos.y) / stageScale);
      
      const delta = Math.abs(canvasX - lastMousePosRef.current.x) + 
                    Math.abs(canvasY - lastMousePosRef.current.y);
      if (delta > 2) {
        setMousePos({ x: canvasX, y: canvasY });
        lastMousePosRef.current = { x: canvasX, y: canvasY };
        lastUpdateTimeRef.current = currentTime;
      }
    }
    
    if (!selectionStartRef.current) return;

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
    if (isPanning) {
      setIsPanning(false);
      panStartRef.current = null;
      panInitialPosRef.current = null;
      return;
    }
    
    if (!selectionStartRef.current || !selectionBox) {
      selectionStartRef.current = null;
      setSelectionBox(null);
      return;
    }

    const intersectingShapes = shapes.filter(shape =>
      shapeIntersectsBox(shape, selectionBox)
    );

    const isShiftKey = selectionStartRef.current.isShiftKey;

    if (intersectingShapes.length > 0) {
      if (isShiftKey) {
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
        const newIds = intersectingShapes.map(s => s.id);
        setSelectedIds(newIds);
        if (user?.uid) {
          const name = user.displayName || user.email?.split('@')[0] || 'User';
          const color = generateUserColor(user.uid);
          newIds.forEach(id => setSelection(id, user.uid, name, color));
        }
      }
    }

    selectionStartRef.current = null;
    setSelectionBox(null);
  };

  const handleStageMouseLeave = () => {
    setMousePos(null);
  };

  const handleStageClick = (e) => {
    if (e.target === e.target.getStage() && !selectionBox && !selectionStartRef.current) {
      if (selectedIds.length > 0) {
        selectedIds.forEach(id => {
          clearSelection(id);
          stopDragStream(id);
        });
      }
      setSelectedIds([]);
    }
  };

  useEffect(() => {
    return () => {
      if (selectedIds.length > 0) {
        selectedIds.forEach(id => {
          clearSelection(id);
          stopDragStream(id);
        });
      }
    };
  }, [selectedIds]);

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

  // Extra cleanup: handle tab close/refresh for presence
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (user?.uid) {
        console.log('[Canvas] beforeunload: cleaning up user', user.uid);
        // Synchronous cleanup before page unloads
        const userRef = ref(rtdb, `sessions/global-canvas-v1/${user.uid}`);
        remove(userRef);
        
        // Clear selections
        selectedIds.forEach(id => clearSelection(id));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user, selectedIds]);

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

  const renderGrid = () => {
    const lines = [];
    
    for (let i = 0; i <= CANVAS_WIDTH; i += GRID_SIZE) {
      lines.push(
        <KonvaLine
          key={`v-${i}`}
          points={[i, 0, i, CANVAS_HEIGHT]}
          stroke={GRID_COLOR}
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
          stroke={GRID_COLOR}
          strokeWidth={1 / stageScale}
          listening={false}
          perfectDrawEnabled={false}
        />
      );
    }
    
    return lines;
  };

  return (
    <div>
      <PerformanceMonitor />
      <PerformanceToggleButton onClick={toggleVisibility} isVisible={isVisible} />
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
                onTransformStart={handleShapeTransformStart}
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
