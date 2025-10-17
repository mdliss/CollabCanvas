import { Rect, Circle, Line, Text, Group, Transformer, Star } from "react-konva";
import { useEffect, useRef } from "react";
import { streamDragPosition, stopDragStream } from "../../services/dragStream";
import { updateShape } from "../../services/canvasRTDB";

const CANVAS_ID = "global-canvas-v1";

/**
 * ShapeRenderer - FIXED VERSION - No more compound scaling for circles AND stars!
 * 
 * CRITICAL FIX APPLIED (2025-10-17):
 * Both circle and star transformations now use node's current dimensions
 * instead of stored dimensions to prevent compound scaling.
 * 
 * The bug: We stored visual dimensions in RTDB, applied scale on top in rendering,
 * then used those ALREADY-SCALED dimensions as the base for the NEXT transform,
 * causing exponential growth.
 * 
 * The fix: 
 * - Circles: Use node.radius() (current base radius)
 * - Stars: Use node.innerRadius() and node.outerRadius() (current base radii)
 * - Calculate actual dimensions from these base values × scale
 */
export default function ShapeRenderer({ 
  shape, 
  isSelected,
  currentUserId,
  currentUserName,
  currentUser,
  onSelect, 
  onRequestLock,
  onDragStart,
  onDragEnd,
  onTransformStart,
  onTransformEnd,
  onTextUpdate,
  onOpenTextEditor,
  isBeingDraggedByOther = false
}) {
  const shapeRef = useRef(null);
  const transformerRef = useRef(null);
  const dragStreamInterval = useRef(null);
  const transformStreamInterval = useRef(null);
  const isDraggingRef = useRef(false);
  const dragEndTimeoutRef = useRef(null);
  const checkpointIntervalRef = useRef(null);
  const initialTransformPosRef = useRef({ x: 0, y: 0 });
  const transformInProgressRef = useRef(false);

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
   * PROP SYNCHRONIZATION WITH EXTENSIVE LOGGING
   */
  useEffect(() => {
    const node = shapeRef.current;
    if (!node) {
      console.log(`[PropSync] ⚠️  No node ref for ${shape.id.slice(0, 8)}`);
      return;
    }
    
    console.log(`[PropSync] 🔍 Checking sync conditions for ${shape.type} ${shape.id.slice(0, 8)}`, {
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
    
    // BLOCK 1: Transform in progress
    if (transformInProgressRef.current) {
      console.log(`[PropSync] ⛔ BLOCKED - Transform in progress for ${shape.id.slice(0, 8)}`);
      return;
    }
    
    // BLOCK 2: Being dragged by remote user
    if (isBeingDraggedByOther) {
      console.log(`[PropSync] ⛔ BLOCKED - Being dragged by other user for ${shape.id.slice(0, 8)}`);
      return;
    }
    
    // BLOCK 3: Local drag
    if (isDraggingRef.current) {
      console.log(`[PropSync] ⛔ BLOCKED - Local drag in progress for ${shape.id.slice(0, 8)}`);
      return;
    }
    
    console.log(`[PropSync] ✅ SYNCING props to node for ${shape.type} ${shape.id.slice(0, 8)}`);
    
    // Apply position
    node.x(shape.x);
    node.y(shape.y);
    node.rotation(shape.rotation || 0);
    console.log(`[PropSync] 📍 Position set: x=${shape.x}, y=${shape.y}, rotation=${shape.rotation || 0}`);
    
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
      
      // CRITICAL FIX: Calculate base radii from dimensions
      const radiusX = width * 0.5;
      const radiusY = height * 0.5;
      const baseRadius = Math.min(radiusX, radiusY);
      
      console.log(`[PropSync] ⭐ Star dimension sync:`, {
        width,
        height,
        baseRadius,
        note: 'Setting base radius, scale will be applied in render'
      });
      
      // Set the base radii on the node
      node.innerRadius(baseRadius * 0.5);
      node.outerRadius(baseRadius);
      
      // Calculate and apply scale
      const starScaleX = radiusX / baseRadius;
      const starScaleY = radiusY / baseRadius;
      node.scaleX(starScaleX);
      node.scaleY(starScaleY);
    } else if (shape.type !== 'line') {
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
      outerRadius: shape.type === 'star' ? node.outerRadius() : 'N/A'
    });
    
    // Request re-render
    node.getLayer()?.batchDraw();
    
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

  // Cleanup
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

  const handleDragEnd = (e) => {
    console.log(`[Drag] 🏁 Drag END for ${shape.type} ${shape.id.slice(0, 8)}`);
    
    // Stop streaming
    if (dragStreamInterval.current) {
      clearInterval(dragStreamInterval.current);
      dragStreamInterval.current = null;
    }
    stopDragStream(shape.id);
    
    // Stop checkpoint interval
    if (checkpointIntervalRef.current) {
      clearInterval(checkpointIntervalRef.current);
      checkpointIntervalRef.current = null;
    }
    
    const node = e.target;
    const finalPos = {
      x: node.x(),
      y: node.y()
    };
    
    console.log(`[Drag] 📍 Final position:`, finalPos);
    
    // Write final position to RTDB
    onDragEnd(shape.id, finalPos);
    
    // Delay flag reset
    dragEndTimeoutRef.current = setTimeout(() => {
      isDraggingRef.current = false;
      dragEndTimeoutRef.current = null;
      console.log(`[Drag] ✅ Drag flag cleared`);
    }, 100);
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
    
    // Store initial position
    const node = shapeRef.current;
    if (node) {
      initialTransformPosRef.current = {
        x: node.x(),
        y: node.y()
      };
      console.log('[Transform] 📍 Initial position stored:', initialTransformPosRef.current);
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
        outerRadius: shape.type === 'star' ? node.outerRadius() : 'N/A'
      });
    }
    
    // Notify parent
    if (onTransformStart) {
      onTransformStart(shape.id);
    }
    
    /**
     * DIMENSION STREAMING WITH DETAILED LOGGING
     */
    let streamCount = 0;
    transformStreamInterval.current = setInterval(() => {
      const node = shapeRef.current;
      if (!node || !currentUserId) return;
      
      streamCount++;
      const logThisStream = streamCount % 10 === 0; // Log every 10th stream
      
      // CRITICAL FIX: Calculate dimensions from node's current state
      let width, height;
      const currentScaleX = node.scaleX();
      const currentScaleY = node.scaleY();
      
      if (shape.type === 'circle') {
        // Use node's current base radius
        const baseRadius = node.radius();
        width = baseRadius * 2 * currentScaleX;
        height = baseRadius * 2 * currentScaleY;
      } else if (shape.type === 'star') {
        // STAR FIX: Use node's current base outer radius
        const baseOuterRadius = node.outerRadius();
        width = baseOuterRadius * 2 * currentScaleX;
        height = baseOuterRadius * 2 * currentScaleY;
      } else {
        // All other shapes use stored dimensions
        const baseWidth = shape.width || 100;
        const baseHeight = shape.height || 100;
        width = baseWidth * currentScaleX;
        height = baseHeight * currentScaleY;
      }
      
      // Detect resize vs rotation
      const isResizing = Math.abs(currentScaleX - 1.0) > 0.01 || 
                         Math.abs(currentScaleY - 1.0) > 0.01;
      
      if (logThisStream) {
        console.log(`[Transform] 📡 Stream #${streamCount} for ${shape.type}:`, {
          isResizing,
          currentScaleX: currentScaleX.toFixed(3),
          currentScaleY: currentScaleY.toFixed(3),
          calculatedWidth: width.toFixed(1),
          calculatedHeight: height.toFixed(1),
          currentPos: { x: node.x().toFixed(1), y: node.y().toFixed(1) },
          storedInitialPos: initialTransformPosRef.current,
          rotation: node.rotation().toFixed(1)
        });
      }
      
      if (isResizing) {
        // RESIZE: Stream everything
        streamDragPosition(
          shape.id,
          currentUserId,
          currentUserName || 'User',
          node.x(),
          node.y(),
          node.rotation(),
          width,
          height
        );
        
        if (logThisStream) {
          console.log(`[Transform] 📡 Streaming RESIZE data:`, {
            x: node.x().toFixed(1),
            y: node.y().toFixed(1),
            width: width.toFixed(1),
            height: height.toFixed(1),
            rotation: node.rotation().toFixed(1)
          });
        }
      } else {
        // ROTATION: Use stored position
        streamDragPosition(
          shape.id,
          currentUserId,
          currentUserName || 'User',
          initialTransformPosRef.current.x,
          initialTransformPosRef.current.y,
          node.rotation(),
          null,
          null
        );
        
        if (logThisStream) {
          console.log(`[Transform] 📡 Streaming ROTATION-ONLY data:`, {
            storedX: initialTransformPosRef.current.x.toFixed(1),
            storedY: initialTransformPosRef.current.y.toFixed(1),
            rotation: node.rotation().toFixed(1),
            note: 'Using stored position to prevent flicker'
          });
        }
      }
      
    }, 10); // 100Hz
    
    console.log('[Transform] ✅ Streaming started at 100Hz');
    
    return true;
  };

  /**
   * TRANSFORM END - FIXED VERSION FOR BOTH CIRCLES AND STARS
   * 
   * CRITICAL FIX: Both circles and stars now use node's current dimensions
   * instead of stored dimensions to prevent compound scaling.
   */
  const handleTransformEnd = async () => {
    console.log(`[Transform] 🏁 Transform END for ${shape.type} ${shape.id.slice(0, 8)}`);
    
    // Stop streaming
    if (transformStreamInterval.current) {
      clearInterval(transformStreamInterval.current);
      transformStreamInterval.current = null;
      console.log('[Transform] ⏹️  Streaming stopped');
    }
    await stopDragStream(shape.id);
    
    // Stop checkpoint
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
          outerRadius: shape.type === 'star' ? node.outerRadius() : 'N/A'
        }
      });
      
      // ========== CRITICAL FIX: Shape-specific dimension calculation ==========
      let newWidth, newHeight;
      
      if (shape.type === 'circle') {
        // CIRCLE FIX: Use the node's CURRENT base radius
        const currentBaseRadius = node.radius();
        newWidth = Math.max(10, currentBaseRadius * 2 * scaleX);
        newHeight = Math.max(10, currentBaseRadius * 2 * scaleY);
        
        console.log(`[Transform] 🔵 Circle dimension calculation:`, {
          currentBaseRadius,
          scaleX: scaleX.toFixed(3),
          scaleY: scaleY.toFixed(3),
          newWidth: newWidth.toFixed(1),
          newHeight: newHeight.toFixed(1),
          calculation: 'radius × 2 × scale'
        });
      } else if (shape.type === 'star') {
        // STAR FIX: Use the node's CURRENT base outer radius
        const currentBaseOuterRadius = node.outerRadius();
        newWidth = Math.max(10, currentBaseOuterRadius * 2 * scaleX);
        newHeight = Math.max(10, currentBaseOuterRadius * 2 * scaleY);
        
        console.log(`[Transform] ⭐ Star dimension calculation:`, {
          currentBaseOuterRadius,
          scaleX: scaleX.toFixed(3),
          scaleY: scaleY.toFixed(3),
          newWidth: newWidth.toFixed(1),
          newHeight: newHeight.toFixed(1),
          calculation: 'outerRadius × 2 × scale'
        });
      } else {
        // ALL OTHER SHAPES: Use stored dimensions
        const baseWidth = shape.width || 100;
        const baseHeight = shape.height || 100;
        newWidth = Math.max(10, baseWidth * scaleX);
        newHeight = Math.max(10, baseHeight * scaleY);
        
        console.log(`[Transform] 📐 Standard shape dimension calculation:`, {
          type: shape.type,
          baseWidth,
          baseHeight,
          scaleX: scaleX.toFixed(3),
          scaleY: scaleY.toFixed(3),
          newWidth: newWidth.toFixed(1),
          newHeight: newHeight.toFixed(1)
        });
      }
      
      console.log(`[Transform] 🧮 Final calculated dimensions:`, {
        newWidth: newWidth.toFixed(1),
        newHeight: newHeight.toFixed(1),
        aspectRatio: (newWidth / newHeight).toFixed(2)
      });
      
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
      
      // Validate
      if (!isFinite(newWidth) || newWidth <= 0 || !isFinite(newHeight) || newHeight <= 0) {
        console.error('[Transform] ❌ Invalid dimensions calculated:', {
          newWidth,
          newHeight,
          scaleX,
          scaleY
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
        // For circles, calculate new base radius
        const newBaseRadius = (newWidth + newHeight) / 4;
        console.log(`[Transform] 🔵 Circle: setting NEW base radius to ${newBaseRadius.toFixed(1)}`);
        node.radius(newBaseRadius);
      } else if (shape.type === 'star') {
        // For stars, calculate new base radii from the new dimensions
        const radiusX = newWidth * 0.5;
        const radiusY = newHeight * 0.5;
        const newBaseRadius = Math.min(radiusX, radiusY);
        const newInnerRadius = newBaseRadius * 0.5;
        const newOuterRadius = newBaseRadius;
        
        console.log(`[Transform] ⭐ Star: setting NEW base radii inner=${newInnerRadius.toFixed(1)}, outer=${newOuterRadius.toFixed(1)}`);
        node.innerRadius(newInnerRadius);
        node.outerRadius(newOuterRadius);
        
        // Apply scale to achieve elliptical star
        node.scaleX(radiusX / newBaseRadius);
        node.scaleY(radiusY / newBaseRadius);
      } else if (shape.type !== 'line') {
        console.log(`[Transform] 📐 ${shape.type}: setting width=${newWidth.toFixed(1)}, height=${newHeight.toFixed(1)}`);
        node.width(newWidth);
        node.height(newHeight);
      }
      
      // Build RTDB attributes
      newAttrs = {
        x: node.x(),
        y: node.y(),
        width: newWidth,
        height: newHeight,
        rotation: node.rotation()
      };
      
      if (shape.type === 'triangle') {
        newAttrs.isFlipped = isFlipped;
      }

      console.log('[Transform] 💾 Writing to RTDB:', newAttrs);
      
      // Write to RTDB
      await onTransformEnd(shape.id, newAttrs);
      
      console.log('[Transform] ✅ Database write complete');
      
    } catch (error) {
      console.error('[Transform] ❌ Error during transform end:', error);
      console.error('[Transform] Stack trace:', error.stack);
    } finally {
      // Delay clearing transform flag
      console.log('[Transform] ⏳ Delaying transform flag clear (150ms)...');
      setTimeout(() => {
        transformInProgressRef.current = false;
        console.log('[Transform] ✅ Transform flag cleared - prop sync re-enabled');
      }, 150);
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
          console.log(`[Render] 🔵 Circle as PERFECT CIRCLE: radius=${radius}`);
          
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