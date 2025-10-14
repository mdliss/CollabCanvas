import { Stage, Layer, Rect, Line as KonvaLine } from "react-konva";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { subscribeToShapes, createShape, updateShape, deleteShape, tryLockShape, unlockShape, staleLockSweeper } from "../../services/canvas";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "./constants";
import ShapeRenderer from "./ShapeRenderer";
import CanvasControls from "./CanvasControls";
import DebugNote from "./DebugNote";
import PresenceList from "../Collaboration/PresenceList";
import Cursor from "../Collaboration/Cursor";
import SelectionBadge from "../Collaboration/SelectionBadge";
import usePresence from "../../hooks/usePresence";
import useCursors from "../../hooks/useCursors";
import { watchSelections, setSelection, clearSelection } from "../../services/selection";
import { generateUserColor } from "../../services/presence";
import { shapeIntersectsBox } from "../../utils/geometry";

const CANVAS_ID = "global-canvas-v1";
const GRID_SIZE = 50;
const GRID_COLOR = "#e0e0e0";

export default function Canvas() {
  const { user } = useAuth();
  const [shapes, setShapes] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [lastError, setLastError] = useState(null);
  const [isDraggingShape, setIsDraggingShape] = useState(false);
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const stageRef = useRef(null);

  // Mouse position HUD state (canvas coordinates)
  const [mousePos, setMousePos] = useState(null);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const lastUpdateTimeRef = useRef(0);

  // Marquee selection state
  const [selectionBox, setSelectionBox] = useState(null);
  const selectionStartRef = useRef(null);

  // Presence and cursors
  const { onlineUsers } = usePresence();
  const { cursors } = useCursors(stageRef);
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

  // Handle keyboard events (Delete/Backspace to delete selected shapes)
  useEffect(() => {
    const handleKeyDown = async (e) => {
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
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIds, user]);

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
    const clampedScale = Math.max(0.2, Math.min(3, newScale));
    
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

  // Clamp stage panning to canvas bounds
  const handleStageDragMove = (e) => {
    const stage = e.target;
    const maxPos = { x: 0, y: 0 };
    const minPos = {
      x: -(CANVAS_WIDTH * stageScale - window.innerWidth),
      y: -(CANVAS_HEIGHT * stageScale - (window.innerHeight - 50))
    };
    
    const clampedPos = {
      x: Math.max(Math.min(stage.x(), maxPos.x), isFinite(minPos.x) ? minPos.x : stage.x()),
      y: Math.max(Math.min(stage.y(), maxPos.y), isFinite(minPos.y) ? minPos.y : stage.y())
    };
    
    setStagePos(clampedPos);
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
    const acquired = await tryLockShape(CANVAS_ID, shapeId, user.uid);
    
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
      // Replace selection
      if (selectedIds.length > 0) {
        selectedIds.forEach(id => clearSelection(id));
      }
      setSelectedIds([shapeId]);
      if (user?.uid) {
        const name = user.displayName || user.email?.split('@')[0] || 'User';
        const color = generateUserColor(user.uid);
        setSelection(shapeId, user.uid, name, color);
      }
    }
  };

  // Marquee selection handlers
  const handleStageMouseDown = (e) => {
    // Only start marquee if clicking on stage background (not on a shape)
    if (e.target !== e.target.getStage()) {
      return;
    }

    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();
    
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
  };

  const handleStageMouseMove = (e) => {
    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();
    const currentTime = Date.now();
    
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
        selectedIds.forEach(id => clearSelection(id));
      }
      setSelectedIds([]);
    }
  };

  // Clear selections on unmount
  useEffect(() => {
    return () => {
      if (selectedIds.length > 0) {
        selectedIds.forEach(id => clearSelection(id));
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
      <CanvasControls onAddShape={handleAddShape} />
      
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
        draggable={!isDraggingShape && !selectionBox}
        x={stagePos.x}
        y={stagePos.y}
        scaleX={stageScale}
        scaleY={stageScale}
        onDragMove={handleStageDragMove}
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
          
          {/* Render all shapes */}
          {shapes.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)).map(shape => (
            <ShapeRenderer
              key={shape.id}
              shape={shape}
              isSelected={selectedIds.includes(shape.id)}
              currentUserId={user?.uid}
              onSelect={handleShapeSelect}
              onRequestLock={handleRequestLock}
              onDragStart={handleShapeDragStart}
              onDragEnd={handleShapeDragEnd}
              onTransformEnd={handleShapeTransformEnd}
            />
          ))}

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
