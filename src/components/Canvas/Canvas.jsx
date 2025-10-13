import { Stage, Layer, Rect } from "react-konva";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { subscribeToShapes, createShape, updateShape, deleteShape, tryLockShape, unlockShape, staleLockSweeper } from "../../services/canvas";
import { CANVAS_WIDTH, CANVAS_HEIGHT, DEFAULT_RECT } from "./constants";
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

const CANVAS_ID = "global-canvas-v1";

export default function Canvas() {
  const { user } = useAuth();
  const [shapes, setShapes] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [lastError, setLastError] = useState(null);
  const [isDraggingShape, setIsDraggingShape] = useState(false);
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const stageRef = useRef(null);

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
  const handleAddShape = async (type) => {
    // Calculate center of current viewport
    const centerX = (-stagePos.x + window.innerWidth / 2) / stageScale;
    const centerY = (-stagePos.y + window.innerHeight / 2) / stageScale;

    const shapeDefaults = {
      rectangle: { width: 100, height: 100, fill: '#cccccc' },
      circle: { width: 100, height: 100, fill: '#4CAF50' },
      line: { width: 150, height: 0, fill: '#2196F3' },
      text: { width: 200, height: 50, text: 'Double-click to edit', fontSize: 24, fill: '#000000' }
    };

    const shapeData = {
      type,
      x: Math.max(0, Math.min(centerX - 50, CANVAS_WIDTH - 100)),
      y: Math.max(0, Math.min(centerY - 50, CANVAS_HEIGHT - 100)),
      ...shapeDefaults[type]
    };

    createShape(CANVAS_ID, shapeData, user).catch((error) => {
      console.error("[Canvas] Failed to create shape:", error);
      setLastError(String(error));
    });
  };

  // Layer operations
  const handleLayerUp = async () => {
    if (selectedIds.length === 0) return;
    for (const id of selectedIds) {
      const shape = shapes.find(s => s.id === id);
      if (shape) {
        const newZIndex = (shape.zIndex || 0) + 1;
        await updateShape(CANVAS_ID, id, { zIndex: newZIndex }, user);
      }
    }
  };

  const handleLayerDown = async () => {
    if (selectedIds.length === 0) return;
    for (const id of selectedIds) {
      const shape = shapes.find(s => s.id === id);
      if (shape) {
        const newZIndex = Math.max(0, (shape.zIndex || 0) - 1);
        await updateShape(CANVAS_ID, id, { zIndex: newZIndex }, user);
      }
    }
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
      y: -(CANVAS_HEIGHT * stageScale - window.innerHeight)
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
    await updateShape(CANVAS_ID, shapeId, pos, user);
    // Release lock after drag completes
    await unlockShape(CANVAS_ID, shapeId, user?.uid);
  };

  // Handle shape transform end - persist width/height/rotation
  const handleShapeTransformEnd = async (shapeId, attrs) => {
    await updateShape(CANVAS_ID, shapeId, attrs, user);
    // Release lock after transform completes
    await unlockShape(CANVAS_ID, shapeId, user?.uid);
  };

  // Handle lock request for shape
  const handleRequestLock = async (shapeId) => {
    if (!user?.uid) return false;
    return await tryLockShape(CANVAS_ID, shapeId, user.uid);
  };

  // Handle shape selection (with shift-click multi-select)
  const handleShapeSelect = (shapeId, isShiftKey) => {
    if (isShiftKey) {
      // Multi-select: toggle shape in/out of selection
      if (selectedIds.includes(shapeId)) {
        // Remove from selection
        const newIds = selectedIds.filter(id => id !== shapeId);
        setSelectedIds(newIds);
        clearSelection(shapeId);
      } else {
        // Add to selection
        setSelectedIds([...selectedIds, shapeId]);
        if (user?.uid) {
          const name = user.displayName || user.email?.split('@')[0] || 'User';
          const color = generateUserColor(user.uid);
          setSelection(shapeId, user.uid, name, color);
        }
      }
    } else {
      // Single select: clear previous and select new
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

  // Handle stage click (deselect)
  const handleStageClick = (e) => {
    // Deselect if clicked on stage background
    if (e.target === e.target.getStage()) {
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
      <CanvasControls 
        onAddShape={handleAddShape}
        onLayerUp={handleLayerUp}
        onLayerDown={handleLayerDown}
        selectedShape={selectedIds.length === 1 ? selectedIds[0] : null}
      />
      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight - 50}
        draggable={!isDraggingShape}
        x={stagePos.x}
        y={stagePos.y}
        scaleX={stageScale}
        scaleY={stageScale}
        onDragMove={handleStageDragMove}
        onWheel={handleWheel}
        onClick={handleStageClick}
      >
        <Layer>
          {/* Canvas background - listening={false} so clicks pass through to Stage */}
          <Rect 
            x={0} 
            y={0} 
            width={CANVAS_WIDTH} 
            height={CANVAS_HEIGHT} 
            fill="#f8f8f8" 
            listening={false}
          />
          
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
                  x={shape.x + shape.width / 2}
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
        </Layer>
      </Stage>
    </div>
  );
}
