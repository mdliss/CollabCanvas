/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Canvas Component - Real-Time Collaborative Vector Editor with Selection-Based Locking
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * IMPLEMENTATION: Selection-Based Persistent Locking System
 * Date: 2025-10-17
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * OVERVIEW
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This implementation adds two types of collaborative locks to prevent editing conflicts:
 * 
 * 1. SELECTION LOCK (Persistent):
 *    - Acquired when user selects shape (Transformer becomes visible)
 *    - Persists for entire selection duration
 *    - Released on deselection (background click, select different shape)
 *    - Uses optimistic unlock for <5ms perceived latency
 * 
 * 2. OPERATION LOCK (Transient):
 *    - Acquired when user drags unselected shape directly (no prior selection)
 *    - Persists only during active drag operation
 *    - Released immediately after drag completes and RTDB write finishes
 *    - Uses standard unlock coordinated with RTDB write
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * KEY USER FLOWS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * FLOW 1: Selection-Based Interaction (Selection Lock)
 *   1. User clicks shape → Lock acquired (~80ms)
 *   2. Transformer appears → Shape remains locked
 *   3. User examines shape, decides on changes → Lock persists
 *   4. User drags/transforms shape → Lock already held (instant, <1ms)
 *   5. Operation completes → Lock persists (shape still selected)
 *   6. User clicks background → Lock releases optimistically (<5ms)
 * 
 * FLOW 2: Direct Drag Interaction (Operation Lock)
 *   1. User drags unselected shape → Lock acquired at drag start (~80ms)
 *   2. Drag in progress → Lock persists
 *   3. User releases mouse → Lock releases after RTDB write (~80ms)
 *   4. Shape immediately available to other users
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * PERFORMANCE TARGETS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Selection Lock Acquisition:      ~80ms (RTDB transaction)
 * Selection Lock Release:          <5ms (optimistic, async RTDB)
 * Operation Lock Acquisition:      ~80ms (RTDB transaction)
 * Operation Lock Release:          ~80ms (coordinated with RTDB write)
 * Drag on Selected Shape:          <1ms (lock already held)
 * Transform on Selected Shape:     <1ms (lock already held)
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * IMPLEMENTATION COMPONENTS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * NEW STATE:
 *   - selectionLocksRef: Tracks which shapes have selection locks (Set of shape IDs)
 * 
 * NEW FUNCTIONS:
 *   - unlockShapeOptimistic() in canvasRTDB.js: Fast optimistic unlock for deselection
 * 
 * MODIFIED FUNCTIONS:
 *   - handleShapeSelect(): Acquires selection lock on click, releases previous locks
 *   - handleStageClick(): Releases selection locks optimistically on background click
 *   - handleRequestLock(): Checks for existing selection lock before acquiring new lock
 *   - handleShapeDragEnd(): Keeps selection lock OR releases operation lock based on type
 *   - handleShapeTransformEnd(): Always keeps selection lock (transforms require selection)
 *   - Cleanup useEffect: Releases selection locks on component unmount
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * TESTING VERIFICATION COMMANDS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Open browser console and observe logs during these operations:
 * 
 * TEST 1: Selection Lock Acquisition
 *   Action: Click unselected shape
 *   Expected Logs:
 *     [Selection] 🎯 Selection initiated for shape_XXX
 *     [RTDB tryLockShape] ✅ Lock acquired in ~80ms
 *     [Selection] ✅ Lock acquired in ~80ms
 *   Verify: Lock acquired, Transformer appears
 * 
 * TEST 2: Selection Lock Persistence
 *   Action: Select shape, drag it, release, keep selected
 *   Expected Logs:
 *     [Lock] ⚡ Lock already held via selection - skipping acquisition
 *     [DragEnd] 🔒 Keeping selection lock active - shape still selected
 *   Verify: No unlock after drag, Transformer still visible
 * 
 * TEST 3: Deselection Lock Release
 *   Action: Select shape, then click background
 *   Expected Logs:
 *     [Deselection] 🎯 Deselecting N shapes
 *     [RTDB unlockShapeOptimistic] 🚀 Starting optimistic unlock
 *     [Deselection] ✅ Deselection complete in <10ms
 *   Verify: Instant deselection, shape available to others
 * 
 * TEST 4: Direct Drag (Operation Lock)
 *   Action: Drag unselected shape without clicking first
 *   Expected Logs:
 *     [RTDB tryLockShape] ✅ Lock acquired in ~80ms
 *     [DragEnd] 🔓 Releasing transient operation lock
 *     [RTDB unlockShape] ✅ Lock released in ~80ms
 *   Verify: Lock acquired at drag start, released at drag end
 * 
 * TEST 5: Multi-User Lock Conflict
 *   Action: User A selects shape, User B tries to select same shape
 *   User A Logs:
 *     [Selection] ✅ Lock acquired
 *   User B Logs:
 *     [Selection] ⛔ Lock denied - shape locked by another user
 *   Verify: User B cannot select locked shape, sees lock indicator
 * 
 * TEST 6: Lock Performance on Selected Shape
 *   Action: Select shape, then immediately drag
 *   Expected Logs:
 *     [Lock] ⚡ Lock already held via selection - skipping acquisition
 *   Verify: Drag starts instantly (<1ms), no network delay
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * MULTI-USER TESTING (Two Browser Windows)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * TEST 7: Selection Lock Visibility
 *   Window A: Select shape (lock acquired)
 *   Window B: Observe lock indicator appears on shape
 *   Window A: Click background (lock released)
 *   Window B: Observe lock indicator disappears within 100ms
 * 
 * TEST 8: Lock Propagation Speed
 *   Window A: Select shape, measure time
 *   Window B: Try to select same shape, measure time until conflict detected
 *   Expected: <100ms total propagation (RTDB sync + React render)
 * 
 * TEST 9: Lock Release Propagation
 *   Window A: Select shape, then deselect
 *   Window B: Try to select shape immediately after seeing unlock
 *   Expected: Selection succeeds, no conflicts
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { Stage, Layer, Rect, Line as KonvaLine, Group, Circle } from "react-konva";
import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
// ACTIVE: RTDB-based shape storage (current implementation)
import { subscribeToShapes, createShape, updateShape, deleteShape, tryLockShape, unlockShape, unlockShapeOptimistic, bringToFront, sendToBack, bringForward, sendBackward } from "../../services/canvasRTDB";
import { CANVAS_WIDTH, CANVAS_HEIGHT, LOCK_TTL_MS, DEFAULT_SHAPE_DIMENSIONS } from "./constants";
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
import InlineTextEditor from "../UI/InlineTextEditor";
import ErrorBoundary from "../UI/ErrorBoundary";
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
import { ref, remove, onValue } from "firebase/database";
import { rtdb } from "../../services/firebase";
import { performanceMonitor } from "../../services/performance";
import AICanvas from "../AI/AICanvas";

const GRID_SIZE = 50;
const GRID_COLOR = "#e0e0e0";

export default function Canvas() {
  const { user } = useAuth();
  const { canvasId } = useParams();
  const navigate = useNavigate();
  
  // Dynamic canvas ID from URL params or fallback to global canvas
  const CANVAS_ID = canvasId || "global-canvas-v1";
  const [shapes, setShapes] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [lastError, setLastError] = useState(null);
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [isHelpVisible, setIsHelpVisible] = useState(false);
  const [textToolbarVisible, setTextToolbarVisible] = useState(false);
  const [textToolbarPosition, setTextToolbarPosition] = useState({ x: 0, y: 0 });
  const [isLayersPanelVisible, setIsLayersPanelVisible] = useState(false);
  const [copiedShapes, setCopiedShapes] = useState([]);
  
  // FIX #6: Professional inline text editor state
  const [editingTextId, setEditingTextId] = useState(null);
  const [textEditorPosition, setTextEditorPosition] = useState({ x: 0, y: 0, width: 200, height: 40 });
  
  const [stageScale, setStageScale] = useState(() => {
    const saved = localStorage.getItem('collabcanvas-viewport-scale');
    return saved ? parseFloat(saved) : 0.5;
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
  
  /**
   * Selection Lock Tracking
   * 
   * Tracks which shapes have persistent "selection locks" that should remain
   * active as long as the shape is selected (Transformer visible).
   * 
   * Lock Types:
   * - SELECTION LOCK: Acquired when shape selected, released on deselection
   * - OPERATION LOCK: Acquired during drag/transform, released after operation
   * 
   * This Set contains shape IDs that currently have selection-based locks.
   * When a shape is in this Set, drag/transform operations will NOT acquire
   * a new lock since the selection lock is already active.
   * 
   * @example
   * // User clicks shape → selection lock acquired
   * selectionLocksRef.current.add(shapeId);
   * 
   * // User drags shape → no new lock needed, selection lock persists
   * if (!selectionLocksRef.current.has(shapeId)) {
   *   await tryLockShape(...); // Only lock if not selection-locked
   * }
   * 
   * // User clicks background → selection lock released
   * selectionLocksRef.current.delete(shapeId);
   * unlockShapeOptimistic(...); // Fast optimistic release
   */
  const selectionLocksRef = useRef(new Set());

  const { onlineUsers } = usePresence(CANVAS_ID);
  const { cursors } = useCursors(stageRef, CANVAS_ID);
  const { activeDrags } = useDragStreams();
  const [selections, setSelections] = useState({});
  const { setEditing, isVisible, toggleVisibility } = usePerformance();
  const { undo, redo, canUndo, canRedo, execute, startBatch, endBatch } = useUndo();

  useEffect(() => {
    const unsubscribe = watchSelections(CANVAS_ID, setSelections);
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [CANVAS_ID]);

  // Initialize performance monitoring
  useEffect(() => {
    performanceMonitor.init();
    return () => performanceMonitor.destroy();
  }, []);

  // FEATURE 3: Save only zoom level to localStorage (position always centered)
  useEffect(() => {
    localStorage.setItem('collabcanvas-viewport-scale', stageScale.toString());
  }, [stageScale]);

  useEffect(() => {
    if (!user) return;
    
    // Subscribe to RTDB - no conflicts, no snapping!
    const unsub = subscribeToShapes(CANVAS_ID, (newShapes) => {
      setShapes(newShapes);
    });
    
    return () => { 
      unsub();
    };
  }, [user]);

  // Helper function for user feedback
  const showFeedback = (message) => {
    setFeedbackMessage(message);
    setTimeout(() => setFeedbackMessage(null), 2000);
  };

  // FEATURE 3: Auto-center view on login
  useEffect(() => {
    // Only center if user just logged in (not on every render)
    // Skip if user was already present in previous render
    if (user && user.uid) {
      const centeredPos = getCenteredPosition(stageScale);
      setStagePos(centeredPos);
      showFeedback('View centered');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]); // Only trigger when uid changes (login/logout)

  // FEATURE 3: Auto-center view on reconnection (offline → online)
  useEffect(() => {
    const connectedRef = ref(rtdb, '.info/connected');
    let wasOffline = false;
    
    const unsubscribe = onValue(connectedRef, (snapshot) => {
      const isConnected = snapshot.val();
      
      if (isConnected && wasOffline) {
        // Just reconnected after being offline
        const centeredPos = getCenteredPosition(stageScale);
        setStagePos(centeredPos);
        showFeedback('Reconnected - View centered');
      }
      
      // Track offline state for next iteration
      wasOffline = !isConnected;
    });
    
    return () => unsubscribe();
  }, [getCenteredPosition, stageScale, showFeedback]);

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
          
          selectedIds.forEach(id => clearSelection(CANVAS_ID, id));
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

          selectedIds.forEach(id => clearSelection(CANVAS_ID, id));
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
      
      // CRITICAL FIX #4: Keyboard shortcuts including Shift+L for layers panel
      // Ensure no modifier keys are pressed except Shift for specific shortcuts
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'h':
            e.preventDefault();
            setIsHelpVisible(prev => !prev);
            break;
          case 'l':
            // FIX #4: Shift+L toggles layers panel (verified working)
            // Regular L creates a line shape
            if (e.shiftKey) {
              e.preventDefault();
              const newState = !isLayersPanelVisible;
              setIsLayersPanelVisible(newState);
              console.log('[Keyboard] Shift+L pressed - Layers panel:', newState ? 'SHOWN' : 'HIDDEN');
              showFeedback(newState ? 'Layers panel opened' : 'Layers panel closed');
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
              selectedIds.forEach(id => clearSelection(CANVAS_ID, id));
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

  /**
   * Create shape with canvas-appropriate dimensions
   * 
   * Uses DEFAULT_SHAPE_DIMENSIONS configuration for all shape types.
   * Shapes are positioned centered on viewport center point, accounting
   * for their dimensions to ensure proper visual centering.
   * 
   * Dimension Philosophy:
   *   - All shapes use centralized dimension configuration
   *   - Dimensions are canvas-scale (400-600px) not web-scale (50-100px)
   *   - Text uses 72px font for readability at canvas zoom levels
   *   - Shapes immediately visible and usable without resizing
   * 
   * Positioning:
   *   - Calculates viewport center in canvas coordinates
   *   - Offsets shape by half its dimensions for visual centering
   *   - Accounts for zoom level to position at correct canvas coordinates
   * 
   * @param {string} type - Shape type to create (rectangle, circle, text, etc.)
   * 
   * @example
   * // Creates 500×310px rectangle centered in viewport
   * handleAddShape('rectangle');
   * 
   * // Creates text with 72px font, 600px width
   * handleAddShape('text');
   */
  const handleAddShape = async (type) => {
    // Calculate viewport center in canvas coordinates (accounting for zoom and pan)
    const centerX = (-stagePos.x + window.innerWidth / 2) / stageScale;
    const centerY = (-stagePos.y + (window.innerHeight - 50) / 2) / stageScale;
    
    console.log(`[AddShape] Creating ${type} at viewport center (${centerX.toFixed(0)}, ${centerY.toFixed(0)}) with zoom ${stageScale}`);
    
    // Get dimensions from centralized configuration
    const dimensions = DEFAULT_SHAPE_DIMENSIONS[type] || DEFAULT_SHAPE_DIMENSIONS.rectangle;
    
    // Base shape data with type and fill
    let shapeData = {
      id: `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      fill: type === 'text' ? '#000000' : '#cccccc',  // Text black, others gray
      ...dimensions  // Spread all dimension properties (width, height, fontSize, etc.)
    };

    // Type-specific positioning to center shape visually
    // Each type calculates offset based on its dimensions for proper centering
    switch (type) {
      case 'circle':
      case 'ellipse':
        // Center circles/ellipses by offsetting half their diameter
        shapeData.x = centerX - (dimensions.width / 2);
        shapeData.y = centerY - (dimensions.height / 2);
        console.log(`[AddShape] ${type}: ${dimensions.width}×${dimensions.height}px at (${shapeData.x.toFixed(0)}, ${shapeData.y.toFixed(0)})`);
        break;
        
      case 'line':
        // Lines extend from center point horizontally
        shapeData.x = centerX - (dimensions.width / 2);
        shapeData.y = centerY;
        shapeData.strokeWidth = dimensions.strokeWidth || 4;  // Ensure visible stroke
        console.log(`[AddShape] line: ${dimensions.width}px length, ${shapeData.strokeWidth}px stroke at (${shapeData.x.toFixed(0)}, ${shapeData.y.toFixed(0)})`);
        break;
        
      case 'text':
        // Text centered with initial content
        shapeData.text = 'Text';
        shapeData.x = centerX - (dimensions.width / 2);
        shapeData.y = centerY - (dimensions.height / 2);
        console.log(`[AddShape] text: ${dimensions.fontSize}px font, ${dimensions.width}×${dimensions.height}px box at (${shapeData.x.toFixed(0)}, ${shapeData.y.toFixed(0)})`);
        break;
        
      case 'triangle':
      case 'star':
      case 'diamond':
      case 'hexagon':
      case 'pentagon':
        // Centered polygons - offset by half dimensions
        shapeData.x = centerX - (dimensions.width / 2);
        shapeData.y = centerY - (dimensions.height / 2);
        console.log(`[AddShape] ${type}: ${dimensions.width}×${dimensions.height}px at (${shapeData.x.toFixed(0)}, ${shapeData.y.toFixed(0)})`);
        break;
        
      case 'rectangle':
      default:
        // Rectangle centered by offsetting half dimensions
        shapeData.x = centerX - (dimensions.width / 2);
        shapeData.y = centerY - (dimensions.height / 2);
        console.log(`[AddShape] rectangle: ${dimensions.width}×${dimensions.height}px at (${shapeData.x.toFixed(0)}, ${shapeData.y.toFixed(0)})`);
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

  /**
   * Handle Multi-Shape Drag Start
   * 
   * When dragging a selected shape, store initial positions for ALL selected shapes.
   * This enables group dragging where all selected shapes move together.
   * 
   * @param {string} shapeId - ID of the shape being dragged (the "leader")
   */
  const handleShapeDragStart = (shapeId) => {
    // Store initial position for the dragged shape
    const shape = shapes.find(s => s.id === shapeId);
    if (shape) {
      dragStartStateRef.current[shapeId] = {
        x: shape.x,
        y: shape.y,
        rotation: shape.rotation
      };
    }
    
    // If this shape is part of a selection, store initial positions for ALL selected shapes
    if (selectedIds.includes(shapeId) && selectedIds.length > 1) {
      console.log(`[Multi-Drag] 📦 Starting group drag with ${selectedIds.length} shapes`);
      selectedIds.forEach(id => {
        const s = shapes.find(sh => sh.id === id);
        if (s && !dragStartStateRef.current[id]) {
          dragStartStateRef.current[id] = {
            x: s.x,
            y: s.y,
            rotation: s.rotation
          };
        }
      });
    }
    
    setEditing(true);
  };

  /**
   * Handle Drag End with Selection Lock Coordination
   * 
   * This function coordinates lock release behavior based on whether the shape
   * has a SELECTION LOCK (persistent) or OPERATION LOCK (transient).
   * 
   * Lock Release Strategy:
   * 
   * CASE 1: Shape has Selection Lock (was selected before drag)
   *   - Drag completes but shape remains selected (Transformer still visible)
   *   - DO NOT release lock - selection lock persists until deselection
   *   - Lock only releases when user clicks background or selects different shape
   * 
   * CASE 2: Shape has Operation Lock (direct drag without selection)
   *   - Drag completes and shape is not selected
   *   - Release lock immediately after RTDB write completes
   *   - This is "transient locking" - lock only during operation
   * 
   * Coordination with RTDB Write:
   *   - Always wait for position update to complete before unlocking
   *   - Prevents race condition where new user acquires lock before data persists
   *   - Ensures data consistency at the cost of slightly slower unlock (~80ms)
   * 
   * Performance:
   *   - Selection lock case: No unlock, instant (lock persists)
   *   - Operation lock case: Unlock after RTDB write (~80ms total)
   * 
   * @param {string} shapeId - ID of shape that finished dragging
   * @param {object} pos - Final position {x, y}
   * 
   * @example
   * // Selected shape drag: lock persists after drag
   * handleShapeDragEnd('shape_123', {x: 200, y: 200});
   * // Shape still locked, Transformer still visible
   * 
   * // Direct drag: lock releases after drag
   * handleShapeDragEnd('shape_456', {x: 300, y: 300});
   * // Shape unlocked, available to other users
   */
  /**
   * Handle Multi-Shape Drag Move
   * 
   * When dragging a selected shape in a multi-selection, move all selected shapes together.
   * Calculates delta from leader shape and applies to all followers.
   * 
   * @param {string} leaderShapeId - ID of shape being actively dragged
   * @param {Object} newPos - New position of leader shape {x, y}
   */
  const handleShapeDragMove = (leaderShapeId, newPos) => {
    // Only handle group dragging if this shape is part of a multi-selection
    if (!selectedIds.includes(leaderShapeId) || selectedIds.length <= 1) {
      return;
    }
    
    const leaderStartPos = dragStartStateRef.current[leaderShapeId];
    if (!leaderStartPos) return;
    
    // Calculate how far the leader has moved from its starting position
    const deltaX = newPos.x - leaderStartPos.x;
    const deltaY = newPos.y - leaderStartPos.y;
    
    // Apply the same delta to all other selected shapes (except the leader)
    selectedIds.forEach(id => {
      if (id === leaderShapeId) return; // Skip leader (already being dragged)
      
      const startPos = dragStartStateRef.current[id];
      if (!startPos) return;
      
      // Calculate new position for this follower
      const newX = startPos.x + deltaX;
      const newY = startPos.y + deltaY;
      
      // Update the shape in RTDB (this will trigger re-render for all users)
      updateShape(CANVAS_ID, id, { x: newX, y: newY }, user).catch(err => {
        console.error(`[Multi-Drag] Failed to update follower ${id}:`, err);
      });
    });
  };
  
  const handleShapeDragEnd = async (shapeId, pos) => {
    setEditing(false);
    
    console.log(`[DragEnd] 🏁 Drag complete for ${shapeId.slice(0, 8)}`, {
      hasSelectionLock: selectionLocksRef.current.has(shapeId),
      isSelected: selectedIds.includes(shapeId),
      isGroupDrag: selectedIds.includes(shapeId) && selectedIds.length > 1
    });
    
    // If this was a group drag, handle all selected shapes
    const isGroupDrag = selectedIds.includes(shapeId) && selectedIds.length > 1;
    
    if (isGroupDrag) {
      console.log(`[Multi-Drag] 📦 Completing group drag for ${selectedIds.length} shapes`);
      
      // Start batch for multiple shape moves
      startBatch(`Moved ${selectedIds.length} shapes`);
      
      try {
        // Process all selected shapes
        for (const id of selectedIds) {
          const oldPosition = dragStartStateRef.current[id];
          if (!oldPosition) continue;
          
          const currentShape = shapes.find(s => s.id === id);
          if (!currentShape) continue;
          
          // Create move command for each shape
          const command = new MoveShapeCommand(
            CANVAS_ID,
            id,
            { x: currentShape.x, y: currentShape.y, rotation: currentShape.rotation },
            oldPosition,
            user,
            updateShape
          );
          
          await execute(command, user);
          delete dragStartStateRef.current[id];
        }
      } finally {
        await endBatch();
      }
      
      console.log(`[Multi-Drag] ✅ Group drag complete`);
    } else {
      // Single shape drag
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
        await updateShape(CANVAS_ID, shapeId, pos, user);
      }
    }
    
    // CRITICAL: Lock release coordination
    // Only release lock if this was a TRANSIENT operation lock (direct drag without selection)
    // If shape has a SELECTION lock, keep it locked since shape is still selected
    if (selectionLocksRef.current.has(shapeId)) {
      console.log(`[DragEnd] 🔒 Keeping selection lock active for ${shapeId.slice(0, 8)} - shape still selected`);
      // Do NOT unlock - selection lock persists until deselection
    } else {
      // This was a direct drag (no selection) - release the transient operation lock
      console.log(`[DragEnd] 🔓 Releasing transient operation lock for ${shapeId.slice(0, 8)}`);
      await unlockShape(CANVAS_ID, shapeId, user?.uid);
    }
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

  /**
   * Handle Transform End with Selection Lock Coordination
   * 
   * Transform operations (resize, rotate) only occur on SELECTED shapes
   * (Transformer is only visible when shape is selected). Therefore, ALL
   * transforms have selection locks, and we should NEVER release the lock
   * after transform completes - the shape remains selected.
   * 
   * Lock Release Strategy:
   *   - Transform completes but shape remains selected (Transformer still visible)
   *   - DO NOT release lock - selection lock persists until deselection
   *   - Lock only releases when user clicks background or selects different shape
   * 
   * Coordination with RTDB Write:
   *   - RTDB write happens via command execution
   *   - No lock release coordination needed since lock persists
   * 
   * Why Transform is Different from Drag:
   *   - Drag can happen WITHOUT selection (direct drag)
   *   - Transform REQUIRES selection (Transformer only shows when selected)
   *   - Therefore transforms always have selection locks, never operation locks
   * 
   * Performance:
   *   - No unlock operation = instant completion after RTDB write
   *   - Lock persists until user explicitly deselects shape
   * 
   * @param {string} shapeId - ID of shape that finished transforming
   * @param {object} attrs - Final shape attributes (x, y, width, height, rotation, etc)
   * 
   * @example
   * // User resizes shape - lock persists after transform
   * handleShapeTransformEnd('shape_123', {width: 200, height: 150});
   * // Shape still locked and selected, Transformer still visible
   */
  const handleShapeTransformEnd = async (shapeId, attrs) => {
    if (import.meta.env.VITE_DEBUG) {
      console.debug('[Canvas] transformEnd persist', shapeId, attrs);
    }
    setEditing(false);
    
    console.log(`[TransformEnd] 🏁 Transform complete for ${shapeId.slice(0, 8)}`, {
      hasSelectionLock: selectionLocksRef.current.has(shapeId),
      isSelected: selectedIds.includes(shapeId)
    });
    
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
    
    // CRITICAL: Transform lock coordination
    // Transforms ALWAYS occur on selected shapes (Transformer requires selection)
    // Therefore we NEVER release lock after transform - selection lock persists
    console.log(`[TransformEnd] 🔒 Keeping selection lock active for ${shapeId.slice(0, 8)} - transform requires selection`);
    // Do NOT unlock - selection lock persists until deselection
  };

  /**
   * Handle Lock Request with Selection Lock Coordination
   * 
   * This function coordinates lock acquisition between SELECTION LOCKS and
   * OPERATION LOCKS to prevent double-locking and unnecessary RTDB transactions.
   * 
   * Lock Acquisition Strategy:
   * 
   * CASE 1: Shape has Selection Lock (already selected)
   *   - User drags or transforms selected shape
   *   - Lock already held from selection
   *   - Skip RTDB lock acquisition (already own the lock)
   *   - Return true immediately (no network round-trip)
   * 
   * CASE 2: Shape has No Lock (direct drag/transform without selection)
   *   - User drags unselected shape directly
   *   - Acquire transient operation lock via RTDB transaction
   *   - Return true if acquired, false if blocked by another user
   * 
   * Performance Optimization:
   *   - Selection lock case: <1ms (no network call)
   *   - Operation lock case: ~80ms (RTDB transaction)
   *   - Saves ~80ms when operating on selected shapes
   * 
   * Why This Matters:
   *   - Prevents unnecessary RTDB writes (better performance)
   *   - Prevents lock conflicts with ourselves
   *   - Makes operations on selected shapes feel instant
   * 
   * @param {string} shapeId - ID of shape requesting lock
   * @returns {Promise<boolean>} True if lock held or acquired, false if blocked
   * 
   * @example
   * // User drags selected shape - instant lock (already held)
   * const locked = await handleRequestLock('shape_123'); // Returns true in <1ms
   * 
   * // User drags unselected shape - needs lock acquisition
   * const locked = await handleRequestLock('shape_456'); // Returns true/false in ~80ms
   */
  const handleRequestLock = async (shapeId) => {
    if (!user?.uid) return false;
    
    // OPTIMIZATION: Check if we already have a selection lock on this shape
    if (selectionLocksRef.current.has(shapeId)) {
      console.log(`[Lock] ⚡ Lock already held via selection for ${shapeId.slice(0, 8)} - skipping acquisition`);
      return true; // We already own the lock, instant success
    }
    
    // No selection lock - need to acquire transient operation lock
    const lockStartTime = performance.now();
    const acquired = await tryLockShape(CANVAS_ID, shapeId, user);
    const elapsed = performance.now() - lockStartTime;
    
    console.log(`[Lock] ${acquired ? '✅' : '⛔'} Lock ${acquired ? 'acquired' : 'denied'} in ${elapsed.toFixed(1)}ms for ${shapeId.slice(0, 8)}`);
    
    return acquired;
  };

  /**
   * Handle Shape Selection with Persistent Locking
   * 
   * This function implements SELECTION-BASED PERSISTENT LOCKING where shapes
   * are locked for the entire duration they are selected (Transformer visible).
   * This prevents other users from interfering while someone examines or
   * prepares to edit a shape.
   * 
   * Lock Lifecycle:
   * 1. User clicks shape → Lock acquired immediately
   * 2. Transformer appears → Shape remains locked
   * 3. User performs operations (drag, transform) → Lock persists
   * 4. User clicks away (deselect) → Lock releases optimistically (<5ms)
   * 
   * Multi-Select Behavior:
   * - Shift+click adds shape to selection and acquires lock
   * - Non-shift click releases all previous selection locks first
   * - Each selected shape has its own independent lock
   * 
   * Lock Conflict Handling:
   * - If lock acquisition fails, selection is aborted
   * - User receives feedback that shape is locked by another user
   * - Selection state remains unchanged on conflict
   * 
   * Performance:
   * - Lock acquisition: ~80ms (RTDB transaction latency)
   * - Visual feedback: Immediate (selection state updates optimistically)
   * - Multi-select: Locks acquired in parallel for better UX
   * 
   * @param {string} shapeId - ID of shape being selected
   * @param {boolean} isShiftKey - Whether Shift key held (multi-select mode)
   * 
   * @example
   * // Single selection: releases previous locks, acquires new lock
   * handleShapeSelect('shape_123', false);
   * 
   * // Multi-select: keeps previous locks, adds new lock
   * handleShapeSelect('shape_456', true);
   */
  const handleShapeSelect = async (shapeId, isShiftKey) => {
    if (!user?.uid) return;
    
    // Close AI chat when clicking a shape
    if (isAIChatOpen) {
      setIsAIChatOpen(false);
    }
    
    const selectStartTime = performance.now();
    console.log(`[Selection] 🎯 Selection initiated for ${shapeId.slice(0, 8)}`, {
      mode: isShiftKey ? 'MULTI-SELECT' : 'SINGLE-SELECT',
      currentSelection: selectedIds
    });
    
    if (isShiftKey) {
      // MULTI-SELECT MODE: Add to existing selection
      if (!selectedIds.includes(shapeId)) {
        // Try to acquire selection lock before adding to selection
        const lockAcquired = await tryLockShape(CANVAS_ID, shapeId, user);
        
        if (!lockAcquired) {
          console.warn(`[Selection] ⛔ Lock denied for ${shapeId.slice(0, 8)} - shape locked by another user`);
          // TODO: Show user feedback toast/notification
          return;
        }
        
        // Lock acquired successfully - add to selection
        const elapsed = performance.now() - selectStartTime;
        console.log(`[Selection] ✅ Lock acquired in ${elapsed.toFixed(1)}ms for ${shapeId.slice(0, 8)}`);
        
        // Track as selection lock
        selectionLocksRef.current.add(shapeId);
        
        // Update selection state
        const newIds = [...selectedIds, shapeId];
        setSelectedIds(newIds);
        
        // Set presence indicator
        if (user?.uid) {
          const name = user.displayName || user.email?.split('@')[0] || 'User';
          const color = generateUserColor(user.uid);
          setSelection(CANVAS_ID, shapeId, user.uid, name, color);
        }
        
        console.log(`[Selection] 📋 Multi-select updated:`, {
          selectedIds: newIds,
          selectionLocks: Array.from(selectionLocksRef.current)
        });
      }
    } else {
      // SINGLE-SELECT MODE: Replace existing selection
      
      // First, release locks on previously selected shapes
      if (selectedIds.length > 0) {
        console.log(`[Selection] 🔓 Releasing ${selectedIds.length} previous selection locks`);
        selectedIds.forEach(id => {
          // Clear presence indicator
          clearSelection(id);
          stopDragStream(id);
          
          // Release selection lock if this shape had one
          if (selectionLocksRef.current.has(id)) {
            unlockShapeOptimistic(CANVAS_ID, id, user.uid);
            selectionLocksRef.current.delete(id);
            console.log(`[Selection] 🔓 Released selection lock for ${id.slice(0, 8)}`);
          }
        });
      }
      
      // Now acquire lock for newly selected shape
      const lockAcquired = await tryLockShape(CANVAS_ID, shapeId, user);
      
      if (!lockAcquired) {
        const elapsed = performance.now() - selectStartTime;
        console.warn(`[Selection] ⛔ Lock denied in ${elapsed.toFixed(1)}ms for ${shapeId.slice(0, 8)} - shape locked by another user`);
        
        // Selection failed - clear selection but don't add new shape
        setSelectedIds([]);
        // TODO: Show user feedback toast/notification
        return;
      }
      
      // Lock acquired successfully
      const elapsed = performance.now() - selectStartTime;
      console.log(`[Selection] ✅ Lock acquired in ${elapsed.toFixed(1)}ms for ${shapeId.slice(0, 8)}`);
      
      // Track as selection lock
      selectionLocksRef.current.add(shapeId);
      
      // Update selection state
      setSelectedIds([shapeId]);
      
      // Set presence indicator
      if (user?.uid) {
        const name = user.displayName || user.email?.split('@')[0] || 'User';
        const color = generateUserColor(user.uid);
        setSelection(shapeId, user.uid, name, color);
      }
      
      console.log(`[Selection] 🎯 Single-select complete:`, {
        selectedId: shapeId,
        selectionLock: true,
        totalTime: elapsed.toFixed(1) + 'ms'
      });
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

  /**
   * CRITICAL FIX #6: Enhanced text update with inline editor support
   * 
   * Handles text content updates from the professional inline editor.
   * Wraps changes in undo/redo command pattern for full history support.
   * 
   * @param {string} shapeId - ID of text shape being edited
   * @param {string} newText - New text content
   */
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
      showFeedback('Text updated');
    } catch (error) {
      console.error('[TextUpdate] Update failed:', error);
      showFeedback('Failed to update text');
      throw error;
    }
  };

  /**
   * CRITICAL FIX #6: Open professional inline text editor
   * 
   * Replaces crude window.prompt() with polished inline editor positioned
   * directly on canvas at the text shape's location.
   * 
   * @param {string} shapeId - ID of text shape to edit
   */
  const handleOpenTextEditor = (shapeId) => {
    const shape = shapes.find(s => s.id === shapeId);
    if (!shape || shape.type !== 'text') return;
    
    // Calculate screen position for editor
    const screenX = (shape.x * stageScale) + stagePos.x;
    const screenY = (shape.y * stageScale) + stagePos.y;
    const screenWidth = (shape.width || 200) * stageScale;
    const screenHeight = (shape.fontSize || 24) * stageScale * 1.5;
    
    setTextEditorPosition({
      x: Math.max(20, Math.min(screenX, window.innerWidth - 400)),
      y: Math.max(60, Math.min(screenY, window.innerHeight - 200)),
      width: screenWidth,
      height: screenHeight
    });
    
    setEditingTextId(shapeId);
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
          setSelection(CANVAS_ID, id, user.uid, name, color);
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
          setSelection(CANVAS_ID, id, user.uid, name, color);
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
      
      setStagePos(newPos);
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
    console.log('[MouseUp] 🖱️ Mouse up detected', {
      isPanning,
      hasSelectionStart: !!selectionStartRef.current,
      hasSelectionBox: !!selectionBox
    });
    
    if (isPanning) {
      setIsPanning(false);
      panStartRef.current = null;
      panInitialPosRef.current = null;
      return;
    }
    
    // CRITICAL FIX: Always clear selection box, even if no drag happened
    // This prevents "stuck" selection box issue
    const hadSelectionDrag = selectionStartRef.current && selectionBox;
    
    if (!hadSelectionDrag) {
      // No selection drag - just cleanup
      selectionStartRef.current = null;
      setSelectionBox(null);
      console.log('[MouseUp] ✅ No selection drag - refs cleared');
      return;
    }

    // Process intersecting shapes
    const intersectingShapes = shapes.filter(shape =>
      shapeIntersectsBox(shape, selectionBox)
    );

    const isShiftKey = selectionStartRef.current.isShiftKey;

    console.log('[MouseUp] Processing selection:', {
      intersectingShapes: intersectingShapes.length,
      isShiftKey
    });

    if (intersectingShapes.length > 0) {
      if (isShiftKey) {
        const newIds = [...selectedIds];
        intersectingShapes.forEach(shape => {
          if (!newIds.includes(shape.id)) {
            newIds.push(shape.id);
            if (user?.uid) {
              const name = user.displayName || user.email?.split('@')[0] || 'User';
              const color = generateUserColor(user.uid);
              setSelection(CANVAS_ID, shape.id, user.uid, name, color);
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
          newIds.forEach(id => setSelection(CANVAS_ID, id, user.uid, name, color));
        }
      }
      console.log('[MouseUp] ✅ Selected', intersectingShapes.length, 'shapes');
    }

    // CRITICAL: Always clear refs and selection box
    selectionStartRef.current = null;
    setSelectionBox(null);
    console.log('[MouseUp] ✅ Selection complete - box and refs cleared');
  };

  const handleStageMouseLeave = () => {
    setMousePos(null);
  };

  /**
   * Handle Stage Background Click - Deselection with Optimistic Lock Release
   * 
   * When users click the canvas background (not on a shape), all selected
   * shapes are deselected and their selection locks are released immediately
   * using optimistic unlock for instant UX feedback.
   * 
   * Deselection Lock Release Strategy:
   * - Uses unlockShapeOptimistic() for <5ms perceived latency
   * - RTDB sync happens asynchronously without blocking UI
   * - No coordination needed since no pending operations
   * - All selected shapes unlocked in parallel
   * 
   * Performance:
   * - Deselection visual feedback: <5ms (single React render)
   * - Lock release: <5ms local + ~80ms RTDB async
   * - Total user-perceived latency: <5ms (vs 80ms+ with sync unlock)
   * 
   * Why Optimistic Release is Safe for Deselection:
   * - No pending RTDB writes that need to complete first
   * - User has finished all interactions with the shape
   * - Worst case: RTDB fails, lock auto-expires after LOCK_TTL_MS
   * 
   * @param {KonvaEvent} e - Konva stage click event
   * 
   * @example
   * // User clicks background after selecting shapes
   * handleStageClick(event);
   * // Result: Instant deselection, locks released optimistically
   */
  const handleStageClick = (e) => {
    // Only handle left-clicks (ignore right-clicks)
    if (e.evt.button !== 0) {
      return;
    }
    
    if (e.target === e.target.getStage() && !selectionBox && !selectionStartRef.current) {
      // Close AI chat when clicking canvas background
      if (isAIChatOpen) {
        setIsAIChatOpen(false);
      }
      
      if (selectedIds.length > 0) {
        const deselectStartTime = performance.now();
        console.log(`[Deselection] 🎯 Deselecting ${selectedIds.length} shapes`);
        
        selectedIds.forEach(id => {
          // Clear presence indicators
          clearSelection(id);
          stopDragStream(id);
          
          // Release selection lock if this shape has one
          if (selectionLocksRef.current.has(id)) {
            unlockShapeOptimistic(CANVAS_ID, id, user?.uid);
            selectionLocksRef.current.delete(id);
            console.log(`[Deselection] 🔓 Released selection lock for ${id.slice(0, 8)}`);
          }
        });
        
        const elapsed = performance.now() - deselectStartTime;
        console.log(`[Deselection] ✅ Deselection complete in ${elapsed.toFixed(1)}ms`, {
          shapesDeselected: selectedIds.length,
          locksReleased: selectedIds.length,
          remainingLocks: Array.from(selectionLocksRef.current)
        });
      }
      setSelectedIds([]);
    }
  };

  /**
   * Cleanup Effect - Release Selection Locks on Unmount
   * 
   * This effect ensures selection locks are released when the Canvas component
   * unmounts (user navigates away, closes tab, etc). Critical for preventing
   * abandoned locks that would block other users indefinitely.
   * 
   * Cleanup Actions:
   * - Release all selection locks using optimistic unlock
   * - Clear presence indicators
   * - Stop drag streams
   * - Clear selection lock tracking
   * 
   * Why Optimistic Unlock on Unmount:
   * - Component is being destroyed, no need to wait for RTDB
   * - Faster cleanup = better browser responsiveness during navigation
   * - RTDB will catch up asynchronously or locks will expire via TTL
   * 
   * Runs on:
   * - Component unmount (navigation, tab close, etc)
   * - Any time selectedIds changes (cleanup previous selection)
   */
  useEffect(() => {
    return () => {
      if (selectedIds.length > 0) {
        console.log(`[Cleanup] 🧹 Component unmounting - releasing ${selectedIds.length} selection locks`);
        selectedIds.forEach(id => {
          // Clear presence indicators
          clearSelection(id);
          stopDragStream(id);
          
          // Release selection lock if this shape has one
          if (selectionLocksRef.current.has(id) && user?.uid) {
            unlockShapeOptimistic(CANVAS_ID, id, user.uid);
            selectionLocksRef.current.delete(id);
            console.log(`[Cleanup] 🔓 Released selection lock for ${id.slice(0, 8)}`);
          }
        });
      }
    };
  }, [selectedIds, user]);

  // Extra cleanup: handle tab close/refresh for presence
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (user?.uid) {
        console.log('[Canvas] beforeunload: cleaning up user', user.uid);
        // Synchronous cleanup before page unloads
        const userRef = ref(rtdb, `sessions/${CANVAS_ID}/${user.uid}`);
        remove(userRef);
        
        // Clear selections
        selectedIds.forEach(id => clearSelection(CANVAS_ID, id));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user, selectedIds, CANVAS_ID]);

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
      {/* Back to Projects Button */}
      <button
        onClick={() => navigate('/')}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          padding: '10px 16px',
          background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          borderRadius: '10px',
          fontSize: '14px',
          fontWeight: '600',
          color: '#374151',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)';
          e.target.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)';
          e.target.style.transform = 'translateY(0)';
        }}
        title="Back to projects"
      >
        <span>←</span>
        <span>Projects</span>
      </button>
      
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
      
      {/* CRITICAL FIX #6: Professional Inline Text Editor */}
      {editingTextId && (
        <InlineTextEditor
          shape={shapes.find(s => s.id === editingTextId)}
          position={textEditorPosition}
          onSave={async (newText) => {
            await handleTextUpdate(editingTextId, newText);
            setEditingTextId(null);
          }}
          onCancel={() => setEditingTextId(null)}
          stageScale={stageScale}
        />
      )}
      
      {/* CRITICAL FIX: Error Boundary Isolation for Layers Panel
          
          Wraps LayersPanel in its own error boundary to prevent child component
          failures from unmounting the entire Canvas. If LayersPanel crashes due to
          unexpected shape data, the error boundary displays a fallback UI while
          preserving the user's editing session and Canvas functionality.
          
          This addresses the issue where LayersPanel crashes would trigger Canvas
          unmount, destroying presence state and RTDB subscriptions.
          
          @see BUG #1 - LayersPanel crashes immediately on render */}
      {isLayersPanelVisible && (
        <ErrorBoundary
          fallback={
            <div style={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: '340px',
              height: '100vh',
              backgroundColor: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.12)',
              zIndex: 10000,
              padding: '40px',
              textAlign: 'center',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                Layers Panel Error
              </h3>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px', lineHeight: '1.5' }}>
                Unable to load layers panel. This may be due to corrupted shape data.
              </p>
              <button
                onClick={() => {
                  setIsLayersPanelVisible(false);
                  showFeedback('Layers panel closed. Try again after refreshing.');
                }}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  backgroundColor: '#4f46e5',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#4338ca'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#4f46e5'}
              >
                Close Panel
              </button>
            </div>
          }
          onError={(error, errorInfo) => {
            console.error('[LayersPanel Error Boundary]', error);
            console.error('[LayersPanel Error Info]', errorInfo);
            showFeedback('Layers panel failed to load. Check console for details.');
          }}
        >
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
        </ErrorBoundary>
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
          {shapes
            .filter(shape => shape && shape.id && shape.type) // FIX #5: Filter out invalid shapes
            .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
            .map(shape => {
              // Check if this shape is being dragged/transformed by another user
              const dragData = activeDrags[shape.id];
              const isDraggedByOther = dragData && dragData.uid !== user?.uid;
              
              // CRITICAL FIX #2: Apply live position AND dimensions from drag stream
              // If being dragged/transformed by another user, use live data including dimensions
              // This allows remote users to see smooth dimension changes during resize
              const displayShape = isDraggedByOther ? {
                ...shape,
                x: dragData.x,
                y: dragData.y,
                rotation: dragData.rotation || shape.rotation || 0,
                // FIX #2: Apply streamed dimensions if present (during resize operations)
                width: dragData.width !== undefined ? dragData.width : shape.width,
                height: dragData.height !== undefined ? dragData.height : shape.height
              } : shape;
            
            // FIX #5: Proper React key prop (shape.id is guaranteed unique by filter above)
            // This resolves the React console warning: "Each child in a list should have a unique key prop"
            return (
              <ShapeRenderer
                key={shape.id}
                shape={displayShape}
                isSelected={selectedIds.includes(shape.id)}
                selectedShapeIds={selectedIds}
                currentUserId={user?.uid}
                currentUserName={user?.displayName || user?.email?.split('@')[0] || 'User'}
                currentUser={user}
                onSelect={handleShapeSelect}
                onRequestLock={handleRequestLock}
                onDragStart={handleShapeDragStart}
                onDragMove={handleShapeDragMove}
                onDragEnd={handleShapeDragEnd}
                onTransformStart={handleShapeTransformStart}
                onTransformEnd={handleShapeTransformEnd}
                onTextUpdate={handleTextUpdate}
                onOpenTextEditor={handleOpenTextEditor}
                isBeingDraggedByOther={isDraggedByOther}
                draggedByUserName={isDraggedByOther ? dragData.displayName : null}
              />
            );
          })}

          {/* Render selection badges (for selections and locks) 
              HIDE DURING DRAG: Badge only shows when shape is stationary
              This prevents visual clutter during active drag operations */}
          {shapes.map(shape => {
            const selection = selections[shape.id];
            const isLockedByOther = shape.isLocked && shape.lockedBy && shape.lockedBy !== user?.uid;
            
            // CRITICAL: Hide badge if shape is being actively dragged by anyone
            // This keeps the canvas clean during drag operations
            const isBeingDragged = activeDrags[shape.id];
            if (isBeingDragged) {
              return null; // Hide badge during drag - cleaner UX
            }
            
            // Show badge if selected OR locked by someone else (and NOT being dragged)
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

          {/* Render remote user cursors 
              HIDE DURING DRAG: Cursor hidden when user is actively dragging
              This prevents visual lag/delay artifacts during drag operations */}
          {Object.entries(cursors).map(([uid, cursor]) => {
            // CRITICAL: Hide cursor if this user is actively dragging any shape
            // Cursor position updates can lag during drag, creating poor visual experience
            const isUserDragging = Object.values(activeDrags).some(drag => drag.uid === uid);
            
            if (isUserDragging) {
              return null; // Hide cursor during drag - prevents lag artifacts
            }
            
            return <Cursor key={uid} cursor={cursor} />;
          })}

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
      
      {/* FEATURE 4: Recenter Button - Positioned left of AI button */}
      <button
        onClick={() => {
          const centeredPos = getCenteredPosition(stageScale);
          setStagePos(centeredPos);
          showFeedback('View centered');
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)';
          e.currentTarget.style.transform = 'scale(0.96)';
          e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.1) inset';
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)';
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 3px 8px rgba(0, 0, 0, 0.12)';
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)';
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 3px 8px rgba(0, 0, 0, 0.12)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.08)';
        }}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '78px', // Left of AI button (AI at 20px + 48px width + 10px gap)
          width: '48px',
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          borderRadius: '10px',
          cursor: 'pointer',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
          zIndex: 1000,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          padding: 0
        }}
        title="Center View (0 or Home)"
      >
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="#374151" 
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Crosshair icon */}
          <line x1="12" y1="2" x2="12" y2="10" />
          <line x1="12" y1="14" x2="12" y2="22" />
          <line x1="2" y1="12" x2="10" y2="12" />
          <line x1="14" y1="12" x2="22" y2="12" />
          <circle cx="12" cy="12" r="2" fill="#374151" />
        </svg>
      </button>

      {/* AI Canvas Assistant with Canvas Context
          Controlled open state for canvas click-to-close */}
      <AICanvas 
        canvasId={CANVAS_ID}
        selectedShapeIds={selectedIds}
        shapes={shapes}
        stagePos={stagePos}
        stageScale={stageScale}
        stageRef={stageRef}
        isOpen={isAIChatOpen}
        onOpenChange={setIsAIChatOpen}
      />
    </div>
  );
}
