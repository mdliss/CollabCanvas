import { Stage, Layer, Rect } from "react-konva";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { subscribeToShapes, createShape, updateShape, deleteShape } from "../../services/canvas";
import { CANVAS_WIDTH, CANVAS_HEIGHT, DEFAULT_RECT } from "./constants";
import Shape from "./Shape";
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
  const [selectedId, setSelectedId] = useState(null);
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

  // Handle keyboard events (Delete/Backspace to delete selected shape)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        deleteShape(CANVAS_ID, selectedId);
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId]);

  // Create new rectangle at viewport center
  const handleAddRectangle = () => {
    // Calculate center of current viewport
    const centerX = (-stagePos.x + window.innerWidth / 2) / stageScale;
    const centerY = (-stagePos.y + window.innerHeight / 2) / stageScale;
    
    createShape(CANVAS_ID, {
      ...DEFAULT_RECT,
      x: Math.max(0, Math.min(centerX - DEFAULT_RECT.width / 2, CANVAS_WIDTH - DEFAULT_RECT.width)),
      y: Math.max(0, Math.min(centerY - DEFAULT_RECT.height / 2, CANVAS_HEIGHT - DEFAULT_RECT.height))
    }, user)
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

  // Handle shape drag end - persist to Firestore and re-enable stage dragging
  const handleShapeDragEnd = (shapeId, pos) => {
    setIsDraggingShape(false);
    updateShape(CANVAS_ID, shapeId, pos, user);
  };

  // Handle shape selection
  const handleShapeSelect = (shapeId) => {
    // Clear previous selection
    if (selectedId && selectedId !== shapeId) {
      clearSelection(selectedId);
    }
    
    // Set new selection
    setSelectedId(shapeId);
    
    // Track selection in RTDB
    if (user?.uid) {
      const name = user.displayName || user.email?.split('@')[0] || 'User';
      const color = generateUserColor(user.uid);
      setSelection(shapeId, user.uid, name, color);
    }
  };

  // Handle stage click (deselect)
  const handleStageClick = (e) => {
    // Deselect if clicked on stage background
    if (e.target === e.target.getStage()) {
      if (selectedId) {
        clearSelection(selectedId);
      }
      setSelectedId(null);
    }
  };

  // Clear selection on unmount or when selected shape changes
  useEffect(() => {
    return () => {
      if (selectedId) {
        clearSelection(selectedId);
      }
    };
  }, [selectedId]);

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
      <CanvasControls onAddRectangle={handleAddRectangle} />
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
          {shapes.map(shape => (
            <Shape
              key={shape.id}
              shape={shape}
              isSelected={shape.id === selectedId}
              onSelect={handleShapeSelect}
              onDragStart={handleShapeDragStart}
              onDragEnd={handleShapeDragEnd}
            />
          ))}

          {/* Render selection badges */}
          {shapes.map(shape => {
            const selection = selections[shape.id];
            if (selection) {
              return (
                <SelectionBadge
                  key={`badge-${shape.id}`}
                  x={shape.x + shape.width / 2}
                  y={shape.y}
                  name={selection.name}
                  color={selection.color}
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
