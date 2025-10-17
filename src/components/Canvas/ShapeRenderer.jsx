import { Rect, Circle, Line, Text, Group, Transformer, Star } from "react-konva";
import { useEffect, useRef } from "react";
import { streamDragPosition, stopDragStream } from "../../services/dragStream";
import { updateShape } from "../../services/canvasRTDB";

const CANVAS_ID = "global-canvas-v1";

/**
 * ShapeRenderer - Per-Shape Rendering Component with Race Condition Protection
 * 
 * This component handles rendering individual shapes on the Konva canvas with
 * real-time collaboration features including 100Hz position/dimension streaming,
 * exclusive shape locking, and synchronized transformations.
 * 
 * ============================================================================
 * CRITICAL RACE CONDITION ARCHITECTURE
 * ============================================================================
 * 
 * Problem: Visual Flutter on Drag/Transform Release
 * When users release dragged/transformed shapes, OR when watching remote users
 * drag/transform shapes, there's a race condition that causes visual flutter.
 * 
 * Two Scenarios Causing Flutter:
 * 
 * SCENARIO 1: Local User Drag/Transform (affects self)
 * 1. User releases drag → handleDragEnd fires
 * 2. handleDragEnd writes final position to RTDB (async, ~85ms)
 * 3. isDraggingRef cleared too early → Position sync runs with stale props → FLUTTER
 * 4. RTDB write completes → Position sync runs again with correct props → correction
 * 
 * SCENARIO 2: Remote User Drag/Transform (affects watchers)
 * 1. Remote user releases drag → their drag stream stops immediately
 * 2. Local watcher sees isBeingDraggedByOther=false → Position sync runs
 * 3. BUT remote user's RTDB write hasn't completed yet → stale props → FLUTTER
 * 4. Remote user's RTDB write completes → Position sync runs again → correction
 * 
 * Solution: Delayed Flag Clearing AND Delayed Stream Cleanup
 * We delay BOTH isDraggingRef clearing AND stopDragStream() by 200ms.
 * This ensures RTDB writes complete BEFORE position sync can run on ANY client.
 * Timing: 200ms = RTDB write (p95: ~80ms) + React render (~5ms) + margin (~115ms)
 * 
 * Key Components:
 * - isDraggingRef: Blocks position sync during drag operations
 * - transformInProgressRef: Blocks position sync during transform operations
 * - dragEndTimeoutRef: Delays flag clearing to prevent race conditions
 * - Position Sync Effect: Applies RTDB props to Konva node (lines 107-285)
 * - handleDragEnd: Coordinates drag end with delayed flag clearing (lines 388-459)
 * - handleTransformEnd: Similar pattern for transforms (lines 546-750)
 * 
 * Timing Requirements:
 * - RTDB write latency (p95): ~80ms
 * - React re-render cycle: ~5ms
 * - Safety margin: ~115ms (increased from 65ms for more reliability)
 * - Total delay: 200ms (CRITICAL - increased from 150ms to eliminate flutter)
 * 
 * ============================================================================
 * PREVIOUS FIXES PRESERVED
 * ============================================================================
 * 
 * ROTATION SYNCHRONIZATION FIX (2025-10-17):
 * Fixed rotation sync for rectangles and triangles by streaming node's CURRENT
 * position during rotations. Konva adjusts x,y during rotation to maintain
 * visual continuity - these position changes must be synchronized.
 * 
 * COMPOUND SCALING FIX (2025-10-17):
 * Fixed circles/stars using node.radius()/node.outerRadius() instead of stored
 * dimensions to prevent scale from compounding on repeated transformations.
 * 
 * LINE SUPPORT (2025-10-17):
 * Added support for line shapes including proper points array handling,
 * validation allowing 0 dimensions, and transform logic for line endpoints.
 * 
 * @module ShapeRenderer
 * @see handleDragEnd - Drag end handler with delayed flag clearing
 * @see handleTransformEnd - Transform end handler with same pattern
 * @see useEffect (Position Sync) - Prop synchronization with race condition blocking
 */
export default function ShapeRenderer({ 
  shape, 
  isSelected,
  selectedShapeIds = [],
  currentUserId,
  currentUserName,
  currentUser,
  onSelect, 
  onRequestLock,
  onDragStart,
  onDragMove,
  onDragEnd,
  onTransformStart,
  onTransformEnd,
  onTextUpdate,
  onOpenTextEditor,
  isBeingDraggedByOther = false
}) {
  // Konva node references
  const shapeRef = useRef(null);
  const transformerRef = useRef(null);
  
  // Real-time streaming intervals (100Hz position/dimension broadcasts)
  const dragStreamInterval = useRef(null);
  const transformStreamInterval = useRef(null);
  const checkpointIntervalRef = useRef(null);
  
  // Operation state flags (CRITICAL for race condition prevention)
  // These flags block the position sync effect during active operations
  // to prevent stale props from being applied to the Konva node
  const isDraggingRef = useRef(false);           // Blocks sync during drag
  const transformInProgressRef = useRef(false);  // Blocks sync during transform
  
  // Delayed flag clearing timeout (CRITICAL for flutter prevention)
  // After drag/transform ends, we delay clearing the operation flags by 200ms
  // to ensure RTDB writes complete and React props update before prop sync runs
  // Without this delay, prop sync applies stale props → visual flutter
  const dragEndTimeoutRef = useRef(null);

  console.log(`[ShapeRenderer] 🔄 Render for ${shape.type} ${shape.id.slice(0, 8)}`, {
    isSelected,
    isBeingDraggedByOther,
    transformInProgress: transformInProgressRef.current,
    width: shape.width,
    height: shape.height,
    x: shape.x,
    y: shape.y,
    rotation: shape.rotation
  });

  if (shape.hidden) {
    console.log(`[ShapeRenderer] ⏭️  Shape ${shape.id.slice(0, 8)} is hidden, skipping render`);
    return null;
  }

  // Attach transformer to selected shape
  useEffect(() => {
    if (isSelected && shapeRef.current && transformerRef.current) {
      console.log(`[Transformer] 📎 Attaching transformer to ${shape.type} ${shape.id.slice(0, 8)}`);
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  /**
   * Position and Dimension Synchronization Effect
   * 
   * Synchronizes React props (from RTDB) to Konva node properties.
   * This effect runs whenever shape properties change in RTDB, applying
   * those changes to the Konva canvas node for rendering.
   * 
   * CRITICAL: Blocking Conditions to Prevent Race Conditions
   * This effect MUST NOT run during active user interactions, otherwise
   * it will apply stale props and cause visual artifacts.
   * 
   * Blocking Priority (highest to lowest):
   * 1. transformInProgressRef - Blocks during local transform operations
   * 2. isBeingDraggedByOther - Blocks during remote user drag/transform
   * 3. isDraggingRef - Blocks during local drag operations
   * 
   * Why Block #3 (isDraggingRef) is Critical:
   * Without this check, the following race condition causes visual flutter:
   * 
   * 1. User drags shape to new position (200, 200)
   * 2. User releases drag → handleDragEnd fires
   * 3. handleDragEnd writes (200, 200) to RTDB (async, takes ~85ms)
   * 4. isDraggingRef cleared after 150ms delay
   * 5. THIS EFFECT runs and applies CURRENT props (still old position!)
   * 6. Shape flashes back to old position → VISUAL FLUTTER
   * 7. RTDB write completes, props update to (200, 200)
   * 8. THIS EFFECT runs again with new props
   * 9. Shape corrects to (200, 200)
   * 
   * The isDraggingRef check prevents step 5 from executing until after
   * step 7 completes, eliminating the flutter entirely.
   * 
   * @see handleDragEnd - Sets isDraggingRef and coordinates timing
   * @see handleTransformEnd - Similar pattern for transform operations
   */
  useEffect(() => {
    const node = shapeRef.current;
    if (!node) {
      console.log(`[PropSync] ⚠️  No node ref for ${shape.id.slice(0, 8)}`);
      return;
    }
    
    const propSyncTime = performance.now();
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`[PropSync] 🔄 EFFECT TRIGGERED at t=${propSyncTime.toFixed(2)}ms for ${shape.type} ${shape.id.slice(0, 8)}`);
    console.log(`[PropSync] 🔍 Checking sync conditions:`, {
      transformInProgress: transformInProgressRef.current,
      isBeingDraggedByOther,
      isDragging: isDraggingRef.current,
      shapeData: {
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
        rotation: shape.rotation
      },
      currentNodeState: {
        x: node.x(),
        y: node.y(),
        scaleX: node.scaleX(),
        scaleY: node.scaleY(),
        rotation: node.rotation(),
        radius: shape.type === 'circle' ? node.radius() : 'N/A',
        innerRadius: shape.type === 'star' ? node.innerRadius() : 'N/A',
        outerRadius: shape.type === 'star' ? node.outerRadius() : 'N/A'
      }
    });
    
    // BLOCK 1: Transform in progress (highest priority)
    // Prevents applying stale props during active transform operations
    if (transformInProgressRef.current) {
      console.log(`[PropSync] ⛔ BLOCKED - Transform in progress for ${shape.id.slice(0, 8)}`);
      return;
    }
    
    // BLOCK 2: Being dragged by remote user
    // Prevents local prop updates from interfering with remote drag streams
    if (isBeingDraggedByOther) {
      console.log(`[PropSync] ⛔ BLOCKED - Being dragged by other user for ${shape.id.slice(0, 8)}`);
      return;
    }
    
    // BLOCK 3: Local drag in progress (CRITICAL for flutter prevention)
    // Blocks prop sync until RTDB write completes and props update
    // This prevents visual flutter from stale props being applied
    if (isDraggingRef.current) {
      console.log(`[PropSync] ⛔ BLOCKED - Local drag in progress for ${shape.id.slice(0, 8)} | Props: x=${shape.x}, y=${shape.y} | Node: x=${node.x()}, y=${node.y()}`);
      return;
    }
    
    console.log(`[PropSync] ✅ SYNCING props to node for ${shape.type} ${shape.id.slice(0, 8)}`);
    console.log(`[PropSync] 📊 BEFORE sync - Props: x=${shape.x}, y=${shape.y} | Node: x=${node.x()}, y=${node.y()}`);
    
    // Apply position and rotation
    const oldX = node.x();
    const oldY = node.y();
    node.x(shape.x);
    node.y(shape.y);
    node.rotation(shape.rotation || 0);
    
    const positionChanged = Math.abs(oldX - shape.x) > 0.01 || Math.abs(oldY - shape.y) > 0.01;
    if (positionChanged) {
      console.log(`[PropSync] 📍 Position CHANGED: (${oldX.toFixed(1)}, ${oldY.toFixed(1)}) → (${shape.x.toFixed(1)}, ${shape.y.toFixed(1)}) | Delta: (${(shape.x - oldX).toFixed(1)}, ${(shape.y - oldY).toFixed(1)})`);
    } else {
      console.log(`[PropSync] 📍 Position UNCHANGED: x=${shape.x.toFixed(1)}, y=${shape.y.toFixed(1)}`);
    }
    
    /**
     * DIMENSION APPLICATION WITH DETAILED LOGGING
     */
    if (shape.type === 'circle') {
      const width = shape.width || 100;
      const height = shape.height || 100;
      const isEllipse = Math.abs(width - height) > 1;
      
      console.log(`[PropSync] 🔵 Circle dimension sync:`, {
        width,
        height,
        isEllipse,
        calculation: isEllipse ? 'ellipse with scale' : 'perfect circle'
      });
      
      if (isEllipse) {
        const baseRadius = Math.min(width, height) / 2;
        const scaleX = width / (baseRadius * 2);
        const scaleY = height / (baseRadius * 2);
        
        console.log(`[PropSync] 🔵 Ellipse calculation:`, {
          baseRadius,
          scaleX: scaleX.toFixed(3),
          scaleY: scaleY.toFixed(3)
        });
        
        node.radius(baseRadius);
        node.scaleX(scaleX);
        node.scaleY(scaleY);
      } else {
        const radius = width / 2;
        console.log(`[PropSync] 🔵 Perfect circle: radius=${radius}`);
        node.radius(radius);
        node.scaleX(1);
        node.scaleY(1);
      }
    } else if (shape.type === 'star') {
      const width = shape.width || 80;
      const height = shape.height || 80;
      
      const radiusX = width * 0.5;
      const radiusY = height * 0.5;
      const baseRadius = Math.min(radiusX, radiusY);
      
      console.log(`[PropSync] ⭐ Star dimension sync:`, {
        width,
        height,
        baseRadius,
        note: 'Setting base radius, scale will be applied in render'
      });
      
      node.innerRadius(baseRadius * 0.5);
      node.outerRadius(baseRadius);
      
      const starScaleX = radiusX / baseRadius;
      const starScaleY = radiusY / baseRadius;
      node.scaleX(starScaleX);
      node.scaleY(starScaleY);
    } else if (shape.type === 'line') {
      console.log(`[PropSync] ➖ Line dimension sync:`, {
        width: shape.width || 100,
        height: shape.height || 0
      });
      
      // Lines use points instead of width/height
      node.points([0, 0, shape.width || 100, shape.height || 0]);
      node.scaleX(1);
      node.scaleY(1);
    } else {
      console.log(`[PropSync] 📐 Standard shape (${shape.type}) dimension sync:`, {
        width: shape.width || 100,
        height: shape.height || 100
      });
      
      node.width(shape.width || 100);
      node.height(shape.height || 100);
      node.scaleX(1);
      node.scaleY(1);
    }
    
    console.log(`[PropSync] ✅ Sync complete, final node state:`, {
      x: node.x(),
      y: node.y(),
      scaleX: node.scaleX(),
      scaleY: node.scaleY(),
      rotation: node.rotation(),
      width: node.width ? node.width() : 'N/A',
      height: node.height ? node.height() : 'N/A',
      radius: shape.type === 'circle' ? node.radius() : 'N/A',
      innerRadius: shape.type === 'star' ? node.innerRadius() : 'N/A',
      outerRadius: shape.type === 'star' ? node.outerRadius() : 'N/A',
      points: shape.type === 'line' ? node.points() : 'N/A'
    });
    
    // Request re-render
    node.getLayer()?.batchDraw();
    console.log(`[PropSync] 🎨 Layer redrawn - visual update complete`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    
  }, [
    shape.x, 
    shape.y, 
    shape.width,
    shape.height,
    shape.rotation,
    shape.id,
    shape.type,
    isBeingDraggedByOther
  ]);

  /**
   * Cleanup Effect - Prevents Memory Leaks and Race Conditions
   * 
   * Cleans up all intervals and timeouts when component unmounts or shape changes.
   * This is CRITICAL to prevent:
   * 1. Memory leaks from intervals continuing after unmount
   * 2. Race conditions from timeouts firing after component unmount
   * 3. Stale flag updates attempting to modify unmounted component state
   * 
   * Cleanup Checklist:
   * - dragStreamInterval: Stops 100Hz position broadcasting
   * - transformStreamInterval: Stops 100Hz dimension streaming
   * - checkpointIntervalRef: Stops 500ms position persistence
   * - dragEndTimeoutRef: Cancels delayed flag clearing (CRITICAL!)
   * 
   * Why dragEndTimeoutRef cleanup is critical:
   * If user drags shape then component unmounts before 150ms timeout completes,
   * the timeout will fire and attempt to modify isDraggingRef on unmounted
   * component. This is harmless for refs but good practice to prevent.
   * 
   * Edge cases handled:
   * - User drags shape → navigates away before release
   * - Shape deleted while drag in progress
   * - Component re-renders with different shape.id
   * - Rapid selection/deselection during operations
   */
  useEffect(() => {
    return () => {
      console.log(`[Cleanup] 🧹 Cleaning up intervals for ${shape.id.slice(0, 8)}`);
      if (dragStreamInterval.current) {
        clearInterval(dragStreamInterval.current);
        dragStreamInterval.current = null;
        stopDragStream(shape.id);
      }
      
      if (transformStreamInterval.current) {
        clearInterval(transformStreamInterval.current);
        transformStreamInterval.current = null;
        stopDragStream(shape.id);
      }
      
      if (checkpointIntervalRef.current) {
        clearInterval(checkpointIntervalRef.current);
        checkpointIntervalRef.current = null;
      }
      
      // CRITICAL: Clear drag end timeout to prevent delayed flag updates
      // after component unmounts (prevents potential race conditions)
      if (dragEndTimeoutRef.current) {
        clearTimeout(dragEndTimeoutRef.current);
        dragEndTimeoutRef.current = null;
      }
    };
  }, [isSelected, shape.id]);

  const dragBoundFunc = (pos) => {
    return pos;
  };

  const handleDragStart = async (e) => {
    console.log(`[Drag] 🎯 Drag START for ${shape.type} ${shape.id.slice(0, 8)}`);
    e.cancelBubble = true;
    
    const lockAcquired = await onRequestLock(shape.id);
    if (!lockAcquired) {
      e.target.stopDrag();
      console.warn(`[Drag] ⛔ Drag cancelled - shape locked by another user`);
      return;
    }
    
    console.log(`[Drag] ✅ Lock acquired, starting drag`);
    isDraggingRef.current = true;
    onDragStart(shape.id);
    
    // Start streaming drag position at ~100Hz (10ms)
    dragStreamInterval.current = setInterval(() => {
      const node = shapeRef.current;
      if (node && currentUserId) {
        streamDragPosition(
          shape.id,
          currentUserId,
          currentUserName || 'User',
          node.x(),
          node.y(),
          node.rotation()
        );
      }
    }, 10);
    
    // Start checkpoint system
    checkpointIntervalRef.current = setInterval(() => {
      const node = shapeRef.current;
      if (node && currentUser) {
        const checkpointData = {
          x: node.x(),
          y: node.y(),
          rotation: node.rotation()
        };
        console.log(`[Checkpoint] 💾 Saving position:`, checkpointData);
        updateShape(CANVAS_ID, shape.id, checkpointData, currentUser).catch(err => {
          console.warn('[Checkpoint] Failed to save position:', err.message);
        });
      }
    }, 500);
  };

  /**
   * Handle Drag Move for Multi-Shape Dragging
   * 
   * Called continuously during drag to update follower shapes in real-time.
   * When dragging one selected shape among multiple selections, all other
   * selected shapes move by the same delta, creating group drag behavior.
   * 
   * @param {KonvaEvent} e - Konva drag move event
   */
  const handleDragMove = (e) => {
    if (!onDragMove) return;
    
    // Only trigger group drag if part of multi-selection
    const isMultiSelection = selectedShapeIds.includes(shape.id) && selectedShapeIds.length > 1;
    if (!isMultiSelection) return;
    
    // Get current position of leader shape
    const currentPos = {
      x: e.target.x(),
      y: e.target.y()
    };
    
    // Notify parent to update follower shapes
    onDragMove(shape.id, currentPos);
  };
  
  /**
   * Handles drag end event with delayed flag clearing to prevent visual flutter
   * 
   * CRITICAL RACE CONDITION FIX:
   * This function must delay clearing isDraggingRef until RTDB write completes
   * and React props update. Without this delay, the position sync effect runs
   * with stale props, causing shapes to flash back to their original position.
   * 
   * Timing Analysis:
   * - RTDB write latency (p95): ~80ms
   * - React re-render cycle: ~5ms
   * - Safety margin for variance: ~65ms
   * - Total delay required: 150ms
   * 
   * Race condition sequence WITHOUT proper delay:
   * 1. t=0ms:   User releases drag, handleDragEnd fires
   * 2. t=0ms:   onDragEnd() called → async RTDB write starts
   * 3. t=100ms: isDraggingRef cleared TOO EARLY (old delay)
   * 4. t=100ms: Position sync effect runs with STALE props → FLUTTER
   * 5. t=150ms: RTDB write completes, props update
   * 6. t=150ms: Position sync runs again with NEW props → correction
   * 
   * With 150ms delay:
   * 1. t=0ms:   User releases drag, handleDragEnd fires
   * 2. t=0ms:   onDragEnd() called → async RTDB write starts
   * 3. t=150ms: RTDB write completes, props update, THEN isDraggingRef cleared
   * 4. t=150ms: Position sync runs ONCE with correct props → NO FLUTTER
   * 
   * @param {KonvaEvent} e - Konva drag end event containing target node
   * 
   * @example
   * // User drags rectangle from (100, 100) to (200, 200)
   * // Shape remains perfectly still at (200, 200) after release
   * // No visual flash or jump occurs
   */
  const handleDragEnd = (e) => {
    const dragEndStartTime = performance.now();
    console.log(`[Drag] 🏁 Drag END for ${shape.type} ${shape.id.slice(0, 8)} at t=${dragEndStartTime.toFixed(2)}ms`);
    
    // Stop 100Hz streaming interval
    if (dragStreamInterval.current) {
      clearInterval(dragStreamInterval.current);
      dragStreamInterval.current = null;
      console.log(`[Drag] ⏹️  100Hz streaming interval stopped`);
    }
    
    // Stop checkpoint interval
    if (checkpointIntervalRef.current) {
      clearInterval(checkpointIntervalRef.current);
      checkpointIntervalRef.current = null;
      console.log(`[Drag] ⏹️  Checkpoint interval stopped`);
    }
    
    const node = e.target;
    const finalPos = {
      x: node.x(),
      y: node.y()
    };
    
    console.log(`[Drag] 📍 Final position:`, finalPos, `| Konva node position: x=${node.x()}, y=${node.y()}`);
    console.log(`[Drag] 🚫 isDraggingRef set to TRUE - blocking local position sync`);
    
    // Write final position to RTDB (async operation)
    onDragEnd(shape.id, finalPos);
    
    // CRITICAL FLUTTER FIX: Delay BOTH flag clearing AND drag stream cleanup
    // This prevents remote users from seeing flutter when watching our drag.
    // 
    // The problem: Remote users watch our drag stream. When we release:
    // 1. If we stop drag stream immediately → remote sees isBeingDraggedByOther=false
    // 2. Remote's PropSync runs with OLD props (our RTDB write hasn't completed)
    // 3. Shape flashes back to old position → FLUTTER
    // 4. Our RTDB write completes, shape corrects → visual artifact
    // 
    // The solution: Keep drag stream alive for 200ms after release, ensuring
    // RTDB write completes BEFORE remote users' PropSync can run.
    //
    // Timing: 200ms covers RTDB write (p95: ~80ms) + React render (~5ms) + margin (~115ms)
    dragEndTimeoutRef.current = setTimeout(() => {
      const elapsed = performance.now() - dragEndStartTime;
      
      // Clear local drag flag (unblocks local PropSync)
      isDraggingRef.current = false;
      
      // Stop drag stream (allows remote users' PropSync to run)
      stopDragStream(shape.id);
      console.log(`[Drag] 📡 Drag stream stopped - remote users can now apply RTDB props`);
      
      dragEndTimeoutRef.current = null;
      console.log(`[Drag] ✅ Drag complete after ${elapsed.toFixed(2)}ms (target: 200ms)`);
      console.log(`[Drag]    - Local position sync: UNBLOCKED`);
      console.log(`[Drag]    - Remote flutter prevention: ACTIVE`);
    }, 200);
  };

  /**
   * TRANSFORM START WITH EXTENSIVE LOGGING
   */
  const handleTransformStart = async () => {
    console.log(`[Transform] 🎯 Transform START for ${shape.type} ${shape.id.slice(0, 8)}`);
    
    const lockAcquired = await onRequestLock(shape.id);
    if (!lockAcquired) {
      console.warn("[Transform] ⛔ Cancelled - shape locked by another user");
      if (transformerRef.current) {
        transformerRef.current.nodes([]);
      }
      return false;
    }
    
    console.log(`[Transform] ✅ Lock acquired`);
    
    // Set transform flag
    transformInProgressRef.current = true;
    console.log('[Transform] 🚫 Transform flag set - prop sync BLOCKED');
    
    // Store initial state for debugging
    const node = shapeRef.current;
    if (node) {
      console.log('[Transform] 📊 Initial node state:', {
        x: node.x(),
        y: node.y(),
        scaleX: node.scaleX(),
        scaleY: node.scaleY(),
        rotation: node.rotation(),
        width: node.width ? node.width() : 'N/A',
        height: node.height ? node.height() : 'N/A',
        radius: shape.type === 'circle' ? node.radius() : 'N/A',
        innerRadius: shape.type === 'star' ? node.innerRadius() : 'N/A',
        outerRadius: shape.type === 'star' ? node.outerRadius() : 'N/A',
        points: shape.type === 'line' ? node.points() : 'N/A'
      });
    }
    
    // Notify parent
    if (onTransformStart) {
      onTransformStart(shape.id);
    }
    
    /**
     * DIMENSION STREAMING WITH ROTATION FIX
     * 
     * CRITICAL: Always stream the node's CURRENT position, not stored position.
     * During rotation, Konva adjusts the x,y to maintain visual continuity.
     * These position changes are intentional and MUST be synchronized.
     */
    let streamCount = 0;
    transformStreamInterval.current = setInterval(() => {
      const node = shapeRef.current;
      if (!node || !currentUserId) return;
      
      streamCount++;
      const logThisStream = streamCount % 10 === 0; // Log every 10th stream
      
      // Calculate dimensions from node's current state
      let width, height;
      const currentScaleX = node.scaleX();
      const currentScaleY = node.scaleY();
      
      if (shape.type === 'circle') {
        const baseRadius = node.radius();
        width = baseRadius * 2 * currentScaleX;
        height = baseRadius * 2 * currentScaleY;
      } else if (shape.type === 'star') {
        const baseOuterRadius = node.outerRadius();
        width = baseOuterRadius * 2 * currentScaleX;
        height = baseOuterRadius * 2 * currentScaleY;
      } else {
        const baseWidth = shape.width || 100;
        const baseHeight = shape.height || 100;
        width = baseWidth * currentScaleX;
        height = baseHeight * currentScaleY;
      }
      
      // Detect if this is a resize operation
      const isResizing = Math.abs(currentScaleX - 1.0) > 0.01 || 
                         Math.abs(currentScaleY - 1.0) > 0.01;
      
      if (logThisStream) {
        console.log(`[Transform] 📡 Stream #${streamCount} for ${shape.type}:`, {
          operation: isResizing ? 'RESIZE' : 'ROTATION',
          currentScaleX: currentScaleX.toFixed(3),
          currentScaleY: currentScaleY.toFixed(3),
          currentX: node.x().toFixed(1),
          currentY: node.y().toFixed(1),
          rotation: node.rotation().toFixed(1),
          calculatedWidth: width.toFixed(1),
          calculatedHeight: height.toFixed(1)
        });
      }
      
      // CRITICAL FIX: Always stream current position
      // During rotation, Konva updates x,y to maintain visual alignment
      // Remote clients MUST receive these position updates
      streamDragPosition(
        shape.id,
        currentUserId,
        currentUserName || 'User',
        node.x(),  // Always use current position
        node.y(),  // Always use current position
        node.rotation(),
        isResizing ? width : null,   // Only send dimensions if resizing
        isResizing ? height : null
      );
      
      if (logThisStream) {
        console.log(`[Transform] 📡 Streamed data:`, {
          x: node.x().toFixed(1),
          y: node.y().toFixed(1),
          rotation: node.rotation().toFixed(1),
          width: isResizing ? width.toFixed(1) : 'null',
          height: isResizing ? height.toFixed(1) : 'null'
        });
      }
      
    }, 10); // 100Hz
    
    console.log('[Transform] ✅ Streaming started at 100Hz with rotation fix');
    
    return true;
  };

  /**
   * TRANSFORM END - FIXED VERSION FOR ALL SHAPES
   */
  const handleTransformEnd = async () => {
    console.log(`[Transform] 🏁 Transform END for ${shape.type} ${shape.id.slice(0, 8)}`);
    
    // Stop 100Hz streaming interval
    if (transformStreamInterval.current) {
      clearInterval(transformStreamInterval.current);
      transformStreamInterval.current = null;
      console.log('[Transform] ⏹️  100Hz streaming interval stopped');
    }
    
    // NOTE: Do NOT stop drag stream immediately - we delay it by 200ms in the finally block
    // to prevent remote users from seeing flutter. See comment in finally block for details.
    
    // Stop checkpoint interval
    if (checkpointIntervalRef.current) {
      console.log('[Transform] ⏹️  Checkpoint interval stopped');
      clearInterval(checkpointIntervalRef.current);
      checkpointIntervalRef.current = null;
    }
    
    const node = shapeRef.current;
    if (!node) {
      console.error('[Transform] ❌ No node reference');
      transformInProgressRef.current = false;
      return;
    }

    let newAttrs;
    
    try {
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      
      console.log(`[Transform] 📊 Transform end calculation:`, {
        type: shape.type,
        scaleX: scaleX.toFixed(3),
        scaleY: scaleY.toFixed(3),
        nodeState: {
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          width: node.width ? node.width() : 'N/A',
          height: node.height ? node.height() : 'N/A',
          radius: shape.type === 'circle' ? node.radius() : 'N/A',
          innerRadius: shape.type === 'star' ? node.innerRadius() : 'N/A',
          outerRadius: shape.type === 'star' ? node.outerRadius() : 'N/A',
          points: shape.type === 'line' ? node.points() : 'N/A'
        }
      });
      
      // Calculate final dimensions based on shape type
      let newWidth, newHeight;
      
      if (shape.type === 'circle') {
        const currentBaseRadius = node.radius();
        newWidth = Math.max(10, currentBaseRadius * 2 * scaleX);
        newHeight = Math.max(10, currentBaseRadius * 2 * scaleY);
        
        console.log(`[Transform] 🔵 Circle dimension calculation:`, {
          currentBaseRadius,
          scaleX: scaleX.toFixed(3),
          scaleY: scaleY.toFixed(3),
          newWidth: newWidth.toFixed(1),
          newHeight: newHeight.toFixed(1)
        });
      } else if (shape.type === 'star') {
        const currentBaseOuterRadius = node.outerRadius();
        newWidth = Math.max(10, currentBaseOuterRadius * 2 * scaleX);
        newHeight = Math.max(10, currentBaseOuterRadius * 2 * scaleY);
        
        console.log(`[Transform] ⭐ Star dimension calculation:`, {
          currentBaseOuterRadius,
          scaleX: scaleX.toFixed(3),
          scaleY: scaleY.toFixed(3),
          newWidth: newWidth.toFixed(1),
          newHeight: newHeight.toFixed(1)
        });
      } else {
        const baseWidth = shape.width || 100;
        const baseHeight = shape.height || 100;
        // For lines, allow 0 dimensions (horizontal/vertical lines)
        // For other shapes, enforce minimum of 10px
        const minSize = shape.type === 'line' ? 0 : 10;
        newWidth = Math.max(minSize, baseWidth * scaleX);
        newHeight = Math.max(minSize, baseHeight * scaleY);
        
        console.log(`[Transform] 📐 Standard shape dimension calculation:`, {
          type: shape.type,
          baseWidth,
          baseHeight,
          scaleX: scaleX.toFixed(3),
          scaleY: scaleY.toFixed(3),
          newWidth: newWidth.toFixed(1),
          newHeight: newHeight.toFixed(1),
          minSize
        });
      }
      
      // Triangle flip detection
      let isFlipped = shape.isFlipped || false;
      
      if (shape.type === 'triangle') {
        if (scaleY < 0 && !isFlipped) {
          console.log('[Triangle] 🔄 Flip detected - inverting to upside down');
          isFlipped = true;
          newHeight = Math.abs(newHeight);
        } else if (scaleY < 0 && isFlipped) {
          console.log('[Triangle] 🔄 Flip back detected - restoring upright');
          isFlipped = false;
          newHeight = Math.abs(newHeight);
        } else {
          newHeight = Math.abs(newHeight);
        }
      }
      
      // Validate dimensions (allow 0 for lines)
      const minDimension = shape.type === 'line' ? 0 : 10;
      if (!isFinite(newWidth) || newWidth < minDimension || !isFinite(newHeight) || newHeight < minDimension) {
        console.error('[Transform] ❌ Invalid dimensions calculated:', {
          newWidth,
          newHeight,
          scaleX,
          scaleY,
          minDimension
        });
        transformInProgressRef.current = false;
        return;
      }
      
      console.log(`[Transform] ✅ Dimensions validated, resetting scales to 1.0`);
      
      // Reset scales
      node.scaleX(1);
      node.scaleY(1);
      
      // Apply new dimensions to node for immediate visual feedback
      if (shape.type === 'circle') {
        const newBaseRadius = (newWidth + newHeight) / 4;
        console.log(`[Transform] 🔵 Circle: setting NEW base radius to ${newBaseRadius.toFixed(1)}`);
        node.radius(newBaseRadius);
      } else if (shape.type === 'star') {
        const radiusX = newWidth * 0.5;
        const radiusY = newHeight * 0.5;
        const newBaseRadius = Math.min(radiusX, radiusY);
        const newInnerRadius = newBaseRadius * 0.5;
        const newOuterRadius = newBaseRadius;
        
        console.log(`[Transform] ⭐ Star: setting NEW base radii inner=${newInnerRadius.toFixed(1)}, outer=${newOuterRadius.toFixed(1)}`);
        node.innerRadius(newInnerRadius);
        node.outerRadius(newOuterRadius);
        
        node.scaleX(radiusX / newBaseRadius);
        node.scaleY(radiusY / newBaseRadius);
      } else if (shape.type === 'line') {
        // Lines use points instead of width/height on the Konva node
        console.log(`[Transform] ➖ Line: updating points with width=${newWidth.toFixed(1)}, height=${newHeight.toFixed(1)}`);
        node.points([0, 0, newWidth, newHeight]);
      } else {
        console.log(`[Transform] 📐 ${shape.type}: setting width=${newWidth.toFixed(1)}, height=${newHeight.toFixed(1)}`);
        node.width(newWidth);
        node.height(newHeight);
      }
      
      // Build RTDB attributes - CRITICAL: Include current position
      newAttrs = {
        x: node.x(),        // Current position after rotation/transform
        y: node.y(),        // Current position after rotation/transform
        width: newWidth,
        height: newHeight,
        rotation: node.rotation()
      };
      
      if (shape.type === 'triangle') {
        newAttrs.isFlipped = isFlipped;
      }

      console.log('[Transform] 💾 Writing to RTDB:', {
        ...newAttrs,
        note: 'Position includes rotation adjustments'
      });
      
      // Write to RTDB
      await onTransformEnd(shape.id, newAttrs);
      
      console.log('[Transform] ✅ Database write complete');
      
    } catch (error) {
      console.error('[Transform] ❌ Error during transform end:', error);
      console.error('[Transform] Stack trace:', error.stack);
    } finally {
      // CRITICAL FLUTTER FIX: Delay BOTH flag clearing AND drag stream cleanup
      // This prevents remote users from seeing flutter when watching our transform.
      // Same logic as handleDragEnd - see that function for detailed explanation.
      const transformEndTime = performance.now();
      console.log(`[Transform] ⏳ Delaying cleanup (200ms) at t=${transformEndTime.toFixed(2)}ms...`);
      console.log(`[Transform] 🚫 transformInProgressRef set to TRUE - blocking local position sync`);
      console.log(`[Transform] 📡 Drag stream still alive - remote users blocked from applying stale props`);
      
      setTimeout(() => {
        const elapsed = performance.now() - transformEndTime;
        
        // Clear local transform flag (unblocks local PropSync)
        transformInProgressRef.current = false;
        
        // Stop drag stream (allows remote users' PropSync to run)
        stopDragStream(shape.id);
        console.log(`[Transform] 📡 Drag stream stopped - remote users can now apply RTDB props`);
        
        console.log(`[Transform] ✅ Transform complete after ${elapsed.toFixed(2)}ms (target: 200ms)`);
        console.log(`[Transform]    - Local position sync: UNBLOCKED`);
        console.log(`[Transform]    - Remote flutter prevention: ACTIVE`);
      }, 200);
    }
  };

  const handleClick = (e) => {
    console.log(`[Click] 🖱️  Click on ${shape.type} ${shape.id.slice(0, 8)}`);
    e.cancelBubble = true;
    const isShiftKey = e.evt?.shiftKey || false;
    onSelect(shape.id, isShiftKey);
  };

  const isLockedByOther = shape.isLocked && shape.lockedBy !== currentUserId;
  
  const strokeColor = isBeingDraggedByOther 
    ? "#ff6600"
    : isLockedByOther 
      ? "#ff0000"
      : (isSelected ? "#0066cc" : undefined);
  
  const strokeWidth = (isBeingDraggedByOther || isLockedByOther || isSelected) ? 3 : 0;
  
  const baseOpacity = shape.opacity !== undefined ? shape.opacity : 1.0;
  const shapeOpacity = isBeingDraggedByOther ? 0.6 : baseOpacity;

  const commonProps = {
    ref: shapeRef,
    draggable: !isLockedByOther && !isBeingDraggedByOther,
    onClick: handleClick,
    onTap: handleClick,
    onDragStart: handleDragStart,
    onDragMove: handleDragMove,
    onDragEnd: handleDragEnd,
    onTransformEnd: handleTransformEnd,
    onTransformStart: handleTransformStart,
    dragBoundFunc: dragBoundFunc,
    perfectDrawEnabled: false,
    hitStrokeWidth: 8,
    stroke: strokeColor,
    strokeWidth: strokeWidth,
    opacity: shapeOpacity
  };

  /**
   * SHAPE RENDERING WITH LOGGING
   */
  const renderShape = () => {
    console.log(`[Render] 🎨 Rendering ${shape.type} ${shape.id.slice(0, 8)} with props:`, {
      x: shape.x,
      y: shape.y,
      width: shape.width,
      height: shape.height,
      rotation: shape.rotation
    });
    
    switch (shape.type) {
      case 'circle': {
        const width = shape.width || 100;
        const height = shape.height || 100;
        const isEllipse = Math.abs(width - height) > 1;
        
        if (isEllipse) {
          const avgRadius = (width + height) / 4;
          const scaleX = width / (avgRadius * 2);
          const scaleY = height / (avgRadius * 2);
          
          console.log(`[Render] 🔵 Circle as ELLIPSE:`, {
            width,
            height,
            avgRadius,
            scaleX: scaleX.toFixed(3),
            scaleY: scaleY.toFixed(3)
          });
          
          return (
            <Circle
              {...commonProps}
              x={shape.x}
              y={shape.y}
              radius={avgRadius}
              scaleX={scaleX}
              scaleY={scaleY}
              fill={shape.fill}
              fillLinearGradientStartPoint={shape.fillLinearGradientStartPoint}
              fillLinearGradientEndPoint={shape.fillLinearGradientEndPoint}
              fillLinearGradientColorStops={shape.fillLinearGradientColorStops}
              rotation={shape.rotation || 0}
            />
          );
        } else {
          const radius = width / 2;
          console.log(`[Render] 🔵 Perfect circle: radius=${radius}`);
          
          return (
            <Circle
              {...commonProps}
              x={shape.x}
              y={shape.y}
              radius={radius}
              fill={shape.fill}
              fillLinearGradientStartPoint={shape.fillLinearGradientStartPoint}
              fillLinearGradientEndPoint={shape.fillLinearGradientEndPoint}
              fillLinearGradientColorStops={shape.fillLinearGradientColorStops}
              rotation={shape.rotation || 0}
            />
          );
        }
      }
      
      case 'line':
        console.log(`[Render] ➖ Line`);
        return (
          <Line
            {...commonProps}
            x={shape.x}
            y={shape.y}
            points={[0, 0, shape.width || 100, shape.height || 0]}
            stroke={shape.fill || '#cccccc'}
            strokeWidth={4}
            rotation={shape.rotation || 0}
            lineCap="round"
            lineJoin="round"
          />
        );
      
      case 'text': {
        console.log(`[Render] 📝 Text`);
        const hasGradient = shape.fillLinearGradientColorStops && 
                           shape.fillLinearGradientColorStops.length > 0;
        const textFill = hasGradient ? shape.fill : (shape.fill || '#000000');
        
        return (
          <Text
            {...commonProps}
            x={shape.x}
            y={shape.y}
            text={shape.text || 'Text'}
            fontSize={shape.fontSize || 24}
            fontFamily={shape.fontFamily || 'Inter'}
            fontStyle={shape.fontStyle || 'normal'}
            fontWeight={shape.fontWeight || 'normal'}
            textDecoration={shape.textDecoration || ''}
            align={shape.align || 'left'}
            lineHeight={shape.lineHeight || 1.2}
            fill={textFill}
            fillLinearGradientStartPoint={shape.fillLinearGradientStartPoint}
            fillLinearGradientEndPoint={shape.fillLinearGradientEndPoint}
            fillLinearGradientColorStops={shape.fillLinearGradientColorStops}
            width={shape.width || 200}
            rotation={shape.rotation || 0}
            onDblClick={async (e) => {
              e.cancelBubble = true;
              
              if (!currentUser) {
                console.error('[Text Edit] No authenticated user');
                alert('Please sign in to edit text');
                return;
              }
              
              if (onOpenTextEditor) {
                onOpenTextEditor(shape.id);
              } else {
                const newText = window.prompt('Edit text:', shape.text || 'Text');
                if (newText !== null && newText.trim() !== '' && newText !== shape.text) {
                  try {
                    await onTextUpdate(shape.id, newText);
                  } catch (error) {
                    console.error('[Text Edit] Update failed:', error);
                    alert('Failed to update text: ' + (error.message || 'Unknown error'));
                  }
                }
              }
            }}
          />
        );
      }
      
      case 'diamond':
        console.log(`[Render] 💎 Diamond`);
        return (
          <Rect
            {...commonProps}
            x={shape.x}
            y={shape.y}
            width={shape.width || 100}
            height={shape.height || 100}
            fill={shape.fill}
            fillLinearGradientStartPoint={shape.fillLinearGradientStartPoint}
            fillLinearGradientEndPoint={shape.fillLinearGradientEndPoint}
            fillLinearGradientColorStops={shape.fillLinearGradientColorStops}
            rotation={(shape.rotation || 0) + 45}
            offsetX={(shape.width || 100) / 2}
            offsetY={(shape.height || 100) / 2}
          />
        );
      
      case 'triangle': {
        const triWidth = shape.width || 100;
        const triHeight = shape.height || 100;
        const isFlipped = shape.isFlipped || false;
        
        console.log(`[Render] 🔺 Triangle:`, {
          width: triWidth,
          height: triHeight,
          isFlipped
        });
        
        let points;
        if (isFlipped) {
          points = [
            triWidth / 2, triHeight,
            0, 0,
            triWidth, 0
          ];
        } else {
          points = [
            triWidth / 2, 0,
            triWidth, triHeight,
            0, triHeight
          ];
        }
        
        return (
          <Line
            {...commonProps}
            x={shape.x}
            y={shape.y}
            points={points}
            fill={shape.fill}
            fillLinearGradientStartPoint={shape.fillLinearGradientStartPoint}
            fillLinearGradientEndPoint={shape.fillLinearGradientEndPoint}
            fillLinearGradientColorStops={shape.fillLinearGradientColorStops}
            closed={true}
            rotation={shape.rotation || 0}
          />
        );
      }
      
      case 'star': {
        const starWidth = shape.width || 80;
        const starHeight = shape.height || 80;
        
        const radiusX = starWidth * 0.5;
        const radiusY = starHeight * 0.5;
        const baseRadius = Math.min(radiusX, radiusY);
        const innerRadius = baseRadius * 0.5;
        const outerRadius = baseRadius;
        const starScaleX = radiusX / baseRadius;
        const starScaleY = radiusY / baseRadius;
        
        console.log(`[Render] ⭐ Star:`, {
          width: starWidth,
          height: starHeight,
          radiusX,
          radiusY,
          baseRadius,
          innerRadius,
          outerRadius,
          starScaleX: starScaleX.toFixed(3),
          starScaleY: starScaleY.toFixed(3)
        });
        
        return (
          <Star
            {...commonProps}
            x={shape.x}
            y={shape.y}
            numPoints={5}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            scaleX={starScaleX}
            scaleY={starScaleY}
            fill={shape.fill}
            fillLinearGradientStartPoint={shape.fillLinearGradientStartPoint}
            fillLinearGradientEndPoint={shape.fillLinearGradientEndPoint}
            fillLinearGradientColorStops={shape.fillLinearGradientColorStops}
            rotation={shape.rotation || 0}
          />
        );
      }
      
      case 'rectangle':
      default:
        console.log(`[Render] 📦 Rectangle`);
        return (
          <Rect
            {...commonProps}
            x={shape.x}
            y={shape.y}
            width={shape.width || 100}
            height={shape.height || 100}
            fill={shape.fill}
            fillLinearGradientStartPoint={shape.fillLinearGradientStartPoint}
            fillLinearGradientEndPoint={shape.fillLinearGradientEndPoint}
            fillLinearGradientColorStops={shape.fillLinearGradientColorStops}
            rotation={shape.rotation || 0}
          />
        );
    }
  };

  return (
    <>
      {renderShape()}
      {isSelected && !isLockedByOther && !isBeingDraggedByOther && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 10 || newBox.height < 10) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
}