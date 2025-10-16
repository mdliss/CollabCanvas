import { Stage, Layer, Rect, Line as KonvaLine, Group, Circle } from "react-konva";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { subscribeToShapes, createShape, updateShape, deleteShape, tryLockShape, unlockShape, bringToFront, sendToBack, bringForward, sendBackward } from "../../services/canvasRTDB";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "./constants";
import ShapeRenderer from "./ShapeRenderer";
import ShapeToolbar from "./ShapeToolbar";
import DebugNote from "./DebugNote";
import PresenceList from "../Collaboration/PresenceList";
import Cursor from "../Collaboration/Cursor";
import SelectionBadge from "../Collaboration/SelectionBadge";
import ColorPalette from "./ColorPalette";
import PerformanceMonitor, { PerformanceToggleButton } from "../UI/PerformanceMonitor";
import HelpMenu from "../UI/HelpMenu";
import ConnectionStatus from "../UI/ConnectionStatus";
import TextFormattingToolbar from "../UI/TextFormattingToolbar";
import LayersPanel from "../UI/LayersPanel";
import HistoryTimeline from "../UI/HistoryTimeline";
import ContextMenu from "../UI/ContextMenu";
import usePresence from "../../hooks/usePresence";
import useCursors from "../../hooks/useCursors";
import useDragStreams from "../../hooks/useDragStreams";
import { usePerformance } from "../../hooks/usePerformance";
import { useUndo } from "../../contexts/UndoContext";
import { CreateShapeCommand, UpdateShapeCommand, DeleteShapeCommand, MoveShapeCommand } from "../../utils/commands";
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
  const [isHelpVisible, setIsHelpVisible] = useState(false);
  const [textToolbarVisible, setTextToolbarVisible] = useState(false);
  const [textToolbarPosition, setTextToolbarPosition] = useState({ x: 0, y: 0 });
  const [isLayersPanelVisible, setIsLayersPanelVisible] = useState(false);
  const [copiedShapes, setCopiedShapes] = useState([]);
  const [contextMenu, setContextMenu] = useState(null); // { x, y, shapeId }
  const [dragDebugInfo, setDragDebugInfo] = useState(null); // Debug info for drag bounds
  
  const [stageScale, setStageScale] = useState(() => {
    const saved = localStorage.getItem('collabcanvas-viewport');
    return saved ? JSON.parse(saved).scale : 0.5;
  });
  
  // Helper function to calculate centered viewport position
  const getCenteredPosition = useCallback((scale = 0.5) => {
    // Center the canvas in the viewport at the given scale
    const scaledCanvasWidth = CANVAS_WIDTH * scale;
    const scaledCanvasHeight = CANVAS_HEIGHT * scale;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight - 50; // Account for toolbar
    
    return {
      x: (viewportWidth - scaledCanvasWidth) / 2,
      y: (viewportHeight - scaledCanvasHeight) / 2
    };
  }, []);
  
  const [stagePos, setStagePos] = useState(() => {
    // ALWAYS start centered on page load - ignore saved position
    const scaledCanvasWidth = CANVAS_WIDTH * 0.5;
    const scaledCanvasHeight = CANVAS_HEIGHT * 0.5;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight - 50;
    
    return {
      x: (viewportWidth - scaledCanvasWidth) / 2,
      y: (viewportHeight - scaledCanvasHeight) / 2
    };
  });
  const stageRef = useRef(null);
  const [mousePos, setMousePos] = useState(null);
  const dragStartStateRef = useRef({}); // Store initial state for undo
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
  const { undo, redo, canUndo, canRedo, execute, startBatch, endBatch } = useUndo();

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
    if (!user) return;
    
    console.log('[Canvas] Subscribing to RTDB shapes...');
    
    // Subscribe to RTDB - no conflicts, no snapping!
    const unsub = subscribeToShapes(CANVAS_ID, (newShapes) => {
      console.log('[Canvas] RTDB shapes updated. Count:', newShapes.length);
      setShapes(newShapes);
    });
    
    return () => { 
      console.log('[Canvas] Unsubscribing from RTDB shapes');
      unsub();
    };
  }, [user]);

  // Show text formatting toolbar when a single text shape is selected
  useEffect(() => {
    if (selectedIds.length === 1 && stageRef.current) {
      const shape = shapes.find(s => s.id === selectedIds[0]);
      if (shape && shape.type === 'text') {
        // Calculate toolbar position based on shape position
        const stage = stageRef.current;
        const screenX = (shape.x * stageScale) + stagePos.x;
        const screenY = (shape.y * stageScale) + stagePos.y;
        
        setTextToolbarPosition({
          x: Math.max(10, Math.min(screenX, window.innerWidth - 450)),
          y: Math.max(60, screenY - 150)
        });
        setTextToolbarVisible(true);
      } else {
        setTextToolbarVisible(false);
      }
    } else {
      setTextToolbarVisible(false);
    }
  }, [selectedIds, shapes, stageScale, stagePos]);

  const showFeedback = (message) => {
    setFeedbackMessage(message);
    setTimeout(() => setFeedbackMessage(null), 2000);
  };

  // Debug helper to verify undo/redo state
  const logUndoState = (operation) => {
    const undoStack = window.undoManager?.undoStack || [];
    const redoStack = window.undoManager?.redoStack || [];
    console.log(`[DEBUG] ${operation}:`, {
      shapesOnCanvas: shapes.length,
      undoStackSize: undoStack.length,
      redoStackSize: redoStack.length,
      undoCommands: undoStack.map(cmd => cmd.getDescription()),
      canUndo: window.undoManager?.canUndo() || false,
      canRedo: window.undoManager?.canRedo() || false
    });
  };

  useEffect(() => {
    const handleKeyDown = async (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      // Recenter View - Press '0' (zero) or Home key
      if ((e.key === '0' || e.key === 'Home') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        const centeredPos = getCenteredPosition(stageScale);
        setStagePos(centeredPos);
        showFeedback('View centered');
        return;
      }
      
      // Undo/Redo shortcuts (Cmd/Ctrl + Z, Cmd/Ctrl + Shift + Z)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          // Redo
          if (canRedo) {
            try {
              logUndoState('BEFORE REDO');
              const description = await redo();
              if (description) {
                showFeedback(`Redo: ${description}`);
              }
              setTimeout(() => logUndoState('AFTER REDO'), 500);
            } catch (error) {
              console.error('[Redo] Failed:', error);
              showFeedback('Redo failed');
            }
          } else {
            console.warn('[Redo] canRedo is false');
            logUndoState('REDO ATTEMPTED BUT BLOCKED');
          }
        } else {
          // Undo
          if (canUndo) {
            try {
              logUndoState('BEFORE UNDO');
              const description = await undo();
              if (description) {
                showFeedback(`Undo: ${description}`);
              }
              // Wait a moment for Firestore to sync
              setTimeout(() => logUndoState('AFTER UNDO'), 500);
            } catch (error) {
              console.error('[Undo] Failed:', error);
              showFeedback('Undo failed');
            }
          } else {
            console.warn('[Undo] canUndo is false');
            logUndoState('UNDO ATTEMPTED BUT BLOCKED');
          }
        }
        return;
      }
      
      // Duplicate selected shapes (Cmd/Ctrl + D)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd' && selectedIds.length > 0) {
        e.preventDefault();
        await handleDuplicate();
        return;
      }
      
      // Cut selected shapes (Cmd/Ctrl + X)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'x' && selectedIds.length > 0) {
        e.preventDefault();
        const shapesToCopy = selectedIds
          .map(id => shapes.find(s => s.id === id))
          .filter(Boolean);
        setCopiedShapes(shapesToCopy);
        showFeedback(`Cut ${shapesToCopy.length} shape${shapesToCopy.length > 1 ? 's' : ''}`);
        
        // Delete the cut shapes
        const shouldBatch = selectedIds.length > 1;
        if (shouldBatch) {
          startBatch(`Cut ${selectedIds.length} shapes`);
        }
        
        try {
          for (const id of selectedIds) {
            const shape = shapes.find(s => s.id === id);
            if (!shape) continue;
            
            const command = new DeleteShapeCommand(CANVAS_ID, shape, user, createShape, deleteShape);
            await execute(command, user);
          }
          
          selectedIds.forEach(id => clearSelection(id));
          setSelectedIds([]);
        } finally {
          if (shouldBatch) {
            await endBatch();
          }
        }
        return;
      }
      
      // Copy selected shapes (Cmd/Ctrl + C)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'c' && selectedIds.length > 0) {
        e.preventDefault();
        const shapesToCopy = selectedIds
          .map(id => shapes.find(s => s.id === id))
          .filter(Boolean);
        
        if (shapesToCopy.length > 0) {
          setCopiedShapes(shapesToCopy);
          showFeedback(`Copied ${shapesToCopy.length} shape${shapesToCopy.length > 1 ? 's' : ''}`);
        }
        return;
      }
      
      // Paste copied shapes (Cmd/Ctrl + V)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'v' && copiedShapes.length > 0) {
        e.preventDefault();
        await handlePaste(); // Uses default offset behavior (no position argument)
        return;
      }
      
      if (e.key === ' ' && !isSpacePressed) {
        e.preventDefault();
        setIsSpacePressed(true);
        return;
      }
      
      if ((e.key === "Delete" || e.key === "Backspace") && selectedIds.length > 0) {
        e.preventDefault();
        try {
          // Start batching if deleting multiple shapes
          const shouldBatch = selectedIds.length > 1;
          if (shouldBatch) {
            startBatch(`Deleted ${selectedIds.length} shapes`);
          }

          try {
            for (const id of selectedIds) {
              // Get shape data before deleting so we can undo
              const shape = shapes.find(s => s.id === id);
              if (shape) {
                const command = new DeleteShapeCommand(
                  CANVAS_ID,
                  shape,
                  user,
                  createShape,
                  deleteShape
                );
                await execute(command, user);
              }
            }
          } finally {
            // End batch if we started one
            if (shouldBatch) {
              await endBatch();
            }
          }

          selectedIds.forEach(id => clearSelection(id));
          setSelectedIds([]);
        } catch (error) {
          console.error("[Canvas] Delete failed:", error.message);
          setLastError(error.message);
        }
        return;
      }
      
      // Z-Index shortcuts - Shift + { and Shift + } for to front/back
      if ((e.metaKey || e.ctrlKey) === false && !e.altKey && e.shiftKey && selectedIds.length > 0) {
        if (e.key === '{') {
          e.preventDefault();
          // Send to back (Shift + {)
          const shapeIds = selectedIds;
          const shouldBatch = shapeIds.length > 1;
          if (shouldBatch) {
            startBatch(`Sent ${shapeIds.length} shapes to back`);
          }
          
          try {
            const minZIndex = shapes.reduce((min, s) => Math.min(min, s.zIndex || 0), 0);
            
            for (let i = 0; i < shapeIds.length; i++) {
              const id = shapeIds[i];
              const shape = shapes.find(s => s.id === id);
              if (!shape) continue;
              
              const oldZIndex = shape.zIndex || 0;
              const newZIndex = minZIndex - shapeIds.length + i;
              
              const command = new UpdateShapeCommand(
                CANVAS_ID,
                id,
                { zIndex: newZIndex },
                { zIndex: oldZIndex },
                user,
                updateShape
              );
              
              await execute(command, user);
            }
            
            const message = shapeIds.length > 1 
              ? `Sent ${shapeIds.length} shapes to back` 
              : 'Sent to back';
            showFeedback(message);
          } catch (error) {
            console.error('[SendToBack] Failed:', error);
            showFeedback('Failed to send to back');
          } finally {
            if (shouldBatch) {
              await endBatch();
            }
          }
          return;
        } else if (e.key === '}') {
          e.preventDefault();
          // Bring to front (Shift + })
          const shapeIds = selectedIds;
          const shouldBatch = shapeIds.length > 1;
          if (shouldBatch) {
            startBatch(`Brought ${shapeIds.length} shapes to front`);
          }
          
          try {
            const maxZIndex = shapes.reduce((max, s) => Math.max(max, s.zIndex || 0), 0);
            
            for (let i = 0; i < shapeIds.length; i++) {
              const id = shapeIds[i];
              const shape = shapes.find(s => s.id === id);
              if (!shape) continue;
              
              const oldZIndex = shape.zIndex || 0;
              const newZIndex = maxZIndex + i + 1;
              
              const command = new UpdateShapeCommand(
                CANVAS_ID,
                id,
                { zIndex: newZIndex },
                { zIndex: oldZIndex },
                user,
                updateShape
              );
              
              await execute(command, user);
            }
            
            const message = shapeIds.length > 1 
              ? `Brought ${shapeIds.length} shapes to front` 
              : 'Brought to front';
            showFeedback(message);
          } catch (error) {
            console.error('[BringToFront] Failed:', error);
            showFeedback('Failed to bring to front');
          } finally {
            if (shouldBatch) {
              await endBatch();
            }
          }
          return;
        }
      }
      
      // Z-Index shortcuts ([ and ] without modifiers for forward/backward)
      if (!e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey && selectedIds.length > 0) {
        if (e.key === '[') {
          e.preventDefault();
          // Send backward
          const shouldBatch = selectedIds.length > 1;
          if (shouldBatch) {
            startBatch(`Sent ${selectedIds.length} shapes backward`);
          }
          
          try {
            for (const id of selectedIds) {
              const shape = shapes.find(s => s.id === id);
              if (!shape) continue;
              
              const currentZ = shape.zIndex || 0;
              const lowerShapes = shapes.filter(s => (s.zIndex || 0) < currentZ).sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));
              
              if (lowerShapes.length > 0) {
                const prevZ = lowerShapes[0].zIndex;
                const newZ = prevZ - 1;
                
                const command = new UpdateShapeCommand(
                  CANVAS_ID,
                  id,
                  { zIndex: newZ },
                  { zIndex: currentZ },
                  user,
                  updateShape
                );
                
                await execute(command, user);
              }
            }
            showFeedback(selectedIds.length > 1 ? `Sent ${selectedIds.length} shapes backward` : 'Sent backward');
          } catch (error) {
            console.error('[SendBackward] Failed:', error);
          } finally {
            if (shouldBatch) {
              await endBatch();
            }
          }
          return;
        } else if (e.key === ']') {
          e.preventDefault();
          // Bring forward
          const shouldBatch = selectedIds.length > 1;
          if (shouldBatch) {
            startBatch(`Brought ${selectedIds.length} shapes forward`);
          }
          
          try {
            for (const id of selectedIds) {
              const shape = shapes.find(s => s.id === id);
              if (!shape) continue;
              
              const currentZ = shape.zIndex || 0;
              const higherShapes = shapes.filter(s => (s.zIndex || 0) > currentZ).sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
              
              if (higherShapes.length > 0) {
                const nextZ = higherShapes[0].zIndex;
                const newZ = nextZ + 1;
                
                const command = new UpdateShapeCommand(
                  CANVAS_ID,
                  id,
                  { zIndex: newZ },
                  { zIndex: currentZ },
                  user,
                  updateShape
                );
                
                await execute(command, user);
              }
            }
            showFeedback(selectedIds.length > 1 ? `Brought ${selectedIds.length} shapes forward` : 'Brought forward');
          } catch (error) {
            console.error('[BringForward] Failed:', error);
          } finally {
            if (shouldBatch) {
              await endBatch();
            }
          }
          return;
        }
      }
      
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'h':
            e.preventDefault();
            setIsHelpVisible(prev => !prev);
            break;
          case 'l':
            if (e.shiftKey) {
              e.preventDefault();
              setIsLayersPanelVisible(prev => !prev);
            } else {
              e.preventDefault();
              handleAddShape('line');
            }
            break;
          case 'r':
            e.preventDefault();
            handleAddShape('rectangle');
            break;
          case 'c':
            e.preventDefault();
            handleAddShape('circle');
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
  }, [selectedIds, user, isSpacePressed, canUndo, canRedo, undo, redo, shapes, copiedShapes, getCenteredPosition, stageScale]);

  const handleAddShape = async (type) => {
    const centerX = (-stagePos.x + window.innerWidth / 2) / stageScale;
    const centerY = (-stagePos.y + (window.innerHeight - 50) / 2) / stageScale;
    
    let shapeData = {
      id: `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      fill: '#cccccc',
      x: centerX,
      y: centerY
    };

    switch (type) {
      case 'circle':
        // Set diameter as width/height (radius = 50)
        shapeData.width = 100;
        shapeData.height = 100;
        // NO CLAMPING - place at cursor position
        shapeData.x = centerX;
        shapeData.y = centerY;
        break;
      case 'line':
        shapeData.width = 200;
        shapeData.height = 0;
        // NO CLAMPING - place at cursor position
        shapeData.x = centerX - 100;
        shapeData.y = centerY;
        break;
      case 'text':
        shapeData.text = 'Text';
        shapeData.fontSize = 24;
        shapeData.fill = '#000000';
        shapeData.width = 200;
        shapeData.height = 30;
        // NO CLAMPING - place at cursor position
        shapeData.x = centerX - 100;
        shapeData.y = centerY - 15;
        break;
      case 'triangle':
        shapeData.width = 100;
        shapeData.height = 100;
        // NO CLAMPING - place at cursor position
        shapeData.x = centerX;
        shapeData.y = centerY;
        break;
      case 'star':
        shapeData.width = 80;
        shapeData.height = 80;
        // NO CLAMPING - place at cursor position
        shapeData.x = centerX;
        shapeData.y = centerY;
        break;
      case 'rectangle':
      default:
        shapeData.width = 100;
        shapeData.height = 100;
        // NO CLAMPING - place at cursor position
        shapeData.x = centerX - 50;
        shapeData.y = centerY - 50;
        break;
    }
    
    // Wrap in command for undo/redo
    const command = new CreateShapeCommand(
      CANVAS_ID,
      shapeData,
      user,
      createShape,
      deleteShape
    );
    
    try {
      await execute(command, user);
      setTimeout(() => logUndoState(`AFTER CREATE ${type.toUpperCase()}`), 300);
    } catch (e) {
      setLastError(String(e));
    }
  };

  const handleWheel = (e) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    const scaleBy = 1.05;
    
    const newScale = e.evt.deltaY > 0 
      ? stageScale / scaleBy 
      : stageScale * scaleBy;
    const clampedScale = Math.max(0.01, Math.min(5, newScale)); // Allow 0.01x to 5x zoom
    
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
    // NO CLAMPING - infinite panning!
    // Users can pan anywhere without restrictions
    return pos;
  };

  const handleShapeDragStart = (shapeId) => {
    // Shape drag started - store initial position for undo
    const shape = shapes.find(s => s.id === shapeId);
    if (shape) {
      dragStartStateRef.current[shapeId] = {
        x: shape.x,
        y: shape.y,
        rotation: shape.rotation
      };
    }
    setEditing(true);
  };

  const handleShapeDragEnd = async (shapeId, pos) => {
    const shape = shapes.find(s => s.id === shapeId);
    
    // Clear drag debug info
    setDragDebugInfo(null);
    
    if (import.meta.env.VITE_DEBUG) {
      console.debug('[Canvas] dragEnd persist', shapeId, 'type:', shape?.type, 'pos:', pos);
    }
    setEditing(false);
    
    // Get the old position from dragStart
    const oldPosition = dragStartStateRef.current[shapeId];
    if (oldPosition) {
      // Wrap in command for undo/redo
      const command = new MoveShapeCommand(
        CANVAS_ID,
        shapeId,
        pos, // new position
        oldPosition, // old position
        user,
        updateShape
      );
      
      try {
        await execute(command, user);
      } catch (error) {
        console.error('[Canvas] Move failed:', error);
      }
      
      // Clean up stored state
      delete dragStartStateRef.current[shapeId];
    } else {
      // Fallback if no initial state (shouldn't happen)
      console.warn('[Canvas] No dragStart state found for', shapeId, '- using fallback');
      await updateShape(CANVAS_ID, shapeId, pos, user);
    }
    
    await unlockShape(CANVAS_ID, shapeId, user?.uid);
  };

  const handleShapeTransformStart = (shapeId) => {
    // Transform started (scaling, rotating) - store initial state for undo
    setEditing(true);
    
    // Store the COMPLETE initial state (including all visual properties)
    const shape = shapes.find(s => s.id === shapeId);
    if (shape && !dragStartStateRef.current[shapeId]) {
      dragStartStateRef.current[shapeId] = {
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
        rotation: shape.rotation || 0,
        scaleX: shape.scaleX || 1,
        scaleY: shape.scaleY || 1,
        radius: shape.radius,
        radiusX: shape.radiusX,
        radiusY: shape.radiusY,
        // Also store visual properties
        fill: shape.fill,
        opacity: shape.opacity,
        fillLinearGradientStartPoint: shape.fillLinearGradientStartPoint,
        fillLinearGradientEndPoint: shape.fillLinearGradientEndPoint,
        fillLinearGradientColorStops: shape.fillLinearGradientColorStops,
        // Text properties
        text: shape.text,
        fontSize: shape.fontSize,
        fontFamily: shape.fontFamily,
        fontStyle: shape.fontStyle,
        fontWeight: shape.fontWeight,
        textDecoration: shape.textDecoration,
        align: shape.align,
        lineHeight: shape.lineHeight
      };
    }
  };

  const handleShapeTransformEnd = async (shapeId, attrs) => {
    if (import.meta.env.VITE_DEBUG) {
      console.debug('[Canvas] transformEnd persist', shapeId, attrs);
    }
    setEditing(false);
    
    // Get the initial state
    const oldState = dragStartStateRef.current[shapeId];
    if (oldState) {
      // Create command for undo/redo
      const command = new UpdateShapeCommand(
        CANVAS_ID,
        shapeId,
        attrs, // new properties
        oldState, // old properties
        user,
        updateShape
      );
      
      try {
        await execute(command, user);
      } catch (error) {
        console.error('[Canvas] Transform failed:', error);
      }
      
      // Clean up stored state
      delete dragStartStateRef.current[shapeId];
    } else {
      // Fallback if no initial state (shouldn't happen)
      await updateShape(CANVAS_ID, shapeId, attrs, user);
    }
    
    await unlockShape(CANVAS_ID, shapeId, user?.uid);
  };

  const handleRequestLock = async (shapeId) => {
    if (!user?.uid) return false;
    const acquired = await tryLockShape(CANVAS_ID, shapeId, user);
    
    console.log('[Canvas] Lock request for', shapeId, '→', acquired ? '✅ ACQUIRED' : '❌ BLOCKED');
    
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

  const handleColorChange = async (color, opacity = 100) => {
    if (selectedIds.length === 0 || !user) return;
    
    let changedCount = 0;
    let lockedCount = 0;
    
    // Use Konva's opacity property (0-1) instead of mixing with rgba
    // Keep color as hex, set opacity separately
    const opacityValue = opacity / 100;
    
    // Start batching if multiple shapes are being updated
    const shouldBatch = selectedIds.length > 1;
    if (shouldBatch) {
      const opacityText = opacity < 100 ? ` (${opacity}% opacity)` : '';
      startBatch(`Changed color to ${color}${opacityText} for ${selectedIds.length} shapes`);
    }
    
    try {
      for (const shapeId of selectedIds) {
        const shape = shapes.find(s => s.id === shapeId);
        if (!shape) continue;
        
        if (shape.isLocked && shape.lockedBy !== user.uid) {
          console.warn(`[ColorChange] Shape ${shapeId} locked by another user`);
          lockedCount++;
          continue;
        }
        
        try {
          // Build update object - only include properties we want to change
          const updates = { 
            fill: color, 
            opacity: opacityValue
          };
          
          // Clear gradient properties by setting them to undefined (Firestore removes undefined fields)
          if (shape.fillLinearGradientStartPoint) {
            updates.fillLinearGradientStartPoint = undefined;
          }
          if (shape.fillLinearGradientEndPoint) {
            updates.fillLinearGradientEndPoint = undefined;
          }
          if (shape.fillLinearGradientColorStops) {
            updates.fillLinearGradientColorStops = undefined;
          }
          
          // Store old properties for undo
          const oldProps = {
            fill: shape.fill,
            opacity: shape.opacity,
            fillLinearGradientStartPoint: shape.fillLinearGradientStartPoint,
            fillLinearGradientEndPoint: shape.fillLinearGradientEndPoint,
            fillLinearGradientColorStops: shape.fillLinearGradientColorStops
          };
          
          console.log('[ColorChange] Updating shape:', shapeId, 'with:', updates);
          
          // Wrap in command for undo/redo
          const command = new UpdateShapeCommand(
            CANVAS_ID,
            shapeId,
            updates, // new properties
            oldProps, // old properties
            user,
            updateShape
          );
          
          await execute(command, user);
          changedCount++;
        } catch (error) {
          console.error(`[ColorChange] Failed to update shape ${shapeId}:`, error);
        }
      }
    } finally {
      // End batch if we started one
      if (shouldBatch) {
        await endBatch();
      }
    }
    
    if (changedCount > 0) {
      const opacityText = opacity < 100 ? ` (${opacity}% opacity)` : '';
      showFeedback(`Changed color of ${changedCount} shape${changedCount > 1 ? 's' : ''}${opacityText}`);
    }
    if (lockedCount > 0) {
      setTimeout(() => {
        showFeedback(`${lockedCount} shape${lockedCount > 1 ? 's' : ''} locked by other users`);
      }, 2200);
    }
  };

  const handleGradientChange = async (gradient) => {
    if (selectedIds.length === 0 || !user) {
      console.warn('[GradientChange] Cannot apply: no selection or user');
      return;
    }
    
    console.group('[GradientChange] Starting gradient application');
    console.log('Gradient config:', gradient);
    console.log('Selected shapes:', selectedIds);
    console.log('User:', user.uid);
    
    let changedCount = 0;
    let lockedCount = 0;
    let errors = [];
    
    // Start batching if multiple shapes are being updated
    const shouldBatch = selectedIds.length > 1;
    if (shouldBatch) {
      startBatch(`Applied gradient to ${selectedIds.length} shapes`);
    }
    
    try {
      for (const shapeId of selectedIds) {
        const shape = shapes.find(s => s.id === shapeId);
        if (!shape) {
          console.warn(`[GradientChange] Shape ${shapeId} not found in local state`);
          continue;
        }
        
        console.log(`[GradientChange] Processing shape ${shapeId}:`, {
          type: shape.type,
          size: `${shape.width}x${shape.height}`,
          currentFill: shape.fill,
          isLocked: shape.isLocked,
          lockedBy: shape.lockedBy
        });
        
        if (shape.isLocked && shape.lockedBy !== user.uid) {
          console.warn(`[GradientChange] Shape ${shapeId} locked by ${shape.lockedBy}`);
          lockedCount++;
          continue;
        }
        
        try {
          // Calculate gradient direction based on angle (in degrees)
          // Konva expects actual pixel coordinates relative to shape's bounding box
          // 0° = up, 90° = right, 180° = down, 270° = left
          const angleRad = ((gradient.angle - 90) * Math.PI) / 180; // Adjust so 0° is up
          const width = shape.width || 100;
          const height = shape.height || 100;
          
          // Calculate gradient start and end points based on shape type
          // Different shapes have different coordinate systems in Konva
          let startPoint, endPoint, centerX, centerY, radius;
          
          if (shape.type === 'circle') {
            // For circles: gradient coordinates are relative to bounding box
            // Bounding box is 2r × 2r with top-left at (x-r, y-r)
            // Circle center is at (r, r) in bounding box coordinates
            const circleRadius = width / 2; // width is diameter for circles
            centerX = circleRadius;
            centerY = circleRadius;
            radius = circleRadius; // Use circle radius for gradient span
            
            startPoint = {
              x: centerX - radius * Math.cos(angleRad),
              y: centerY - radius * Math.sin(angleRad)
            };
            
            endPoint = {
              x: centerX + radius * Math.cos(angleRad),
              y: centerY + radius * Math.sin(angleRad)
            };
          } else if (shape.type === 'star' || shape.type === 'triangle') {
            // For stars and triangles: also center-based
            // Use half the diagonal distance for gradient span
            centerX = width / 2;
            centerY = height / 2;
            radius = Math.sqrt(centerX * centerX + centerY * centerY);
            
            startPoint = {
              x: centerX - radius * Math.cos(angleRad),
              y: centerY - radius * Math.sin(angleRad)
            };
            
            endPoint = {
              x: centerX + radius * Math.cos(angleRad),
              y: centerY + radius * Math.sin(angleRad)
            };
          } else {
            // For rectangles, diamonds, text: top-left based
            // Gradient spans from one corner to opposite corner based on angle
            centerX = width / 2;
            centerY = height / 2;
            radius = Math.sqrt(centerX * centerX + centerY * centerY);
            
            startPoint = {
              x: centerX - radius * Math.cos(angleRad),
              y: centerY - radius * Math.sin(angleRad)
            };
            
            endPoint = {
              x: centerX + radius * Math.cos(angleRad),
              y: centerY + radius * Math.sin(angleRad)
            };
          }
          
          // Build update object
          const updates = {
            fill: undefined, // Clear solid fill (undefined removes it from Firestore)
            fillLinearGradientStartPoint: startPoint,
            fillLinearGradientEndPoint: endPoint,
            fillLinearGradientColorStops: [0, gradient.color1, 1, gradient.color2],
            opacity: 1.0 // Reset opacity for gradients
          };
          
          // Store old properties for undo
          const oldProps = {
            fill: shape.fill,
            fillLinearGradientStartPoint: shape.fillLinearGradientStartPoint,
            fillLinearGradientEndPoint: shape.fillLinearGradientEndPoint,
            fillLinearGradientColorStops: shape.fillLinearGradientColorStops,
            opacity: shape.opacity
          };
          
          console.log(`[GradientChange] Update payload for ${shapeId}:`, {
            startPoint,
            endPoint,
            colorStops: [0, gradient.color1, 1, gradient.color2],
            clearingFill: true
          });
          
          // Wrap in command for undo/redo
          const command = new UpdateShapeCommand(
            CANVAS_ID,
            shapeId,
            updates,
            oldProps,
            user,
            updateShape
          );
          
          await execute(command, user);
          console.log(`[GradientChange] ✅ Successfully updated ${shapeId}`);
          changedCount++;
        } catch (error) {
          console.error(`[GradientChange] ❌ Failed to update ${shapeId}:`, error);
          errors.push({ shapeId, error: error.message });
        }
      }
    } finally {
      // End batch if we started one
      if (shouldBatch) {
        await endBatch();
      }
    }
    
    console.log('[GradientChange] Summary:', {
      total: selectedIds.length,
      succeeded: changedCount,
      locked: lockedCount,
      failed: errors.length
    });
    console.groupEnd();
    
    // Show user feedback
    if (changedCount > 0) {
      showFeedback(`Applied gradient to ${changedCount} shape${changedCount > 1 ? 's' : ''}`);
    }
    if (errors.length > 0) {
      console.error('[GradientChange] Error details:', errors);
      showFeedback(`Failed to update ${errors.length} shape(s) - check console`);
    }
    if (lockedCount > 0) {
      setTimeout(() => {
        showFeedback(`${lockedCount} shape${lockedCount > 1 ? 's' : ''} locked by other users`);
      }, 2200);
    }
  };

  const handleTextFormatChange = async (formatProps) => {
    if (selectedIds.length !== 1 || !user) return;
    
    const shapeId = selectedIds[0];
    const shape = shapes.find(s => s.id === shapeId);
    
    if (!shape || shape.type !== 'text') return;
    if (shape.isLocked && shape.lockedBy !== user.uid) {
      showFeedback('Shape is locked by another user');
      return;
    }
    
    try {
      // Store old properties for undo
      const oldProps = {};
      Object.keys(formatProps).forEach(key => {
        oldProps[key] = shape[key];
      });
      
      // Wrap in command for undo/redo
      const command = new UpdateShapeCommand(
        CANVAS_ID,
        shapeId,
        formatProps,  // new properties
        oldProps,     // old properties
        user,
        updateShape
      );
      
      await execute(command, user);
      console.log('[TextFormat] Updated:', shapeId, formatProps);
    } catch (error) {
      console.error('[TextFormat] Update failed:', error);
      showFeedback('Failed to update text formatting');
    }
  };

  const handleTextUpdate = async (shapeId, newText) => {
    if (!user) return;
    
    const shape = shapes.find(s => s.id === shapeId);
    if (!shape || shape.type !== 'text') return;
    
    if (shape.isLocked && shape.lockedBy !== user.uid) {
      showFeedback('Shape is locked by another user');
      return;
    }
    
    try {
      // Wrap in command for undo/redo
      const command = new UpdateShapeCommand(
        CANVAS_ID,
        shapeId,
        { text: newText },    // new property
        { text: shape.text }, // old property
        user,
        updateShape
      );
      
      await execute(command, user);
      console.log('[TextUpdate] Updated:', shapeId, newText);
    } catch (error) {
      console.error('[TextUpdate] Update failed:', error);
      showFeedback('Failed to update text');
      throw error;
    }
  };

  const handleLayerRename = async (shapeId, newName) => {
    if (!user) return;
    
    try {
      await updateShape(CANVAS_ID, shapeId, { name: newName }, user);
      showFeedback(`Renamed to "${newName}"`);
    } catch (error) {
      console.error('[LayerRename] Failed:', error);
      showFeedback('Failed to rename layer');
    }
  };

  const handleDeleteAllShapes = async () => {
    if (!user || shapes.length === 0) return;
    
    const shapeCount = shapes.length;
    
    // Always batch for multiple shapes
    startBatch(`Deleted all ${shapeCount} shapes`);
    
    try {
      for (const shape of shapes) {
        const command = new DeleteShapeCommand(
          CANVAS_ID,
          shape,
          user,
          createShape,
          deleteShape
        );
        await execute(command, user);
      }
      
      // Clear all selections
      selectedIds.forEach(id => clearSelection(id));
      setSelectedIds([]);
      
      showFeedback(`Deleted all ${shapeCount} shapes`);
    } catch (error) {
      console.error('[DeleteAllShapes] Failed:', error);
      showFeedback('Failed to delete all shapes');
    } finally {
      await endBatch();
    }
  };

  const handleToggleVisibility = async (shapeId) => {
    if (!user) return;
    
    const shape = shapes.find(s => s.id === shapeId);
    if (!shape) return;
    
    try {
      await updateShape(CANVAS_ID, shapeId, { hidden: !shape.hidden }, user);
    } catch (error) {
      console.error('[ToggleVisibility] Failed:', error);
      showFeedback('Failed to toggle visibility');
    }
  };

  const handleToggleLock = async (shapeId) => {
    if (!user) return;
    
    const shape = shapes.find(s => s.id === shapeId);
    if (!shape) return;
    
    // Only allow unlocking if user owns the lock
    if (shape.isLocked && shape.lockedBy !== user.uid) {
      showFeedback('Cannot unlock - shape locked by another user');
      return;
    }
    
    try {
      if (shape.isLocked) {
        await unlockShape(CANVAS_ID, shapeId, user.uid);
      } else {
        await tryLockShape(CANVAS_ID, shapeId, user);
      }
    } catch (error) {
      console.error('[ToggleLock] Failed:', error);
      showFeedback('Failed to toggle lock');
    }
  };

  const handleBringToFront = async (shapeId) => {
    if (!user) return;
    
    // If shapeId is provided, use it; otherwise use selected shapes
    const shapeIds = shapeId ? [shapeId] : selectedIds;
    if (shapeIds.length === 0) return;
    
    const shouldBatch = shapeIds.length > 1;
    if (shouldBatch) {
      startBatch(`Brought ${shapeIds.length} shapes to front`);
    }
    
    try {
      // Get max z-index
      const maxZIndex = shapes.reduce((max, s) => Math.max(max, s.zIndex || 0), 0);
      
      // Process all shapes with commands
      for (let i = 0; i < shapeIds.length; i++) {
        const id = shapeIds[i];
        const shape = shapes.find(s => s.id === id);
        if (!shape) continue;
        
        const oldZIndex = shape.zIndex || 0;
        const newZIndex = maxZIndex + i + 1;
        
        const command = new UpdateShapeCommand(
          CANVAS_ID,
          id,
          { zIndex: newZIndex },  // newProps FIRST
          { zIndex: oldZIndex },  // oldProps SECOND
          user,
          updateShape
        );
        
        await execute(command, user);
      }
      
      const message = shapeIds.length > 1 
        ? `Brought ${shapeIds.length} shapes to front` 
        : 'Brought to front';
      showFeedback(message);
    } catch (error) {
      console.error('[BringToFront] Failed:', error);
      showFeedback('Failed to bring to front');
    } finally {
      if (shouldBatch) {
        await endBatch();
      }
    }
  };

  const handleSendToBack = async (shapeId) => {
    if (!user) return;
    
    // If shapeId is provided, use it; otherwise use selected shapes
    const shapeIds = shapeId ? [shapeId] : selectedIds;
    if (shapeIds.length === 0) return;
    
    const shouldBatch = shapeIds.length > 1;
    if (shouldBatch) {
      startBatch(`Sent ${shapeIds.length} shapes to back`);
    }
    
    try {
      // Get min z-index
      const minZIndex = shapes.reduce((min, s) => Math.min(min, s.zIndex || 0), 0);
      
      // Process all shapes with commands
      for (let i = 0; i < shapeIds.length; i++) {
        const id = shapeIds[i];
        const shape = shapes.find(s => s.id === id);
        if (!shape) continue;
        
        const oldZIndex = shape.zIndex || 0;
        const newZIndex = minZIndex - shapeIds.length + i;
        
        const command = new UpdateShapeCommand(
          CANVAS_ID,
          id,
          { zIndex: newZIndex },  // newProps FIRST
          { zIndex: oldZIndex },  // oldProps SECOND
          user,
          updateShape
        );
        
        await execute(command, user);
      }
      
      const message = shapeIds.length > 1 
        ? `Sent ${shapeIds.length} shapes to back` 
        : 'Sent to back';
      showFeedback(message);
    } catch (error) {
      console.error('[SendToBack] Failed:', error);
      showFeedback('Failed to send to back');
    } finally {
      if (shouldBatch) {
        await endBatch();
      }
    }
  };

  const handleBringForward = async (shapeId) => {
    if (!user) return;
    
    // If shapeId is provided, use it; otherwise use selected shapes
    const shapeIds = shapeId ? [shapeId] : selectedIds;
    if (shapeIds.length === 0) return;
    
    const shouldBatch = shapeIds.length > 1;
    if (shouldBatch) {
      startBatch(`Brought ${shapeIds.length} shapes forward`);
    }
    
    try {
      // Process all shapes with commands
      for (const id of shapeIds) {
        const shape = shapes.find(s => s.id === id);
        if (!shape) continue;
        
        const currentZ = shape.zIndex || 0;
        // Find next higher z-index
        const higherShapes = shapes.filter(s => (s.zIndex || 0) > currentZ).sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
        
        if (higherShapes.length > 0) {
          const nextZ = higherShapes[0].zIndex;
          const newZ = nextZ + 1;
          
          const command = new UpdateShapeCommand(
            CANVAS_ID,
            id,
            { zIndex: newZ },      // newProps FIRST
            { zIndex: currentZ },  // oldProps SECOND
            user,
            updateShape
          );
          
          await execute(command, user);
        }
      }
      
      const message = shapeIds.length > 1 
        ? `Brought ${shapeIds.length} shapes forward` 
        : 'Brought forward';
      showFeedback(message);
    } catch (error) {
      console.error('[BringForward] Failed:', error);
      showFeedback('Failed to bring forward');
    } finally {
      if (shouldBatch) {
        await endBatch();
      }
    }
  };

  const handleSendBackward = async (shapeId) => {
    if (!user) return;
    
    // If shapeId is provided, use it; otherwise use selected shapes
    const shapeIds = shapeId ? [shapeId] : selectedIds;
    if (shapeIds.length === 0) return;
    
    const shouldBatch = shapeIds.length > 1;
    if (shouldBatch) {
      startBatch(`Sent ${shapeIds.length} shapes backward`);
    }
    
    try {
      // Process all shapes with commands
      for (const id of shapeIds) {
        const shape = shapes.find(s => s.id === id);
        if (!shape) continue;
        
        const currentZ = shape.zIndex || 0;
        // Find next lower z-index
        const lowerShapes = shapes.filter(s => (s.zIndex || 0) < currentZ).sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));
        
        if (lowerShapes.length > 0) {
          const prevZ = lowerShapes[0].zIndex;
          const newZ = prevZ - 1;
          
          const command = new UpdateShapeCommand(
            CANVAS_ID,
            id,
            { zIndex: newZ },      // newProps FIRST
            { zIndex: currentZ },  // oldProps SECOND
            user,
            updateShape
          );
          
          await execute(command, user);
        }
      }
      
      const message = shapeIds.length > 1 
        ? `Sent ${shapeIds.length} shapes backward` 
        : 'Sent backward';
      showFeedback(message);
    } catch (error) {
      console.error('[SendBackward] Failed:', error);
      showFeedback('Failed to send backward');
    } finally {
      if (shouldBatch) {
        await endBatch();
      }
    }
  };

  const handleContextMenu = (e, shapeId) => {
    e.evt.preventDefault(); // Prevent default browser context menu
    e.cancelBubble = true; // Stop event from bubbling to Stage
    
    // If right-clicking on an unselected shape, select it first
    if (shapeId && !selectedIds.includes(shapeId)) {
      setSelectedIds([shapeId]);
      if (user?.uid) {
        const name = user.displayName || user.email?.split('@')[0] || 'User';
        const color = generateUserColor(user.uid);
        setSelection(shapeId, user.uid, name, color);
      }
    }
    
    setContextMenu({
      x: e.evt.clientX,
      y: e.evt.clientY,
      shapeId
    });
  };

  const handleCut = async () => {
    if (!user || selectedIds.length === 0) return;
    
    const shapesToCopy = selectedIds
      .map(id => shapes.find(s => s.id === id))
      .filter(Boolean);
    setCopiedShapes(shapesToCopy);
    showFeedback(`Cut ${shapesToCopy.length} shape${shapesToCopy.length > 1 ? 's' : ''}`);
    
    // Delete the cut shapes
    const shouldBatch = selectedIds.length > 1;
    if (shouldBatch) {
      startBatch(`Cut ${selectedIds.length} shapes`);
    }
    
    try {
      for (const id of selectedIds) {
        const shape = shapes.find(s => s.id === id);
        if (!shape) continue;
        
        const command = new DeleteShapeCommand(CANVAS_ID, shape, user, createShape, deleteShape);
        await execute(command, user);
      }
      
      selectedIds.forEach(id => clearSelection(id));
      setSelectedIds([]);
    } finally {
      if (shouldBatch) {
        await endBatch();
      }
    }
  };

  const handleCopy = () => {
    if (selectedIds.length === 0) return;
    
    const shapesToCopy = selectedIds
      .map(id => shapes.find(s => s.id === id))
      .filter(Boolean);
    
    if (shapesToCopy.length > 0) {
      setCopiedShapes(shapesToCopy);
      showFeedback(`Copied ${shapesToCopy.length} shape${shapesToCopy.length > 1 ? 's' : ''}`);
    }
  };

  const handlePaste = async (pastePosition = null) => {
    if (!user || copiedShapes.length === 0) return;
    
    const shouldBatch = copiedShapes.length > 1;
    if (shouldBatch) {
      startBatch(`Pasted ${copiedShapes.length} shapes`);
    }
    
    try {
      const pastedIds = [];
      const PASTE_OFFSET = 20;
      
      // If pasting from context menu, calculate offset to paste position
      let offsetX = PASTE_OFFSET;
      let offsetY = PASTE_OFFSET;
      
      if (pastePosition && copiedShapes.length > 0) {
        // Convert screen coordinates to canvas coordinates
        const stage = stageRef.current;
        if (stage) {
          const stageObj = stage.getStage();
          const scale = stageObj.scaleX();
          const stagePos = stageObj.position();
          
          // Convert screen coordinates to canvas coordinates
          const canvasX = (pastePosition.x - stagePos.x) / scale;
          const canvasY = (pastePosition.y - stagePos.y) / scale;
          
          // Use the first copied shape as reference point and center it at click position
          const firstShape = copiedShapes[0];
          
          // Calculate the visual center of the first shape
          // In Konva: Rect/Diamond use top-left (x,y), but Circle/Star use center (x,y)
          let centerX = firstShape.x;
          let centerY = firstShape.y;
          
          if (firstShape.type === 'rectangle' || firstShape.type === 'diamond') {
            // Rectangle and diamond: x,y is top-left, so add half dimensions
            centerX = firstShape.x + (firstShape.width || 100) / 2;
            centerY = firstShape.y + (firstShape.height || 100) / 2;
          } else if (firstShape.type === 'circle') {
            // Circle: x,y is already the center in Konva
            centerX = firstShape.x;
            centerY = firstShape.y;
          } else if (firstShape.type === 'star' || firstShape.type === 'triangle') {
            // Star and triangle: x,y is already the center
            centerX = firstShape.x;
            centerY = firstShape.y;
          } else if (firstShape.type === 'text') {
            // Text: x,y is top-left, estimate dimensions
            const estimatedWidth = (firstShape.text?.length || 10) * (firstShape.fontSize || 24) * 0.6;
            centerX = firstShape.x + estimatedWidth / 2;
            centerY = firstShape.y + (firstShape.fontSize || 24) / 2;
          }
          
          // Calculate offset so the center of the first shape appears at click position
          offsetX = canvasX - centerX;
          offsetY = canvasY - centerY;
        }
      }
      
      for (const shapeToCopy of copiedShapes) {
        const newShape = {
          ...shapeToCopy,
          id: `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          x: shapeToCopy.x + offsetX,
          y: shapeToCopy.y + offsetY,
          createdAt: Date.now(),
          createdBy: user?.uid || 'anonymous',
          isLocked: false,
          lockedBy: null,
          lockedAt: null
        };
        
        const command = new CreateShapeCommand(CANVAS_ID, newShape, user, createShape, deleteShape);
        await execute(command, user);
        pastedIds.push(newShape.id);
      }
      
      // Select pasted shapes
      selectedIds.forEach(id => clearSelection(id));
      setSelectedIds(pastedIds);
      pastedIds.forEach(id => {
        if (user?.uid) {
          const name = user.displayName || user.email?.split('@')[0] || 'User';
          const color = generateUserColor(user.uid);
          setSelection(id, user.uid, name, color);
        }
      });
      
      showFeedback(`Pasted ${pastedIds.length} shape${pastedIds.length > 1 ? 's' : ''}`);
    } finally {
      if (shouldBatch) {
        await endBatch();
      }
    }
  };

  const handleDuplicate = async () => {
    if (!user || selectedIds.length === 0) return;
    
    const shapesToDuplicate = selectedIds
      .map(id => shapes.find(s => s.id === id))
      .filter(Boolean);
    
    if (shapesToDuplicate.length === 0) return;
    
    const shouldBatch = shapesToDuplicate.length > 1;
    if (shouldBatch) {
      startBatch(`Duplicated ${shapesToDuplicate.length} shapes`);
    }
    
    try {
      const duplicatedIds = [];
      const DUPLICATE_OFFSET = 20;
      
      for (const shapeToDuplicate of shapesToDuplicate) {
        // Create a new shape with a new ID and offset position
        const newShape = {
          ...shapeToDuplicate,
          id: `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          x: shapeToDuplicate.x + DUPLICATE_OFFSET,
          y: shapeToDuplicate.y + DUPLICATE_OFFSET,
          createdAt: Date.now(),
          createdBy: user?.uid || 'anonymous',
          isLocked: false,
          lockedBy: null,
          lockedAt: null
        };
        
        const command = new CreateShapeCommand(
          CANVAS_ID,
          newShape,
          user,
          createShape,
          deleteShape
        );
        
        await execute(command, user);
        duplicatedIds.push(newShape.id);
      }
      
      // Select the duplicated shapes
      selectedIds.forEach(id => clearSelection(id));
      setSelectedIds(duplicatedIds);
      duplicatedIds.forEach(id => {
        if (user?.uid) {
          const name = user.displayName || user.email?.split('@')[0] || 'User';
          const color = generateUserColor(user.uid);
          setSelection(id, user.uid, name, color);
        }
      });
      
      showFeedback(`Duplicated ${duplicatedIds.length} shape${duplicatedIds.length > 1 ? 's' : ''}`);
    } finally {
      if (shouldBatch) {
        await endBatch();
      }
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
    // Only handle left-clicks (ignore right-clicks)
    if (e.evt.button !== 0) {
      return;
    }
    
    if (e.target === e.target.getStage() && !selectionBox && !selectionStartRef.current) {
      // Close context menu when clicking on canvas
      if (contextMenu) {
        setContextMenu(null);
      }
      
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
    // DISABLED: staleLockSweeper to eliminate transaction conflicts
    // The sweeper was causing frequent Firestore conflicts during collaborative editing
    // Locks will naturally expire after LOCK_TTL_MS (30 seconds)
    // This eliminates the "snapping" behavior users experience
    
    // Keep the code here for reference but don't run it
    if (!user?.uid || true) return; // Force disabled with || true
    
    // Stagger the sweeper based on user ID to reduce conflicts
    // Each user gets a different offset (0-20 seconds) based on their UID hash
    const uidHash = user.uid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const initialDelay = (uidHash % 20) * 1000; // 0-20 second spread
    
    let interval;
    const startSweeper = setTimeout(() => {
      // Run immediately on start
      staleLockSweeper(CANVAS_ID, LOCK_TTL_MS);
      
      // Then run every 30 seconds (increased from 5 seconds to reduce conflicts)
      interval = setInterval(() => {
        staleLockSweeper(CANVAS_ID, LOCK_TTL_MS);
      }, 30000);
    }, initialDelay);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // When tab becomes visible, wait a bit to avoid stampede
        setTimeout(() => staleLockSweeper(CANVAS_ID, LOCK_TTL_MS), Math.random() * 2000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(startSweeper);
      if (interval) clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

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

    window.debugUndoState = () => {
      logUndoState('MANUAL DEBUG CHECK');
    };

    return () => {
      delete window.debugUpdateText;
      delete window.debugGetShapes;
      delete window.debugUndoState;
    };
  }, [user, shapes, logUndoState]);

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
      <ConnectionStatus />
      <PerformanceMonitor isVisible={isVisible} onToggle={toggleVisibility} />
      <PerformanceToggleButton onClick={toggleVisibility} isVisible={isVisible} />
      <HelpMenu isVisible={isHelpVisible} onClose={() => setIsHelpVisible(false)} />
      
      {/* Text Formatting Toolbar */}
      {textToolbarVisible && selectedIds.length === 1 && (
        <TextFormattingToolbar
          shape={shapes.find(s => s.id === selectedIds[0])}
          position={textToolbarPosition}
          onUpdate={handleTextFormatChange}
          onClose={() => setTextToolbarVisible(false)}
        />
      )}
      
      {/* Layers Panel */}
      {isLayersPanelVisible && (
        <LayersPanel
          shapes={shapes}
          selectedIds={selectedIds}
          onSelect={handleShapeSelect}
          onRename={handleLayerRename}
          onDeleteAll={handleDeleteAllShapes}
          onBringToFront={handleBringToFront}
          onSendToBack={handleSendToBack}
          onBringForward={handleBringForward}
          onSendBackward={handleSendBackward}
          onClose={() => setIsLayersPanelVisible(false)}
          user={user}
        />
      )}
      
      {/* History Timeline */}
      <HistoryTimeline />
      
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
        onUndo={async () => {
          if (canUndo) {
            try {
              const description = await undo();
              if (description) {
                showFeedback(`Undo: ${description}`);
              }
            } catch (error) {
              console.error('[Undo] Failed:', error);
              showFeedback('Undo failed');
            }
          }
        }}
        onRedo={async () => {
          if (canRedo) {
            try {
              const description = await redo();
              if (description) {
                showFeedback(`Redo: ${description}`);
              }
            } catch (error) {
              console.error('[Redo] Failed:', error);
              showFeedback('Redo failed');
            }
          }
        }}
        canUndo={canUndo}
        canRedo={canRedo}
        onBringToFront={handleBringToFront}
        onSendToBack={handleSendToBack}
        onBringForward={handleBringForward}
        onSendBackward={handleSendBackward}
        onDuplicate={handleDuplicate}
        hasSelection={selectedIds.length > 0}
        isLayersPanelVisible={isLayersPanelVisible}
      />
      
      {/* Color Palette - shows when shapes are selected */}
      {selectedIds.length > 0 && (
        <ColorPalette
          onColorSelect={handleColorChange}
          onGradientSelect={handleGradientChange}
          selectedCount={selectedIds.length}
        />
      )}
      
      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onCut={handleCut}
          onCopy={handleCopy}
          onPaste={() => handlePaste({ x: contextMenu.x, y: contextMenu.y })}
          onDuplicate={handleDuplicate}
          onBringToFront={() => handleBringToFront()}
          onSendToBack={() => handleSendToBack()}
          onBringForward={() => handleBringForward()}
          onSendBackward={() => handleSendBackward()}
          onLock={() => handleToggleLock(contextMenu.shapeId || selectedIds[0])}
          onDelete={async () => {
            const shouldBatch = selectedIds.length > 1;
            if (shouldBatch) {
              startBatch(`Deleted ${selectedIds.length} shapes`);
            }
            
            try {
              for (const id of selectedIds) {
                const shape = shapes.find(s => s.id === id);
                if (!shape) continue;
                
                const command = new DeleteShapeCommand(CANVAS_ID, shape, user, createShape, deleteShape);
                await execute(command, user);
              }
              
              selectedIds.forEach(id => clearSelection(id));
              setSelectedIds([]);
            } finally {
              if (shouldBatch) {
                await endBatch();
              }
            }
          }}
          isLocked={contextMenu.shapeId ? shapes.find(s => s.id === contextMenu.shapeId)?.isLocked : false}
          hasSelection={selectedIds.length > 0}
          hasCopiedShapes={copiedShapes.length > 0}
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
      
      {/* Drag Bounds Debug HUD */}
      {dragDebugInfo && (
        <div
          style={{
            position: 'fixed',
            top: '10px',
            left: '10px',
            background: 'rgba(255, 87, 34, 0.95)',
            color: '#fff',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontFamily: 'monospace',
            fontWeight: '600',
            zIndex: 10000,
            pointerEvents: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            minWidth: '320px'
          }}
        >
          <div style={{ marginBottom: '8px', fontSize: '14px', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '6px' }}>
            🔍 DRAG BOUNDS DEBUG - {dragDebugInfo.type.toUpperCase()}
          </div>
          <div>Shape ID: {dragDebugInfo.shapeId.substring(0, 20)}...</div>
          {dragDebugInfo.radius ? (
            <div>Radius: {dragDebugInfo.radius.toFixed(2)} px (diameter: {(dragDebugInfo.radius * 2).toFixed(2)})</div>
          ) : (
            <div>Size: {dragDebugInfo.width?.toFixed(0)} × {dragDebugInfo.height?.toFixed(0)} px</div>
          )}
          <div style={{ marginTop: '6px', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '6px' }}>
            <strong>Allowed Bounds:</strong>
          </div>
          <div>  X: [{dragDebugInfo.minX?.toFixed(0)}, {dragDebugInfo.maxX?.toFixed(0)}]</div>
          <div>  Y: [{dragDebugInfo.minY?.toFixed(0)}, {dragDebugInfo.maxY?.toFixed(0)}]</div>
          <div style={{ marginTop: '6px', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '6px' }}>
            <strong>Current Position:</strong>
          </div>
          <div>  Requested: ({dragDebugInfo.requestedX?.toFixed(0)}, {dragDebugInfo.requestedY?.toFixed(0)})</div>
          <div>  Clamped:   ({dragDebugInfo.boundedX?.toFixed(0)}, {dragDebugInfo.boundedY?.toFixed(0)})</div>
          {(dragDebugInfo.requestedX !== dragDebugInfo.boundedX || dragDebugInfo.requestedY !== dragDebugInfo.boundedY) && (
            <div style={{ marginTop: '6px', color: '#ffeb3b', fontWeight: 'bold' }}>
              ⚠️ CLAMPING ACTIVE!
            </div>
          )}
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
        onContextMenu={(e) => {
          e.evt.preventDefault();
          // Always show context menu when right-clicking on Stage
          setContextMenu({
            x: e.evt.clientX,
            y: e.evt.clientY,
            shapeId: null
          });
        }}
      >
        <Layer>
          {/* Canvas background - let clicks pass through to Stage handler */}
          <Rect
            name="canvas-background"
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
                onTextUpdate={handleTextUpdate}
                onContextMenu={handleContextMenu}
                onDragBoundUpdate={isDraggedByOther ? null : setDragDebugInfo}
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
      
      {/* Recenter Button - Bottom Right */}
      <button
        onClick={() => {
          const centeredPos = getCenteredPosition(stageScale);
          setStagePos(centeredPos);
          showFeedback('View centered');
        }}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '12px 20px',
          backgroundColor: '#007AFF',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0, 122, 255, 0.3)',
          zIndex: 1000,
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#0051D5';
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 122, 255, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#007AFF';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 122, 255, 0.3)';
        }}
      >
        <span style={{ fontSize: '16px' }}>🎯</span>
        Center View
      </button>
    </div>
  );
}
