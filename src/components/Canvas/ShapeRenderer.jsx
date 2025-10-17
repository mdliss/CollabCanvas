import { Rect, Circle, Line, Text, Group, Transformer, Star } from "react-konva";
import { useEffect, useRef } from "react";
import { streamDragPosition, stopDragStream } from "../../services/dragStream";
import { updateShape } from "../../services/canvasRTDB";

const CANVAS_ID = "global-canvas-v1";

/**
 * ShapeRenderer - ROTATION FIX VERSION
 * 
 * CRITICAL FIX APPLIED (2025-10-17):
 * Fixed rotation synchronization for rectangles and triangles.
 * 
 * The bug: During rotation, rectangles/triangles rotate around their top-left
 * corner (x,y), but Konva updates the position to maintain visual continuity.
 * Remote clients only received the original position, causing visual displacement.
 * 
 * The fix: Always stream the node's CURRENT position during transforms,
 * regardless of whether it's a rotation or resize. The position changes during
 * rotation are intentional and must be synchronized.
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
    
    // Apply position and rotation
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